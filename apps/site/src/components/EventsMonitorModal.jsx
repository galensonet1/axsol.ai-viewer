/**
 * Events Monitor Modal
 * Modal popup para el Monitor de Eventos con botón de cierre
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import AdminDashboard from '../pages/AdminDashboard';

const EventsMonitorModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6" component="span">
            Monitor de Eventos
          </Typography>
        </Box>
        <IconButton
          aria-label="cerrar"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent
        sx={{
          p: 0,
          '&.MuiDialogContent-root': {
            paddingTop: 0
          }
        }}
      >
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <AdminDashboard isModal={true} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EventsMonitorModal;
