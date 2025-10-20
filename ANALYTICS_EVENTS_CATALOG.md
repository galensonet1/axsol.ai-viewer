# 📊 Catálogo de Eventos de Analytics - AXSOL Viewer
## Product-Led Growth Strategy con Customer.io

**Última actualización:** 19 Oct 2025  
**Stack de Analytics:** PostHog + Customer.io + Segment + Microsoft Clarity

---

## 🎯 Objetivos de Product Analytics

1. **Activación:** Medir onboarding y first-time user experience
2. **Engagement:** Identificar features más usadas
3. **Retención:** Detectar usuarios inactivos para re-engagement
4. **Conversion:** Optimizar funnel desde signup hasta power user
5. **Product-Market Fit:** Descubrir patrones de uso exitoso

---

## 📋 Índice de Componentes

1. [Autenticación & Onboarding](#1-autenticación--onboarding)
2. [HomePage - Lista de Proyectos](#2-homepage---lista-de-proyectos)
3. [ProjectLayout - Navegación Principal](#3-projectlayout---navegación-principal)
4. [ProjectVisualizer - Visor 3D](#4-projectvisualizer---visor-3d)
5. [LayerSelector - Control de Capas](#5-layerselector---control-de-capas)
6. [ViewerToolBar - Herramientas](#6-viewertoolbar---herramientas)
7. [InfoBox - Información de Entidades](#7-infobox---información-de-entidades)
8. [MediaLightbox - Galería de Imágenes](#8-medialightbox---galería-de-imágenes)
9. [ComparisonModal - Modo Comparación](#9-comparisonmodal---modo-comparación)
10. [DateSelector - Selector de Fechas](#10-dateselector---selector-de-fechas)
11. [ProjectDashboard - KPIs](#11-projectdashboard---kpis)
12. [CzmlUploader - Subida de Archivos](#12-czmluploader---subida-de-archivos)

---

## 1. Autenticación & Onboarding

### **Componente:** `AppWrapper.jsx` + `LoginPage.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ✅ | **IMPLEMENTADO** | `user_signed_up` | `app`, `email`, `name`, `roles`, `timestamp`, `source` | Usuario nuevo se registra | Activación |
| ✅ | **IMPLEMENTADO** | `user_logged_in` | `app`, `email`, `roles`, `timestamp` | Usuario existente inicia sesión | Engagement |
| ❌ | **PENDIENTE** | `login_page_viewed` | `referrer`, `utm_source`, `utm_campaign` | Se carga LoginPage | Adquisición |
| ❌ | **PENDIENTE** | `login_initiated` | `method: 'auth0'` | Click en botón "Iniciar Sesión" | Conversion |
| ❌ | **PENDIENTE** | `login_failed` | `error`, `error_description` | Error en Auth0 | Troubleshooting |
| ❌ | **PENDIENTE** | `logout_initiated` | `session_duration` | Usuario cierra sesión | Engagement |
| ❌ | **PENDIENTE** | `first_project_viewed` | `project_id`, `project_name`, `time_since_signup` | Nuevo usuario abre primer proyecto | Activación |

**Customer.io Trigger:**
- `user_signed_up` → Enviar email de bienvenida + onboarding
- `user_logged_in` → Si no ha usado en 30 días → email de reactivación
- `first_project_viewed` → Email: "¡Felicitaciones! Primeros pasos en AXSOL"

---

## 2. HomePage - Lista de Proyectos

### **Componente:** `HomePage.jsx` + `ProjectList.jsx` + `GlobalMap.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `home_page_viewed` | `projects_count`, `user_role` | Usuario accede a HomePage | Engagement |
| ❌ | **PENDIENTE** | `project_clicked` | `project_id`, `project_name`, `source: 'list' \| 'map'` | Click en proyecto (lista o mapa) | Engagement |
| ❌ | **PENDIENTE** | `global_map_interacted` | `action: 'zoom' \| 'pan' \| 'marker_click'` | Interacción con mapa global | Feature Usage |
| ❌ | **PENDIENTE** | `project_search_used` | `search_query`, `results_count` | Búsqueda de proyectos | Feature Usage |
| ❌ | **PENDIENTE** | `project_filter_applied` | `filter_type`, `filter_value` | Filtro aplicado (ej: por estado) | Feature Usage |

**Customer.io Trigger:**
- Si usuario no abre proyecto en 7 días → "¿Tienes problemas? Te ayudamos"
- Si `projects_count` = 0 → "Crea tu primer proyecto"

---

## 3. ProjectLayout - Navegación Principal

### **Componente:** `ProjectLayout.jsx` + `UserMenu.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `project_loaded` | `project_id`, `project_name`, `load_time_ms` | Proyecto cargado exitosamente | Performance |
| ❌ | **PENDIENTE** | `project_load_failed` | `project_id`, `error` | Error al cargar proyecto | Troubleshooting |
| ❌ | **PENDIENTE** | `menu_item_clicked` | `menu_item: 'viewer' \| 'dashboard' \| 'inicio'`, `project_id` | Navegación en menú principal | Navigation |
| ❌ | **PENDIENTE** | `admin_panel_accessed` | `user_role` | Usuario abre panel admin | Feature Usage |
| ❌ | **PENDIENTE** | `user_menu_opened` | - | Abre menú de usuario | Engagement |

**Customer.io Trigger:**
- `project_load_failed` (3+ veces) → Alerta a soporte + email usuario
- `admin_panel_accessed` → Track admin activity para upsell

---

## 4. ProjectVisualizer - Visor 3D

### **Componente:** `ProjectVisualizer.jsx`

#### **4.1 Carga y Configuración del Visor**

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ✅ | **IMPLEMENTADO** | `viewer_loaded` | `project_id`, `cesium_version`, `load_time_ms` | Visor 3D cargado | Performance |
| ✅ | **IMPLEMENTADO** | `viewer_load_failed` | `project_id`, `error` | Error al cargar Cesium | Troubleshooting |
| ✅ | **IMPLEMENTADO** | `entity_clicked` | `entity_type: 'photo' \| 'photo360' \| 'plan' \| 'ifc'`, `entity_id`, `project_id` | Click en entidad 3D | Feature Usage |
| ❌ | **PENDIENTE** | `terrain_toggled` | `terrain_enabled: true \| false` | Activar/desactivar terreno | Feature Usage |
| ❌ | **PENDIENTE** | `tileset_loaded` | `tileset_type: '3dtile'`, `asset_id`, `load_time_ms` | Carga de modelo 3D | Performance |
| ❌ | **PENDIENTE** | `viewer_fps_low` | `avg_fps`, `duration_seconds` | FPS < 30 por > 10s | Performance Issue |
| ❌ | **PENDIENTE** | `fullscreen_toggled` | `fullscreen_enabled: true \| false` | Modo pantalla completa | Feature Usage |

#### **4.2 Navegación de Cámara** 🆕

**Hook:** `useCameraTracking.js`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ✅ | **IMPLEMENTADO** | `camera_moved` | `movement_type: 'zoom' \| 'pan' \| 'rotate' \| 'tilt' \| 'adjust'`, `latitude`, `longitude`, `altitude_m`, `heading_deg`, `pitch_deg`, `roll_deg`, `move_count`, `distance_moved_m`, `session_duration_s` | Cámara se mueve (throttled 3s) | Navigation Pattern |
| ✅ | **IMPLEMENTADO** | `camera_zoomed` | `direction: 'in' \| 'out'`, `altitude_m`, `latitude`, `longitude` | Zoom específico | Navigation |
| ✅ | **IMPLEMENTADO** | `camera_session_ended` | `total_moves`, `session_duration_s` | Usuario termina sesión | Session Analytics |
| ✅ | **IMPLEMENTADO** | `home_view_activated` | `trigger: 'button' \| 'shortcut'` | Click botón Home | Navigation |
| ❌ | **PENDIENTE** | `help_button_clicked` | `project_id` | Click botón ayuda | Support |
| ❌ | **PENDIENTE** | `scene_mode_changed` | `previous_mode`, `new_mode: '2D' \| '3D' \| 'Columbus'` | Cambio de modo de escena | Feature Usage |

**¿Por qué trackear movimiento de cámara?**
- 📊 Identificar **zonas de interés** en el proyecto
- 🎯 Detectar **áreas más visitadas**
- 📈 Medir **engagement** (cuánto exploran)
- 🗺️ Crear **heatmaps** de navegación
- 🔍 Optimizar **posición inicial** de cámara

#### **4.3 Timeline y Animación** 🆕

**Hook:** `useTimelineTracking.js`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ✅ | **IMPLEMENTADO** | `timeline_playback_control` | `action: 'play' \| 'pause' \| 'stop'`, `current_date`, `multiplier`, `should_animate` | Play/Pause/Stop | Feature Usage |
| ✅ | **IMPLEMENTADO** | `timeline_play_session` | `play_duration_ms`, `play_duration_seconds` | Fin de reproducción | Engagement |
| ✅ | **IMPLEMENTADO** | `timeline_speed_changed` | `previous_multiplier`, `new_multiplier`, `multiplier_change` | Cambio de velocidad | Feature Usage |
| ✅ | **IMPLEMENTADO** | `timeline_date_jumped` | `source: 'manual' \| 'calendar' \| 'slider' \| 'button'`, `previous_date`, `new_date` | Salto a fecha | Navigation |
| ✅ | **IMPLEMENTADO** | `timeline_loop_toggled` | `loop_enabled: true \| false` | Activar/desactivar bucle | Feature Usage |

**Customer.io Trigger:**
- `viewer_load_failed` → Email automático: "Problemas técnicos detectados"
- `viewer_fps_low` → Mensaje in-app: "Optimiza tu experiencia"
- `camera_moved` (heatmap) → Identificar power users que exploran mucho
- `timeline_playback_control` (first time) → "¡Descubriste el timeline!"

---

## 5. LayerSelector - Control de Capas

### **Componente:** `LayerSelector.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `layer_panel_opened` | `project_id` | Abre panel de capas | Feature Usage |
| ✅ | **IMPLEMENTADO** | `layer_toggled` | `layer_type: 'realidad3D' \| 'fotos' \| 'fotos360' \| 'plan' \| 'ifc'`, `enabled: true \| false`, `project_id` | Activar/desactivar capa | Core Feature |
| ❌ | **PENDIENTE** | `layer_group_toggled` | `group: 'realidad' \| 'proyecto'`, `enabled: true \| false` | Toggle grupo de capas | Feature Usage |
| ❌ | **PENDIENTE** | `ifc_layer_toggled` | `ifc_asset_id`, `ifc_name`, `enabled: true \| false` | Toggle IFC específico | Feature Usage |
| ❌ | **PENDIENTE** | `ifc_height_adjusted` | `offset_value`, `ifc_asset_id` | Ajuste de altura de IFC | Feature Usage |
| ✅ | **IMPLEMENTADO** | `capture_date_changed` | `previous_date`, `new_date`, `layer_type` | Cambio de fecha de captura | Core Feature |
| ❌ | **PENDIENTE** | `calendar_opened` | `available_dates_count` | Abre selector de calendario | Feature Usage |
| ❌ | **PENDIENTE** | `plan_layer_viewed` | `plan_url`, `project_id` | Activar capa Plan de Actividades | Core Feature |

**Customer.io Trigger:**
- Si usuario NUNCA activa capas → "¿Sabías que puedes ver fotos 360°?"
- `plan_layer_viewed` → Track power user (usa features avanzadas)

---

## 6. ViewerToolBar - Herramientas

### **Componente:** `ViewerToolBar.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `toolbar_tool_selected` | `tool: 'ai-assistant' \| 'measure' \| 'compare' \| 'share'` | Click en herramienta | Feature Usage |
| ❌ | **PENDIENTE** | `measurement_created` | `measurement_type: 'point' \| 'line' \| 'area' \| 'volume'`, `value`, `unit`, `project_id` | Crear medición | Core Feature |
| ❌ | **PENDIENTE** | `measurements_cleared` | `count`, `project_id` | Borrar mediciones | Feature Usage |
| ❌ | **PENDIENTE** | `ai_assistant_opened` | `project_id` | Abrir asistente IA | Feature Usage |
| ❌ | **PENDIENTE** | `comparison_mode_activated` | `project_id` | Activar modo comparación | Core Feature |
| ❌ | **PENDIENTE** | `view_shared` | `share_method: 'link' \| 'email'`, `project_id` | Compartir vista | Viral Feature |

**Customer.io Trigger:**
- `measurement_created` (first time) → "¡Genial! Descubriste las mediciones"
- `ai_assistant_opened` → Track AI feature usage (upsell opportunity)
- `view_shared` → Viral loop: invitar a colaboradores

---

## 7. InfoBox - Información de Entidades

### **Componente:** `InfoBox.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `info_box_opened` | `entity_type`, `entity_id`, `project_id` | Se muestra InfoBox | Engagement |
| ❌ | **PENDIENTE** | `info_box_closed` | `viewing_duration_ms` | Cerrar InfoBox | Engagement |
| ❌ | **PENDIENTE** | `entity_inspected` | `entity_type`, `has_description`, `has_metadata` | Usuario lee detalles | Engagement |
| ❌ | **PENDIENTE** | `related_entity_clicked` | `from_entity_id`, `to_entity_id` | Click en entidad relacionada | Navigation |

---

## 8. MediaLightbox - Galería de Imágenes

### **Componente:** `MediaLightbox.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ✅ | **IMPLEMENTADO** | `media_lightbox_opened` | `media_type: 'photo' \| 'photo360'`, `media_id`, `source: 'marker_click' \| 'gallery'` | Abrir lightbox | Feature Usage |
| ❌ | **PENDIENTE** | `media_navigation` | `direction: 'next' \| 'previous'`, `current_index`, `total_media` | Navegar entre imágenes | Engagement |
| ❌ | **PENDIENTE** | `media_zoomed` | `zoom_level`, `media_id` | Zoom en imagen | Engagement |
| ❌ | **PENDIENTE** | `media_downloaded` | `media_type`, `media_id`, `file_size_mb` | Descargar imagen | Feature Usage |
| ❌ | **PENDIENTE** | `photo360_interacted` | `action: 'pan' \| 'zoom' \| 'rotate'`, `duration_ms` | Interacción con foto 360° | Core Feature |
| ❌ | **PENDIENTE** | `media_fullscreen_toggled` | `fullscreen_enabled: true \| false` | Pantalla completa | Feature Usage |

**Customer.io Trigger:**
- `photo360_interacted` (first time) → "¡Descubriste las fotos 360°!"
- `media_downloaded` → Track engagement con contenido

---

## 9. ComparisonModal - Modo Comparación

### **Componente:** `ComparisonModal.jsx` + `ComparisonMode.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `comparison_mode_opened` | `project_id` | Abrir modal de comparación | Feature Usage |
| ❌ | **PENDIENTE** | `comparison_dates_selected` | `left_date`, `right_date`, `date_diff_days` | Seleccionar fechas a comparar | Core Feature |
| ❌ | **PENDIENTE** | `comparison_slider_moved` | `slider_position_percent` | Mover slider de comparación | Engagement |
| ❌ | **PENDIENTE** | `comparison_layers_changed` | `left_layers`, `right_layers` | Cambiar capas en comparación | Feature Usage |
| ❌ | **PENDIENTE** | `comparison_screenshot_taken` | `left_date`, `right_date` | Captura de pantalla comparativa | Feature Usage |
| ❌ | **PENDIENTE** | `comparison_mode_closed` | `session_duration_seconds` | Cerrar modo comparación | Engagement |

**Customer.io Trigger:**
- `comparison_mode_opened` (first time) → "¡Compara el progreso de tu obra!"
- Si usuario usa comparación 3+ veces/semana → Identificar como power user

---

## 10. DateSelector - Selector de Fechas

### **Componente:** `DateSelector.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `date_selector_opened` | `available_dates_count` | Abrir selector de fechas | Feature Usage |
| ❌ | **PENDIENTE** | `date_selected` | `selected_date`, `layer_type`, `available_dates_count` | Seleccionar fecha | Core Feature |
| ❌ | **PENDIENTE** | `date_navigation` | `direction: 'next' \| 'previous'`, `from_date`, `to_date` | Navegar entre fechas | Engagement |

---

## 11. ProjectDashboard - KPIs

### **Componente:** `ProjectDashboard.jsx` + `GlobalKPIs.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `dashboard_viewed` | `project_id`, `kpis_count` | Acceder a dashboard | Feature Usage |
| ❌ | **PENDIENTE** | `kpi_widget_interacted` | `kpi_type`, `value` | Interacción con widget KPI | Engagement |
| ❌ | **PENDIENTE** | `dashboard_filter_applied` | `filter_type`, `filter_value` | Filtrar datos en dashboard | Feature Usage |
| ❌ | **PENDIENTE** | `dashboard_exported` | `export_format: 'pdf' \| 'excel'`, `project_id` | Exportar reporte | Feature Usage |

---

## 12. CzmlUploader - Subida de Archivos

### **Componente:** `CzmlUploader.jsx`

| Evento | Estado | Nombre del Evento | Propiedades | Trigger | Objetivo |
|--------|--------|-------------------|-------------|---------|----------|
| ❌ | **PENDIENTE** | `file_upload_initiated` | `file_type: 'czml' \| 'logo' \| 'plan'`, `file_size_mb` | Inicio de subida | Feature Usage |
| ❌ | **PENDIENTE** | `file_upload_completed` | `file_type`, `file_size_mb`, `upload_duration_ms` | Subida exitosa | Success Metric |
| ❌ | **PENDIENTE** | `file_upload_failed` | `file_type`, `error`, `file_size_mb` | Error en subida | Troubleshooting |
| ❌ | **PENDIENTE** | `file_deleted` | `file_type`, `file_id` | Eliminar archivo | Feature Usage |

---

## 📊 Resumen de Implementación

| Estado | Eventos | Porcentaje |
|--------|---------|------------|
| ✅ **Implementados** | **17** | **~17%** |
| ❌ **Pendientes** | ~85 | ~83% |
| **TOTAL** | **102+** | 100% |

### Desglose por Categoría

| Categoría | Eventos | Estado |
|-----------|---------|--------|
| Autenticación & Onboarding | 7 | ✅ 2 implementados |
| HomePage - Proyectos | 5 | ❌ Pendiente |
| ProjectLayout - Navegación | 5 | ❌ Pendiente |
| **ProjectVisualizer - Visor** | **21** | ✅ **13 implementados** |
| ├─ Carga y Config | 7 | ✅ 3 implementados |
| ├─ **Navegación de Cámara** 🆕 | 6 | ✅ **4 implementados** |
| └─ **Timeline y Animación** 🆕 | 5 | ✅ **5 implementados** |
| LayerSelector | 8 | ✅ 2 implementados |
| ViewerToolBar | 6 | ❌ Pendiente |
| InfoBox | 4 | ❌ Pendiente |
| MediaLightbox | 6 | ✅ 1 implementado |
| ComparisonModal | 6 | ❌ Pendiente |
| DateSelector | 3 | ❌ Pendiente |
| ProjectDashboard | 4 | ❌ Pendiente |
| CzmlUploader | 4 | ❌ Pendiente |

### 🎉 Fase 1 - COMPLETADA

✅ **17 eventos core implementados** (incluye hooks automáticos)

---

## 🎯 Priorización de Implementación

### **Fase 1: Eventos Core (Alta Prioridad)** 🔴

Estos eventos son críticos para entender el uso básico del producto:

**A. Carga y Visor (Performance)**
1. `viewer_loaded` / `viewer_load_failed`
2. `tileset_loaded`

**B. Navegación (Behavior Critical)** 🆕
3. `camera_moved` - **MUY IMPORTANTE para heatmaps**
4. `home_view_activated`
5. `timeline_playback_control` (play/pause)
6. `timeline_date_jumped`

**C. Interacción con Capas**
7. `layer_toggled` (fotos, fotos360, plan, ifc)
8. `entity_clicked`
9. `capture_date_changed`

**D. Features Core**
10. `measurement_created`
11. `media_lightbox_opened`

**Impacto:** 
- 📍 **Heatmaps de navegación** → Optimizar layout del proyecto
- 🎯 **Engagement profundo** → Identificar power users
- ⏱️ **Performance** → Detectar problemas de carga
- 🔍 **Feature discovery** → Qué usan más

**Estimación:** 3-4 días de desarrollo

---

### **Fase 2: Navegación y Performance (Media Prioridad)** 🟡

1. `project_clicked`
2. `menu_item_clicked`
3. `viewer_fps_low`
4. `tileset_loaded` (con timing)
5. `camera_moved`

**Impacto:** Optimizar UX y detectar problemas técnicos  
**Estimación:** 1-2 días

---

### **Fase 3: Features Avanzados (Baja Prioridad)** 🟢

1. `ai_assistant_opened`
2. `view_shared`
3. `dashboard_exported`
4. `file_upload_completed`

**Impacto:** Track features premium para upsell  
**Estimación:** 1 día

---

## 🛠️ Implementación Técnica

### **Helper Function para Tracking**

Crear utility: `src/utils/analytics.js`

```javascript
import { segmentTrack, customerioTrack } from '@ingeia/analytics';

/**
 * Track event en todos los servicios de analytics
 * @param {string} eventName - Nombre del evento (snake_case)
 * @param {object} properties - Propiedades del evento
 * @param {object} options - Opciones adicionales
 */
export const trackEvent = (eventName, properties = {}, options = {}) => {
  const timestamp = new Date().toISOString();
  
  const enrichedProps = {
    ...properties,
    timestamp,
    app: 'site',
    url: window.location.href,
    path: window.location.pathname,
    ...options
  };

  console.log(`[Analytics] ${eventName}`, enrichedProps);

  // Segment
  if (typeof segmentTrack === 'function') {
    segmentTrack(eventName, enrichedProps);
  }

  // Customer.io
  if (typeof customerioTrack === 'function') {
    customerioTrack(eventName, enrichedProps);
  }

  // PostHog (via window)
  if (window.posthog) {
    window.posthog.capture(eventName, enrichedProps);
  }
};
```

### **Ejemplo de Uso en Componente**

```javascript
// En LayerSelector.jsx
import { trackEvent } from '../utils/analytics';

const handleLayerChange = (event) => {
  const layerType = event.target.name;
  const enabled = event.target.checked;
  
  // Track event
  trackEvent('layer_toggled', {
    layer_type: layerType,
    enabled,
    project_id: projectId
  });
  
  // Update state
  onLayerVisibilityChange({
    ...layerVisibility,
    [layerType]: enabled,
  });
};
```

---

## 📈 Customer.io Campaigns Sugeridas

### **1. Onboarding Series**

**Trigger:** `user_signed_up`

- Email 1 (inmediato): "Bienvenido a AXSOL - Comienza aquí"
- Email 2 (día 1): "¿Has explorado el visor 3D?"
- Email 3 (día 3): "Descubre las fotos 360°"
- Email 4 (día 7): "Compara el progreso de tu obra"

### **2. Feature Adoption**

**Trigger:** Usuario activo pero NO usa feature específica en 14 días

- "¿Sabías que puedes hacer mediciones en 3D?"
- "Activa el modo comparación para ver el avance"

### **3. Re-engagement**

**Trigger:** `user_logged_in` no detectado en 30 días

- Email: "Te extrañamos - ¿Qué ha pasado en tu proyecto?"
- Push notification (si habilitado)

### **4. Power User Identification**

**Trigger:** Usuario usa 5+ features en una semana

- Identificar como "power user"
- Invitar a beta de nuevas features
- Solicitar testimonial / case study

### **5. Troubleshooting**

**Trigger:** `viewer_load_failed` o `project_load_failed` 3+ veces

- Email automático a soporte: "Usuario [X] tiene problemas técnicos"
- Email a usuario: "Detectamos problemas - ¿Te ayudamos?"

---

## 🎨 Event Naming Conventions

**Formato:** `object_action` (snake_case)

**Ejemplos:**
- ✅ `layer_toggled`
- ✅ `measurement_created`
- ✅ `viewer_loaded`
- ❌ `LayerToggled` (PascalCase - NO)
- ❌ `toggle-layer` (kebab-case - NO)

**Propiedades:** snake_case también
- ✅ `project_id`
- ✅ `layer_type`
- ❌ `projectId` (camelCase - NO)

---

## 📝 Próximos Pasos

1. ✅ **Crear utility** `src/utils/analytics.js`
2. ✅ **Implementar Fase 1** (eventos core)
3. ✅ **Configurar Customer.io campaigns** básicas
4. ✅ **Crear dashboard en PostHog** para monitorear KPIs
5. ✅ **Documentar** eventos en Notion/Confluence
6. ✅ **Training** al equipo sobre cómo agregar nuevos eventos

---

## 🔗 Referencias

- [Segment Event Spec](https://segment.com/docs/connections/spec/)
- [Customer.io Track API](https://customer.io/docs/api/#operation/track)
- [PostHog Event Tracking](https://posthog.com/docs/integrate/client/js#capturing-events)
- [Product Analytics Best Practices](https://mixpanel.com/blog/product-analytics-best-practices/)

---

**📊 Este catálogo debe actualizarse** cada vez que se agregue una nueva feature o interacción en la UI.
