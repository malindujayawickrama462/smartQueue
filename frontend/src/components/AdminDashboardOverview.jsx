import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../auth/authApi';
import { getAllCanteens } from '../api/canteenApi';
import { Card } from './Card';

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalCanteens: 0,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const usersData = await getAllUsers();
        const canteensData = await getAllCanteens();

        const users = usersData.users || [];
        const admins = users.filter(u => u.role === 'admin').length;
        const students = users.filter(u => u.role === 'student').length;
        const staff = users.filter(u => u.role === 'staff').length;
        const canteens = canteensData.canteens?.length || 0;

        setStats({
          totalAdmins: admins,
          totalStudents: students,
          totalStaff: staff,
          totalCanteens: canteens,
          loading: false,
        });
      } catch (err) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Admins', value: stats.totalAdmins, color: 'from-purple-500 to-indigo-600', glow: 'shadow-purple-500/20', icon: '👨‍💼' },
    { label: 'Total Students', value: stats.totalStudents, color: 'from-blue-500 to-sky-600', glow: 'shadow-blue-500/20', icon: '👨‍🎓' },
    { label: 'Total Staff', value: stats.totalStaff, color: 'from-emerald-400 to-teal-600', glow: 'shadow-emerald-500/20', icon: '👨‍💻' },
    { label: 'Total Canteens', value: stats.totalCanteens, color: 'from-orange-400 to-rose-500', glow: 'shadow-orange-500/20', icon: '🍽️' },
  ];

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">System Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-xl ${stat.glow} backdrop-blur-md group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-4xl font-black text-slate-100 drop-shadow-sm">
                  {stats.loading ? (
                    <span className="inline-block w-8 h-8 border-4 border-slate-700 border-t-slate-400 rounded-full animate-spin mt-1" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg text-2xl group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card title="Quick Links" subtitle="Fast access to key management portals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 cursor-pointer hover:border-purple-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">👨‍💼</div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">Admin Management</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Create and manage admin accounts</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">👨‍🎓</div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">Student Management</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Create and manage student accounts</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">👨‍💻</div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">Staff Management</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Create and onboard staff members</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/30 p-5 cursor-pointer hover:border-orange-500/50 hover:bg-slate-800/50 hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.2)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10 text-xl border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">🍽️</div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-orange-400 transition-colors">Canteen Management</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Manage capacities and assign staff</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
