import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Feedback() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/feedback'); setItems(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

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

  const columns = [
    { field: 'username', headerName: 'Name', width: 140 },
    { field: 'subject', headerName: 'Activity', flex: 1 },
    { field: 'content', headerName: 'Description', flex: 1.5 },
    { field: 'timestamp', headerName: 'Date', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    {
      field: 'actions', headerName: 'Actions', width: 150,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => { setSelected(row); setViewOpen(true); }}>View</Button>
          {hasRole('super_admin') && (
            <Button size="small" color="error" onClick={() => setDeleteTarget(row)}>Delete</Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Feedback</Typography>
      <DataGrid rows={items} columns={columns} getRowId={(r) => r.feedback_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.subject}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            From {selected?.username} &middot; {selected?.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}
          </Typography>
          <Typography>{selected?.content}</Typography>
          {selected?.attachment_path && (
            <Box sx={{ mt: 2 }}>
              <a href={`/uploads/${selected.attachment_path}`} target="_blank" rel="noreferrer">View Attachment</a>
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

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
