import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  TextField,
  Snackbar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocalShipping,
  Campaign,
  Feedback,
  NotificationsActive,
  AlarmOn,
  ArrowForward,
  CheckCircle,
  AccessTime,
  AttachFile,
  Send,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * ResidentDashboard - Modeled directly after Figure 3.9.2 (User Dashboard)
 * and Figure 4.1.5 (Resident Dashboard Interface) in documentation.pdf.
 * Features:
 * - Live Garbage Collection Notifier Banner (FR7, FR9)
 * - Card-based Announcements with Read More
 * - Upcoming Garbage Collection Card with Set Reminder
 * - Integrated Send Feedback module (FR10)
 */
export default function ResidentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [truckStatus, setTruckStatus] = useState({ status: 'idle', last_detection: null });
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick feedback state
  const [feedbackSubject, setFeedbackSubject] = useState('Garbage Collection');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [feedbackConfirm, setFeedbackConfirm] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Reminder dialog
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  const [snack, setSnack] = useState('');

  const residentName =
    user?.profile?.first_name && user?.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : user?.username || 'Resident';

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, annRes] = await Promise.allSettled([
        api.get('/detection/status'),
        api.get('/announcements?published_only=true&limit=4'),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.data) {
        setTruckStatus(statusRes.value.data);
      }
      if (annRes.status === 'fulfilled' && Array.isArray(annRes.value.data)) {
        setAnnouncements(annRes.value.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Quick Feedback Submission (with Confirmation Dialog - Figure 4.2.1)
  const handleQuickSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      setSnack('Please enter your feedback message.');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', feedbackSubject);
      fd.append('content', feedbackMessage.trim());
      if (feedbackFile) {
        fd.append('attachment', feedbackFile);
      }
      await api.post('/feedback', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedbackConfirm(false);
      setFeedbackSuccess(true);
      setFeedbackMessage('');
      setFeedbackFile(null);
      setSnack('Feedback submitted successfully!');
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const isTruckDetected = truckStatus?.status === 'detected';

  return (
    <Box sx={{ pb: 4 }}>
      {/* 1. Live Realtime Garbage Truck Alert Banner (FR7, FR9, Table 3.2) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3.5,
          borderRadius: 3,
          bgcolor: isTruckDetected ? '#fef2f2' : '#f0fdf4',
          border: '2px solid',
          borderColor: isTruckDetected ? '#ef4444' : '#86efac',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: isTruckDetected
            ? '0 10px 25px -3px rgba(239, 68, 68, 0.25)'
            : '0 4px 12px rgba(34, 197, 94, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '50%',
              bgcolor: isTruckDetected ? '#dc2626' : '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isTruckDetected ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)' },
                '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 12px rgba(220, 38, 38, 0)' },
                '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)' },
              },
            }}
          >
            <LocalShipping sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: isTruckDetected ? '#991b1b' : '#166534',
                  letterSpacing: -0.2,
                }}
              >
                {isTruckDetected ? '🚨 TRUCK DETECTED IN BARANGAY 133' : 'GARBAGE COLLECTION STATUS: IDLE'}
              </Typography>
              <Chip
                label={isTruckDetected ? 'ACTIVE NOW' : 'MONITORING'}
                size="small"
                color={isTruckDetected ? 'error' : 'success'}
                sx={{ fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: isTruckDetected ? '#7f1d1d' : '#15803d', mt: 0.5 }}>
              {isTruckDetected
                ? 'The garbage collection truck has arrived at the monitored checkpoint. Please bring out your segregated waste now!'
                : 'No garbage truck is currently detected at collection checkpoints. The AI Vision-Trak system is actively monitoring.'}
            </Typography>
            {truckStatus?.last_detection && (
              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                Last Detection: {new Date(truckStatus.last_detection).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/garbage-alerts')}
          sx={{
            bgcolor: isTruckDetected ? '#990000' : '#16a34a',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            alignSelf: { xs: 'stretch', sm: 'center' },
            '&:hover': { bgcolor: isTruckDetected ? '#730000' : '#15803d' },
          }}
        >
          View Alert Details
        </Button>
      </Paper>

      {/* 2. Main Content Grid (Figure 3.9.2: Announcements, Schedule Card, and Feedback Field) */}
      <Grid container spacing={3}>
        {/* Left Column: Announcements and Upcoming Schedule */}
        <Grid item xs={12} md={8}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Campaign sx={{ color: '#990000' }} /> Important Barangay Announcements
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/announcements')}
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              sx={{ fontWeight: 700, color: '#990000' }}
            >
              View All
            </Button>
          </Box>

          {/* Card-based Announcements (Figure 3.9.2) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {announcements.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #d4d4d8' }}>
                  <Typography variant="body2" color="text.secondary">
                    No active announcements at this time. All official announcements remain posted for 7 days per policy.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              announcements.slice(0, 4).map((item) => (
                <Grid item xs={12} sm={6} key={item.announcement_id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      border: '1px solid #e4e4e7',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        borderColor: '#990000',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Chip
                          label="Official Notice"
                          size="small"
                          sx={{ bgcolor: '#fef2f2', color: '#990000', fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" sx={{ color: '#71717a' }}>
                          {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b', mb: 1, lineHeight: 1.3 }}>
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.85rem',
                        }}
                      >
                        {item.content}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => setSelectedAnnouncement(item)}
                        sx={{
                          borderColor: '#e4e4e7',
                          color: '#990000',
                          fontWeight: 700,
                          borderRadius: 2,
                          '&:hover': { borderColor: '#990000', bgcolor: '#fef2f2' },
                        }}
                      >
                        Read More
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          {/* Upcoming Garbage Collection Schedule Card (Figure 3.9.2) */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', color: '#1d4ed8' }}>
                  <AccessTime sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b' }}>
                    Upcoming Garbage Collection
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#52525b' }}>
                    Regular Route: Monday, Wednesday, Friday • 8:00 AM – 11:00 AM
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a' }}>
                    Zone 11, Tondo Monitored Collection Corridor
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AlarmOn />}
                onClick={() => setReminderDialogOpen(true)}
                sx={{
                  fontWeight: 700,
                  borderColor: reminderSet ? '#16a34a' : '#990000',
                  color: reminderSet ? '#16a34a' : '#990000',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#fef2f2' },
                }}
              >
                {reminderSet ? 'Reminder Set ✓' : 'Set Reminder'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Send Feedback Field (Figure 3.9.2 & Figure 4.2.1) */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Feedback sx={{ color: '#990000' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
                Send Feedback
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
              Report uncollected trash, noise issues, or community concerns directly to barangay officials.
            </Typography>

            {feedbackSuccess && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                Feedback Submitted Successfully! Our officials review all reports promptly.
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                select
                label="Category / Subject"
                size="small"
                fullWidth
                value={feedbackSubject}
                onChange={(e) => setFeedbackSubject(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="Garbage Collection">Garbage Collection / Uncollected Waste</option>
                <option value="Noise Disturbance">Noise Disturbance</option>
                <option value="Street Lighting & Safety">Street Lighting & Safety</option>
                <option value="Cleanliness & Drainage">Cleanliness & Drainage</option>
                <option value="General Inquiry">General Community Inquiry</option>
              </TextField>

              <TextField
                label="Feedback Message"
                placeholder="Describe your issue or suggestion..."
                multiline
                rows={4}
                fullWidth
                required
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  component="label"
                  size="small"
                  startIcon={<AttachFile sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', color: '#52525b', fontWeight: 600 }}
                >
                  {feedbackFile ? feedbackFile.name.slice(0, 16) + '...' : 'Attach a photo/file'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setFeedbackFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {feedbackFile && (
                  <Chip
                    label="Remove"
                    size="small"
                    onDelete={() => setFeedbackFile(null)}
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Button
                variant="contained"
                fullWidth
                endIcon={<Send />}
                disabled={!feedbackMessage.trim()}
                onClick={() => setFeedbackConfirm(true)}
                sx={{
                  py: 1.2,
                  bgcolor: '#990000',
                  fontWeight: 800,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#730000' },
                }}
              >
                Submit Feedback
              </Button>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="caption" sx={{ color: '#71717a', display: 'block', lineHeight: 1.4 }}>
              🛡️ <strong>Data Privacy:</strong> Submissions comply with Republic Act No. 10173. Duplicate submissions within 5 minutes are restricted to prevent spam.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog for Feedback Submission (Figure 4.2.1) */}
      <ConfirmationDialog
        open={feedbackConfirm}
        title="Verify Submission"
        message="Are you sure you want to submit this feedback?"
        onConfirm={handleQuickSubmitFeedback}
        onCancel={() => setFeedbackConfirm(false)}
        confirmText="YES"
        cancelText="NO"
        loading={feedbackSubmitting}
      />

      {/* Read More Modal for Announcements (Figure 4.1.8) */}
      <Dialog
        open={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          {selectedAnnouncement?.title}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600 }}>
              Date Posted: {selectedAnnouncement?.date_posted ? new Date(selectedAnnouncement.date_posted).toLocaleString() : ''}
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
            Announcement Summary
          </Typography>
          <Typography variant="body1" sx={{ color: '#3f3f46', lineHeight: 1.6, mb: 3 }}>
            {selectedAnnouncement?.content}
          </Typography>

          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e4e4e7' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#18181b' }}>
              Important Reminders for Residents
            </Typography>
            <Typography variant="body2" sx={{ color: '#52525b', fontSize: '0.85rem' }}>
              • Please present a valid Barangay ID or Government-issued ID when claiming services.
              <br />
              • Follow safety and sanitation guidelines at the Barangay Hall.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedAnnouncement(null)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Reminder Dialog (Figure 4.1.9) */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#18181b' }}>
          Schedule Garbage Reminder
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#52525b', mb: 2 }}>
            Set a proactive notification for tomorrow's scheduled garbage collection in Zone 11, Barangay 133.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            You will receive a notification alert 30 minutes before the regular collection window begins.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReminderDialogOpen(false)} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setReminderSet(true);
              setReminderDialogOpen(false);
              setSnack('Reminder set successfully for tomorrow’s collection!');
            }}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
          >
            Confirm Reminder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Toast */}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  );
}
