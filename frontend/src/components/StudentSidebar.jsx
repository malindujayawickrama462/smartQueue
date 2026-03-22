import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function StudentSidebar() {
    const nav = useNavigate();
    const { user, logout } = useAuth();

    const links = [
        { path: "/home", label: "Dashboard", icon: "🏠" },
        { path: "/canteens", label: "Browse Canteens", icon: "🍔" },
        { path: "/invoices", label: "Order History", icon: "📜" },
        { path: "/profile", label: "My Profile", icon: "👤" },
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
            <div className="p-6 space-y-8">
                <div>
                    <h2 className="text-xl font-black text-emerald-500 tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => nav('/home')}>
                        SmartQueue <span className="text-sm bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md uppercase">{user?.role || 'STUDENT'}</span>
                    </h2>
                </div>

                <nav className="space-y-2">
                    {links.map(l => (
                        <NavLink
                            key={l.path}
                            to={l.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                }`
                            }
                        >
                            <span className="text-lg">{l.icon}</span>
                            {l.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="p-6">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
