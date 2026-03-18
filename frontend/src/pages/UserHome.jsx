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
      </div>
    </div>
  );
}

