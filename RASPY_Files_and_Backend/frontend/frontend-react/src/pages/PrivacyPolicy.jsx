import { Box, Container, Typography, Paper, Stack, Breadcrumbs, Divider, Chip, Button, Grid } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowBack, Security, Shield, Print, Email, Phone, LocationOn, Gavel } from '@mui/icons-material';

export default function PrivacyPolicy() {
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
            Print Policy
          </Button>
        </Stack>

        <Breadcrumbs sx={{ mb: 2, fontSize: '0.84rem' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Barangay 133</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Privacy Policy</Typography>
        </Breadcrumbs>

        {/* Main Document Paper */}
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
          {/* Document Title Header */}
          <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid #f1f5f9' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <Chip
                icon={<Shield sx={{ fontSize: '14px !important', color: '#166534' }} />}
                label="REPUBLIC ACT NO. 10173 COMPLIANT"
                size="small"
                sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Effectivity Date: October 2026
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', fontSize: { xs: '1.8rem', sm: '2.4rem' }, mb: 1 }}>
              Barangay 133 Data Privacy Policy
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 500 }}>
              Official Privacy Notice for the Residents, Transacting Public, and Users of the Vision-Trak Civic Portal
            </Typography>
          </Box>

          {/* Quick Notice Callout */}
          <Box
            sx={{
              p: 2.5,
              mb: 4,
              borderRadius: 2.5,
              bgcolor: 'rgba(88, 125, 70, 0.08)',
              border: '1px solid rgba(88, 125, 70, 0.25)',
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start'
            }}
          >
            <Security sx={{ color: '#587d46', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5 }}>
                Our Commitment to Resident Privacy
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                Ang Pamahalaang <strong>Barangay 133</strong> ay nakatuon sa pagtataguyod at pagprotekta sa mga karapatan ng bawat mamamayan alinsunod sa <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, mga Implementing Rules and Regulations (IRR) nito, at mga alituntunin ng National Privacy Commission (NPC). Ang lahat ng datos ay kinokolekta at pinoproseso para lamang sa lehitimong pamamahala, kapayapaan, at serbisyo publiko.
              </Typography>
            </Box>
          </Box>

          {/* Content Sections */}
          <Stack spacing={4}>

            {/* Section 1 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                1. Data Controller & Data Protection Officer (DPO)
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 2 }}>
                Ang Personal Information Controller (PIC) para sa sistemang ito ay ang <strong>Pamahalaang Barangay 133</strong>. Para sa mga katanungan, paglilinaw, o pagsasagawa ng inyong mga karapatan ukol sa data privacy, maaaring makipag-ugnayan sa sumusunod:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6, mb: 1.5 }}>
                  Ang designated Data Protection Officer (DPO) ay nakatalaga upang pangalagaan ang pagsunod ng barangay sa RA 10173. Maaaring magsadya o magpadala ng opisyal na mensahe:
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.8 }}>
                  <li>Personal na pagbisita sa <strong>Tanggapan ng Barangay Hall (Data Protection Desk)</strong> tuwing regular na araw at oras ng tanggapan.</li>
                  <li>Pagsusumite ng opisyal na concern sa pamamagitan ng Citizen Feedback channel sa portal na ito o sa resident mobile app.</li>
                  <li>Direktang pagdulog sa <strong>National Privacy Commission (NPC)</strong> sa <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', fontWeight: 700 }}>privacy.gov.ph</a>.</li>
                </Box>
              </Paper>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                2. Information We Collect
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                We collect information through authorized official channels, including the resident registration portal, physical desk inquiries, and automated municipal monitoring:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Resident Masterlist Details:</strong> Full name, date of birth, optional self-described gender, civil status, physical street address within Barangay 133, mobile number, and email address.</li>
                <li><strong>System Credentials:</strong> Hashed account passwords, username, and assigned role permissions (Resident, Barangay Official, Administrator). Plaintext passwords are never stored.</li>
                <li><strong>Citizen Feedback & Assistance Records:</strong> Incident reports, descriptions, submitted photographic attachments, and resolution history.</li>
                <li><strong>CCTV & IoT Video Streams (Vision-Trak):</strong> Live video frames captured from publicly positioned street cameras focused on designated municipal waste collection zones.</li>
                <li><strong>Technical Telemetry:</strong> Anonymized page requests, browser type, and timestamps collected strictly upon cookie consent to monitor server health.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                3. Lawful Basis and Purpose of Processing
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Pursuant to <strong>Sections 12 and 13 of RA 10173</strong> and the <strong>Local Government Code of 1991 (RA 7160)</strong>, data processing is carried out under the following legal bases:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Fulfillment of Official Mandate & Public Functions:</strong> Verification of residency, issuance of statutory barangay clearances and certifications, and community governance.</li>
                <li><strong>Public Health, Sanitation & Cleanliness:</strong> Utilizing the Vision-Trak AI system to automatically identify waste collection vehicles, verify garbage pickup schedules, and prevent illegal dumping.</li>
                <li><strong>Public Order & Safety:</strong> Facilitating prompt barangay tanod assistance, handling blotters, and responding to community grievances.</li>
                <li><strong>Explicit Consent:</strong> Provided by users when registering online or submitting optional digital feedback.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                4. CCTV & Vision-Trak Surveillance Operations
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                In strict compliance with <strong>NPC Advisory No. 2020-04 (Guidelines on the Use of CCTV Systems)</strong>:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li>Cameras are positioned exclusively facing public streets and designated waste disposal collection points within Barangay 133. No cameras point into private residences or areas where individuals have a reasonable expectation of privacy.</li>
                <li>Prominent physical signage is installed in street areas indicating that CCTV monitoring is in effect.</li>
                <li>Video feeds and AI detection logs are hosted on a secure local Barangay Hall server with role-based access restricted solely to authorized barangay personnel.</li>
                <li>CCTV video recordings are retained for a rolling period not exceeding 30 to 60 days, after which they are securely overwritten, unless required as evidence in an active official investigation or court subpoena.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 5 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                5. Data Sharing and Third-Party Disclosures
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                <strong>Barangay 133 does not sell, rent, monetize, or commercially disclose personal information to any private third parties.</strong>
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7 }}>
                Data is shared strictly with government agencies under lawful authority:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Law Enforcement Agencies (PNP, NBI):</strong> Upon presentation of an official court order, search warrant, or lawful subpoena.</li>
                <li><strong>City of Manila Department of Public Services (DPS):</strong> Anonymized timestamps of garbage truck sightings to coordinate city-wide waste collection efficiency.</li>
                <li><strong>National Disaster Risk Reduction Agencies:</strong> In times of public calamities or emergencies to protect vital interests.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 6 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                6. Security Safeguards & Technical Measures
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                We enforce comprehensive physical, organizational, and technical safeguards:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Cryptographic Protection:</strong> All external web traffic is encrypted end-to-end via TLS 1.3 through secure Cloudflare Tunnels.</li>
                <li><strong>Access Control:</strong> Granular role-based access control (RBAC). Only authenticated officials can review resident data and citizen feedback.</li>
                <li><strong>Credential Security:</strong> Resident and administrator passwords are encrypted using one-way bcrypt/argon2 hashing algorithms with salt.</li>
                <li><strong>Physical Security:</strong> Server hardware is housed in a locked, climate-controlled cabinet within the Barangay Hall with restricted physical access and continuous UPS battery backup.</li>
              </Box>
            </Box>

            <Divider />

            {/* Section 7 */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                7. Your Statutory Rights as a Data Subject
              </Typography>
              <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.7, mb: 1.5 }}>
                Under Section 16 of the Data Privacy Act of 2012, you are entitled to the following rights:
              </Typography>
              <Box component="ul" sx={{ pl: 3, color: '#334155', lineHeight: 1.8 }}>
                <li><strong>Right to be Informed:</strong> To know whether your personal data is being processed, why, and how.</li>
                <li><strong>Right to Access:</strong> To request a reasonable copy of personal records held by the barangay regarding your profile.</li>
                <li><strong>Right to Rectification:</strong> To dispute inaccuracies or errors in your resident record and have them corrected.</li>
                <li><strong>Right to Erasure or Blocking:</strong> To request the suspension, withdrawal, or removal of your personal information if it is incomplete, outdated, or no longer necessary, subject to statutory record-keeping mandates.</li>
                <li><strong>Right to Damages:</strong> To be indemnified for damages sustained due to inaccurate, incomplete, or unlawful processing.</li>
                <li><strong>Right to Lodge a Complaint:</strong> If you believe your privacy rights have been violated, you have the right to file a complaint before the <strong>National Privacy Commission (NPC)</strong> at <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" style={{ color: '#587d46', fontWeight: 700 }}>privacy.gov.ph</a> or email <a href="mailto:complaints@privacy.gov.ph" style={{ color: '#587d46' }}>complaints@privacy.gov.ph</a>.</li>
              </Box>
            </Box>

          </Stack>

          {/* Footer of the Paper */}
          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Pamahalaang Barangay 133 • Lungsod ng Maynila • Republika ng Pilipinas
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              This policy is reviewed annually in accordance with National Privacy Commission regulations.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
