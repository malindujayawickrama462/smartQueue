import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/Card';

export default function UserHome() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="text-sm text-slate-400">You are logged in as {user?.role || 'user'}.</p>
        </div>

        <Card
          title="Your profile"
          subtitle="Loaded from /api/user/profile"
          footer={
            <div className="flex items-center justify-between">
              <button className="text-sm text-slate-300 hover:text-white" onClick={() => nav('/profile')}>
                Edit profile
              </button>
              <button
                className="text-sm text-slate-300 hover:text-white"
                onClick={() => nav('/change-password')}
              >
                Change password
              </button>
              <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
                Logout
              </button>
            </div>
          }
        >
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">UserID</span>
              <span className="font-mono">{user?.userID || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Name</span>
              <span className="font-mono">{user?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email</span>
              <span className="font-mono truncate max-w-[55%] text-right">{user?.email || '—'}</span>
            </div>
          </div>
        </Card>

        <Card title="Select Canteen" subtitle="Browse and select from available canteens">
          <p className="text-sm text-slate-300 mb-4">
            View available canteens and select one to join the queue.
          </p>
          <button
            onClick={() => nav('/canteens')}
            className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition"
          >
            Browse Canteens
          </button>
        </Card>

        <Card title="Smart canteen tools" subtitle="Peak times and feedback">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => nav('/peak-time')}
              className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 transition"
            >
              Peak time chart
            </button>
            <button
              type="button"
              onClick={() => nav('/complaints')}
              className="w-full inline-flex items-center justify-center rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-500/40 hover:bg-violet-400 transition"
            >
              Complaints
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

