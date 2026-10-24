import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Card, InputAdornment, IconButton,
  Stack, CircularProgress
} from '@mui/material';
import {
  Visibility, VisibilityOff, Person, Lock, ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated with official/admin role, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      let roles = [];
      if (Array.isArray(user?.roles)) {
        roles = user.roles.map((r) => String(r).toLowerCase().trim());
      } else if (typeof user?.roles === 'string') {
        roles = user.roles.split(',').map((r) => r.toLowerCase().trim());
      } else if (user?.role) {
        roles = [String(user.role).toLowerCase().trim()];
      }

      if (roles.includes('super_admin') || roles.includes('official')) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(username.trim(), password);

      let roles = [];
      if (Array.isArray(userData?.roles)) {
        roles = userData.roles.map((r) => String(r).toLowerCase().trim());
      } else if (typeof userData?.roles === 'string') {
        roles = userData.roles.split(',').map((r) => r.toLowerCase().trim());
      } else if (userData?.role) {
        roles = [String(userData.role).toLowerCase().trim()];
      }

      const isStaffOrAdmin = roles.includes('super_admin') || roles.includes('official');
      if (!isStaffOrAdmin) {
        logout();
        setError('Resident accounts must access Vision-Trak via the Barangay 133 Mobile Application. Web portal access is reserved for Barangay Officials and Administrators.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Access Denied: Your account is pending administrator approval.');
      } else if (err.response?.status === 401) {
        setError('Incorrect username or password.');
      } else if (err.response?.status === 502 || err.response?.status === 504) {
        setError('Server connection error. Please try again later.');
      } else {
        const d = err.response?.data?.detail || err.message;
        setError(typeof d === 'string' ? d : 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(135deg, rgba(17, 26, 16, 0.82) 0%, rgba(69, 10, 10, 0.76) 100%), url(/barangay.jpg?v=2)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      p: { xs: 2, sm: 3 },
    }} className="animate-fade-in">
      <Card sx={{
        width: { xs: '100%', sm: 440 },
        p: { xs: 3.5, sm: 4.5 },
        bgcolor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
        borderRadius: 4,
        border: '1px solid rgba(255, 255, 255, 0.9)',
      }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Barangay 133 Seal"
            sx={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              objectFit: 'cover',
              mb: 1.5,
              border: '3px solid #587d46',
              boxShadow: '0 6px 20px rgba(88, 125, 70, 0.35)',
              bgcolor: '#ffffff'
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, letterSpacing: '-0.02em' }}>
            BARANGAY 133
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>
            Vision-Trak Intelligent Portal
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5, fontSize: '0.84rem', fontWeight: 600 }}>
            {error}
          </Alert>
        )}

        {/* Resident Mobile App Advisory Banner */}
        <Box sx={{
          p: 1.6,
          mb: 2.5,
          bgcolor: 'rgba(88, 125, 70, 0.08)',
          border: '1px solid rgba(88, 125, 70, 0.25)',
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#3f5d30', display: 'block', fontSize: '0.74rem' }}>
              RESIDENT MOBILE APPLICATION
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.35 }}>
              Residente ka ba? Gamitin ang opisyal na Mobile App para sa truck alerts at serbisyo.
            </Typography>
          </Box>
          <Button
            component="a"
            href="/visiontrak.apk"
            download="VisionTrak_Barangay133.apk"
            size="small"
            variant="contained"
            sx={{
              bgcolor: '#587d46',
              color: '#ffffff',
              fontWeight: 750,
              fontSize: '0.72rem',
              py: 0.6,
              px: 1.4,
              borderRadius: 2,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': { bgcolor: '#446435' }
            }}
          >
            Get App (.APK)
          </Button>
        </Box>

        <form onSubmit={handleLogin}>
          <TextField
            label="Username or Email"
            fullWidth
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#587d46', fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: 2.2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
              }
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#587d46', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: 2.8,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
              }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              py: 1.4,
              fontWeight: 750,
              fontSize: '0.96rem',
              mb: 2,
              borderRadius: 2.5,
              textTransform: 'none'
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CircularProgress size={18} color="inherit" />
                <span>Signing in...</span>
              </Stack>
            ) : (
              'Sign In'
            )}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate('/forgot-password')}
              sx={{ color: '#64748b', fontSize: '0.84rem', textTransform: 'none', fontWeight: 650, p: 0.5, '&:hover': { color: '#0f172a' } }}
            >
              Forgot Password?
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/register')}
              sx={{ color: '#587d46', fontSize: '0.84rem', textTransform: 'none', fontWeight: 700, p: 0.5, '&:hover': { color: '#3f5d30' } }}
            >
              Register Admin
            </Button>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{
              color: '#475569',
              borderColor: '#e2e8f0',
              textTransform: 'none',
              fontWeight: 650,
              borderRadius: 2.5,
              py: 1.1,
              mb: 0,
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
            }}
          >
            Return to Landing Page
          </Button>
        </form>

        {/* Official Government System & Privacy Notice */}
        <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center', mt: 2.5 }}>
          <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.45, fontSize: '0.72rem' }}>
            <strong>Official Gateway:</strong> Access is restricted to authorized personnel and verified residents of Barangay 133. System activity is logged pursuant to <strong>RA 10173 (Data Privacy Act of 2012)</strong> and <strong>RA 10175</strong>.
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', mt: 1 }}>
            <Typography variant="caption">
              <a href="/privacy-policy" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</a>
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>•</Typography>
            <Typography variant="caption">
              <a href="/terms-and-conditions" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>Terms & Conditions</a>
            </Typography>
          </Stack>
        </Box>
      </Card>
    </Box>
  );
}