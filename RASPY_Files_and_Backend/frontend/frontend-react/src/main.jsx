import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#587d46', // Vibrant Natural Sage Forest Green
      light: '#789f64',
      dark: '#3f5d30',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#b93636', // Civic Crimson
      light: '#d75353',
      dark: '#8b2020',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#15803d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#fee2e2',
      dark: '#991b1b',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0284c7',
      light: '#e0f2fe',
      dark: '#0369a1',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Ultra-clean subtle slate pearl
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Deep slate for high contrast readability
      secondary: '#475569',
    },
    divider: 'rgba(226, 232, 240, 0.8)',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em', color: '#0f172a' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' },
    subtitle1: { fontWeight: 600, color: '#1e293b' },
    subtitle2: { fontWeight: 600, color: '#64748b', fontSize: '0.85rem' },
    body1: { fontSize: '0.94rem', lineHeight: 1.6 },
    body2: { fontSize: '0.86rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 650, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        'html, body': {
          margin: 0,
          padding: 0,
          fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          overflowX: 'hidden',
        },
        '::-webkit-scrollbar': {
          width: '7px',
          height: '7px',
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(148, 163, 184, 0.35)',
          borderRadius: '999px',
          transition: 'background 0.2s ease',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(148, 163, 184, 0.65)',
        },
        '::selection': {
          background: 'rgba(88, 125, 70, 0.25)',
          color: '#172115',
        },
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes livePulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.6)' },
          '70%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
        },
        '.animate-fade-in': {
          animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        },
        '.pulse-badge': {
          animation: 'livePulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        },
        'a': {
          color: 'inherit',
          textDecoration: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 650,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #587d46 0%, #476837 100%)',
          boxShadow: '0 2px 8px rgba(88, 125, 70, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #648c50 0%, #4d713c 100%)',
            boxShadow: '0 4px 14px rgba(88, 125, 70, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #b93636 0%, #992424 100%)',
          boxShadow: '0 2px 8px rgba(185, 54, 54, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #c94040 0%, #a82a2a 100%)',
            boxShadow: '0 4px 14px rgba(185, 54, 54, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 16px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#587d46',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 700,
            fontSize: '0.82rem',
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(88, 125, 70, 0.04)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f1f5f9',
            fontSize: '0.88rem',
          },
        },
      },
    },
  },
});

createRoot(document.getElementById('app')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);