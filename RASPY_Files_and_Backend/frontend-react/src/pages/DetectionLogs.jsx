import { useEffect, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../api/client';

export default function DetectionLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/detection/logs'); setItems(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { field: 'log_id', headerName: 'ID', width: 70 },
    { field: 'camera_name', headerName: 'Camera', width: 150 },
    { field: 'camera_id', headerName: 'Camera ID', width: 100 },
    { field: 'confidence_score', headerName: 'Confidence', width: 120, valueFormatter: (v) => `${(v * 100).toFixed(1)}%` },
    { field: 'notification_status', headerName: 'Notification', width: 130 },
    { field: 'timestamp', headerName: 'Timestamp', flex: 1, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    {
      field: 'image', headerName: 'Image', width: 100,
      renderCell: ({ row }) => (
        <a href={`/snapshots/${row.image_path}`} target="_blank" rel="noreferrer">View</a>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Detection Logs</Typography>
      <DataGrid rows={items} columns={columns} getRowId={(r) => r.log_id} loading={loading} autoHeight pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
    </Box>
  );
}
