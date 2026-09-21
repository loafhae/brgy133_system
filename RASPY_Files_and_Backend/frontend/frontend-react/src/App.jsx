import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordRecovery from './pages/PasswordRecovery';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import OfficialDashboard from './pages/OfficialDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import Users from './pages/Users';
import Announcements from './pages/Announcements';
import ResidentAnnouncements from './pages/ResidentAnnouncements';
import Residents from './pages/Residents';
import Feedback from './pages/Feedback';
import ResidentFeedback from './pages/ResidentFeedback';
import ResidentGarbageAlerts from './pages/ResidentGarbageAlerts';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import ResidentActivityHistory from './pages/ResidentActivityHistory';
import DetectionLogs from './pages/DetectionLogs';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Dynamically route Dashboard based on user role
function DynamicDashboard() {
  const { hasRole } = useAuth();
  if (hasRole('super_admin')) {
    return <Dashboard />;
  }
  if (hasRole('official')) {
    return <OfficialDashboard />;
  }
  return <ResidentDashboard />;
}

// Dynamically route Announcements (Official management vs Resident feed)
function DynamicAnnouncements() {
  const { hasRole } = useAuth();
  if (hasRole('super_admin', 'official')) {
    return <Announcements />;
  }
  return <ResidentAnnouncements />;
}

// Dynamically route Feedback (Official assessment vs Resident submission)
function DynamicFeedback() {
  const { hasRole } = useAuth();
  if (hasRole('super_admin', 'official')) {
    return <Feedback />;
  }
  return <ResidentFeedback />;
}

// Dynamically route Activity (Super Admin/Official audit vs Resident timeline)
function DynamicActivity() {
  const { hasRole } = useAuth();
  if (hasRole('super_admin', 'official')) {
    return <ActivityLogs />;
  }
  return <ResidentActivityHistory />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Portal Landing */}
          <Route path="/" element={<Home />} />

          {/* Authentication & Password Recovery */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />

          {/* Change Password Flow */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          {/* Unified Protected Portal with Role-Dynamic Modules */}
          <Route element={<ProtectedRoute roles={['super_admin', 'official', 'resident']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DynamicDashboard />} />
              <Route path="/announcements" element={<DynamicAnnouncements />} />
              <Route path="/garbage-alerts" element={<ResidentGarbageAlerts />} />
              <Route path="/feedback" element={<DynamicFeedback />} />
              <Route path="/activity" element={<DynamicActivity />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Official & Super Admin Operations */}
          <Route element={<ProtectedRoute roles={['super_admin', 'official']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/reports" element={<Reports />} />
              <Route path="/detection-logs" element={<DetectionLogs />} />
            </Route>
          </Route>

          {/* Super Admin Restricted Control (FR1, FR2, FR13) */}
          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/users" element={<Users />} />
              <Route path="/residents" element={<Residents />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}