import { Box, Container, Typography, Paper, Stack, Breadcrumbs, Divider, Chip, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowBack, Gavel, WarningAmber, CheckCircle, Print, Balance } from '@mui/icons-material';

export default function TermsAndConditions() {
  const navigate = useNavigate();

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
            Print Terms
          </Button>
        </Stack>

        <Breadcrumbs sx={{ mb: 2, fontSize: '0.84rem' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Barangay 133</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Terms and Conditions</Typography>
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
                icon={<Balance sx={{ fontSize: '14px !important', color: '#1e3a8a' }} />}
                label="OFFICIAL GOVERNMENT TERMS OF SERVICE"
                size="small"
                sx={{ bgcolor: '#dbeafe', color: '#1e3a8a', fontWeight: 800, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Effective Date: October 2026
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.8rem', sm: '2.4rem' }, mb: 1 }}>
              Terms and Conditions
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 500 }}>
              Rules and Regulations Governing Access and Use of the Barangay 133 Civic Portal and Vision-Trak Services
            </Typography>
          </Box>

          {/* Callout Notice */}
          <Box
            sx={{
              p: 2.5,
              mb: 4,
              borderRadius: 2.5,
              bgcolor: 'rgba(30, 58, 138, 0.06)',
              border: '1px solid rgba(30, 58, 138, 0.2)',
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start'
            }}
          >
            <Gavel sx={{ color: '#1e3a8a', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
                Binding Civic Agreement
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                By accessing or using this website, web application, or the official Vision-Trak mobile platform of <strong>Barangay 133</strong>, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please refrain from using this portal.
              </Typography>
            </Box>
          </Box>

          <Stack spacing={4}>

            {/* Section 1 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                1. Official Authority & Eligibility
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                This platform is an official electronic gateway provided by the local government of Barangay 133 pursuant to Republic Act No. 7160 (The Local Government Code of 1991) and Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018).
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                Resident accounts are available to verified residents of Barangay 133. Official administrative accounts are strictly restricted to duly elected and appointed barangay personnel. All users warrant that all personal data submitted is accurate, complete, and up to date.
              </Typography>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                2. User Conduct & Acceptable Use Policy
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Users agree to use this platform in good faith and solely for lawful civic purposes. The following actions are strictly prohibited:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li>Submitting fraudulent, false, malicious, or defamatory reports or feedback against neighbors or barangay personnel.</li>
                <li>Attempting to gain unauthorized access to official admin accounts, database servers, or IoT camera feeds.</li>
                <li>Conducting automated scraping, Denial of Service (DoS) attacks, vulnerability scans, or injecting malicious payloads.</li>
                <li>Using offensive, profane, or abusive language in public community feedback channels.</li>
                <li>Misrepresenting oneself as a barangay official, tanod, or authorized representative.</li>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontStyle: 'italic' }}>
                Violations of this section may result in immediate suspension of account privileges and referral to the Philippine National Police Anti-Cybercrime Group (PNP-ACG) under Republic Act No. 10175 (Cybercrime Prevention Act of 2012).
              </Typography>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                3. Vision-Trak AI & IoT Waste Monitoring Disclaimer
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#fffbeb', borderColor: '#fde68a', mb: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <WarningAmber sx={{ color: '#b45309', mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#78350f', mb: 0.5 }}>
                      Important Technical Advisory
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#92400e', lineHeight: 1.6 }}>
                      Vision-Trak uses optical sensors and artificial intelligence (YOLOv8 deep learning) to identify municipal garbage trucks and notify residents of collection activities. Automated detections are <strong>advisory tools</strong> provided to assist the community. While continuously calibrated, vehicle detection may be affected by extreme weather, camera lens occlusion, or vehicle modifications. Automated detection logs do not substitute for official city department dispatch manifests.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                4. Intellectual Property & Government Works
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Pursuant to <strong>Section 176 of Republic Act No. 8293 (Intellectual Property Code of the Philippines)</strong>, no copyright shall subsist in any work of the Government of the Philippines.
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                However, the official seal, logo, insignia, and formal name of Barangay 133 are protected under <strong>Republic Act No. 8491 (Flag and Heraldic Code of the Philippines)</strong> and municipal ordinances. The seal and trademarks may not be copied, modified, or used for commercial, advertising, or partisan political purposes without express written consent from the Sangguniang Barangay.
              </Typography>
            </Box>

            <Divider />

            {/* Section 5 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                5. Emergency Situations Notice
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                This web platform and its feedback channels are not monitored for instantaneous life-or-death dispatch. <strong>In the event of an active medical emergency, ongoing violent crime, fire, or acute disaster, immediately dial 911</strong> or contact:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Philippine National Emergency Hotline:</strong> 911</li>
                <li><strong>Manila Police District (MPD) Station 2:</strong> (02) 8245-2244</li>
                <li><strong>Bureau of Fire Protection (Manila):</strong> (02) 8527-3627</li>
                <li><strong>Barangay Tanod Desk:</strong> On-duty personnel stationed at the Barangay Hall.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 6 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                6. Limitation of Liability & Force Majeure
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Barangay 133 makes every reasonable effort to ensure high availability, data accuracy, and continuous service. However, the system is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                To the fullest extent permitted by Philippine law, the Barangay shall not be held liable for any damages, delays, or losses resulting from:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li>Acts of God, typhoons, severe flooding, earthquakes, or municipal grid power interruptions.</li>
                <li>Telecommunications outages or internet downtime outside the direct control of the Barangay Hall server.</li>
                <li>Unauthorized access to individual accounts caused by a user sharing or failing to secure their personal password.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 7 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                7. Dispute Resolution & Governing Law
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines.
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                Any dispute, controversy, or claim arising out of or in connection with the use of this portal shall first undergo mediation and amicable settlement in accordance with the <em>Katarungang Pambarangay</em> procedures (Sections 399-422, RA 7160). If judicial recourse is necessary, the exclusive venue shall be the appropriate trial courts of the <strong>City of Manila</strong>.
              </Typography>
            </Box>

          </Stack>

          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Pamahalaang Barangay 133 • Lungsod ng Maynila • Republika ng Pilipinas
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Official Civic Digital Services Portal Terms of Use
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
