import React from 'react';
import { Box, Paper, Typography, IconButton, Divider, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import './InfoBox.css';

const InfoBox = ({ selectedElement, onClose }) => {
  console.log('[InfoBox] Rendering with selectedElement:', selectedElement);
  
  if (!selectedElement) {
    console.log('[InfoBox] No selectedElement, returning null');
    return null;
  }

  const renderContent = () => {
    switch (selectedElement.type) {
      case 'photo':
        return <PhotoContent data={selectedElement.data} />;
      case 'photo360':
        return <Photo360Content data={selectedElement.data} />;
      case 'ifc':
        return <IFCContent data={selectedElement.data} />;
      default:
        return <DefaultContent data={selectedElement.data} />;
    }
  };

  const getIcon = () => {
    switch (selectedElement.type) {
      case 'photo':
        return <PhotoCameraIcon fontSize="small" />;
      case 'photo360':
        return <ViewInArIcon fontSize="small" />;
      case 'ifc':
        return <AccountBalanceIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (selectedElement.type) {
      case 'photo':
        return 'Fotografía';
      case 'photo360':
        return 'Foto 360°';
      case 'ifc':
        return 'Elemento IFC';
      default:
        return 'Información';
    }
  };

  return (
    <Box className="info-box">
      <Paper elevation={6} className="info-box-surface">
        <Box className="info-box-header">
          <Box className="info-box-title">
            {getIcon()}
            <Typography variant="subtitle2" className="info-box-title-text">
              {getTitle()}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={onClose}
            className="info-box-close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Box className="info-box-content">
          {renderContent()}
        </Box>
      </Paper>
    </Box>
  );
};

// Componente para contenido de fotografías simplificado
const PhotoContent = ({ data }) => {
  console.log('[PhotoContent] Renderizando con data:', data);
  
  // Validar que tenemos datos básicos
  if (!data) {
    return (
      <Box className="photo-content">
        <Box className="photo-placeholder">
          <PhotoCameraIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
          <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '8px' }}>
            No se encontraron datos de la foto
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleDownload = () => {
    if (!data.thumbnail) {
      console.log('[InfoBox] No hay URL de foto para descargar');
      return;
    }
    
    console.log('[InfoBox] Descargando foto:', data.name);
    const link = document.createElement('a');
    link.href = data.thumbnail;
    link.download = data.name || 'foto.jpg';
    link.target = '_blank'; // Abrir en nueva pestaña como fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (!data.thumbnail) {
      console.log('[InfoBox] No hay URL de foto para compartir');
      return;
    }
    
    console.log('[InfoBox] Compartiendo foto:', data.name);
    if (navigator.share) {
      navigator.share({
        title: data.name || 'Fotografía del proyecto',
        text: data.description || 'Fotografía del proyecto',
        url: data.thumbnail
      }).catch(console.error);
    } else {
      // Fallback: copiar URL al clipboard
      navigator.clipboard.writeText(data.thumbnail)
        .then(() => {
          console.log('URL copiada al clipboard');
        })
        .catch(console.error);
    }
  };

  return (
    <Box className="photo-content">
      {/* Foto principal */}
      <Box className="photo-gallery">
        <Box className="photo-main">
          {data.thumbnail ? (
            <img src={data.thumbnail} alt={data.name || 'Fotografía'} />
          ) : (
            <Box className="photo-placeholder">
              <PhotoCameraIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '8px' }}>
                No se encontraron datos de la foto
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Botones de acción */}
      <Box className="photo-actions">
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          className="action-button"
        >
          Descargar
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          className="action-button"
        >
          Compartir
        </Button>
      </Box>

      {/* Información de la foto */}
      <Box className="photo-info">
        {data.name && (
          <Typography variant="body2" className="info-item">
            <strong>Nombre:</strong> {data.name}
          </Typography>
        )}
        {data.date && (
          <Typography variant="body2" className="info-item">
            <strong>Fecha:</strong> {new Date(data.date).toLocaleDateString('es-AR')}
          </Typography>
        )}
        {data.coordinates && (
          <Typography variant="body2" className="info-item">
            <strong>Coordenadas:</strong> {data.coordinates.lat?.toFixed(6)}, {data.coordinates.lon?.toFixed(6)}
          </Typography>
        )}
        {data.thumbnail && (
          <Typography variant="body2" className="info-item">
            <strong>URL:</strong> 
            <Typography 
              component="span" 
              variant="body2" 
              style={{ 
                color: '#4fc3f7', 
                wordBreak: 'break-all', 
                marginLeft: '8px',
                fontSize: '0.75rem'
              }}
            >
              {data.thumbnail}
            </Typography>
          </Typography>
        )}
        {data.description && (
          <Typography variant="body2" className="info-item">
            <strong>Descripción:</strong> {data.description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Componente para contenido de fotos 360°
const Photo360Content = ({ data }) => (
  <Box className="photo360-content">
    {data.thumbnail && (
      <Box className="photo-thumbnail">
        <img src={data.thumbnail} alt="Vista previa 360°" />
        <Box className="photo360-badge">360°</Box>
      </Box>
    )}
    <Box className="photo-info">
      {data.name && (
        <Typography variant="body2" className="info-item">
          <strong>Nombre:</strong> {data.name}
        </Typography>
      )}
      {data.date && (
        <Typography variant="body2" className="info-item">
          <strong>Fecha:</strong> {new Date(data.date).toLocaleDateString('es-AR')}
        </Typography>
      )}
      {data.coordinates && (
        <Typography variant="body2" className="info-item">
          <strong>Coordenadas:</strong> {data.coordinates.lat?.toFixed(6)}, {data.coordinates.lon?.toFixed(6)}
        </Typography>
      )}
      <Typography variant="caption" className="info-hint">
        Haz clic para ver en modo inmersivo
      </Typography>
    </Box>
  </Box>
);

// Componente para contenido de elementos IFC
const IFCContent = ({ data }) => (
  <Box className="ifc-content">
    <Box className="ifc-info">
      {data.name && (
        <Typography variant="body2" className="info-item">
          <strong>Elemento:</strong> {data.name}
        </Typography>
      )}
      {data.type && (
        <Typography variant="body2" className="info-item">
          <strong>Tipo:</strong> {data.type}
        </Typography>
      )}
      {data.material && (
        <Typography variant="body2" className="info-item">
          <strong>Material:</strong> {data.material}
        </Typography>
      )}
      {data.properties && Object.keys(data.properties).length > 0 && (
        <>
          <Typography variant="body2" className="info-section-title">
            <strong>Propiedades:</strong>
          </Typography>
          {Object.entries(data.properties).map(([key, value]) => (
            <Typography key={key} variant="body2" className="info-property">
              • {key}: {value}
            </Typography>
          ))}
        </>
      )}
    </Box>
  </Box>
);

// Componente para contenido por defecto
const DefaultContent = ({ data }) => (
  <Box className="default-content">
    <Typography variant="body2" className="info-item">
      Información del elemento seleccionado
    </Typography>
    {data && (
      <pre className="debug-data">
        {JSON.stringify(data, null, 2)}
      </pre>
    )}
  </Box>
);

export default InfoBox;
