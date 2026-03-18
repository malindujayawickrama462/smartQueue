import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth/authApi';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/Card';

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      await refresh();
      // role-based landing happens in router via /me
      nav('/me', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Login</h1>
          <p className="text-sm text-slate-400">Use the credentials provided by admin.</p>
        </div>

        <Card
          title="Sign in"
          subtitle="JWT token will be stored locally."
          footer={
            <p className="text-xs text-slate-400">
              Need to create the first admin?{' '}
              <button className="text-sky-400 hover:text-sky-300" onClick={() => nav('/admin/register')}>
                Register admin
              </button>
            </p>
          }
        >
          <form className="space-y-4" onSubmit={onSubmit}>
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

