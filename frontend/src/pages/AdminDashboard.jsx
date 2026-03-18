import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { deleteUser, getAllUsers, register } from '../auth/authApi';
import { Card } from '../components/Card';

const ROLES = [
  { id: 'admin', label: 'admin' },
  { id: 'student', label: 'student' },
  { id: 'staff', label: 'staff' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [creating, setCreating] = useState(false);
  const [createdMsg, setCreatedMsg] = useState('');

  const sortedUsers = useMemo(() => {
    const arr = Array.isArray(users) ? [...users] : [];
    arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return arr;
  }, [users]);

  const loadUsers = async () => {
    setError('');
    setLoadingUsers(true);
    try {
      const data = await getAllUsers(); // { total, users }
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const onDelete = async (u) => {
    const ok = confirm(`Delete ${u.name} (${u.email})?`);
    if (!ok) return;
    setError('');
    try {
      await deleteUser(u._id);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedMsg('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, password are required.');
      return;
    }
    setCreating(true);
    try {
      const data = await register({ name, email, password, role });
      setCreatedMsg(`Created ${data.userID} (${data.role})`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('student');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">
              Logged in as <span className="font-mono text-slate-200">{user?.email}</span>
            </p>
          </div>
          <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Create user" subtitle="Admin can create users and assign roles.">
            <form className="space-y-4" onSubmit={onCreateUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              {createdMsg && (
                <p className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-900/40 rounded-md px-3 py-2">
                  {createdMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {creating ? 'Creating...' : 'Create user'}
              </button>
            </form>
          </Card>

          <Card
            title="All users"
            subtitle="Loaded from /api/user/all-users (admin only)."
            footer={
              <button className="text-sm text-slate-300 hover:text-white" onClick={loadUsers}>
                Refresh
              </button>
            }
          >
            {loadingUsers ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <div className="space-y-3">
                {sortedUsers.length === 0 ? (
                  <p className="text-sm text-slate-400">No users found.</p>
                ) : (
                  sortedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono text-slate-300">{u.userID}</div>
                          <div className="text-xs text-sky-400">{u.role}</div>
                        </div>
                        <button
                          className="text-xs rounded-md border border-slate-700 bg-slate-900/50 px-2 py-1 text-slate-200 hover:border-red-500 hover:text-red-300 transition"
                          onClick={() => onDelete(u)}
                          disabled={u._id === user?._id}
                          title={u._id === user?._id ? "Can't delete yourself" : 'Delete user'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

