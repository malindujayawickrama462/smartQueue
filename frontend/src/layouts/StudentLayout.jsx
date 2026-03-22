import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';
import { useAuth } from '../auth/AuthContext';
import { io } from 'socket.io-client';

export default function StudentLayout() {
    const { user } = useAuth();
    // Only render the sidebar for students/users to avoid confusing staff navigating to profile
    const isStudent = user?.role === 'student' || user?.role === 'user';
    const [alertData, setAlertData] = useState(null);

    useEffect(() => {
        if (!isStudent || !user) return;

        // Note: Make sure the URL perfectly matches the backend exactly (typically port 5000)
        // If your frontend requests go to another port, adjust this or use window.location.hostname
        const socket = io("http://localhost:5000");

        socket.on("connect", () => {
            // Register this user's private channel
            socket.emit("join-room", user._id);
            console.log("Connected to SmartQueue Notification Stream");
        });

        const handleAlert = (data, type) => {
            setAlertData({ ...data, type });
            // Auto hide after 10 seconds
            setTimeout(() => setAlertData(null), 10000);
        };

        socket.on("order-ready", (data) => handleAlert(data, 'ready'));
        socket.on("order-reminder", (data) => handleAlert(data, 'reminder'));
        socket.on("slot-active", (data) => handleAlert(data, 'active'));

        return () => {
            socket.disconnect();
        };
    }, [user, isStudent]);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
            
            {/* Real-time Notification Overlay */}
            {alertData && (
                <div className="absolute top-6 right-6 z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-5 max-w-sm w-full animate-bounce">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">
                                {alertData.type === 'ready' ? '🍽️' : alertData.type === 'reminder' ? '⏰' : '🚀'}
                            </span>
                            <h3 className="font-black text-slate-100">
                                {alertData.type === 'ready' ? 'ORDER READY' : alertData.type === 'reminder' ? '5 MINUTE REMINDER' : 'SLOT ACTIVE'}
                            </h3>
                        </div>
                        <button onClick={() => setAlertData(null)} className="text-slate-500 hover:text-white">✕</button>
                    </div>
                    <p className="text-slate-300 text-sm font-medium mb-3">{alertData.message}</p>
                    {alertData.orderID && (
                        <div className="bg-slate-800 text-center py-2 rounded-lg border border-slate-700">
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-0.5">Reference</span>
                            <span className="text-emerald-400 font-black tracking-tight">{alertData.orderID}</span>
                        </div>
                    )}
                </div>
            )}

            {isStudent && <StudentSidebar />}
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
