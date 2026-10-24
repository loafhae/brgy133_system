import { Box, Container, Typography, Paper, Stack, Breadcrumbs, Divider, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowBack, Cookie, SettingsOutlined, Print, CheckCircle, InfoOutlined } from '@mui/icons-material';

export default function CookiePolicy() {
  const navigate = useNavigate();

  const handleOpenPreferences = () => {
    window.dispatchEvent(new Event('open_cookie_preferences'));
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="md">
        {/* Navigation & Header */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="text"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ color: '#587d46', fontWeight: 700, textTransform: 'none' }}
          >
            Bumalik sa Home
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{
              borderColor: '#cbd5e1',
              color: '#475569',
              textTransform: 'none',
              fontWeight: 650,
              display: { xs: 'none', sm: 'inline-flex' }
            }}
          >
            Print Policy
          </Button>
        </Stack>

        <Breadcrumbs sx={{ mb: 2, fontSize: '0.84rem' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Barangay 133</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Cookie Policy</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5, md: 6 },
            borderRadius: 3.5,
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid #f1f5f9' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <Chip
                icon={<Cookie sx={{ fontSize: '14px !important', color: '#854d0e' }} />}
                label="TRANSPARENCY IN LOCAL STORAGE & COOKIES"
                size="small"
                sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Effective Date: October 2026
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.8rem', sm: '2.4rem' }, mb: 1 }}>
              Barangay 133 Cookie Policy
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 500 }}>
              How we use browser storage, session cookies, and privacy-first telemetry
            </Typography>
          </Box>

          {/* Interactive Control Banner */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mb: 4,
              borderRadius: 2.5,
              bgcolor: '#f8fafc',
              borderColor: '#cbd5e1',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Your Current Cookie Preferences
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.84rem' }}>
                You can review, change, or withdraw your cookie consent at any moment.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenPreferences}
              startIcon={<SettingsOutlined />}
              sx={{
                bgcolor: '#587d46',
                color: '#ffffff',
                fontWeight: 700,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#476837' }
              }}
            >
              Manage Preferences
            </Button>
          </Paper>

          <Stack spacing={4}>

            {/* Section 1 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                1. What Are Cookies and Local Storage?
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                Cookies and browser local storage are small text or data files stored on your device (computer, tablet, or smartphone) when you browse websites. They are used to make websites function securely, recall your authenticated session, and provide diagnostic performance metrics to the site operators.
              </Typography>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                2. Categories of Storage Tokens We Use
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                We classify our storage tokens into two clear categories:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '25%' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '25%' }}>Token Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '30%' }}>Purpose</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', width: '20%' }}>Lifespan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#166534' }}>
                        Strictly Necessary (Essential)
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        token / user
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        Authenticates officials & residents during active portal sessions.
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        Session / Until logout
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#166534' }}>
                        Strictly Necessary (Essential)
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        cookie_consent_*
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        Stores your consent choice so we do not repeatedly prompt you.
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        12 Months
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#0369a1' }}>
                        Analytics (Optional)
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        brgy133_analytics_*
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        Counts aggregated anonymous page views. Disabled unless consented.
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.84rem' }}>
                        Browser Session only
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                3. Privacy-First Analytics Standards
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Unlike commercial sites, <strong>Barangay 133 does not use intrusive marketing cookies, Facebook Pixels, or cross-site commercial trackers</strong>.
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li>Our analytics are hosted internally or anonymized strictly for civic resource allocation.</li>
                <li>We automatically respect browser <strong>Global Privacy Control (GPC)</strong> and <strong>Do Not Track (DNT)</strong> signals.</li>
                <li>No advertising profile is ever constructed from your interaction with this civic gateway.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                4. Managing Cookies in Your Web Browser
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                In addition to our on-page settings button, you may configure or block cookies at the browser level at any time:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Third-party cookies.</li>
                <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies and Site Data.</li>
                <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
                <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies.</li>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                Note: Disabling strictly necessary cookies may prevent logging into official resident and staff dashboards.
              </Typography>
            </Box>

          </Stack>

          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Pamahalaang Barangay 133 • Lungsod ng Maynila • Republika ng Pilipinas
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Compliant with Republic Act No. 10173 & International Privacy By Design Principles
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
