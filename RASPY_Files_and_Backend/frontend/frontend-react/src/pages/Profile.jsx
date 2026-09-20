import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, Avatar, Chip,
  Divider, Paper, Tabs, Tab, Stack, Alert, IconButton, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Snackbar,
} from '@mui/material';
import {
  Person, Security, Shield, PhotoCamera, Visibility, VisibilityOff,
  CheckCircle, Email, Phone, CalendarMonth, Badge, Lock, ArrowForward,
  Notifications, AssignmentTurnedIn, AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function Profile() {
  const { user, updateProfilePic, updateUser, hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Barangay Official';

  const [tab, setTab] = useState(0);
  const fileRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Personal profile form
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    contact: '',
    gender: '',
    birthday: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Sync profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        first_name: user.profile?.first_name || '',
        middle_name: user.profile?.middle_name || '',
        last_name: user.profile?.last_name || '',
        contact: user.profile?.contact || '',
        gender: user.profile?.gender || '',
        birthday: user.profile?.birthday || '',
      });
    }
  }, [user]);

  // Handle avatar photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnack({ open: true, message: 'Image size exceeds 5MB limit.', severity: 'error' });
      return;
    }

    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/auth/upload-profile-pic', fd);
      updateProfilePic(data.profile_pic);
      setSnack({ open: true, message: 'Profile photo updated successfully!', severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSnack({
        open: true,
        message: Array.isArray(detail) ? detail.map((e) => e.msg).join(', ') : detail || 'Failed to upload photo',
        severity: 'error',
      });
    } finally {
      setUploadingPic(false);
    }
  };

  // Handle profile form save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profileForm);
      updateUser(data);
      setSnack({ open: true, message: 'Profile details saved successfully!', severity: 'success' });
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack({
        open: true,
        message: Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error updating profile',
        severity: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setSnack({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const d = err.response?.data?.detail;
      setPasswordError(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = profileForm.first_name || profileForm.last_name
    ? `${profileForm.first_name} ${profileForm.last_name}`.trim()
    : user?.username || 'User';

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 1 }}>
      {/* Header Title */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, letterSpacing: 0.8, display: 'block' }}>
          BARANGAY 133, TONDO, MANILA • ACCOUNT MANAGEMENT
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#990000', mb: 0.5 }}>
          Profile &amp; Account Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your personal details, contact info, security credentials, and system access preferences.
        </Typography>
      </Box>

      {/* Hero Profile Banner Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: 3,
          border: '1px solid #e4e4e7',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Top Accent Bar */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#990000' }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3 }}>
          {/* Avatar with Camera Overlay */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.profile_pic}
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#990000',
                fontSize: '2.5rem',
                fontWeight: 800,
                border: '3px solid #fecaca',
                boxShadow: '0 4px 12px rgba(153, 0, 0, 0.15)',
              }}
            >
              {!user?.profile_pic && displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Tooltip title="Upload New Photo">
              <span>
                <IconButton
                  component="label"
                  disabled={uploadingPic}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: '#990000',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    p: 0.8,
                    '&:hover': { bgcolor: '#730000' },
                  }}
                >
                  {uploadingPic ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : <PhotoCamera sx={{ fontSize: 18 }} />}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" ref={fileRef} onChange={handlePhotoUpload} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* User Basic Info */}
          <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b' }}>
                {displayName}
              </Typography>
              <Chip
                label={roleLabel}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  bgcolor: isSuperAdmin ? '#fef2f2' : '#ecfdf5',
                  color: isSuperAdmin ? '#990000' : '#059669',
                  border: isSuperAdmin ? '1px solid #fecaca' : '1px solid #a7f3d0',
                }}
              />
              <Chip
                icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#059669' }} />}
                label="Active Account"
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#f4f4f5', color: '#52525b' }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              @{user?.username} • Barangay 133 Official System Access
            </Typography>

            {/* Quick Contact & Details Tags */}
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5 }}>
              {user?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#71717a', fontSize: '0.82rem' }}>
                  <Email sx={{ fontSize: 16, color: '#990000' }} />
                  <span>{user.email}</span>
                </Box>
              )}
              {profileForm.contact && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#71717a', fontSize: '0.82rem' }}>
                  <Phone sx={{ fontSize: 16, color: '#059669' }} />
                  <span>{profileForm.contact}</span>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#71717a', fontSize: '0.82rem' }}>
                <CalendarMonth sx={{ fontSize: 16, color: '#3f3f46' }} />
                <span>ID #{user?.user_id || 1}</span>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Profile Settings Navigation Tabs */}
      <Box sx={{ borderBottom: '1px solid #e4e4e7', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, newVal) => setTab(newVal)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#71717a',
              minHeight: 48,
              '&.Mui-selected': {
                color: '#990000',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#990000',
              height: 3,
            },
          }}
        >
          <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Personal Information" />
          <Tab icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" label="Security &amp; Password" />
          <Tab icon={<Shield sx={{ fontSize: 18 }} />} iconPosition="start" label="Role &amp; System Permissions" />
        </Tabs>
      </Box>

      {/* TAB 0: Personal Information Form */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 0.5 }}>
              Account Profile Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your community contact information, official legal name, and email communication preferences.
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: '#f4f4f5' }} />

          <form onSubmit={handleSaveProfile}>
            <Grid container spacing={2.5}>
              {/* Username */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  helperText="Unique login handle for Barangay 133 portal"
                  required
                />
              </Grid>

              {/* Email */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="Official Email Address"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  helperText="Used for system notifications and password recovery"
                  required
                />
              </Grid>

              {/* First Name */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="First Name"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  required
                />
              </Grid>

              {/* Middle Name */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Middle Name"
                  value={profileForm.middle_name}
                  onChange={(e) => setProfileForm({ ...profileForm, middle_name: e.target.value })}
                />
              </Grid>

              {/* Last Name */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Last Name"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  required
                />
              </Grid>

              {/* Contact Number */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Mobile Number"
                  placeholder="e.g. 09171234567"
                  value={profileForm.contact}
                  onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })}
                />
              </Grid>

              {/* Gender */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    label="Gender"
                    value={profileForm.gender || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <MenuItem value="">Not Specified</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Birthday */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={profileForm.birthday || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, birthday: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={savingProfile}
                sx={{
                  bgcolor: '#990000',
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#730000' },
                }}
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {/* TAB 1: Security & Password Management */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 0.5 }}>
              Change Account Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ensure your account stays secure by choosing a strong password that you do not use on other services.
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: '#f4f4f5' }} />

          {passwordError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handleChangePassword}>
            <Stack spacing={2.5} sx={{ maxWidth: 500 }}>
              <TextField
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                size="small"
                fullWidth
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrent(!showCurrent)} edge="end">
                        {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="New Password"
                type={showNew ? 'text' : 'password'}
                size="small"
                fullWidth
                required
                helperText="Must be at least 6 characters long"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNew(!showNew)} edge="end">
                        {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                size="small"
                fullWidth
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end">
                        {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingPassword}
                  sx={{
                    bgcolor: '#990000',
                    color: '#ffffff',
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#730000' },
                  }}
                >
                  {savingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      )}

      {/* TAB 2: Role & System Permissions Overview */}
      {tab === 2 && (
        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 0.5 }}>
              Assigned Role &amp; Access Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Summary of operational authority and access clearance granted to your account in Barangay 133.
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, borderColor: '#f4f4f5' }} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#fafafa', border: '1px solid #e4e4e7' }}>
                <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, textTransform: 'uppercase' }}>
                  Primary Account Role
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#990000', mt: 0.5, mb: 1 }}>
                  {roleLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                  {isSuperAdmin
                    ? 'As Super Admin, you have unrestricted administrative control over Barangay 133 systems, user management, IoT cameras, community advisories, and system configuration.'
                    : 'As a Barangay Official, you have full access to community operations, posting announcements, responding to resident feedback, monitoring IoT garbage collection, and viewing resident profiles.'}
                </Typography>
                <Chip
                  icon={<AdminPanelSettings sx={{ fontSize: '14px !important' }} />}
                  label="Role Verified by Barangay Executive"
                  size="small"
                  sx={{ bgcolor: '#ffffff', border: '1px solid #e4e4e7', fontWeight: 600, fontSize: '0.72rem' }}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b', mb: 2 }}>
                Granted Capabilities
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { title: 'Community Announcements', desc: 'Create, update, publish, and attach documents to public advisories.' },
                  { title: 'Vision-Trak IoT Camera Monitoring', desc: 'Live access to automated garbage truck detection events and logs.' },
                  { title: 'Resident Feedback & Suggestions', desc: 'Read and review messages submitted via the resident mobile app.' },
                  { title: 'Master Resident Directory', desc: 'Search and inspect registered resident household records.' },
                  { title: 'Official Reports & Activity Logs', desc: 'Inspect audit trail and export operational summaries.' },
                  ...(isSuperAdmin
                    ? [
                        { title: 'User Account Administration', desc: 'Create, edit, reset passwords, and assign roles to officials.' },
                        { title: 'System Settings & Backups', desc: 'Configure detection sensitivity, RTSP stream URLs, and database backups.' },
                      ]
                    : []),
                ].map((cap, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#fafafa', border: '1px solid #f4f4f5' }}>
                    <CheckCircle sx={{ color: '#059669', fontSize: 18, mt: 0.2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b', lineHeight: 1.2 }}>
                        {cap.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cap.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Snackbar feedback notification */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ fontWeight: 600 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
