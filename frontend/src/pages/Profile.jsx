import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { updateProfile } from '../auth/authApi';
import { Card } from '../components/Card';

export default function Profile() {
  const nav = useNavigate();
  const { user, refresh, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, email });
      await refresh();
      setMsg('Profile updated.');
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-400">Update your name and email.</p>
        </div>

        <Card
          title="Profile"
          subtitle="Permissions: student/staff can update own profile."
          footer={
            <div className="flex items-center justify-between">
              <button className="text-sm text-slate-300 hover:text-white" onClick={() => nav('/home')}>
                Back
              </button>
              <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
                Logout
              </button>
            </div>
          }
        >
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {msg && (
              <p className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-900/40 rounded-md px-3 py-2">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

