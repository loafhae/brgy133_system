import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  FilterAlt,
  Edit,
  Delete,
  AttachFile,
  Campaign,
  Description,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * Announcements - Implementation for Officials and Super Admin.
 * Strictly adheres to Figures 3.9.3 - 3.10.0 in documentation.pdf.
 * Features:
 * - Tabular interface: Title, Date, Status (Publish / Draft), Edit/Delete actions
 * - Add/Edit Announcement Form (Figures 3.9.6, 3.9.8) with Title, Body, Upload option
 * - Confirmation Modals (Figures 3.9.4, 3.9.7, 3.9.9)
 * - 7-day visibility rule adherence
 */
export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', is_published: true });
  const [file, setFile] = useState(null);
  const [snack, setSnack] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      setSnack('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filtered = items.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (dateFrom && a.date_posted && new Date(a.date_posted) < new Date(dateFrom)) return false;
    if (dateTo && a.date_posted) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(a.date_posted) > toDate) return false;
    }
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('content', form.content.trim());
    fd.append('is_published', String(form.is_published));
    if (file) fd.append('attachment', file);

    try {
      if (edit) {
        await api.put(`/announcements/${edit.announcement_id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSnack(`Announcement '${form.title}' updated successfully.`);
      } else {
        await api.post('/announcements', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSnack('New announcement published successfully.');
      }
      setOpen(false);
      setSubmitConfirm(false);
      setFile(null);
      fetchAnnouncements();
    } catch (err) {
      const data = err.response?.data;
      const msg = Array.isArray(data?.detail)
        ? data.detail.map((e) => e.msg).join(', ')
        : data?.detail || 'Error saving announcement';
      setSnack(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setSnack('Announcement removed and archived.');
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      const data = err.response?.data;
      setSnack(Array.isArray(data?.detail) ? data.detail.map((e) => e.msg).join(', ') : data?.detail || 'Error deleting announcement');
    }
  };

  const openForm = (row) => {
    if (row) {
      setEdit(row);
      setForm({ title: row.title, content: row.content, is_published: Boolean(row.is_published) });
    } else {
      setEdit(null);
      setForm({ title: '', content: '', is_published: true });
      setFile(null);
    }
    setOpen(true);
  };

  const columns = [
    { field: 'announcement_id', headerName: 'ID', width: 70 },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b', my: 'auto' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'date_posted',
      headerName: 'Date',
      width: 170,
      valueFormatter: (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''),
    },
    {
      field: 'is_published',
      headerName: 'Status',
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          label={row.is_published ? 'Publish' : 'Draft'}
          size="small"
          sx={{
            fontWeight: 800,
            bgcolor: row.is_published ? '#dcfce7' : '#f4f4f5',
            color: row.is_published ? '#15803d' : '#71717a',
            fontSize: '0.72rem',
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 15 }} />}
            onClick={() => openForm(row)}
            sx={{ fontWeight: 700, borderColor: '#e4e4e7', color: '#18181b' }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Delete sx={{ fontSize: 15 }} />}
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
      {/* Header Bar (Figure 3.9.3) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Campaign sx={{ color: '#990000', fontSize: 28 }} /> Announcement Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            Compose, publish, and manage community announcements for Barangay 133 residents.
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
          Add Announcement
        </Button>
      </Box>

      {/* Filter and Search Bar (Figures 3.9.3 & 3.10.0) */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid #e4e4e7',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search announcements..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ color: '#a1a1aa', mr: 1, fontSize: 20 }} />,
            },
          }}
        />

        <TextField
          label="Filter by Date From"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          sx={{ minWidth: 160 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Filter by Date To"
          type="date"
          size="small"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          sx={{ minWidth: 160 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {(search || dateFrom || dateTo) && (
          <Button
            size="small"
            onClick={() => {
              setSearch('');
              setDateFrom('');
              setDateTo('');
            }}
            sx={{ color: '#71717a' }}
          >
            Reset Filters
          </Button>
        )}
      </Paper>

      {/* Announcements Table (Figure 3.9.5) */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e4e4e7', overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.announcement_id}
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

      {/* Add / Edit Announcement Modal (Figures 3.9.6 & 3.9.8) */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          {edit ? 'Edit Announcement' : 'Announcement Management – Add Announcement Form'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          <TextField
            label="Title *"
            placeholder="e.g., Water Interruption / Ayuda Senior Citizen"
            fullWidth
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <TextField
            label="Body (Message Content) *"
            placeholder="Enter complete announcement details, dates, and instructions for residents..."
            fullWidth
            required
            multiline
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                color="primary"
              />
            }
            label={form.is_published ? 'Published (Visible to Residents)' : 'Draft (Saved internally)'}
            sx={{ mb: 2.5, display: 'block' }}
          />

          {/* Upload attachment option (Figure 3.9.6) */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b' }}>
                Upload Supporting File / Official Poster
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Attach PDF circulars, official memorandum, or schedule images.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AttachFile />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderColor: '#cbd5e1', color: '#334155', fontWeight: 700 }}
              >
                {file ? 'Change File' : 'Select File'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <Chip
                  label={file.name.slice(0, 16) + '...'}
                  onDelete={() => setFile(null)}
                  size="small"
                  sx={{ bgcolor: '#e2e8f0', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 700, color: '#71717a' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setSubmitConfirm(true)}
            disabled={!form.title.trim() || !form.content.trim()}
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 800, px: 3, borderRadius: 2 }}
          >
            {edit ? 'Save Changes' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Confirmation Modal (Figures 3.9.7 & 3.9.9) */}
      <ConfirmationDialog
        open={submitConfirm}
        title="Verification Safeguard"
        message={
          edit
            ? `Are you sure you want to SAVE the '${form.title}' announcement?`
            : 'Are you sure you want to submit this Announcement?'
        }
        onConfirm={handleSave}
        onCancel={() => setSubmitConfirm(false)}
        confirmText="YES"
        cancelText="NO"
        loading={saving}
      />

      {/* Delete Confirmation Modal (Figure 3.9.4) */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Deletion Safeguard"
        message={`Are you sure you want to delete the '${deleteTarget?.title}' announcement?`}
        onConfirm={() => handleDelete(deleteTarget?.announcement_id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      {/* Feedback Toast */}
      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}