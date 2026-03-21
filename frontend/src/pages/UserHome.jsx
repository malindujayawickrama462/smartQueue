import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/Card';

export default function UserHome() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-sky-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/20 mb-2">
            <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-sm">
            Welcome, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{user?.role || 'user'}</span>
          </div>
        </div>

        <Card
          title=""
          subtitle=""
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
              <button
                className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors flex items-center justify-center gap-1.5"
                onClick={() => nav('/profile')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit Profile
              </button>
              <button
                className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"
                onClick={() => nav('/change-password')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Safety
              </button>
              <button
                className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                onClick={logout}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-700/50 pb-2">Account Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-sky-500/30 transition-colors">
                <span className="text-xs font-semibold text-slate-400 uppercase">User ID</span>
                <span className="text-sm font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{user?.userID || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-sky-500/30 transition-colors">
                <span className="text-xs font-semibold text-slate-400 uppercase">Full Name</span>
                <span className="text-sm font-medium text-slate-200">{user?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-sky-500/30 transition-colors">
                <span className="text-xs font-semibold text-slate-400 uppercase">Email</span>
                <span className="text-sm font-medium text-slate-300 truncate max-w-[60%] text-right">{user?.email || '—'}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <Card title="" subtitle="">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">Select Canteen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Browse available canteens to join</p>
              </div>
            </div>
            <button
              onClick={() => nav('/canteens')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Canteens
              <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

