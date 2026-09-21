import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  TextField,
  Chip,
  Divider,
  Tooltip,
  Badge as MuiBadge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Person,
  Campaign,
  Feedback,
  Assessment,
  History,
  Settings,
  Logout,
  PhotoCamera,
  Videocam,
  AccessTime,
  Notifications,
  LocalShipping,
  Shield,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

export default function DashboardLayout() {
  const { user, logout, hasRole, updateProfilePic, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [picDialog, setPicDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    contact: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState('');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const fileRef = useRef(null);

  // Realtime IoT Detection status for live banner indicator
  const [detectionStatus, setDetectionStatus] = useState({ status: 'idle', last_detection: null });

  // Realtime digital clock (Philippine Standard Time)
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll detection status
  useEffect(() => {
    const checkDetection = () => {
      api.get('/detection/status')
        .then((res) => {
          if (res.data) setDetectionStatus(res.data);
        })
        .catch(() => {});
    };
    checkDetection();
    const interval = setInterval(checkDetection, 10000);
    return () => clearInterval(interval);
  }, []);

  const drawerWidth = desktopCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  const displayName =
    user?.profile?.first_name && user?.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : user?.username || 'User';

  const roleLabel = hasRole('super_admin')
    ? 'Super Admin'
    : hasRole('official')
    ? 'Barangay Official'
    : 'Resident';

  // Role-specific navigation definitions strictly adhering to documentation.pdf (Table 3.1 & Figures 3.7.3, 3.9.3, 4.1.5)
  const getNavItems = () => {
    if (hasRole('super_admin')) {
      return [
        {
          category: 'CORE PORTAL',
          items: [
            { label: 'Dashboard', path: '/dashboard', icon: <Dashboard fontSize="small" /> },
            { label: 'User Management', path: '/users', icon: <Person fontSize="small" /> },
            { label: 'Residents Record', path: '/residents', icon: <People fontSize="small" /> },
            { label: 'Feedback', path: '/feedback', icon: <Feedback fontSize="small" /> },
            { label: 'System Settings', path: '/settings', icon: <Settings fontSize="small" /> },
          ],
        },
        {
          category: 'MONITORING & REPORTS',
          items: [
            { label: 'CCTV Detection Logs', path: '/detection-logs', icon: <Videocam fontSize="small" /> },
            { label: 'Residents Activity', path: '/activity', icon: <History fontSize="small" /> },
            { label: 'Summary Reports', path: '/reports', icon: <Assessment fontSize="small" /> },
          ],
        },
      ];
    }

    if (hasRole('official')) {
      return [
        {
          category: 'OFFICIAL OPERATIONS',
          items: [
            { label: 'Dashboard', path: '/dashboard', icon: <Dashboard fontSize="small" /> },
            { label: 'Announcement Management', path: '/announcements', icon: <Campaign fontSize="small" /> },
            { label: 'Residents Activity', path: '/activity', icon: <History fontSize="small" /> },
            { label: 'Summary Reports', path: '/reports', icon: <Assessment fontSize="small" /> },
            { label: 'Feedback / Inquiries', path: '/feedback', icon: <Feedback fontSize="small" /> },
            { label: 'CCTV Detection Logs', path: '/detection-logs', icon: <Videocam fontSize="small" /> },
          ],
        },
      ];
    }

    // Default Resident Portal (Figure 4.1.5 & 4.2.2)
    return [
      {
        category: 'RESIDENT SERVICES',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: <Dashboard fontSize="small" /> },
          { label: 'Announcements', path: '/announcements', icon: <Campaign fontSize="small" /> },
          { label: 'Garbage Alerts', path: '/garbage-alerts', icon: <LocalShipping fontSize="small" /> },
          { label: 'Activity History', path: '/activity', icon: <History fontSize="small" /> },
          { label: 'Feedback', path: '/feedback', icon: <Feedback fontSize="small" /> },
        ],
      },
    ];
  };

  const navGroups = getNavItems();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/auth/upload-profile-pic', fd);
      updateProfilePic(data.profile_pic);
      setSnack('Profile picture updated successfully');
      setPicDialog(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSnack(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profileForm);
      updateUser({ profile: profileForm });
      setSnack('Profile updated successfully');
      setProfileDialog(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSnack(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const isTruckDetected = detectionStatus?.status === 'detected';

  const renderDrawerContent = (forceExpanded = false) => {
    const expanded = forceExpanded || !desktopCollapsed;
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#ffffff',
          overflowX: 'hidden',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderBottom: '1px solid #e4e4e7',
            minHeight: 64,
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Barangay 133 Logo"
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                p: 0.2,
                border: '2px solid #990000',
                bgcolor: '#ffffff',
                flexShrink: 0,
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {expanded && (
              <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#990000', lineHeight: 1.15, fontSize: '0.95rem' }}>
                  BARANGAY 133
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.72rem', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  Tondo • Vision-Trak
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* User Persona & Role Pill */}
        <Box
          sx={{
            px: expanded ? 2 : 1,
            py: 1.25,
            bgcolor: '#fafafa',
            borderBottom: '1px solid #e4e4e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a', flexShrink: 0 }} />
            {expanded && (
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f3f46', whiteSpace: 'nowrap' }}>
                {roleLabel}
              </Typography>
            )}
          </Box>
          {expanded && (
            <Chip
              label={user?.username || 'User'}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f4f4f5', color: '#18181b' }}
            />
          )}
        </Box>

        {/* Navigation Items */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.2, py: 2 }}>
          {navGroups.map((group) => (
            <Box key={group.category} sx={{ mb: 2.5 }}>
              {expanded ? (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1.5,
                    mb: 0.75,
                    display: 'block',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#a1a1aa',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {group.category}
                </Typography>
              ) : (
                <Divider sx={{ my: 1, mx: 1, borderColor: '#f4f4f5' }} />
              )}

              <List disablePadding>
                {group.items.map((item) => {
                  const active = isCurrentPath(item.path);
                  return (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                      <Tooltip title={!expanded ? item.label : ''} placement="right" arrow>
                        <ListItemButton
                          selected={active}
                          onClick={() => {
                            navigate(item.path);
                            setMobileOpen(false);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            px: expanded ? 1.5 : 0,
                            justifyContent: expanded ? 'initial' : 'center',
                            bgcolor: active ? '#990000 !important' : 'transparent',
                            color: active ? '#ffffff !important' : '#3f3f46',
                            fontWeight: active ? 800 : 500,
                            minHeight: 44,
                            '&:hover': {
                              bgcolor: active ? '#990000' : '#f4f4f5',
                              color: active ? '#ffffff' : '#990000',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: expanded ? 1.75 : 0,
                              justifyContent: 'center',
                              color: active ? '#ffffff !important' : '#71717a',
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          {expanded && (
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                fontSize: '0.86rem',
                                fontWeight: active ? 700 : 600,
                                whiteSpace: 'nowrap',
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* Red Logout Control Button matching Figures 3.7.3 - 4.2.2 */}
        <Box sx={{ p: 2, borderTop: '1px solid #e4e4e7' }}>
          {expanded ? (
            <Button
              variant="contained"
              fullWidth
              startIcon={<Logout />}
              onClick={() => setLogoutConfirmOpen(true)}
              sx={{
                py: 1.1,
                bgcolor: '#dc2626',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: 2,
                letterSpacing: 0.5,
                '&:hover': { bgcolor: '#b91c1c' },
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
              }}
            >
              LOGOUT
            </Button>
          ) : (
            <Tooltip title="Logout" placement="right" arrow>
              <IconButton
                size="small"
                onClick={() => setLogoutConfirmOpen(true)}
                sx={{
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  bgcolor: '#fef2f2',
                  '&:hover': { bgcolor: '#fee2e2' },
                }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa', flexDirection: 'column' }}>
      {/* Top Banner - Time Only */}
      <Box
        sx={{
          bgcolor: '#730000',
          color: '#ffffff',
          py: 0.5,
          px: 2,
          fontSize: '0.72rem',
          borderBottom: '1px solid #5a0000',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          position: 'sticky',
          top: 0,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: 13, color: '#fde047' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, color: '#fef08a' }}>
            Philippine Standard Time (PST): {currentTime || '...'}
          </Typography>
        </Box>
      </Box>

      {/* Main Container with App Bar and Drawer */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Main AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
            mt: '29px', // Height of the sticky GovPH top banner
            bgcolor: '#ffffff',
            color: '#18181b',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid #e4e4e7',
            transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ minHeight: '60px', px: { xs: 2, sm: 3 } }}>
            {/* Mobile Hamburger / Desktop Collapse Toggle */}
            <Tooltip title={desktopCollapsed ? 'Expand Menu' : 'Collapse Menu'}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => {
                  if (window.innerWidth < 900) {
                    setMobileOpen(!mobileOpen);
                  } else {
                    setDesktopCollapsed(!desktopCollapsed);
                  }
                }}
                sx={{ mr: 2, color: '#52525b', '&:hover': { bgcolor: '#f4f4f5', color: '#990000' } }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>

            {/* Personalized Welcome Header (Figures 3.7.3, 3.9.2, 4.1.5: "Welcome! Juan Dela Cruz") */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '0.95rem', sm: '1.15rem' },
                  color: '#18181b',
                  lineHeight: 1.2,
                }}
              >
                Welcome!{' '}
                <Box component="span" sx={{ color: '#990000' }}>
                  {displayName}
                </Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 500 }}>
                Barangay 133 Portal • {roleLabel}
              </Typography>
            </Box>

            {/* Live Realtime IoT Detection Indicator Pill */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
              <Chip
                icon={
                  <LocalShipping
                    sx={{
                      fontSize: '16px !important',
                      color: isTruckDetected ? '#ffffff !important' : '#16a34a !important',
                    }}
                  />
                }
                label={isTruckDetected ? 'TRUCK DETECTED' : 'IOT ACTIVE'}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  bgcolor: isTruckDetected ? '#dc2626' : '#dcfce7',
                  color: isTruckDetected ? '#ffffff' : '#166534',
                  boxShadow: isTruckDetected ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none',
                }}
              />
            </Box>

            {/* Notification Bell (Figures 3.7.3 & 4.1.5) */}
            <Tooltip title="View Notifications">
              <IconButton
                onClick={() => navigate(hasRole('resident') ? '/garbage-alerts' : '/detection-logs')}
                sx={{ mr: 1, color: '#52525b' }}
              >
                <MuiBadge color="error" variant="dot" invisible={!isTruckDetected}>
                  <Notifications />
                </MuiBadge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar & Dropdown */}
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, border: '2px solid #e4e4e7' }}>
              <Avatar
                src={user?.profile_pic}
                sx={{ width: 34, height: 34, bgcolor: '#990000', fontSize: '0.85rem', fontWeight: 700 }}
              >
                {!user?.profile_pic && user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  minWidth: 220,
                  mt: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f4f4f5' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b' }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#990000', fontWeight: 700 }}>
                  {roleLabel}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate('/profile');
                }}
              >
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setPicDialog(true);
                }}
              >
                <ListItemIcon><PhotoCamera fontSize="small" /></ListItemIcon>
                Change Photo
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setLogoutConfirmOpen(true);
                }}
              >
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                <Typography color="error" variant="body2" sx={{ fontWeight: 700 }}>
                  Log Out
                </Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Side Navigation Drawer */}
        <Box
          component="nav"
          sx={{
            width: { md: drawerWidth },
            flexShrink: { md: 0 },
            transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Mobile Temporary Drawer (Figure 4.1.5 & 4.2.2) */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: EXPANDED_WIDTH, boxSizing: 'border-box' },
            }}
          >
            {renderDrawerContent(true)}
          </Drawer>

          {/* Desktop Permanent Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                borderRight: '1px solid #e4e4e7',
                top: '29px',
                height: 'calc(100% - 29px)',
                transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            }}
            open
          >
            {renderDrawerContent()}
          </Drawer>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            mt: '89px', // 29px GovPH strip + 60px AppBar
            transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: 'calc(100vh - 89px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Outlet />

          {/* Official Barangay 133 Footer (Figures 3.7.1 - 4.2.2) */}
          <Box
            component="footer"
            sx={{
              mt: 6,
              pt: 3,
              pb: 2,
              borderTop: '1px solid #e4e4e7',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#52525b', fontWeight: 600 }}>
              Barangay 133 Hall • Zone 11, District II, Tondo, Manila
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', mt: 0.5, display: 'block' }}>
              Community | Cleanliness | Environment • Vision-Trak IoT Monitoring
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={logoutConfirmOpen}
        title="Session Termination"
        message="Are you sure you want to LOGOUT of Barangay 133 portal?"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
          navigate('/login');
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      {/* Profile Picture Upload Modal */}
      <Dialog open={picDialog} onClose={() => setPicDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a clear photo for your official barangay account profile.
          </Typography>
          <input type="file" ref={fileRef} accept="image/*" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPicDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' }, fontWeight: 700 }}
          >
            {uploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}