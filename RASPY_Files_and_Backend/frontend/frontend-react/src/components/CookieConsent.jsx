import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Switch, Chip, Divider, IconButton
} from '@mui/material';
import { Cookie, Security, Analytics, Close, SettingsOutlined, CheckCircle } from '@mui/icons-material';

const CONSENT_STATUS_KEY = 'cookie_consent_status';
const CONSENT_ANALYTICS_KEY = 'cookie_consent_analytics';
const CONSENT_TIMESTAMP_KEY = 'cookie_consent_timestamp';

export default function CookieConsent() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Check if user has already made a selection
    const storedStatus = localStorage.getItem(CONSENT_STATUS_KEY);
    if (!storedStatus) {
      setBannerVisible(true);
    } else {
      setAnalyticsEnabled(localStorage.getItem(CONSENT_ANALYTICS_KEY) === 'true');
    }

    // Global listener so "Cookie Settings" in footer can reopen the modal anytime
    const handleOpenModal = () => {
      const currentAnalytics = localStorage.getItem(CONSENT_ANALYTICS_KEY) === 'true';
      setAnalyticsEnabled(currentAnalytics);
      setModalOpen(true);
    };

    window.addEventListener('open_cookie_preferences', handleOpenModal);
    return () => {
      window.removeEventListener('open_cookie_preferences', handleOpenModal);
    };
  }, []);

  const saveConsent = (status, allowAnalytics) => {
    localStorage.setItem(CONSENT_STATUS_KEY, status);
    localStorage.setItem(CONSENT_ANALYTICS_KEY, allowAnalytics ? 'true' : 'false');
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());

    // Dispatch update event for analytics service
    window.dispatchEvent(
      new CustomEvent('cookie_consent_updated', {
        detail: { status, analyticsAllowed: allowAnalytics }
      })
    );

    setBannerVisible(false);
    setModalOpen(false);
  };

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true);
    saveConsent('all_accepted', true);
  };

  const handleEssentialOnly = () => {
    setAnalyticsEnabled(false);
    saveConsent('essential_only', false);
  };

  const handleSavePreferences = () => {
    saveConsent('custom', analyticsEnabled);
  };

  return (
    <>
      {/* 1. Cookie Notice Banner (Subtle, Accessible, Non-Intrusive Bottom Pill) */}
      {bannerVisible && (
        <Paper
          elevation={8}
          role="region"
          aria-label="Cookie consent banner"
          sx={{
            position: 'fixed',
            bottom: { xs: 12, sm: 20 },
            left: { xs: 12, sm: 24 },
            right: { xs: 12, sm: 'auto' },
            maxWidth: { sm: 540 },
            zIndex: 1400,
            p: { xs: 2.2, sm: 2.8 },
            borderRadius: 3.5,
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #cbd5e1',
            boxShadow: '0 20px 48px -8px rgba(15, 23, 42, 0.22)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <Stack spacing={1.6}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: 'rgba(88, 125, 70, 0.14)',
                  p: 0.9,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3f5d30'
                }}
              >
                <Cookie sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  Privacy & Cookie Preferences
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                  Barangay 133 Digital Portal • RA 10173 Compliance
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.55, fontSize: '0.85rem' }}>
              We use essential cookies to maintain secure sessions and protect government transactions. With your consent, we also use privacy-first, anonymized telemetry to improve community services in accordance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                Learn more in our{' '}
                <Link to="/privacy-policy" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/cookie-policy" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>
                  Cookie Policy
                </Link>.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ pt: 1, justifyContent: 'flex-end', alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => setModalOpen(true)}
                startIcon={<SettingsOutlined sx={{ fontSize: 18 }} />}
                sx={{
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  px: 1.5,
                  '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
                }}
              >
                Customize
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleEssentialOnly}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  px: 1.8,
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                }}
              >
                Essential Only
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleAcceptAll}
                sx={{
                  bgcolor: '#587d46',
                  color: '#ffffff',
                  fontWeight: 750,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  px: 2,
                  boxShadow: '0 2px 8px rgba(88, 125, 70, 0.3)',
                  '&:hover': { bgcolor: '#476837' }
                }}
              >
                Accept All
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* 2. Detailed Cookie Preference Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="cookie-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: { xs: 1, sm: 1.5 }
          }
        }}
      >
        <DialogTitle id="cookie-dialog-title" sx={{ pb: 1 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
              <Cookie sx={{ color: '#587d46' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Cookie & Privacy Settings
              </Typography>
            </Stack>
            <IconButton
              aria-label="Close cookie preferences dialog"
              onClick={() => setModalOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
              You have full legal control over how cookies and local storage tokens are used on this government portal. Review each category below according to your preferences.
            </Typography>

            {/* Essential Cookies (Mandatory) */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                    <Security sx={{ color: '#16a34a', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Strictly Necessary / Essential
                    </Typography>
                    <Chip label="Always Active" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 750, fontSize: '0.68rem', height: 20 }} />
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Required for core system functions: official authentication tokens, CSRF protection, and UI security checks. These cannot be disabled as the system cannot function without them.
                  </Typography>
                </Box>
                <Switch checked disabled aria-label="Essential cookies always enabled" />
              </Stack>
            </Paper>

            {/* Analytics & Performance Cookies (Optional) */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', borderColor: '#cbd5e1' }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                    <Analytics sx={{ color: '#0284c7', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Privacy-Preserving Analytics
                    </Typography>
                    <Chip
                      label={analyticsEnabled ? 'Enabled' : 'Disabled'}
                      size="small"
                      sx={{
                        bgcolor: analyticsEnabled ? '#e0f2fe' : '#f1f5f9',
                        color: analyticsEnabled ? '#0369a1' : '#64748b',
                        fontWeight: 750,
                        fontSize: '0.68rem',
                        height: 20
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Allows the Barangay IT team to assess aggregate page visits and system health. Does NOT collect personal names, IP addresses, or cross-site tracking data.
                  </Typography>
                </Box>
                <Switch
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  color="primary"
                  inputProps={{ 'aria-label': 'Enable privacy-preserving analytics' }}
                />
              </Stack>
            </Paper>

            <Divider />

            <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.5 }}>
                <strong>Statutory Right:</strong> Under Republic Act No. 10173, you have the right to withdraw or modify your consent at any time without penalty by clicking the "Cookie Preferences" link in the footer of any page.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={handleEssentialOnly}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#475569',
              borderColor: '#cbd5e1'
            }}
          >
            Reject Optional
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePreferences}
            startIcon={<CheckCircle sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 750,
              bgcolor: '#587d46',
              '&:hover': { bgcolor: '#476837' }
            }}
          >
            Save My Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
