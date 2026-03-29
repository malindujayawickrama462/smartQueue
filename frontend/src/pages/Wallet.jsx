import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { getWalletInfo, topUpWallet } from '../api/walletApi';

export default function Wallet() {
    const nav = useNavigate();
    const [walletInfo, setWalletInfo] = useState({ walletBalance: 0, loyaltyPoints: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            const data = await getWalletInfo();
            setWalletInfo(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount");

        setProcessing(true);
        try {
            await topUpWallet(amount);
            setTopUpAmount('');
            fetchInfo();
            alert(`LKR ${amount} successfully added to wallet! (Mock Payment)`);
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Wallet...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">My Wallet</h1>
                        <p className="text-sm text-slate-400 uppercase font-bold tracking-widest mt-1">Manage Funds & Rewards</p>
                    </div>
                    <button
                        onClick={() => nav('/home')}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                    >
                        Back
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Balance Card */}
                    <div className="rounded-3xl p-8 bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden shadow-xl shadow-emerald-500/20">
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-1">Available Balance</p>
                        <h2 className="text-5xl font-black text-white mb-6 tracking-tighter">
                            <span className="text-2xl mr-1 text-emerald-200">LKR</span>
                            {walletInfo.walletBalance.toFixed(2)}
                        </h2>

                        <div className="bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm">
                            <div>
                                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Loyalty Points</p>
                                <p className="text-lg font-black text-amber-400 flex items-center gap-1">⭐ {walletInfo.loyaltyPoints}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Redemption Value</p>
                                <p className="text-lg font-black text-emerald-100">LKR {walletInfo.loyaltyPoints}.00</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Up Card */}
                    <Card title="Quick Top-Up" subtitle="Add funds to your wallet instantly">
                        <form onSubmit={handleTopUp} className="space-y-4 pt-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Amount (LKR)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="100"
                                        step="1"
                                        required
                                        value={topUpAmount}
                                        onChange={e => setTopUpAmount(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 font-bold focus:border-emerald-500 focus:outline-none placeholder:text-slate-600 outline-none"
                                        placeholder="e.g. 1000"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-6 rounded-xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {processing ? '...' : '+ Add'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {[500, 1000, 2000, 5000].map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setTopUpAmount(amt.toString())}
                                        className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                                    >
                                        +{amt}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 text-center mt-4">
                                Top-ups are processed instantly. This is a mock gateway for the demo.
                            </p>
                        </form>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest">Recent Transactions</h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {walletInfo.transactions.map(tx => (
                            <div key={tx._id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {tx.type === 'CREDIT' ? '↓' : '↑'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-200">{tx.description}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mt-0.5">
                                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-lg ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'} LKR {tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {walletInfo.transactions.length === 0 && (
                            <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-slate-500 font-medium">No transactions yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
