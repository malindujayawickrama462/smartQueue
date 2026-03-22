import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { getUserInvoices } from '../api/invoiceApi';

export default function UserInvoices() {
    const nav = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await getUserInvoices();
                setInvoices(data.invoices);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Invoices...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">My Invoices</h1>
                        <p className="text-sm text-slate-400 uppercase font-bold tracking-widest mt-1">Order History & Receipts</p>
                    </div>
                    <button
                        onClick={() => nav('/profile')}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                    >
                        Back to Profile
                    </button>
                </div>

                {error && <p className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}

                <div className="grid grid-cols-1 gap-4">
                    {invoices.map(inv => (
                        <div key={inv._id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition group">
                            <div>
                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-emerald-400 transition">{inv.invoiceID}</h3>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{inv.canteen?.name} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between">
                                <div className="text-right">
                                    <p className="font-black text-slate-100">LKR {inv.totalAmount.toFixed(2)}</p>
                                    <p className="text-xs font-medium text-slate-500">{inv.items.length} Items</p>
                                </div>
                                <button
                                    onClick={() => nav(`/invoice/${inv._id}`)}
                                    className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-slate-950 transition font-bold text-sm h-fit"
                                >
                                    View PDF
                                </button>
                            </div>
                        </div>
                    ))}

                    {invoices.length === 0 && (
                        <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-lg font-medium">No invoices found.</p>
                            <p className="text-sm">You haven't placed any orders yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
