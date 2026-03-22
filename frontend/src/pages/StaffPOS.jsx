import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPOSOrder } from '../api/staffApi';
import { getAllFoodItems } from '../api/foodApi';
import { generateInvoice } from '../api/invoiceApi';

export default function StaffPOS() {
    const nav = useNavigate();
    const [canteenId, setCanteenId] = useState(null);
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [invoiceId, setInvoiceId] = useState(null);

    useEffect(() => {
        const fetchStaffData = async () => {
            try {
                const res = await fetch("/api/canteen/staff/my-canteen", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                });
                if (!res.ok) throw new Error("Could not find assigned canteen");
                const data = await res.json();
                setCanteenId(data._id);

                const menuData = await getAllFoodItems(data._id);
                setMenu(menuData.items);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchStaffData();
    }, []);

    const addToCart = (item) => {
        if (!item.availability) return;
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i._id !== itemId));
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCreateInvoice = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const orderData = {
                items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice
            };

            // Instantly completes the Walk-in Order and generates an ID
            const returnData = await createPOSOrder(canteenId, orderData);

            // Generate Invoice silently in background and hold reference
            try {
                const invData = await generateInvoice(returnData.order._id);
                setInvoiceId(invData.invoice._id);
            } catch (invErr) {
                console.error("Invoice generation failed:", invErr);
            }

            setOrderSuccess(returnData.order);
            setCart([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-4">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-100">Walk-In Order Completed</h2>
                <p className="text-slate-400 font-medium">Payment Received and Recorded.</p>
                <div className="flex gap-4 pt-6">
                    {invoiceId && (
                        <button
                            onClick={() => nav(`/invoice/${invoiceId}`)}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition"
                        >
                            Open Print Invoice
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setOrderSuccess(null);
                            setInvoiceId(null);
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
                    >
                        New Walk-in Order
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col xl:flex-row gap-8 animate-in fade-in duration-500">
            <div className="flex-[2] space-y-6 flex flex-col min-h-0">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-100">Point of Sale</h1>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Manual Walk-in Order Entry</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 pb-8">
                    {menu.map(item => (
                        <div
                            key={item._id}
                            onClick={() => addToCart(item)}
                            className={`p-4 rounded-2xl bg-slate-900 border cursor-pointer transition select-none group ${item.availability ? 'border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800' : 'border-slate-800/50 opacity-50 cursor-not-allowed'}`}
                        >
                            <p className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.name}</p>
                            <p className="text-lg font-black text-slate-400 mt-2">LKR {item.price.toFixed(2)}</p>
                        </div>
                    ))}
                    {menu.length === 0 && !error && (
                        <div className="col-span-full p-8 text-center text-slate-500 font-medium border-2 border-dashed border-slate-800 rounded-3xl">
                            No menu items found.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full xl:w-96 shrink-0 flex flex-col h-full">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-full shadow-xl shadow-slate-950">
                    <h2 className="text-lg font-black text-slate-200 mb-4 border-b border-slate-800 pb-4">Current Cart</h2>

                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                        {cart.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 font-medium">Cart is Empty</div>
                        ) : (
                            cart.map(item => (
                                <div key={item._id} className="flex justify-between items-center text-sm bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                    <div className="flex-1 overflow-hidden pr-2">
                                        <p className="font-bold text-slate-200 truncate">{item.name}</p>
                                        <p className="text-xs text-slate-500 font-bold">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <p className="font-black text-slate-300">LKR {item.price * item.quantity}</p>
                                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }} className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold hover:bg-red-500 hover:text-white transition">×</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-800 pt-6 mt-4 space-y-4 shrink-0">
                        {error && <div className="p-3 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl text-center">{error}</div>}

                        <div className="flex justify-between items-end">
                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Total Amount</p>
                            <p className="text-3xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">LKR {totalPrice.toFixed(2)}</p>
                        </div>

                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 mb-4 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Payment Method Tracker</p>
                            <p className="text-sm font-bold text-slate-300">💵 Cash Given at Counter</p>
                        </div>

                        <button
                            onClick={handleCreateInvoice}
                            disabled={loading || cart.length === 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Complete & Generate Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
