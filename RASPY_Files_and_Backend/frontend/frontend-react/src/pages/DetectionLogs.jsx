import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Stack,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  CircularProgress, Card, Divider,
} from '@mui/material';
import {
  Videocam, Refresh, LocalShipping, CheckCircle,
  OpenInNew, PhotoCamera, Close, Visibility,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function DetectionLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch detection logs & live camera status
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statusRes] = await Promise.allSettled([
        api.get('/detection/logs'),
        api.get('/detection/status'),
      ]);
      if (logsRes.status === 'fulfilled') setItems(logsRes.value.data || []);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const reloadStream = () => {
    setStreamError(false);
    setStreamKey(Date.now());
  };

  // Robust snapshot URL resolver that handles all path formats safely
  const getSnapshotUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const filename = path.replace(/^.*[\\\/]/, '');
    return `/snapshots/${filename}`;
  };

  const highConfCount = items.filter((r) => (r.confidence_score || 0) >= 0.70).length;

  const columns = [
    { field: 'log_id', headerName: 'ID', width: 70 },
    {
      field: 'camera_name',
      headerName: 'Camera / Checkpoint',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Videocam sx={{ fontSize: 18, color: '#059669' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value || `Camera #${params.row.camera_id || 1}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'confidence_score',
      headerName: 'Confidence',
      width: 140,
      renderCell: (params) => {
        const val = (params.value || 0) * 100;
        const isHigh = val >= 70;
        return (
          <Chip
            size="small"
            label={`${val.toFixed(1)}%`}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: isHigh ? '#ecfdf5' : '#f4f4f5',
              color: isHigh ? '#059669' : '#52525b',
              border: `1px solid ${isHigh ? '#a7f3d0' : '#e4e4e7'}`,
            }}
          />
        );
      },
    },
    {
      field: 'notification_status',
      headerName: 'Alert Status',
      width: 160,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
          label={params.value === 'sent' ? 'BROADCAST SENT' : (params.value || 'LOGGED')}
          color="success"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24 }}
        />
      ),
    },
    {
      field: 'image_path',
      headerName: 'Snapshot',
      width: 130,
      renderCell: (params) => {
        const path = params.value;
        if (!path) return <Typography variant="caption" color="text.secondary">—</Typography>;
        return (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PhotoCamera sx={{ fontSize: 13 }} />}
            onClick={() => setSelectedImage(path)}
            sx={{
              textTransform: 'none',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderColor: '#fecaca',
              color: '#990000',
              py: 0.2,
              px: 1,
              '&:hover': { bgcolor: '#fef2f2', borderColor: '#990000' },
            }}
          >
            Inspect
          </Button>
        );
      },
    },
    {
      field: 'timestamp',
      headerName: 'Detection Timestamp',
      flex: 1,
      valueFormatter: (v) => (v ? new Date(v).toLocaleString() : '—'),
    },
  ];

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', py: 1 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#71717a', fontWeight: 700, letterSpacing: 0.8, display: 'block' }}>
            VISION-TRAK IOT SURVEILLANCE • BARANGAY 133
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#990000', mb: 0.5, letterSpacing: -0.5 }}>
            CCTV Detections &amp; Live Monitor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time edge AI surveillance monitoring garbage truck arrivals across collection checkpoints (FR6 &amp; FR7).
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Refresh Logs & Status">
            <span>
              <IconButton
                onClick={fetchLogs}
                disabled={loading}
                sx={{ bgcolor: '#ffffff', border: '1px solid #e4e4e7', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#990000' }} /> : <Refresh sx={{ color: '#990000' }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* KPI Stats Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e4e4e7', borderLeft: '4px solid #059669', bgcolor: '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              TOTAL DETECTION LOGS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#18181b' }}>
              {items.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e4e4e7', borderLeft: '4px solid #990000', bgcolor: '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              VERIFIED TRUCK DETECTIONS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#990000' }}>
              {highConfCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e4e4e7', borderLeft: '4px solid #0284c7', bgcolor: '#ffffff' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              SYSTEM STATUS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: status?.status === 'active' ? '#990000' : '#059669', mt: 0.5 }}>
              {status?.status === 'active' ? 'TRUCK ACTIVE' : 'SCANNING IDLE'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Live CCTV Video Player Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid #e4e4e7',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Videocam sx={{ color: '#990000', fontSize: 26 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', lineHeight: 1.2 }}>
                Live Loading Bay CCTV Stream
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Direct MJPEG feed with active polygonal ROI detection &amp; garbage truck tracking
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={reloadStream}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#e4e4e7', color: '#18181b' }}
            >
              Reconnect Stream
            </Button>
            <Button
              size="small"
              variant="contained"
              endIcon={<OpenInNew />}
              href="http://localhost:8080/"
              target="_blank"
              rel="noreferrer"
              sx={{ bgcolor: '#990000', color: '#ffffff', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#730000' } }}
            >
              Open Standalone Monitor
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Video Player Container */}
        <Box
          sx={{
            width: '100%',
            height: { xs: 260, sm: 380, md: 500 },
            bgcolor: '#0d1117',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #30363d',
          }}
        >
          {!streamError ? (
            <Box
              component="img"
              src={`/stream?t=${streamKey}`}
              alt="Live CCTV Loading Bay Feed"
              onError={(e) => {
                // If proxy fails, try connecting directly to local stream port
                if (!e.target.dataset.retried) {
                  e.target.dataset.retried = 'true';
                  e.target.src = `http://localhost:8080/stream?t=${Date.now()}`;
                } else {
                  setStreamError(true);
                }
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', p: 4, color: '#8b949e' }}>
              <Videocam sx={{ fontSize: 48, color: '#f85149', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e6edf3', mb: 0.5 }}>
                Camera Stream Offline or Initializing
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 460, mx: 'auto', mb: 2, fontSize: '0.85rem' }}>
                Ensure `detector.py` is running on your system (Port 8080) to broadcast the live feed.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={reloadStream}
                sx={{ borderColor: '#3fb950', color: '#3fb950', textTransform: 'none', fontWeight: 700 }}
              >
                Retry Stream Connection
              </Button>
            </Box>
          )}

          {/* Overlay Status Badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(13, 17, 23, 0.85)',
              border: '1px solid #30363d',
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: streamError ? '#f85149' : '#3fb950' }} />
            <Typography variant="caption" sx={{ color: '#e6edf3', fontWeight: 700, letterSpacing: 0.5 }}>
              {streamError ? 'STREAM OFFLINE' : 'LIVE AI CCTV FEED'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Detection Audit Table */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e4e4e7', bgcolor: '#ffffff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b' }}>
            Historical Detection Event Logs
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} records recorded
          </Typography>
        </Box>
        <DataGrid
          rows={items}
          columns={columns}
          getRowId={(r) => r.log_id}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { borderColor: '#f4f4f5' },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#fafafa', borderColor: '#e4e4e7', fontWeight: 700 },
          }}
        />
      </Paper>

      {/* Snapshot Preview Modal Dialog */}
      <Dialog open={Boolean(selectedImage)} onClose={() => setSelectedImage(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera sx={{ color: '#990000', fontSize: 22 }} />
            <span>Detection Snapshot Verification</span>
          </Box>
          <IconButton onClick={() => setSelectedImage(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 3, bgcolor: '#fafafa' }}>
          {selectedImage && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={getSnapshotUrl(selectedImage)}
                alt="Detection Snapshot"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  borderRadius: 2,
                  bgcolor: '#000',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  // If standard /snapshots/ fails, try fallback direct 8080 snapshot
                  if (!e.target.dataset.retried) {
                    e.target.dataset.retried = 'true';
                    const filename = selectedImage.replace(/^.*[\\\/]/, '');
                    e.target.src = `http://localhost:8080/snapshots/${filename}`;
                  } else {
                    e.target.style.display = 'none';
                    const fallbackEl = document.getElementById('snapshot-fallback');
                    if (fallbackEl) fallbackEl.style.display = 'block';
                  }
                }}
              />
              <Box id="snapshot-fallback" sx={{ display: 'none', py: 4, color: '#71717a' }}>
                <PhotoCamera sx={{ fontSize: 48, color: '#d4d4d8', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Snapshot file not found on disk.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({selectedImage})
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  File: {selectedImage}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<OpenInNew />}
                  href={getSnapshotUrl(selectedImage)}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Open Full Resolution
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}