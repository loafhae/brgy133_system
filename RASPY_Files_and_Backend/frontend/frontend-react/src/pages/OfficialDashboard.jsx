import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Button
} from '@mui/material';
import {
  Campaign,
  Feedback as FeedbackIcon,
  Videocam,
  Refresh,
  LocalShipping,
  CheckCircle,
  Schedule,
  Attachment,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [detectionLogs, setDetectionLogs] = useState([]);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [announceRes, feedbackRes, detectionRes] = await Promise.allSettled([
        api.get('/announcements?published_only=true&limit=4'),
        api.get('/feedback?limit=6'),
        api.get('/detection/logs')
      ]);

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
      console.error('Error loading official dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Setup safe dynamic WebSocket connection
    let ws = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'new_feedback' || data.event_type === 'truck_present' || data.event_type === 'truck_departed') {
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
        } catch {}
      }
    };
  }, [fetchDashboardData]);

  const stats = [
    {
      title: 'Active Announcements',
      count: announcements.length,
      icon: <Campaign sx={{ color: '#1976d2', fontSize: 36 }} />,
      bg: '#e3f2fd',
      path: '/announcements'
    },
    {
      title: 'Recent Feedbacks',
      count: feedbacks.length,
      icon: <FeedbackIcon sx={{ color: '#ed6c02', fontSize: 36 }} />,
      bg: '#fff3e0',
      path: '/feedback'
    },
    {
      title: 'Camera Tracking Logs',
      count: detectionLogs.length,
      icon: <Videocam sx={{ color: '#2e7d32', fontSize: 36 }} />,
      bg: '#e8f5e9',
      path: '/detection-logs'
    }
  ];

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', py: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 0.5 }}>
            Barangay Official Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live overview of announcements, resident feedbacks, and garbage collection tracking.
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton
            onClick={() => fetchDashboardData(true)}
            sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f5f5f5' } }}
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={24} /> : <Refresh color="primary" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((c, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card
              onClick={() => navigate(c.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2.5,
                bgcolor: c.bg,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }
              }}
            >
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'white', mr: 2.5, display: 'flex', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                {c.icon}
              </Box>
              <CardContent sx={{ p: '0 !important', flexGrow: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {c.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#263238' }}>
                  {loading ? '...' : c.count}
                </Typography>
              </CardContent>
              <ArrowForward sx={{ color: 'text.disabled', ml: 1 }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Announcements & Feedback */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Announcements Section */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Campaign color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Active Announcements
                  </Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/announcements')}>
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              {announcements.length > 0 ? (
                <Grid container spacing={2}>
                  {announcements.map((item) => (
                    <Grid item xs={12} sm={6} key={item.announcement_id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRadius: 2,
                          borderLeft: '4px solid #1976d2',
                          p: 2
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#212529' }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                            {item.content?.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid #f0f0f0' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Schedule sx={{ fontSize: 14 }} />
                            {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'Recent'}
                          </Typography>
                          {item.attachment_path && (
                            <Chip size="small" icon={<Attachment sx={{ fontSize: '14px !important' }} />} label="Attachment" color="primary" variant="outlined" />
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

            {/* Resident Feedbacks Section */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FeedbackIcon sx={{ color: '#ed6c02' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Resident Feedback
                  </Typography>
                </Box>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/feedback')}>
                  Manage Feedback
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {feedbacks.length > 0 ? (
                <Stack spacing={1.5}>
                  {feedbacks.map((fb) => (
                    <Box
                      key={fb.feedback_id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#fafafa',
                        borderLeft: '4px solid #ed6c02',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          @{fb.username || 'Resident'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fb.timestamp ? new Date(fb.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#263238', mb: 0.5 }}>
                        Subject: {fb.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {fb.content}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No resident feedbacks submitted yet.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Live Camera Tracking */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Videocam color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Vision-Trak Logs
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/detection-logs')}>
                View Logs
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {detectionLogs.length > 0 ? (
              <Stack spacing={2}>
                {detectionLogs.map((log) => {
                  const isHighConfidence = (log.confidence_score || 0) >= 0.70;
                  return (
                    <Card
                      key={log.log_id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderRight: isHighConfidence ? '5px solid #2e7d32' : '5px solid #9e9e9e',
                        bgcolor: isHighConfidence ? '#f1f8e9' : 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {log.camera_name || `Camera #${log.camera_id || 1}`}
                        </Typography>
                        <Chip
                          size="small"
                          icon={isHighConfidence ? <LocalShipping sx={{ fontSize: '14px !important' }} /> : <Videocam sx={{ fontSize: '14px !important' }} />}
                          label={isHighConfidence ? 'TRUCK DETECTED' : 'SCANNING'}
                          color={isHighConfidence ? 'success' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                        <span>Confidence: {((log.confidence_score || 0) * 100).toFixed(1)}%</span>
                        <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <CheckCircle sx={{ fontSize: 40, color: '#a5d6a7', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Camera Monitoring Idle
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Detection events will appear live as trucks enter collection zones.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}