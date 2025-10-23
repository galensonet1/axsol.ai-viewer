import React from 'react';
import { useUser } from '../context/UserContext.jsx';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const UserDebugInfo = () => {
  const { user, hasRole } = useUser();
  const { projectId } = useParams();

  // Solo mostrar en desarrollo o para debugging
  if (import.meta.env.PROD && !window.location.search.includes('debug=true')) {
    return null;
  }

  const debugInfo = {
    user: user,
    userId: user?.id,
    userIdType: typeof user?.id,
    roles: user?.roles,
    roleIds: user?.roleIds,
    projectId: projectId,
    isSuperAdmin: user?.id === 5,
    hasRole56: hasRole([5, 6]),
    shouldShowConsoleAdmin: hasRole([5, 6]),
    shouldShowMonitor: user?.id === 5 && projectId,
    currentUrl: window.location.href,
    apiBaseUrl: window.__CONFIG__?.apiBaseUrl || 'not set'
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, maxWidth: 400 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" color="error">
            🐛 User Debug Info
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <pre style={{ 
              fontSize: '10px', 
              overflow: 'auto', 
              maxHeight: '300px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default UserDebugInfo;
