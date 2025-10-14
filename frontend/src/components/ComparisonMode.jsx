import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';
import LayerSelector from './LayerSelector';
import { useProject } from '../context/ProjectContext';
import useLayerData from '../hooks/useCzmlData';
import CzmlComparisonLayer from './CzmlComparisonLayer';
import './ComparisonMode.css';

const ComparisonMode = ({ 
  viewer, 
  onClose, 
  availableCaptureDates,
  layerVisibility: defaultLayerVisibility,
  onLayerVisibilityChange: defaultOnLayerVisibilityChange
}) => {
  const { projectId } = useProject();
  const sliderRef = useRef(null);
  const handlerRef = useRef(null);
  const [moveActive, setMoveActive] = useState(false);

  // Capas CZML separadas para cada lado
  const leftImagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const leftImages360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });
  const rightImagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const rightImages360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });
  
  // Estados separados para cada lado
  const [leftLayerVisibility, setLeftLayerVisibility] = useState({
    ...defaultLayerVisibility,
    layout: true,
    realidad3D: true,
    proyecto3D: false,
    fotos: true,
    fotos360: true,
    terreno: 20,
  });
  
  const [rightLayerVisibility, setRightLayerVisibility] = useState({
    ...defaultLayerVisibility,
    layout: true,
    realidad3D: true,
    proyecto3D: false,
    fotos: true,
    fotos360: true,
    terreno: 20,
  });

  const [leftSelectedDate, setLeftSelectedDate] = useState(null);
  const [rightSelectedDate, setRightSelectedDate] = useState(null);

  // Cargar capas iniciales al montar el componente
  useEffect(() => {
    console.log('[ComparisonMode] Cargando capas iniciales');
    // Cargar capas izquierdas
    leftImagesLayer.triggerFetch();
    leftImages360Layer.triggerFetch();
    // Cargar capas derechas
    rightImagesLayer.triggerFetch();
    rightImages360Layer.triggerFetch();
  }, []); // Solo al montar

  // Cargar capas cuando se activen o cambien las fechas
  useEffect(() => {
    if (leftLayerVisibility.fotos) {
      leftImagesLayer.triggerFetch(leftSelectedDate);
    }
    if (leftLayerVisibility.fotos360) {
      leftImages360Layer.triggerFetch(leftSelectedDate);
    }
  }, [leftLayerVisibility.fotos, leftLayerVisibility.fotos360, leftSelectedDate, leftImagesLayer, leftImages360Layer]);

  useEffect(() => {
    if (rightLayerVisibility.fotos) {
      rightImagesLayer.triggerFetch(rightSelectedDate);
    }
    if (rightLayerVisibility.fotos360) {
      rightImages360Layer.triggerFetch(rightSelectedDate);
    }
  }, [rightLayerVisibility.fotos, rightLayerVisibility.fotos360, rightSelectedDate, rightImagesLayer, rightImages360Layer]);

  useEffect(() => {
    if (!viewer || !sliderRef.current) return;

    console.log('[ComparisonMode] Inicializando modo comparación');

    // Configurar posición inicial del split
    viewer.scene.splitPosition = 0.5;
    
    // Configurar el slider
    const slider = sliderRef.current;
    slider.style.left = '50%';

    // Crear handler para el slider
    const handler = new ScreenSpaceEventHandler(slider);
    handlerRef.current = handler;

    const move = (movement) => {
      if (!moveActive) return;

      const relativeOffset = movement.endPosition.x;
      const splitPosition = (slider.offsetLeft + relativeOffset) / slider.parentElement.offsetWidth;
      
      // Limitar entre 0.1 y 0.9
      const clampedPosition = Math.max(0.1, Math.min(0.9, splitPosition));
      
      slider.style.left = `${100.0 * clampedPosition}%`;
      viewer.scene.splitPosition = clampedPosition;
    };

    // Event handlers para el slider
    handler.setInputAction(() => {
      setMoveActive(true);
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction(() => {
      setMoveActive(true);
    }, ScreenSpaceEventType.PINCH_START);

    handler.setInputAction(move, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(move, ScreenSpaceEventType.PINCH_MOVE);

    handler.setInputAction(() => {
      setMoveActive(false);
    }, ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction(() => {
      setMoveActive(false);
    }, ScreenSpaceEventType.PINCH_END);

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
      // Resetear split position al salir
      if (viewer && viewer.scene) {
        viewer.scene.splitPosition = 0.0;
      }
    };
  }, [viewer, moveActive]);

  const handleClose = () => {
    console.log('[ComparisonMode] Cerrando modo comparación');
    onClose();
  };

  return (
    <Box className="comparison-mode-container">
      {/* Header con botón de cerrar */}
      <Box className="comparison-header">
        <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
          Comparación de Momentos
        </Typography>
        <IconButton 
          onClick={handleClose}
          sx={{ color: 'white' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>

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
          layerVisibility={leftLayerVisibility}
          onLayerVisibilityChange={setLeftLayerVisibility}
          open={true}
          onToggle={() => {}} // Siempre abierto en modo comparación
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
          layerVisibility={rightLayerVisibility}
          onLayerVisibilityChange={setRightLayerVisibility}
          open={true}
          onToggle={() => {}} // Siempre abierto en modo comparación
          availableCaptureDates={availableCaptureDates}
          selectedCaptureDate={rightSelectedDate}
          onCaptureDateChange={setRightSelectedDate}
          comparisonSide="right"
        />
      </Box>

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
    </Box>
  );
};

export default ComparisonMode;
