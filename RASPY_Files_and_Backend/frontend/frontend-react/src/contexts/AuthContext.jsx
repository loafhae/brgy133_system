import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import MfaStepUpDialog from '../components/MfaStepUpDialog';

const AuthContext = createContext(null);
const LAST_ACTIVITY_KEY = 'lastUserActivity';
const IDLE_TIMEOUT_KEY = 'idleTimeoutMinutes';
const ABSOLUTE_TIMEOUT_KEY = 'absoluteTimeoutMinutes';
const LOGIN_TIME_KEY = 'sessionLoginTime';
const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(() => {
    const storedTimeout = Number(localStorage.getItem(IDLE_TIMEOUT_KEY));
    return storedTimeout > 0 ? storedTimeout * 60 * 1000 : DEFAULT_IDLE_TIMEOUT_MS;
  });
  const [absoluteTimeoutMs, setAbsoluteTimeoutMs] = useState(() => {
    const storedTimeout = Number(localStorage.getItem(ABSOLUTE_TIMEOUT_KEY));
    return storedTimeout > 0 ? storedTimeout * 60 * 1000 : DEFAULT_ABSOLUTE_TIMEOUT_MS;
  });

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(IDLE_TIMEOUT_KEY);
    localStorage.removeItem(ABSOLUTE_TIMEOUT_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
    localStorage.removeItem('sessionActive');
    setUser(null);
  }, []);

  // Fetch current user on initial load if token exists
  useEffect(() => {
    const handleSessionExpired = () => clearSession();
    const handleStorageChange = (event) => {
      if (event.key !== 'sessionActive') return;
      if (!event.newValue) {
        clearSession();
        return;
      }
      setLoading(true);
      api.get('/auth/me').then((res) => {
        setUser(res.data);
        const idleMinutes = Number(localStorage.getItem(IDLE_TIMEOUT_KEY)) || 15;
        const absoluteMinutes = Number(localStorage.getItem(ABSOLUTE_TIMEOUT_KEY)) || 480;
        setIdleTimeoutMs(idleMinutes * 60 * 1000);
        setAbsoluteTimeoutMs(absoluteMinutes * 60 * 1000);
      }).catch(() => {
        clearSession();
      }).finally(() => {
        setLoading(false);
      });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('storage', handleStorageChange);

    if (!localStorage.getItem('sessionActive')) {
      setLoading(false);
      return () => {
        window.removeEventListener('auth:session-expired', handleSessionExpired);
        window.removeEventListener('storage', handleStorageChange);
      };
    }

    api.get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('sessionActive', '1');
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearSession]);

  const login = async (usernameOrObj, passwordParam, requiredRoleParam) => {
    let username = usernameOrObj;
    let password = passwordParam;
    let requiredRole = requiredRoleParam;

    // Safety unwrap if an object or event was passed by accident
    if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
      username = usernameOrObj.username?.username || usernameOrObj.username;
      password = usernameOrObj.password || passwordParam;
      requiredRole = usernameOrObj.requiredRole || usernameOrObj.required_role || requiredRoleParam;
    }

    const payload = { 
      username: typeof username === 'string' ? username : username?.username, 
      password 
    };
    if (requiredRole) {
      payload.required_role = requiredRole;
    }

    const { data } = await api.post('/auth/login', payload);

    const now = Date.now();
    const timeoutMinutes = data.idle_timeout_minutes || 15;
    const absoluteMinutes = data.absolute_timeout_minutes || 480;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    localStorage.setItem(LOGIN_TIME_KEY, String(now));
    localStorage.setItem(IDLE_TIMEOUT_KEY, String(timeoutMinutes));
    localStorage.setItem(ABSOLUTE_TIMEOUT_KEY, String(absoluteMinutes));
    localStorage.setItem('sessionActive', '1');
    setIdleTimeoutMs(timeoutMinutes * 60 * 1000);
    setAbsoluteTimeoutMs(absoluteMinutes * 60 * 1000);
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
    return userRes.data;
  };

  const logoutCookieSession = useCallback(() => {
    api.post('/auth/logout').catch((error) => {
      if (error.response?.status !== 401) {
        console.warn('Could not revoke the server session during logout.', error);
      }
    });
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    if (!user) return undefined;

    let timeoutId;
    let lastHeartbeatAt = Date.now();
    let lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now();
    let lastStoredActivityAt = lastActivityAt;

    const checkIdleTimeout = () => {
      const remaining = idleTimeoutMs - (Date.now() - lastActivityAt);
      const loginTime = Number(localStorage.getItem(LOGIN_TIME_KEY)) || Date.now();
      const absoluteRemaining = absoluteTimeoutMs - (Date.now() - loginTime);
      if (remaining <= 0 || absoluteRemaining <= 0) {
        logoutCookieSession();
        return;
      }
      timeoutId = window.setTimeout(checkIdleTimeout, Math.min(remaining, absoluteRemaining));
    };

    const recordActivity = () => {
      const now = Date.now();
      lastActivityAt = now;
      if (now - lastStoredActivityAt >= 1000) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        lastStoredActivityAt = now;
      }
      window.clearTimeout(timeoutId);
      checkIdleTimeout();

      if (now - lastHeartbeatAt >= 30 * 1000) {
        lastHeartbeatAt = now;
        api.post('/auth/activity').catch((error) => {
          if (error.response?.status !== 401) {
            console.warn('Could not refresh the active server session.', error);
          }
        });
      }
    };

    const checkOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timeoutId);
        checkIdleTimeout();
      }
    };

    const handleActivityStorage = (event) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        lastActivityAt = Number(event.newValue) || Date.now();
        lastStoredActivityAt = lastActivityAt;
        window.clearTimeout(timeoutId);
        checkIdleTimeout();
      }
    };

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
    checkIdleTimeout();
    document.addEventListener('pointerdown', recordActivity);
    document.addEventListener('pointermove', recordActivity);
    document.addEventListener('keydown', recordActivity);
    document.addEventListener('wheel', recordActivity);
    document.addEventListener('touchstart', recordActivity);
    document.addEventListener('touchmove', recordActivity);
    document.addEventListener('visibilitychange', checkOnVisibility);
    window.addEventListener('storage', handleActivityStorage);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('pointerdown', recordActivity);
      document.removeEventListener('pointermove', recordActivity);
      document.removeEventListener('keydown', recordActivity);
      document.removeEventListener('wheel', recordActivity);
      document.removeEventListener('touchstart', recordActivity);
      document.removeEventListener('touchmove', recordActivity);
      document.removeEventListener('visibilitychange', checkOnVisibility);
      window.removeEventListener('storage', handleActivityStorage);
    };
  }, [absoluteTimeoutMs, idleTimeoutMs, logoutCookieSession, user]);
  
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
    <AuthContext.Provider value={{ user, loading, login, logout: logoutCookieSession, hasRole, updateProfilePic, updateUser }}>
      {children}
      <MfaStepUpDialog />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}