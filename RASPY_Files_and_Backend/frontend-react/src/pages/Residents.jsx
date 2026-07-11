import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

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

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/residents');
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter((r) =>
    !search || `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    try {
      if (edit) {
        await api.put(`/residents/${edit.resident_id}`, form);
        setSnack('Resident updated');
      } else {
        await api.post('/residents', form);
        setSnack('Resident created');
      }
      setOpen(false);
      setConfirmTarget(null);
      fetch();
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
      fetch();
    } catch (err) {
      const d2 = err.response?.data?.detail;
      setSnack(Array.isArray(d2) ? d2.map((e) => e.msg).join(', ') : d2 || 'Error deleting resident');
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
      field: 'actions', headerName: 'Actions', width: 160,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => openForm(row)}>Edit</Button>
          <Button size="small" color="error" onClick={() => setDeleteTarget(row)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Residents Records</Typography>
        <Button variant="contained" onClick={() => openForm(null)}>Add Resident</Button>
      </Box>
      <TextField label="Search resident" size="small" sx={{ mb: 2, minWidth: 300 }}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <DataGrid rows={filtered} columns={columns} getRowId={(r) => r.resident_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit ? 'Edit Resident' : 'Add Resident'}</DialogTitle>
        <DialogContent>
          {!edit && <><TextField label="Username" fullWidth required sx={{ mt: 1, mb: 2 }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <TextField label="Password" type="password" fullWidth required sx={{ mb: 2 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></>}
          <TextField label="First Name" fullWidth required sx={{ mb: 2 }} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <TextField label="Middle Name" fullWidth sx={{ mb: 2 }} value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
          <TextField label="Last Name" fullWidth required sx={{ mb: 2 }} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Gender</InputLabel>
            <Select value={form.gender} label="Gender" onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Birthday" type="date" fullWidth sx={{ mb: 2 }} value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Address" fullWidth sx={{ mb: 2 }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Mobile Number" fullWidth sx={{ mb: 2 }} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
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
