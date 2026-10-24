import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import api from '../api/client';

export default function MfaStepUpDialog() {
  const pendingRequests = useRef([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const rejectPending = useCallback((reason) => {
    pendingRequests.current.splice(0).forEach(({ reject }) => reject(reason));
  }, []);

  const requestCode = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/mfa/challenge');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not send a verification code.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const handleMfaRequired = (event) => {
      pendingRequests.current.push(event.detail);
      if (pendingRequests.current.length === 1) {
        setOpen(true);
        setCode('');
        void requestCode();
      }
    };
    const handleSessionExpired = () => {
      rejectPending(new Error('Your session has expired. Please sign in again.'));
      setOpen(false);
    };
    window.addEventListener('auth:mfa-required', handleMfaRequired);
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:mfa-required', handleMfaRequired);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      rejectPending(new Error('The verification dialog was closed.'));
    };
  }, [rejectPending, requestCode]);

  const submitCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/mfa/verify', { otp: code });
      const requests = pendingRequests.current.splice(0);
      setOpen(false);
      setCode('');
      requests.forEach(({ config, resolve }) => {
        config._mfaRetried = true;
        resolve(config);
      });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not verify the code.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    rejectPending(new Error('Sensitive action canceled before verification.'));
    setOpen(false);
    setCode('');
    setError('');
  };

  return (
    <Dialog open={open} onClose={cancel} fullWidth maxWidth="xs">
      <form onSubmit={submitCode}>
        <DialogTitle>Verify it’s you</DialogTitle>
        <DialogContent>
          <p>A verification code was sent to the email address on your account.</p>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="6-digit verification code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code' }}
            disabled={busy}
          />
          <Button onClick={requestCode} disabled={busy} sx={{ mt: 1 }}>
            Send a new code
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy || code.length !== 6}>
            Verify and continue
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
