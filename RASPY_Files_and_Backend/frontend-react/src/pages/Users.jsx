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
  const [form, setForm] = useState({ username: '', password: '', roles: 'official', is_active: true });
  const [snack, setSnack] = useState('');
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
    try {
      if (editUser) {
        await api.put(`/users/${editUser.user_id}`, form);
        setSnack('User updated');
      } else {
        await api.post('/users', form);
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
    const matchSearch = !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.roles.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.roles === roleFilter;
    return matchSearch && matchRole;
  });

  const isProtected = (row) => row.roles === 'super_admin' || row.user_id === currentUser?.user_id;

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'roles', headerName: 'Role', width: 130 },
    {
      field: 'is_active', headerName: 'Status', width: 100,
      renderCell: ({ row }) => (row.is_active ? 'Active' : 'Inactive'),
    },
    { field: 'created_at', headerName: 'Created', width: 180,
      valueFormatter: (v) => v ? new Date(v).toLocaleString() : '',
    },
    {
      field: 'actions', headerName: 'Actions', width: 180,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" disabled={isProtected(row)} onClick={() => { setEditUser(row); setForm({ username: row.username, password: '', roles: row.roles, is_active: row.is_active }); setOpen(true); }}>Edit</Button>
          <Button size="small" color="error" disabled={isProtected(row)} onClick={() => setDeleteTarget(row)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Users</Typography>
        <Button variant="contained" onClick={() => { setEditUser(null); setForm({ username: '', password: '', roles: 'official', is_active: true }); setOpen(true); }}>Add User</Button>
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
          <TextField label="Password" type="password" fullWidth required={!editUser} sx={{ mb: 2 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} helperText={editUser ? 'Leave blank to keep current password' : ''} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select value={form.roles} label="Role" onChange={(e) => setForm({ ...form, roles: e.target.value })}>
              <MenuItem value="super_admin">Admin</MenuItem>
              <MenuItem value="official">Barangay Official</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
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
