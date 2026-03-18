import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Me() {
  const nav = useNavigate();
  const { loading, isAuthed, role } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthed) nav('/login', { replace: true });
    else if (role === 'admin') nav('/admin', { replace: true });
    else nav('/home', { replace: true });
  }, [isAuthed, loading, nav, role]);

  return null;
}

