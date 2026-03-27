import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from './NotificationBell';
import { getWalletInfo } from '../api/walletApi';
import { useNavigate } from 'react-router-dom';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'user')) {
      getWalletInfo().then(setWallet).catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold uppercase ring-1 ring-indigo-500/50 shadow-inner">
          {user.name ? user.name.charAt(0) : user.email?.charAt(0) || 'U'}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-200 leading-tight">
            {user.name || user.email || 'User'}
          </p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
            {user.role} Module
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5 border-l border-slate-800 pl-5 ml-auto">
        {wallet && (
          <div 
            onClick={() => nav('/wallet')}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors"
          >
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Wallet</p>
              <p className="text-sm font-black text-emerald-400">LKR {wallet.walletBalance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-1"></div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Points</p>
              <p className="text-sm font-black text-amber-400 flex items-center gap-1">⭐ {wallet.loyaltyPoints || 0}</p>
            </div>
          </div>
        )}
        <NotificationBell />

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <button
          onClick={logout}
          className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex flex-row items-center gap-1.5"
          title="Logout"
        >
          Logout
          <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
