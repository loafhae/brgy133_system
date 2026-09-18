import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordRecovery from './pages/PasswordRecovery';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import Users from './pages/Users';
import Announcements from './pages/Announcements';
import Residents from './pages/Residents';
import Feedback from './pages/Feedback';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import DetectionLogs from './pages/DetectionLogs';
import Settings from './pages/Settings';

// Helper component to route "/" dynamically based on user role
function DynamicDashboard() {
  const { hasRole } = useAuth();
  if (hasRole('official')) {
    return <OfficialDashboard />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication & Recovery Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />

          {/* Protected Change Password Checkpoint */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          {/* Main Protected Routes for Super Admin & Officials */}
          <Route element={<ProtectedRoute roles={['super_admin', 'official']} />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DynamicDashboard />} />
              <Route path="residents" element={<Residents />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="reports" element={<Reports />} />
              <Route path="activity" element={<ActivityLogs />} />
              <Route path="detection-logs" element={<DetectionLogs />} />
            </Route>
          </Route>

          {/* Super Admin Only Routes */}
          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}