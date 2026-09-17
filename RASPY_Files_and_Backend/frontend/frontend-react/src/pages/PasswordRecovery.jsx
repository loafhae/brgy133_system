import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Card } from '@mui/material';
import api from '../api/client';

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState('forgot'); // forgot | verify | reset | success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setError(err.response?.data?.detail || 'Failed to send verification code.');
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
    <Box sx={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh',
      backgroundImage: 'url(/barangay.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      p: 2
    }}>
      <Card sx={{
        width: 440, p: 4,
        bgcolor: 'rgba(255,255,255,0.95)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 70, height: 70, mb: 1 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1, mb: 1 }}>BARANGAY 133</Typography>

        {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

        {screen === 'forgot' && (
          <form onSubmit={handleSendOtp}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Password Recovery</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your registered email address to receive a 6-digit verification code.
            </Typography>
            <TextField label="Email Address" type="email" fullWidth required value={email}
              onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 700, mb: 2 }}>
              {loading ? 'Sending...' : 'SEND CODE'}
            </Button>
            <Button variant="text" fullWidth onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </form>
        )}

        {screen === 'verify' && (
          <form onSubmit={handleVerifyOtp}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Enter Verification Code</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We sent a 6-digit code to {email}. It expires in 10 minutes.
            </Typography>
            <TextField label="6-Digit Code" fullWidth required inputProps={{ maxLength: 6 }} value={otp}
              onChange={(e) => setOtp(e.target.value)} sx={{ mb: 3, textAlign: 'center' }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 700, mb: 2 }}>
              {loading ? 'Verifying...' : 'VERIFY CODE'}
            </Button>
          </form>
        )}

        {screen === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Reset Password</Typography>
            <TextField label="New Password" type="password" fullWidth required value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Confirm New Password" type="password" fullWidth required value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 3 }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 700 }}>
              {loading ? 'Updating...' : 'UPDATE PASSWORD'}
            </Button>
          </form>
        )}

        {screen === 'success' && (
          <Box>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, mb: 2 }}>Success!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your password has been successfully reset. You can now log into your account using your new credentials.
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login')} sx={{ py: 1.5, fontWeight: 700 }}>
              BACK TO LOGIN
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
}