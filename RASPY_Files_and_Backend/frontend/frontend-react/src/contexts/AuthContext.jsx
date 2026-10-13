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

  const login = async (usernameOrObj, passwordParam) => {
    let username = usernameOrObj;
    let password = passwordParam;

    // Safety unwrap if an object or event was passed by accident
    if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
      username = usernameOrObj.username?.username || usernameOrObj.username;
      password = usernameOrObj.password || passwordParam;
    }

    const { data } = await api.post('/auth/login', { 
      username: typeof username === 'string' ? username : username?.username, 
      password 
    });

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
  
const hasRole = (role) => {
    if (!user) return false;
    
    // Check if user.roles is an array
    if (Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    
    // Check if user.roles is a string (e.g. "official" or "super_admin")
    if (typeof user.roles === 'string') {
      return user.roles.split(',').map((r) => r.trim()).includes(role);
    }
    
    // Fallback to singular user.role property if it exists
    return user.role === role;
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