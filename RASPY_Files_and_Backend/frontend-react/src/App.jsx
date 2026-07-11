import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Residents from './pages/Residents';
import Announcements from './pages/Announcements';
import Feedback from './pages/Feedback';
import Reports from './pages/Reports';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>
          <Route element={<ProtectedRoute roles={['super_admin', 'official']} />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="reports" element={<Reports />} />
              <Route path="activity" element={<ActivityLogs />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={['official']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="announcements" element={<Announcements />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="users" element={<Users />} />
              <Route path="residents" element={<Residents />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
