import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Stack,
  TextField,
  Alert,
  IconButton,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  AccessTime,
  ArrowBack,
  Shield,
  Help,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';
import api from '../api/client';

/**
 * PasswordRecovery - Adheres directly to Figure 3.7.2 in documentation.pdf.
 * Provides explicit guidance instructing users to contact the barangay office
 * for account recovery and official administrator assistance, with a prominent
 * "Back to Login" action and secondary online self-service option.
 */
export default function PasswordRecovery() {
  const navigate = useNavigate();
  const [showSelfService, setShowSelfService] = useState(false);
  const [screen, setScreen] = useState('forgot'); // forgot | verify | reset | success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setScreen('verify');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send verification code. Please contact the barangay office.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setScreen('reset');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
      setScreen('success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: '#f8fafc',
        position: 'relative',
      }}
    >
      {/* Upper Part - Time Only */}
      <Box sx={{ bgcolor: '#730000', color: '#ffffff', py: 0.75, px: 2, fontSize: '0.75rem', borderBottom: '1px solid #5a0000', textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: 13, color: '#fde047' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            Philippine Standard Time (PST): Official Security & Recovery Portal
          </Typography>
        </Box>
      </Box>

      {/* Main Centered Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, my: 'auto' }}>
        <Box sx={{ width: { xs: '100%', sm: 480 }, mb: 1.5, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/login')}
            size="small"
            sx={{
              color: '#52525b',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { color: '#990000', bgcolor: 'transparent' },
            }}
          >
            Back to Login
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', sm: 480 },
            p: { xs: 3, sm: 4.5 },
            bgcolor: '#ffffff',
            borderRadius: 3,
            border: '1px solid #e4e4e7',
            boxShadow: '0 12px 36px -4px rgba(153, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          {/* Official Seal and Header */}
          <Box sx={{ mb: 3 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Barangay 133 Seal"
              sx={{
                width: 72,
                height: 72,
                mb: 1.5,
                borderRadius: '50%',
                p: 0.4,
                border: '2px solid #990000',
                bgcolor: '#ffffff',
                mx: 'auto',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#990000', letterSpacing: 0.5 }}>
              BARANGAY 133
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Official Account Recovery
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Primary Guideline Card (Adheres strictly to Figure 3.7.2 in documentation.pdf) */}
          <Box
            sx={{
              p: 3,
              borderRadius: 2.5,
              bgcolor: '#fff1f2',
              border: '1px solid #fecdd3',
              mb: 3,
              textAlign: 'center',
            }}
          >
            <Help sx={{ fontSize: 36, color: '#990000', mb: 1 }} />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: '#881337',
                lineHeight: 1.5,
                mb: 1.5,
                fontSize: '1rem',
              }}
            >
              To reset your password, please contact the barangay office. The admin will assist you in updating your account.
            </Typography>
            <Typography variant="caption" sx={{ color: '#9f1239', display: 'block', mb: 2 }}>
              Per Barangay 133 security policy (Business Rule 1), credential resets are verified by authorized administrators to protect resident identity and privacy.
            </Typography>

            {/* Official Office Location */}
            <Stack spacing={1} sx={{ textAlign: 'left', bgcolor: '#ffffff', p: 2, borderRadius: 2, border: '1px solid #ffe4e6' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOn sx={{ fontSize: 18, color: '#990000' }} />
                <Typography variant="body2" sx={{ color: '#3f3f46' }}>
                  Barangay 133 Hall, Zone 11, District II, Tondo, Manila
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccessTime sx={{ fontSize: 18, color: '#990000' }} />
                <Typography variant="caption" sx={{ color: '#71717a' }}>
                  Admin Assistance: Monday – Friday, 8:00 AM – 5:00 PM
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Primary Action Button: Back to Login (Figure 3.7.2) */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate('/login')}
            startIcon={<ArrowBack />}
            sx={{
              py: 1.4,
              bgcolor: '#16a34a',
              fontWeight: 800,
              fontSize: '0.95rem',
              letterSpacing: 0.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#15803d' },
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              mb: 2,
            }}
          >
            Back to Login
          </Button>

          {/* Secondary Self-Service Option Toggle */}
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowSelfService(!showSelfService)}
              sx={{ color: '#71717a', fontSize: '0.8rem', fontWeight: 600, textTransform: 'none' }}
            >
              {showSelfService ? 'Hide online email reset' : 'Have a registered email? Reset online →'}
            </Button>
          </Box>

          {/* Collapsible Self-Service Reset Form */}
          <Collapse in={showSelfService}>
            <Box sx={{ mt: 2.5, p: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7', textAlign: 'left' }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {screen === 'forgot' && (
                <form onSubmit={handleSendOtp}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Self-Service Reset Code
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Enter the email registered with your Barangay ID to receive a verification OTP.
                  </Typography>
                  <TextField
                    label="Registered Email"
                    type="email"
                    fullWidth
                    size="small"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' }, fontWeight: 700 }}
                  >
                    {loading ? 'Sending Code...' : 'Send Verification OTP'}
                  </Button>
                </form>
              )}

              {screen === 'verify' && (
                <form onSubmit={handleVerifyOtp}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Enter 6-Digit Code
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    A 6-digit OTP code was sent to {email}.
                  </Typography>
                  <TextField
                    label="6-Digit OTP"
                    fullWidth
                    size="small"
                    required
                    inputProps={{ maxLength: 6 }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' }, fontWeight: 700 }}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </form>
              )}

              {screen === 'reset' && (
                <form onSubmit={handleResetPassword}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Set New Password
                  </Typography>
                  <TextField
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{ mb: 1.5 }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowNew(!showNew)} edge="end">
                              {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Confirm New Password"
                    type={showConfirm ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end">
                              {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' }, fontWeight: 700 }}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              )}

              {screen === 'success' && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <CheckCircle sx={{ fontSize: 36, color: '#16a34a', mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a', mb: 1 }}>
                    Password Updated Successfully!
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/login')}
                    sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
                  >
                    Go to Login
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Box>

      {/* Official Footer Banner */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#ffffff',
          borderTop: '1px solid #e4e4e7',
          py: 2,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: '#52525b', fontWeight: 600, display: 'block', mb: 0.5 }}>
          Barangay 133, Zone 11, District II, Tondo, Manila
        </Typography>
        <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
          Community • Cleanliness • Environment • Official Government Portal
        </Typography>
      </Box>
    </Box>
  );
}