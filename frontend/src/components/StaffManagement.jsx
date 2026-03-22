import React, { useEffect, useState, useMemo } from 'react';
import { getAllUsers, deleteUser, register } from '../auth/authApi';
import { getAllCanteens, addStaffToCanteen } from '../api/canteenApi';
import { Card } from './Card';

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [canteens, setCanteens] = useState([]);
  const [loadingCanteens, setLoadingCanteens] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [creating, setCreating] = useState(false);
  const [createdMsg, setCreatedMsg] = useState('');

  const sortedUsers = useMemo(() => {
    const arr = Array.isArray(users) ? [...users].filter(u => u.role === 'staff') : [];
    arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return arr;
  }, [users]);

  const loadUsers = async () => {
    setError('');
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCanteens = async () => {
    setLoadingCanteens(true);
    try {
      const data = await getAllCanteens();
      setCanteens(data.canteens || []);
    } catch (err) {
      // Silent fail for canteens
      setCanteens([]);
    } finally {
      setLoadingCanteens(false);
    }
  };

  const onDelete = async (u) => {
    const ok = confirm(`Delete staff ${u.name} (${u.email})?`);
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
    loadCanteens();
  }, []);

  const onCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, password are required.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setCreating(true);
    try {
      const data = await register({ name, email, password, role: 'staff' }, { auth: true });

      // Assign to canteen if selected
      if (selectedCanteen) {
        try {
          await addStaffToCanteen(selectedCanteen, data._id || data.userID, staffRole);
          setCreatedMsg(`Created ${data.userID} (${data.role}) and assigned to canteen`);
        } catch (canteenErr) {
          setCreatedMsg(`Created ${data.userID} but failed to assign to canteen: ${canteenErr.message}`);
        }
      } else {
        setCreatedMsg(`Created ${data.userID} (${data.role})`);
      }

      setName('');
      setEmail('');
      setPassword('');
      setSelectedCanteen('');
      setStaffRole('staff');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">Staff Management</h1>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {sortedUsers.length} Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 relative group h-fit">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <Card title="Onboard Staff" subtitle="Create and assign new staff members.">
            <form className="space-y-4" onSubmit={onCreateUser}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 shadow-inner"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 shadow-inner"
                  placeholder="staff@smartqueue.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase" htmlFor="password">
                  Initial Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-sky-500/10 transition-all duration-300 shadow-inner"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 pb-1 border-t border-slate-800/60 mt-4">
                <div className="space-y-1.5 mt-2">
                  <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase" htmlFor="canteen">
                    Assign to Canteen (Optional)
                  </label>
                  <select
                    id="canteen"
                    value={selectedCanteen}
                    onChange={(e) => setSelectedCanteen(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-inner cursor-pointer"
                  >
                    <option value="">No assignment</option>
                    {loadingCanteens ? (
                      <option value="">Loading canteens...</option>
                    ) : (
                      canteens.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.location})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedCanteen && (
                  <div className="space-y-1.5 mt-4">
                    <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase" htmlFor="role">
                      Canteen Access Level
                    </label>
                    <select
                      id="role"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:bg-slate-900/80 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 shadow-inner cursor-pointer"
                    >
                      <option value="staff">Standard Staff</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}
              {createdMsg && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>{createdMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Staff
                    <svg className="w-4 h-4 ml-0.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7 h-fit">
          <Card
            title="Active Personnel"
            subtitle="Manage existing staff directory."
            footer={
              <button className="text-sm font-semibold text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1.5 px-1 py-0.5 focus:outline-none" onClick={loadUsers}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh List
              </button>
            }
          >
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3">
                <svg className="animate-spin h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium animate-pulse">Loading personnel registry...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 stylish-scrollbar">
                {sortedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/50">
                    <span className="text-4xl">📭</span>
                    <p className="text-sm font-medium">No staff members found.</p>
                  </div>
                ) : (
                  sortedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-600/80 p-4 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 font-bold border border-emerald-500/20 shrink-0 uppercase shadow-inner">
                          {u.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">{u.name}</div>
                          <div className="text-xs text-slate-500 font-medium truncate mt-0.5">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-mono font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 inline-block mb-1">{u.userID}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{u.role}</div>
                        </div>
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          onClick={() => onDelete(u)}
                          title="Delete staff member"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
