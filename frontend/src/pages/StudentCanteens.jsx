import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { viewCanteens } from '../api/canteenApi';
import { Card } from '../components/Card';

export default function StudentCanteens() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState(null);

  useEffect(() => {
    const loadCanteens = async () => {
      setError('');
      try {
        const data = await viewCanteens();
        setCanteens(data.canteens || []);
      } catch (err) {
        setError(err.message || 'Failed to load canteens');
        setCanteens([]);
      } finally {
        setLoading(false);
      }
    };

    loadCanteens();
  }, []);

  const handleSelectCanteen = (canteen) => {
    setSelectedCanteen(canteen);
  };

  const handleCloseDetails = () => {
    setSelectedCanteen(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Select Canteen</h1>
            <p className="text-sm text-slate-400">
              Logged in as <span className="font-mono text-slate-200">{user?.email}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="text-sm text-slate-300 hover:text-white"
              onClick={() => nav('/home')}
            >
              Home
            </button>
            <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {!selectedCanteen ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Canteens</h2>
            {loading ? (
              <Card>
                <p className="text-sm text-slate-400">Loading canteens...</p>
              </Card>
            ) : canteens.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400">No canteens available at the moment.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canteens.map((canteen) => (
                  <Card
                    key={canteen._id}
                    title={canteen.name}
                    subtitle={canteen.location}
                  >
                    <div className="space-y-3">
                      {canteen.description && (
                        <p className="text-sm text-slate-300">{canteen.description}</p>
                      )}
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Capacity</span>
                          <span className="font-mono text-slate-300">{canteen.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ID</span>
                          <span className="font-mono text-slate-300">{canteen.canteenID}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectCanteen(canteen)}
                        className="w-full mt-4 inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-400 transition"
                      >
                        Select This Canteen
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card
            title={selectedCanteen.name}
            subtitle={selectedCanteen.location}
            footer={
              <button
                className="text-sm text-slate-300 hover:text-white"
                onClick={handleCloseDetails}
              >
                Back to Canteens
              </button>
            }
          >
            <div className="space-y-4">
              {selectedCanteen.description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Description</h3>
                  <p className="text-sm text-slate-400 mt-1">{selectedCanteen.description}</p>
                </div>
              )}

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Details</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Canteen ID</span>
                    <span className="font-mono text-slate-300">{selectedCanteen.canteenID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacity</span>
                    <span className="font-mono text-slate-300">{selectedCanteen.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="font-mono text-slate-300">{selectedCanteen.location}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => nav(`/order/${selectedCanteen._id}`)}
                className="w-full mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition"
              >
                Proceed to Order
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
