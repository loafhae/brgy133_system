import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Link, Card, CardActionArea,
  IconButton, InputAdornment, Paper, Stack,
} from '@mui/material';
import {
  AdminPanelSettings, Badge, Visibility, VisibilityOff, ArrowBack,
  Shield, CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const roles = [
  {
    value: 'super_admin',
    label: 'Super Admin',
    icon: <AdminPanelSettings sx={{ fontSize: 36, color: '#990000' }} />,
    desc: 'Full system access, accounts & settings management',
  },
  {
    value: 'official',
    label: 'Barangay Official',
    icon: <Badge sx={{ fontSize: 36, color: '#990000' }} />,
    desc: 'Manage announcements, view feedback & CCTV detection logs',
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      const userRole = result?.role || result?.user?.role;

      if (userRole !== selectedRole) {
        const roleLabel = roles.find((r) => r.value === selectedRole)?.label;
        setError(`This account is not designated as ${roleLabel}. Please select the matching role.`);
        setLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#fafafa',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Top Bar with Return Link */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: { xs: 20, md: 40 },
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          size="small"
          sx={{ color: '#52525b', fontWeight: 600, '&:hover': { bgcolor: '#f4f4f5', color: '#990000' } }}
        >
          Back
        </Button>
      </Box>

      {/* Main Login Card */}
      <Paper
        elevation={0}
        sx={{
          width: { xs: '100%', sm: 440 },
          p: { xs: 3, sm: 4.5 },
          bgcolor: '#ffffff',
          borderRadius: 3,
          border: '1px solid #e4e4e7',
          boxShadow: '0 8px 30px -4px rgba(153, 0, 0, 0.08)',
        }}
      >
        {/* Seal & Branding */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Barangay 133 Official Seal"
            sx={{
              width: 76,
              height: 76,
              mb: 1.5,
              borderRadius: '50%',
              p: 0.3,
              border: '2px solid #990000',
              bgcolor: '#ffffff',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: '#990000', letterSpacing: -0.5, lineHeight: 1.2 }}
          >
            BARANGAY 133
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a', mt: 0.5, fontWeight: 500 }}>
            Official Management Portal
          </Typography>
        </Box>

        {!selectedRole ? (
          <>
            <Typography
              variant="body2"
              sx={{ textAlign: 'center', mb: 2.5, color: '#3f3f46', fontWeight: 600 }}
            >
              Select your administrative role to proceed:
            </Typography>
            <Stack spacing={1.5}>
              {roles.map((r) => (
                <Card
                  key={r.value}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: '#e4e4e7',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#990000',
                      boxShadow: '0 2px 10px rgba(153, 0, 0, 0.08)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedRole(r.value)}
                    sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-start' }}
                  >
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: '#fef2f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {r.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b' }}>
                        {r.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                        {r.desc}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                mb: 2.5,
                bgcolor: '#fef2f2',
                borderRadius: 2,
                border: '1px solid #fecaca',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 18, color: '#990000' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#990000' }}>
                  Role: {roles.find((r) => r.value === selectedRole)?.label}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                onClick={() => { setSelectedRole(''); setError(''); }}
                sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#990000' }}
              >
                Change
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Username"
                fullWidth
                required
                size="medium"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                size="medium"
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
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.3,
                  bgcolor: '#990000',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  letterSpacing: 0.5,
                  '&:hover': { bgcolor: '#730000' },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2.5 }}>
                <Link
                  component="button"
                  variant="body2"
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  sx={{ color: '#71717a', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#990000' } }}
                >
                  Forgot your password?
                </Link>
              </Box>
            </form>
          </>
        )}
      </Paper>

      {/* Security Note Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Shield sx={{ fontSize: 14 }} /> Official System Access • Barangay 133, Tondo, Manila
        </Typography>
      </Box>
    </Box>
  );
}