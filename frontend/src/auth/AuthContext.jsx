import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile as apiGetProfile, logout as apiLogout } from './authApi';
import { clearToken, getToken } from './storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // { userID,name,email,role,createdAt }

  const refresh = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await apiGetProfile();
      setUser(profile);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      loading,
      user,
      isAuthed: Boolean(user),
      role: user?.role || null,
      refresh,
      logout: () => {
        apiLogout();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

