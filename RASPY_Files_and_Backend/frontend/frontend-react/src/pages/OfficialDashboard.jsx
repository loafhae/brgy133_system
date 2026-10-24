import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Stack, Paper, Divider,
  IconButton, LinearProgress
} from '@mui/material';
import {
  Campaign, Feedback as FeedbackIcon, Videocam, CheckCircle, AccessTime,
  AttachFile, ArrowForward, Circle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [detectionLogs, setDetectionLogs] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const announceRes = await api.get('/announcements?published_only=true&limit=3');
      if (announceRes.data) {
        setAnnouncements(announceRes.data);
      }

      const feedbackRes = await api.get('/feedback?limit=5');
      if (feedbackRes.data) {
        setFeedbacks(feedbackRes.data);
      }

      const detectionRes = await api.get('/detection/logs');
      if (detectionRes.data && Array.isArray(detectionRes.data)) {
        setDetectionLogs(detectionRes.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Error loading official dashboard data via api client:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    let feedbackSocket = null;
    let systemSocket = null;
    let feedbackReconnectTimer = null;
    let systemReconnectTimer = null;

    function connectSockets() {
      let wsBaseUrl;
      try {
        const baseURL = api.defaults.baseURL || window.location.origin;
        const parsedUrl = new URL(baseURL, window.location.origin);
        const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBaseUrl = `${wsProtocol}//${parsedUrl.host}`;
      } catch (e) {
        wsBaseUrl = window.location.origin.replace(/^http/, 'ws');
      }

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

        feedbackSocket = new WebSocket(`${wsBaseUrl}/api/ws/feedback-updates${tokenParam}`);
        systemSocket = new WebSocket(`${wsBaseUrl}/api/ws${tokenParam}`);

        feedbackSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.event === 'new_feedback') fetchDashboardData();
          } catch (e) {
            console.error(e);
          }
        };

        systemSocket.onmessage = () => {
          fetchDashboardData();
        };

        systemSocket.onclose = () => {
          systemReconnectTimer = setTimeout(connectSockets, 3000);
        };

        feedbackSocket.onclose = () => {
          feedbackReconnectTimer = setTimeout(connectSockets, 3000);
        };

        systemSocket.onerror = () => {};
        feedbackSocket.onerror = () => {};
      } catch (err) {
        console.warn('WebSocket connection skipped or unavailable:', err);
      }
    }

    connectSockets();

    const polling = setInterval(() => {
      if (!document.hidden) fetchDashboardData();
    }, 15000);

    return () => {
      clearInterval(polling);
      clearTimeout(feedbackReconnectTimer);
      clearTimeout(systemReconnectTimer);
      try {
        if (feedbackSocket) feedbackSocket.close();
        if (systemSocket) systemSocket.close();
      } catch (e) {
        // Cleanup error suppression
      }
    };
  }, []);

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      {/* Header section with clean visual hierarchy */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Official Operations Dashboard
            </Typography>
            <Chip
              label="Barangay Official"
              size="small"
              sx={{ bgcolor: 'rgba(88, 125, 70, 0.12)', color: '#3f5d30', fontWeight: 750, fontSize: '0.72rem', border: '1px solid rgba(88, 125, 70, 0.25)' }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.92rem' }}>
            Real-time community announcements, resident complaints & feedback, and live vision tracking stream.
          </Typography>
        </Box>
      </Box>

      {/* SECTION 1: Top Announcements Grid */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Campaign sx={{ color: '#587d46', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 750, color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              Active Community Announcements
            </Typography>
          </Stack>
          <Typography
            onClick={() => navigate('/announcements')}
            variant="caption"
            sx={{ color: '#587d46', fontWeight: 750, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            Manage Announcements →
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {announcements?.length > 0 ? (
            announcements.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item?.announcement_id}>
                <Card
                  sx={{
                    p: 2.8,
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    borderLeft: '4px solid #587d46',
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' },
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#0f172a', mb: 1, lineHeight: 1.3 }}>
                      {item?.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#475569',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item?.content}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.2, borderTop: '1px solid #f1f5f9' }}>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                      <AccessTime sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.74rem' }}>
                        {item?.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'Recent'}
                      </Typography>
                    </Stack>
                    {item?.attachment_path && (
                      <Chip
                        icon={<AttachFile sx={{ fontSize: '13px !important' }} />}
                        label="Attachment"
                        size="small"
                        sx={{ bgcolor: 'rgba(88, 125, 70, 0.12)', color: '#3f5d30', fontSize: '0.7rem', height: 22, fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: 3 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                  No published announcements available at this time.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* SECTION 2: Split Columns */}
      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* Left Column: Recent Resident Feedback */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3.5, bgcolor: '#ffffff', borderRadius: 3.5, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <FeedbackIcon sx={{ color: '#d97706', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Recent Resident Feedback & Inquiries
                </Typography>
              </Stack>
              <Chip
                label={`${feedbacks.length} New`}
                size="small"
                sx={{ bgcolor: 'rgba(217, 119, 6, 0.12)', color: '#b45309', fontWeight: 800, fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, maxHeight: 440, overflowY: 'auto', pr: 0.5 }}>
              {feedbacks?.length > 0 ? (
                feedbacks.map((fb) => (
                  <Box
                    key={fb?.feedback_id}
                    sx={{
                      p: 2.2,
                      bgcolor: '#f8fafc',
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      borderLeft: '4px solid #d97706',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#ffffff', borderColor: '#cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography variant="caption" sx={{ fontWeight: 750, color: '#587d46', fontSize: '0.78rem' }}>
                        @{fb?.username || 'Resident'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        {fb?.timestamp ? new Date(fb.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, fontSize: '0.88rem' }}>
                      {fb?.subject || 'Community Concern'}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                      {fb?.content}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No feedback entries recorded in the system.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Live Vision-Trak Camera Status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3.5, bgcolor: '#ffffff', borderRadius: 3.5, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid #f1f5f9' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Videocam sx={{ color: '#16a34a', fontSize: 22 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Vision-Trak Live Monitor
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
                <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  LIVE
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              {detectionLogs?.length > 0 ? (
                detectionLogs.map((log) => {
                  const confidence = log?.confidence_score ?? 0;
                  const eventType = log?.event_type;
                  const isPresent = eventType === 'truck_present';
                  const isDeparted = eventType === 'truck_departed';
                  const label = isPresent ? 'TRUCK DETECTED' : isDeparted ? 'TRUCK DEPARTED' : 'SCANNING';
                  const chipColor = isPresent ? '#15803d' : isDeparted ? '#b45309' : '#475569';
                  const chipBg = isPresent ? 'rgba(34, 197, 94, 0.12)' : isDeparted ? 'rgba(245, 158, 11, 0.12)' : '#f1f5f9';
                  const borderColor = isPresent ? '#22c55e' : isDeparted ? '#f59e0b' : '#cbd5e1';

                  return (
                    <Box
                      key={log?.log_id}
                      sx={{
                        p: 2.2,
                        bgcolor: '#f8fafc',
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${borderColor}`,
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#ffffff', borderColor: '#cbd5e1' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a', fontSize: '0.9rem' }}>
                          {log?.camera_name || 'CCTV Camera Stream'}
                        </Typography>
                        <Chip
                          label={label}
                          size="small"
                          sx={{
                            bgcolor: chipBg,
                            color: chipColor,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            letterSpacing: '0.04em',
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600 }}>
                          Confidence: {(confidence * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                          {log?.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, confidence * 100))}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isPresent ? '#22c55e' : '#f59e0b',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    No detection events logged recently.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}