import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
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
import SystemLogs from './pages/SystemLogs';

// Legal & Compliance Pages
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import CookiePolicy from './pages/CookiePolicy';

// Components & Services
import CookieConsent from './components/CookieConsent';
import analytics from './services/analytics';

// Component to handle route change telemetry with user consent
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname);
    // Accessibility: scroll smoothly to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

// Helper component to route "/" dynamically based on official vs super admin
function DynamicDashboard() {
  const { user } = useAuth();
  
  let roles = [];
  if (Array.isArray(user?.roles)) {
    roles = user.roles;
  } else if (typeof user?.roles === 'string') {
    roles = user.roles.split(',').map((r) => r.trim());
  } else if (user?.role) {
    roles = [user.role];
  }

  // Official Dashboard for officials (unless super admin)
  if (roles.includes('official') && !roles.includes('super_admin')) {
    return <OfficialDashboard />;
  }
  
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Authentication & Registration Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />

          {/* Public Legal, Regulatory & Compliance Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* Protected Change Password Checkpoint */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          {/* Protected Barangay Administration Routes (Super Admin & Official) */}
          <Route element={<ProtectedRoute roles={['super_admin', 'official']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DynamicDashboard />} />
              <Route path="/residents" element={<Residents />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/detection-logs" element={<DetectionLogs />} />
              <Route path="/activity" element={<ActivityLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Super Admin Exclusive Management Routes */}
          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/users" element={<Users />} />
              <Route path="/system-logs" element={<SystemLogs />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Floating Privacy-First Cookie Consent Banner & Modal */}
        <CookieConsent />
      </AuthProvider>
    </BrowserRouter>
  );
}