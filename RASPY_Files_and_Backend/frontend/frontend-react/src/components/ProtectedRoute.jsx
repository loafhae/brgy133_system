import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ roles: allowedRoles }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, safely normalize and verify user roles
  if (allowedRoles && allowedRoles.length > 0 && user) {
    let userRoles = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles;
    } else if (typeof user.roles === 'string') {
      userRoles = user.roles.split(',').map((r) => r.trim());
    } else if (user.role) {
      userRoles = [user.role];
    }

    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}