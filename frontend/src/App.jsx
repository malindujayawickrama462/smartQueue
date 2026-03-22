import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegister from './pages/AdminRegister';
import Login from './pages/Login';
import Me from './pages/Me';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
import UserHome from './pages/UserHome';
import StudentDashboard from './pages/StudentDashboard';
import StudentRegister from './pages/StudentRegister';
import AdminCanteens from './pages/AdminCanteens';
import StudentCanteens from './pages/StudentCanteens';
import PeakTimePage from './pages/PeakTimePage';
import StudentComplaintPage from './pages/StudentComplaintPage';
import AdminComplaintPage from './pages/AdminComplaintPage';
import { RequireAdmin, RequireAuth } from './routes/Guards';

function StudentComplaintRoute() {
  const { user } = useAuth();
  return <StudentComplaintPage studentId={user?.userID} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/student/register" element={<StudentRegister />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/me" element={<Me />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/canteens" element={<StudentCanteens />} />
        <Route path="/peak-time" element={<PeakTimePage />} />
        <Route path="/complaints" element={<StudentComplaintRoute />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/canteens" element={<AdminCanteens />} />
        <Route path="/admin/complaints" element={<AdminComplaintPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}