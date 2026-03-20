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
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, password are required.');
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Create Staff" subtitle="Add new staff members.">
          <form className="space-y-4" onSubmit={onCreateUser}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                placeholder="Staff name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="staff@example.com"
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
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="canteen">
                Assign to Canteen (Optional)
              </label>
              <select
                id="canteen"
                value={selectedCanteen}
                onChange={(e) => setSelectedCanteen(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
              >
                <option value="">No canteen assignment</option>
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200" htmlFor="role">
                  Staff Role in Canteen
                </label>
                <select
                  id="role"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                >
                  <option value="staff">Staff</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            )}

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
              {creating ? 'Creating...' : 'Create Staff'}
            </button>
          </form>
        </Card>

        <Card
          title="All Staff"
          subtitle={`Total: ${sortedUsers.length} staff members`}
          footer={
            <button className="text-sm text-slate-300 hover:text-white" onClick={loadUsers}>
              Refresh
            </button>
          }
        >
          {loadingUsers ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedUsers.length === 0 ? (
                <p className="text-sm text-slate-400">No staff found.</p>
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
                        <div className="text-xs text-green-400">{u.role}</div>
                      </div>
                      <button
                        className="text-xs rounded-md border border-slate-700 bg-slate-900/50 px-2 py-1 text-slate-200 hover:border-red-500 hover:text-red-300 transition"
                        onClick={() => onDelete(u)}
                        title="Delete staff"
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
  );
}
