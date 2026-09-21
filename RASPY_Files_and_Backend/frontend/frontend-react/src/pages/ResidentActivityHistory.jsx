import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  TextField,
  InputAdornment,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  History,
  Login,
  Feedback,
  Notifications,
  Security,
  FilterList,
  Search,
  Schedule,
} from '@mui/icons-material';
import api from '../api/client';

/**
 * ResidentActivityHistory - Adheres directly to Figure 4.2.0 in documentation.pdf.
 *
 * Vertical timeline layout displaying personal user audit logs grouped by
 * temporal segments: "Today", "Yesterday", and earlier dates.
 * Covers logins, feedback submissions, and notifications received per FR16.
 */
export default function ResidentActivityHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // The activity endpoint returns user's personal audit logs
      const { data } = await api.get('/activity');
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Group logs into Today, Yesterday, and Earlier
  const getDayGroup = (dateStr) => {
    if (!dateStr) return 'Earlier';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) return 'Today';
    if (checkDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getEventIcon = (actionType, description = '') => {
    const act = (actionType || '').toLowerCase();
    const desc = (description || '').toLowerCase();

    if (act.includes('login') || desc.includes('login')) {
      return <Login sx={{ fontSize: 18, color: '#16a34a' }} />;
    }
    if (act.includes('feedback') || desc.includes('feedback')) {
      return <Feedback sx={{ fontSize: 18, color: '#0284c7' }} />;
    }
    if (act.includes('notification') || desc.includes('alert') || desc.includes('truck')) {
      return <Notifications sx={{ fontSize: 18, color: '#d97706' }} />;
    }
    return <Security sx={{ fontSize: 18, color: '#990000' }} />;
  };

  const filteredLogs = logs.filter((log) => {
    const act = (log.action_type || '').toLowerCase();
    const desc = (log.description || '').toLowerCase();

    if (search && !desc.includes(search.toLowerCase()) && !act.includes(search.toLowerCase())) {
      return false;
    }

    if (filterType === 'LOGIN' && !act.includes('login') && !desc.includes('login')) return false;
    if (filterType === 'FEEDBACK' && !act.includes('feedback') && !desc.includes('feedback')) return false;
    if (filterType === 'NOTIFICATION' && !act.includes('notification') && !desc.includes('alert')) return false;

    return true;
  });

  // Group items by temporal segments
  const grouped = filteredLogs.reduce((acc, log) => {
    const groupName = getDayGroup(log.timestamp);
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(log);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);

  return (
    <Box sx={{ pb: 4, maxWidth: 850, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <History sx={{ color: '#990000', fontSize: 30 }} /> My Activity History
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Chronological record of your system interactions, security logins, and community service alerts.
        </Typography>
      </Box>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2.5,
          border: '1px solid #e4e4e7',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search your activity logs..."
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

        <TextField
          select
          size="small"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 190 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FilterList sx={{ fontSize: 18, color: '#71717a' }} />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="ALL">All Activities</MenuItem>
          <MenuItem value="LOGIN">Logins & Security</MenuItem>
          <MenuItem value="FEEDBACK">Feedback Sent</MenuItem>
          <MenuItem value="NOTIFICATION">Alerts Received</MenuItem>
        </TextField>
      </Paper>

      {/* Timeline Structure (Figure 4.2.0) */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={36} sx={{ color: '#990000' }} />
        </Box>
      ) : groupKeys.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #d4d4d8' }}>
          <Typography variant="h6" sx={{ color: '#52525b', fontWeight: 600 }}>
            No activity logs found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your future logins, feedback submissions, and system alerts will automatically be recorded here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3.5}>
          {groupKeys.map((group) => (
            <Box key={group}>
              {/* Group Title Badge: Today / Yesterday / Date (Figure 4.2.0) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Chip
                  label={group}
                  sx={{
                    bgcolor: group === 'Today' ? '#fef2f2' : '#f4f4f5',
                    color: group === 'Today' ? '#990000' : '#27272a',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    letterSpacing: 0.5,
                    px: 1,
                  }}
                />
                <Divider sx={{ flexGrow: 1 }} />
              </Box>

              {/* Stacked entries under group */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: '1px solid #e4e4e7',
                  overflow: 'hidden',
                  bgcolor: '#ffffff',
                }}
              >
                {grouped[group].map((item, idx) => (
                  <Box
                    key={item.log_id || idx}
                    sx={{
                      p: 2.2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: idx === grouped[group].length - 1 ? 'none' : '1px solid #f4f4f5',
                      '&:hover': { bgcolor: '#fafafa' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {getEventIcon(item.action_type, item.description)}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#18181b' }}>
                          {item.description || item.action_type || 'Account Activity'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 13 }} />
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : 'Timestamp recorded'}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={item.action_type || 'Completed'}
                      size="small"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        bgcolor: '#f1f5f9',
                        color: '#475569',
                      }}
                    />
                  </Box>
                ))}
              </Paper>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
