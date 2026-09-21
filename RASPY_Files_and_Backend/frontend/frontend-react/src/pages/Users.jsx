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
  Switch,
  FormControlLabel,
  Snackbar,
  Chip,
  Divider,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Add,
  Search,
  FilterAlt,
  Edit,
  Delete,
  Security,
  Badge,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

const AVAILABLE_ROLES = ['super_admin', 'official', 'resident'];

/**
 * Users - User Management module for Super Admins.
 * Adheres strictly to Figures 3.7.4, 3.7.5, 3.7.6, 3.7.7, 3.7.8, 3.7.9 in documentation.pdf.
 */
export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: 'official',
    is_active: true,
  });

  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState('official');
  const [targetUserForRole, setTargetUserForRole] = useState(null);

  const [snack, setSnack] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setSnack('Error loading user accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleValidateForm = () => {
    if (!form.username.trim()) {
      setPasswordError('Username is required.');
      return;
    }
    if (!editUser && !form.password) {
      setPasswordError('Password is required for new accounts.');
      return;
    }
    if (!editUser && form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    setConfirmTarget(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        roles: form.roles,
        is_active: form.is_active,
      };

      if (editUser) {
        await api.put(`/users/${editUser.user_id}`, payload);
        setSnack(`User account '${form.username}' updated successfully.`);
      } else {
        await api.post('/users', payload);
        setSnack(`User account '${form.username}' created successfully.`);
      }
      setOpen(false);
      setConfirmTarget(false);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error saving user');
    }
  };

  const handleAddRoleToUser = async () => {
    if (!targetUserForRole) return;
    try {
      let currentRoles = [];
      if (Array.isArray(targetUserForRole.roles)) {
        currentRoles = [...targetUserForRole.roles];
      } else if (typeof targetUserForRole.roles === 'string') {
        currentRoles = targetUserForRole.roles.split(',').map((r) => r.trim()).filter(Boolean);
      } else {
        currentRoles = [targetUserForRole.role || 'resident'];
      }

      if (!currentRoles.includes(selectedRoleToAdd)) {
        currentRoles.push(selectedRoleToAdd);
      }

      const payload = {
        username: targetUserForRole.username,
        email: targetUserForRole.email || '',
        roles: currentRoles,
        is_active: targetUserForRole.is_active ?? true,
      };

      await api.put(`/users/${targetUserForRole.user_id}`, payload);
      setSnack(`Successfully assigned ${selectedRoleToAdd} role.`);
      setTargetUserForRole({ ...targetUserForRole, roles: currentRoles });
      fetchUsers();
    } catch {
      setSnack('Error assigning role');
    }
  };

  const handleRemoveRoleFromUser = async (roleToRemove) => {
    if (!targetUserForRole) return;
    try {
      let currentRoles = [];
      if (Array.isArray(targetUserForRole.roles)) {
        currentRoles = [...targetUserForRole.roles];
      } else if (typeof targetUserForRole.roles === 'string') {
        currentRoles = targetUserForRole.roles.split(',').map((r) => r.trim()).filter(Boolean);
      } else {
        currentRoles = [targetUserForRole.role || 'resident'];
      }

      if (currentRoles.length <= 1) {
        setSnack('User must retain at least one role.');
        return;
      }

      currentRoles = currentRoles.filter((r) => r !== roleToRemove);

      const payload = {
        username: targetUserForRole.username,
        email: targetUserForRole.email || '',
        roles: currentRoles,
        is_active: targetUserForRole.is_active ?? true,
      };

      await api.put(`/users/${targetUserForRole.user_id}`, payload);
      setSnack(`Removed ${roleToRemove} role.`);
      setTargetUserForRole({ ...targetUserForRole, roles: currentRoles });
      fetchUsers();
    } catch {
      setSnack('Error removing role');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setSnack('User account deleted.');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error deleting user');
    }
  };

  const filtered = users.filter((u) => {
    const rolesArr = Array.isArray(u.roles) ? u.roles : [u.roles || u.role || ''];
    const username = u.username || '';
    const email = u.email || '';

    const query = `${username} ${email}`.toLowerCase();
    const matchSearch =
      !search ||
      query.includes(search.toLowerCase()) ||
      rolesArr.some((r) => r.toLowerCase().includes(search.toLowerCase()));
    const matchRole = !roleFilter || rolesArr.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const isProtected = (row) => {
    const rolesArr = Array.isArray(row?.roles) ? row.roles : [row?.roles || row?.role];
    return rolesArr.includes('super_admin') && row?.user_id === currentUser?.user_id;
  };

  const openForm = (row) => {
    setPasswordError('');
    if (row) {
      const rVal = Array.isArray(row.roles) ? row.roles[0] : row.roles || row.role || 'official';
      setForm({
        username: row.username || '',
        email: row.email || '',
        password: '',
        confirmPassword: '',
        roles: rVal,
        is_active: row.is_active ?? true,
      });
      setEditUser(row);
    } else {
      setForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: 'official',
        is_active: true,
      });
      setEditUser(null);
    }
    setOpen(true);
  };

  const columns = [
    { field: 'user_id', headerName: 'ID', width: 60 },
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b', my: 'auto' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'roles',
      headerName: 'Role',
      width: 170,
      renderCell: (params) => {
        const rArr = Array.isArray(params.row?.roles)
          ? params.row.roles
          : [params.row?.roles || params.row?.role || 'resident'];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
            {rArr.map((r, i) => (
              <Chip
                key={i}
                label={r === 'super_admin' ? 'Super Admin' : r === 'official' ? 'Official' : 'Resident'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor: r === 'super_admin' ? '#fee2e2' : r === 'official' ? '#e0e7ff' : '#f4f4f5',
                  color: r === 'super_admin' ? '#990000' : r === 'official' ? '#3730a3' : '#3f3f46',
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.72rem',
            bgcolor: row.is_active ? '#dcfce7' : '#fee2e2',
            color: row.is_active ? '#15803d' : '#991b1b',
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 250,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setTargetUserForRole(row);
              setSelectedRoleToAdd('official');
              setRoleOpen(true);
            }}
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          >
            Roles
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 13 }} />}
            disabled={isProtected(row)}
            onClick={() => openForm(row)}
            sx={{ fontWeight: 700, borderColor: '#e4e4e7', color: '#18181b', fontSize: '0.72rem' }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Delete sx={{ fontSize: 13 }} />}
            disabled={isProtected(row)}
            onClick={() => setDeleteTarget(row)}
            sx={{ fontWeight: 700, fontSize: '0.72rem' }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header (Figure 3.7.4) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Person sx={{ color: '#990000', fontSize: 28 }} /> User Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            Provision, review, and control system credentials and access levels for Barangay 133 personnel.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openForm(null)}
          sx={{
            bgcolor: '#990000',
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            '&:hover': { bgcolor: '#730000' },
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* Search & Role Filter Bar (Figure 3.7.4) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by username or email..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ color: '#a1a1aa', mr: 1 }} />,
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="super_admin">Super Admin</MenuItem>
            <MenuItem value="official">Barangay Official</MenuItem>
            <MenuItem value="resident">Resident</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table (Figure 3.7.4) */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e4e4e7', overflow: 'hidden' }}>
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
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 800 },
          }}
        />
      </Paper>

      {/* Add / Edit User Form Modal (Figures 3.7.6 & 3.7.8) */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          {editUser ? 'Edit User Form' : 'Add User Form'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {passwordError && (
            <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 700 }}>
              {passwordError}
            </Typography>
          )}

          <TextField
            label="Username *"
            fullWidth
            required
            size="small"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Email Address"
            type="email"
            fullWidth
            size="small"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Role Selection *</InputLabel>
            <Select
              value={form.roles}
              label="Role Selection *"
              onChange={(e) => setForm({ ...form, roles: e.target.value })}
            >
              <MenuItem value="super_admin">Super Admin</MenuItem>
              <MenuItem value="official">Barangay Official</MenuItem>
              <MenuItem value="resident">Resident</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={editUser ? 'New Password (Optional)' : 'Temporary Password *'}
            type="password"
            fullWidth
            required={!editUser}
            size="small"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            sx={{ mb: 2 }}
          />

          {!editUser && (
            <TextField
              label="Confirm Password *"
              type="password"
              fullWidth
              required
              size="small"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                color="primary"
              />
            }
            label={form.is_active ? 'Account Status: Active' : 'Account Status: Inactive'}
          />
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
            {editUser ? 'Save User' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Management Modal */}
      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Manage Roles for {targetUserForRole?.username}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Currently Assigned Roles:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {targetUserForRole &&
              (Array.isArray(targetUserForRole.roles)
                ? targetUserForRole.roles
                : [targetUserForRole.roles || targetUserForRole.role || 'resident']
              ).map((r, idx) => (
                <Chip key={idx} label={r} color="primary" onDelete={() => handleRemoveRoleFromUser(r)} />
              ))}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Add Additional Role</InputLabel>
            <Select
              value={selectedRoleToAdd}
              label="Add Additional Role"
              onChange={(e) => setSelectedRoleToAdd(e.target.value)}
            >
              {AVAILABLE_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRoleOpen(false)}>Close</Button>
          <Button variant="contained" color="success" onClick={handleAddRoleToUser} sx={{ fontWeight: 700 }}>
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Save Confirmation Modal (Figures 3.7.7 & 3.7.9) */}
      <ConfirmationDialog
        open={confirmTarget}
        title="Account Action Confirmation"
        message={editUser ? 'Are you sure you want to SAVE this user?' : 'Are you sure you want to ADD this user?'}
        onConfirm={handleSave}
        onCancel={() => setConfirmTarget(false)}
        confirmText="YES"
        cancelText="NO"
      />

      {/* Delete Confirmation Modal (Figure 3.7.5: "Are you sure you want to DELETE this user?") */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Account Deletion Safeguard"
        message="Are you sure you want to DELETE this user?"
        onConfirm={() => handleDelete(deleteTarget?.user_id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}