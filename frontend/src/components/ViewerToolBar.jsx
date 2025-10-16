import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StraightenIcon from '@mui/icons-material/Straighten';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import './ViewerToolBar.css';

const ViewerToolBar = ({ onToolSelect, hasMeasurements = false, onClearMeasurements }) => {
  const [measureAnchor, setMeasureAnchor] = useState(null);

  const handleMeasureClick = (event) => {
    setMeasureAnchor(event.currentTarget);
  };

  const handleMeasureClose = () => {
    setMeasureAnchor(null);
  };

  const handleMeasureSelect = (type) => {
    onToolSelect?.('measure', type);
    handleMeasureClose();
  };

  const handleAIAssistant = () => {
    onToolSelect?.('ai-assistant');
  };

  const handleCompare = () => {
    onToolSelect?.('compare');
  };

  return (
    <Box className="viewer-toolbar">
      <Tooltip title="Asistente IA" placement="left">
        <IconButton 
          className="toolbar-button"
          onClick={handleAIAssistant}
          size="medium"
        >
          <SmartToyIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Herramientas de Medición" placement="left">
        <IconButton 
          className="toolbar-button"
          onClick={handleMeasureClick}
          size="medium"
        >
          <StraightenIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={measureAnchor}
        open={Boolean(measureAnchor)}
        onClose={handleMeasureClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--ax-panel-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--ax-panel-border)',
            borderRadius: 2,
            minWidth: 180,
          }
        }}
      >
        <MenuItem onClick={() => handleMeasureSelect('point')} sx={{ color: 'var(--ax-panel-text)', py: 1 }}>
          <ListItemIcon>
            <ViewInArIcon fontSize="small" sx={{ color: 'var(--ax-panel-contrast)' }} />
          </ListItemIcon>
          <ListItemText primary="Medir Punto" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem onClick={() => handleMeasureSelect('line')} sx={{ color: 'var(--ax-panel-text)', py: 1 }}>
          <ListItemIcon>
            <StraightenIcon fontSize="small" sx={{ color: 'var(--ax-panel-contrast)' }} />
          </ListItemIcon>
          <ListItemText primary="Medir Línea" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem onClick={() => handleMeasureSelect('area')} sx={{ color: 'var(--ax-panel-text)', py: 1 }}>
          <ListItemIcon>
            <SquareFootIcon fontSize="small" sx={{ color: 'var(--ax-panel-contrast)' }} />
          </ListItemIcon>
          <ListItemText primary="Medir Área" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem disabled sx={{ color: 'var(--ax-panel-text)', py: 1, opacity: 0.6 }}>
          <ListItemIcon>
            <ViewInArIcon fontSize="small" sx={{ color: 'var(--ax-panel-contrast)' }} />
          </ListItemIcon>
          <ListItemText primary="Medir Volumen" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        {hasMeasurements && (
          <MenuItem onClick={() => { onClearMeasurements?.(); handleMeasureClose(); }} sx={{ color: 'var(--ax-panel-text)', py: 1 }}>
            <ListItemIcon>
              {/* Reusar icono de Straighten con estilo de borrar para simplicidad */}
              <StraightenIcon fontSize="small" sx={{ color: 'var(--ax-brand-accent)' }} />
            </ListItemIcon>
            <ListItemText primary="Borrar mediciones" primaryTypographyProps={{ fontSize: '0.85rem', color: 'var(--ax-brand-accent)' }} />
          </MenuItem>
        )}
      </Menu>

      <Tooltip title="Comparar Momentos" placement="left">
        <IconButton 
          className="toolbar-button"
          onClick={handleCompare}
          size="medium"
        >
          <CompareArrowsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ViewerToolBar;
