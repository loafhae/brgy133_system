import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await api.get('/auth/me');
      if (!data.is_active) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        setUser(data);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.access_token);
    await fetchMe();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const mustChangePassword = user?.must_change_password ?? false;

  const updateProfilePic = (url) => {
    setUser((prev) => prev ? { ...prev, profile_pic: url } : prev);
  };

  const updateUser = (data) => {
    setUser((prev) => prev ? { ...prev, ...data } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, mustChangePassword, updateProfilePic, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
