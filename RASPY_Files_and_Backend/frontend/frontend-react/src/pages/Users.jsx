import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '', roles: 'official', is_active: true,
    first_name: '', middle_name: '', last_name: '', gender: '', birthday: '',
    address: '', contact: '', civil_status: '', email: '',
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async () => {
    if (!editUser && form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    try {
      const payload = {
        username: form.username, password: form.password, roles: form.roles,
        first_name: form.first_name, middle_name: form.middle_name, last_name: form.last_name,
        gender: form.gender, birthday: form.birthday || null, address: form.address,
        contact: form.contact, civil_status: form.civil_status, email: form.email,
      };
      if (editUser) {
        await api.put(`/users/${editUser.user_id}`, payload);
        setSnack('User updated');
      } else {
        await api.post('/users', payload);
        setSnack('User created');
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
      setSnack('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error deleting user');
    }
  };

  const filtered = users.filter((u) => {
    const name = `${u.first_name || ''} ${u.last_name || ''} ${u.username}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || u.roles.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.roles === roleFilter;
    return matchSearch && matchRole;
  });

  const isProtected = (row) => row.roles === 'super_admin' || row.user_id === currentUser?.user_id;

  const openForm = (row) => {
    if (row) {
      setForm({
        username: row.username, password: '', confirmPassword: '', roles: row.roles, is_active: row.is_active ?? true,
        first_name: row.first_name || '', middle_name: row.middle_name || '', last_name: row.last_name || '',
        gender: row.gender || '', birthday: row.birthday || '', address: row.address || '',
        contact: row.contact || '', civil_status: row.civil_status || '', email: row.email || '',
      });
      setEditUser(row);
    } else {
      setForm({
        username: '', password: '', confirmPassword: '', roles: 'official', is_active: true,
        first_name: '', middle_name: '', last_name: '', gender: '', birthday: '',
        address: '', contact: '', civil_status: '', email: '',
      });
      setEditUser(null);
    }
    setOpen(true);
  };

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 60 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'roles', headerName: 'Role', width: 110 },
    { field: 'first_name', headerName: 'First Name', width: 120 },
    { field: 'last_name', headerName: 'Last Name', width: 120 },
    { field: 'contact', headerName: 'Contact', width: 130 },
    { field: 'address', headerName: 'Address', flex: 1 },
    {
      field: 'is_active', headerName: 'Status', width: 80,
      renderCell: ({ row }) => (row.is_active ? 'Active' : 'Inactive'),
    },
    {
      field: 'actions', headerName: 'Actions', width: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" disabled={isProtected(row)} onClick={() => openForm(row)}>Edit</Button>
          <Button size="small" color="error" disabled={isProtected(row)} onClick={() => setDeleteTarget(row)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Users</Typography>
        <Button variant="contained" onClick={() => openForm(null)}>Add User</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Search users" size="small" sx={{ minWidth: 300 }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="super_admin">Admin</MenuItem>
            <MenuItem value="official">Barangay Official</MenuItem>
            <MenuItem value="resident">Resident</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <DataGrid rows={filtered} columns={columns} getRowId={(r) => r.user_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField label="Username" fullWidth required sx={{ mt: 1, mb: 2 }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Password" type="password" fullWidth required={!editUser} sx={{ mb: 2 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} helperText={editUser ? 'Leave blank to keep current' : ''} />
          {!editUser && (
            <TextField label="Confirm Password" type="password" fullWidth required sx={{ mb: 2 }} value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setPasswordError(''); }} error={!!passwordError} helperText={passwordError} />
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select value={form.roles} label="Role" onChange={(e) => setForm({ ...form, roles: e.target.value })}>
              <MenuItem value="super_admin">Admin</MenuItem>
              <MenuItem value="official">Barangay Official</MenuItem>
              <MenuItem value="resident">Resident</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Profile Information</Typography>
          <TextField label="First Name" fullWidth sx={{ mb: 2 }} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <TextField label="Middle Name" fullWidth sx={{ mb: 2 }} value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
          <TextField label="Last Name" fullWidth sx={{ mb: 2 }} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <TextField label="Contact" fullWidth sx={{ mb: 2 }} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          {form.roles === 'resident' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Gender</InputLabel>
                <Select value={form.gender} label="Gender" onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Birthday" type="date" fullWidth sx={{ mb: 2 }} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Address" fullWidth sx={{ mb: 2 }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <TextField label="Email" fullWidth sx={{ mb: 2 }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Civil Status</InputLabel>
                <Select value={form.civil_status} label="Civil Status" onChange={(e) => setForm({ ...form, civil_status: e.target.value })}>
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Divorced">Divorced</MenuItem>
                  <MenuItem value="Widowed">Widowed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConfirmTarget(true)}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm {editUser ? 'Save' : 'Add'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {editUser ? 'SAVE' : 'ADD'} this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>NO</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>YES</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to DELETE this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>NO</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteTarget.user_id)}>YES</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
