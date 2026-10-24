import { useEffect, useState, useCallback } from 'react';
import { Box, Typography, TextField, Snackbar, Chip, InputAdornment, Button, MenuItem, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FilterList, Clear, Refresh as RefreshIcon } from '@mui/icons-material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function SystemLogs() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [snack, setSnack] = useState('');

  const fetchLogs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (actionFilter) params.append('action_type', actionFilter);
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get(`/activity/all?${params.toString()}`);
      setItems(data);
    } catch (err) {
      setSnack('Error fetching system logs');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [search, dateFrom, dateTo, actionFilter, roleFilter]);

  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => {
      if (!document.hidden) fetchLogs(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setActionFilter('');
    setRoleFilter('');
  };

  const getActionTypes = () => {
    const types = new Set();
    items.forEach(item => {
      if (item.action_type) types.add(item.action_type);
    });
    return Array.from(types).sort();
  };

  const getRoles = () => {
    const roles = new Set();
    items.forEach(item => {
      if (item.role) roles.add(item.role);
    });
    return Array.from(roles).sort();
  };

  const columns = [
    { field: 'log_id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'User', width: 150 },
    {
      field: 'role',
      headerName: 'Role',
      width: 160,
      renderCell: (params) => (
        <Chip
          label={params.value || '—'}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            bgcolor: params.value === 'Super Admin' ? '#fee2e2' : params.value === 'Barangay Official' ? '#e0e7ff' : '#f3f4f6',
            color: params.value === 'Super Admin' ? '#991b1b' : params.value === 'Barangay Official' ? '#3730a3' : '#374151',
          }}
        />
      ),
    },
    { field: 'action_type', headerName: 'Action', width: 170 },
    {
      field: 'outcome',
      headerName: 'Outcome',
      width: 110,
      renderCell: ({ row }) => {
        const failed = row.action_type?.endsWith('_failed');
        return (
          <Chip
            label={failed ? 'Failed' : 'Succeeded'}
            color={failed ? 'error' : 'success'}
            size="small"
          />
        );
      },
    },
    { field: 'target_table', headerName: 'Table', width: 140 },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'ip_address', headerName: 'IP Address', width: 150 },
    {
      field: 'timestamp',
      headerName: 'Date',
      width: 190,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : ''),
    },
  ];

  const actionTypes = getActionTypes();
  const roles = getRoles();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>System Logs</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchLogs(true)} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label="Search"
            size="small"
            sx={{ minWidth: 250, flex: 1 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, action, description..."
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><FilterList fontSize="small" /></InputAdornment>,
              }
            }}
          />
          <TextField
            label="From Date"
            type="date"
            size="small"
            sx={{ minWidth: 180 }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            sx={{ minWidth: 180 }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Action Type"
            size="small"
            sx={{ minWidth: 180 }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="">All Actions</MenuItem>
            {actionTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Role"
            size="small"
            sx={{ minWidth: 180 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="">All Roles</MenuItem>
            {roles.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
          </TextField>
          <Button variant="outlined" startIcon={<Clear />} onClick={handleClearFilters} sx={{ ml: 'auto' }}>
            Clear Filters
          </Button>
        </Box>
      </Box>

      <DataGrid
        rows={items}
        columns={columns}
        getRowId={(r) => r.log_id}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}