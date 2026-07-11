import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Paper, Snackbar, Divider, Chip,
} from '@mui/material';
import api from '../api/client';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [snack, setSnack] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/settings'); setSettings(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

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

      <Panel title="System Maintenance" icon="⚙️">
        <FieldRow label="Backup Status">
          <Chip label={settings.backup_enabled === 'true' ? 'Active' : 'Inactive'}
            color={settings.backup_enabled === 'true' ? 'success' : 'default'} />
        </FieldRow>
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
