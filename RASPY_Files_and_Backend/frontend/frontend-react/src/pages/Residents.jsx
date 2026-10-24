import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Chip,
  InputAdornment, Stack, Paper
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CheckCircle, Cancel, PersonAdd, Search, Refresh } from '@mui/icons-material';
import api from '../api/client';
import { normalizePhilippineMobile } from '../services/phone';

export default function Residents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', middle_name: '', last_name: '',
    gender: '', birthday: '', address: '', contact: '', civil_status: '', email: '',
  });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [snack, setSnack] = useState('');

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/residents');
      setItems(data);
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error loading residents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  const filtered = items.filter((r) =>
    !search || `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const contact = normalizePhilippineMobile(form.contact);
    if (!contact) {
      setSnack('Enter a valid Philippine mobile number, such as 09123456789 or +639123456789.');
      return;
    }

    try {
      const payload = {
        ...form,
        contact,
        mobile: contact,
      };
      if (edit) {
        await api.put(`/residents/${edit.resident_id}`, payload);
        setSnack('Resident record updated successfully.');
      } else {
        await api.post('/residents', payload);
        setSnack('Resident registered successfully.');
      }
      setOpen(false);
      setConfirmTarget(null);
      fetchResidents();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving resident');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/residents/${id}`);
      setSnack('Resident deleted');
      setDeleteTarget(null);
      fetchResidents();
    } catch (err) {
      const d2 = err.response?.data?.detail;
      setSnack(Array.isArray(d2) ? d2.map((e) => e.msg).join(', ') : d2 || 'Error deleting resident');
    }
  };

  const handleApprove = async (residentId) => {
    try {
      await api.put(`/residents/${residentId}/approve`);
      setSnack('Resident verified and approved successfully.');
      fetchResidents();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error approving resident');
    }
  };

  const handleDeny = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setSnack('Resident application denied and account removed.');
      fetchResidents();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error denying resident');
    }
  };

  const openForm = (row) => {
    if (row) {
      setForm({
        first_name: row.first_name || '', middle_name: row.middle_name || '',
        last_name: row.last_name || '', gender: row.gender || '',
        birthday: row.birthday || '', address: row.address || '',
        contact: row.contact || '', civil_status: row.civil_status || '',
        email: row.email || '', username: '', password: '',
      });
      setEdit(row);
    } else {
      setForm({ username: '', password: '', first_name: '', middle_name: '', last_name: '', gender: '', birthday: '', address: '', contact: '', civil_status: '', email: '' });
      setEdit(null);
    }
    setOpen(true);
  };

  const columns = [
    { field: 'resident_id', headerName: 'ID', width: 70 },
    { field: 'first_name', headerName: 'First Name', width: 120 },
    { field: 'middle_name', headerName: 'Middle Name', width: 120 },
    { field: 'last_name', headerName: 'Last Name', width: 120 },
    { field: 'gender', headerName: 'Gender', width: 90 },
    { field: 'address', headerName: 'Address', flex: 1 },
    { field: 'contact', headerName: 'Mobile', width: 130 },
    { field: 'birthday', headerName: 'Birthday', width: 110, valueFormatter: (v) => v || '' },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'civil_status', headerName: 'Civil Status', width: 110 },
    {
      field: 'is_approved',
      headerName: 'Status',
      width: 140,
      renderCell: ({ row }) => (
        row.is_approved === 0 ? (
          <Chip
            label="Pending Approval"
            size="small"
            sx={{
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              color: '#b45309',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontWeight: 750,
              fontSize: '0.72rem',
            }}
          />
        ) : (
          <Chip
            label="Verified Resident"
            size="small"
            sx={{
              bgcolor: 'rgba(34, 197, 94, 0.12)',
              color: '#15803d',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              fontWeight: 750,
              fontSize: '0.72rem',
            }}
          />
        )
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {row.is_approved === 0 ? (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircle fontSize="small" />}
                onClick={() => handleApprove(row.resident_id)}
                sx={{
                  bgcolor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.4,
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Cancel fontSize="small" />}
                onClick={() => handleDeny(row.user_id)}
                sx={{
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.4,
                  '&:hover': { borderColor: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' },
                }}
              >
                Deny
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={() => openForm(row)}
                sx={{
                  borderColor: '#e2e8f0',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.4,
                  '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => setDeleteTarget(row)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  py: 0.4,
                  '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.06)' },
                }}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Resident Records & Registration
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4, fontSize: '0.92rem' }}>
            Official Barangay 133 resident masterlist, account approvals, and in-system registration.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => openForm(null)}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            bgcolor: '#587d46',
            '&:hover': { bgcolor: '#496b39' },
            fontWeight: 750,
            borderRadius: 2.5,
            textTransform: 'none',
            px: 2.8,
            py: 1.15,
            boxShadow: '0 4px 14px rgba(88, 125, 70, 0.28)'
          }}
        >
          Register New Resident
        </Button>
      </Box>

      {/* Search Bar & Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2.5, gap: 1.5 }}>
        <TextField
          placeholder="Search by resident name..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: '100%', sm: 360 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              bgcolor: '#ffffff',
            },
          }}
        />

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchResidents}
          disabled={loading}
          sx={{
            borderColor: '#e2e8f0',
            color: '#475569',
            borderRadius: 2.2,
            px: 2,
            fontWeight: 650,
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
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
              rows={filtered}
              columns={columns}
              getRowId={(r) => r.resident_id}
              loading={loading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          </Box>
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#172115' }}>
          {edit ? 'Edit Resident Record' : 'Resident Registration Form'}
        </DialogTitle>
        <DialogContent>
          {!edit && <><TextField label="Username" fullWidth required sx={{ mt: 1, mb: 2 }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Password" type="password" fullWidth required sx={{ mb: 2 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></>}
          <TextField label="First Name" fullWidth required sx={{ mb: 2 }} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <TextField label="Middle Name" fullWidth sx={{ mb: 2 }} value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
          <TextField label="Last Name" fullWidth required sx={{ mb: 2 }} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <TextField
            label="Gender (optional)"
            fullWidth
            helperText="Enter the resident's gender in their own words, or leave blank."
            inputProps={{ maxLength: 100 }}
            sx={{ mb: 2 }}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <TextField label="Birthday" type="date" fullWidth sx={{ mb: 2 }} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Address" fullWidth sx={{ mb: 2 }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Mobile Number" type="tel" fullWidth required helperText="Use a Philippine mobile number, e.g. 09123456789 or +639123456789." sx={{ mb: 2 }} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <TextField label="Email" fullWidth sx={{ mb: 2 }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Civil Status</InputLabel>
            <Select value={form.civil_status} label="Civil Status" onChange={(e) => setForm({ ...form, civil_status: e.target.value })}>
              <MenuItem value="Single">Single</MenuItem>
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Separated">Separated</MenuItem>
              <MenuItem value="Widowed">Widowed</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.45 }}>
              <strong>Data Privacy Act (RA 10173) Notice:</strong> The recording officer certifies that valid citizen consent or official barangay census records have been verified prior to encoding.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setConfirmTarget({ ...form }); setConfirmAction('save'); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmTarget && confirmAction === 'save'} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {edit ? 'SAVE' : 'ADD'} this resident?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>NO</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>YES</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to DELETE this resident?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>NO</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteTarget.resident_id)}>YES</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}