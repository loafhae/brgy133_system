import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Help, Warning, CheckCircle, Info } from '@mui/icons-material';

/**
 * ConfirmationDialog - Reusable confirmation modal adhering to Figures 3.7.5 - 4.2.1
 * in documentation.pdf.
 *
 * Provides the explicit verification prompt:
 * "Are you sure you want to [ACTION] this [ITEM]?"
 * with high-contrast [YES] and [NO] action controls.
 */
export default function ConfirmationDialog({
  open,
  title = 'Confirmation',
  message,
  onConfirm,
  onCancel,
  confirmText = 'YES',
  cancelText = 'NO',
  severity = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  loading = false,
}) {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'danger':
        return <Warning sx={{ fontSize: 44, color: '#dc2626', mb: 1.5 }} />;
      case 'success':
        return <CheckCircle sx={{ fontSize: 44, color: '#16a34a', mb: 1.5 }} />;
      case 'info':
        return <Info sx={{ fontSize: 44, color: '#0284c7', mb: 1.5 }} />;
      default:
        return <Help sx={{ fontSize: 44, color: '#990000', mb: 1.5 }} />;
    }
  };

  const getConfirmColor = () => {
    if (severity === 'danger') return '#dc2626';
    if (severity === 'success') return '#16a34a';
    return '#990000';
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 2,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            textAlign: 'center',
            border: '1px solid #e4e4e7',
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {getSeverityIcon()}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: '#18181b',
            lineHeight: 1.4,
            mb: 1,
            fontSize: '1.2rem',
          }}
        >
          {message || 'Are you sure you want to proceed?'}
        </Typography>
        {title && title !== 'Confirmation' && (
          <Typography variant="body2" sx={{ color: '#71717a' }}>
            {title}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 1.5, px: 3 }}>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            minWidth: 110,
            py: 1,
            fontWeight: 800,
            letterSpacing: 1,
            bgcolor: getConfirmColor(),
            '&:hover': {
              bgcolor: severity === 'danger' ? '#b91c1c' : '#730000',
            },
            color: '#ffffff',
            borderRadius: 2,
          }}
        >
          {loading ? '...' : confirmText}
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          sx={{
            minWidth: 110,
            py: 1,
            fontWeight: 800,
            letterSpacing: 1,
            color: '#3f3f46',
            borderColor: '#d4d4d8',
            bgcolor: '#ffffff',
            borderRadius: 2,
            '&:hover': {
              borderColor: '#a1a1aa',
              bgcolor: '#f4f4f5',
            },
          }}
        >
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
