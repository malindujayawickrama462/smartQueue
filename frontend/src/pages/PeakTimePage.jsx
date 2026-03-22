import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { viewCanteens } from '../api/canteenApi';
import PeakTimeChart from '../components/PeakTimeChart';
import { Card } from '../components/Card';

export default function PeakTimePage() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await viewCanteens();
        const list = data.canteens || [];
        setCanteens(list);
        if (list.length > 0 && !selectedCanteenId) {
          setSelectedCanteenId(list[0].canteenID);
        } else if (list.length === 0) {
          setSelectedCanteenId('Canteen-0001');
        }
      } catch {
        setCanteens([]);
        setSelectedCanteenId('Canteen-0001');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Peak Time Analysis</h1>
            <p className="text-sm text-slate-400 mt-1">
              Logged in as <span className="font-mono text-slate-200">{user?.email}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm text-slate-300 hover:text-white"
              onClick={() => nav('/student')}
            >
              Home
            </button>
            <button
              type="button"
              className="text-sm text-slate-300 hover:text-white"
              onClick={() => nav('/canteens')}
            >
              Canteens
            </button>
            <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <Card>
            <p className="text-sm text-slate-400">Loading...</p>
          </Card>
        ) : (
          <>
            {canteens.length > 0 && (
              <Card title="Select canteen" subtitle="View order patterns by canteen.">
                <select
                  value={selectedCanteenId}
                  onChange={(e) => setSelectedCanteenId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                >
                  {canteens.map((c) => (
                    <option key={c._id} value={c.canteenID}>
                      {c.name} ({c.canteenID})
                    </option>
                  ))}
                </select>
              </Card>
            )}

            {selectedCanteenId && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
                <PeakTimeChart canteenId={selectedCanteenId} />
              </div>
            )}

            {canteens.length === 0 && !loading && (
              <Card>
                <p className="text-sm text-slate-400">
                  No canteens yet. Admins can create canteens; students place orders to build peak-time data.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Showing placeholder for Canteen-0001. Go to Canteens and place orders to see real data.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
