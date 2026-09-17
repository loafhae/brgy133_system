import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Link, Card, CardActionArea } from '@mui/material';
import { AdminPanelSettings, Badge } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const roles = [
  { value: 'super_admin', label: 'Super Admin', icon: <AdminPanelSettings sx={{ fontSize: 48 }} />, desc: 'Full system access and management' },
  { value: 'official', label: 'Barangay Official', icon: <Badge sx={{ fontSize: 48 }} />, desc: 'Manage announcements and view reports' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        setError(`This account is not a ${selectedRole === 'super_admin' ? 'Super Admin' : 'Barangay Official'}. Please select the correct role.`);
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
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
    }}>
      <Box sx={{
        width: 440, p: 4,
        bgcolor: 'rgba(255,255,255,0.95)',
        borderRadius: 1,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 80, height: 80, mb: 1 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            BARANGAY 133
          </Typography>
          <Typography variant="body2" color="text.secondary">Admin &amp; Official Portal</Typography>
        </Box>

        {!selectedRole ? (
          <>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
              Select your role to continue
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {roles.map((r) => (
                <Card key={r.value} sx={{ flex: 1 }}>
                  <CardActionArea onClick={() => setSelectedRole(r.value)} sx={{ p: 2, textAlign: 'center' }}>
                    {r.icon}
                    <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>{r.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.desc}</Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
                Logging in as {roles.find((r) => r.value === selectedRole)?.label}
              </Typography>
              <Button size="small" sx={{ ml: 1 }} onClick={() => { setSelectedRole(''); setError(''); }}>
                Change
              </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <TextField label="Username" fullWidth required value={username}
                onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Password" type="password" fullWidth required value={password}
                onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}>
                {loading ? 'Signing in...' : 'LOGIN'}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Link component="button" variant="body2" type="button" onClick={() => navigate('/forgot-password')}>
                  Forgot Password?
                </Link>
                <Link component="button" variant="body2" type="button" onClick={() => navigate('/register')}>
                  Register Account
                </Link>
              </Box>
            </form>
          </>
        )}
      </Box>
    </Box>
  );
}