import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Snackbar, Chip, Stack
} from '@mui/material';
import { PersonAdd, Shield, CheckCircle, Block } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_ROLES = ['official', 'super_admin', 'resident'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    contact: '',
    password: '',
    confirmPassword: '',
    roles: 'official',
    is_active: true,
  });

  const [snack, setSnack] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setSnack('Error loading users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async () => {
    if (!editUser && (!form.password || form.password.length < 6)) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (!editUser && form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim() || null,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        contact: form.contact.trim() || null,
        roles: [form.roles],
        is_active: form.is_active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editUser) {
        await api.put(`/users/${editUser.user_id}`, payload);
        setSnack('User updated successfully');
      } else {
        await api.post('/users', payload);
        setSnack('Official registered successfully');
      }
      setOpen(false);
      setConfirmTarget(null);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setSnack('User deleted successfully.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error deleting user');
    }
  };

  const filtered = users.filter((u) => {
    const rolesArr = Array.isArray(u.roles) ? u.roles : typeof u.roles === 'string' ? u.roles.split(',').map(r => r.trim()) : [u.role || ''];
    const query = `${u.username || ''} ${u.email || ''} ${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchSearch = !search || query.includes(search.toLowerCase()) || rolesArr.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const matchRole = !roleFilter || rolesArr.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const isProtected = (row) => {
    const rolesArr = Array.isArray(row?.roles) ? row?.roles : typeof row?.roles === 'string' ? row.roles.split(',').map(r => r.trim()) : [row?.role];
    return rolesArr.includes('super_admin') && row?.user_id === currentUser?.user_id;
  };

  const openForm = (row) => {
    if (row) {
      let roleVal = 'official';
      if (Array.isArray(row.roles)) {
        roleVal = row.roles[0] || 'official';
      } else if (typeof row.roles === 'string' && row.roles.trim() !== '') {
        const parsed = row.roles.split(',').map(r => r.trim()).filter(Boolean);
        roleVal = parsed[0] || 'official';
      } else if (row.role) {
        roleVal = row.role;
      }

      setForm({
        username: row.username || '',
        email: row.email || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        contact: row.contact || '',
        password: '',
        confirmPassword: '',
        roles: roleVal,
        is_active: row.is_active ?? true,
      });
      setEditUser(row);
    } else {
      setForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        contact: '',
        password: '',
        confirmPassword: '',
        roles: 'official',
        is_active: true,
      });
      setEditUser(null);
    }
    setPasswordError('');
    setOpen(true);
  };

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 60 },
    {
      field: 'name',
      headerName: 'Full Name',
      width: 170,
      renderCell: ({ row }) => {
        const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        return <Typography variant="body2" sx={{ fontWeight: 600 }}>{name || '—'}</Typography>;
      }
    },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'email', headerName: 'Email Address', width: 180 },
    { 
      field: 'roles', 
      headerName: 'Role', 
      width: 140, 
      renderCell: (params) => {
        const rArr = Array.isArray(params.row?.roles) ? params.row.roles : typeof params.row?.roles === 'string' ? params.row.roles.split(',').map(r => r.trim()).filter(Boolean) : [params.row?.role || ''];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
            {rArr.map((r, i) => (
              <Chip
                key={i}
                label={r}
                size="small"
                color={r === 'super_admin' ? 'error' : r === 'official' ? 'primary' : 'default'}
                variant="outlined"
                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
              />
            ))}
          </Box>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip
            size="small"
            icon={row.is_active ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Block sx={{ fontSize: '14px !important' }} />}
            label={row.is_active ? 'Active' : 'Disabled'}
            color={row.is_active ? 'success' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button size="small" variant="outlined" disabled={isProtected(row)} onClick={() => openForm(row)}>
            Edit
          </Button>
          <Button size="small" color="error" variant="outlined" disabled={isProtected(row)} onClick={() => setDeleteTarget(row)}>
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Users & Officials Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Create, configure, and manage official and administrative accounts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => openForm(null)}
          sx={{
            bgcolor: '#7d9c65',
            '&:hover': { bgcolor: '#5f7a4b' },
            borderRadius: 2,
            px: 2.5,
            py: 1,
            fontWeight: 600
          }}
        >
          Register Official
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search by name, username, or email"
          size="small"
          sx={{ minWidth: 320, bgcolor: '#fff', borderRadius: 1 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 180, bgcolor: '#fff', borderRadius: 1 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            {AVAILABLE_ROLES.map((r) => (
              <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
                {r.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table Card */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <DataGrid 
          rows={filtered} 
          columns={columns} 
          getRowId={(r) => r.user_id} 
          loading={loading} 
          autoHeight 
          pageSizeOptions={[10, 25, 50]} 
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 700 },
          }}
        />
      </Box>

      {/* Add / Edit User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>
          {editUser ? 'Edit User Credentials & Profile' : 'Register Barangay Official Account'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                fullWidth
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="e.g. Juan"
              />
              <TextField
                label="Last Name"
                fullWidth
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="e.g. Dela Cruz"
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Username"
                fullWidth
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. officer.delacruz"
              />
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. officer@barangay133.gov.ph"
              />
            </Stack>

            <TextField
              label="Contact / Mobile Number"
              fullWidth
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="e.g. 09171234567"
            />

            <FormControl fullWidth>
              <InputLabel>Account Role</InputLabel>
              <Select
                value={form.roles}
                label="Account Role"
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
              >
                <MenuItem value="official">Barangay Official</MenuItem>
                <MenuItem value="super_admin">System Administrator</MenuItem>
                <MenuItem value="resident">Resident Account</MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={editUser ? 'New Password (Optional)' : 'Initial Password'}
                type="password"
                fullWidth
                required={!editUser}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                helperText={editUser ? 'Leave blank to retain existing password' : 'Minimum 6 characters'}
              />
              {!editUser && (
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={form.confirmPassword}
                  onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setPasswordError(''); }}
                  error={!!passwordError}
                  helperText={passwordError}
                />
              )}
            </Stack>

            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} color="primary" />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Active Status (Can Log In)</Typography>}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => setConfirmTarget(true)}
            sx={{ bgcolor: '#7d9c65', '&:hover': { bgcolor: '#5f7a4b' }, fontWeight: 600, px: 3 }}
          >
            {editUser ? 'Save Changes' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Save Dialog */}
      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Account Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to {editUser ? 'update' : 'create'} this user account?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={handleSave} sx={{ bgcolor: '#7d9c65', '&:hover': { bgcolor: '#5f7a4b' } }}>
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#b93636' }}>Delete User Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete user <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteTarget.user_id)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}