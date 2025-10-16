import React, { useEffect, useRef, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  IconButton, 
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { Close as CloseIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { Viewer } from 'resium';
import { 
  Ion,
  ScreenSpaceEventHandler, 
  ScreenSpaceEventType,
  createWorldTerrainAsync,
  SplitDirection
} from 'cesium';
import { useProject } from '../context/ProjectContext';
import useLayerData from '../hooks/useCzmlData';
import useAssetDates from '../hooks/useAssetDates';
import LayerSelector from './LayerSelector';
import CzmlComparisonLayer from './CzmlComparisonLayer';
import './ComparisonModal.css';

const ComparisonModal = ({ open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { projectId, projectData } = useProject();
  
  const viewerRef = useRef(null);
  const sliderRef = useRef(null);
  const handlerRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [moveActive, setMoveActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Capas CZML separadas para cada lado
  const leftImagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const leftImages360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });
  const rightImagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const rightImages360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });

  const { availableDates: availableCaptureDates } = useAssetDates(projectId);

  // Estados separados para cada lado - TODAS LAS CAPAS DESACTIVADAS INICIALMENTE
  const [leftLayerVisibility, setLeftLayerVisibility] = useState({
    layout: true,
    realidad3D: false,
    proyecto3D: false,
    fotos: false, // Desactivado inicialmente
    fotos360: false, // Desactivado inicialmente
    terreno: 0, // Sin terreno en modo comparación
  });
  
  const [rightLayerVisibility, setRightLayerVisibility] = useState({
    layout: true,
    realidad3D: false,
    proyecto3D: false,
    fotos: false, // Desactivado inicialmente
    fotos360: false, // Desactivado inicialmente
    terreno: 0, // Sin terreno en modo comparación
  });

  const [leftSelectedDate, setLeftSelectedDate] = useState(null);
  const [rightSelectedDate, setRightSelectedDate] = useState(null);

  // Configurar Ion token
  useEffect(() => {
    if (projectData?.cesium_ion_token) {
      Ion.defaultAccessToken = projectData.cesium_ion_token;
    }
  }, [projectData]);

  // Inicializar viewer cuando esté listo
  const handleViewerReady = (cesiumViewer) => {
    console.log('[ComparisonModal] Viewer ready');
    setViewer(cesiumViewer);
    
    // Configurar posición inicial del split
    cesiumViewer.scene.splitPosition = 0.5;
    
    // Configurar terreno básico
    createWorldTerrainAsync().then(terrainProvider => {
      cesiumViewer.scene.setTerrain(terrainProvider);
    });

    // Volar a la ubicación inicial del proyecto si existe
    if (projectData?.initial_location) {
      const { lon, lat, alt = 1000, heading = 0, pitch = -90, roll = 0 } = projectData.initial_location;
      cesiumViewer.camera.setView({
        destination: cesiumViewer.cesium.Cartesian3.fromDegrees(lon, lat, alt),
        orientation: {
          heading: cesiumViewer.cesium.Math.toRadians(heading),
          pitch: cesiumViewer.cesium.Math.toRadians(pitch),
          roll: cesiumViewer.cesium.Math.toRadians(roll)
        }
      });
    }

    // Configurar sincronización de cámara
    // En modo comparación, ambos lados comparten la misma vista de cámara
    // pero muestran datos diferentes según el SplitDirection
    console.log('[ComparisonModal] Sincronización de cámara configurada');
    
    // Marcar como cargado inmediatamente - no esperamos datos
    setIsLoading(false);
  };

  // Configurar slider cuando el viewer esté listo
  useEffect(() => {
    if (!viewer || !sliderRef.current) return;

    const slider = sliderRef.current;
    const container = slider.parentElement;
    
    // Configurar posición inicial al centro (50%)
    slider.style.left = '50%';
    viewer.scene.splitPosition = 0.5;

    // Crear handler para el slider usando el contenedor del viewer
    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;

    const move = (click) => {
      if (!moveActive) return;

      const containerRect = container.getBoundingClientRect();
      const x = click.position.x - containerRect.left;
      const splitPosition = x / containerRect.width;
      
      // Limitar entre 0.1 y 0.9
      const clampedPosition = Math.max(0.1, Math.min(0.9, splitPosition));
      
      slider.style.left = `${100.0 * clampedPosition}%`;
      viewer.scene.splitPosition = clampedPosition;
    };

    // Event handlers para el slider
    handler.setInputAction(() => setMoveActive(true), ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(move, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(() => setMoveActive(false), ScreenSpaceEventType.LEFT_UP);

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
    };
  }, [viewer, moveActive]);

  // Resetear estado al abrir el modal
  useEffect(() => {
    if (open) {
      console.log('[ComparisonModal] Modal abierto - listo para uso');
      // No mostrar loading ya que no hay datos cargándose automáticamente
      setIsLoading(false);
    }
  }, [open]);

  // Cargar capas cuando el usuario las active o cambien las fechas
  useEffect(() => {
    if (leftLayerVisibility.fotos) {
      console.log('[ComparisonModal] Cargando fotos para lado izquierdo:', leftSelectedDate);
      leftImagesLayer.triggerFetch(leftSelectedDate);
    }
    if (leftLayerVisibility.fotos360) {
      console.log('[ComparisonModal] Cargando fotos 360° para lado izquierdo:', leftSelectedDate);
      leftImages360Layer.triggerFetch(leftSelectedDate);
    }
  }, [leftLayerVisibility.fotos, leftLayerVisibility.fotos360, leftSelectedDate]);

  useEffect(() => {
    if (rightLayerVisibility.fotos) {
      console.log('[ComparisonModal] Cargando fotos para lado derecho:', rightSelectedDate);
      rightImagesLayer.triggerFetch(rightSelectedDate);
    }
    if (rightLayerVisibility.fotos360) {
      console.log('[ComparisonModal] Cargando fotos 360° para lado derecho:', rightSelectedDate);
      rightImages360Layer.triggerFetch(rightSelectedDate);
    }
  }, [rightLayerVisibility.fotos, rightLayerVisibility.fotos360, rightSelectedDate]);

  const handleClose = () => {
    console.log('[ComparisonModal] Cerrando modal de comparación');
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullScreen={fullScreen || isFullscreen}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100vw' : '90vw',
          height: isFullscreen ? '100vh' : '80vh',
          maxWidth: 'none',
          maxHeight: 'none',
          m: 0,
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', height: '100%' }}>
        {/* Indicador de carga */}
        {isLoading && (
          <Backdrop
            sx={{ 
              color: '#fff', 
              zIndex: 2000,
              position: 'absolute',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}
            open={isLoading}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress color="inherit" size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Cargando visualizador de comparación...
              </Typography>
            </Box>
          </Backdrop>
        )}

        {/* Header con controles */}
        <Box className="comparison-modal-header">
          <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
            Comparación de Momentos
          </Typography>
          <IconButton 
            onClick={toggleFullscreen}
            sx={{ color: 'white', mr: 1 }}
            size="small"
          >
            <FullscreenIcon />
          </IconButton>
          <IconButton 
            onClick={handleClose}
            sx={{ color: 'white' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Visualizador Cesium */}
        <Box className="comparison-viewer-container">
          <Viewer
            ref={viewerRef}
            className="comparison-viewer"
            timeline={false}  // Sin timeline
            animation={false} // Sin animation
            baseLayerPicker={false}
            homeButton={true}
            sceneModePicker={false}
            navigationHelpButton={false}
            geocoder={false}
            infoBox={false}
            selectionIndicator={false}
            shouldAnimate={false}
            onReady={handleViewerReady}
          >
            {/* Capas CZML para comparación */}
            <CzmlComparisonLayer
              data={leftImagesLayer.layerData}
              visible={leftLayerVisibility.fotos}
              layerKey="fotos"
              splitDirection="left"
            />
            <CzmlComparisonLayer
              data={leftImages360Layer.layerData}
              visible={leftLayerVisibility.fotos360}
              layerKey="fotos360"
              splitDirection="left"
            />
            <CzmlComparisonLayer
              data={rightImagesLayer.layerData}
              visible={rightLayerVisibility.fotos}
              layerKey="fotos"
              splitDirection="right"
            />
            <CzmlComparisonLayer
              data={rightImages360Layer.layerData}
              visible={rightLayerVisibility.fotos360}
              layerKey="fotos360"
              splitDirection="right"
            />
          </Viewer>

          {/* Slider divisor */}
          <Box className="comparison-slider-container">
            <Box 
              ref={sliderRef}
              className="comparison-slider"
            >
              <Box className="slider-handle" />
            </Box>
          </Box>

          {/* Panel izquierdo */}
          <Box className="comparison-panel comparison-panel-left">
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, textAlign: 'center' }}>
              Momento A
            </Typography>
            <LayerSelector
              projectId={projectId}
              layerVisibility={leftLayerVisibility}
              onLayerVisibilityChange={setLeftLayerVisibility}
              open={true}
              onToggle={() => {}}
              availableCaptureDates={availableCaptureDates}
              selectedCaptureDate={leftSelectedDate}
              onCaptureDateChange={setLeftSelectedDate}
              comparisonSide="left"
            />
          </Box>

          {/* Panel derecho */}
          <Box className="comparison-panel comparison-panel-right">
            <Typography variant="subtitle2" sx={{ color: 'white', mb: 1, textAlign: 'center' }}>
              Momento B
            </Typography>
            <LayerSelector
              projectId={projectId}
              layerVisibility={rightLayerVisibility}
              onLayerVisibilityChange={setRightLayerVisibility}
              open={true}
              onToggle={() => {}}
              availableCaptureDates={availableCaptureDates}
              selectedCaptureDate={rightSelectedDate}
              onCaptureDateChange={setRightSelectedDate}
              comparisonSide="right"
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;
