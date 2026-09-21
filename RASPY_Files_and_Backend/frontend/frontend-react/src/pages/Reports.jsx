import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Paper,
  Snackbar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Assessment,
  Add,
  Search,
  FilterAlt,
  Download,
  Delete,
  PictureAsPdf,
  CalendarMonth,
  Refresh,
} from '@mui/icons-material';
import api from '../api/client';
import ConfirmationDialog from '../components/ConfirmationDialog';

/**
 * Reports - Summary Reports generation and management module.
 * Adheres strictly to Figures 4.1.0, 4.1.1, 4.1.2 in documentation.pdf.
 */
export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [snack, setSnack] = useState('');
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    report_type: 'announcement',
    start_date: '',
    end_date: '',
    file_type: 'pdf',
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports');
      setReports(Array.isArray(data) ? data : []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const reportTypes = [
    { value: 'announcement', label: 'Announcement' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'activity', label: 'Activity History' },
    { value: 'detection', label: 'Garbage Alert' },
  ];

  const handleOpenGenerate = () => {
    const today = new Date().toISOString().split('T')[0];
    const pastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setForm({
      report_type: 'announcement',
      start_date: pastMonth,
      end_date: today,
      file_type: 'pdf',
    });
    setGenerateModalOpen(true);
  };

  const handleProceedToConfirm = () => {
    setConfirmGenerateOpen(true);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const typeLabels = {
        announcement: 'Announcement Summary',
        feedback: 'Residents Feedback Summary',
        activity: 'Activity History Summary',
        detection: 'Garbage Collection Summary',
      };

      await api.post('/reports/generate', {
        title: typeLabels[form.report_type] || `${form.report_type} Report`,
        report_type: form.report_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        file_format: form.file_type || 'pdf',
      });

      setSnack('Report compiled and generated successfully.');
      setConfirmGenerateOpen(false);
      setGenerateModalOpen(false);
      fetchReports();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(d || 'Failed to generate summary report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      await api.delete(`/reports/${id}`);
      setSnack('Report file removed.');
      setDeleteTarget(null);
      fetchReports();
    } catch (err) {
      setSnack(err.response?.data?.detail || 'Failed to delete report');
    }
  };

  const filteredReports = reports.filter((r) => {
    const titleMatch = !search || r.title?.toLowerCase().includes(search.toLowerCase());
    const dateMatch = !filterDate || (r.created_at && r.created_at.startsWith(filterDate));
    return titleMatch && dateMatch;
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header (Figure 4.1.0) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Assessment sx={{ color: '#990000', fontSize: 28 }} /> Summary Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            Generate and archive official summaries of announcements, resident feedback, and garbage detection.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenGenerate}
          sx={{
            bgcolor: '#990000',
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            '&:hover': { bgcolor: '#730000' },
          }}
        >
          Add Reports
        </Button>
      </Box>

      {/* Filter and Search Bar (Figure 4.1.0) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search report titles..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ color: '#a1a1aa', mr: 1 }} />,
            },
          }}
        />

        <TextField
          label="Filter by Date"
          type="date"
          size="small"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          sx={{ minWidth: 170 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {(search || filterDate) && (
          <Button size="small" onClick={() => { setSearch(''); setFilterDate(''); }} sx={{ color: '#71717a' }}>
            Reset
          </Button>
        )}

        <Button size="small" startIcon={<Refresh />} onClick={fetchReports} sx={{ color: '#52525b', ml: 'auto' }}>
          Refresh
        </Button>
      </Paper>

      {/* Generated Reports List Format (Figure 4.1.0) */}
      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Loading generated reports...
        </Typography>
      ) : filteredReports.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #d4d4d8' }}>
          <Typography variant="h6" sx={{ color: '#52525b', fontWeight: 600 }}>
            No summary reports generated yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Click "Add Reports" above to compile a new PDF report of announcements or community activity.
          </Typography>
          <Button variant="contained" size="small" onClick={handleOpenGenerate} sx={{ bgcolor: '#990000', fontWeight: 700 }}>
            Generate First Report
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredReports.map((r) => (
            <Paper
              key={r.report_id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: '1px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: '#990000',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#fef2f2',
                    color: '#990000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PictureAsPdf sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#18181b' }}>
                    {r.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonth sx={{ fontSize: 13 }} />
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    {r.start_date && ` • Coverage: ${new Date(r.start_date).toLocaleDateString()} – ${new Date(r.end_date).toLocaleDateString()}`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Download File Button (Figure 4.1.0: "Download File") */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  href={r.download_url || '#'}
                  download
                  sx={{
                    fontWeight: 700,
                    borderColor: '#cbd5e1',
                    color: '#1e293b',
                    borderRadius: 2,
                    '&:hover': { borderColor: '#990000', bgcolor: '#fef2f2', color: '#990000' },
                  }}
                >
                  Download File
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={() => setDeleteTarget(r)}
                  sx={{ minWidth: 'auto', p: 0.8 }}
                >
                  <Delete fontSize="small" />
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Generate Report Form Modal (Figure 4.1.1) */}
      <Dialog
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#990000', pb: 1 }}>
          Summary Reports
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Start Date:"
              type="date"
              fullWidth
              size="small"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="End Date:"
              type="date"
              fullWidth
              size="small"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Report Type:</InputLabel>
              <Select
                value={form.report_type}
                label="Report Type:"
                onChange={(e) => setForm({ ...form, report_type: e.target.value })}
              >
                {reportTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>File Type:</InputLabel>
              <Select
                value={form.file_type}
                label="File Type:"
                onChange={(e) => setForm({ ...form, file_type: e.target.value })}
              >
                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
                <MenuItem value="csv">CSV Spreadsheet (.csv)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGenerateModalOpen(false)} sx={{ fontWeight: 700, color: '#71717a' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProceedToConfirm}
            sx={{
              bgcolor: '#1d4ed8',
              '&:hover': { bgcolor: '#1e40af' },
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Report Confirmation Dialog (Figure 4.1.2) */}
      <ConfirmationDialog
        open={confirmGenerateOpen}
        title="Report Compilation"
        message="Are you sure you want to Generate this Report?"
        onConfirm={handleGenerateReport}
        onCancel={() => setConfirmGenerateOpen(false)}
        confirmText="YES"
        cancelText="NO"
        loading={generating}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Deletion"
        message={`Delete the report "${deleteTarget?.title}"?`}
        onConfirm={() => handleDeleteReport(deleteTarget?.report_id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="YES"
        cancelText="NO"
        severity="danger"
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}