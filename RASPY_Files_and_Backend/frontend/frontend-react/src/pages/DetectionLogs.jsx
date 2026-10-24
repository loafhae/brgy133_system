import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Card, Grid, Stack, Chip, Button, LinearProgress, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Videocam, Refresh, LocalShipping, CheckCircle, Warning, Sensors } from '@mui/icons-material';
import api from '../api/client';

export default function DetectionLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/detection/logs');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetch();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  // Compute summary metrics
  const stats = useMemo(() => {
    const totalEvents = items.length;
    const trucksDetected = items.filter((i) => i.event_type === 'truck_present').length;
    const uniqueCameras = new Set(items.map((i) => i.camera_id || i.camera_name)).size;
    return { totalEvents, trucksDetected, uniqueCameras };
  }, [items]);

  const columns = [
    {
      field: 'log_id',
      headerName: 'Log ID',
      width: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'camera_name',
      headerName: 'Camera Source',
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Videocam sx={{ fontSize: 18, color: '#587d46' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
            {params.value || 'CCTV Channel'}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'camera_id',
      headerName: 'Channel',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={`CH-${params.value ?? '0'}`}
          size="small"
          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
        />
      ),
    },
    {
      field: 'event_type',
      headerName: 'AI Classification',
      width: 180,
      renderCell: (params) => {
        const val = params.value;
        const isPresent = val === 'truck_present';
        const isDeparted = val === 'truck_departed';

        return (
          <Chip
            icon={
              isPresent ? (
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e', ml: 0.8 }} className="pulse-badge" />
              ) : undefined
            }
            label={isPresent ? 'TRUCK DETECTED' : isDeparted ? 'TRUCK DEPARTED' : (val || 'UNKNOWN')}
            size="small"
            sx={{
              bgcolor: isPresent ? 'rgba(34, 197, 94, 0.12)' : (isDeparted ? 'rgba(245, 158, 11, 0.12)' : '#f1f5f9'),
              color: isPresent ? '#15803d' : (isDeparted ? '#b45309' : '#475569'),
              border: `1px solid ${isPresent ? 'rgba(34, 197, 94, 0.25)' : (isDeparted ? 'rgba(245, 158, 11, 0.25)' : '#e2e8f0')}`,
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.03em',
            }}
          />
        );
      },
    },
    {
      field: 'confidence_score',
      headerName: 'AI Confidence',
      width: 170,
      renderCell: (params) => {
        const score = typeof params.value === 'number' ? params.value : 0;
        const pct = Math.round(score * 100);
        return (
          <Box sx={{ width: '100%', pr: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.76rem' }}>
                {pct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: pct >= 80 ? '#22c55e' : (pct >= 50 ? '#f59e0b' : '#ef4444'),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'notification_status',
      headerName: 'Dispatch Status',
      width: 160,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Not Dispatched'}
          size="small"
          sx={{
            bgcolor: params.value === 'sent' || params.value === 'delivered' ? 'rgba(59, 130, 246, 0.12)' : '#f8fafc',
            color: params.value === 'sent' || params.value === 'delivered' ? '#1d4ed8' : '#64748b',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #e2e8f0',
          }}
        />
      ),
    },
    {
      field: 'timestamp',
      headerName: 'Event Timestamp',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.84rem' }}>
          {params.value ? new Date(params.value).toLocaleString() : 'N/A'}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ py: 1 }} className="animate-fade-in">
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mb: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Vision AI Detection Logs
            </Typography>
            <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} className="pulse-badge" />
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, fontSize: '0.74rem' }}>
                AUTO-POLLING (5s)
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.92rem' }}>
            Real-time optical detections, YOLOv8 inference classifications, and community truck alert triggers.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetch}
          disabled={loading}
          sx={{
            borderColor: '#e2e8f0',
            color: '#475569',
            borderRadius: 2.2,
            px: 2.5,
            fontWeight: 650,
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </Button>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(88, 125, 70, 0.12)', color: '#587d46' }}>
                <Sensors />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 650 }}>
                  Total Recorded Events
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {stats.totalEvents}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                <LocalShipping />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 650 }}>
                  Truck Arrival Detections
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {stats.trucksDetected}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <Videocam />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 650 }}>
                  Monitored Camera Feeds
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {stats.uniqueCameras}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Styled DataGrid Table Container */}
      <Paper sx={{
        bgcolor: '#ffffff',
        borderRadius: 3.5,
        border: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        p: { xs: 1, sm: 1.5 },
      }}>
        <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Box sx={{ minWidth: 700 }}>
            <DataGrid
              rows={items}
              columns={columns}
              getRowId={(r) => r.log_id}
              loading={loading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}