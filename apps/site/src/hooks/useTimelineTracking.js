/**
 * useTimelineTracking Hook
 * Trackea interacciones con el Timeline de Cesium para analytics
 * 
 * Captura:
 * - Play/Pause/Stop
 * - Cambio de velocidad de animación
 * - Salto a fecha específica
 * - Bucle activado/desactivado
 */

import { useEffect, useRef, useCallback } from 'react';
import { JulianDate } from 'cesium';
import { trackEvent } from '../utils/analytics';

const useTimelineTracking = (viewer, projectId, options = {}) => {
  const {
    enabled = true
  } = options;

  const isPlayingRef = useRef(false);
  const playStartTimeRef = useRef(null);
  const currentMultiplierRef = useRef(1);

  /**
   * Track play/pause
   */
  const trackPlaybackControl = useCallback((action, currentTime = null) => {
    if (!enabled || !viewer) return;

    const clock = viewer.clock;
    if (!clock) return;

    const julianDate = currentTime || clock.currentTime;
    const dateString = JulianDate.toIso8601(julianDate);

    trackEvent('timeline_playback_control', {
      project_id: projectId,
      action, // 'play', 'pause', 'stop'
      current_date: dateString,
      multiplier: clock.multiplier,
      should_animate: clock.shouldAnimate
    });

    if (action === 'play') {
      playStartTimeRef.current = Date.now();
      isPlayingRef.current = true;
    } else if (action === 'pause' || action === 'stop') {
      if (isPlayingRef.current && playStartTimeRef.current) {
        const playDuration = Date.now() - playStartTimeRef.current;
        trackEvent('timeline_play_session', {
          project_id: projectId,
          play_duration_ms: playDuration,
          play_duration_seconds: Math.round(playDuration / 1000)
        });
      }
      isPlayingRef.current = false;
      playStartTimeRef.current = null;
    }
  }, [enabled, viewer, projectId]);

  /**
   * Track cambio de velocidad (multiplier)
   */
  const trackSpeedChange = useCallback((newMultiplier) => {
    if (!enabled) return;

    trackEvent('timeline_speed_changed', {
      project_id: projectId,
      previous_multiplier: currentMultiplierRef.current,
      new_multiplier: newMultiplier,
      multiplier_change: newMultiplier / currentMultiplierRef.current
    });

    currentMultiplierRef.current = newMultiplier;
  }, [enabled, projectId]);

  /**
   * Track salto a fecha específica
   */
  const trackDateJump = useCallback((targetDate, source = 'manual') => {
    if (!enabled || !viewer) return;

    const clock = viewer.clock;
    const previousDate = JulianDate.toIso8601(clock.currentTime);
    const newDate = JulianDate.toIso8601(targetDate);

    trackEvent('timeline_date_jumped', {
      project_id: projectId,
      source, // 'manual', 'calendar', 'slider', 'button'
      previous_date: previousDate,
      new_date: newDate
    });
  }, [enabled, viewer, projectId]);

  /**
   * Track activación de bucle
   */
  const trackLoopToggle = useCallback((enabled) => {
    trackEvent('timeline_loop_toggled', {
      project_id: projectId,
      loop_enabled: enabled
    });
  }, [projectId]);

  /**
   * Setup timeline tracking
   */
  useEffect(() => {
    console.log('[useTimelineTracking] Inicializando hook:', { 
      hasViewer: !!viewer, 
      enabled, 
      hasClock: !!viewer?.clock,
      projectId 
    });
    
    if (!viewer || !enabled || !viewer.clock) {
      console.log('[useTimelineTracking] Hook no inicializado - falta viewer o clock');
      return;
    }

    console.log('[useTimelineTracking] ✅ Hook inicializado correctamente');
    const clock = viewer.clock;
    
    // Guardar estado inicial
    currentMultiplierRef.current = clock.multiplier;
    isPlayingRef.current = clock.shouldAnimate;

    // Listeners para cambios en el clock
    let previousMultiplier = clock.multiplier;
    let previousShouldAnimate = clock.shouldAnimate;

    const handleClockTick = () => {
      // Detectar cambios de velocidad
      if (clock.multiplier !== previousMultiplier) {
        console.log('[useTimelineTracking] 🎬 Cambio de velocidad detectado:', previousMultiplier, '->', clock.multiplier);
        trackSpeedChange(clock.multiplier);
        previousMultiplier = clock.multiplier;
      }

      // Detectar play/pause
      if (clock.shouldAnimate !== previousShouldAnimate) {
        console.log('[useTimelineTracking] ⏯️ Cambio de reproducción detectado:', previousShouldAnimate, '->', clock.shouldAnimate);
        if (clock.shouldAnimate) {
          trackPlaybackControl('play', clock.currentTime);
        } else {
          trackPlaybackControl('pause', clock.currentTime);
        }
        previousShouldAnimate = clock.shouldAnimate;
      }
    };

    // Tick del clock
    const removeTickListener = clock.onTick.addEventListener(handleClockTick);

    // Cleanup
    return () => {
      if (removeTickListener) {
        removeTickListener();
      }
      
      // Si estaba reproduciendo, trackear sesión final
      if (isPlayingRef.current && playStartTimeRef.current) {
        const playDuration = Date.now() - playStartTimeRef.current;
        trackEvent('timeline_play_session', {
          project_id: projectId,
          play_duration_ms: playDuration,
          play_duration_seconds: Math.round(playDuration / 1000)
        });
      }
    };
  }, [viewer, enabled, trackSpeedChange, trackPlaybackControl, projectId]);

  return {
    trackPlaybackControl,
    trackSpeedChange,
    trackDateJump,
    trackLoopToggle
  };
};

export default useTimelineTracking;
