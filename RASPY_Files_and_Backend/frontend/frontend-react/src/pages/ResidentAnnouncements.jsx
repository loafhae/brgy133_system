import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Campaign,
  AccessTime,
  EventNote,
  CheckCircle,
  FileDownload,
  ArrowBack,
} from '@mui/icons-material';
import api from '../api/client';

/**
 * ResidentAnnouncements - Adheres directly to:
 * - Figure 4.1.6: Mobile Announcements Interface
 * - Figure 4.1.7: Mobile Announcements List Interface
 * - Figure 4.1.8: Mobile Announcement Details Interface
 */
export default function ResidentAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements?published_only=true');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.content?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== 'ALL') {
      const titleLower = (item.title || '').toLowerCase();
      if (categoryFilter === 'AYUDA' && !titleLower.includes('ayuda') && !titleLower.includes('senior')) return false;
      if (categoryFilter === 'UTILITIES' && !titleLower.includes('water') && !titleLower.includes('power') && !titleLower.includes('outage')) return false;
      if (categoryFilter === 'ENVIRONMENT' && !titleLower.includes('garbage') && !titleLower.includes('clean') && !titleLower.includes('waste')) return false;
    }

    return true;
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Campaign sx={{ color: '#990000', fontSize: 30 }} /> Barangay Announcements
        </Typography>
        <Typography variant="body2" sx={{ color: '#71717a' }}>
          Official updates, emergency advisories, and community programs from Barangay 133, Tondo, Manila.
        </Typography>
      </Box>

      {/* Search & Filter Bar (Figures 4.1.6 & 4.1.7) */}
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
          placeholder="Search announcements (e.g., Ayuda, Power, Water)..."
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 180 } }}
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
          <MenuItem value="ALL">All Categories</MenuItem>
          <MenuItem value="AYUDA">Ayuda & Assistance</MenuItem>
          <MenuItem value="UTILITIES">Utility Advisories</MenuItem>
          <MenuItem value="ENVIRONMENT">Sanitation & Garbage</MenuItem>
        </TextField>
      </Paper>

      {/* Stacked Card Feed (Figure 4.1.7) */}
      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Loading announcements...
        </Typography>
      ) : filteredItems.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #d4d4d8' }}>
          <Typography variant="h6" sx={{ color: '#52525b', fontWeight: 600 }}>
            No announcements match your search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Check back later for newly published notices or reset your search filters.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {filteredItems.map((item) => (
            <Card
              key={item.announcement_id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #e4e4e7',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: '#990000',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip
                      label="Published"
                      size="small"
                      sx={{ bgcolor: '#fef2f2', color: '#990000', fontWeight: 800, fontSize: '0.7rem' }}
                    />
                    <Typography variant="caption" sx={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 13 }} />
                      {item.date_posted ? new Date(item.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#18181b', lineHeight: 1.3 }}>
                    {item.title}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedAnnouncement(item)}
                  sx={{
                    bgcolor: '#990000',
                    fontWeight: 700,
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 2.5,
                    '&:hover': { bgcolor: '#730000' },
                  }}
                >
                  Read More
                </Button>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.content}
              </Typography>
            </Card>
          ))}
        </Stack>
      )}

      {/* Detailed Announcement View Modal (Adheres strictly to Figure 4.1.8 in documentation.pdf) */}
      <Dialog
        open={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              startIcon={<ArrowBack />}
              size="small"
              onClick={() => setSelectedAnnouncement(null)}
              sx={{ color: '#52525b', fontWeight: 700 }}
            >
              Back
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#990000' }}>
              Announcement Details
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, pb: 3 }}>
          {selectedAnnouncement && (
            <Box>
              {/* Header Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#18181b', mb: 1, lineHeight: 1.3 }}>
                  {selectedAnnouncement.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#71717a' }}>
                  Posted on {selectedAnnouncement.date_posted ? new Date(selectedAnnouncement.date_posted).toLocaleString() : ''} • Official Announcement
                </Typography>
              </Box>

              {/* Section 1: Announcement Summary (Figure 4.1.8) */}
              <Paper sx={{ p: 2.5, mb: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#990000', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  1. Announcement Summary
                </Typography>
                <Typography variant="body1" sx={{ color: '#3f3f46', lineHeight: 1.7 }}>
                  {selectedAnnouncement.content}
                </Typography>
              </Paper>

              {/* Section 2: Schedule & Distribution Details (Figure 4.1.8) */}
              <Paper sx={{ p: 2.5, mb: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#990000', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  2. Schedule and Distribution Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#52525b', lineHeight: 1.6 }}>
                  • <strong>Coverage Area:</strong> Barangay 133, Zone 11, District II, Tondo, Manila
                  <br />
                  • <strong>Operating Time:</strong> 8:00 AM – 5:00 PM (Monday through Friday)
                  <br />
                  • <strong>Venue / Point:</strong> Barangay 133 Hall / Multi-Purpose Covered Court
                </Typography>
              </Paper>

              {/* Section 3: Requirements and Important Reminders (Figure 4.1.8) */}
              <Paper sx={{ p: 2.5, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #e4e4e7' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#990000', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  3. Requirements and Important Reminders
                </Typography>
                <Typography variant="body2" sx={{ color: '#52525b', lineHeight: 1.6 }}>
                  1. <strong>Barangay ID:</strong> Kinakailangang dalhin ang original at photocopy ng inyong Senior Citizen ID o Resident ID na inisyu ng Barangay.
                  <br />
                  2. <strong>Valid Government ID:</strong> Magdala rin ng isa pang valid ID (COMELEC Voter’s, PhilSys National ID, Driver’s License) para sa pag-verify.
                  <br />
                  3. <strong>Representative / Authorization:</strong> Kung may authorization, dalhin ang authorization letter na may pirma at photocopy ng ID ng resident at kinatawan.
                </Typography>
              </Paper>

              {/* File Attachment download if present */}
              {selectedAnnouncement.attachment_path && (
                <Box sx={{ mt: 2.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    href={`/uploads/${selectedAnnouncement.attachment_path}`}
                    target="_blank"
                    sx={{ borderRadius: 2, fontWeight: 700, color: '#990000', borderColor: '#990000' }}
                  >
                    Download Official Document Attachment
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setSelectedAnnouncement(null)}
            sx={{ bgcolor: '#990000', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#730000' } }}
          >
            Done Reading
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
