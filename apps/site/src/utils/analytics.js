/**
 * Analytics Utility - AXSOL Viewer
 * Centraliza el tracking de eventos en PostHog, Customer.io y Segment
 * 
 * @see ANALYTICS_EVENTS_CATALOG.md para lista completa de eventos
 */

import { segmentTrack, customerioTrack } from '@ingeia/analytics';
import { analyticsMonitor } from './analyticsMonitor';

/**
 * Track event en todos los servicios de analytics
 * 
 * @param {string} eventName - Nombre del evento en snake_case (ej: 'layer_toggled')
 * @param {object} properties - Propiedades del evento
 * @param {object} options - Opciones adicionales
 * 
 * @example
 * trackEvent('layer_toggled', {
 *   layer_type: 'fotos',
 *   enabled: true,
 *   project_id: '123'
 * });
 */
export const trackEvent = (eventName, properties = {}, options = {}) => {
  try {
    // Verificar si el evento está habilitado en el monitor
    const isEnabled = analyticsMonitor?.isEventEnabled?.(eventName);
    console.log(`🔍 [Analytics] Verificando evento ${eventName}:`, {
      hasMonitor: !!analyticsMonitor,
      isEnabled,
      monitorFunction: typeof analyticsMonitor?.isEventEnabled
    });
    
    if (analyticsMonitor && !isEnabled) {
      console.log(`🚫 [Analytics] Evento ${eventName} deshabilitado por monitor`);
      return;
    }

    const timestamp = new Date().toISOString();
    
    // Enriquecer con contexto automático
    const enrichedProps = {
      ...properties,
      timestamp,
      app: 'site',
      url: window.location.href,
      path: window.location.pathname,
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      ...options
    };

    // Log en desarrollo (siempre activo para debugging)
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || !import.meta.env.PROD;
    console.log(`📊 [Analytics] ${eventName}`, enrichedProps);

    // Registrar en el monitor ANTES de enviar
    if (analyticsMonitor?.recordEvent) {
      analyticsMonitor.recordEvent(eventName, enrichedProps, 'trackEvent');
    }

    // Segment (CDP principal)
    if (typeof segmentTrack === 'function') {
      segmentTrack(eventName, enrichedProps);
      console.log(`✅ [Analytics] Segment tracked: ${eventName}`);
    } else {
      console.warn('[Analytics] segmentTrack no disponible');
    }

    // Customer.io (Marketing automation)
    if (typeof customerioTrack === 'function') {
      customerioTrack(eventName, enrichedProps);
      console.log(`✅ [Analytics] Customer.io tracked: ${eventName}`);
    } else {
      console.warn('[Analytics] customerioTrack no disponible');
    }

    // PostHog (Product analytics)
    if (window.posthog) {
      console.log(`🎯 [Analytics] PostHog capturando: ${eventName}`);
      window.posthog.capture(eventName, enrichedProps);
      console.log(`✅ [Analytics] PostHog captured: ${eventName}`);
    } else {
      console.error('❌ [Analytics] PostHog NO DISPONIBLE - window.posthog:', window.posthog);
    }

  } catch (error) {
    console.error('[Analytics] Error al trackear evento:', error);
  }
};

/**
 * Track page view
 * Se llama automáticamente en cambios de ruta
 * 
 * @param {string} pageName - Nombre de la página
 * @param {object} properties - Propiedades adicionales
 */
export const trackPageView = (pageName, properties = {}) => {
  trackEvent('page_viewed', {
    page_name: pageName,
    ...properties
  });
};

/**
 * Track timing/performance metric
 * Útil para medir tiempos de carga
 * 
 * @param {string} metricName - Nombre de la métrica
 * @param {number} durationMs - Duración en milisegundos
 * @param {object} properties - Propiedades adicionales
 * 
 * @example
 * const start = performance.now();
 * // ... operación
 * const end = performance.now();
 * trackTiming('viewer_load', end - start, { project_id: '123' });
 */
export const trackTiming = (metricName, durationMs, properties = {}) => {
  trackEvent(`${metricName}_timing`, {
    duration_ms: Math.round(durationMs),
    duration_seconds: (durationMs / 1000).toFixed(2),
    ...properties
  });
};

/**
 * Track error/exception
 * 
 * @param {string} errorName - Nombre del error
 * @param {Error|string} error - Error object o mensaje
 * @param {object} properties - Propiedades adicionales
 */
export const trackError = (errorName, error, properties = {}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : null;
  
  trackEvent(errorName, {
    error_message: errorMessage,
    error_stack: errorStack,
    ...properties
  });
};

/**
 * Helper: Track click en botón/elemento
 * 
 * @param {string} elementName - Nombre del elemento clickeado
 * @param {object} properties - Propiedades adicionales
 */
export const trackClick = (elementName, properties = {}) => {
  trackEvent('element_clicked', {
    element_name: elementName,
    ...properties
  });
};

/**
 * Helper: Track feature usage (primera vez)
 * Verifica localStorage para evitar duplicados
 * 
 * @param {string} featureName - Nombre del feature
 * @param {object} properties - Propiedades adicionales
 */
export const trackFeatureFirstUse = (featureName, properties = {}) => {
  const storageKey = `feature_first_use_${featureName}`;
  
  if (!localStorage.getItem(storageKey)) {
    trackEvent('feature_first_use', {
      feature_name: featureName,
      ...properties
    });
    localStorage.setItem(storageKey, new Date().toISOString());
  }
};

/**
 * Helper: Track session start/end
 */
export const trackSessionStart = () => {
  const sessionStart = new Date().toISOString();
  sessionStorage.setItem('session_start', sessionStart);
  
  trackEvent('session_started', {
    session_start: sessionStart
  });
};

export const trackSessionEnd = () => {
  const sessionStart = sessionStorage.getItem('session_start');
  const sessionEnd = new Date().toISOString();
  
  let sessionDuration = 0;
  if (sessionStart) {
    sessionDuration = new Date(sessionEnd) - new Date(sessionStart);
  }
  
  trackEvent('session_ended', {
    session_end: sessionEnd,
    session_duration_ms: sessionDuration,
    session_duration_minutes: Math.round(sessionDuration / 60000)
  });
  
  sessionStorage.removeItem('session_start');
};

// Auto-track session end on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', trackSessionEnd);
}

export default trackEvent;
