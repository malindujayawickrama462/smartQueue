import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createCanteen, deleteCanteen, getAllCanteens, assignManagerToCanteen, addStaffToCanteen, getCanteenStaff, removeStaffFromCanteen } from '../api/canteenApi';
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
  const [staffId, setStaffId] = useState('');
  const [staffRole, setStaffRole] = useState('staff');
  const [managerId, setManagerId] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [assigningManager, setAssigningManager] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
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
        try {
          const staffData = await getCanteenStaff(canteen.canteenID);
          details[canteen._id] = {
            manager: staffData.manager,
            staff: staffData.staff || [],
          };
        } catch (err) {
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
      await deleteCanteen(canteen.canteenID);
      await loadCanteens();
    } catch (err) {
      setError(err.message || 'Failed to delete canteen');
    }
  };

  useEffect(() => {
    loadCanteens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateCanteen = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedMsg('');
    if (!name.trim() || !location.trim() || !capacity) {
      setError('Name, location, and capacity are required.');
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
    setStaffId('');
    setManagerId('');
    setError('');
    try {
      const data = await getCanteenStaff(canteen.canteenID);
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
      await assignManagerToCanteen(selectedCanteen.canteenID, managerId);
      setManagerId('');
      await onSelectCanteen(selectedCanteen);
      await loadCanteens();
    } catch (err) {
      setError(err.message || 'Failed to assign manager');
    } finally {
      setAssigningManager(false);
    }
  };

  const onAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    if (!staffId) {
      setError('Please select a staff member');
      return;
    }
    setAddingStaff(true);
    try {
      await addStaffToCanteen(selectedCanteen.canteenID, staffId, staffRole);
      setStaffId('');
      setStaffRole('staff');
      await onSelectCanteen(selectedCanteen);
    } catch (err) {
      setError(err.message || 'Failed to add staff');
    } finally {
      setAddingStaff(false);
    }
  };

  const onRemoveStaff = async (staffMemberId) => {
    const ok = confirm('Remove this staff member from the canteen?');
    if (!ok) return;
    setError('');
    try {
      await removeStaffFromCanteen(selectedCanteen.canteenID, staffMemberId);
      await onSelectCanteen(selectedCanteen);
    } catch (err) {
      setError(err.message || 'Failed to remove staff');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllCanteens();
        // Get users from the creators
        setAllUsers(data.canteens?.map(c => ({ _id: c.createdBy._id, name: c.createdBy.name, email: c.createdBy.email })) || []);
      } catch (err) {
        // Silent fail for user loading
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className={isSidebarMode ? '' : 'min-h-screen bg-slate-950 text-slate-100 px-4 py-10'}>
      <div className={isSidebarMode ? 'space-y-8' : 'max-w-5xl mx-auto space-y-8'}>
        {!isSidebarMode && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Canteen Management</h1>
              <p className="text-sm text-slate-400">
                Logged in as <span className="font-mono text-slate-200">{user?.email}</span>
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
                        className="rounded-lg border border-slate-700 bg-slate-950/40 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-slate-100">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.location}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              Capacity: <span className="text-slate-300">{c.capacity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-slate-400">{c.canteenID}</div>
                          </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3 space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Manager</p>
                            {details.manager ? (
                              <p className="text-xs text-emerald-400">✓ Assigned</p>
                            ) : (
                              <p className="text-xs text-slate-500">Not assigned</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">
                              Staff ({details.staff.length})
                            </p>
                            {details.staff.length > 0 ? (
                              <div className="space-y-1">
                                {details.staff.slice(0, 2).map((s) => (
                                  <p key={s._id} className="text-xs text-slate-400">
                                    • {s.staff.name} <span className="text-slate-500">({s.role})</span>
                                  </p>
                                ))}
                                {details.staff.length > 2 && (
                                  <p className="text-xs text-slate-500">+{details.staff.length - 2} more</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No staff assigned</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="flex-1 text-xs rounded-md border border-slate-600 bg-slate-900/50 px-2 py-1.5 text-slate-200 hover:border-emerald-500 hover:text-emerald-300 transition"
                            onClick={() => onSelectCanteen(c)}
                            title="Manage staff"
                          >
                            Manage
                          </button>
                          <button
                            className="flex-1 text-xs rounded-md border border-slate-600 bg-slate-900/50 px-2 py-1.5 text-slate-200 hover:border-red-500 hover:text-red-300 transition"
                            onClick={() => onDelete(c)}
                            title="Delete canteen"
                          >
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Assign Manager" subtitle="Set the canteen manager">
                <form className="space-y-4" onSubmit={onAssignManager}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200" htmlFor="manager">
                      Select Manager
                    </label>
                    <select
                      id="manager"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                    >
                      <option value="">Choose a manager...</option>
                      {allUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
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

              <Card title="Add Staff" subtitle="Assign staff to this canteen">
                <form className="space-y-4" onSubmit={onAddStaff}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200" htmlFor="staff">
                      Select Staff Member
                    </label>
                    <select
                      id="staff"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 transition"
                    >
                      <option value="">Choose staff member...</option>
                      {allUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-200" htmlFor="role">
                      Role
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

                  {error && (
                    <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={addingStaff}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {addingStaff ? 'Adding...' : 'Add Staff'}
                  </button>
                </form>
              </Card>
            </div>

            <Card title="Current Staff" subtitle={`${staffList.length} staff members assigned`}>
              {staffList.length === 0 ? (
                <p className="text-sm text-slate-400">No staff assigned to this canteen yet.</p>
              ) : (
                <div className="space-y-3">
                  {staffList.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.staff.name}</div>
                        <div className="text-xs text-slate-400 truncate">{s.staff.email}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-mono text-slate-300">{s.staff.userID}</div>
                          <div className="text-xs text-emerald-400 capitalize">{s.role}</div>
                        </div>
                        <button
                          className="text-xs rounded-md border border-slate-700 bg-slate-900/50 px-2 py-1 text-slate-200 hover:border-red-500 hover:text-red-300 transition"
                          onClick={() => onRemoveStaff(s.staff._id)}
                          title="Remove staff"
                        >
                          Remove
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
    </div>
  );
}
