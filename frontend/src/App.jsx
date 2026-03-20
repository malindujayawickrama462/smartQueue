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
import { RequireAdmin, RequireAuth } from './routes/Guards';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/me" element={<Me />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/canteens" element={<StudentCanteens />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/canteens" element={<AdminCanteens />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}