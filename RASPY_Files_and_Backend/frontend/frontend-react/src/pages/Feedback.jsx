import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function FeedbackAttachment({ feedbackId, attachment }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    api.get(`/feedback/${feedbackId}/attachments/${attachment.attachment_id}`, {
      responseType: 'blob',
    }).then(({ data }) => {
      objectUrl = URL.createObjectURL(data);
      if (active) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch(() => {
      if (active) setError('Could not load this attachment.');
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [feedbackId, attachment.attachment_id]);

  if (error) {
    return <Typography color="error">{attachment.original_filename}: {error}</Typography>;
  }
  if (!url) {
    return <Typography color="text.secondary">Loading {attachment.original_filename}…</Typography>;
  }
  return (
    <Box sx={{ mb: 2 }}>
      {attachment.mime_type.startsWith('image/') && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Box
            component="img"
            src={url}
            alt={`Resident submitted attachment: ${attachment.original_filename}`}
            sx={{ display: 'block', maxWidth: '100%', maxHeight: 360, objectFit: 'contain', mb: 1 }}
          />
        </a>
      )}
      <Button component="a" href={url} target="_blank" rel="noopener noreferrer" size="small">
        {attachment.mime_type === 'application/pdf' ? 'Open PDF' : 'Open image'} — {attachment.original_filename}
      </Button>
    </Box>
  );
}

export default function Feedback() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [snack, setSnack] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/feedback'); setItems(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(() => {
      if (!document.hidden) fetch();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      setSnack('Feedback deleted');
      fetch();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error deleting feedback');
    }
  };

  const handleResolve = async (row) => {
    try {
      await api.patch(`/feedback/${row.feedback_id}`, { is_resolved: !row.is_resolved });
      setSnack(row.is_resolved ? 'Marked unresolved' : 'Marked resolved');
      fetch();
    } catch (err) {
      setSnack('Error updating feedback');
    }
  };

  const confirmResolve = (row) => {
    setResolveTarget(row);
  };

  const executeResolve = async () => {
    if (!resolveTarget) return;
    try {
      await api.patch(`/feedback/${resolveTarget.feedback_id}`, { is_resolved: !resolveTarget.is_resolved });
      setSnack(resolveTarget.is_resolved ? 'Marked unresolved' : 'Marked resolved');
      fetch();
    } catch (err) {
      setSnack('Error updating feedback');
    } finally {
      setResolveTarget(null);
    }
  };

  const columns = [
    { field: 'username', headerName: 'Name', width: 140 },
    { field: 'subject', headerName: 'Activity', flex: 1 },
    { field: 'content', headerName: 'Description', flex: 1.5 },
    { field: 'timestamp', headerName: 'Date', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    {
      field: 'resolved_at',
      headerName: 'Resolved At',
      width: 180,
      valueFormatter: (v) => v ? new Date(v).toLocaleString() : '—',
    },
    {
      field: 'is_resolved', headerName: 'Status', width: 100,
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ color: row.is_resolved ? 'green' : 'orange', fontWeight: 600 }}>
          {row.is_resolved ? 'Resolved' : 'Pending'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => { setSelected(row); setViewOpen(true); }}>View</Button>
          <Button size="small" color={row.is_resolved ? 'warning' : 'success'} onClick={() => confirmResolve(row)}>
            {row.is_resolved ? 'Unresolve' : 'Resolve'}
          </Button>
          <Button size="small" color="error" onClick={() => setDeleteTarget(row)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' } }}>
          Citizen Feedback & Inquiries
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4, fontSize: { xs: '0.84rem', sm: '0.92rem' } }}>
          Review citizen reports, public feedback, attachments, and resolution statuses.
        </Typography>
      </Box>

      <Paper sx={{
        bgcolor: '#ffffff',
        borderRadius: 3.5,
        border: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        p: { xs: 1, sm: 1.5 },
      }}>
        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Box sx={{ minWidth: 700 }}>
            <DataGrid
              rows={items}
              columns={columns}
              getRowId={(r) => r.feedback_id}
              loading={loading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{ border: 'none' }}
            />
          </Box>
        </Box>
      </Paper>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.subject}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            From {selected?.username} &middot; {selected?.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}
          </Typography>
          <Typography>{selected?.content}</Typography>
          {selected?.resolved_at && (
            <Typography variant="body2" color="success.main" sx={{ mt: 2, fontWeight: 500 }}>
              Resolved at: {new Date(selected.resolved_at).toLocaleString()}
            </Typography>
          )}
          {selected?.attachments?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
              {selected.attachments.map((attachment) => (
                <FeedbackAttachment
                  key={attachment.attachment_id}
                  feedbackId={selected.feedback_id}
                  attachment={attachment}
                />
              ))}
            </Box>
          )}
          {selected?.attachment_path && (
            <Box sx={{ mt: 2 }}>
              <a
                href={`${api.defaults.baseURL.replace(/\/api\/?$/, '')}${selected.attachment_path.startsWith('/') ? selected.attachment_path : `/${selected.attachment_path}`}`}
                target="_blank"
                rel="noreferrer"
              >
                View existing attachment
              </a>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to DELETE this Feedback?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>NO</Button>
          <Button color="error" variant="contained" onClick={() => { const id = deleteTarget?.feedback_id; setDeleteTarget(null); handleDelete(id); }}>YES</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resolveTarget} onClose={() => setResolveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Resolve</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark this feedback as <strong>{resolveTarget?.is_resolved ? 'unresolved' : 'resolved'}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveTarget(null)}>NO</Button>
          <Button color="success" variant="contained" onClick={() => { executeResolve(); }}>YES</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}