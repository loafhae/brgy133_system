import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card,
  Chip, Stack, Paper, Divider, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
  ArrowForward, Login as LoginIcon, Logout as LogoutIcon, VerifiedUser,
  Campaign, VolunteerActivism, Recycling,
  Dashboard as DashboardIcon, PhoneAndroid,
  Shield, CheckCircle, Videocam,
  NotificationsActive, LocationOn, Phone, Email, Policy, Gavel, Cookie as CookieIcon,
  WarningAmber, Security, InfoOutlined, AccessTime,
  Menu as MenuIcon, Close as CloseIcon, GetApp, HelpOutline,
  Call, Smartphone, Check, DownloadDone
} from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);

  useEffect(() => {
    // Fetch live public announcements
    api.get('/announcements/public?limit=3')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {
        // Fallback default announcements will be used
      })
      .finally(() => {
        setLoadingAnnouncements(false);
      });
  }, []);

  const defaultAnnouncements = [
    {
      announcement_id: 1,
      title: 'Libreng Medical Mission at Konsultasyon sa Health Center',
      content: 'Inaanyayahan ang lahat ng residente para sa libreng wellness check-up, konsultasyong pambata, at pamamahagi ng bitamina sa darating na Sabado sa Barangay Health Center.',
      date_posted: new Date().toISOString(),
      priority: 'Kalusugan'
    },
    {
      announcement_id: 2,
      title: 'Barangay General Assembly at Ulat sa Pamayanan',
      content: 'Inaanyayahan ang lahat ng mamamayan na makiisa sa talakayan ukol sa mga proyektong pampamayanan, kapayapaan, at mga susunod na programa ng ating barangay.',
      date_posted: new Date().toISOString(),
      priority: 'Mahalaga'
    },
    {
      announcement_id: 3,
      title: 'Paalala sa Tamang Paglalabas ng Basura at Segregation',
      content: 'Alinsunod sa ating Clean & Green program, pakiusap na ilabas lamang ang mga nakabukod na basura 30 minuto bago ang takdang oras ng paghakot ng trak ng basura sa inyong kalye.',
      date_posted: new Date().toISOString(),
      priority: 'Pangkalahatan'
    }
  ];

  const displayAnnouncements = announcements.length > 0 ? announcements : defaultAnnouncements;

  const services = [
    {
      icon: <VerifiedUser sx={{ fontSize: 26, color: '#7d9c65' }} />,
      bg: 'rgba(125, 156, 101, 0.12)',
      title: 'Kapayapaan & Serbisyong Tanod',
      desc: '24/7 na pagpapatrolya ng Barangay Tanod, pagpapanatili ng kaayusan sa bawat kalye, at mabilisang pagtugon sa mga sumbong ng mamamayan.',
    },
    {
      icon: <Campaign sx={{ fontSize: 26, color: '#b93636' }} />,
      bg: 'rgba(185, 54, 54, 0.1)',
      title: 'Ulat at Aksyon sa mga Reklamo',
      desc: 'Maagap na pagdinig sa mga hinaing ng mga residente, maayos na pamamagitan ng Lupong Tagapamayapa, at agarang aksyon sa komunidad.',
    },
    {
      icon: <VolunteerActivism sx={{ fontSize: 26, color: '#7d9c65' }} />,
      bg: 'rgba(125, 156, 101, 0.12)',
      title: 'Kalusugan at Serbisyong Panlipunan',
      desc: 'Libreng konsultasyon sa Barangay Health Center, regular na bakuna, at mga programang pangkalinga para sa mga senior citizens, kabataan, at PWD.',
    },
    {
      icon: <Recycling sx={{ fontSize: 26, color: '#ff9c4c' }} />,
      bg: 'rgba(255, 156, 76, 0.15)',
      title: 'Kalinisan at Vision-Trak Waste Monitoring',
      desc: 'Matalinong AI CCTV truck detection para sa maagap na pagsubaybay sa regular na paghakot ng basura at kaayusan ng kapaligiran.',
    }
  ];

  return (
    <Box sx={{
      bgcolor: '#f7f8f4',
      color: '#1c2419',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* 0. Accessible Skip to Main Content Link */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          top: -100,
          left: 16,
          zIndex: 9999,
          bgcolor: '#587d46',
          color: '#ffffff',
          px: 2.5,
          py: 1.2,
          borderRadius: 2,
          fontWeight: 750,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          transition: 'top 0.2s ease',
          '&:focus': {
            top: 16,
            outline: '3px solid #ffffff'
          }
        }}
      >
        Skip to main content
      </Box>

      {/* 1. Dignified Top Civic Ribbon - Optimized for Mobile */}
      <Box sx={{
        bgcolor: '#172115',
        color: '#c2d8b2',
        py: { xs: 0.6, sm: 0.8 },
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.3} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7d9c65', boxShadow: '0 0 6px #7d9c65' }} />
              <Typography variant="caption" sx={{ fontWeight: 650, letterSpacing: { xs: 0.4, sm: 0.8 }, color: '#f7f8f4', fontSize: { xs: '0.68rem', sm: '0.73rem' } }}>
                REPUBLIKA NG PILIPINAS • BARANGAY 133
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#c2d8b2', fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>
              Vision-Trak Intelligent Public Monitoring & Civic Gateway
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* 2. Sleek Floating Header / Navigation */}
      <Paper elevation={0} sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(228, 232, 220, 0.8)'
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: { xs: 1, sm: 1.4 } }}>

            {/* Barangay Identity Brand */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, sm: 1.6 }, cursor: 'pointer' }}
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Official Seal of Barangay 133, City of Manila"
                sx={{
                  width: { xs: 36, sm: 44 },
                  height: { xs: 36, sm: 44 },
                  borderRadius: '50%',
                  objectFit: 'cover',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#b93636', letterSpacing: 0.5, fontSize: { xs: '1.02rem', sm: '1.2rem' } }}>
                  BARANGAY 133
                </Typography>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 650, display: 'block', fontSize: { xs: '0.68rem', sm: '0.72rem' } }}>
                  Opisyal na Pamahalaan
                </Typography>
              </Box>
            </Box>

            {/* Center Navigation Links (Desktop only) */}
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Button
                href="#serbisyo"
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.92rem',
                  color: '#334155',
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': { color: '#b93636', bgcolor: 'rgba(185, 54, 54, 0.05)' }
                }}
              >
                Mga Serbisyo
              </Button>
              <Button
                href="#anunsyo"
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.92rem',
                  color: '#334155',
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': { color: '#b93636', bgcolor: 'rgba(185, 54, 54, 0.05)' }
                }}
              >
                Mga Anunsyo
              </Button>
              <Button
                href="#mobile-app"
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.92rem',
                  color: '#334155',
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': { color: '#b93636', bgcolor: 'rgba(185, 54, 54, 0.05)' }
                }}
              >
                Resident App
              </Button>
              <Button
                href="#impormasyon"
                sx={{
                  textTransform: 'none',
                  fontWeight: 650,
                  fontSize: '0.92rem',
                  color: '#334155',
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': { color: '#b93636', bgcolor: 'rgba(185, 54, 54, 0.05)' }
                }}
              >
                Impormasyon & Legal
              </Button>
            </Stack>

            {/* Right Action: Desktop buttons + Mobile Hamburger Toggle */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {/* Desktop action buttons */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                {user ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/dashboard')}
                      startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 750,
                        px: 2.2,
                        py: 0.9,
                        fontSize: '0.88rem',
                        bgcolor: '#b93636',
                        boxShadow: '0 4px 12px rgba(185, 54, 54, 0.25)',
                        '&:hover': { bgcolor: '#8f2222' }
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => logout()}
                      startIcon={<LogoutIcon sx={{ fontSize: 17 }} />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 1.6,
                        py: 0.85,
                        fontSize: '0.82rem',
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
                      }}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      component="a"
                      href="/visiontrak.apk"
                      download="VisionTrak_Barangay133.apk"
                      variant="outlined"
                      startIcon={<GetApp sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 1.8,
                        py: 0.85,
                        fontSize: '0.84rem',
                        borderColor: '#789f64',
                        color: '#3f5d30',
                        bgcolor: 'rgba(120, 159, 100, 0.08)',
                        '&:hover': { borderColor: '#587d46', bgcolor: 'rgba(120, 159, 100, 0.16)' }
                      }}
                    >
                      Download App
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/login')}
                      startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 750,
                        px: 2.5,
                        py: 0.9,
                        fontSize: '0.88rem',
                        bgcolor: '#b93636',
                        boxShadow: '0 4px 14px rgba(185, 54, 54, 0.25)',
                        '&:hover': { bgcolor: '#8f2222', transform: 'translateY(-1px)' }
                      }}
                    >
                      Portal Login
                    </Button>
                  </>
                )}
              </Box>

              {/* Mobile Quick Download Pill on xs */}
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.8 }}>
                <Button
                  component="a"
                  href="/visiontrak.apk"
                  download="VisionTrak_Barangay133.apk"
                  size="small"
                  variant="outlined"
                  startIcon={<GetApp sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 750,
                    px: 1.2,
                    py: 0.6,
                    fontSize: '0.74rem',
                    borderColor: '#789f64',
                    color: '#3f5d30',
                    bgcolor: 'rgba(120, 159, 100, 0.08)'
                  }}
                >
                  App APK
                </Button>
              </Box>

              {/* Mobile Hamburger Drawer Trigger */}
              <IconButton
                aria-label="Buksan ang navigasyon"
                onClick={() => setMobileDrawerOpen(true)}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  color: '#0f172a',
                  bgcolor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 0.9,
                  '&:hover': { bgcolor: '#e2e8f0' }
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Stack>

          </Stack>
        </Container>
      </Paper>

      {/* Mobile Navigation Drawer for Phones & Tablets */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '82%', sm: 340 },
            bgcolor: '#111a10',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* Drawer Top Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Barangay 133 Seal"
                sx={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #789f64' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.96rem', lineHeight: 1.1 }}>
                  BARANGAY 133
                </Typography>
                <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5 }}>
                  VISION-TRAK CIVIC PORTAL
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => setMobileDrawerOpen(false)}
              sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Navigation Links */}
          <List sx={{ pt: 2, pb: 1 }}>
            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component="a"
                href="#serbisyo"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#86efac' }}>
                  <VerifiedUser fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Mga Serbisyo"
                  secondary="Pulisya, Tanod, Health Center"
                  primaryTypographyProps={{ fontWeight: 750, fontSize: '0.92rem', color: '#f8fafc' }}
                  secondaryTypographyProps={{ fontSize: '0.72rem', color: '#94a3b8' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component="a"
                href="#anunsyo"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#fca5a5' }}>
                  <Campaign fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Mga Anunsyo"
                  secondary="Opisyal na Ulat at Balita"
                  primaryTypographyProps={{ fontWeight: 750, fontSize: '0.92rem', color: '#f8fafc' }}
                  secondaryTypographyProps={{ fontSize: '0.72rem', color: '#94a3b8' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component="a"
                href="#mobile-app"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: 'rgba(120, 159, 100, 0.14)',
                  border: '1px solid rgba(120, 159, 100, 0.3)',
                  '&:hover': { bgcolor: 'rgba(120, 159, 100, 0.22)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#a7f3d0' }}>
                  <PhoneAndroid fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Resident Mobile App"
                  secondary="I-download ang Android APK"
                  primaryTypographyProps={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}
                  secondaryTypographyProps={{ fontSize: '0.72rem', color: '#a7f3d0' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component="a"
                href="#impormasyon"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#fde047' }}>
                  <WarningAmber fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Emergency Hotlines & CCTV"
                  secondary="911, MPD, BFP & Transparency"
                  primaryTypographyProps={{ fontWeight: 750, fontSize: '0.92rem', color: '#f8fafc' }}
                  secondaryTypographyProps={{ fontSize: '0.72rem', color: '#94a3b8' }}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component={Link}
                to="/privacy-policy"
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  px: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: '#94a3b8' }}>
                  <Shield fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Data Privacy Policy (RA 10173)"
                  primaryTypographyProps={{ fontWeight: 650, fontSize: '0.86rem', color: '#cbd5e1' }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Drawer Bottom Actions: Direct App Download & Login */}
        <Box sx={{ p: 2.5, bgcolor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack spacing={1.5}>
            <Button
              component="a"
              href="/visiontrak.apk"
              download="VisionTrak_Barangay133.apk"
              variant="contained"
              fullWidth
              startIcon={<GetApp />}
              sx={{
                bgcolor: '#587d46',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: 2.2,
                py: 1.3,
                fontSize: '0.9rem',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(88, 125, 70, 0.4)',
                '&:hover': { bgcolor: '#476837' }
              }}
            >
              I-download ang Mobile App (.APK)
            </Button>

            <Button
              component="a"
              href="tel:911"
              variant="outlined"
              fullWidth
              startIcon={<Call />}
              sx={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                fontWeight: 750,
                borderRadius: 2.2,
                py: 1.1,
                fontSize: '0.86rem',
                textTransform: 'none',
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                '&:hover': { borderColor: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.16)' }
              }}
            >
              Emergency Hotline: 911
            </Button>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {user ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => { setMobileDrawerOpen(false); navigate('/dashboard'); }}
                startIcon={<DashboardIcon />}
                sx={{
                  bgcolor: '#b93636',
                  color: '#ffffff',
                  fontWeight: 750,
                  borderRadius: 2.2,
                  py: 1.1,
                  fontSize: '0.88rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#8f2222' }
                }}
              >
                Pumunta sa Dashboard
              </Button>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => { setMobileDrawerOpen(false); navigate('/login'); }}
                startIcon={<LoginIcon />}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#f8fafc',
                  fontWeight: 700,
                  borderRadius: 2.2,
                  py: 1.1,
                  fontSize: '0.86rem',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' }
                }}
              >
                Portal Login (Officials & Admin)
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>


      {/* 3. HERO SECTION WITH RICH RED CIVIC GRADIENT & BARANGAY PHOTO OVERLAY */}
      <Box id="main-content" tabIndex={-1} sx={{
        outline: 'none',
        position: 'relative',
        backgroundImage: 'linear-gradient(135deg, rgba(69, 10, 10, 0.90) 0%, rgba(127, 29, 29, 0.86) 30%, rgba(153, 27, 27, 0.84) 65%, rgba(185, 28, 28, 0.88) 100%), url(/barangay.jpg?v=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#ffffff',
        pt: { xs: 5, sm: 7, md: 10 },
        pb: { xs: 7, sm: 9, md: 12 },
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Subtle Decorative Ambient Glows */}
        <Box sx={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: { xs: '320px', md: '650px' },
          height: { xs: '320px', md: '650px' },
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2.5, sm: 3 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'center' }}>

            {/* Left Column: Compelling Typography & CTAs */}
            <Grid size={{ xs: 12, md: 7 }}>

              {/* Civic Badge Pill */}
              <Stack direction="row" spacing={1} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                <Chip
                  icon={<Shield sx={{ fontSize: '14px !important', color: '#fff2a0' }} />}
                  label="OPISYAL NA PORTAL NG KOMUNIDAD"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.14)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    fontWeight: 750,
                    fontSize: { xs: '0.68rem', sm: '0.74rem' },
                    letterSpacing: 0.6,
                    px: { xs: 0.8, sm: 1.2 },
                    py: 0.5,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                />
              </Stack>

              {/* Main Headline - Handcrafted for Mobile Readability */}
              <Typography variant="h1" sx={{
                fontWeight: 900,
                fontSize: { xs: '2.1rem', sm: '3rem', md: '3.8rem' },
                lineHeight: { xs: 1.18, md: 1.12 },
                letterSpacing: { xs: -0.5, md: -1 },
                color: '#ffffff',
                mb: { xs: 2, md: 2.5 },
                textShadow: '0 2px 16px rgba(0,0,0,0.25)'
              }}>
                Serbisyong Tapat at may{' '}
                <Box
                  component="span"
                  sx={{
                    color: '#fff2a0',
                    textShadow: '0 0 24px rgba(255, 242, 160, 0.45)',
                    display: 'inline-block'
                  }}
                >
                  Malasakit
                </Box>
              </Typography>

              {/* Clear Subtitle */}
              <Typography variant="body1" sx={{
                fontSize: { xs: '0.92rem', sm: '1.05rem', md: '1.18rem' },
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: { xs: 1.6, md: 1.7 },
                maxWidth: 580,
                mb: { xs: 3.5, md: 4.5 },
                fontWeight: 400
              }}>
                Malugod na pagdating sa opisyal na website ng Barangay 133. Madaling ma-access ang mga serbisyo publiko, makipag-ugnayan sa pamahalaang barangay, at manatiling may alam sa pinakabagong ulat at anunsyo para sa ating pamayanan.
              </Typography>

              {/* High-Impact CTA Buttons - Responsive Stacking on Mobile */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{ mb: { xs: 3.5, md: 4.5 }, width: { xs: '100%', sm: 'auto' } }}
              >
                {/* 1. Primary Citizen CTA: Download Resident App */}
                <Button
                  component="a"
                  href="/visiontrak.apk"
                  download="VisionTrak_Barangay133.apk"
                  variant="contained"
                  size="large"
                  startIcon={<PhoneAndroid sx={{ fontSize: 20 }} />}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    borderRadius: 2.5,
                    px: { xs: 2.5, sm: 3.4 },
                    py: { xs: 1.35, sm: 1.5 },
                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: '#22c55e',
                    color: '#052e16',
                    boxShadow: '0 6px 20px rgba(34, 197, 94, 0.35)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#16a34a',
                      color: '#ffffff',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(34, 197, 94, 0.45)'
                    }
                  }}
                >
                  I-download ang Mobile App
                </Button>

                {/* 2. Official / Admin Portal Login */}
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    endIcon={<ArrowForward />}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      borderRadius: 2.5,
                      px: { xs: 2.5, sm: 3.4 },
                      py: { xs: 1.35, sm: 1.5 },
                      fontSize: { xs: '0.92rem', sm: '0.98rem' },
                      fontWeight: 800,
                      textTransform: 'none',
                      bgcolor: '#ffffff',
                      color: '#b93636',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#fef2f2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                      }
                    }}
                  >
                    Pumunta sa Dashboard
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    endIcon={<ArrowForward />}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      borderRadius: 2.5,
                      px: { xs: 2.5, sm: 3.4 },
                      py: { xs: 1.35, sm: 1.5 },
                      fontSize: { xs: '0.92rem', sm: '0.98rem' },
                      fontWeight: 800,
                      textTransform: 'none',
                      bgcolor: '#ffffff',
                      color: '#b93636',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#fef2f2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                      }
                    }}
                  >
                    Portal Login (Staff)
                  </Button>
                )}

                {/* 3. Browse Services */}
                <Button
                  variant="outlined"
                  size="large"
                  href="#serbisyo"
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    borderRadius: 2.5,
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.35, sm: 1.5 },
                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.18)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Tingnan ang Serbisyo
                </Button>
              </Stack>

              {/* Trust Checkmarks */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.2, sm: 3 }} sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#7d9c65', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.82rem', sm: '0.88rem' } }}>
                    24/7 Nakaantabay na Barangay Tanod
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#7d9c65', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.82rem', sm: '0.88rem' } }}>
                    Libreng Serbisyong Pangkalusugan
                  </Typography>
                </Box>
              </Stack>

            </Grid>

            {/* Right Column: Hero Civic Showcase Glass Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{
                p: { xs: 2.5, sm: 3.5, md: 4 },
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                borderRadius: { xs: 3, md: 4 },
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                color: '#ffffff',
                mt: { xs: 1, md: 0 }
              }}>

                {/* Official Seal and Barangay Name Showcase */}
                <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
                  <Box sx={{
                    width: { xs: 80, sm: 104 },
                    height: { xs: 80, sm: 104 },
                    mx: 'auto',
                    mb: 1.5,
                    borderRadius: '50%',
                    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.35)',
                    border: '3px solid #fff2a0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="Barangay 133 Seal"
                      sx={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    BARANGAY 133
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fecaca', fontWeight: 600, display: 'block', mt: 0.3, fontSize: { xs: '0.72rem', sm: '0.75rem' } }}>
                    Lungsod ng Maynila • Pamahalaang Lokal
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', mb: 2 }} />

                {/* Quick Civic Status Chips */}
                <Stack spacing={1.2}>
                  <Box sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Videocam sx={{ color: '#7d9c65', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 650, fontSize: { xs: '0.8rem', sm: '0.86rem' } }}>
                        Vision-Trak CCTV AI
                      </Typography>
                    </Stack>
                    <Chip label="Aktibo" size="small" sx={{ bgcolor: 'rgba(125, 156, 101, 0.25)', color: '#7d9c65', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                  </Box>

                  <Box sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <NotificationsActive sx={{ color: '#fff2a0', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 650, fontSize: { xs: '0.8rem', sm: '0.86rem' } }}>
                        Community Advisories
                      </Typography>
                    </Stack>
                    <Chip label="Real-time" size="small" sx={{ bgcolor: 'rgba(255, 242, 160, 0.2)', color: '#fff2a0', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                  </Box>

                  <Box sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <PhoneAndroid sx={{ color: '#ff9c4c', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 650, fontSize: { xs: '0.8rem', sm: '0.86rem' } }}>
                        Resident Mobile Portal
                      </Typography>
                    </Stack>
                    <Chip label="Download Ready" size="small" sx={{ bgcolor: 'rgba(255, 156, 76, 0.25)', color: '#fff2a0', fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  sx={{
                    mt: 2.5,
                    py: 1.2,
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                    textTransform: 'none',
                    bgcolor: '#fff2a0',
                    color: '#7f1d1d',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                    '&:hover': { bgcolor: '#fde047' }
                  }}
                >
                  {user ? 'Buksan ang Dashboard →' : 'Mag-Login Bilang Opisyal / Admin →'}
                </Button>

              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* 4. Core Public Services */}
      <Box id="serbisyo" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3, md: 4 } }}>

          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
            <Chip
              label="SERBISYONG PAMBARANGAY"
              size="small"
              sx={{
                bgcolor: 'rgba(185, 54, 54, 0.08)',
                color: '#b93636',
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: 0.8,
                mb: 1.5
              }}
            />
            <Typography variant="h3" sx={{
              fontWeight: 800,
              color: '#1c2419',
              fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.4rem' },
              mb: 1.5,
              letterSpacing: -0.5
            }}>
              Mga Pangunahing Serbisyo sa Mamamayan
            </Typography>
            <Typography variant="body1" sx={{ color: '#556350', maxWidth: 580, mx: 'auto', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Handang maglingkod nang buong katapatan para sa kapayapaan, kalinisan, at kaunlaran ng Barangay 133.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {services.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
                <Card sx={{
                  p: { xs: 2.5, sm: 3.5, md: 4 },
                  height: '100%',
                  borderRadius: { xs: 2.5, sm: 3.5 },
                  bgcolor: '#ffffff',
                  border: '1px solid #e4e8dc',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 12px 28px -10px rgba(15, 23, 42, 0.08)',
                    transform: 'translateY(-3px)'
                  }
                }}>
                  <Box sx={{
                    width: { xs: 46, sm: 54 },
                    height: { xs: 46, sm: 54 },
                    borderRadius: 2,
                    bgcolor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1c2419', mb: 0.8, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#556350', lineHeight: 1.6, fontSize: { xs: '0.86rem', sm: '0.92rem' } }}>
                    {item.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

        </Container>
      </Box>

      {/* 5. Dedicated Resident Mobile App Section */}
      <Box id="mobile-app" sx={{
        py: { xs: 6, md: 10 },
        bgcolor: '#f7f8f4',
        borderTop: '1px solid #e4e8dc',
        borderBottom: '1px solid #e4e8dc'
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3, md: 4 } }}>
          <Paper elevation={0} sx={{
            p: { xs: 2.8, sm: 4, md: 5.5 },
            borderRadius: { xs: 3, md: 4 },
            bgcolor: '#ffffff',
            border: '1px solid #e4e8dc',
            boxShadow: '0 8px 30px -10px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'center' }}>

              <Grid size={{ xs: 12, md: 7 }}>
                <Chip
                  icon={<PhoneAndroid sx={{ fontSize: '16px !important', color: '#587d46' }} />}
                  label="PARA SA LAHAT NG RESIDENTE NG BARANGAY 133"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(88, 125, 70, 0.12)',
                    color: '#3f5d30',
                    fontWeight: 800,
                    fontSize: { xs: '0.68rem', sm: '0.72rem' },
                    letterSpacing: 0.5,
                    mb: 1.5
                  }}
                />

                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1c2419', mb: 1.5, fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2.1rem' } }}>
                  Vision-Trak Resident Mobile Application
                </Typography>

                <Typography variant="body1" sx={{ color: '#556350', lineHeight: 1.65, fontSize: { xs: '0.9rem', sm: '0.98rem' }, mb: 2.5 }}>
                  Dinisenyo para sa kaginhawahan ng bawat residente ng Barangay 133. Direktang makatanggap ng real-time AI alert kapag papalapit na ang trak ng basura, magsumite ng reklamo o mungkahi kalakip ang larawan, at basahin ang mga anunsyo ng pamahalaang barangay.
                </Typography>

                {/* Mobile Feature Checklist */}
                <Stack spacing={1.2} sx={{ mb: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(88, 125, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check sx={{ color: '#587d46', fontSize: 15, fontWeight: 900 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 650, color: '#334155', fontSize: '0.88rem' }}>
                      <strong>Real-Time Waste Truck Alerts:</strong> Push notification kapag nasa inyong kalye na ang trak ng basura.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(88, 125, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check sx={{ color: '#587d46', fontSize: 15, fontWeight: 900 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 650, color: '#334155', fontSize: '0.88rem' }}>
                      <strong>Photo Grievance & Feedback:</strong> Kumuha ng litrato at ipadala ang reklamo o suhestiyon sa Barangay Hall.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(88, 125, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check sx={{ color: '#587d46', fontSize: 15, fontWeight: 900 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 650, color: '#334155', fontSize: '0.88rem' }}>
                      <strong>Opisyal na Komunidad:</strong> Mga verified resident account na nirehistro sa pamahalaan.
                    </Typography>
                  </Box>
                </Stack>

                {/* Direct Action Buttons - Touch friendly on mobile */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    component="a"
                    href="/visiontrak.apk"
                    download="VisionTrak_Barangay133.apk"
                    variant="contained"
                    size="large"
                    startIcon={<GetApp sx={{ fontSize: 20 }} />}
                    sx={{
                      bgcolor: '#587d46',
                      '&:hover': { bgcolor: '#446435' },
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2.2,
                      px: 3.2,
                      py: 1.3,
                      fontSize: '0.92rem',
                      boxShadow: '0 4px 14px rgba(88, 125, 70, 0.35)',
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    I-download ang Android APK (.APK)
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setInstallGuideOpen(true)}
                    startIcon={<HelpOutline sx={{ fontSize: 19 }} />}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#475569',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2.2,
                      px: 2.5,
                      py: 1.3,
                      fontSize: '0.92rem',
                      '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Gabay sa Pag-Install
                  </Button>
                </Stack>
              </Grid>

              {/* Right Column: Smartphone Visual Showcase Card */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 3.5,
                  bgcolor: 'linear-gradient(180deg, #162415 0%, #0d150c 100%)',
                  background: 'linear-gradient(180deg, #162415 0%, #0d150c 100%)',
                  border: '1px solid rgba(120, 159, 100, 0.3)',
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
                  color: '#ffffff',
                  textAlign: 'center'
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 1.8,
                    borderRadius: '50%',
                    bgcolor: 'rgba(120, 159, 100, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(120, 159, 100, 0.5)'
                  }}>
                    <Smartphone sx={{ fontSize: 32, color: '#86efac' }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5, fontSize: '1.15rem' }}>
                    Barangay 133 Mobile App
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700, display: 'block', mb: 2, letterSpacing: 0.5 }}>
                    OPISYAL NA RESIDENT APPLICATION
                  </Typography>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                  <Stack spacing={1.2} sx={{ mb: 2.5, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Platform:</Typography>
                      <Chip label="Android 8.0+" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.08)', color: '#ffffff', fontWeight: 700 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Package Size:</Typography>
                      <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>54 MB (.apk)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Release Build:</Typography>
                      <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700 }}>v1.0.0 Production</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>Status:</Typography>
                      <Chip label="Verified Safe" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 800 }} />
                    </Box>
                  </Stack>

                  <Button
                    component="a"
                    href="/visiontrak.apk"
                    download="VisionTrak_Barangay133.apk"
                    fullWidth
                    variant="contained"
                    startIcon={<GetApp />}
                    sx={{
                      bgcolor: '#22c55e',
                      color: '#052e16',
                      fontWeight: 800,
                      py: 1.1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.86rem',
                      '&:hover': { bgcolor: '#16a34a', color: '#ffffff' }
                    }}
                  >
                    I-download Ngayon
                  </Button>
                </Box>
              </Grid>

            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* 6. Announcements Bulletin Section */}
      <Box id="anunsyo" sx={{ py: { xs: 6, md: 10 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3, md: 4 } }}>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              width: '100%',
              gap: 2,
              mb: { xs: 3.5, sm: 5 }
            }}
          >
            <Box>
              <Chip
                label="OPISYAL NA ANUNSYO"
                size="small"
                sx={{
                  bgcolor: 'rgba(185, 54, 54, 0.08)',
                  color: '#b93636',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  letterSpacing: 0.8,
                  mb: 1.5
                }}
              />
              <Typography variant="h3" sx={{
                fontWeight: 800,
                color: '#1c2419',
                fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.4rem' },
                letterSpacing: -0.5,
                lineHeight: 1.15
              }}>
                Pinakabagong Balita at Anunsyo
              </Typography>
            </Box>

            <Button
              variant="text"
              onClick={() => navigate(user ? '/announcements' : '/login')}
              endIcon={<ArrowForward sx={{ fontSize: 18, transition: 'transform 0.2s ease' }} />}
              sx={{
                color: '#b93636',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: { xs: '0.88rem', sm: '0.95rem' },
                whiteSpace: 'nowrap',
                p: 0,
                pb: { sm: 0.6 },
                mb: { sm: 0.4 },
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline',
                  '& .MuiButton-endIcon': { transform: 'translateX(3px)' }
                }
              }}
            >
              Tingnan Lahat sa Portal
            </Button>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {displayAnnouncements.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.announcement_id}>
                <Card sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  height: '100%',
                  borderRadius: { xs: 2.5, sm: 3.5 },
                  bgcolor: '#ffffff',
                  border: '1px solid #e4e8dc',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)'
                  }
                }}>
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        label={item.priority || 'Anunsyo'}
                        size="small"
                        sx={{
                          bgcolor: item.priority === 'Mahalaga' || item.priority === 'Urgent' ? '#fde8e8' : '#f7f8f4',
                          color: item.priority === 'Mahalaga' || item.priority === 'Urgent' ? '#b93636' : '#556350',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          borderRadius: 1.5
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#7a8775', fontWeight: 500, fontSize: '0.75rem' }}>
                        {new Date(item.date_posted).toLocaleDateString('fil-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1c2419', mb: 1, lineHeight: 1.35, fontSize: { xs: '1rem', sm: '1.05rem' } }}>
                      {item.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#556350', lineHeight: 1.6, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      {item.content}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

        </Container>
      </Box>

      {/* 7. Opisyal na Impormasyon ng Pamahalaan, Transparency & Public Safety */}
      <Box id="impormasyon" sx={{ py: { xs: 6, md: 9 }, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3, md: 4 } }}>

          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
            <Chip
              icon={<Shield sx={{ fontSize: '14px !important', color: '#166534' }} />}
              label="TRANSPARENCY & CITIZEN CHARTER"
              size="small"
              sx={{
                bgcolor: '#dcfce7',
                color: '#166534',
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: 0.8,
                mb: 1.5
              }}
            />
            <Typography variant="h3" sx={{
              fontWeight: 800,
              color: '#0f172a',
              fontSize: { xs: '1.6rem', sm: '2.1rem', md: '2.3rem' },
              mb: 1.5,
              letterSpacing: -0.5
            }}>
              Opisyal na Impormasyon at Serbisyo Publiko
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', maxWidth: 640, mx: 'auto', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Direktoryo ng Pamahalaang Barangay 133, mga pampublikong abiso sa CCTV at kalinisan, at mga emergency hotlines para sa bawat mamamayan.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2.5, sm: 3 }}>

            {/* Column 1: Public Safety, CCTV & AI Advisory */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{
                p: { xs: 2.5, sm: 3.5 },
                height: '100%',
                borderRadius: 3,
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
              }}>
                <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                    <Videocam />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Abiso sa CCTV at Vision-Trak AI
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Alinsunod sa RA 10173 & NPC Advisory No. 2020-04
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1.8} sx={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  <Box sx={{ p: 1.8, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369a1', display: 'block', mb: 0.5 }}>
                      CCTV PUBLIC SURVEILLANCE NOTICE
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#334155' }}>
                      Alinsunod sa Data Privacy Act ng 2012, ang mga CCTV camera sa pampublikong kalye ay pinatatakbo para sa kaligtasan ng pamayanan, pagpapanatili ng kapayapaan, at pagsusuri sa regular na paghakot ng basura. Ang mga kuha ay ligtas na nakaimbak at protektado laban sa hindi awtorisadong pag-access.
                    </Typography>
                  </Box>

                  <Box sx={{ p: 1.8, bgcolor: '#fffbeb', borderRadius: 2, border: '1px solid #fde68a' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e', display: 'block', mb: 0.5 }}>
                      VISION-TRAK AI DETECTION ADVISORY
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.84rem', color: '#78350f' }}>
                      Ang Vision-Trak AI ay isang automated assistive tool para sa pag-detect ng waste collection vehicles. Ang mga log ng paghakot ay advisory at sumusuporta sa koordinasyon ng kalinisan ng pamayanan.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Column 2: Emergency Hotlines & Official Transacting Notice */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{
                p: { xs: 2.5, sm: 3.5 },
                height: '100%',
                borderRadius: 3,
                bgcolor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
              }}>
                <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                    <WarningAmber />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Emergency Hotlines & Transaksyon
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Pambansang Saklolo at Serbisyong Lokal
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={1.5} sx={{ color: '#334155' }}>
                  {/* National Emergency 911 */}
                  <Box
                    component="a"
                    href="tel:911"
                    sx={{
                      textDecoration: 'none',
                      display: 'block',
                      p: 1.8,
                      bgcolor: '#fef2f2',
                      borderRadius: 2.5,
                      border: '1px solid #fecaca',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
                      '&:hover': { bgcolor: '#fee2e2', transform: 'translateY(-1px)', borderColor: '#ef4444' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800, display: 'block', letterSpacing: 0.5 }}>
                          PAMBANSANG EMERGENCY HOTLINE
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 1, my: 0.2 }}>
                          <Call sx={{ fontSize: 28 }} /> 911
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 650 }}>
                          Pindutin para tumawag agad (24/7 Libre)
                        </Typography>
                      </Box>
                      <Chip label="TAP TO CALL" size="small" sx={{ bgcolor: '#dc2626', color: '#ffffff', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.5 }} />
                    </Box>
                  </Box>

                  {/* Philippine National Police MPD */}
                  <Box
                    component="a"
                    href="tel:0282452244"
                    sx={{
                      textDecoration: 'none',
                      display: 'block',
                      p: 1.6,
                      bgcolor: '#f8fafc',
                      borderRadius: 2.2,
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 750, display: 'block' }}>
                          PNP MANILA POLICE DISTRICT (STATION 2)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                          <Phone sx={{ fontSize: 18, color: '#0284c7' }} /> (02) 8245-2244 / 117
                        </Typography>
                      </Box>
                      <Chip label="Call MPD" size="small" variant="outlined" sx={{ color: '#0284c7', borderColor: '#bae6fd', fontWeight: 750, fontSize: '0.68rem' }} />
                    </Box>
                  </Box>

                  {/* Bureau of Fire Protection */}
                  <Box
                    component="a"
                    href="tel:0285273627"
                    sx={{
                      textDecoration: 'none',
                      display: 'block',
                      p: 1.6,
                      bgcolor: '#f8fafc',
                      borderRadius: 2.2,
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 750, display: 'block' }}>
                          BUREAU OF FIRE PROTECTION (BFP MAYNILA)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                          <Phone sx={{ fontSize: 18, color: '#dc2626' }} /> (02) 8527-3627
                        </Typography>
                      </Box>
                      <Chip label="Call BFP" size="small" variant="outlined" sx={{ color: '#dc2626', borderColor: '#fecaca', fontWeight: 750, fontSize: '0.68rem' }} />
                    </Box>
                  </Box>

                  {/* Official Transaction Notice */}
                  <Box sx={{ p: 1.6, bgcolor: '#f0fdf4', borderRadius: 2.2, border: '1px solid #bbf7d0' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 750, display: 'block', mb: 0.3 }}>
                      OPISYAL NA TRANSAKSYON SA BARANGAY HALL
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 650, fontSize: '0.84rem' }}>
                      Para sa mga Barangay Clearance, Certificate of Indigency, at Katarungang Pambarangay, magtungo sa Barangay 133 Hall (Lunes-Biyernes, 8:00 AM - 5:00 PM) o magsumite sa Resident Mobile App.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* 8. Dignified Civic & Legal Compliance Footer */}
      <Box sx={{ mt: 'auto', bgcolor: '#172115', color: '#f7f8f4', pt: { xs: 5, md: 7 }, pb: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3, md: 4 } }}>
          <Grid container spacing={{ xs: 4, md: 5 }}>

            {/* Col 1: Identity & Legal Mandate */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Official Seal of Barangay 133, City of Manila"
                  sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #7d9c65' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: 0.5, fontSize: '1.1rem', lineHeight: 1.1 }}>
                    BARANGAY 133
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#c2d8b2', fontWeight: 600 }}>
                    Lungsod ng Maynila • Republika ng Pilipinas
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.65, fontSize: '0.85rem', mb: 2 }}>
                Opisyal na Portal ng Pamahalaang Barangay 133. Nililikha at pinamamahalaan alinsunod sa <strong>Republic Act No. 7160 (Local Government Code of 1991)</strong> at <strong>Republic Act No. 11032</strong> para sa tapat at bukas na serbisyo publiko.
              </Typography>
              <Chip
                icon={<Shield sx={{ fontSize: '13px !important', color: '#c2d8b2' }} />}
                label="RA 10173 Data Privacy Compliant"
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#c2d8b2', fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Grid>

            {/* Col 2: Navigation & Services */}
            <Grid size={{ xs: 6, sm: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff2a0', mb: 1.8, letterSpacing: 0.5 }}>
                MGA SERBISYO
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <a href="#serbisyo" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Serbisyong Tanod</a>
                </Typography>
                <Typography variant="body2">
                  <a href="#serbisyo" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Kalusugan & Health Center</a>
                </Typography>
                <Typography variant="body2">
                  <a href="#serbisyo" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Vision-Trak Basura Alerts</a>
                </Typography>
                <Typography variant="body2">
                  <a href="#anunsyo" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Opisyal na Anunsyo</a>
                </Typography>
                <Typography variant="body2">
                  <a href="#mobile-app" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Resident Mobile App</a>
                </Typography>
              </Stack>
            </Grid>

            {/* Col 3: Legal, Policies & Form Consents */}
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff2a0', mb: 1.8, letterSpacing: 0.5 }}>
                LEGAL & COMPLIANCE
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <Link to="/privacy-policy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Privacy Policy (RA 10173)
                  </Link>
                </Typography>
                <Typography variant="body2">
                  <Link to="/terms-and-conditions" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Terms & Conditions
                  </Link>
                </Typography>
                <Typography variant="body2">
                  <Link to="/cookie-policy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                    Cookie Policy
                  </Link>
                </Typography>
                <Box sx={{ pt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={() => window.dispatchEvent(new Event('open_cookie_preferences'))}
                    startIcon={<CookieIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      color: '#c2d8b2',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      p: 0,
                      '&:hover': { color: '#ffffff', bgcolor: 'transparent' }
                    }}
                  >
                    Manage Cookie Preferences
                  </Button>
                </Box>
              </Stack>
            </Grid>

            {/* Col 4: Public Domain & Government Notice */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff2a0', mb: 1.8, letterSpacing: 0.5 }}>
                REPUBLIC OF THE PHILIPPINES
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.6, mb: 1.5 }}>
                Pursuant to <strong>Section 176 of Republic Act No. 8293</strong>, no copyright shall subsist in any work of the Government of the Philippines.
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1.6 }}>
                Official seals, badges, and municipal heraldry are protected under <strong>Republic Act No. 8491</strong>. Unauthorized use or misrepresentation is punishable by law.
              </Typography>
            </Grid>

          </Grid>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 4 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              © {new Date().getFullYear()} Pamahalaang Barangay 133, Lungsod ng Maynila. Lahat ng karapatan ay nakalaan.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ fontSize: '0.78rem' }}>
              <Link to="/privacy-policy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Privacy Policy</Link>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>•</Typography>
              <Link to="/terms-and-conditions" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Terms & Conditions</Link>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>•</Typography>
              <Link to="/cookie-policy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Cookie Policy</Link>
            </Stack>
          </Stack>

        </Container>
      </Box>

      {/* 9. Mobile Sticky Bottom Quick-Action Bar (Phones & Small Tablets) */}
      <Paper
        elevation={6}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1050,
          bgcolor: 'rgba(17, 26, 16, 0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          px: 1,
          py: 0.8,
          pb: 'max(8px, env(safe-area-inset-bottom))',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        <Button
          component="a"
          href="tel:911"
          sx={{
            flexDirection: 'column',
            color: '#fca5a5',
            minWidth: 64,
            py: 0.5,
            px: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.72rem',
            fontWeight: 750,
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' },
          }}
        >
          <Call sx={{ fontSize: 20, mb: 0.2, color: '#ef4444' }} />
          Hotline 911
        </Button>

        <Button
          component="a"
          href="#anunsyo"
          sx={{
            flexDirection: 'column',
            color: '#f8fafc',
            minWidth: 64,
            py: 0.5,
            px: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.72rem',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
          }}
        >
          <Campaign sx={{ fontSize: 20, mb: 0.2, color: '#fca5a5' }} />
          Anunsyo
        </Button>

        <Button
          component="a"
          href="/visiontrak.apk"
          download="VisionTrak_Barangay133.apk"
          sx={{
            flexDirection: 'column',
            color: '#86efac',
            minWidth: 72,
            py: 0.5,
            px: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.72rem',
            fontWeight: 800,
            bgcolor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.25)' },
          }}
        >
          <GetApp sx={{ fontSize: 20, mb: 0.2, color: '#22c55e' }} />
          App APK
        </Button>

        <Button
          onClick={() => navigate(user ? '/dashboard' : '/login')}
          sx={{
            flexDirection: 'column',
            color: '#f8fafc',
            minWidth: 64,
            py: 0.5,
            px: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.72rem',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
          }}
        >
          {user ? (
            <>
              <DashboardIcon sx={{ fontSize: 20, mb: 0.2, color: '#bbf7d0' }} />
              Dashboard
            </>
          ) : (
            <>
              <LoginIcon sx={{ fontSize: 20, mb: 0.2, color: '#f87171' }} />
              Staff Login
            </>
          )}
        </Button>
      </Paper>

      {/* 10. APK Installation Guide Dialog for Mobile Users */}
      <Dialog
        open={installGuideOpen}
        onClose={() => setInstallGuideOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: { xs: 1, sm: 2 },
            bgcolor: '#ffffff',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(88, 125, 70, 0.12)', color: '#587d46' }}>
              <PhoneAndroid />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>
                Gabay sa Pag-Install ng Mobile App
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Vision-Trak Android Application para sa mga Residente
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setInstallGuideOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Step 1 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#587d46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                1
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a' }}>
                  I-download ang Opisyal na APK
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', mt: 0.3 }}>
                  Pindutin ang <strong>"I-download ang Android APK"</strong> button. Mag-uumpisa agad ang pag-download ng <code>VisionTrak_Barangay133.apk</code> file sa inyong smartphone.
                </Typography>
              </Box>
            </Box>

            {/* Step 2 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#587d46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                2
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a' }}>
                  Pahintulutan ang Pag-Install (Unknown Sources)
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', mt: 0.3 }}>
                  Kung magtanong ang Chrome o inyong browser ng <em>"File might be harmful"</em> o <em>"Install unknown apps"</em>, piliin ang <strong>"Download anyway"</strong> at <strong>"Allow from this source"</strong>. Ligtas at beripikado ang opisyal na app ng pamahalaan.
                </Typography>
              </Box>
            </Box>

            {/* Step 3 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#587d46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                3
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a' }}>
                  I-tap ang "Install" at Buksan ang App
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', mt: 0.3 }}>
                  Kapag tapos na ang download sa Notifications o Downloads folder, i-tap ang file at piliin ang <strong>"Install"</strong>. Pagkatapos ay pindutin ang <strong>"Open"</strong>.
                </Typography>
              </Box>
            </Box>

            {/* Step 4 */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#587d46', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                4
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0f172a' }}>
                  Mag-Login Gamit ang Inyong Resident Account
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.86rem', mt: 0.3 }}>
                  Ipasok ang username at password na ibinigay sa inyo sa Barangay Hall. Kung wala pa kayong account, magtungo sa Barangay 133 Hall dala ang valid ID para makuha ang inyong resident login.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            component="a"
            href="/visiontrak.apk"
            download="VisionTrak_Barangay133.apk"
            variant="contained"
            startIcon={<GetApp />}
            onClick={() => setInstallGuideOpen(false)}
            sx={{
              bgcolor: '#587d46',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1,
              '&:hover': { bgcolor: '#446435' }
            }}
          >
            I-download ang APK File Ngayon
          </Button>
          <Button onClick={() => setInstallGuideOpen(false)} sx={{ color: '#64748b' }}>
            Isara
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
