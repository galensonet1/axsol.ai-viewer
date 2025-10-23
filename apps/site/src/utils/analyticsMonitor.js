/**
 * Analytics Monitor - Monitoreo en tiempo real de eventos
 * Detecta automáticamente el estado real de los eventos (no hardcodeado)
 */

// Catálogo de eventos desde el archivo MD
const EVENTS_CATALOG = {
  // Autenticación & Onboarding
  'user_signed_up': { 
    component: 'AppWrapper.jsx + LoginPage.jsx',
    status: 'IMPLEMENTADO',
    category: 'authentication',
    description: 'Usuario nuevo se registra'
  },
  'user_logged_in': { 
    component: 'AppWrapper.jsx + LoginPage.jsx',
    status: 'IMPLEMENTADO',
    category: 'authentication',
    description: 'Usuario existente inicia sesión'
  },
  'login_page_viewed': { 
    component: 'LoginPage.jsx',
    status: 'PENDIENTE',
    category: 'authentication',
    description: 'Se carga LoginPage'
  },
  'login_initiated': { 
    component: 'LoginPage.jsx',
    status: 'PENDIENTE',
    category: 'authentication',
    description: 'Click en botón "Iniciar Sesión"'
  },
  'login_failed': { 
    component: 'Auth0',
    status: 'PENDIENTE',
    category: 'authentication',
    description: 'Error en Auth0'
  },
  'logout_initiated': { 
    component: 'UserMenu.jsx',
    status: 'PENDIENTE',
    category: 'authentication',
    description: 'Usuario cierra sesión'
  },
  'first_project_viewed': { 
    component: 'ProjectLayout.jsx',
    status: 'PENDIENTE',
    category: 'authentication',
    description: 'Nuevo usuario abre primer proyecto'
  },

  // HomePage - Lista de Proyectos
  'home_page_viewed': { 
    component: 'HomePage.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Usuario accede a HomePage'
  },
  'project_clicked': { 
    component: 'ProjectList.jsx + GlobalMap.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Click en proyecto (lista o mapa)'
  },
  'global_map_interacted': { 
    component: 'GlobalMap.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Interacción con mapa global'
  },
  'project_search_used': { 
    component: 'HomePage.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Búsqueda de proyectos'
  },
  'project_filter_applied': { 
    component: 'HomePage.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Filtro aplicado (ej: por estado)'
  },

  // ProjectLayout - Navegación Principal
  'project_loaded': { 
    component: 'ProjectLayout.jsx',
    status: 'PENDIENTE',
    category: 'performance',
    description: 'Proyecto cargado exitosamente'
  },
  'project_load_failed': { 
    component: 'ProjectLayout.jsx',
    status: 'PENDIENTE',
    category: 'performance',
    description: 'Error al cargar proyecto'
  },
  'menu_item_clicked': { 
    component: 'ProjectLayout.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Navegación en menú principal'
  },
  'admin_panel_accessed': { 
    component: 'UserMenu.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Usuario abre panel admin'
  },
  'user_menu_opened': { 
    component: 'UserMenu.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Abre menú de usuario'
  },

  // ProjectVisualizer - Visor 3D (IMPLEMENTADOS)
  'viewer_loaded': { 
    component: 'ProjectVisualizer.jsx',
    status: 'IMPLEMENTADO',
    category: 'performance',
    description: 'Visor 3D cargado'
  },
  'viewer_load_failed': { 
    component: 'ProjectVisualizer.jsx',
    status: 'IMPLEMENTADO',
    category: 'performance',
    description: 'Error al cargar Cesium'
  },
  'entity_clicked': { 
    component: 'ProjectVisualizer.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Click en entidad del mapa con URL y posición GPS (x,y,z)'
  },
  'terrain_toggled': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Activar/desactivar terreno'
  },
  'tileset_loaded': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'performance',
    description: 'Carga de modelo 3D'
  },
  'viewer_fps_low': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'performance',
    description: 'FPS < 30 por > 10s'
  },
  'fullscreen_toggled': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Modo pantalla completa'
  },

  // Navegación de Cámara (IMPLEMENTADOS)
  'camera_moved': { 
    component: 'useCameraTracking.js',
    status: 'IMPLEMENTADO',
    category: 'navigation',
    description: 'Cámara se mueve (throttled 3s)'
  },
  'camera_zoomed': { 
    component: 'useCameraTracking.js',
    status: 'IMPLEMENTADO',
    category: 'navigation',
    description: 'Zoom específico'
  },
  'camera_session_ended': { 
    component: 'useCameraTracking.js',
    status: 'IMPLEMENTADO',
    category: 'navigation',
    description: 'Usuario termina sesión'
  },
  'home_view_activated': { 
    component: 'useCameraTracking.js',
    status: 'IMPLEMENTADO',
    category: 'navigation',
    description: 'Click botón Home'
  },
  'help_button_clicked': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'navigation',
    description: 'Click botón ayuda'
  },
  'scene_mode_changed': { 
    component: 'ProjectVisualizer.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Cambio de modo de escena'
  },

  // Timeline y Animación (IMPLEMENTADOS)
  'timeline_playback_control': { 
    component: 'useTimelineTracking.js',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Play/Pause/Stop'
  },
  'timeline_play_session': { 
    component: 'useTimelineTracking.js',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Fin de reproducción'
  },
  'timeline_speed_changed': { 
    component: 'useTimelineTracking.js',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Cambio de velocidad'
  },
  'timeline_date_jumped': { 
    component: 'useTimelineTracking.js',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Salto a fecha'
  },
  'timeline_loop_toggled': { 
    component: 'useTimelineTracking.js',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Activar/desactivar bucle'
  },

  // LayerSelector - Control de Capas
  'layer_panel_opened': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Abre panel de capas'
  },
  'layer_toggled': { 
    component: 'LayerSelector.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Activar/desactivar capa'
  },
  'layer_group_toggled': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Toggle grupo de capas'
  },
  'ifc_layer_toggled': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Toggle IFC específico'
  },
  'ifc_height_adjusted': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Ajuste de altura de IFC'
  },
  'capture_date_changed': { 
    component: 'LayerSelector.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Cambio de fecha de captura'
  },
  'calendar_opened': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Abre selector de calendario'
  },
  'plan_layer_viewed': { 
    component: 'LayerSelector.jsx',
    status: 'PENDIENTE',
    category: 'interaction',
    description: 'Activar capa Plan de Actividades'
  },

  // MediaLightbox - Galería de Imágenes
  'media_lightbox_opened': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Abrir lightbox con fecha captura'
  },
  'media_lightbox_media_view': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Ver imagen específica en lightbox con datos completos'
  },
  'media_lightbox_closed': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Cerrar lightbox con tiempo de visualización'
  },
  'media_zoomed_in': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Zoom in en imagen'
  },
  'media_zoomed_out': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Zoom out en imagen'
  },
  'media_downloaded': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Descargar imagen con fecha captura'
  },
  'media_fullscreen_toggled': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Toggle pantalla completa con estado'
  },
  'media_thumbnails_toggled': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Toggle miniaturas con estado'
  },
  'media_slideshow_started': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Iniciar presentación automática'
  },
  'media_slideshow_stopped': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Detener presentación automática'
  },
  'media_toolbar_button_clicked': { 
    component: 'MediaLightbox.jsx',
    status: 'IMPLEMENTADO',
    category: 'interaction',
    description: 'Click en cualquier botón del toolbar'
  }
};

