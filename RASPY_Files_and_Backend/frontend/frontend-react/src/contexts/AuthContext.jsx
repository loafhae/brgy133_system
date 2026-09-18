import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on initial load if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      // Fetch fresh user profile right after login
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      return userRes.data;
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (...requiredRoles) => {
    if (!user) return false;
    const flatRequired = requiredRoles.flat();
    const userRole = user.role || user.roles || '';
    const userRolesList = Array.isArray(userRole)
      ? userRole.map((r) => String(r).trim().toLowerCase())
      : typeof userRole === 'string'
      ? userRole.split(',').map((r) => r.trim().toLowerCase())
      : [String(userRole).toLowerCase()];
    return flatRequired.some((req) => userRolesList.includes(String(req).toLowerCase()));
  };

  const updateProfilePic = (picUrl) => {
    setUser((prev) => (prev ? { ...prev, profile_pic: picUrl } : null));
  };

  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, updateProfilePic, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}