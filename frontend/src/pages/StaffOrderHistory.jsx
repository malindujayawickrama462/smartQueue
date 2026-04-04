import React, { useState, useEffect } from 'react';
import { getCanteenHistory } from '../api/staffApi';
import { downloadInvoice } from '../api/invoiceApi';

export default function StaffOrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // First get canteen ID
                const res = await fetch("/api/canteen/staff/my-canteen", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                });
                if (!res.ok) throw new Error("Could not find assigned canteen");
                const canteenData = await res.json();

                const data = await getCanteenHistory(canteenData._id);
                setOrders(data.orders);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownloadInvoice = async (orderId, orderID) => {
        setDownloadingId(orderId);
        try {
            // Fetch or generate invoice for this order
            const res = await fetch(`/api/invoice/by-order/${orderId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
            });
            if (!res.ok) throw new Error("Could not fetch or generate invoice");
            const invoiceData = await res.json();
            
            if (!invoiceData.invoice) {
                throw new Error("Invoice not found or could not be generated");
            }
            
            await downloadInvoice(invoiceData.invoice._id, invoiceData.invoice.invoiceID);
        } catch (err) {
            alert(err.message || 'Failed to download invoice');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Loading History...</div>;

    if (error) return (
        <div className="p-8">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">{error}</div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-100">Order History</h1>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Audit log of processing</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-950">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-800/40 text-xs uppercase font-bold text-slate-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-right">Payment</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No historical orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-800/20 transition group">
                                        <td className="px-6 py-4 font-black text-slate-300 tracking-tight group-hover:text-emerald-400 transition">{order.orderID}</td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <p className="font-bold text-slate-300">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                            <p className="text-xs">{new Date(order.updatedAt).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-300">{order.student?.name}</p>
                                            <p className="text-xs text-slate-500">{order.student?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-800 font-bold text-slate-300 text-xs">
                                                {order.items.length} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-black text-slate-200">LKR {order.totalPrice.toFixed(2)}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${order.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {order.paymentMethod} - {order.paymentStatus}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDownloadInvoice(order._id, order.orderID)}
                                                disabled={downloadingId === order._id}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500 hover:text-white transition text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                title="Download invoice for this order"
                                            >
                                                {downloadingId === order._id ? '⏳' : '📥'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
