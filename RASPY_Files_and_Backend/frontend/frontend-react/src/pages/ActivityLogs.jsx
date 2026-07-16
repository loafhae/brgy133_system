import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, TextField, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function ActivityLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [snack, setSnack] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/activity/all');
      setItems(data);
    } catch (err) {
      setSnack('Error fetching activity logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter((r) => {
    if (search &&
      !(r.description || '').toLowerCase().includes(search.toLowerCase()) &&
      !(r.action_type || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && r.timestamp && new Date(r.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && r.timestamp) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(r.timestamp) > toDate) return false;
    }
    return true;
  });

  const columns = [
    { field: 'log_id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Name', width: 130 },
    { field: 'action_type', headerName: 'Activity', width: 180 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'timestamp', headerName: 'Date', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    { field: 'target_table', headerName: 'Status', width: 120, valueFormatter: (v) => v || '—' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Activity Logs</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField label="Search logs" size="small" sx={{ minWidth: 300 }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField label="From" type="date" size="small" sx={{ minWidth: 180 }}
          value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To" type="date" size="small" sx={{ minWidth: 180 }}
          value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <DataGrid rows={filtered} columns={columns} getRowId={(r) => r.log_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
