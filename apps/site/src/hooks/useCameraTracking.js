/**
 * useCameraTracking Hook
 * Trackea movimiento de cámara en Cesium Viewer para analytics
 * 
 * Captura:
 * - Posición (lat, lon, altitude)
 * - Orientación (heading, pitch, roll)
 * - Zoom level
 * - Tipo de movimiento (pan, zoom, rotate, tilt)
 */

import { useEffect, useRef, useCallback } from 'react';
import { Cartographic, Math as CesiumMath } from 'cesium';
import { trackEvent } from '../utils/analytics';
import { throttle } from 'lodash';

const useCameraTracking = (viewer, projectId, options = {}) => {
  const {
    throttleMs = 3000,           // Trackear cada 3 segundos como máximo
    minMovementThreshold = 0.001, // Movimiento mínimo para trackear
    trackOnMount = true,
    enabled = true
  } = options;

  const lastPositionRef = useRef(null);
  const lastOrientationRef = useRef(null);
  const sessionStartRef = useRef(null);
  const moveCountRef = useRef(0);
  const viewerRef = useRef(viewer); // ✅ FIX: Guardar viewer en ref
  
  // Actualizar viewerRef cuando viewer cambie
  useEffect(() => {
    viewerRef.current = viewer;
  }, [viewer]);

  /**
   * Obtener datos actuales de la cámara
   */
  const getCameraData = useCallback(() => {
    const currentViewer = viewerRef.current;
    if (!currentViewer || !currentViewer.camera) return null;

    const camera = currentViewer.camera;
    const position = camera.positionCartographic;
    
    if (!position) return null;

    return {
      // Posición geográfica
      latitude: CesiumMath.toDegrees(position.latitude),
      longitude: CesiumMath.toDegrees(position.longitude),
      altitude: position.height,
      
      // Orientación (en grados)
      heading: CesiumMath.toDegrees(camera.heading),  // Rotación horizontal (norte = 0°)
      pitch: CesiumMath.toDegrees(camera.pitch),      // Inclinación vertical (-90° mirando abajo, 0° horizonte)
      roll: CesiumMath.toDegrees(camera.roll),        // Rotación de la cámara
    };
  }, []); // ✅ Sin dependencias, usa viewerRef.current

  /**
   * Detectar tipo de movimiento basado en cambios
   */
  const detectMovementType = useCallback((prev, curr) => {
    if (!prev || !curr) return 'unknown';

    const latDiff = Math.abs(curr.latitude - prev.latitude);
    const lonDiff = Math.abs(curr.longitude - prev.longitude);
    const altDiff = Math.abs(curr.altitude - prev.altitude);
    const headingDiff = Math.abs(curr.heading - prev.heading);
    const pitchDiff = Math.abs(curr.pitch - prev.pitch);

    // Prioridad de detección
    if (altDiff > 10) return 'zoom';                    // Cambio de altitud
    if (headingDiff > 5) return 'rotate';               // Rotación horizontal
    if (pitchDiff > 5) return 'tilt';                   // Inclinación vertical
    if (latDiff > 0.0001 || lonDiff > 0.0001) return 'pan'; // Desplazamiento horizontal
    
    return 'adjust'; // Ajustes menores
  }, []);

  /**
   * Trackear posición de cámara
   */
  const trackCameraPosition = useCallback((movementType = 'manual') => {
    const currentViewer = viewerRef.current;
    console.log('🎯 [Camera] trackCameraPosition llamado:', { movementType, enabled, hasViewer: !!currentViewer });
    
    if (!enabled || !currentViewer) {
      console.warn('⚠️ [Camera] trackCameraPosition abortado:', { enabled, hasViewer: !!currentViewer });
      return;
    }

    const cameraData = getCameraData();
    if (!cameraData) {
      console.warn('⚠️ [Camera] No camera data disponible');
      return;
    }
    
    console.log('📊 [Camera] Camera data:', cameraData);

    // Detectar tipo de movimiento si no se especificó
    if (movementType === 'manual' && lastPositionRef.current) {
      movementType = detectMovementType(lastPositionRef.current, cameraData);
    }

    // Calcular distancia recorrida (aproximada)
    let distanceMoved = 0;
    if (lastPositionRef.current) {
      const dLat = cameraData.latitude - lastPositionRef.current.latitude;
      const dLon = cameraData.longitude - lastPositionRef.current.longitude;
      distanceMoved = Math.sqrt(dLat * dLat + dLon * dLon) * 111000; // Aproximado en metros
    }

    moveCountRef.current++;

    trackEvent('camera_moved', {
      project_id: projectId,
      movement_type: movementType,
      
      // Posición
      latitude: cameraData.latitude.toFixed(6),
      longitude: cameraData.longitude.toFixed(6),
      altitude_m: Math.round(cameraData.altitude),
      
      // Orientación
      heading_deg: Math.round(cameraData.heading),
      pitch_deg: Math.round(cameraData.pitch),
      roll_deg: Math.round(cameraData.roll),
      
      // Métricas de sesión
      move_count: moveCountRef.current,
      distance_moved_m: Math.round(distanceMoved),
      session_duration_s: sessionStartRef.current 
        ? Math.round((Date.now() - sessionStartRef.current) / 1000)
        : 0
    });

    lastPositionRef.current = cameraData;
  }, [enabled, getCameraData, detectMovementType, projectId]); // ✅ Remover viewer

  /**
   * Throttled version para movimiento continuo
   */
  const throttledTrackPosition = useRef(
    throttle((type) => trackCameraPosition(type), throttleMs)
  ).current;

  /**
   * Track zoom específico
   */
  const trackZoom = useCallback((direction) => {
    const cameraData = getCameraData();
    if (!cameraData) return;

    trackEvent('camera_zoomed', {
      project_id: projectId,
      direction, // 'in' o 'out'
      altitude_m: Math.round(cameraData.altitude),
      latitude: cameraData.latitude.toFixed(6),
      longitude: cameraData.longitude.toFixed(6)
    });
  }, [getCameraData, projectId]);

  /**
   * Track home button
   */
  const trackHomeView = useCallback(() => {
    trackEvent('home_view_activated', {
      project_id: projectId,
      trigger: 'button'
    });
  }, [projectId]);

  /**
   * Setup camera tracking
   */
  useEffect(() => {
    console.log('🎥 [Camera] useEffect ejecutado', { 
      hasViewer: !!viewer, 
      enabled, 
      hasCamera: !!viewer?.camera 
    });
    
    if (!viewer || !enabled) {
      console.warn('⚠️ [Camera] Tracking disabled:', { viewer: !!viewer, enabled });
      return;
    }

    console.log('✅ [Camera] Inicializando tracking');

    // Track inicial
    sessionStartRef.current = Date.now();
    if (trackOnMount) {
      console.log('📸 [Camera] Trackeando posición inicial...');
      trackCameraPosition('initial');
    }

    // Listener para cambios de cámara
    const handleCameraChange = () => {
      console.log('📹 [Camera] Camera changed event fired');
      throttledTrackPosition('manual');
    };

    // Cesium camera events
    console.log('🎬 [Camera] Agregando listener a camera.changed');
    viewer.camera.changed.addEventListener(handleCameraChange);

    // Cleanup
    return () => {
      if (viewer && viewer.camera) {
        viewer.camera.changed.removeEventListener(handleCameraChange);
      }
      throttledTrackPosition.cancel();
      
      // Track final session
      if (moveCountRef.current > 0) {
        trackEvent('camera_session_ended', {
          project_id: projectId,
          total_moves: moveCountRef.current,
          session_duration_s: Math.round((Date.now() - sessionStartRef.current) / 1000)
        });
      }
    };
  }, [viewer, enabled, trackOnMount, trackCameraPosition, throttledTrackPosition, projectId]);

  return {
    trackCameraPosition,
    trackZoom,
    trackHomeView,
    getCameraData
  };
};

export default useCameraTracking;
