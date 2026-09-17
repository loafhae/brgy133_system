import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, TextField, Snackbar, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function ResidentActivityLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [snack, setSnack] = useState('');

  const fetchLogs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get('/activity/all');
      setItems(data);
    } catch (err) {
      setSnack('Error fetching resident activity logs');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filtered = items.filter((r) => {
    const role = (r.role || '').toLowerCase();
    const username = (r.username || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();

    if (
      role.includes('admin') ||
      role.includes('official') ||
      username === 'admin' ||
      username === 'rence' ||
      desc.includes('@admin') ||
      desc.includes('@rence')
    ) {
      return false;
    }

    if (
      search &&
      !desc.includes(search.toLowerCase()) &&
      !(r.action_type || '').toLowerCase().includes(search.toLowerCase()) &&
      !username.includes(search.toLowerCase())
    ) {
      return false;
    }

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
    { field: 'username', headerName: 'Resident Name', width: 140 },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: () => (
        <Chip
          label="Resident"
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: '#e0f2fe',
            color: '#0369a1',
          }}
        />
      ),
    },
    { field: 'action_type', headerName: 'Activity', width: 170 },
    { field: 'description', headerName: 'Description', flex: 1 },
    {
      field: 'timestamp',
      headerName: 'Date',
      width: 190,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const isActive =
          typeof params.row.is_active === 'boolean'
            ? params.row.is_active
            : params.row.status === 'Active';

        return (
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: isActive ? '#dcfce7' : '#f3f4f6',
              color: isActive ? '#15803d' : '#6b7280',
            }}
          />
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
        Resident Activity Logs
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search resident logs"
          size="small"
          sx={{ minWidth: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          label="From"
          type="date"
          size="small"
          sx={{ minWidth: 180 }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          sx={{ minWidth: 180 }}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <DataGrid
        rows={filtered}
        columns={columns}
        getRowId={(r) => r.log_id}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  );
}