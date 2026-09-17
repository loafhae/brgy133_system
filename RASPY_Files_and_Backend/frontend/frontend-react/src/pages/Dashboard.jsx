import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { People, Person, Feedback } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_users: 0, total_residents: 0, total_feedback: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const cards = [
    { title: 'Total Users', count: stats.total_users, icon: <People sx={{ color: '#1976d2', fontSize: 48 }} />, bg: '#e3f2fd', path: '/users' },
    { title: 'Residents', count: stats.total_residents, icon: <Person sx={{ color: '#2e7d32', fontSize: 48 }} />, bg: '#e8f5e9', path: '/residents' },
    { title: 'Feedback', count: stats.total_feedback, icon: <Feedback sx={{ color: '#ed6c02', fontSize: 48 }} />, bg: '#fff3e0', path: '/feedback' },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 2 }}>
      {/* Header section with plenty of breathing room */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, Super Admin. Here is a summary of your community records and system statistics.
        </Typography>
      </Box>

      {/* Spacious Stat Cards Grid */}
      <Grid container spacing={4}>
        {cards.map((c, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card 
              onClick={() => navigate(c.path)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 3, 
                bgcolor: c.bg, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                borderRadius: 3,
                cursor: 'pointer', 
                transition: 'all 0.2s ease-in-out', 
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } 
              }}
            >
              <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'white', mr: 3, display: 'flex', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {c.icon}
              </Box>
              <CardContent sx={{ p: '0 !important', flexGrow: 1 }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {c.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#263238' }}>
                  {loading ? '...' : c.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}