import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', is_published: true });
  const [file, setFile] = useState(null);
  const [snack, setSnack] = useState('');
  const fileRef = null;
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/announcements'); setItems(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && a.date_posted && new Date(a.date_posted) < new Date(dateFrom)) return false;
    if (dateTo && a.date_posted) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(a.date_posted) > toDate) return false;
    }
    return true;
  });

  const handleSave = async () => {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('content', form.content);
    fd.append('is_published', String(form.is_published));
    if (file) fd.append('attachment', file);
    try {
      if (edit) {
        await api.put(`/announcements/${edit.announcement_id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSnack('Announcement updated');
      } else {
        await api.post('/announcements', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSnack('Announcement created');
      }
      setOpen(false);
      setSubmitConfirm(null);
      setFile(null);
      fetch();
    } catch (err) {
      const data = err.response?.data;
      const msg = Array.isArray(data?.detail) ? data.detail.map((e) => e.msg).join(', ') : data?.detail || 'Error saving announcement';
      setSnack(msg);
    }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/announcements/${id}`); setSnack('Deleted'); setDeleteTarget(null); fetch(); }
    catch (err) { const data = err.response?.data; setSnack(Array.isArray(data?.detail) ? data.detail.map((e) => e.msg).join(', ') : data?.detail || 'Error'); }
  };

  const openForm = (row) => {
    if (row) { setEdit(row); setForm({ title: row.title, content: row.content, is_published: row.is_published }); }
    else { setEdit(null); setForm({ title: '', content: '', is_published: true }); setFile(null); }
    setOpen(true);
  };

  const columns = [
    { field: 'announcement_id', headerName: 'ID', width: 70 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'date_posted', headerName: 'Date', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    { field: 'is_published', headerName: 'Status', width: 110, renderCell: ({ row }) => (row.is_published ? 'Publish' : 'Draft') },
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
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Announcements</Typography>
        <Button variant="contained" onClick={() => openForm(null)}>Add Announcement</Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField label="Search announcements" size="small" sx={{ minWidth: 300 }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField label="From" type="date" size="small" sx={{ minWidth: 180 }}
          value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To" type="date" size="small" sx={{ minWidth: 180 }}
          value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <DataGrid rows={filtered} columns={columns} getRowId={(r) => r.announcement_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth required sx={{ mt: 1, mb: 2 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Body" fullWidth required multiline rows={4} sx={{ mb: 2 }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <FormControlLabel control={<Switch checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />} label="Published" sx={{ mb: 2, display: 'block' }} />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSubmitConfirm(true)}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!submitConfirm} onClose={() => setSubmitConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm {edit ? 'Save' : 'Submit'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {edit ? 'SAVE' : 'submit'} this Announcement?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitConfirm(null)}>NO</Button>
          <Button color="primary" variant="contained" onClick={handleSave}>YES</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to DELETE this announcement?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>NO</Button>
          <Button color="error" variant="contained" onClick={() => handleDelete(deleteTarget.announcement_id)}>YES</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}