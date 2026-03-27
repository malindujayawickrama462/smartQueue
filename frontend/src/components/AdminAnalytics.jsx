import React, { useEffect, useState } from 'react';
import { getGlobalAnalytics } from '../api/orderApi';
import { getAllCanteens } from '../api/canteenApi';
import { Card } from './Card';

export default function AdminAnalytics() {
  const [data, setData] = useState({
    revenue: 0,
    orders: 0,
    topItems: [],
  });
  const [canteens, setCanteens] = useState([]);

  // Filtering States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCanteens = async () => {
    try {
      const res = await getAllCanteens();
      if (res.canteens) setCanteens(res.canteens);
    } catch (err) {
      console.error("Failed to fetch canteens:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getGlobalAnalytics({
        startDate,
        endDate,
        canteenID: selectedCanteen
      });
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteens();
    // Initial fetch for all time
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    fetchAnalytics();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCanteen('all');
    // Fetch immediately after clearing
    setTimeout(() => {
      getGlobalAnalytics({ startDate: '', endDate: '', canteenID: 'all' })
        .then(setData)
        .catch(err => setError(err.message));
    }, 0);
  };

  if (loading && !data.revenue && data.topItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <svg className="animate-spin h-8 w-8 text-purple-500 delay-150" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Gathering platform intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
          Platform Analytics
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Data
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/4 space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-purple-500 shadow-inner [color-scheme:dark]"
            />
          </div>

          <div className="w-full md:w-1/4 space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-purple-500 shadow-inner [color-scheme:dark]"
            />
          </div>

          <div className="w-full md:w-1/3 space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">Filter Canteen</label>
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-purple-500 shadow-inner appearance-none custom-select"
            >
              <option value="all">🌍 All Canteens (Global Platform)</option>
              {canteens.map(c => (
                <option key={c._id} value={c._id}>🏪 {c.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto flex gap-2">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Apply Filters"}
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-all hover:-translate-y-0.5"
            >
              Clear
            </button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="flex items-center gap-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {loading && (
              <div className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-purple-500/50">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue (Filtered)</p>
                  <p className="text-5xl font-black text-slate-100 drop-shadow-sm flex items-baseline gap-1">
                    <span className="text-2xl text-slate-500 font-bold">Rs.</span>
                    {data.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg text-3xl text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  📈
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-xl shadow-sky-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-sky-500/50">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Orders</p>
                  <p className="text-5xl font-black text-slate-100 drop-shadow-sm">
                    {data.orders.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg text-3xl text-white group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  🛒
                </div>
              </div>
            </div>
          </div>

          {/* Top Items Section */}
          <h2 className="text-xl font-bold text-slate-200 mt-8 mb-4 border-b border-slate-800 pb-2">Top Selling Items Globally</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.topItems.length === 0 ? (
              <div className="col-span-full p-8 border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/40 text-center">
                <span className="text-4xl block mb-2 opacity-50">🍽️</span>
                <p className="text-slate-400 font-medium">No sales data found for current filters.</p>
              </div>
            ) : (
              data.topItems.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 shrink-0 shadow-inner group-hover:bg-gradient-to-br group-hover:from-orange-500/20 group-hover:to-rose-500/20 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-all">
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200 group-hover:text-orange-300 transition-colors">{item.name}</h3>
                      <p className="text-xs font-medium text-slate-500">{item.sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 inline-block shadow-sm">
                      Rs. {item.rev.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
