import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, TextField, Chip,
  Divider, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Person, Campaign,
  Feedback, Assessment, History, Settings, Logout, PhotoCamera, Videocam,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;

const navGroups = [
  {
    category: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard fontSize="small" />, roles: ['super_admin', 'official'] },
    ],
  },
  {
    category: 'COMMUNITY & SERVICES',
    items: [
      { label: 'Resident Records', path: '/residents', icon: <People fontSize="small" />, roles: ['super_admin'] },
      { label: 'Announcements', path: '/announcements', icon: <Campaign fontSize="small" />, roles: ['official', 'super_admin'] },
      { label: 'Resident Feedback', path: '/feedback', icon: <Feedback fontSize="small" />, roles: ['super_admin', 'official'] },
    ],
  },
  {
    category: 'MONITORING & IOT',
    items: [
      { label: 'CCTV Detection Logs', path: '/detection-logs', icon: <Videocam fontSize="small" />, roles: ['official', 'super_admin'] },
      { label: 'Resident Activity', path: '/activity', icon: <History fontSize="small" />, roles: ['official', 'super_admin'] },
      { label: 'Official Reports', path: '/reports', icon: <Assessment fontSize="small" />, roles: ['official', 'super_admin'] },
    ],
  },
  {
    category: 'ADMINISTRATION',
    items: [
      { label: 'Users Management', path: '/users', icon: <Person fontSize="small" />, roles: ['super_admin'] },
      { label: 'System Settings', path: '/settings', icon: <Settings fontSize="small" />, roles: ['super_admin'] },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout, hasRole, updateProfilePic, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [picDialog, setPicDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', first_name: '', last_name: '', middle_name: '', contact: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState('');
  const fileRef = useRef(null);

  const drawerWidth = desktopCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

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

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

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
                width: 38,
                height: 38,
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
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#990000', lineHeight: 1.15, fontSize: '0.92rem' }}>
                  BARANGAY 133
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.72rem', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  Tondo • Vision-Trak
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Role Pill Banner */}
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
          <Tooltip title={user?.role === 'super_admin' ? 'Super Admin' : 'Barangay Official'} placement="right" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669', flexShrink: 0 }} />
              {expanded && (
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#3f3f46', whiteSpace: 'nowrap' }}>
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Barangay Official'}
                </Typography>
              )}
            </Box>
          </Tooltip>
          {expanded && (
            <Chip
              label={user?.username || 'User'}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f4f4f5', color: '#18181b' }}
            />
          )}
        </Box>

        {/* Navigation Groups */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', px: 1, py: 2 }}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.some((r) => hasRole(r))
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={group.category} sx={{ mb: 2 }}>
                {expanded ? (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      mb: 0.75,
                      display: 'block',
                      fontSize: '0.68rem',
                      fontWeight: 700,
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
                  {visibleItems.map((item) => {
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
                              transition: 'all 0.15s ease',
                              bgcolor: active ? '#fef2f2 !important' : 'transparent',
                              color: active ? '#990000' : '#3f3f46',
                              fontWeight: active ? 700 : 500,
                              minHeight: 44,
                              '&:hover': {
                                bgcolor: active ? '#fef2f2' : '#f4f4f5',
                                color: '#990000',
                              },
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 0,
                                mr: expanded ? 1.75 : 0,
                                justifyContent: 'center',
                                color: active ? '#990000' : '#71717a',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            {expanded && (
                              <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                  fontSize: '0.86rem',
                                  fontWeight: active ? 700 : 500,
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
            );
          })}
        </Box>

        {/* Drawer Footer: Sign Out */}
        <Box sx={{ p: expanded ? 2 : 1, borderTop: '1px solid #e4e4e7', bgcolor: '#fafafa', display: 'flex', justifyContent: 'center' }}>
          {expanded ? (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Logout fontSize="small" />}
              onClick={() => { logout(); navigate('/login'); }}
              sx={{
                fontSize: '0.82rem',
                fontWeight: 700,
                borderColor: '#fecaca',
                color: '#990000',
                '&:hover': { bgcolor: '#fef2f2', borderColor: '#990000' },
              }}
            >
              Sign Out
            </Button>
          ) : (
            <Tooltip title="Sign Out" placement="right" arrow>
              <IconButton
                size="small"
                onClick={() => { logout(); navigate('/login'); }}
                sx={{
                  color: '#990000',
                  border: '1px solid #fecaca',
                  '&:hover': { bgcolor: '#fef2f2' },
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: '#18181b',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
          borderBottom: '1px solid #e4e4e7',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ minHeight: '64px', px: { xs: 2, sm: 3 } }}>
          {/* Hamburger Menu Button (toggles mobile drawer on mobile, collapses/expands sidebar on desktop) */}
          <Tooltip title={desktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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

          {/* Left Title */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: '#71717a', display: 'block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.5 }}>
              BARANGAY 133, TONDO, MANILA
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' }, color: '#990000', lineHeight: 1.2 }}>
              Management Console
            </Typography>
          </Box>

          {/* Realtime Clock */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, mr: 2.5, color: '#52525b' }}>
            <AccessTime sx={{ fontSize: 16, color: '#990000' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
              PST: {currentTime || '...'}
            </Typography>
          </Box>

          {/* Profile Menu Trigger */}
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
                minWidth: 200,
                mt: 1.5,
                borderRadius: 2,
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f4f4f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b' }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Barangay Official'}
              </Typography>
            </Box>
            <MenuItem onClick={() => {
              setAnchorEl(null);
              setProfileDialog(true);
              setProfileForm({
                username: user?.username || '',
                first_name: user?.profile?.first_name || '',
                last_name: user?.profile?.last_name || '',
                middle_name: user?.profile?.middle_name || '',
                contact: user?.profile?.contact || '',
              });
            }}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Edit Profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); setPicDialog(true); }}>
              <ListItemIcon><PhotoCamera fontSize="small" /></ListItemIcon>
              Change Photo
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/login'); }}>
              <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
              <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>Log Out</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Mobile Temporary Drawer */}
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

        {/* Desktop Permanent Drawer (Collapsible via Hamburger, Non-Hoverable) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid #e4e4e7',
              overflowX: 'hidden',
              transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          }}
          open
        >
          {renderDrawerContent()}
        </Drawer>
      </Box>

      {/* Clean Minimalist Main Canvas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: '#fafafa',
          boxSizing: 'border-box',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box sx={{ maxWidth: '1440px', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Change Profile Picture Dialog */}
      <Dialog open={picDialog} onClose={() => setPicDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#990000' }}>Change Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <Avatar src={user?.profile_pic} sx={{ width: 90, height: 90, bgcolor: '#990000', fontSize: 36, fontWeight: 700 }}>
              {!user?.profile_pic && user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Button variant="outlined" component="label" size="small" sx={{ borderColor: '#990000', color: '#990000' }}>
              Choose Photo
              <input type="file" hidden accept="image/*" ref={fileRef} onChange={() => setSnack('')} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPicDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading} sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' } }}>
            {uploading ? 'Uploading...' : 'Save Photo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={profileDialog} onClose={() => setProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#990000' }}>Edit Account Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Username"
              fullWidth
              size="small"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            />
            <TextField
              label="First Name"
              fullWidth
              size="small"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
            />
            <TextField
              label="Middle Name"
              fullWidth
              size="small"
              value={profileForm.middle_name}
              onChange={(e) => setProfileForm({ ...profileForm, middle_name: e.target.value })}
            />
            <TextField
              label="Last Name"
              fullWidth
              size="small"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
            />
            <TextField
              label="Contact Number"
              fullWidth
              size="small"
              value={profileForm.contact}
              onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProfileDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={savingProfile}
            sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' } }}
            onClick={async () => {
              setSavingProfile(true);
              try {
                const { data } = await api.put('/auth/profile', profileForm);
                updateUser(data);
                setSnack('Profile details updated successfully');
                setProfileDialog(false);
              } catch (err) {
                const d = err.response?.data?.detail;
                setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving profile');
              } finally {
                setSavingProfile(false);
              }
            }}
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  );
}