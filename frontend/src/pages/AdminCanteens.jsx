import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createCanteen, deleteCanteen, getAllCanteens, assignManagerToCanteen, getCanteenStaff, removeStaffFromCanteen } from '../api/canteenApi';
import { Card } from '../components/Card';

export default function AdminCanteens({ isSidebarMode = false }) {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loadingCanteens, setLoadingCanteens] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdMsg, setCreatedMsg] = useState('');

  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [managerId, setManagerId] = useState('');
  const [assigningManager, setAssigningManager] = useState(false);
  const [canteenDetails, setCanteenDetails] = useState({});

  const sortedCanteens = useMemo(() => {
    const arr = Array.isArray(canteens) ? [...canteens] : [];
    arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return arr;
  }, [canteens]);

  const loadCanteens = async () => {
    setError('');
    setLoadingCanteens(true);
    try {
      const data = await getAllCanteens();
      const canteenList = data.canteens || [];
      setCanteens(canteenList);

      // Load staff for each canteen
      const details = {};
      for (const canteen of canteenList) {
        const identifier = canteen.canteenID || canteen._id;
        try {
          const staffData = await getCanteenStaff(identifier);
          details[canteen._id] = {
            manager: staffData.manager,
            staff: staffData.staff || [],
          };
        } catch {
          details[canteen._id] = { manager: null, staff: [] };
        }
      }
      setCanteenDetails(details);
    } catch (err) {
      setError(err.message || 'Failed to load canteens');
      setCanteens([]);
    } finally {
      setLoadingCanteens(false);
    }
  };

  const onDelete = async (canteen) => {
    const ok = confirm(`Delete ${canteen.name}?`);
    if (!ok) return;
    setError('');
    try {
      const identifier = canteen.canteenID || canteen._id;
      await deleteCanteen(identifier);
      await loadCanteens();
    } catch (err) {
      setError(err.message || 'Failed to delete canteen');
    }
  };

  useEffect(() => {
    loadCanteens();
  }, []);

  const onCreateCanteen = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedMsg('');
    if (!name.trim() || !location.trim() || !capacity) {
      setError('Name, location, and capacity are required.');
      return;
    }
    const capNum = parseInt(capacity);
    if (isNaN(capNum) || capNum < 1 || capNum > 10000) {
      setError('Capacity must be a valid number between 1 and 10000.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Canteen name must be at least 2 characters.');
      return;
    }
    setCreating(true);
    try {
      const data = await createCanteen({
        name,
        location,
        description: description || '',
        capacity: parseInt(capacity)
      });
      setCreatedMsg(`Created ${data.canteenID} (${data.name})`);
      setName('');
      setLocation('');
      setDescription('');
      setCapacity('');
      await loadCanteens();
    } catch (err) {
      setError(err.message || 'Failed to create canteen');
    } finally {
      setCreating(false);
    }
  };

  const onSelectCanteen = async (canteen) => {
    setSelectedCanteen(canteen);
    setManagerId('');
    setError('');
    try {
      const identifier = canteen.canteenID || canteen._id;
      const data = await getCanteenStaff(identifier);
      setStaffList(data.staff || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff');
    }
  };

  const onAssignManager = async (e) => {
    e.preventDefault();
    setError('');
    if (!managerId) {
      setError('Please select a manager');
      return;
    }
    setAssigningManager(true);
    try {
      const identifier = selectedCanteen.canteenID || selectedCanteen._id;
      await assignManagerToCanteen(identifier, managerId);
      setManagerId('');
      await onSelectCanteen(selectedCanteen);
      await loadCanteens();
    } catch (err) {
      setError(err.message || 'Failed to assign manager');
    } finally {
      setAssigningManager(false);
    }
  };

  const onRemoveStaff = async (staffMemberId) => {
    const ok = confirm('Remove this staff member from the canteen?');
    if (!ok) return;
    setError('');
    try {
      const identifier = selectedCanteen.canteenID || selectedCanteen._id;
      await removeStaffFromCanteen(identifier, staffMemberId);
      await onSelectCanteen(selectedCanteen);
    } catch (err) {
      setError(err.message || 'Failed to remove staff');
    }
  };

  return (
    <div className={isSidebarMode ? '' : 'min-h-screen bg-slate-950 text-slate-100 px-4 py-10'}>
      <div className={isSidebarMode ? 'space-y-8' : 'max-w-5xl mx-auto space-y-8'}>
        {!isSidebarMode && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 drop-shadow-sm">
                Canteen Management
              </h1>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Logged in as <span className="font-mono text-slate-200 font-medium">{user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-sm text-slate-300 hover:text-white"
                onClick={() => nav('/admin')}
              >
                Back to Dashboard
              </button>
              <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        )}

        {isSidebarMode && (
          <h1 className="text-3xl font-bold tracking-tight">Canteen Management</h1>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Create canteen" subtitle="Admin can create new canteens.">
            <form className="space-y-4" onSubmit={onCreateCanteen}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200" htmlFor="name">
                  Canteen Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                  placeholder="e.g., Main Canteen"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                  placeholder="e.g., Block A, Ground Floor"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="capacity">
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    min={1}
                    max={10000}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200" htmlFor="description">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                  placeholder="e.g., Main cafeteria with diverse food options"
                  rows="2"
                />
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
                {creating ? 'Creating...' : 'Create canteen'}
              </button>
            </form>
          </Card>

          <Card
            title="All canteens"
            subtitle="Manage all canteens"
            footer={
              <button className="text-sm text-slate-300 hover:text-white" onClick={loadCanteens}>
                Refresh
              </button>
            }
          >
            {loadingCanteens ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <div className="space-y-3">
                {sortedCanteens.length === 0 ? (
                  <p className="text-sm text-slate-400">No canteens found.</p>
                ) : (
                  sortedCanteens.map((c) => {
                    const details = canteenDetails[c._id] || { manager: null, staff: [] };
                    return (
                      <div
                        key={c._id}
                        className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/30 p-5 space-y-4 hover:border-sky-500/50 hover:bg-slate-800/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_-5px_rgba(14,165,233,0.15)] transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                                {c.name}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                {c.location}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Capacity: <span className="text-slate-200 font-semibold">{c.capacity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800 shadow-inner">
                              {c.canteenID}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-700/60 pt-4 space-y-3 relative z-10">
                          <div>
                            <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Manager</p>
                            {details.manager ? (() => {
                              const managerStaff = details.staff.find(s => s.staff && s.staff._id === details.manager);
                              return (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  <span className="text-xs font-semibold">{managerStaff && managerStaff.staff ? managerStaff.staff.name : 'Unknown'}</span>
                                </div>
                              );
                            })() : (
                              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500/80 px-2.5 py-1 rounded-md border border-amber-500/20">
                                <span className="text-xs font-medium">Pending Assignment</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                              Staff Roster ({details.staff.filter(s => s.staff).length})
                            </p>
                            {details.staff.filter(s => s.staff).length > 0 ? (
                              <select
                                className="w-full appearance-none rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 outline-none hover:border-slate-600 focus:border-sky-500 transition-colors shadow-sm cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Click to view staff members...</option>
                                {details.staff.filter(s => s.staff).map((s) => (
                                  <option key={s._id} value={s._id} disabled>
                                    {s.staff.name} — {s.role.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-slate-500 italic">No staff assigned</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2 relative z-10">
                          <button
                            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-600/60 bg-slate-800/50 px-3 py-2 text-slate-200 hover:bg-sky-500 hover:border-sky-400 hover:text-white hover:shadow-[0_0_15px_-3px_rgba(14,165,233,0.4)] transition-all duration-300"
                            onClick={() => onSelectCanteen(c)}
                            title="Manage staff"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            Manage
                          </button>
                          <button
                            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-600/60 bg-slate-800/50 px-3 py-2 text-slate-200 hover:bg-red-500 hover:border-red-400 hover:text-white hover:shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)] transition-all duration-300"
                            onClick={() => onDelete(c)}
                            title="Delete canteen"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        </div>

        {selectedCanteen && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-100">Staff Management: {selectedCanteen.name}</h2>
            <Card title="Assign Manager" subtitle="Set the canteen manager">
              <form className="space-y-4" onSubmit={onAssignManager}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="manager">
                    Select Manager (From Staff)
                  </label>
                  <select
                    id="manager"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                  >
                    <option value="">Choose a manager...</option>
                    {staffList.filter(s => s.staff).map((s) => (
                      <option key={s.staff._id} value={s.staff._id}>
                        {s.staff.name} ({s.staff.email})
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={assigningManager}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {assigningManager ? 'Assigning...' : 'Assign Manager'}
                </button>
              </form>
            </Card>

            <Card title="Current Staff" subtitle={`${staffList.length} staff members assigned`}>
              {staffList.length === 0 ? (
                <p className="text-sm text-slate-400">No staff assigned to this canteen yet.</p>
              ) : (
                <div className="space-y-3">
                  {staffList.filter(s => s.staff).map((s) => (
                    <div
                      key={s._id}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 py-3 hover:bg-slate-800/80 hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-sky-500/30 transition-shadow">
                          {s.staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100 truncate group-hover:text-sky-300 transition-colors">{s.staff.name}</div>
                          <div className="text-xs text-slate-400 truncate">{s.staff.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-mono text-slate-500">{s.staff.userID}</div>
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 mt-1">
                            {s.role}
                          </div>
                        </div>
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-700 bg-slate-900/80 text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all shadow-sm"
                          onClick={() => onRemoveStaff(s.staff._id)}
                          title="Remove staff"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <button
              onClick={() => setSelectedCanteen(null)}
              className="text-sm text-slate-300 hover:text-white"
            >
              Close Staff Management
            </button>
          </div>
        )}
      </div>
    </div >
  );
}
