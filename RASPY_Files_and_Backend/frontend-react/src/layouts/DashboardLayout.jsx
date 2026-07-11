import { useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Person, Campaign,
  Feedback, Assessment, History, Settings, Logout, PhotoCamera,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <Dashboard />, roles: ['super_admin', 'official'] },
  { label: 'Users', path: '/users', icon: <People />, roles: ['super_admin'] },
  { label: 'Residents', path: '/residents', icon: <Person />, roles: ['super_admin'] },
  { label: 'Announcements', path: '/announcements', icon: <Campaign />, roles: ['official'] },
  { label: 'Feedback', path: '/feedback', icon: <Feedback />, roles: ['super_admin', 'official'] },
  { label: 'Activity Logs', path: '/activity', icon: <History />, roles: ['super_admin', 'official'] },
  { label: 'Reports', path: '/reports', icon: <Assessment />, roles: ['super_admin', 'official'] },
  { label: 'Settings', path: '/settings', icon: <Settings />, roles: ['super_admin'] },
];

export default function DashboardLayout() {
  const { user, logout, hasRole, updateProfilePic } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [picDialog, setPicDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState('');
  const fileRef = useRef(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/auth/upload-profile-pic', fd);
      updateProfilePic(data.profile_pic);
      setSnack('Profile picture updated');
      setPicDialog(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSnack(Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filteredItems = navItems.filter((item) =>
    item.roles.some((r) => hasRole(r))
  );

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Vision-Trak</Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.role === 'super_admin' ? 'Super Admin' : 'Barangay Official'}
        </Typography>
      </Box>
      <List>
        {filteredItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {filteredItems.find((i) => i.path === location.pathname)?.label || 'Admin Panel'}
          </Typography>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar src={user?.profile_pic} sx={{ bgcolor: 'primary.dark' }}>
              {!user?.profile_pic && user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.username}</Typography>
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); setPicDialog(true); }}>
              <ListItemIcon><PhotoCamera fontSize="small" /></ListItemIcon>
              Change Photo
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/login'); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Dialog open={picDialog} onClose={() => setPicDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            <Avatar src={user?.profile_pic} sx={{ width: 100, height: 100, bgcolor: 'primary.dark', fontSize: 40 }}>
              {!user?.profile_pic && user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Button variant="outlined" component="label">
              Choose Image
              <input type="file" hidden accept="image/*" ref={fileRef} onChange={() => setSnack('')} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPicDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
