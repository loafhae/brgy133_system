import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, MenuItem, Select, FormControl, InputLabel, Card, FormControlLabel, Checkbox
} from '@mui/material';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    first_name: '', middle_name: '', last_name: '', gender: '',
    birthday: '', civil_status: '', address: '', mobile_number: '',
  });

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) {
      setError('Please fill in all required account fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreePrivacy) {
      setError('You must agree to the Data Privacy Act terms to register.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      alert('Registration successful! Your account is pending Super Admin residency verification.');
      navigate('/login');
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.45)), url(/barangay.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      p: 2
    }}>
      <Card sx={{
        width: 480, p: 4,
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
            {step === 1 ? 'Step 1: Account Credentials' : 'Step 2: Information Details'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <TextField label="Username" fullWidth required value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} sx={{ mb: 2 }} />
            <TextField label="Email Address" type="email" fullWidth required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
            <TextField label="Password" type="password" fullWidth required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ mb: 2 }} />
            <TextField label="Confirm Password" type="password" fullWidth required value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} sx={{ mb: 3 }} />
            
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5, fontWeight: 700, mb: 2 }}>
              NEXT
            </Button>
            <Button variant="text" fullWidth onClick={() => navigate('/login')}>
              Already have an account? Login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <TextField label="First Name" fullWidth required value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })} sx={{ mb: 2 }} />
            <TextField label="Middle Name" fullWidth value={form.middle_name}
              onChange={(e) => setForm({ ...form, middle_name: e.target.value })} sx={{ mb: 2 }} />
            <TextField label="Last Name" fullWidth required value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })} sx={{ mb: 2 }} />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Birthday" type="date" fullWidth value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })} sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }} />
            
            <TextField label="Address in Barangay 133" fullWidth required value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} sx={{ mb: 2 }} />
            
            <TextField label="Mobile Number" fullWidth value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} sx={{ mb: 2 }} />

            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                <strong>Data Privacy Notice:</strong> By submitting this form, you consent to the collection and processing of your personal information in accordance with the Data Privacy Act of 2012 for Barangay 133 verification purposes.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    checked={agreePrivacy} 
                    onChange={(e) => setAgreePrivacy(e.target.checked)} 
                  />
                }
                label={<Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>I agree to the Data Privacy Terms</Typography>}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" fullWidth onClick={() => setStep(1)} sx={{ py: 1.5 }}>
                BACK
              </Button>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontWeight: 700 }}>
                {loading ? 'Submitting...' : 'REGISTER'}
              </Button>
            </Box>
          </form>
        )}
      </Card>
    </Box>
  );
}