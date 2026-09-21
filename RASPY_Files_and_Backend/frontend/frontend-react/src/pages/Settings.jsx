import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Paper,
  Snackbar,
  Divider,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Videocam,
  Notifications,
  Build,
  Download,
  Delete,
  Refresh,
  CheckCircle,
  Save,
  Storage,
} from '@mui/icons-material';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * Settings - System Settings dashboard for Super Admins.
 * Adheres strictly to Figures 3.8.9, 3.8.10, 3.9.0, 3.9.1 in documentation.pdf.
 * Categorized into 3 functional domains:
 * 1. Camera & Detection Setup
 * 2. Notification Settings
 * 3. System Maintenance
 */
export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [deleteBackupTarget, setDeleteBackupTarget] = useState(null);

  // Local form state
  const [rtspUrl, setRtspUrl] = useState('');
  const [cameraQuality, setCameraQuality] = useState('480p');
  const [detectionActivity, setDetectionActivity] = useState(true);
  const [notificationCooldown, setNotificationCooldown] = useState('30');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      setSettings(data || {});
      setRtspUrl(data.rtsp_url || 'rtsp://192.168.1.100:554/stream1');
      setCameraQuality(data.camera_quality || '480p');
      setDetectionActivity(data.detection_enabled !== 'false');
      setNotificationCooldown(data.notification_cooldown || '30');
    } catch {
      // fallback defaults
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setBackupLoading(true);
    try {
      const { data } = await api.get('/backup');
      setBackups(Array.isArray(data) ? data : []);
    } catch {
      setBackups([]);
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, [fetchSettings, fetchBackups]);

  // Save Camera & Detection Setup (Figure 3.8.10)
  const handleSaveCameraSetup = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.put('/settings/rtsp_url', { config_value: rtspUrl }),
        api.put('/settings/camera_quality', { config_value: cameraQuality }),
        api.put('/settings/detection_enabled', { config_value: String(detectionActivity) }),
      ]);
      setSnack('Camera & Detection parameters saved successfully.');
    } catch (err) {
      setSnack('Error saving camera settings.');
    } finally {
      setSaving(false);
    }
  };

  // Save Notification Settings (Figure 3.9.0)
  const handleSaveNotificationSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings/notification_cooldown', { config_value: String(notificationCooldown) });
      setSnack('Notification Cooldown parameter updated.');
    } catch {
      setSnack('Error updating notification cooldown.');
    } finally {
      setSaving(false);
    }
  };

  // System Maintenance Actions (Figure 3.9.1)
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await api.post('/backup');
      setSnack('Database snapshot & backup archive created.');
      fetchBackups();
    } catch (err) {
      setSnack('Failed to create backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      await api.delete(`/backup/${filename}`);
      setSnack(`Backup '${filename}' deleted.`);
      setDeleteBackupTarget(null);
      fetchBackups();
    } catch {
      setSnack('Failed to delete backup.');
    }
  };

  const handleDownloadSystemLogs = () => {
    window.open('/api/activity/all?format=csv', '_blank');
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 960, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Storage sx={{ color: '#990000', fontSize: 28 }} /> System Settings
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Privileged configuration portal for camera hardware, alert intervals, and database preservation.
        </Typography>
      </Box>

      {/* 3 Main Functional Domains (Figure 3.8.9) */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e4e4e7', mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            bgcolor: '#ffffff',
            borderBottom: '1px solid #e4e4e7',
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', py: 2 },
          }}
        >
          <Tab icon={<Videocam />} iconPosition="start" label="Camera & Detection Setup" />
          <Tab icon={<Notifications />} iconPosition="start" label="Notification Settings" />
          <Tab icon={<Build />} iconPosition="start" label="System Maintenance" />
        </Tabs>

        <Box sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: '#ffffff' }}>
          {/* TAB 0: Camera & Detection Setup (Figure 3.8.10) */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                Camera & Detection Setup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                Bridge the physical surveillance hardware with the Vision-Trak YOLOv8 INT8 inference engine.
              </Typography>

              <Stack spacing={3} sx={{ maxWidth: 650 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
                    RTSP Stream URL
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="rtsp://admin:pass@192.168.1.108:554/ch0_0.264"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    helperText="Designates the IP address of the connected CCTV camera for real-time RTSP ingestion."
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
                    Camera Quality
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select value={cameraQuality} onChange={(e) => setCameraQuality(e.target.value)}>
                      <MenuItem value="480p">AUTO 480p (Optimized Bandwidth)</MenuItem>
                      <MenuItem value="720p">720p HD</MenuItem>
                      <MenuItem value="1080p">1080p Full HD</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
                    Detection Activity
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={detectionActivity}
                        onChange={(e) => setDetectionActivity(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {detectionActivity ? 'ON (Automated AI Detection Active)' : 'OFF (Detection Paused)'}
                      </Typography>
                    }
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {/* Prominent SAVE button (Figure 3.8.10) */}
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveCameraSetup}
                    disabled={saving}
                    sx={{
                      bgcolor: '#18181b',
                      color: '#ffffff',
                      fontWeight: 800,
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#27272a' },
                    }}
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {/* TAB 1: Notification Settings (Figure 3.9.0) */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                NOTIFICATION SETTINGS
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                Regulate the broadcast frequency of automated alerts to prevent resident alert fatigue.
              </Typography>

              <Paper sx={{ p: 3, maxWidth: 650, borderRadius: 2, border: '1px solid #e4e4e7', bgcolor: '#fafafa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b' }}>
                      Notification Cooldown
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mandatory time interval between successive push notifications for prolonged detection events.
                    </Typography>
                  </Box>

                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={notificationCooldown}
                      onChange={(e) => setNotificationCooldown(e.target.value)}
                    >
                      <MenuItem value="30">30 Seconds</MenuItem>
                      <MenuItem value="60">1 Minute</MenuItem>
                      <MenuItem value="300">5 Minutes</MenuItem>
                      <MenuItem value="600">10 Minutes</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {/* Prominent SAVE button (Figure 3.9.0) */}
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveNotificationSettings}
                    disabled={saving}
                    sx={{
                      bgcolor: '#18181b',
                      color: '#ffffff',
                      fontWeight: 800,
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#27272a' },
                    }}
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* TAB 2: System Maintenance (Figure 3.9.1) */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                System Maintenance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                Automated database redundancy, server health indicators, and security log extraction utilities.
              </Typography>

              <Stack spacing={3}>
                {/* Status Indicator & Download Row (Figure 3.9.1) */}
                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e4e4e7', bgcolor: '#fafafa' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b' }}>
                        Backup Status:
                      </Typography>
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: '16px !important', color: '#16a34a !important' }} />}
                        label="Active"
                        size="small"
                        sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 900, px: 1 }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      onClick={handleCreateBackup}
                      disabled={creatingBackup}
                      sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
                    >
                      {creatingBackup ? 'Backing Up...' : 'Create Backup Snapshot'}
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Download System Logs (Figure 3.9.1: "Download System Logs" [Download]) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b' }}>
                        Download System Logs
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Extract comprehensive administrative audit trails and login event histories for security reporting.
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={handleDownloadSystemLogs}
                      sx={{
                        bgcolor: '#18181b',
                        color: '#ffffff',
                        fontWeight: 800,
                        borderRadius: 2,
                        px: 3,
                        '&:hover': { bgcolor: '#27272a' },
                      }}
                    >
                      Download
                    </Button>
                  </Box>
                </Paper>

                {/* Backup Archives List */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                    Existing Database Backup Files ({backups.length})
                  </Typography>
                  {backups.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No manual backups created yet. Scheduled automated daily dumps run at midnight.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e4e4e7', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Archive File</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date Created</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backups.map((b) => (
                            <TableRow key={b.filename}>
                              <TableCell sx={{ fontWeight: 600 }}>{b.filename}</TableCell>
                              <TableCell>{b.size || '—'}</TableCell>
                              <TableCell>{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteBackupTarget(b.filename)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Delete Backup Confirmation */}
      <ConfirmationDialog
        open={Boolean(deleteBackupTarget)}
        title="Backup Deletion"
        message={`Delete backup archive "${deleteBackupTarget}"?`}
        onConfirm={() => handleDeleteBackup(deleteBackupTarget)}
        onCancel={() => setDeleteBackupTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}