import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search,
  Feedback as FeedbackIcon,
  Visibility,
  Delete,
  CheckCircle,
  Pending,
  AttachFile,
  Person,
  Schedule,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * Feedback - Review and management module for Officials and Super Admins.
 * Adheres strictly to:
 * - Figure 3.8.6: Super Admin Feedback Dashboard
 * - Figure 3.8.7: Deletion of Feedback Confirmation
 * - Figure 3.8.8: View Residents Feedback
 * - Figure 4.1.3: Feedback / Inquiries Interface
 * - Figure 4.1.4: Feedback Details Page
 */
export default function Feedback() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState('');

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedback');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      setSnack('Error loading resident feedback records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      setSnack('Feedback record deleted successfully.');
      setDeleteTarget(null);
      fetchFeedback();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(Array.isArray(d) ? d.map((e) => e.msg).join(', ') : d || 'Error deleting feedback');
    }
  };

  const toggleResolved = async (row) => {
    try {
      await api.patch(`/feedback/${row.feedback_id}`, { is_resolved: !row.is_resolved });
      setSnack(row.is_resolved ? 'Marked as Pending' : 'Marked as Resolved');
      if (selected && selected.feedback_id === row.feedback_id) {
        setSelected({ ...selected, is_resolved: !selected.is_resolved });
      }
      fetchFeedback();
    } catch {
      setSnack('Error updating feedback status');
    }
  };

  const filteredItems = items.filter((item) => {
    const query = `${item.username || ''} ${item.subject || ''} ${item.content || ''}`.toLowerCase();
    return !search || query.includes(search.toLowerCase());
  });

  const columns = [
    { field: 'feedback_id', headerName: 'ID', width: 60 },
    {
      field: 'username',
      headerName: 'Name',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b', my: 'auto' }}>
          {params.value || 'Anonymous Resident'}
        </Typography>
      ),
    },
    {
      field: 'activity_type',
      headerName: 'Activity',
      width: 170,
      renderCell: () => (
        <Chip
          label="Feedback Submitted"
          size="small"
          sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: '0.72rem' }}
        />
      ),
    },
    {
      field: 'subject',
      headerName: 'Description / Subject',
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#18181b' }}>
            {params.row.subject}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {params.row.content}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      width: 170,
      valueFormatter: (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''),
    },
    {
      field: 'is_resolved',
      headerName: 'Status',
      width: 120,
      renderCell: ({ row }) => (
        <Chip
          icon={row.is_resolved ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Pending sx={{ fontSize: '14px !important' }} />}
          label={row.is_resolved ? 'Resolved' : 'Pending'}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.72rem',
            bgcolor: row.is_resolved ? '#dcfce7' : '#fef3c7',
            color: row.is_resolved ? '#166534' : '#92400e',
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility sx={{ fontSize: 14 }} />}
            onClick={() => {
              setSelected(row);
              setViewOpen(true);
            }}
            sx={{ fontWeight: 700, borderColor: '#e4e4e7', color: '#18181b' }}
          >
            View
          </Button>
          {hasRole('super_admin') && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(row)}
              sx={{ border: '1px solid #fecaca' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header (Figures 3.8.6 & 4.1.3) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FeedbackIcon sx={{ color: '#990000', fontSize: 28 }} /> Feedback & Resident Inquiries
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            Centralized monitoring interface for community-driven reports, complaints, and service suggestions.
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #e4e4e7' }}>
        <TextField
          placeholder="Search feedback by resident name, category, or keywords..."
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

      {/* Table (Figures 3.8.6 & 4.1.3) */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e4e4e7', overflow: 'hidden' }}>
        <DataGrid
          rows={filteredItems}
          columns={columns}
          getRowId={(r) => r.feedback_id}
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

      {/* View Resident Feedback Modal (Figures 3.8.8 & 4.1.4: "View Residents Feedback") */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          Resident Concern Details
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {selected && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', mb: 1 }}>
                {selected.subject}
              </Typography>

              {/* Author & Timestamp (Figure 3.8.8: "Created By: [Name]") */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Person sx={{ fontSize: 18, color: '#71717a' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#3f3f46' }}>
                    Created By: {selected.username || 'Resident'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Schedule sx={{ fontSize: 18, color: '#71717a' }} />
                  <Typography variant="caption" sx={{ color: '#71717a' }}>
                    {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Message Narrative Body (Figure 3.8.8) */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#71717a', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Feedback Narrative
              </Typography>
              <Paper sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5 }}>
                <Typography variant="body1" sx={{ color: '#18181b', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selected.content}
                </Typography>
              </Paper>

              {/* Attachment if present */}
              {selected.attachment_path && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Digital Evidence Attachment:
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFile />}
                    href={`/uploads/${selected.attachment_path}`}
                    target="_blank"
                    sx={{ borderRadius: 2, color: '#990000', borderColor: '#990000', fontWeight: 700 }}
                  >
                    View Attached Photo / Document
                  </Button>
                </Box>
              )}

              {/* Status & Resolve Action */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'block' }}>
                    CURRENT RESOLUTION
                  </Typography>
                  <Chip
                    label={selected.is_resolved ? 'Resolved' : 'Pending Action'}
                    size="small"
                    color={selected.is_resolved ? 'success' : 'warning'}
                    sx={{ fontWeight: 800, mt: 0.5 }}
                  />
                </Box>

                <Button
                  variant="contained"
                  onClick={() => toggleResolved(selected)}
                  sx={{
                    bgcolor: selected.is_resolved ? '#d97706' : '#16a34a',
                    fontWeight: 700,
                    borderRadius: 2,
                    '&:hover': { bgcolor: selected.is_resolved ? '#b45309' : '#15803d' },
                  }}
                >
                  {selected.is_resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewOpen(false)} sx={{ fontWeight: 700, color: '#71717a' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal (Figure 3.8.7: "Are you sure you want to DELETE this Feedback?") */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Deletion Safeguard"
        message="Are you sure you want to DELETE this Feedback?"
        onConfirm={() => handleDelete(deleteTarget?.feedback_id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}