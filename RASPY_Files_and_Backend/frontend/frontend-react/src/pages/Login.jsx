import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Card, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the login function from AuthContext cleanly with strings
      await login(username, password);
      navigate('/'); // 👈 Change '/dashboard' to '/'
    } catch (err) {
      const d = err.response?.data?.detail || err.message;
      setError(typeof d === 'string' ? d : 'Invalid username or password.');
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
        width: 400, p: 4,
        bgcolor: 'rgba(255,255,255,0.95)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderRadius: 2
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box component="img" src="/logo.png" alt="Logo" sx={{ width: 70, height: 70, mb: 1 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>BARANGAY 133</Typography>
          <Typography variant="body2" color="text.secondary">
            System Portal Login
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField 
            label="Username" 
            fullWidth 
            required 
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)} 
            sx={{ mb: 2 }} 
          />
          <TextField 
            label="Password" 
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
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
            sx={{ py: 1.5, fontWeight: 700, mb: 2 }}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </Button>

          <Button 
            variant="text" 
            fullWidth 
            onClick={() => navigate('/forgot-password')}
            sx={{ mb: 1 }}
          >
            Forgot Password?
          </Button>

          <Button 
            variant="text" 
            fullWidth 
            onClick={() => navigate('/register')}
          >
            Don't have an account? Register here
          </Button>
        </form>
      </Card>
    </Box>
  );
}