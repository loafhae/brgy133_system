import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { People, Person, Feedback, CameraAlt } from '@mui/icons-material';
import api from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.user_count ?? 0, icon: <People />, color: '#1976d2' },
    { label: 'Residents', value: stats?.resident_count ?? 0, icon: <Person />, color: '#388e3c' },
    { label: 'Feedback', value: stats?.feedback_count ?? 0, icon: <Feedback />, color: '#f57c00' },
    { label: 'Detections', value: stats?.detection_count ?? 0, icon: <CameraAlt />, color: '#d32f2f' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Dashboard</Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: 'white', bgcolor: card.color, borderRadius: 2, p: 1.5, display: 'flex' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
