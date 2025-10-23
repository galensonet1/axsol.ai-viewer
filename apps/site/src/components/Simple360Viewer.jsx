import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export default function Simple360Viewer({ src, title }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const stopBubble = useCallback((e) => { 
    try { 
      e.stopPropagation(); 
      e.preventDefault();
    } catch {} 
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(3, prev + 0.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const handleCenter = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    console.log('[Simple360Viewer] 🖱️ Mouse down - iniciando drag');
    stopBubble(e);
  }, [stopBubble]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
    stopBubble(e);
  }, [isDragging, stopBubble]);

  const handleMouseUp = useCallback((e) => {
    setIsDragging(false);
    stopBubble(e);
  }, [stopBubble]);

  const handleWheel = useCallback((e) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    stopBubble(e);
  }, [stopBubble]);

  // Touch events para móviles
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastMousePos.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
    }
    stopBubble(e);
  }, [stopBubble]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - lastMousePos.current.x;
    const deltaY = e.touches[0].clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    lastMousePos.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    };
    stopBubble(e);
  }, [isDragging, stopBubble]);

  const handleTouchEnd = useCallback((e) => {
    setIsDragging(false);
    stopBubble(e);
  }, [stopBubble]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!src) return null;

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Contenedor de la imagen 360° */}
      <div
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative',
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `
              rotateX(${rotation.x}deg) 
              rotateY(${rotation.y}deg) 
              scale(${zoom})
            `,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={title || "Vista 360°"}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              borderRadius: '0',
              // Aplicar proyección equirectangular
              filter: 'none',
              imageRendering: 'high-quality'
            }}
            onLoad={() => {
              setIsLoaded(true);
              console.log('[Simple360Viewer] ✅ Imagen 360° cargada correctamente');
              console.log('[Simple360Viewer] 🎮 Controles disponibles: drag para rotar, wheel para zoom');
            }}
            onError={(e) => {
              console.warn('[Simple360Viewer] Error cargando imagen:', e);
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Controles personalizados */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        <IconButton
          onClick={handleZoomIn}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <ZoomInIcon />
        </IconButton>

        <IconButton
          onClick={handleZoomOut}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <ZoomOutIcon />
        </IconButton>

        <IconButton
          onClick={handleCenter}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CenterFocusStrongIcon />
        </IconButton>
      </Box>

      {/* Indicador de carga */}
      {!isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '14px',
            zIndex: 1001,
            textAlign: 'center'
          }}
        >
          <div>Cargando vista 360°...</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
            Arrastra para navegar • Rueda para zoom
          </div>
        </Box>
      )}

      {/* Overlay de instrucciones */}
      {isLoaded && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          Arrastra para rotar • Rueda para zoom
        </Box>
      )}
    </Box>
  );
}
