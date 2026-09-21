import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Chip,
  Paper,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  People,
  Add,
  Search,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * Residents - Dedicated administrative module for managing registered community residents.
 * Adheres strictly to Figures 3.7.10, 3.8.0, 3.8.1, 3.8.2, 3.8.3, 3.8.4, 3.8.5 in documentation.pdf.
 */
export default function Residents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Male',
    birthday: '',
    address: '',
    contact: '',
    civil_status: 'Single',
    email: '',
  });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(false);
  const [snack, setSnack] = useState('');
  const [formError, setFormError] = useState('');

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/residents');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error loading residents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const filtered = items.filter((r) => {
    const fullName = `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase();
    const query = `${fullName} ${r.address || ''} ${r.contact || ''} ${r.email || ''}`.toLowerCase();
    return !search || query.includes(search.toLowerCase());
  });

  const handleOpenForm = (resident = null) => {
    setFormError('');
    if (resident) {
      setEdit(resident);
      setForm({
        username: resident.username || '',
        password: '',
        confirmPassword: '',
        first_name: resident.first_name || '',
        middle_name: resident.middle_name || '',
        last_name: resident.last_name || '',
        gender: resident.gender || 'Male',
        birthday: resident.birthday || '',
        address: resident.address || '',
        contact: resident.contact || '',
        civil_status: resident.civil_status || 'Single',
        email: resident.email || '',
      });
    } else {
      setEdit(null);
      setForm({
        username: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'Male',
        birthday: '',
        address: '',
        contact: '',
        civil_status: 'Single',
        email: '',
      });
    }
    setOpen(true);
  };

  const handleValidateForm = () => {
    setFormError('');
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First Name and Last Name are required.');
      return;
    }
    if (!edit && (!form.username.trim() || !form.password)) {
      setFormError('Username and Temporary Password are required for new accounts.');
      return;
    }
    if (!edit && form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    // Duplicate Check: Full Name + Birthday (FR2 Requirement 4)
    if (!edit) {
      const isDuplicate = items.some(
        (r) =>
          r.first_name?.trim().toLowerCase() === form.first_name.trim().toLowerCase() &&
          r.last_name?.trim().toLowerCase() === form.last_name.trim().toLowerCase() &&
          r.birthday === form.birthday
      );
      if (isDuplicate) {
        setFormError('A resident with the same Full Name and Birthday already exists.');
        return;
      }
    }

    setConfirmTarget(true);
  };

  const handleSave = async () => {
    try {
      if (edit) {
        await api.put(`/residents/${edit.resident_id}`, form);
        setSnack(`Resident ${form.first_name} ${form.last_name} updated successfully.`);
      } else {
        await api.post('/residents', form);
        setSnack(`New resident ${form.first_name} ${form.last_name} registered successfully.`);
      }
      setOpen(false);
      setConfirmTarget(false);
      fetchResidents();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving resident record');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/residents/${id}`);
      setSnack('Resident record deleted or archived.');
      setDeleteTarget(null);
      fetchResidents();
    } catch (err) {
      const d2 = err.response?.data?.detail;
      setSnack(Array.isArray(d2) ? d2.map((e) => e.msg).join(', ') : d2 || 'Error deleting resident');
    }
  };

  const columns = [
    { field: 'resident_id', headerName: 'ID', width: 60 },
    {
      field: 'full_name',
      headerName: 'Full Name',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b', my: 'auto' }}>
          {`${params.row.first_name || ''} ${params.row.middle_name || ''} ${params.row.last_name || ''}`}
        </Typography>
      ),
    },
    { field: 'gender', headerName: 'Gender', width: 90 },
    { field: 'birthday', headerName: 'Birthday', width: 110 },
    { field: 'civil_status', headerName: 'Civil Status', width: 110 },
    { field: 'contact', headerName: 'Mobile Number', width: 140 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'address', headerName: 'Address', flex: 1 },
    {
      field: 'actions',
      headerName: 'Action',
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 14 }} />}
            onClick={() => handleOpenForm(row)}
            sx={{ fontWeight: 700, borderColor: '#e4e4e7', color: '#18181b' }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Delete sx={{ fontSize: 14 }} />}
            onClick={() => setDeleteTarget(row)}
            sx={{ fontWeight: 700 }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header (Figure 3.7.10) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <People sx={{ color: '#990000', fontSize: 28 }} /> Residents Records
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            Comprehensive demographic and contact registry for all Barangay 133 residents.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenForm(null)}
          sx={{
            bgcolor: '#990000',
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            '&:hover': { bgcolor: '#730000' },
          }}
        >
          Add New Resident
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #e4e4e7' }}>
        <TextField
          placeholder="Search by name, address, contact, or email..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#a1a1aa' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Paper>

      {/* Data Table (Figures 3.7.10 & 3.8.0) */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e4e4e7', overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.resident_id}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 800 },
          }}
        />
      </Paper>

      {/* Add / Edit Resident Modal (Figures 3.8.2 & 3.8.4) */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          {edit ? 'Edit Resident Profile' : 'Add Resident Form'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {formError && (
            <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 700 }}>
              {formError}
            </Typography>
          )}

          <Grid container spacing={2}>
            {!edit && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Username *"
                    fullWidth
                    required
                    size="small"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Temporary Password *"
                    type="password"
                    fullWidth
                    required
                    size="small"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirm Password *"
                    type="password"
                    fullWidth
                    required
                    size="small"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={4}>
              <TextField
                label="First Name *"
                fullWidth
                required
                size="small"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Middle Name"
                fullWidth
                size="small"
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Last Name *"
                fullWidth
                required
                size="small"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={form.gender}
                  label="Gender"
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Birthday"
                type="date"
                fullWidth
                size="small"
                value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Civil Status</InputLabel>
                <Select
                  value={form.civil_status}
                  label="Civil Status"
                  onChange={(e) => setForm({ ...form, civil_status: e.target.value })}
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                  <MenuItem value="Divorced">Divorced</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Mobile Number"
                placeholder="09XXXXXXXXX"
                fullWidth
                size="small"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                size="small"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Complete Address in Barangay 133"
                placeholder="House No., Street, Zone 11, Tondo, Manila"
                fullWidth
                size="small"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, color: '#71717a' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleValidateForm}
            sx={{ bgcolor: '#990000', '&:hover': { bgcolor: '#730000' }, fontWeight: 800, px: 3, borderRadius: 2 }}
          >
            {edit ? 'Save Resident' : 'Add Resident'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Save Confirmation Modal (Figures 3.8.3 & 3.8.5) */}
      <ConfirmationDialog
        open={confirmTarget}
        title="Confirmation Checkpoint"
        message={`Are you sure you want to ${edit ? 'SAVE' : 'ADD'} this resident?`}
        onConfirm={handleSave}
        onCancel={() => setConfirmTarget(false)}
        confirmText="YES"
        cancelText="NO"
      />

      {/* Delete Confirmation Modal (Figure 3.8.1: "Are you sure you want to DELETE this resident?") */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Deletion Safeguard"
        message="Are you sure you want to DELETE this resident?"
        onConfirm={() => handleDelete(deleteTarget?.resident_id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}