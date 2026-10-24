import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Chip,
  Tooltip, useTheme, useMediaQuery, Stack
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Campaign,
  Feedback, Assessment, History, Settings, Logout, PhotoCamera, Videocam,
  Person, ChevronLeft, LocalShipping
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const DRAWER_WIDTH = 270;

const navGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, roles: ['super_admin', 'official'] },
    ],
  },
  {
    title: 'Management & Records',
    items: [
      { label: 'Users Management', path: '/users', icon: <People />, roles: ['super_admin'] },
      { label: 'Residents Masterlist', path: '/residents', icon: <Person />, roles: ['super_admin', 'official'] },
      { label: 'Official Announcements', path: '/announcements', icon: <Campaign />, roles: ['super_admin', 'official'] },
      { label: 'Citizen Feedback', path: '/feedback', icon: <Feedback />, roles: ['super_admin', 'official'] },
    ],
  },
  {
    title: 'Monitoring & Intelligence',
    items: [
      { label: 'AI Detection Logs', path: '/detection-logs', icon: <Videocam />, roles: ['super_admin', 'official'] },
      { label: 'Official Reports', path: '/reports', icon: <Assessment />, roles: ['super_admin', 'official'] },
      { label: 'System Logs', path: '/system-logs', icon: <Assessment />, roles: ['super_admin'] },
      { label: 'Activity Logs', path: '/activity', icon: <History />, roles: ['super_admin', 'official'] },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'System Settings', path: '/settings', icon: <Settings />, roles: ['super_admin', 'official'] },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout, hasRole, updateProfilePic } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Responsive sidebar toggles (Desktop & Mobile)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const [anchorEl, setAnchorEl] = useState(null);
  const [picDialog, setPicDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snack, setSnack] = useState('');

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnack('Please select an image first.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);

      const { data } = await api.post('/auth/upload-profile-pic', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      updateProfilePic(data.profile_pic);
      setSnack('Profile picture updated successfully!');
      setPicDialog(false);
      setSelectedFile(null);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSnack(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isSuperAdmin = hasRole('super_admin');
  const isOfficial = hasRole('official');
  const effectiveDrawerWidth = !isMobile && desktopOpen ? DRAWER_WIDTH : 0;

  // Find active item label for top bar
  let currentLabel = 'Dashboard';
  for (const group of navGroups) {
    const found = group.items.find((item) => item.path === location.pathname);
    if (found) {
      currentLabel = found.label;
      break;
    }
  }

  const drawerContent = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #111a10 0%, #162415 50%, #0d150c 100%)',
      color: '#f8fafc',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    }}>
      {/* Brand Header */}
      <Box sx={{
        px: 2.5,
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Barangay Seal"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(120, 159, 100, 0.6)',
              boxShadow: '0 0 16px rgba(88, 125, 70, 0.35)',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1.15, fontSize: '1rem' }}>
              BARANGAY 133
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
              <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                VISION-TRAK
              </Typography>
            </Box>
          </Box>
        </Box>

        <Tooltip title="Collapse Sidebar">
          <IconButton
            size="small"
            onClick={handleToggleSidebar}
            sx={{
              color: '#94a3b8',
              bgcolor: 'rgba(255,255,255,0.04)',
              borderRadius: 2,
              p: 0.7,
              border: '1px solid rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: '#ffffff' }
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Role Indicator Card */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{
          px: 1.8,
          py: 1.2,
          borderRadius: 2.5,
          bgcolor: isSuperAdmin ? 'rgba(185, 54, 54, 0.16)' : (isOfficial ? 'rgba(88, 125, 70, 0.22)' : 'rgba(59, 130, 246, 0.16)'),
          border: `1px solid ${isSuperAdmin ? 'rgba(239, 68, 68, 0.35)' : (isOfficial ? 'rgba(120, 159, 100, 0.4)' : 'rgba(96, 165, 250, 0.35)')}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Authorized Portal
            </Typography>
            <Typography variant="body2" sx={{
              fontWeight: 750,
              color: isSuperAdmin ? '#fca5a5' : '#bbf7d0',
              fontSize: '0.82rem',
            }}>
              {isSuperAdmin ? 'Super Administrator' : 'Barangay Official'}
            </Typography>
          </Box>
          <Chip
            label="SECURE"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              bgcolor: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
            }}
          />
        </Box>
      </Box>

      {/* Categorized Navigation List */}
      <List sx={{ px: 1.8, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.some((r) => hasRole(r))
          );
          if (visibleItems.length === 0) return null;

          return (
            <Box key={gIdx} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.5,
                  mb: 0.8,
                  display: 'block',
                  color: '#64748b',
                  fontWeight: 750,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </Typography>

              {visibleItems.map((item) => {
                const isSelected = location.pathname === item.path;
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      sx={{
                        borderRadius: 2.2,
                        px: 1.8,
                        py: 1.05,
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        bgcolor: isSelected ? '#587d46 !important' : 'transparent',
                        boxShadow: isSelected ? '0 4px 16px rgba(88, 125, 70, 0.45)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: isSelected ? '#587d46' : 'rgba(255, 255, 255, 0.06)',
                          color: '#ffffff',
                          transform: 'translateX(3px)',
                          '& .MuiListItemIcon-root': { color: '#ffffff' },
                        },
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: 36,
                        color: isSelected ? '#ffffff' : '#789f64',
                        transition: 'color 0.2s',
                        '& svg': { fontSize: '1.25rem' }
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.88rem',
                          fontWeight: isSelected ? 700 : 500,
                          letterSpacing: '0.01em',
                        }}
                      />
                      {isSelected && (
                        <Box sx={{
                          width: 4,
                          height: 16,
                          borderRadius: 2,
                          bgcolor: '#ffffff',
                          position: 'absolute',
                          right: 8,
                        }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </Box>
          );
        })}
      </List>

      {/* Quick Logout and Status at Bottom of Drawer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
        <Button
          fullWidth
          variant="text"
          startIcon={<Logout sx={{ color: '#94a3b8' }} />}
          onClick={() => { logout(); navigate('/login'); }}
          sx={{
            justifyContent: 'flex-start',
            color: '#94a3b8',
            px: 2,
            py: 1.1,
            borderRadius: 2,
            fontSize: '0.86rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(220, 38, 38, 0.15)',
              color: '#f87171',
              '& svg': { color: '#f87171' }
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top Glassmorphic Navigation Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${effectiveDrawerWidth}px)` },
          ml: { md: `${effectiveDrawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          color: '#0f172a',
          borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: '68px', px: { xs: 1.5, sm: 2.5, md: 3.5 } }}>
          {/* Universal Hamburger Toggle */}
          <Tooltip title={(!isMobile && desktopOpen) ? 'Collapse Sidebar (Full Screen View)' : 'Expand Sidebar'}>
            <IconButton
              color="inherit"
              edge="start"
              aria-label="Toggle navigation drawer"
              onClick={handleToggleSidebar}
              sx={{
                mr: { xs: 1.2, sm: 2.2 },
                color: '#334155',
                bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 2.2,
                p: { xs: 0.8, sm: 0.9 },
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: '#e2e8f0',
                  color: '#0f172a',
                  transform: 'scale(1.04)',
                },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.8 } }}>
            <Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: { xs: '1rem', sm: '1.18rem' },
                  letterSpacing: '-0.01em',
                  maxWidth: { xs: '160px', sm: 'none' }
                }}
              >
                {currentLabel}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.74rem', display: { xs: 'none', sm: 'block' } }}>
                Brgy. 133 Smart Monitoring & Administration
              </Typography>
            </Box>
            <Chip
              label={isSuperAdmin ? 'Super Admin' : 'Barangay Official'}
              size="small"
              sx={{
                bgcolor: isSuperAdmin ? 'rgba(185, 54, 54, 0.1)' : 'rgba(88, 125, 70, 0.12)',
                color: isSuperAdmin ? '#b93636' : '#3f5d30',
                border: `1px solid ${isSuperAdmin ? 'rgba(185, 54, 54, 0.25)' : 'rgba(88, 125, 70, 0.25)'}`,
                fontWeight: 700,
                fontSize: '0.72rem',
                display: { xs: 'none', md: 'inline-flex' },
              }}
            />
          </Box>

          {/* User Profile Avatar and Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Account Settings">
              <IconButton
                aria-label="Open user account menu"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  p: 0.4,
                  border: '2px solid rgba(88, 125, 70, 0.35)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#587d46', transform: 'scale(1.05)' },
                }}
              >
                <Avatar src={user?.profile_pic} sx={{ width: 38, height: 38, bgcolor: '#587d46', fontSize: '0.92rem', fontWeight: 750 }}>
                  {!user?.profile_pic && (user?.username?.charAt(0).toUpperCase() || 'U')}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                width: 220,
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {isSuperAdmin ? 'System Super Admin' : (hasRole('official') ? 'Barangay Official' : 'Barangay Resident')}
              </Typography>
            </Box>
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }} sx={{ py: 1 }}>
              <ListItemIcon><Person fontSize="small" sx={{ color: '#475569' }} /></ListItemIcon>
              Profile Settings
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); setPicDialog(true); }} sx={{ py: 1 }}>
              <ListItemIcon><PhotoCamera fontSize="small" sx={{ color: '#475569' }} /></ListItemIcon>
              Change Photo
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/login'); }} sx={{ py: 1, color: '#dc2626' }}>
              <ListItemIcon><Logout fontSize="small" sx={{ color: '#dc2626' }} /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Change Photo Dialog */}
      <Dialog open={picDialog} onClose={() => { setPicDialog(false); setSelectedFile(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Change Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <Avatar
              src={selectedFile ? URL.createObjectURL(selectedFile) : user?.profile_pic}
              sx={{ width: 100, height: 100, bgcolor: '#587d46', fontSize: 40, border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {!user?.profile_pic && !selectedFile && user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Button variant="outlined" component="label" sx={{ borderRadius: 2, color: '#3f5d30', borderColor: '#789f64' }}>
              Choose Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setSnack('');
                  }
                }}
              />
            </Button>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setPicDialog(false); setSelectedFile(null); }} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !selectedFile} sx={{ borderRadius: 2 }}>
            {uploading ? 'Uploading...' : 'Save Picture'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />

      {/* Responsive Drawer View */}
      <Box component="nav">
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop persistent collapsible drawer */}
        <Drawer
          variant="persistent"
          open={desktopOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 'none',
              transition: theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Workspace Canvas (Smooth transition between boxed & full-screen modes) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2.5, md: 4 },
          mt: '68px',
          minHeight: 'calc(100vh - 68px)',
          bgcolor: '#f8fafc',
          boxSizing: 'border-box',
          width: { md: `calc(100% - ${effectiveDrawerWidth}px)` },
          ml: { md: `${effectiveDrawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ maxWidth: desktopOpen ? '1440px' : '100%', mx: 'auto', width: '100%', transition: 'max-width 0.25s ease-in-out' }}>
          <Outlet />

          {/* Admin Dashboard Civic & Compliance Footer */}
          <Box sx={{
            mt: 6,
            pt: 2.5,
            pb: 1,
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
              © {new Date().getFullYear()} Pamahalaang Barangay 133 • Lungsod ng Maynila • RA 10173 Compliant
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography variant="caption">
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', textDecoration: 'none', fontWeight: 650 }}>Privacy Policy</a>
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
              <Typography variant="caption">
                <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', textDecoration: 'none', fontWeight: 650 }}>Terms & Conditions</a>
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
              <Typography variant="caption">
                <a href="/cookie-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', textDecoration: 'none', fontWeight: 650 }}>Cookie Policy</a>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}