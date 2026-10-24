import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  TextField, Paper, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Divider, CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon, Delete as DeleteIcon, Refresh as RefreshIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import api from '../api/client';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [snack, setSnack] = useState('');
  const [form, setForm] = useState({ title: '', report_type: 'announcement', start_date: '', end_date: '', file_format: 'pdf' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/reports'); setReports(data); }
    catch { setReports([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const generate = async () => {
    setGenerating(true);
    try {
      const typeLabels = { announcement: 'Announcements', feedback: 'Feedback', activity: 'Activity Logs', detection: 'Detection Logs' };
      const reportTitle = form.title.trim() || `${typeLabels[form.report_type] || form.report_type} Report`;
      await api.post('/reports/generate', {
        title: reportTitle,
        report_type: form.report_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        file_format: form.file_format,
      });
      setSnack('Report generated successfully');
      setForm({ ...form, title: '' });
      fetch();
    } catch (err) {
      const d = err.response?.data?.detail;
      setSnack(d || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      setSnack('Report deleted');
      fetch();
    } catch (err) {
      setSnack(err.response?.data?.detail || 'Failed to delete report');
    }
  };

  const reportTypes = [
    { value: 'announcement', label: 'Announcements' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'activity', label: 'Activity Logs' },
    { value: 'detection', label: 'Detection Logs' },
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
  ];

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
  };

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' } }}>
          Official Barangay Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4, fontSize: { xs: '0.84rem', sm: '0.92rem' } }}>
          Generate, export, and download comprehensive records for executive audits and community compliance.
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3.5, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)' }}>
        <Typography variant="h6" sx={{ fontWeight: 750, color: '#0f172a', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.05rem' }}>
          <PdfIcon sx={{ color: '#b93636' }} /> Generate Custom Report
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            size="small"
            label="Report Title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. September 2026 Announcements"
            sx={{ flex: { xs: '1 1 100%', sm: '1 1 240px' } }}
          />
          <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '1 1 160px' } }}>
            <InputLabel>Report Type</InputLabel>
            <Select value={form.report_type} label="Report Type" onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
              {reportTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: { xs: '1 1 48%', sm: '0 1 110px' } }}>
            <InputLabel>Format</InputLabel>
            <Select value={form.file_format} label="Format" onChange={(e) => setForm({ ...form, file_format: e.target.value })}>
              {formatOptions.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="date"
            label="Start Date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: { xs: '1 1 48%', sm: '0 1 150px' } }}
          />
          <TextField
            size="small"
            type="date"
            label="End Date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: { xs: '1 1 48%', sm: '0 1 150px' } }}
          />
          <Button
            variant="contained"
            onClick={generate}
            disabled={generating}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              bgcolor: '#587d46',
              '&:hover': { bgcolor: '#446435' },
              fontWeight: 750,
              borderRadius: 2,
              py: 1,
              px: 2.5
            }}
          >
            {generating ? <CircularProgress size={20} sx={{ mr: 1, color: '#ffffff' }} /> : null}
            Generate {form.file_format === 'docx' ? 'DOCX' : 'PDF'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 750, color: '#0f172a', fontSize: '1.05rem' }}>Generated Reports Archive</Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={fetch} disabled={loading} sx={{ fontWeight: 650 }}>Refresh</Button>
        </Box>
        {loading ? <CircularProgress /> : reports.length === 0 ? (
          <Typography color="text.secondary">No reports generated yet.</Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.report_id}>
                    <TableCell sx={{ fontWeight: 500 }}>{r.title}</TableCell>
                    <TableCell><Chip label={r.report_type} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip
                        label={r.file_format?.toUpperCase() || 'PDF'}
                        size="small"
                        color={r.file_format === 'docx' ? 'primary' : 'error'}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>{formatDate(r.start_date)} — {formatDate(r.end_date)}</TableCell>
                    <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" href={r.download_url || '#'} download title="Download">
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteReport(r.report_id)} title="Delete">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}
