# 🚀 Guía de Implementación de Analytics

**Objetivo:** Implementar tracking de eventos en AXSOL Viewer de forma consistente y escalable.

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Ejemplos de Implementación por Componente](#ejemplos-de-implementación-por-componente)
3. [Testing de Eventos](#testing-de-eventos)
4. [Best Practices](#best-practices)
5. [Checklist de Implementación](#checklist-de-implementación)

---

## Setup Inicial

### 1. Utility ya creado ✅

El archivo `src/utils/analytics.js` está listo con las siguientes funciones:

```javascript
import { trackEvent, trackPageView, trackTiming, trackError, trackFeatureFirstUse } from '../utils/analytics';
```

### 2. Configuración en .env

Verificar que existan estas variables (ya configuradas):

```bash
VITE_POSTHOG_KEY=...
VITE_CUSTOMERIO_SITE_ID=...
VITE_SEGMENT_WRITE_KEY=...
```

---

## Ejemplos de Implementación por Componente

### 📁 **1. LayerSelector.jsx** - Control de Capas

**Eventos a trackear:**
- `layer_panel_opened`
- `layer_toggled`
- `capture_date_changed`
- `plan_layer_viewed`

```javascript
// apps/site/src/components/LayerSelector.jsx
import React, { useState, useEffect } from 'react';
import { trackEvent, trackFeatureFirstUse } from '../utils/analytics';

const LayerSelector = ({ projectId, layerVisibility, onLayerVisibilityChange, ... }) => {
  
  // Track cuando se abre el panel
  const handlePanelToggle = (isOpen) => {
    if (isOpen) {
      trackEvent('layer_panel_opened', {
        project_id: projectId
      });
    }
    onToggle(isOpen);
  };

  // Track al activar/desactivar capa
  const handleLayerChange = (event) => {
    const layerType = event.target.name;
    const enabled = event.target.checked;
    
    // Track evento
    trackEvent('layer_toggled', {
      layer_type: layerType,
      enabled,
      project_id: projectId
    });
    
    // Track primera vez que usa plan de actividades
    if (layerType === 'plan' && enabled) {
      trackFeatureFirstUse('plan_layer', { project_id: projectId });
      
      trackEvent('plan_layer_viewed', {
        project_id: projectId,
        plan_url: hasActivityPlan ? 'exists' : 'not_found'
      });
    }
    
    // Track primera vez que usa fotos 360
    if (layerType === 'fotos360' && enabled) {
      trackFeatureFirstUse('photos_360', { project_id: projectId });
    }
    
    // Update state
    onLayerVisibilityChange({
      ...layerVisibility,
      [layerType]: enabled,
    });
  };

  // Track cambio de fecha
  const handleDateChange = (newDate) => {
    trackEvent('capture_date_changed', {
      previous_date: selectedCaptureDate,
      new_date: newDate,
      project_id: projectId
    });
    
    onCaptureDateChange(newDate);
  };

  return (
    <Paper>
      <IconButton onClick={() => handlePanelToggle(!open)}>
        {/* ... */}
      </IconButton>
      
      <FormControlLabel
        control={
          <Checkbox
            name="plan"
            checked={!!layerVisibility.plan}
            onChange={handleLayerChange}
          />
        }
        label="Plan de Actividades"
      />
      
      {/* ... más capas ... */}
    </Paper>
  );
};

export default LayerSelector;
```

---

### 📁 **2. ProjectVisualizer.jsx** - Visor 3D Principal

**Eventos a trackear:**
- `viewer_loaded` / `viewer_load_failed`
- `entity_clicked`
- `tileset_loaded`
- **🆕 `camera_moved`** - Navegación del usuario
- **🆕 `timeline_playback_control`** - Play/Pause timeline
- **🆕 `home_view_activated`** - Botón Home

```javascript
// apps/site/src/components/ProjectVisualizer.jsx
import { trackEvent, trackTiming, trackError } from '../utils/analytics';
import useCameraTracking from '../hooks/useCameraTracking';
import useTimelineTracking from '../hooks/useTimelineTracking';

const ProjectVisualizer = ({ projectId }) => {
  const [cesiumViewer, setCesiumViewer] = useState(null);
  
  // 🆕 HOOKS DE TRACKING
  // Trackea automáticamente movimiento de cámara (throttled 3s)
  const { trackHomeView } = useCameraTracking(cesiumViewer, projectId, {
    throttleMs: 3000,  // Track cada 3 segundos max
    trackOnMount: true // Track posición inicial
  });
  
  // Trackea automáticamente controles del timeline
  useTimelineTracking(cesiumViewer, projectId);
  
  // Track carga del viewer
  useEffect(() => {
    const startTime = performance.now();
    
    const loadViewer = async () => {
      try {
        // ... código de carga del viewer ...
        
        const loadTime = performance.now() - startTime;
        
        trackTiming('viewer_load', loadTime, {
          project_id: projectId,
          cesium_version: Cesium.VERSION
        });
        
        trackEvent('viewer_loaded', {
          project_id: projectId,
          load_time_ms: Math.round(loadTime)
        });
        
      } catch (error) {
        trackError('viewer_load_failed', error, {
          project_id: projectId
        });
        
        console.error('Error loading viewer:', error);
      }
    };
    
    loadViewer();
  }, [projectId]);

  // Track click en entidades
  const handleEntityClick = (entity) => {
    if (!entity) return;
    
    const entityType = entity._axsolLayerKey || 'unknown';
    
    trackEvent('entity_clicked', {
      entity_type: entityType,
      entity_id: entity.id,
      entity_name: entity.name,
      project_id: projectId
    });
    
    // Si es primera vez que clickea una foto 360
    if (entityType === 'fotos360') {
      trackFeatureFirstUse('photo360_click', { project_id: projectId });
    }
    
    setSelectedElement({ type: entityType, data: entity, entity });
  };

  // Track carga de tileset 3D
  const handleTilesetReady = (tileset) => {
    trackEvent('tileset_loaded', {
      tileset_type: '3dtile',
      project_id: projectId
    });
  };
  
  // 🆕 Personalizar botón Home para trackear
  useEffect(() => {
    if (!cesiumViewer?.homeButton) return;
    
    const originalCommand = cesiumViewer.homeButton.viewModel.command.func;
    
    cesiumViewer.homeButton.viewModel.command.func = () => {
      trackHomeView(); // Track evento
      originalCommand(); // Ejecutar función original
    };
  }, [cesiumViewer, trackHomeView]);

  return (
    <Viewer 
      ref={(ref) => setCesiumViewer(ref?.cesiumElement)}
      onSelectedEntityChange={handleEntityClick}
      timeline={true}
      animation={true}
      homeButton={true}
      navigationHelpButton={true}
    >
      {/* ... */}
    </Viewer>
  );
};
```

**🎯 Datos que se capturan automáticamente:**

Con `useCameraTracking`:
- ✅ Posición (lat, lon, altitud)
- ✅ Orientación (heading, pitch, roll)
- ✅ Tipo de movimiento (zoom, pan, rotate, tilt)
- ✅ Distancia recorrida
- ✅ Número de movimientos en la sesión

Con `useTimelineTracking`:
- ✅ Play/Pause/Stop automático
- ✅ Duración de reproducción
- ✅ Cambios de velocidad (multiplier)
- ✅ Saltos de fecha

---

### 📁 **3. ViewerToolBar.jsx** - Herramientas

**Eventos a trackear:**
- `toolbar_tool_selected`
- `measurement_created`
- `measurements_cleared`

```javascript
// apps/site/src/components/ViewerToolBar.jsx
import { trackEvent, trackFeatureFirstUse } from '../utils/analytics';

const ViewerToolBar = ({ onToolSelect, hasMeasurements, onClearMeasurements }) => {
  
  const handleToolSelect = (tool, subType = null) => {
    trackEvent('toolbar_tool_selected', {
      tool,
      sub_type: subType
    });
    
    // Track primera vez que usa mediciones
    if (tool === 'measure') {
      trackFeatureFirstUse('measurement_tool', { measurement_type: subType });
    }
    
    // Track primera vez que usa comparación
    if (tool === 'compare') {
      trackFeatureFirstUse('comparison_mode');
    }
    
    onToolSelect?.(tool, subType);
  };

  const handleClearMeasurements = () => {
    // Asumiendo que podemos contar las mediciones
    const measurementCount = /* obtener count de mediciones */;
    
    trackEvent('measurements_cleared', {
      count: measurementCount,
      project_id: /* obtener projectId */
    });
    
    onClearMeasurements?.();
  };

  return (
    <Box className="viewer-toolbar">
      <Tooltip title="Asistente IA">
        <IconButton onClick={() => handleToolSelect('ai-assistant')}>
          <SmartToyIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Medir">
        <IconButton onClick={(e) => setMeasureAnchor(e.currentTarget)}>
          <StraightenIcon />
        </IconButton>
      </Tooltip>
      
      <Menu anchorEl={measureAnchor} open={Boolean(measureAnchor)}>
        <MenuItem onClick={() => handleToolSelect('measure', 'line')}>
          Medir Línea
        </MenuItem>
        <MenuItem onClick={() => handleToolSelect('measure', 'area')}>
          Medir Área
        </MenuItem>
        {hasMeasurements && (
          <MenuItem onClick={handleClearMeasurements}>
            Borrar Mediciones
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};
```

---

### 📁 **4. ComparisonModal.jsx** - Modo Comparación

**Eventos a trackear:**
- `comparison_mode_opened`
- `comparison_dates_selected`
- `comparison_slider_moved`

```javascript
// apps/site/src/components/ComparisonModal.jsx
import { trackEvent } from '../utils/analytics';

const ComparisonModal = ({ open, onClose }) => {
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Track apertura
  useEffect(() => {
    if (open) {
      const startTime = Date.now();
      setSessionStartTime(startTime);
      
      trackEvent('comparison_mode_opened', {
        project_id: projectId
      });
    } else if (sessionStartTime) {
      // Track cierre con duración
      const sessionDuration = Date.now() - sessionStartTime;
      
      trackEvent('comparison_mode_closed', {
        session_duration_seconds: Math.round(sessionDuration / 1000),
        project_id: projectId
      });
      
      setSessionStartTime(null);
    }
  }, [open]);

  // Track selección de fechas
  const handleDateSelect = (side, date) => {
    if (side === 'left') setLeftSelectedDate(date);
    if (side === 'right') setRightSelectedDate(date);
    
    // Solo trackear cuando ambas fechas estén seleccionadas
    if ((side === 'right' && leftSelectedDate) || (side === 'left' && rightSelectedDate)) {
      const left = side === 'left' ? date : leftSelectedDate;
      const right = side === 'right' ? date : rightSelectedDate;
      
      const dateDiff = Math.abs(new Date(right) - new Date(left)) / (1000 * 60 * 60 * 24);
      
      trackEvent('comparison_dates_selected', {
        left_date: left,
        right_date: right,
        date_diff_days: Math.round(dateDiff),
        project_id: projectId
      });
    }
  };

  // Track movimiento del slider
  const handleSliderMove = (position) => {
    // Throttle para no trackear cada pixel
    const throttledTrack = useCallback(
      _.throttle((pos) => {
        trackEvent('comparison_slider_moved', {
          slider_position_percent: Math.round(pos),
          project_id: projectId
        });
      }, 2000), // Solo trackear cada 2 segundos
      []
    );
    
    throttledTrack(position);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      {/* ... */}
    </Dialog>
  );
};
```

---

### 📁 **5. MediaLightbox.jsx** - Galería de Imágenes

**Eventos a trackear:**
- `media_lightbox_opened`
- `media_navigation`
- `photo360_interacted`

```javascript
// apps/site/src/components/MediaLightbox.jsx
import { trackEvent, trackFeatureFirstUse } from '../utils/analytics';

const MediaLightbox = ({ open, media, currentIndex, onClose, onNavigate }) => {
  const [openedAt, setOpenedAt] = useState(null);
  
  // Track apertura
  useEffect(() => {
    if (open && media) {
      const now = Date.now();
      setOpenedAt(now);
      
      const mediaType = media.type || 'photo'; // 'photo' o 'photo360'
      
      trackEvent('media_lightbox_opened', {
        media_type: mediaType,
        media_id: media.id,
        source: media.source || 'marker_click',
        project_id: media.projectId
      });
      
      // Track primera vez que ve foto 360
      if (mediaType === 'photo360') {
        trackFeatureFirstUse('photo360_view', {
          media_id: media.id
        });
      }
    }
  }, [open, media]);

  // Track navegación
  const handleNavigate = (direction) => {
    trackEvent('media_navigation', {
      direction,
      current_index: currentIndex,
      total_media: /* total de medios */,
      media_type: media?.type
    });
    
    onNavigate(direction);
  };

  // Track interacción con foto 360
  const handlePhoto360Interact = (action) => {
    trackEvent('photo360_interacted', {
      action, // 'pan', 'zoom', 'rotate'
      media_id: media.id
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      {media?.type === 'photo360' ? (
        <PannellumViewer 
          onPan={() => handlePhoto360Interact('pan')}
          onZoom={() => handlePhoto360Interact('zoom')}
        />
      ) : (
        <img src={media?.url} />
      )}
      
      <IconButton onClick={() => handleNavigate('previous')}>
        <ArrowBack />
      </IconButton>
      <IconButton onClick={() => handleNavigate('next')}>
        <ArrowForward />
      </IconButton>
    </Dialog>
  );
};
```

---

## Testing de Eventos

### 1. **Verificar en Consola del Navegador**

En desarrollo, los eventos se logean automáticamente:

```
📊 [Analytics] layer_toggled { layer_type: 'fotos', enabled: true, project_id: '1', timestamp: '2025-10-19...' }
```

### 2. **Verificar en PostHog Dashboard**

1. Ir a https://app.posthog.com/
2. Live Events → Buscar tu evento
3. Verificar propiedades

### 3. **Verificar en Customer.io**

1. Ir a https://fly.customer.io/
2. People → Buscar tu usuario por email
3. Ver timeline de eventos

### 4. **Script de Test Automatizado**

```javascript
// Ejecutar en consola del navegador
const testEvents = async () => {
  const { trackEvent } = await import('./src/utils/analytics.js');
  
  // Test 1: Layer toggle
  trackEvent('layer_toggled', {
    layer_type: 'fotos',
    enabled: true,
    project_id: '1'
  });
  
  // Test 2: Entity clicked
  trackEvent('entity_clicked', {
    entity_type: 'photo',
    entity_id: '123',
    project_id: '1'
  });
  
  console.log('✅ Test events enviados. Verificar en PostHog/Customer.io');
};

testEvents();
```

---

## Best Practices

### 1. **Naming Conventions**

✅ **Usar snake_case para eventos y propiedades**
```javascript
trackEvent('layer_toggled', { layer_type: 'fotos', enabled: true });
```

❌ **NO usar camelCase o PascalCase**
```javascript
trackEvent('LayerToggled', { layerType: 'fotos', enabled: true }); // MAL
```

### 2. **Propiedades Consistentes**

Siempre incluir:
- `project_id` (cuando aplique)
- `timestamp` (se agrega automáticamente)
- Contexto relevante

### 3. **No Trackear Información Sensible**

❌ **NO trackear:**
- Contraseñas
- Tokens de autenticación
- Datos personales no necesarios (GDPR)

✅ **SÍ trackear:**
- IDs de entidades
- Nombres de features
- Métricas de uso

### 4. **Throttle para Eventos Frecuentes**

Para eventos que se disparan constantemente (ej: movimiento de cámara):

```javascript
import { throttle } from 'lodash';

const throttledTrack = throttle((position) => {
  trackEvent('camera_moved', { position });
}, 5000); // Solo cada 5 segundos

camera.onChange(() => throttledTrack(camera.position));
```

### 5. **Error Handling**

```javascript
try {
  // Operación que puede fallar
  await loadTileset();
} catch (error) {
  trackError('tileset_load_failed', error, {
    project_id: projectId,
    tileset_id: tilesetId
  });
  // Re-throw si es necesario
}
```

---

## Checklist de Implementación

### **Fase 1: Setup** ✅ COMPLETADA

- [x] Crear `src/utils/analytics.js`
- [x] Crear `src/hooks/useCameraTracking.js`
- [x] Crear `src/hooks/useTimelineTracking.js`
- [ ] Verificar `.env` con API keys (PostHog, Customer.io, Segment)
- [x] Importar en componentes principales

### **Fase 2: Eventos Core (Prioridad Alta)** ✅ COMPLETADA

**A. Performance & Carga**
- [x] `viewer_loaded` / `viewer_load_failed` en ProjectVisualizer
- [x] `entity_clicked` en ProjectVisualizer

**B. Navegación (Tracking Automático)**
- [x] `camera_moved` en ProjectVisualizer (via `useCameraTracking`)
- [x] `camera_zoomed` en ProjectVisualizer (via `useCameraTracking`)
- [x] `camera_session_ended` en ProjectVisualizer (via `useCameraTracking`)
- [x] `home_view_activated` en ProjectVisualizer

**C. Timeline (Tracking Automático)**
- [x] `timeline_playback_control` en ProjectVisualizer (via `useTimelineTracking`)
- [x] `timeline_play_session` en ProjectVisualizer (via `useTimelineTracking`)
- [x] `timeline_speed_changed` en ProjectVisualizer (via `useTimelineTracking`)
- [x] `timeline_date_jumped` en ProjectVisualizer (via `useTimelineTracking`)
- [x] `timeline_loop_toggled` en ProjectVisualizer (via `useTimelineTracking`)

**D. Interacción con Capas**
- [x] `layer_toggled` en LayerSelector
- [x] `capture_date_changed` en LayerSelector

**E. Contenido**
- [x] `media_lightbox_opened` en MediaLightbox

**Pendientes para Fase 3:**
- [ ] `measurement_created` en ViewerToolBar
- [ ] `comparison_mode_opened` en ComparisonModal

**Resultado:** ✅ 17 eventos implementados (~17% del total)  
**Tiempo real:** 2-3 horas (gracias a hooks automáticos)

### **Fase 3: Testing & Dashboards** ⏳ EN PROGRESO (70% COMPLETO)

**Validación Técnica:**
- [x] Verificar eventos en consola del navegador (dev mode) ✅
- [x] Verificar eventos en PostHog Live Events ✅
- [x] Confirmar que no hay errores de JavaScript ✅
- [x] Validar performance del tracking (no degrada UX) ✅
- [ ] Verificar eventos en Customer.io People Timeline (pending)

**Dashboards en PostHog:**
- [ ] Viewer Performance Dashboard
  - [ ] Load times histogram
  - [ ] Error rate over time
  - [ ] Tileset load performance
- [ ] User Navigation Dashboard
  - [ ] Camera movements heatmap
  - [ ] Zoom patterns (altitude distribution)
  - [ ] Session duration trends
- [ ] Feature Adoption Dashboard
  - [ ] Layer activation funnel
  - [ ] Timeline usage metrics
  - [ ] 360 viewer adoption rate
- [ ] Engagement Metrics Dashboard
  - [ ] Daily active users
  - [ ] Actions per session
  - [ ] Feature usage matrix

**Campaigns en Customer.io:**
- [ ] Welcome Series
  - [ ] Email 1: Bienvenida + tutorial básico
  - [ ] Email 2: Features principales (timeline, capas)
  - [ ] Email 3: Tips avanzados (fotos 360, mediciones)
- [ ] Feature Discovery
  - [ ] Timeline not used → Enviar tutorial
  - [ ] 360 viewer not used → Showcase
- [ ] Re-engagement
  - [ ] 7 días inactivo → Recordatorio
  - [ ] 30 días inactivo → Feature updates

**Estimación:** 1-2 días  
**Prioridad:** ALTA - Ver guías: `POSTHOG_DASHBOARDS_GUIDE.md` y `CUSTOMERIO_CAMPAIGNS_GUIDE.md`

### **Fase 4: Eventos Secundarios** ⏸️ PENDIENTE

**A. Navegación y Menús**
- [ ] `project_clicked` en HomePage/ProjectList
- [ ] `menu_item_clicked` en ProjectLayout
- [ ] `home_page_viewed` en HomePage

**B. Performance Metrics**
- [ ] `tileset_loaded` en ProjectVisualizer (con timing)
- [ ] `viewer_fps_low` en ProjectVisualizer (monitor FPS)
- [ ] `project_loaded` en ProjectLayout (con timing)

**C. Herramientas** (ViewerToolBar)
- [ ] `measurement_created` (point, line, area)
- [ ] `measurements_cleared`
- [ ] `comparison_mode_activated`

**D. Features Avanzados**
- [ ] `ai_assistant_opened` en ViewerToolBar
- [ ] `view_shared` en compartir vista
- [ ] `dashboard_viewed` en ProjectDashboard

**Estimación:** 2-3 días  
**Nota:** Implementar después de validar Fase 3

---

## 📊 Estado Actual de Implementación

### **Progreso General**

| Fase | Estado | Tareas | Completado |
|------|--------|---------|------------|
| Fase 1: Setup | ✅ | 3 hooks/utils | 100% |
| Fase 2: Core Events | ✅ | 17 eventos | 100% |
| Fase 3: Testing | ⏳ | Validación + Dashboards | 70% |
| Fase 4: Secundarios | ⏸️ | ~20 eventos | 0% |
| **TOTAL** | **⏳** | **Fase 1-3** | **90%** |

### **Desglose por Componente**

| Componente | Implementados | Pendientes | % |
|------------|---------------|------------|---|
| ProjectVisualizer | 13 | 8 | 62% |
| LayerSelector | 2 | 6 | 25% |
| MediaLightbox | 1 | 5 | 17% |
| ViewerToolBar | 0 | 6 | 0% |
| HomePage | 0 | 5 | 0% |
| ComparisonModal | 0 | 6 | 0% |
| Otros | 2 | 66 | 3% |

### **Archivos Modificados**

✅ **Creados:**
- `apps/site/src/hooks/useCameraTracking.js` (200 líneas)
- `apps/site/src/hooks/useTimelineTracking.js` (150 líneas)
- `FASE_1_IMPLEMENTATION_SUMMARY.md`

✅ **Modificados:**
- `apps/site/src/components/ProjectVisualizer.jsx` (+50 líneas)
- `apps/site/src/components/LayerSelector.jsx` (+30 líneas)
- `apps/site/src/components/MediaLightbox.jsx` (+20 líneas)
- `ANALYTICS_EVENTS_CATALOG.md` (estados actualizados)

---

## 🎯 Objetivo Final

**Al completar todas las fases:**

1. ✅ Todos los eventos core están trackeados (Fase 2 ✅)
2. ⏳ Dashboards en PostHog muestran uso en tiempo real (Fase 3)
3. ⏳ Customer.io tiene campaigns activas de onboarding (Fase 3)
4. ⏸️ Equipo sabe cómo agregar nuevos eventos (Fase 4)

**Resultado esperado:**
- 📊 **Visibilidad completa** del uso del producto
- 🎯 **Data-driven decisions** para product roadmap
- 💌 **Automatización** de comunicación con usuarios
- 🚀 **Product-Led Growth** estrategia en marcha

**Estado actual:**
- ✅ **Eventos core implementados** (17/102)
- ✅ **Tracking automático** de navegación y timeline
- ⏳ **Pendiente:** Testing y validación
- 🎯 **Siguiente paso:** Verificar eventos en PostHog

---

## 📞 Soporte

**Dudas sobre implementación:**
- Ver `ANALYTICS_EVENTS_CATALOG.md` para lista completa de eventos
- Revisar código de ejemplo en esta guía
- Consultar documentación de PostHog/Customer.io

**Testing:**
- Usar consola del navegador en modo desarrollo
- PostHog Live Events: eventos en tiempo real
- Customer.io People: timeline por usuario

---

**🎉 ¡Comienza a trackear y a crecer con data!**
