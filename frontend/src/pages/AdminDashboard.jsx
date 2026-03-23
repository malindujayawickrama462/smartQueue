import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminDashboardOverview from '../components/AdminDashboardOverview';
import AdminManagement from '../components/AdminManagement';
import StudentManagement from '../components/StudentManagement';
import StaffManagement from '../components/StaffManagement';
import CanteenManagementSection from '../components/CanteenManagementSection';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminReportGeneration from '../components/AdminReportGeneration';
import AdminComplaints from '../components/AdminComplaints';
import TopNavbar from '../components/TopNavbar';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'reports':
        return <AdminReportGeneration />;
      case 'admins':
        return <AdminManagement />;
      case 'students':
        return <StudentManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'canteens':
        return <CanteenManagementSection />;
      case 'complaints':
        return <AdminComplaints />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
