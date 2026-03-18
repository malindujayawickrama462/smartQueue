import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function RequireAuth() {
  const { loading, isAuthed } = useAuth();
  if (loading) return null;
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  const { loading, isAuthed, role } = useAuth();
  if (loading) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return role === 'admin' ? <Outlet /> : <Navigate to="/me" replace />;
}

