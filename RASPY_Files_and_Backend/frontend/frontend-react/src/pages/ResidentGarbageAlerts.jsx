import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  LocalShipping,
  NotificationsActive,
  AlarmOn,
  CheckCircle,
  Videocam,
  Refresh,
  History,
  CalendarMonth,
} from '@mui/icons-material';
import api from '../api/client';

/**
 * ResidentGarbageAlerts - Adheres directly to Figure 4.1.9 in documentation.pdf.
 * Features:
 * - Predictive alert banner ("Collection tomorrow - Don't forget it") with "Set Reminder" utility.
 * - Real-time Vision-Trak IoT truck detection status (FR6, FR7, FR9).
 * - Chronological log of completed service rounds labeled "Collection Successfully".
 */
export default function ResidentGarbageAlerts() {
  const [detectorStatus, setDetectorStatus] = useState({ status: 'idle', last_detection: null });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderActive, setReminderActive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, logsRes] = await Promise.allSettled([
        api.get('/detection/status'),
        api.get('/detection/logs'),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.data) {
        setDetectorStatus(statusRes.value.data);
      }
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value.data)) {
        setLogs(logsRes.value.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isDetected = detectorStatus?.status === 'detected';

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalShipping sx={{ color: '#990000', fontSize: 30 }} /> Garbage Collection Alerts
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Real-time IoT CCTV detection and verified collection logs for Barangay 133, Tondo, Manila.
        </Typography>
      </Box>

      {/* 1. Predictive Alert Card (Figure 4.1.9 Top Section) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#ffffff',
          border: '1px solid #e4e4e7',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: '#fef2f2',
              color: '#990000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotificationsActive sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
              Collection Tomorrow – Don't forget it
            </Typography>
            <Typography variant="body2" sx={{ color: '#52525b' }}>
              Scheduled Morning Route: Zone 11 Corridor • 8:00 AM – 11:00 AM
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a' }}>
              Please bring out your segregated biodegradable and non-biodegradable trash bags.
            </Typography>
          </Box>
        </Box>

        <Button
          variant={reminderActive ? 'contained' : 'outlined'}
          startIcon={<AlarmOn />}
          onClick={() => setReminderOpen(true)}
          sx={{
            py: 1,
            px: 2.5,
            fontWeight: 800,
            borderRadius: 2,
            bgcolor: reminderActive ? '#16a34a' : 'transparent',
            borderColor: reminderActive ? '#16a34a' : '#990000',
            color: reminderActive ? '#ffffff' : '#990000',
            '&:hover': {
              bgcolor: reminderActive ? '#15803d' : '#fef2f2',
              borderColor: '#990000',
            },
          }}
        >
          {reminderActive ? 'Reminder Set ✓' : 'Set Reminder'}
        </Button>
      </Paper>

      {/* 2. Real-time Live IoT Detection Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3.5,
          borderRadius: 3,
          bgcolor: isDetected ? '#fef2f2' : '#f8fafc',
          border: '2px solid',
          borderColor: isDetected ? '#ef4444' : '#cbd5e1',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Videocam sx={{ fontSize: 28, color: isDetected ? '#dc2626' : '#64748b' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDetected ? '#991b1b' : '#1e293b' }}>
                {isDetected ? 'GARBAGE TRUCK ARRIVING NOW' : 'CCTV SENSOR: ACTIVE MONITORING'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDetected ? '#b91c1c' : '#64748b' }}>
                {isDetected
                  ? 'AI Vision-Trak has confirmed the collection truck presence at the entry point!'
                  : 'Automated camera checkpoint is continuously scanning for garbage trucks.'}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={isDetected ? 'TRUCK DETECTED' : 'STANDBY'}
            color={isDetected ? 'error' : 'default'}
            sx={{ fontWeight: 800 }}
          />
        </Box>
      </Paper>

      {/* 3. Chronological Historical Service Log (Figure 4.1.9 Lower Section) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1 }}>
          <History sx={{ color: '#990000' }} /> Verified Service History
        </Typography>
        <Typography variant="caption" sx={{ color: '#71717a' }}>
          Transparent record of completed municipal garbage collection rounds verified by CCTV.
        </Typography>
      </Box>

      {logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #d4d4d8' }}>
          <Typography variant="body2" color="text.secondary">
            No historical collection rounds recorded yet today.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {logs.slice(0, 8).map((log, index) => (
            <Paper
              key={log.log_id || index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: '#ffffff',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: '#fafafa' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <LocalShipping sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b' }}>
                    Collection Successfully
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonth sx={{ fontSize: 13 }} />
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }) + ' • ' + new Date(log.timestamp).toLocaleTimeString()
                      : 'Recently verified'}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={<CheckCircle sx={{ fontSize: '16px !important', color: '#16a34a !important' }} />}
                label="Verified"
                size="small"
                sx={{
                  bgcolor: '#f0fdf4',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            </Paper>
          ))}
        </Stack>
      )}

      {/* Reminder Dialog */}
      <Dialog
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#18181b' }}>
          {reminderActive ? 'Reminder Settings' : 'Schedule Collection Alert'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#52525b', mb: 2 }}>
            {reminderActive
              ? 'You have an active collection reminder enabled for tomorrow morning.'
              : 'Would you like to receive an on-screen alert and push notification when the collection round starts tomorrow?'}
          </Typography>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Covers Zone 11, Barangay 133 municipal collection route.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {reminderActive ? (
            <Button
              color="error"
              onClick={() => {
                setReminderActive(false);
                setReminderOpen(false);
              }}
            >
              Turn Off Reminder
            </Button>
          ) : (
            <Button onClick={() => setReminderOpen(false)}>Cancel</Button>
          )}
          <Button
            variant="contained"
            onClick={() => {
              setReminderActive(true);
              setReminderOpen(false);
            }}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
          >
            {reminderActive ? 'Keep Active' : 'Activate Reminder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
