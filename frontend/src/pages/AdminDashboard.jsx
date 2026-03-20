import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminDashboardOverview from '../components/AdminDashboardOverview';
import AdminManagement from '../components/AdminManagement';
import StudentManagement from '../components/StudentManagement';
import StaffManagement from '../components/StaffManagement';
import CanteenManagementSection from '../components/CanteenManagementSection';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'admins':
        return <AdminManagement />;
      case 'students':
        return <StudentManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'canteens':
        return <CanteenManagementSection />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Logged in as <span className="font-mono text-slate-200">{user?.email}</span>
            </p>
          </div>
          <button className="text-sm text-slate-300 hover:text-white" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="p-8">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
