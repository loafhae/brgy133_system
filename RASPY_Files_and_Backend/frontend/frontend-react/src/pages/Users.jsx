import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Snackbar, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_ROLES = ['super_admin', 'official', 'resident'];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', roles: 'official', is_active: true,
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
    if (!editUser && form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        roles: [form.roles],
        is_active: form.is_active,
      };

      if (editUser) {
        await api.put(`/users/${editUser.user_id}`, payload);
        setSnack('User updated successfully');
      } else {
        await api.post('/users', payload);
        setSnack('User created successfully');
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
    const query = `${u.username || ''} ${u.email || ''}`.toLowerCase();
    const matchSearch = !search || query.includes(search.toLowerCase()) || rolesArr.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const matchRole = !roleFilter || rolesArr.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const isProtected = (row) => {
    const rolesArr = Array.isArray(row?.roles) ? row.roles : typeof row?.roles === 'string' ? row.roles.split(',').map(r => r.trim()) : [row?.role];
    return rolesArr.includes('super_admin') && row?.user_id === currentUser?.user_id;
  };

  const openForm = (row) => {
    if (row) {
      let roleVal = 'resident';
      if (Array.isArray(row.roles)) {
        roleVal = row.roles[0] || 'resident';
      } else if (typeof row.roles === 'string' && row.roles.trim() !== '') {
        const parsed = row.roles.split(',').map(r => r.trim()).filter(Boolean);
        roleVal = parsed[0] || 'resident';
      } else if (row.role) {
        roleVal = row.role;
      }

      setForm({
        username: row.username || '',
        email: row.email || '',
        password: '',
        confirmPassword: '',
        roles: roleVal,
        is_active: row.is_active ?? true,
      });
      setEditUser(row);
    } else {
      setForm({
        username: '', email: '', password: '', confirmPassword: '', roles: 'official', is_active: true,
      });
      setEditUser(null);
    }
    setOpen(true);
  };

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 60 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    { 
      field: 'roles', 
      headerName: 'Roles', 
      width: 180, 
      renderCell: (params) => {
        const rArr = Array.isArray(params.row?.roles) ? params.row.roles : typeof params.row?.roles === 'string' ? params.row.roles.split(',').map(r => r.trim()).filter(Boolean) : [params.row?.role || ''];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
            {rArr.map((r, i) => <Chip key={i} label={r} size="small" color="primary" variant="outlined" />)}
          </Box>
        );
      }
    },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button size="small" variant="outlined" disabled={isProtected(row)} onClick={() => openForm(row)}>Edit</Button>
          <Button size="small" color="error" variant="outlined" disabled={isProtected(row)} onClick={() => setDeleteTarget(row)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Users Management</Typography>
        <Button variant="contained" onClick={() => openForm(null)}>Add User</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Search users" size="small" sx={{ minWidth: 300 }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {AVAILABLE_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <DataGrid 
        rows={filtered} 
        columns={columns} 
        getRowId={(r) => r.user_id} 
        loading={loading} 
        autoHeight 
        pageSizeOptions={[10, 25, 50, 100]} 
        disableRowSelectionOnClick 
      />

      {/* Add / Edit User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField label="Username" fullWidth required sx={{ mt: 1, mb: 2 }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Email" type="email" fullWidth required sx={{ mb: 2 }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Password" type="password" fullWidth required={!editUser} sx={{ mb: 2 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} helperText={editUser ? 'Leave blank to keep current' : ''} />
          {!editUser && (
            <TextField label="Confirm Password" type="password" fullWidth required sx={{ mb: 2 }} value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setPasswordError(''); }} error={!!passwordError} helperText={passwordError} />
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select value={form.roles} label="Role" onChange={(e) => setForm({ ...form, roles: e.target.value })}>
              {AVAILABLE_ROLES.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active Status" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setConfirmTarget(true)}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Save Dialog */}
      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Save</DialogTitle>
        <DialogContent><Typography>Are you sure you want to save these user details?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>NO</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>YES</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to DELETE this user?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>NO</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteTarget.user_id)}>YES, DELETE</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}