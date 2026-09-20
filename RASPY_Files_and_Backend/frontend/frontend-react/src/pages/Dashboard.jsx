import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Button, Paper, Stack,
  Divider, Chip, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  People, Person, Feedback as FeedbackIcon, Settings, ArrowForward,
  Videocam, Campaign, Refresh, LocalShipping, CheckCircle,
  Schedule, Attachment, Assessment, History, Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('super_admin');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    total_residents: 0,
    total_feedback: 0,
    pending_feedback: 0,
    total_announcements: 0,
    total_detections: 0,
  });
  const [detectorStatus, setDetectorStatus] = useState({
    status: 'idle',
    last_detection: null,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [detectionLogs, setDetectionLogs] = useState([]);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, statusRes, announceRes, feedbackRes, detectionRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/detection/status'),
        api.get('/announcements?published_only=true&limit=4'),
        api.get('/feedback?limit=5'),
        api.get('/detection/logs'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (statusRes.status === 'fulfilled' && statusRes.value.data) {
        setDetectorStatus(statusRes.value.data);
      }
      if (announceRes.status === 'fulfilled' && Array.isArray(announceRes.value.data)) {
        setAnnouncements(announceRes.value.data);
      }
      if (feedbackRes.status === 'fulfilled' && Array.isArray(feedbackRes.value.data)) {
        setFeedbacks(feedbackRes.value.data);
      }
      if (detectionRes.status === 'fulfilled' && Array.isArray(detectionRes.value.data)) {
        setDetectionLogs(detectionRes.value.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Setup safe WebSocket listener for live camera detections & citizen feedback
    let ws = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.event === 'new_feedback' ||
            data.event_type === 'truck_present' ||
            data.event_type === 'truck_departed'
          ) {
            fetchDashboardData();
          }
        } catch {
          // non-JSON message
        }
      };
    } catch (e) {
      console.warn('WebSocket init skipped or unavailable:', e);
    }

    return () => {
      if (ws) {
        try {
          ws.close();
        } catch { }
      }
    };
  }, [fetchDashboardData]);

  // Primary KPI cards based on role
  const cards = [
    ...(isSuperAdmin
      ? [
        {
          title: 'System Users',
          count: stats.total_users,
          icon: <People sx={{ color: '#990000', fontSize: 30 }} />,
          accent: '#990000',
          tag: 'Super Admin & Staff',
          path: '/users',
        },
      ]
      : []),
    {
      title: 'Resident Records',
      count: stats.total_residents,
      icon: <Person sx={{ color: '#059669', fontSize: 30 }} />,
      accent: '#059669',
      tag: 'Master Community List',
      path: '/residents',
    },
    {
      title: 'Active Announcements',
      count: stats.total_announcements || announcements.length,
      icon: <Campaign sx={{ color: '#990000', fontSize: 30 }} />,
      accent: '#990000',
      tag: 'Public Advisories',
      path: '/announcements',
    },
    {
      title: 'Resident Feedback',
      count: stats.total_feedback || feedbacks.length,
      badge: stats.pending_feedback > 0 ? `${stats.pending_feedback} Pending` : null,
      icon: <FeedbackIcon sx={{ color: '#d97706', fontSize: 30 }} />,
      accent: '#d97706',
      tag: 'Community Messages',
      path: '/feedback',
    },
    {
      title: 'CCTV Detections',
      count: stats.total_detections || detectionLogs.length,
      icon: <Videocam sx={{ color: '#0284c7', fontSize: 30 }} />,
      accent: '#0284c7',
      tag: 'Vision-Trak Logs',
      path: '/detection-logs',
    },
  ];

  const isTruckActive = detectorStatus.status === 'active';

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', py: 1 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, letterSpacing: 0.8, display: 'block' }}>
            BARANGAY 133, TONDO, MANILA • {isSuperAdmin ? 'EXECUTIVE ADMINISTRATION' : 'OPERATIONS'}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#990000', mb: 0.5, letterSpacing: -0.5 }}>
            {isSuperAdmin ? 'Barangay Executive Dashboard' : 'Barangay Official Dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {isSuperAdmin ? 'Super Admin' : 'Barangay Official'}. Live overview of community records, announcements, resident feedback, and Vision-Trak IoT garbage collection tracking.
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard Data">
          <span>
            <IconButton
              onClick={() => fetchDashboardData(true)}
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: '#f4f4f5' },
              }}
              disabled={refreshing}
            >
              {refreshing ? <CircularProgress size={20} sx={{ color: '#990000' }} /> : <Refresh sx={{ color: '#990000' }} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Live Vision-Trak IoT Camera & Garbage Truck Detection Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isTruckActive ? '#fecaca' : '#e4e4e7',
          bgcolor: isTruckActive ? '#fef2f2' : '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: isTruckActive ? '#fee2e2' : '#f4f4f5',
              color: isTruckActive ? '#990000' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isTruckActive ? <LocalShipping sx={{ fontSize: 28 }} /> : <Videocam sx={{ fontSize: 28 }} />}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.25 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b', lineHeight: 1.2 }}>
                Vision-Trak IoT AI Surveillance
              </Typography>
              <Chip
                size="small"
                label={isTruckActive ? 'TRUCK DETECTED IN AREA' : 'CAMERAS ONLINE • MONITORING IDLE'}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  bgcolor: isTruckActive ? '#990000' : '#ecfdf5',
                  color: isTruckActive ? '#ffffff' : '#059669',
                  border: isTruckActive ? 'none' : '1px solid #a7f3d0',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#71717a', fontSize: '0.82rem' }}>
              {detectorStatus.last_detection?.message
                ? `${detectorStatus.last_detection.message} (${detectorStatus.last_detection.timestamp || 'Recently'})`
                : 'Automated CCTV monitoring is actively scanning collection checkpoints across Barangay 133.'}
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate('/detection-logs')}
          endIcon={<ArrowForward fontSize="small" />}
          sx={{
            color: '#990000',
            borderColor: '#fecaca',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: '#fef2f2', borderColor: '#990000' },
          }}
        >
          View Camera Logs
        </Button>
      </Paper>

      {/* Primary KPI Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: cards.length === 5 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            lg: `repeat(${cards.length}, 1fr)`,
          },
          gap: 2.5,
          mb: 4,
        }}
      >
        {cards.map((c, idx) => (
          <Card
            key={idx}
            onClick={() => navigate(c.path)}
            sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              border: '1px solid #e4e4e7',
              borderTop: `4px solid ${c.accent}`,
              borderRadius: 2.5,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 24px rgba(153, 0, 0, 0.08)',
                borderColor: '#d4d4d8',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: '#fafafa',
                  border: '1px solid #f4f4f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {c.icon}
              </Box>
              {c.badge ? (
                <Chip
                  label={c.badge}
                  size="small"
                  sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309' }}
                />
              ) : (
                <ArrowForward sx={{ color: '#a1a1aa', fontSize: 16 }} />
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
              {c.title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#18181b', lineHeight: 1 }}>
              {loading ? <CircularProgress size={24} sx={{ color: c.accent }} /> : c.count}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* Main Operational Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column (8 cols): Announcements & Resident Feedback */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Active Announcements Module */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Campaign sx={{ color: '#990000', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
                    Active Announcements
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add fontSize="small" />}
                    onClick={() => navigate('/announcements')}
                    sx={{
                      bgcolor: '#990000',
                      color: '#ffffff',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#730000' },
                    }}
                  >
                    Post Announcement
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ArrowForward fontSize="small" />}
                    onClick={() => navigate('/announcements')}
                    sx={{ color: '#71717a', borderColor: '#e4e4e7', fontWeight: 600, textTransform: 'none' }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5, borderColor: '#f4f4f5' }} />

              {announcements.length > 0 ? (
                <Grid container spacing={2}>
                  {announcements.map((item) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.announcement_id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRadius: 2,
                          borderLeft: '4px solid #990000',
                          borderColor: '#e4e4e7',
                          p: 2,
                          bgcolor: '#ffffff',
                          transition: 'border-color 0.15s',
                          '&:hover': { borderColor: '#990000' },
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#18181b' }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, fontSize: '0.84rem' }}>
                            {item.content?.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f4f4f5' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Schedule sx={{ fontSize: 13 }} />
                            {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'Recent'}
                          </Typography>
                          {item.attachment_path && (
                            <Chip size="small" icon={<Attachment sx={{ fontSize: '13px !important' }} />} label="Attachment" sx={{ height: 20, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No published announcements at this moment.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Resident Feedback Module */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FeedbackIcon sx={{ color: '#d97706', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
                    Recent Resident Feedback
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForward fontSize="small" />}
                  onClick={() => navigate('/feedback')}
                  sx={{ color: '#d97706', fontWeight: 700, textTransform: 'none' }}
                >
                  Review All ({stats.total_feedback || feedbacks.length})
                </Button>
              </Box>
              <Divider sx={{ mb: 2, borderColor: '#f4f4f5' }} />

              {feedbacks.length > 0 ? (
                <Stack spacing={1.5}>
                  {feedbacks.map((fb) => (
                    <Box
                      key={fb.feedback_id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#fafafa',
                        border: '1px solid #e4e4e7',
                        borderLeft: '4px solid #d97706',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: '#f4f4f5' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#990000' }}>
                          @{fb.username || 'Resident'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fb.timestamp ? new Date(fb.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b', mb: 0.5 }}>
                        {fb.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.84rem' }}>
                        {fb.content}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No resident feedback submitted yet.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column (4 cols): Vision-Trak Logs & Management Shortcuts */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Live Camera Tracking Logs */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Videocam sx={{ color: '#059669', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
                    Vision-Trak Logs
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForward fontSize="small" />}
                  onClick={() => navigate('/detection-logs')}
                  sx={{ color: '#059669', fontWeight: 700, textTransform: 'none' }}
                >
                  All Logs
                </Button>
              </Box>
              <Divider sx={{ mb: 2, borderColor: '#f4f4f5' }} />

              {detectionLogs.length > 0 ? (
                <Stack spacing={1.5}>
                  {detectionLogs.map((log) => {
                    const isHighConfidence = (log.confidence_score || 0) >= 0.70;
                    return (
                      <Card
                        key={log.log_id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor: isHighConfidence ? '#a7f3d0' : '#e4e4e7',
                          borderLeft: isHighConfidence ? '4px solid #059669' : '4px solid #a1a1aa',
                          bgcolor: isHighConfidence ? '#ecfdf5' : '#fafafa',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b' }}>
                            {log.camera_name || `Camera #${log.camera_id || 1}`}
                          </Typography>
                          <Chip
                            size="small"
                            icon={isHighConfidence ? <LocalShipping sx={{ fontSize: '13px !important' }} /> : <Videocam sx={{ fontSize: '13px !important' }} />}
                            label={isHighConfidence ? 'TRUCK DETECTED' : 'MONITORING'}
                            color={isHighConfidence ? 'success' : 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#71717a' }}>
                          <span>Confidence: {((log.confidence_score || 0) * 100).toFixed(1)}%</span>
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 36, color: '#a7f3d0', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b' }}>
                    Camera Monitoring Idle
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Detection events will stream here live as collection trucks enter collection zones.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}