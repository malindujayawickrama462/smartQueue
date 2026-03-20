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
    { label: 'Total Admins', value: stats.totalAdmins, color: 'purple', icon: '👨‍💼' },
    { label: 'Total Students', value: stats.totalStudents, color: 'blue', icon: '👨‍🎓' },
    { label: 'Total Staff', value: stats.totalStaff, color: 'green', icon: '👨‍💻' },
    { label: 'Total Canteens', value: stats.totalCanteens, color: 'orange', icon: '🍽️' },
  ];

  const colorMap = {
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-6 ${colorMap[stat.color]}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-100">
                  {stats.loading ? '—' : stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <Card title="Quick Links" subtitle="Access management sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 cursor-pointer transition">
            <p className="font-medium text-slate-200">👨‍💼 Admin Management</p>
            <p className="text-sm text-slate-400">Create and manage admin accounts</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 cursor-pointer transition">
            <p className="font-medium text-slate-200">👨‍🎓 Student Management</p>
            <p className="text-sm text-slate-400">Create and manage student accounts</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 cursor-pointer transition">
            <p className="font-medium text-slate-200">👨‍💻 Staff Management</p>
            <p className="text-sm text-slate-400">Create and manage staff members</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 cursor-pointer transition">
            <p className="font-medium text-slate-200">🍽️ Canteen Management</p>
            <p className="text-sm text-slate-400">Manage canteens and assign staff</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
