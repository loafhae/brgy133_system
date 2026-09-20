import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Paper, Chip,
  Stack, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
  LocalShipping, Campaign, Feedback as FeedbackIcon,
  Login as LoginIcon, CheckCircle, Videocam, ArrowForward,
  AccessTime, Refresh, Smartphone,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Philippine Standard Time Clock
  const [pstTime, setPstTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPstTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'Asia/Manila',
        }) + ' • ' +
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime truck status
  const [truckStatus, setTruckStatus] = useState({ status: 'idle', last_detection: null });
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = () => {
    setLoadingStatus(true);
    api.get('/detection/status')
      .then((res) => {
        if (res.data) setTruckStatus(res.data);
      })
      .catch(() => {
        setTruckStatus({ status: 'idle', last_detection: null });
      })
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', color: '#18181b' }}>
      {/* Top GovPH Strip */}
      <Box sx={{ bgcolor: '#730000', color: '#ffffff', py: 0.75, px: 2, fontSize: '0.75rem', borderBottom: '1px solid #5a0000' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            BARANGAY 133, TONDO, MANILA
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 13, color: '#fde047' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              PST: {pstTime || 'Loading...'}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Navbar */}
      <Box
        component="header"
        sx={{
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e4e4e7',
          py: 1.8,
        }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Barangay 133 Seal"
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                p: 0.3,
                border: '2px solid #990000',
                bgcolor: '#ffffff',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#990000', lineHeight: 1.1, letterSpacing: -0.5 }}>
                BARANGAY 133
              </Typography>
              <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Announcement &amp; Garbage Collection Notifier System
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            startIcon={<LoginIcon fontSize="small" />}
            sx={{
              bgcolor: '#990000',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 2.5,
              py: 1,
              '&:hover': { bgcolor: '#730000' },
            }}
          >
            {user ? 'Open Dashboard' : 'Official Portal Login'}
          </Button>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 10 },
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e4e4e7',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Vision-Trak IoT Monitoring Platform"
                size="small"
                sx={{
                  bgcolor: '#fef2f2',
                  color: '#990000',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  mb: 2.5,
                  border: '1px solid #fecaca',
                }}
              />

              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                  fontWeight: 800,
                  color: '#18181b',
                  lineHeight: 1.15,
                  letterSpacing: -0.5,
                  mb: 2.5,
                }}
              >
                Smart Waste Alerts &amp; <Box component="span" sx={{ color: '#990000' }}>Barangay Updates</Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#52525b',
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.7,
                  mb: 4,
                  maxWidth: '600px',
                }}
              >
                A centralized multi-platform system for Barangay 133, Tondo, Manila. Designed to eliminate floating garbage collection uncertainty through automated CCTV detection and provide instant community announcements.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: '#990000',
                    py: 1.4,
                    px: 3.5,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    '&:hover': { bgcolor: '#730000' },
                  }}
                >
                  Enter Official Portal
                </Button>
              </Stack>
            </Grid>

            {/* Right: Live IoT Status Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: truckStatus.status === 'active' ? '#059669' : '#e4e4e7',
                  bgcolor: '#ffffff',
                  boxShadow: '0 10px 30px -4px rgba(153, 0, 0, 0.06)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: truckStatus.status === 'active' ? '#059669' : '#71717a',
                        boxShadow: truckStatus.status === 'active' ? '0 0 0 3px rgba(5, 150, 105, 0.25)' : 'none',
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#18181b' }}>
                      VISION-TRAK DETECTOR
                    </Typography>
                  </Box>
                  <Tooltip title="Refresh Status">
                    <span>
                      <IconButton size="small" onClick={fetchStatus} disabled={loadingStatus}>
                        <Refresh fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: truckStatus.status === 'active' ? '#ecfdf5' : '#f4f4f5',
                    border: '1px solid',
                    borderColor: truckStatus.status === 'active' ? '#a7f3d0' : '#e4e4e7',
                    mb: 3,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                    Live Collection Status
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: truckStatus.status === 'active' ? '#065f46' : '#27272a',
                      mt: 0.5,
                      lineHeight: 1.25,
                    }}
                  >
                    {truckStatus.status === 'active'
                      ? 'Garbage Truck Detected in Area!'
                      : 'Standby / No Truck Detected'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#52525b', display: 'block', mt: 0.75 }}>
                    {truckStatus.last_detection?.message
                      ? truckStatus.last_detection.message
                      : 'Cameras are continuously scanning collection points in Barangay 133.'}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Smartphone sx={{ fontSize: 18, color: '#990000' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#18181b' }}>
                      Mobile App Push Notifications
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#52525b', display: 'block', lineHeight: 1.5 }}>
                    Residents receive automated push alerts on their mobile app immediately when a truck is detected, prompting timely waste disposal.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3 Core System Pillars */}
      <Box sx={{ py: 8, bgcolor: '#fafafa' }}>
        <Container maxWidth="lg">
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', textAlign: 'center', mb: 1 }}>
            System Core Functionalities
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a', textAlign: 'center', mb: 5 }}>
            Purpose-built for Barangay 133 official administration and community sanitation.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e4e4e7',
                }}
              >
                <Box sx={{ p: 1.3, borderRadius: 2, bgcolor: '#fef2f2', color: '#990000', display: 'inline-flex', mb: 2 }}>
                  <Videocam />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                  CCTV Truck Detection
                </Typography>
                <Typography variant="body2" sx={{ color: '#52525b', lineHeight: 1.6 }}>
                  Computer vision models process live IP CCTV camera feeds to recognize waste collection vehicles without relying on uncertain floating schedules.
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e4e4e7',
                }}
              >
                <Box sx={{ p: 1.3, borderRadius: 2, bgcolor: '#fef2f2', color: '#990000', display: 'inline-flex', mb: 2 }}>
                  <Campaign />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                  Centralized Announcements
                </Typography>
                <Typography variant="body2" sx={{ color: '#52525b', lineHeight: 1.6 }}>
                  Barangay officials publish verified announcements, updates, and emergency notices with instant push broadcast to all registered residents.
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e4e4e7',
                }}
              >
                <Box sx={{ p: 1.3, borderRadius: 2, bgcolor: '#fef2f2', color: '#990000', display: 'inline-flex', mb: 2 }}>
                  <FeedbackIcon />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                  Feedback &amp; Reports
                </Typography>
                <Typography variant="body2" sx={{ color: '#52525b', lineHeight: 1.6 }}>
                  Officials review resident concerns, track missed collection reports, and generate activity summaries to improve barangay operations.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Minimal Footer */}
      <Box sx={{ bgcolor: '#18181b', color: '#71717a', py: 3.5, borderTop: '1px solid #27272a' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
            Barangay 133, Tondo, Manila • Vision-Trak IoT System
          </Typography>
          <Typography variant="caption" sx={{ color: '#71717a' }}>
            © {new Date().getFullYear()} Barangay 133. All Rights Reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
