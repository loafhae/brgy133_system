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
  const [form, setForm] = useState({ report_type: 'announcement', start_date: '', end_date: '' });

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
      await api.post('/reports/generate', {
        title: `${typeLabels[form.report_type] || form.report_type} Report`,
        report_type: form.report_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        file_format: 'pdf',
      });
      setSnack('Report generated successfully');
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

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Reports</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon /> Generate Report
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Report Type</InputLabel>
            <Select value={form.report_type} label="Report Type" onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
              {reportTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="Start Date" value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="End Date" value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }} />
          <Button variant="contained" onClick={generate} disabled={generating}>
            {generating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Generate PDF
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Generated Reports</Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={fetch} disabled={loading}>Refresh</Button>
        </Box>
        {loading ? <CircularProgress /> : reports.length === 0 ? (
          <Typography color="text.secondary">No reports generated yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
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