class AnalyticsMonitor {
  constructor() {
    this.eventStats = new Map();
    this.eventConfig = this.loadConfig();
    this.listeners = new Set();
    this.isMonitoring = false;
    
    // Interceptar eventos automáticamente
    this.setupInterceptors();
  }

  /**
   * Configurar interceptores para detectar eventos automáticamente
   */
  setupInterceptors() {
    // Interceptar trackEvent calls
    if (window.trackEvent) {
      const originalTrackEvent = window.trackEvent;
      window.trackEvent = (eventName, properties) => {
        this.recordEvent(eventName, properties, 'trackEvent');
        return originalTrackEvent(eventName, properties);
      };
    }

    // Interceptar PostHog
    if (window.posthog) {
      const originalCapture = window.posthog.capture;
      window.posthog.capture = (eventName, properties) => {
        this.recordEvent(eventName, properties, 'posthog');
        return originalCapture.call(window.posthog, eventName, properties);
      };
    }

    // Interceptar Customer.io
    if (window._cio) {
      const originalTrack = window._cio.track;
      window._cio.track = (eventName, properties) => {
        this.recordEvent(eventName, properties, 'customerio');
        return originalTrack.call(window._cio, eventName, properties);
      };
    }

    // Interceptar Segment
    if (window.analytics) {
      const originalTrack = window.analytics.track;
      window.analytics.track = (eventName, properties) => {
        this.recordEvent(eventName, properties, 'segment');
        return originalTrack.call(window.analytics, eventName, properties);
      };
    }

    // Interceptar console.log para detectar eventos en logs
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('[Analytics]') && message.includes('tracked:')) {
        const eventMatch = message.match(/tracked: (\w+)/);
        if (eventMatch) {
          this.recordEvent(eventMatch[1], {}, 'console');
        }
      }
      return originalLog.apply(console, args);
    };

    this.isMonitoring = true;
    console.log('🔍 Analytics Monitor iniciado - interceptando eventos');
  }

  /**
   * Registrar evento detectado
   */
  recordEvent(eventName, properties = {}, source = 'unknown') {
    console.log(`📝 [Monitor] recordEvent llamado:`, { eventName, source, properties });
    const now = new Date();
    const eventKey = eventName;
    
    if (!this.eventStats.has(eventKey)) {
      this.eventStats.set(eventKey, {
        name: eventName,
        count: 0,
        firstSeen: now,
        lastSeen: null,
        sources: new Set(),
        lastProperties: null,
        isEmitting: false
      });
    }

    const stats = this.eventStats.get(eventKey);
    stats.count++;
    stats.lastSeen = now;
    stats.sources.add(source);
    stats.lastProperties = properties;
    stats.isEmitting = true;

    // Marcar como no emitiendo después de 30 segundos
    setTimeout(() => {
      if (stats.lastSeen && (new Date() - stats.lastSeen) > 25000) {
        stats.isEmitting = false;
        this.notifyListeners();
      }
    }, 30000);

    console.log(`📊 [Monitor] Evento detectado: ${eventName} (${source})`);
    this.notifyListeners();
  }

  /**
   * Obtener estado real de todos los eventos
   */
  getEventsStatus() {
    const eventsStatus = [];
    
    for (const [eventName, catalogInfo] of Object.entries(EVENTS_CATALOG)) {
      const stats = this.eventStats.get(eventName);
      const config = this.eventConfig[eventName] || { enabled: true };
      
      eventsStatus.push({
        name: eventName,
        catalogStatus: catalogInfo.status,
        realStatus: this.determineRealStatus(eventName, stats),
        category: catalogInfo.category,
        component: catalogInfo.component,
        description: catalogInfo.description,
        isEnabled: config.enabled !== false,
        isEmitting: stats?.isEmitting || false,
        count: stats?.count || 0,
        lastSeen: stats?.lastSeen,
        firstSeen: stats?.firstSeen,
        sources: stats ? Array.from(stats.sources) : [],
        lastProperties: stats?.lastProperties,
        discrepancy: this.hasDiscrepancy(catalogInfo.status, stats)
      });
    }

    // Agregar eventos detectados que no están en el catálogo
    for (const [eventName, stats] of this.eventStats.entries()) {
      if (!EVENTS_CATALOG[eventName]) {
        eventsStatus.push({
          name: eventName,
          catalogStatus: 'NO_CATALOGADO',
          realStatus: 'DETECTADO',
          category: 'unknown',
          component: 'unknown',
          description: 'Evento detectado pero no catalogado',
          isEnabled: true,
          isEmitting: stats.isEmitting,
          count: stats.count,
          lastSeen: stats.lastSeen,
          firstSeen: stats.firstSeen,
          sources: Array.from(stats.sources),
          lastProperties: stats.lastProperties,
          discrepancy: true
        });
      }
    }

    return eventsStatus.sort((a, b) => {
      // Primero los que tienen discrepancias
      if (a.discrepancy && !b.discrepancy) return -1;
      if (!a.discrepancy && b.discrepancy) return 1;
      // Luego por categoría
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      // Finalmente por nombre
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Determinar estado real basado en detección
   */
  determineRealStatus(eventName, stats) {
    if (!stats) return 'NO_DETECTADO';
    if (stats.count > 0) return 'FUNCIONANDO';
    return 'DETECTADO_SIN_EMITIR';
  }

  /**
   * Verificar si hay discrepancia entre catálogo y realidad
   */
  hasDiscrepancy(catalogStatus, stats) {
    if (catalogStatus === 'IMPLEMENTADO' && !stats) return true;
    if (catalogStatus === 'PENDIENTE' && stats?.count > 0) return true;
    return false;
  }

  /**
   * Verificar si evento está habilitado
   */
  isEventEnabled(eventName) {
    const config = this.eventConfig[eventName];
    const enabled = config?.enabled !== false;
    console.log(`🔍 [Monitor] isEventEnabled(${eventName}):`, {
      config,
      enabled,
      configKeys: Object.keys(this.eventConfig)
    });
    return enabled;
  }

  /**
   * Habilitar/deshabilitar evento
   */
  toggleEvent(eventName, enabled) {
    this.eventConfig[eventName] = {
      ...this.eventConfig[eventName],
      enabled
    };
    this.saveConfig();
    this.notifyListeners();
    console.log(`🎛️ Evento ${eventName} ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  /**
   * Disparar evento de prueba
   */
  testEvent(eventName) {
    const testProperties = {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'analytics_monitor'
    };

    // Usar trackEvent si está disponible
    if (window.trackEvent) {
      window.trackEvent(eventName, testProperties);
    } else {
      // Disparar directamente en cada servicio
      if (window.posthog) {
        window.posthog.capture(eventName, testProperties);
      }
      if (window._cio) {
        window._cio.track(eventName, testProperties);
      }
      if (window.analytics) {
        window.analytics.track(eventName, testProperties);
      }
    }

    console.log(`🧪 Test event disparado: ${eventName}`);
  }

  /**
   * Agregar listener para cambios
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remover listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notificar a todos los listeners
   */
  notifyListeners() {
    for (const callback of this.listeners) {
      try {
        callback(this.getEventsStatus());
      } catch (error) {
        console.error('Error en listener del monitor:', error);
      }
    }
  }

  /**
   * Obtener estadísticas del monitor
   */
  getMonitorStats() {
    const totalEvents = Object.keys(EVENTS_CATALOG).length;
    const detectedEvents = this.eventStats.size;
    const implementedEvents = Object.values(EVENTS_CATALOG).filter(e => e.status === 'IMPLEMENTADO').length;
    const functionalEvents = Array.from(this.eventStats.values()).filter(s => s.count > 0).length;
    
    return {
      totalCatalogEvents: totalEvents,
      detectedEvents,
      implementedInCatalog: implementedEvents,
      actuallyFunctional: functionalEvents,
      discrepancies: this.getEventsStatus().filter(e => e.discrepancy).length,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Exportar datos para análisis
   */
  exportData() {
    return {
      catalog: EVENTS_CATALOG,
      stats: Object.fromEntries(this.eventStats),
      config: this.eventConfig,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Configuración persistente
   */
  saveConfig() {
    localStorage.setItem('analyticsMonitorConfig', JSON.stringify(this.eventConfig));
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('analyticsMonitorConfig');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error cargando config del monitor:', error);
      return {};
    }
  }

  /**
   * Reset del monitor
   */
  reset() {
    this.eventStats.clear();
    this.eventConfig = {};
    this.saveConfig();
    this.notifyListeners();
    console.log('🔄 Analytics Monitor reseteado');
  }
}

// Instancia global del monitor
export const analyticsMonitor = new AnalyticsMonitor();

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
  window.analyticsMonitor = analyticsMonitor;
}

export default analyticsMonitor;
