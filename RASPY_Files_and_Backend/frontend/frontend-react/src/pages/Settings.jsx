import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  Switch, FormControlLabel, Paper, Snackbar, Divider, Chip, IconButton, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
  Avatar, InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon, Download as DownloadIcon, Refresh as RefreshIcon,
  Person, Lock, Settings as SettingsIcon,
  Visibility, VisibilityOff,
} from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const Panel = ({ title, children, icon }) => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon} {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

const FieldRow = ({ label, children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
    <Typography sx={{ minWidth: 180, fontWeight: 500 }}>{label}</Typography>
    {children}
  </Box>
);

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [snack, setSnack] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownloadSystemLogs = async () => {
    try {
      setSnack('Generating PDF...');
      const token = localStorage.getItem('token');
      const response = await api.get('/activity/all/export?format=pdf&limit=1000', {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-logs-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSnack('System logs PDF downloaded successfully');
    } catch (err) {
      setSnack('Error downloading system logs PDF');
    }
  };

  // ─── Information Settings ────────────────────────────────
  const [infoForm, setInfoForm] = useState({
    username: '', email: '', first_name: '', middle_name: '', last_name: '', contact: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // ─── Security / Change Password ─────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [obscureCurrent, setObscureCurrent] = useState(true);
  const [obscureNew, setObscureNew] = useState(true);
  const [obscureConfirm, setObscureConfirm] = useState(true);

  // ─── System Settings (super_admin only) ─────────────────
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const isSuperAdmin = user?.roles?.includes?.('super_admin') ||
    (typeof user?.roles === 'string' && user.roles.split(',').map(r => r.trim()).includes('super_admin'));

  // ─── Load profile into info form ────────────────────────
  const profileInit = useRef(false);
  useEffect(() => {
    if (!user || profileInit.current) return;
    setInfoForm({
      username: user.username || '',
      email: user.email || '',
      first_name: user.profile?.first_name || '',
      middle_name: user.profile?.middle_name || '',
      last_name: user.profile?.last_name || '',
      contact: user.profile?.contact || '',
    });
    profileInit.current = true;
  }, [user]);

  // ─── System settings fetchers ───────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setBackupLoading(true);
    try {
      const { data } = await api.get('/backup');
      setBackups(data);
    } catch {
      setBackups([]);
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings();
      fetchBackups();
    }
  }, [isSuperAdmin, fetchSettings, fetchBackups]);

  // ─── Handlers ───────────────────────────────────────────
  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const { data } = await api.put('/auth/profile', infoForm);
      updateUser(data);
      setSnack('Profile updated successfully');
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map(e => e.msg).join(', ') : d || 'Error saving profile');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) {
      setSnack('Passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      setSnack('Password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setSnack('Password changed successfully. Logging out...');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map(e => e.msg).join(', ') : d || 'Error changing password');
    } finally {
      setSavingPw(false);
    }
  };

  const updateSystemSetting = async (key, value) => {
    setSaving(key);
    try {
      await api.put(`/settings/${key}`, { config_value: String(value) });
      setSettings(prev => ({ ...prev, [key]: String(value) }));
      setSnack('Setting saved');
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map(e => e.msg).join(', ') : d || 'Error saving setting');
    } finally {
      setSaving(null);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      await api.post('/backup');
      setSnack('Backup created successfully');
      fetchBackups();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(d || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const deleteBackup = async (filename) => {
    if (!window.confirm(`Delete backup "${filename}"?`)) return;
    try {
      await api.delete(`/backup/${filename}`);
      setSnack('Backup deleted');
      fetchBackups();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(d || 'Failed to delete backup');
    }
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Settings</Typography>

      {/* ── Information Settings ──────────────────────────── */}
      <Panel title="Information Settings" icon={<Person />}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <TextField label="Username" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.username}
              onChange={(e) => setInfoForm({ ...infoForm, username: e.target.value })}
            />
            <TextField label="Email" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.email}
              onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
            />
            <TextField label="First Name" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.first_name}
              onChange={(e) => setInfoForm({ ...infoForm, first_name: e.target.value })}
            />
            <TextField label="Middle Name" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.middle_name}
              onChange={(e) => setInfoForm({ ...infoForm, middle_name: e.target.value })}
            />
            <TextField label="Last Name" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.last_name}
              onChange={(e) => setInfoForm({ ...infoForm, last_name: e.target.value })}
            />
            <TextField label="Contact" fullWidth size="small" sx={{ mb: 2 }}
              value={infoForm.contact}
              onChange={(e) => setInfoForm({ ...infoForm, contact: e.target.value })}
            />
            <Button variant="contained" onClick={handleSaveInfo} disabled={savingInfo}>
              {savingInfo ? 'Saving...' : 'Save Information'}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 150 }}>
            <Avatar src={user?.profile_pic} sx={{ width: 100, height: 100, bgcolor: 'primary.dark', fontSize: 40 }}>
              {!user?.profile_pic && user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Chip label={user?.roles || 'user'} size="small" color="primary" variant="outlined" />
          </Box>
        </Box>
      </Panel>

      {/* ── Security Settings ────────────────────────────── */}
      <Panel title="Security Settings" icon={<Lock />}>
        <Box sx={{ maxWidth: 400 }}>
          <TextField label="Current Password" type={obscureCurrent ? 'password' : 'text'} fullWidth size="small" sx={{ mb: 2 }}
            value={pwForm.current_password}
            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
            slotProps={{ input: { endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setObscureCurrent(!obscureCurrent)} edge="end" size="small">
                  {obscureCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )} }}
          />
          <TextField label="New Password" type={obscureNew ? 'password' : 'text'} fullWidth size="small" sx={{ mb: 2 }}
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            slotProps={{ input: { endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setObscureNew(!obscureNew)} edge="end" size="small">
                  {obscureNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )} }}
          />
          <TextField label="Confirm New Password" type={obscureConfirm ? 'password' : 'text'} fullWidth size="small" sx={{ mb: 2 }}
            value={pwForm.confirm_password}
            onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
            slotProps={{ input: { endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setObscureConfirm(!obscureConfirm)} edge="end" size="small">
                  {obscureConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )} }}
          />
          <Button variant="contained" color="warning" onClick={handleChangePassword} disabled={savingPw}>
            {savingPw ? 'Changing...' : 'Change Password'}
          </Button>
        </Box>
      </Panel>

      {/* ── System Settings (super_admin only) ──────────── */}
      {isSuperAdmin && (
        <>
          <Panel title="Camera & Detection Setup" icon="📷">
            <FieldRow label="RTSP Stream URL">
              <TextField size="small" sx={{ minWidth: 350 }} placeholder="rtsp://camera-ip:port/stream"
                value={settings.rtsp_url || ''}
                onChange={(e) => updateSystemSetting('rtsp_url', e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Camera Quality">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={settings.camera_quality || '480p'}
                  onChange={(e) => updateSystemSetting('camera_quality', e.target.value)}
                >
                  <MenuItem value="480p">480p</MenuItem>
                  <MenuItem value="720p">720p</MenuItem>
                  <MenuItem value="1080p">1080p</MenuItem>
                </Select>
              </FormControl>
            </FieldRow>
            <FieldRow label="Detection Activity">
              <FormControlLabel control={
                <Switch checked={settings.detection_enabled === 'true'}
                  onChange={(e) => updateSystemSetting('detection_enabled', e.target.checked)}
                />
              } label={settings.detection_enabled === 'true' ? 'Active' : 'Inactive'} />
            </FieldRow>
          </Panel>

          <Panel title="Notification Settings" icon="🔔">
            <FieldRow label="Notification Cooldown">
              <TextField size="small" type="number" sx={{ minWidth: 120 }}
                value={settings.notification_cooldown || '30'}
                onChange={(e) => updateSystemSetting('notification_cooldown', e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <Typography variant="body2" color="text.secondary">seconds</Typography>
            </FieldRow>
          </Panel>

          <Panel title="Backup & Restore" icon="💾">
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <Button variant="contained" color="primary" onClick={createBackup} disabled={creatingBackup}>
                {creatingBackup ? 'Creating Backup...' : 'Create Backup'}
              </Button>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchBackups} disabled={backupLoading}>
                Refresh
              </Button>
              {creatingBackup && <LinearProgress sx={{ flex: 1 }} />}
            </Box>

            {backupLoading ? (
              <LinearProgress />
            ) : backups.length === 0 ? (
              <Typography color="text.secondary">No backups yet. Click "Create Backup" to generate one.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Filename</TableCell>
                      <TableCell>Date Created</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backups.map((b) => (
                      <TableRow key={b.filename}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{b.filename}</TableCell>
                        <TableCell>{formatDate(b.created_at)}</TableCell>
                        <TableCell>{b.size_kb} KB</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary"
                            href={`/api/backup/${b.filename}`}
                            download={b.filename}
                            title="Download">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error"
                            onClick={() => deleteBackup(b.filename)}
                            title="Delete">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Panel>

          <Panel title="System Maintenance" icon={<SettingsIcon />}>
            <FieldRow label="System Logs">
              <Button variant="outlined" onClick={handleDownloadSystemLogs}>
                Download System Logs
              </Button>
            </FieldRow>
          </Panel>
        </>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
