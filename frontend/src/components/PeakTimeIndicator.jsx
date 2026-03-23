import React, { useEffect, useState } from 'react';
import { getPeakTimeData } from '../api/peakTimeApi';

export default function PeakTimeIndicator({ canteenId }) {
    const [peakData, setPeakData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (canteenId) {
            getPeakTimeData(canteenId).then(setPeakData).catch(() => {}).finally(() => setLoading(false));
        }
    }, [canteenId]);

    if (loading) return <div className="animate-pulse bg-slate-900/50 p-4 rounded-xl border border-slate-800/50"><div className="h-4 bg-slate-800 rounded w-1/3 mb-2"></div></div>;
    if (!peakData) return null;

    const { currentStatus, suggestedHour } = peakData;
    let statusColor = "text-emerald-400";
    let statusBg = "bg-emerald-500/10";
    let icon = "🟢";

    if (currentStatus === "High") { statusColor = "text-red-400"; statusBg = "bg-red-500/10"; icon = "🔴"; } 
    else if (currentStatus === "Medium") { statusColor = "text-amber-400"; statusBg = "bg-amber-500/10"; icon = "🟡"; }

    return (
        <div className={`p-4 rounded-2xl flex items-center justify-between border border-slate-800/50 shadow-lg ${statusBg} backdrop-blur-sm transition-all hover:scale-[1.01] duration-300`}>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Live Traffic Status</p>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <p className={`text-lg font-black ${statusColor}`}>{currentStatus} Traffic</p>
                </div>
            </div>
            {currentStatus !== "Low" && suggestedHour && (
                <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest hidden sm:block">Suggested Time</p>
                    <p className="font-bold text-slate-200 text-sm mt-0.5">{suggestedHour}</p>
                </div>
            )}
        </div>
    );
}
