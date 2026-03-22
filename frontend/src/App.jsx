import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegister from './pages/AdminRegister';
import Login from './pages/Login';
import Me from './pages/Me';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import UserHome from './pages/UserHome';
import AdminCanteens from './pages/AdminCanteens';
import StudentCanteens from './pages/StudentCanteens';
import StudentOrder from './pages/StudentOrder';
import KitchenDashboard from './pages/KitchenDashboard';
import ManageMenu from './pages/ManageMenu';
import InvoiceView from './pages/InvoiceView';
import UserInvoices from './pages/UserInvoices';
import StaffLayout from './layouts/StaffLayout';
import StudentLayout from './layouts/StudentLayout';
import StaffAnalytics from './pages/StaffAnalytics';
import StaffOrderHistory from './pages/StaffOrderHistory';
import StaffPOS from './pages/StaffPOS';
import { RequireAdmin, RequireAuth } from './routes/Guards';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/me" element={<Me />} />
        
        {/* Student Routes inside Sidebar Layout */}
        <Route element={<StudentLayout />}>
          <Route path="/home" element={<UserHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/canteens" element={<StudentCanteens />} />
          <Route path="/order/:canteenId" element={<StudentOrder />} />
          <Route path="/invoice/:invoiceId" element={<InvoiceView />} />
          <Route path="/invoices" element={<UserInvoices />} />
        </Route>

        {/* Staff Routes inside Sidebar Layout */}
        <Route path="/kitchen" element={<StaffLayout />}>
          <Route index element={<KitchenDashboard />} />
          <Route path="menu" element={<ManageMenu />} />
          <Route path="pos" element={<StaffPOS />} />
          <Route path="analytics" element={<StaffAnalytics />} />
          <Route path="history" element={<StaffOrderHistory />} />
        </Route>
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/canteens" element={<AdminCanteens />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}