import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

export default function AFrameViewerSlide({ src, title }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(80); // Campo de visión inicial
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const stopBubble = useCallback((e) => { 
    try { 
      e.stopPropagation(); 
      e.preventDefault();
    } catch {} 
  }, []);

  const ensureAFrame = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.AFRAME) return resolve();
      
      // Cargar A-Frame desde CDN
      if (!document.getElementById('aframe-js')) {
        const script = document.createElement('script');
        script.id = 'aframe-js';
        script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
        script.async = true;
        script.onload = () => {
          // Esperar a que A-Frame se inicialice completamente
          setTimeout(() => resolve(), 100);
        };
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }, []);

  // Funciones de control
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.max(30, prev - 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.min(120, prev + 10));
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => ({ ...prev, y: prev.y - 30 }));
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation(prev => ({ ...prev, y: prev.y + 30 }));
  }, []);

  const handleCenter = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setZoom(80);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!src) return;

    ensureAFrame()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        // Limpiar contenido previo
        containerRef.current.innerHTML = '';

        // Crear la escena A-Frame
        const sceneHTML = `
          <a-scene 
            embedded 
            style="width: 100%; height: 100%;"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            loading-screen="enabled: false"
            renderer="antialias: true; colorManagement: true; sortObjects: true;"
            background="color: #000000"
          >
            <a-sky 
              src="${src}" 
              rotation="0 0 0"
              material="shader: flat"
            ></a-sky>
            <a-camera 
              id="camera360"
              look-controls="enabled: true; reverseMouseDrag: false; touchEnabled: true; magicWindowTrackingEnabled: false"
              wasd-controls="enabled: false"
              position="0 0 0"
              fov="${zoom}"
              rotation="${rotation.x} ${rotation.y} 0"
            ></a-camera>
          </a-scene>
        `;

        containerRef.current.innerHTML = sceneHTML;
        
        // Referencias a elementos A-Frame
        sceneRef.current = containerRef.current.querySelector('a-scene');
        cameraRef.current = containerRef.current.querySelector('a-camera');

        // Event listeners para A-Frame
        if (sceneRef.current) {
          sceneRef.current.addEventListener('loaded', () => {
            console.log('[AFrameViewerSlide] Escena 360° cargada exitosamente');
            setIsLoaded(true);
          });

          sceneRef.current.addEventListener('error', (error) => {
            console.warn('[AFrameViewerSlide] Error cargando escena 360°:', error);
          });
        }

      })
      .catch((e) => {
        console.warn('[AFrameViewerSlide] Error cargando A-Frame:', e);
      });

    return () => {
      cancelled = true;
      setIsLoaded(false);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [src, ensureAFrame]);

  // Actualizar cámara cuando cambian zoom o rotación
  useEffect(() => {
    if (cameraRef.current && isLoaded) {
      cameraRef.current.setAttribute('fov', zoom);
      cameraRef.current.setAttribute('rotation', `${rotation.x} ${rotation.y} 0`);
    }
  }, [zoom, rotation, isLoaded]);

  if (!src) return null;

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
    >
      {/* Contenedor A-Frame */}
      <div
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
        onPointerDown={stopBubble}
        onPointerMove={stopBubble}
        onPointerUp={stopBubble}
        onTouchStart={stopBubble}
        onTouchMove={stopBubble}
        onTouchEnd={stopBubble}
        onMouseDown={stopBubble}
        onMouseMove={stopBubble}
        onMouseUp={stopBubble}
        onWheel={stopBubble}
      />

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
      </Box>

      {/* Controles de rotación */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        <IconButton
          onClick={handleRotateLeft}
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
          <RotateLeftIcon />
        </IconButton>

        <IconButton
          onClick={handleRotateRight}
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
          <RotateRightIcon />
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
            zIndex: 1001
          }}
        >
          Cargando vista 360°...
        </Box>
      )}
    </Box>
  );
}
