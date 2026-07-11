import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, Alert, Link, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Card sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 3, color: 'primary.main' }}>
          Vision-Trak Admin
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? 'Signing in...' : 'LOGIN'}
          </Button>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}>
              Forgot Password?
            </Link>
          </Box>
        </form>
        <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogContent>
            <Typography>Please contact the barangay office to reset your password.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForgotOpen(false)}>Back to Login</Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Box>
  );
}
