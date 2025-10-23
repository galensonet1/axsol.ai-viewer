import React, { useRef, useEffect, useCallback } from 'react';

export default function PannellumViewerSlide({ src, title }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const stopBubble = useCallback((e) => { try { e.stopPropagation(); } catch {} }, []);

  const ensurePannellum = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.pannellum) return resolve();
      // CSS
      if (!document.getElementById('pnlm-css')) {
        const link = document.createElement('link');
        link.id = 'pnlm-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/pannellum/build/pannellum.css';
        document.head.appendChild(link);
      }
      // JS
      if (!document.getElementById('pnlm-js')) {
        const script = document.createElement('script');
        script.id = 'pnlm-js';
        script.src = 'https://cdn.jsdelivr.net/npm/pannellum/build/pannellum.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
      } else {
        const script = document.getElementById('pnlm-js');
        if (script && script.readyState && script.readyState !== 'loaded' && script.readyState !== 'complete') {
          script.onload = () => resolve();
        } else {
          resolve();
        }
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!src) return;
    ensurePannellum()
      .then(() => {
        if (cancelled) return;
        if (!containerRef.current || !window.pannellum) return;
        // Limpieza previa
        try { if (viewerRef.current && typeof viewerRef.current.destroy === 'function') viewerRef.current.destroy(); } catch {}
        containerRef.current.innerHTML = '';
        try {
          viewerRef.current = window.pannellum.viewer(containerRef.current, {
            type: 'equirectangular',
            panorama: src,
            autoLoad: true,
            compass: false, // Deshabilitar brújula para mejor UX
            northOffset: 0,
            yaw: 0,
            pitch: 0,
            hfov: 90, // Campo de visión inicial más conservador
            autoRotate: 0, // Deshabilitar auto-rotación por defecto
            autoRotateDelay: 3000,
            hfovMin: 50, // Zoom mínimo más restrictivo
            hfovMax: 110, // Zoom máximo más restrictivo
            showControls: true,
            showZoomCtrl: true,
            showFullscreenCtrl: false, // Deshabilitar fullscreen de Pannellum (conflicto con lightbox)
            mouseZoom: true,
            doubleClickZoom: true,
            keyboardZoom: true,
            draggable: true,
            disableKeyboardCtrl: false,
            crossOrigin: 'anonymous', // Para evitar problemas de CORS
            // Configuración mejorada para equirectangulares
            vaov: 180, // Ángulo vertical completo para equirectangulares
            vOffset: 0,
            dynamicUpdate: true,
            // Configuración de calidad
            backgroundColor: [0, 0, 0], // Fondo negro
            // Configuración de controles
            orientationOnByDefault: false,
            showZoomCtrl: true,
            showFullscreenCtrl: false,
          });

          // Agregar event listeners para mejor manejo
          if (viewerRef.current) {
            viewerRef.current.on('load', () => {
              console.log('[PannellumViewerSlide] Panorama cargado exitosamente');
            });
            
            viewerRef.current.on('error', (error) => {
              console.warn('[PannellumViewerSlide] Error cargando panorama:', error);
            });
            
            viewerRef.current.on('errorcleared', () => {
              console.log('[PannellumViewerSlide] Error de panorama resuelto');
            });
          }
          // Ensure zoom controls are visible if CSS conflicts
          /*
          try {
            requestAnimationFrame(() => {
              const root = containerRef.current;
              if (!root) return;
              const zc = root.querySelector('.pnlm-zoom-controls');
              if (zc) {
                zc.style.display = 'flex';
                zc.style.opacity = '1';
              }
              const zout = root.querySelector('.pnlm-zoom-out');
              if (zout) {
                zout.style.display = 'inline-block';
                zout.style.opacity = '1';
              }
              const zin = root.querySelector('.pnlm-zoom-in');
              if (zin) {
                zin.style.display = 'inline-block';
                zin.style.opacity = '1';
              }
            });
          } catch {}*/
        } catch (e) {
          console.warn('[PannellumViewerSlide] Error iniciando pannellum:', e);
        }
      })
      .catch((e) => console.warn('[PannellumViewerSlide] Error cargando pannellum:', e));
    return () => {
      cancelled = true;
      try { if (viewerRef.current && typeof viewerRef.current.destroy === 'function') viewerRef.current.destroy(); } catch {}
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [src, title, ensurePannellum]);

  if (!src) return null;
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
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
    </div>
  );
}
