import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { getCanteenOrders, updateOrderStatus } from '../api/orderApi';
import { generateInvoice } from '../api/invoiceApi';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function KitchenDashboard() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [canteen, setCanteen] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStaffCanteen = async () => {
            try {
                const res = await fetch("/api/canteen/staff/my-canteen", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                });
                if (!res.ok) throw new Error("Could not find assigned canteen");
                const data = await res.json();
                setCanteen(data);
                loadOrders(data._id);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchStaffCanteen();
    }, []);

    const loadOrders = async (cid) => {
        try {
            const data = await getCanteenOrders(cid);
            setOrders(data.orders);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus({ orderID: orderId, status: newStatus });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleReceiveCash = async (order) => {
        try {
            await updateOrderStatus({ orderID: order._id, status: order.status, paymentStatus: 'Paid' });
            // Generate Invoice natively for staff
            await generateInvoice(order._id);
            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, paymentStatus: 'Paid' } : o));
            alert("Payment Received and Invoice Generated!");
        } catch (err) {
            alert("Error processing payment: " + err.message);
        }
    };

    // Separate orders into Requests vs Active
    const pendingRequests = orders.filter(o => o.status === 'Pending');
    const activeOrders = orders.filter(o => o.status !== 'Pending');

    // Group active orders by time slot
    const groupedOrders = activeOrders.reduce((acc, order) => {
        const slotKey = order.timeSlot?.startTime ? `${order.timeSlot.startTime} - ${order.timeSlot.endTime}` : "Unassigned";
        if (!acc[slotKey]) acc[slotKey] = [];
        acc[slotKey].push(order);
        return acc;
    }, {});

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{canteen?.name} Kitchen</h1>
                        <p className="text-sm text-slate-400 uppercase font-bold tracking-widest mt-1">Batch Preparation Dashboard</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => nav('/kitchen/menu')}
                                className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold uppercase hover:bg-sky-500 hover:text-slate-950 transition-all shadow-md shadow-sky-500/10"
                            >
                                Manage Menu
                            </button>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-bold uppercase">Current Status</p>
                                <p className="text-emerald-400 font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Accepting Orders
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}

                {pendingRequests.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                            <h2 className="text-xl font-black text-amber-400 tracking-tight">Incoming Order Requests ({pendingRequests.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingRequests.map(order => (
                                <Card key={order._id} title={order.orderID} subtitle="Awaiting Acceptance">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between">
                                                <span>Items</span>
                                                <span className={order.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>
                                                    {order.paymentMethod} - {order.paymentStatus}
                                                </span>
                                            </p>
                                            <div className="space-y-1">
                                                {order.items.map((item, idx) => (
                                                    <p key={idx} className="text-sm font-medium text-slate-300">
                                                        <span className="text-emerald-400 font-bold mr-2">{item.quantity}x</span> {item.name}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-800 flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'Verified')}
                                                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black uppercase text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                                            >
                                                Verify Order
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'Rejected')}
                                                className="px-4 py-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-xs hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-10 mt-8">
                    {Object.keys(groupedOrders).length === 0 ? (
                        <div className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                            <p className="text-xl font-medium">No orders scheduled for today yet.</p>
                        </div>
                    ) : (
                        Object.entries(groupedOrders).map(([slot, slotOrders]) => (
                            <div key={slot} className="space-y-4">
                                <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                                    <div className="px-4 py-2 rounded-xl bg-sky-500/10 text-sky-400 font-black text-lg border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                                        {slot}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">Active Time Slot</p>
                                        <p className="text-xs text-slate-500">{slotOrders.length} Parallel Orders</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {slotOrders.map(order => (
                                        <Card
                                            key={order._id}
                                            title={order.orderID}
                                            subtitle={
                                                <span className={`${order.status === 'Late' ? 'text-red-400 font-black' : ''}`}>
                                                    {order.status}
                                                </span>
                                            }
                                        >
                                            <div className="space-y-4">
                                                {order.status === 'Late' && (
                                                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-bold uppercase text-center">
                                                        ⚠️ Low Priority - Late Arrival
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between">
                                                        <span>Items</span>
                                                        <span className={order.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>
                                                            {order.paymentMethod} - {order.paymentStatus}
                                                        </span>
                                                    </p>
                                                    <div className="space-y-1">
                                                        {order.items.map((item, idx) => (
                                                            <p key={idx} className="text-sm font-medium text-slate-300">
                                                                <span className="text-emerald-400 font-bold mr-2">{item.quantity}x</span> {item.name}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>

                                                {order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending' && (
                                                    <div className="pt-2 border-t border-slate-800">
                                                        <button
                                                            onClick={() => handleReceiveCash(order)}
                                                            className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                            Receive Cash & Generate Invoice
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex gap-2 pt-2 border-t border-slate-800">
                                                    {['Verified', 'Late'].includes(order.status) && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                                                            className="flex-1 py-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold uppercase hover:bg-sky-500 hover:text-slate-950 transition-all"
                                                        >
                                                            {order.status === 'Late' ? 'Start Late Order' : 'Start Cooking'}
                                                        </button>
                                                    )}
                                                    {order.status === 'Preparing' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'Ready')}
                                                            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold uppercase hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                                                        >
                                                            Mark Ready
                                                        </button>
                                                    )}
                                                    {order.status === 'Ready' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'Completed')}
                                                            className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 transition-all"
                                                        >
                                                            Deliver
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
