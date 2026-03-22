import React, { useState, useEffect } from 'react';
import { getCanteenAnalytics } from '../api/staffApi';

export default function StaffAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // First get canteen ID
                const res = await fetch("/api/canteen/staff/my-canteen", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                });
                if (!res.ok) throw new Error("Could not find assigned canteen");
                const canteenData = await res.json();

                const data = await getCanteenAnalytics(canteenData._id);
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Loading Analytics...</div>;

    if (error) return (
        <div className="p-8">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">{error}</div>
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-100">Performance Analytics</h1>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">All-Time Statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-center items-center gap-2 group hover:border-emerald-500/50 transition duration-300">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition">Total Gross Revenue</p>
                    <p className="text-5xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">LKR {stats.revenue.toFixed(2)}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-center items-center gap-2 group hover:border-sky-500/50 transition duration-300">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest group-hover:text-sky-400 transition">Delivered Orders</p>
                    <p className="text-5xl font-black text-sky-400 tracking-tighter drop-shadow-[0_0_15px_rgba(14,165,233,0.2)]">{stats.orders}</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-800 bg-slate-800/20">
                    <h2 className="text-lg text-slate-200 font-bold flex items-center gap-2">🏆 Top Selling Items</h2>
                </div>
                <div className="divide-y divide-slate-800">
                    {stats.topItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 font-medium tracking-wide">
                            No sales data available yet.
                        </div>
                    ) : (
                        stats.topItems.map((item, idx) => (
                            <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 font-black flex items-center justify-center border border-indigo-500/20">
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-200">{item.name}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.sold} Units Sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-emerald-400">LKR {item.rev.toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
