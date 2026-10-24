import { useState, useEffect } from 'react';
import { Box, Grid, Card, Typography, Button, Stack, Chip, Paper, IconButton, Tooltip } from '@mui/material';
import {
  People, Person, Feedback, ArrowForward, Shield, Speed, History,
  Settings, Videocam, CheckCircle, Refresh, Campaign, Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_users: 0, total_residents: 0, total_feedback: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const fetchStats = () => {
    setLoading(true);
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      title: 'System Users',
      subtitle: 'Admins & Authorized Staff',
      count: stats.total_users,
      icon: <People sx={{ color: '#587d46', fontSize: 28 }} />,
      accentColor: '#587d46',
      bgLight: 'rgba(88, 125, 70, 0.12)',
      borderAccent: 'rgba(88, 125, 70, 0.25)',
      path: '/users',
      actionText: 'Manage Users',
    },
    {
      title: 'Registered Residents',
      subtitle: 'Barangay 133 Population Masterlist',
      count: stats.total_residents,
      icon: <Person sx={{ color: '#b93636', fontSize: 28 }} />,
      accentColor: '#b93636',
      bgLight: 'rgba(185, 54, 54, 0.1)',
      borderAccent: 'rgba(185, 54, 54, 0.25)',
      path: '/residents',
      actionText: 'View Directory',
    },
    {
      title: 'Citizen Feedbacks',
      subtitle: 'Reports, Inquiries & Concerns',
      count: stats.total_feedback,
      icon: <Feedback sx={{ color: '#d97706', fontSize: 28 }} />,
      accentColor: '#d97706',
      bgLight: 'rgba(217, 119, 6, 0.1)',
      borderAccent: 'rgba(217, 119, 6, 0.25)',
      path: '/feedback',
      actionText: 'Review Messages',
    },
  ];

  const quickActions = [
    {
      title: 'Residents Masterlist',
      desc: 'Verify, register, and update resident demographic records',
      icon: <People sx={{ color: '#587d46', fontSize: 26 }} />,
      path: '/residents',
      badge: 'Database',
    },
    {
      title: 'AI Detection Logs',
      desc: 'Real-time CCTV garbage truck monitoring & inference logs',
      icon: <Videocam sx={{ color: '#0284c7', fontSize: 26 }} />,
      path: '/detection-logs',
      badge: 'Vision AI',
    },
    {
      title: 'Public Announcements',
      desc: 'Broadcast updates and advisories to residents',
      icon: <Campaign sx={{ color: '#b93636', fontSize: 26 }} />,
      path: '/announcements',
      badge: 'Broadcast',
    },
    {
      title: 'Audit & System Logs',
      desc: 'Trace logins, role assignments, and security activities',
      icon: <Speed sx={{ color: '#d97706', fontSize: 26 }} />,
      path: '/system-logs',
      badge: 'Security',
    },
  ];

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      {/* Hero Welcome Banner */}
      <Card
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #131e12 0%, #1c2e1b 50%, #253d23 100%)',
          color: '#ffffff',
          borderRadius: 3.5,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(19, 30, 18, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Subtle decorative background glow */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120, 159, 100, 0.35) 0%, rgba(120, 159, 100, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3 }}>
          <Box sx={{ maxWidth: 700 }}>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 1.2 }}>
              <Chip
                label="LIVE OPERATIONS"
                size="small"
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.2)',
                  color: '#86efac',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em',
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                {currentTime} • Philippine Standard Time (PST)
              </Typography>
            </Stack>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 1, fontSize: { xs: '1.6rem', md: '2.1rem' }, letterSpacing: '-0.025em' }}>
              Welcome back, {user?.first_name || user?.username || 'Administrator'}!
            </Typography>

            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.94rem', lineHeight: 1.6 }}>
              Barangay 133 Vision-Trak central command operations. Real-time smart detection, resident management, and community alert dispatch.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center' }}>
            <Tooltip title="Refresh Stats">
              <IconButton
                onClick={fetchStats}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 2.2,
                  p: 1.2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<Videocam />}
              onClick={() => navigate('/detection-logs')}
              sx={{
                bgcolor: '#587d46',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: 2.5,
                px: 2.8,
                py: 1.2,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: '#699554' },
              }}
            >
              Live Detection
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Spacious Stat Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((c, idx) => (
          <Grid size={{ xs: 12, md: 4 }} key={idx}>
            <Card
              sx={{
                p: 3,
                bgcolor: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.85)',
                borderRadius: 3.5,
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 6px 20px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                  borderColor: c.borderAccent,
                },
              }}
            >
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: c.accentColor,
              }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                  p: 1.4,
                  borderRadius: 2.8,
                  bgcolor: c.bgLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {c.icon}
                </Box>
                <Chip
                  label="Live Synced"
                  size="small"
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    letterSpacing: '0.02em',
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 650, color: '#64748b', mb: 0.5 }}>
                {c.title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.8, letterSpacing: '-0.03em' }}>
                {loading ? '...' : c.count.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2.5, fontSize: '0.78rem' }}>
                {c.subtitle}
              </Typography>

              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 16, transition: 'transform 0.2s' }} />}
                onClick={() => navigate(c.path)}
                sx={{
                  color: c.accentColor,
                  fontWeight: 750,
                  fontSize: '0.84rem',
                  p: 0,
                  '&:hover': {
                    bgcolor: 'transparent',
                    '& .MuiButton-endIcon': { transform: 'translateX(4px)' }
                  },
                }}
              >
                {c.actionText}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Launch Panel & System Health Status */}
      <Grid container spacing={3}>
        {/* Quick Launch Action Cards */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{
            p: 3.5,
            bgcolor: '#ffffff',
            borderRadius: 3.5,
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
            height: '100%',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Administrative Quick Actions
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Fast access to most frequently used operations and logs
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {quickActions.map((action, idx) => (
                <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                  <Card
                    onClick={() => navigate(action.path)}
                    sx={{
                      p: 2.2,
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2.8,
                      bgcolor: '#ffffff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#587d46',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 18px rgba(88, 125, 70, 0.1)',
                        bgcolor: 'rgba(88, 125, 70, 0.02)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Box sx={{
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {action.icon}
                      </Box>
                      <Chip
                        label={action.badge}
                        size="small"
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 750,
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                          borderRadius: 1.5,
                        }}
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a', mb: 0.4 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.4 }}>
                      {action.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* System Health & Infrastructure Widget */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{
            p: 3.5,
            bgcolor: '#ffffff',
            borderRadius: 3.5,
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                System Health & Nodes
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem', display: 'block', mb: 3 }}>
                Live telemetry and operational readiness
              </Typography>

              <Stack spacing={2.2}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        MySQL Database
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Schema synced & operational
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="ONLINE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        YOLOv8 AI Detector
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Inference engine ready
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="ACTIVE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Cloudflare Tunnel
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Encrypted remote ingress
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="SECURE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#15803d', fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>
              </Stack>
            </Box>

            <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f1f5f9' }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => navigate('/settings')}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  borderRadius: 2.2,
                  py: 1,
                  fontSize: '0.84rem',
                  fontWeight: 650,
                  '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                }}
              >
                Configure System Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}