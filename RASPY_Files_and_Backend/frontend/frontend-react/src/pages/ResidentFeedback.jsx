import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  MenuItem,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  AttachFile,
  Send,
  CheckCircle,
  AccessTime,
  WarningAmber,
  AddComment,
} from '@mui/icons-material';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * ResidentFeedback - Direct implementation of Figure 4.2.1 (Feedback Interface)
 * and Figure 4.2.2 in documentation.pdf.
 *
 * Implements the explicit 3-stage interaction workflow:
 * 1. Composition Screen (Subject, Message, Attach a file)
 * 2. Confirmation Modal ("Are you sure you want to submit this feedback? [YES] [NO]")
 * 3. Completion Screen ("Feedback Submitted Successfully!")
 * With FR10 5-minute spam prevention.
 */
export default function ResidentFeedback() {
  const [stage, setStage] = useState('compose'); // 'compose' | 'confirm' | 'success'
  const [subject, setSubject] = useState('Uncollected Trash');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const categories = [
    'Uncollected Trash in Zone',
    'Noise Disturbance',
    'Street Lighting / Maintenance',
    'Drainage & Sanitation Concern',
    'Barangay Health & Safety',
    'General Resident Suggestion',
  ];

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please provide details in the feedback message.');
      return;
    }
    setError('');
    setStage('confirm');
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('subject', subject);
      fd.append('content', content.trim());
      if (attachment) {
        fd.append('attachment', attachment);
      }
      await api.post('/feedback', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Transition to Stage 3: Completion Screen
      setStage('success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map((e) => e.msg).join(', ')
          : detail || 'Failed to submit feedback. You may have submitted identical feedback recently (5-minute spam rule).'
      );
      setStage('compose');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setContent('');
    setAttachment(null);
    setError('');
    setStage('compose');
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FeedbackIcon sx={{ color: '#990000', fontSize: 30 }} /> Submit Resident Feedback
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Official grievance, suggestion, and incident reporting channel for Barangay 133 residents.
        </Typography>
      </Box>

      {/* Stage 1: Composition Screen (Figure 4.2.1 Left) */}
      {stage === 'compose' && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px solid #e4e4e7',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleProceedToConfirm}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
                  Subject (Category)
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  size="small"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#18181b' }}>
                  Feedback Message *
                </Typography>
                <TextField
                  placeholder="Articulate your concern or suggestion with relevant details (location, date, specifics)..."
                  multiline
                  rows={6}
                  fullWidth
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Typography variant="caption" sx={{ color: '#71717a', display: 'block', mt: 0.5, textAlign: 'right' }}>
                  {content.length} characters
                </Typography>
              </Box>

              {/* Attach a file utility (Figure 4.2.1) */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b' }}>
                    Attach Digital Evidence (Optional)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Upload photographs of uncollected trash, road issues, or supporting files (JPG, PNG, PDF).
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<AttachFile />}
                    sx={{
                      fontWeight: 700,
                      borderColor: '#cbd5e1',
                      color: '#334155',
                      '&:hover': { borderColor: '#990000', color: '#990000' },
                    }}
                  >
                    {attachment ? 'Change File' : 'Attach a file'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {attachment && (
                    <Chip
                      label={attachment.name.slice(0, 18) + '...'}
                      onDelete={() => setAttachment(null)}
                      size="small"
                      sx={{ bgcolor: '#e2e8f0', fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!content.trim()}
                sx={{
                  py: 1.5,
                  bgcolor: '#990000',
                  fontWeight: 900,
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#730000' },
                }}
              >
                SUBMIT FEEDBACK
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14 }} />
            Anti-Spam Safeguard: The system enforces a 5-minute cooldown between identical submissions per FR10.
          </Typography>
        </Paper>
      )}

      {/* Stage 2: Confirmation Modal (Figure 4.2.1 Center) */}
      <ConfirmationDialog
        open={stage === 'confirm'}
        title="Verification Prompt"
        message="Are you sure you want to submit this feedback?"
        onConfirm={handleFinalSubmit}
        onCancel={() => setStage('compose')}
        confirmText="YES"
        cancelText="NO"
        loading={loading}
      />

      {/* Stage 3: Completion Screen (Figure 4.2.1 Right) */}
      {stage === 'success' && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px solid #e4e4e7',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <CheckCircle sx={{ fontSize: 48 }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#166534',
              mb: 1.5,
              fontSize: { xs: '1.4rem', sm: '1.75rem' },
            }}
          >
            Feedback Submitted Successfully!
          </Typography>

          <Typography variant="body1" sx={{ color: '#52525b', maxWidth: 500, mx: 'auto', mb: 3.5, lineHeight: 1.6 }}>
            Your concern regarding <strong>"{subject}"</strong> has been securely logged into the central database for administrative assessment by Barangay 133 officials.
          </Typography>

          <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', maxWidth: 450, mx: 'auto', mb: 4, textAlign: 'left' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
              STATUS SUMMARY
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b' }}>
              Pending Review by Barangay Officials
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a' }}>
              Expected response window: within 24 to 48 hours.
            </Typography>
          </Paper>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={handleResetForm}
              startIcon={<AddComment />}
              sx={{
                bgcolor: '#990000',
                fontWeight: 800,
                py: 1.2,
                px: 3,
                borderRadius: 2,
                '&:hover': { bgcolor: '#730000' },
              }}
            >
              Submit Another Report
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/dashboard'}
              sx={{
                borderColor: '#d4d4d8',
                color: '#3f3f46',
                fontWeight: 700,
                py: 1.2,
                px: 3,
                borderRadius: 2,
              }}
            >
              Return to Dashboard
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
