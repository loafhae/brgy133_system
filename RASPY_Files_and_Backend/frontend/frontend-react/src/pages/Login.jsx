import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Paper,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  Badge,
  AdminPanelSettings,
  AccessTime,
  Smartphone,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login - Strictly for Barangay Officials and Super Admins.
 * Residents access the system via the Flutter Mobile Application per documentation.pdf.
 * Adheres to Figure 3.7.1 (Login Form) with clean upper PST time, no contact numbers in footer.
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('official'); // 'official' | 'super_admin'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // PST Time for the upper bar
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both Username and Password fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      // Navigate to administrative dashboard
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((e) => e.msg).join(', ')
          : detail || 'Invalid username or password. Please try again.'
      );
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
      <Box
        sx={{
          bgcolor: '#730000',
          color: '#ffffff',
          py: 0.75,
          px: 2,
          fontSize: '0.75rem',
          borderBottom: '1px solid #5a0000',
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: 13, color: '#fde047' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            Philippine Standard Time (PST): {currentTime || 'Loading...'}
          </Typography>
        </Box>
      </Box>

      {/* Main Centered Panel (Figure 3.7.1) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, my: 'auto' }}>
        {/* Return to Portal Home button on the body */}
        <Box sx={{ width: { xs: '100%', sm: 460 }, mb: 1.5, display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/')}
            size="small"
            sx={{
              color: '#52525b',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { color: '#990000', bgcolor: 'transparent' },
            }}
          >
            Back to Portal Home
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', sm: 460 },
            p: { xs: 3, sm: 4.5 },
            bgcolor: '#ffffff',
            borderRadius: 3,
            border: '1px solid #e4e4e7',
            boxShadow: '0 16px 40px -6px rgba(153, 0, 0, 0.09)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle curved crimson banner accent in header */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              bgcolor: '#990000',
            }}
          />

          {/* Official Seal and Branding */}
          <Box sx={{ mb: 2.5, mt: 1 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Barangay 133 Seal"
              sx={{
                width: 76,
                height: 76,
                mb: 1.2,
                borderRadius: '50%',
                p: 0.4,
                border: '2px solid #990000',
                bgcolor: '#ffffff',
                mx: 'auto',
                boxShadow: '0 4px 12px rgba(153, 0, 0, 0.12)',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#990000', letterSpacing: 0.5, lineHeight: 1.2 }}>
              BARANGAY 133
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Zone 11 • District II • Tondo, Manila
            </Typography>
          </Box>

          {/* Form Title (Figure 3.7.1: "User Authentication") */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#18181b',
              mb: 1,
              fontSize: '1.25rem',
              letterSpacing: -0.3,
            }}
          >
            User Authentication
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
            Official Management Console Login
          </Typography>

          {/* Role Filter Tabs: Barangay Official & Super Admin Only */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <Chip
              icon={<Badge sx={{ fontSize: 16 }} />}
              label="Barangay Official"
              clickable
              color={selectedRole === 'official' ? 'primary' : 'default'}
              variant={selectedRole === 'official' ? 'filled' : 'outlined'}
              onClick={() => setSelectedRole('official')}
              sx={{ fontWeight: 700, borderRadius: 2, px: 1 }}
            />
            <Chip
              icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
              label="Super Admin"
              clickable
              color={selectedRole === 'super_admin' ? 'primary' : 'default'}
              variant={selectedRole === 'super_admin' ? 'filled' : 'outlined'}
              onClick={() => setSelectedRole('super_admin')}
              sx={{ fontWeight: 700, borderRadius: 2, px: 1 }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, textAlign: 'left', fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Username or Staff ID"
              placeholder="Enter official username"
              fullWidth
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2.2 }}
            />

            <TextField
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Primary LOGIN Button (Figure 3.7.1) */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.4,
                bgcolor: '#16a34a', // Prominent Green CTA matching prototype Figure 3.7.1
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: 1,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                '&:hover': {
                  bgcolor: '#15803d',
                },
                mb: 2,
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'LOGIN'}
            </Button>

            {/* Forgot Password Link (Figure 3.7.1) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Link
                component="button"
                variant="body2"
                type="button"
                onClick={() => navigate('/forgot-password')}
                sx={{
                  color: '#71717a',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  '&:hover': { color: '#990000', textDecoration: 'underline' },
                }}
              >
                Forgot Password?
              </Link>
            </Box>
          </form>

          {/* Resident Mobile App Guidance Notice */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textAlign: 'left',
              mb: 2,
            }}
          >
            <Smartphone sx={{ fontSize: 22, color: '#64748b' }} />
            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
              <strong>Resident Access:</strong> Community announcements and garbage collection notifications are delivered via the Barangay 133 Mobile Application.
            </Typography>
          </Box>


        </Paper>
      </Box>

      {/* Official Footer Banner - No Phone Number & No Gmail */}
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
          Community | Cleanliness | Environment • Vision-Trak IoT Management Console
        </Typography>
      </Box>
    </Box>
  );
}