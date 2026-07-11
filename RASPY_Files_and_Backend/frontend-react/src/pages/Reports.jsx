import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function Reports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [snack, setSnack] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/feedback'); setItems(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { field: 'feedback_id', headerName: 'ID', width: 70 },
    { field: 'created_by', headerName: 'User ID', width: 100 },
    { field: 'subject', headerName: 'Subject', flex: 1 },
    { field: 'timestamp', headerName: 'Date', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    {
      field: 'actions', headerName: 'Actions', width: 120,
      renderCell: ({ row }) => (
        <Button size="small" onClick={() => { setSelected(row); setOpen(true); }}>View</Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Resident Reports</Typography>
      <DataGrid rows={items} columns={columns} getRowId={(r) => r.feedback_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.subject}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            From User #{selected?.created_by} &middot; {selected?.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}
          </Typography>
          <Typography>{selected?.content}</Typography>
          {selected?.attachment_path && (
            <Box sx={{ mt: 2 }}>
              <a href={`/uploads/${selected.attachment_path}`} target="_blank" rel="noreferrer">View Attachment</a>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
