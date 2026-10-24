import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  Stack,
  TextField,
  Alert,
  Grid,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  Lock,
  Phone,
  CheckCircle,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Security,
  Smartphone,
  InfoOutlined
} from '@mui/icons-material';
import api from '../api/client';
import { normalizePhilippineMobile } from '../services/phone';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    birthday: '',
    mobile: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!consentGiven) {
      setError('You must consent to the collection and processing of your administrative details under RA 10173 and agree to the Terms & Conditions.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const mobile = normalizePhilippineMobile(formData.mobile);
    if (!mobile) {
      setError('Enter a valid Philippine mobile number, such as 09123456789 or +639123456789.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim(),
        last_name: formData.last_name.trim(),
        gender: formData.gender,
        birthday: formData.birthday,
        mobile,
        roles: 'super_admin',
        privacy_consent: true,
      };

      await api.post('/auth/register', payload);

      setSuccess('Administrator account registered successfully! You can now log in to access the Barangay 133 Portal.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg || e.message).join(', '));
      } else {
        setError('Failed to create administrator account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(rgba(23, 33, 21, 0.88), rgba(69, 10, 10, 0.82)), url(/barangay.jpg?v=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Card
        sx={{
          width: { xs: '100%', md: 740 },
          p: { xs: 3, sm: 4.5 },
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
          borderRadius: 3.5,
          border: '1px solid rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* Seal and Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Barangay 133 Seal"
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              objectFit: 'cover',
              mb: 1.5,
              border: '2px solid #7d9c65',
              boxShadow: '0 4px 12px rgba(125, 156, 101, 0.25)',
              bgcolor: '#ffffff'
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#172115' }}>
              BARANGAY 133
            </Typography>
            <Chip
              icon={<AdminPanelSettings sx={{ fontSize: '16px !important', color: '#587d46' }} />}
              label="Admin Portal"
              size="small"
              sx={{ bgcolor: '#eef6ec', color: '#385e27', fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Stack>

          <Typography variant="subtitle2" sx={{ color: '#556350', fontWeight: 650 }}>
            Administrator Account Registration
          </Typography>
        </Box>

        {/* Roles & System Guidance Notice */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2.5,
            bgcolor: '#f8fafc',
            borderColor: '#e2e8f0',
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <InfoOutlined sx={{ fontSize: 18, color: '#587d46' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Account Registration Guidelines
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
              • <strong>Administrators:</strong> Create your primary administrative account using this form to access and oversee system operations.
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
              • <strong>Barangay Officials:</strong> Official accounts are created exclusively by the Barangay Administrator inside the Admin Portal (Users Management).
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
              • <strong>Residents:</strong> Residents can register themselves directly through the <strong>Barangay 133 Mobile Application</strong>, which includes the mandatory Data Privacy Act (RA 10173) consent.
            </Typography>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" icon={<CheckCircle fontSize="inherit" />} sx={{ mb: 2.5, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Administrator Personal Information */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#b93636', mb: 1.5, letterSpacing: 0.5 }}>
            1. ADMINISTRATOR PERSONAL INFORMATION
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="First Name"
                name="first_name"
                fullWidth
                required
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Middle Name (Optional)"
                name="middle_name"
                fullWidth
                value={formData.middle_name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Last Name"
                name="last_name"
                fullWidth
                required
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Gender (optional)"
                name="gender"
                fullWidth
                value={formData.gender}
                onChange={handleChange}
                disabled={loading}
                helperText="Describe your gender in your own words, or leave blank."
                inputProps={{ maxLength: 100 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="date"
                label="Date of Birth"
                name="birthday"
                fullWidth
                required
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                    backgroundColor: '#ffffff',
                    padding: '0 4px',
                    zIndex: 2,
                  },
                }}
                value={formData.birthday}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Contact / Mobile Number"
                name="mobile"
                type="tel"
                fullWidth
                required
                placeholder="09123456789 or +639123456789"
                helperText="Use a Philippine mobile number."
                value={formData.mobile}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ fontSize: 18, color: '#7d9c65' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Section 2: Account Credentials */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#b93636', mb: 1.5, letterSpacing: 0.5 }}>
            2. ADMINISTRATOR CREDENTIALS
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Username"
                name="username"
                fullWidth
                required
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ fontSize: 18, color: '#7d9c65' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="email"
                label="Official Email Address"
                name="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ fontSize: 18, color: '#7d9c65' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type={showPassword ? 'text' : 'password'}
                label="Password"
                name="password"
                fullWidth
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: 18, color: '#7d9c65' }} />
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
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password"
                name="confirmPassword"
                fullWidth
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ fontSize: 18, color: '#7d9c65' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                          aria-label={showPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Form Consent Checkbox pursuant to RA 10173 */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 2.5,
              bgcolor: '#f8fafc',
              borderColor: consentGiven ? '#7d9c65' : '#cbd5e1'
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  sx={{ color: '#7d9c65', '&.Mui-checked': { color: '#587d46' } }}
                  inputProps={{ 'aria-label': 'Consent to administrative data collection under RA 10173' }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem', lineHeight: 1.55 }}>
                  I certify that I am an authorized Administrator of <strong>Barangay 133, Tondo, Manila</strong>. Pursuant to the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, I expressly consent to the collection, authentication, and processing of my credentials and activities for system governance and audit logging. I have read and agree to the{' '}
                  <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', fontWeight: 700, textDecoration: 'underline' }}>
                    Privacy Policy
                  </a>.
                </Typography>
              }
              sx={{ m: 0, alignItems: 'flex-start' }}
            />
          </Paper>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !consentGiven}
            sx={{
              py: 1.4,
              fontWeight: 800,
              fontSize: '0.98rem',
              mb: 2,
              bgcolor: '#7d9c65',
              '&:hover': { bgcolor: '#688651' },
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(125, 156, 101, 0.3)',
              textTransform: 'none'
            }}
          >
            {loading ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CircularProgress size={18} color="inherit" />
                <span>Creating Administrator Account...</span>
              </Stack>
            ) : (
              'Register Administrator Account'
            )}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Already have an account?
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ color: '#b93636', fontWeight: 700, textTransform: 'none', p: 0.5 }}
            >
              Sign In to Portal
            </Button>
            <Typography variant="body2" sx={{ color: '#cbd5e1', display: { xs: 'none', sm: 'block' } }}>
              •
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/')}
              startIcon={<ArrowBack />}
              sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none', p: 0.5 }}
            >
              Back to Home
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}