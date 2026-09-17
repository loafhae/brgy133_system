import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl,
  Switch, FormControlLabel, Paper, Snackbar, Divider, Chip, IconButton, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../api/client';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [snack, setSnack] = useState('');
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); fetchBackups(); }, [fetch, fetchBackups]);

  const update = async (key, value) => {
    setSaving(key);
    try {
      await api.put(`/settings/${key}`, { config_value: String(value) });
      setSettings((prev) => ({ ...prev, [key]: String(value) }));
      setSnack('Setting saved');
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving setting');
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

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>System Settings</Typography>

      <Panel title="Camera & Detection Setup" icon="📷">
        <FieldRow label="RTSP Stream URL">
          <TextField size="small" sx={{ minWidth: 350 }} placeholder="rtsp://camera-ip:port/stream"
            value={settings.rtsp_url || ''}
            onChange={(e) => update('rtsp_url', e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Camera Quality">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={settings.camera_quality || '480p'}
              onChange={(e) => update('camera_quality', e.target.value)}
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
              onChange={(e) => update('detection_enabled', e.target.checked)}
            />
          } label={settings.detection_enabled === 'true' ? 'Active' : 'Inactive'} />
        </FieldRow>
      </Panel>

      <Panel title="Notification Settings" icon="🔔">
        <FieldRow label="Notification Cooldown">
          <TextField size="small" type="number" sx={{ minWidth: 120 }}
            value={settings.notification_cooldown || '30'}
            onChange={(e) => update('notification_cooldown', e.target.value)}
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

      <Panel title="System Maintenance" icon="⚙️">
        <FieldRow label="System Logs">
          <Button variant="outlined" onClick={() => {
            window.open('/api/activity/all?limit=1000', '_blank');
          }}>
            Download System Logs
          </Button>
        </FieldRow>
      </Panel>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}