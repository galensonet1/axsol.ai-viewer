# 🎥 PostHog Session Recording - Cesium Blank Screen Fix

## ⚠️ Problema

Las grabaciones de pantalla (Session Recordings) en PostHog muestran:
- ✅ UI elements (LayerSelector, Timeline, InfoBox, etc.)
- ❌ **Viewer de Cesium completamente en blanco**

---

## 🔍 Causa Raíz

PostHog Session Recording captura el DOM usando **rrweb** (record-replay web), que funciona tomando snapshots del HTML/CSS.

**Cesium renderiza con WebGL en un `<canvas>`**, y por defecto:
- Canvas 2D → Se captura ✅
- Canvas WebGL → **NO se captura** ❌ (aparece en blanco)

Esto es una **limitación técnica** de cómo funcionan los session recordings, no es un bug de PostHog ni de Cesium.

---

## 🛠️ Soluciones Disponibles

### **Opción 1: Habilitar Canvas Recording (Experimental)** ⚠️

PostHog tiene soporte experimental para capturar canvas WebGL:

```typescript
// En packages/analytics/src/index.ts - línea 17
export function analyticsInit(posthogKey: string, apiHost?: string) {
  posthog.init(posthogKey, {
    api_host: apiHost || 'https://app.posthog.com',
    autocapture: false,
    capture_pageview: false,
    
    // ⚠️ EXPERIMENTAL: Capturar canvas WebGL
    session_recording: {
      recordCanvas: true,
      sampling: {
        canvas: 2  // Captura cada 2 frames (1 = todos los frames)
      },
      // Limitar tamaño de grabación
      inlineImages: false,  // No capturar imágenes inline
      maskAllInputs: true,  // Enmascarar inputs sensibles
    }
  });
  
  // ... resto del código
}
```

**Ventajas:**
- ✅ Captura el contenido del viewer de Cesium
- ✅ Session recordings completas

**Desventajas:**
- ❌ **Alto uso de CPU** (renderiza frames constantemente)
- ❌ **Alto uso de memoria**
- ❌ **Archivos de grabación muy grandes** (afecta storage en PostHog)
- ❌ **Puede hacer lento el viewer** (especialmente con modelos 3D pesados)
- ❌ Feature experimental, puede tener bugs

**Recomendación:** ❌ **NO usar en producción** para aplicaciones 3D/WebGL intensivas

---

### **Opción 2: Usar Solo Eventos + Heatmaps (RECOMENDADO)** ✅

En lugar de grabar el canvas, usar los eventos de analytics para reconstruir la navegación:

#### **A. Eventos de Cámara**

Los eventos `camera_moved` capturan:
```javascript
{
  latitude: -38.495123,
  longitude: -68.319456,
  altitude_m: 1250,
  heading_deg: 45,
  pitch_deg: -60,
  movement_type: 'zoom',
  move_count: 15,
  session_duration_s: 120
}
```

Con estos datos puedes:
- 📊 Crear **heatmap de navegación** (lat/lon frecuentes)
- 📈 Graficar **patrones de zoom** (altitude vs tiempo)
- 🎯 Identificar **áreas de interés** (donde pasan más tiempo)
- 🗺️ **Reconstruir la ruta** de navegación del usuario

#### **B. Eventos de Timeline**

Los eventos `timeline_playback_control` y `timeline_date_changed` capturan:
```javascript
{
  action: 'play',
  current_date: '2025-10-13',
  playback_speed: 2,
  timeline_session_duration_s: 60
}
```

Con estos datos puedes:
- ⏯️ Ver cuántos usan el timeline
- 🎬 Identificar fechas más revisadas
- ⏱️ Medir engagement con la feature

#### **C. Session Recordings para UI**

Mantener session recordings habilitados **solo para la UI**:
- ✅ Ver interacciones con LayerSelector
- ✅ Ver uso de Timeline controls
- ✅ Ver apertura de InfoBox/MediaLightbox
- ✅ Ver errores de UI

**Configuración:**
```typescript
posthog.init(posthogKey, {
  api_host: apiHost || 'https://app.posthog.com',
  autocapture: false,
  capture_pageview: false,
  
  session_recording: {
    recordCanvas: false,  // ❌ NO grabar canvas (default)
    maskAllInputs: true,
    maskTextSelector: '[data-sensitive]',
  }
});
```

**Ventajas:**
- ✅ No afecta performance
- ✅ Archivos de grabación pequeños
- ✅ Captura toda la interacción con UI
- ✅ Eventos de cámara suficientes para analytics

**Recomendación:** ✅ **USAR ESTA OPCIÓN**

---

### **Opción 3: Capturar Screenshots Periódicos** 📸

Tomar snapshots del canvas en momentos clave:

```javascript
// En ProjectVisualizer.jsx
useEffect(() => {
  if (!cesiumViewer) return;
  
  // Capturar screenshot cada 30 segundos
  const screenshotInterval = setInterval(() => {
    try {
      const canvas = cesiumViewer.canvas;
      const screenshot = canvas.toDataURL('image/jpeg', 0.7);  // Calidad 70%
      
      // Enviar a PostHog como propiedad del evento
      trackEvent('viewer_screenshot', {
        project_id: projectId,
        screenshot_size_kb: Math.round(screenshot.length / 1024),
        camera_altitude: cesiumViewer.camera.positionCartographic.height,
        // NO enviar el screenshot completo (muy grande)
      });
      
      // Opción: enviar screenshot a tu propio backend
      // fetch('/api/screenshots', { 
      //   method: 'POST', 
      //   body: JSON.stringify({ screenshot, projectId }) 
      // });
      
    } catch (error) {
      console.error('Error capturando screenshot:', error);
    }
  }, 30000);  // 30 segundos
  
  return () => clearInterval(screenshotInterval);
}, [cesiumViewer, projectId]);
```

**Ventajas:**
- ✅ Capturas visuales del viewer
- ✅ Control sobre cuándo capturar

**Desventajas:**
- ❌ Screenshots base64 son **muy grandes** (500KB - 2MB cada uno)
- ❌ Costoso en storage de PostHog
- ❌ No es video continuo, solo snapshots

**Recomendación:** ⚠️ Solo si realmente necesitas evidencia visual

---

## ✅ Recomendación Final

### **Para AXSOL Viewer:**

1. ✅ **Mantener Session Recording SIN canvas** (default actual)
2. ✅ **Confiar en eventos de cámara** para analytics de navegación
3. ✅ **Crear dashboard en PostHog** con:
   - Heatmap de coordenadas (lat/lon de `camera_moved`)
   - Gráfico de altitudes (zoom levels)
   - Funnel de features usadas
   - Session duration promedio
4. ✅ **Session recordings solo para UI debugging:**
   - Ver cómo usan el LayerSelector
   - Ver errores de interacción
   - Ver flujos de navegación (páginas)

### **No implementar:**

- ❌ `recordCanvas: true` (afecta performance)
- ❌ Screenshots periódicos (muy costoso)

---

## 📊 Dashboard Alternativo

En lugar de confiar en session recordings del viewer, crear un dashboard con:

### **1. Mapa de Calor de Navegación**

```javascript
// Query en PostHog
SELECT 
  properties.latitude as lat,
  properties.longitude as lon,
  COUNT(*) as visits
FROM events
WHERE event = 'camera_moved'
  AND properties.project_id = '1'
GROUP BY lat, lon
```

Visualizar en:
- Kepler.gl (heatmap geoespacial)
- Mapbox GL JS
- Google Maps API

### **2. Gráfico de Tiempo en Altitudes**

```javascript
// Query en PostHog
SELECT 
  properties.altitude_m,
  AVG(properties.session_duration_s) as avg_time
FROM events
WHERE event = 'camera_moved'
GROUP BY altitude_m
ORDER BY altitude_m
```

Visualizar:
- Histograma de altitudes más usadas
- Identificar zoom levels preferidos

### **3. Patrones de Movimiento**

```javascript
// Agrupar por tipo de movimiento
SELECT 
  properties.movement_type,
  COUNT(*) as count,
  AVG(properties.distance_moved_m) as avg_distance
FROM events
WHERE event = 'camera_moved'
GROUP BY movement_type
```

Resultados esperados:
- `zoom`: 45% (usuarios hacen zoom in/out frecuentemente)
- `pan`: 30% (se mueven lateralmente)
- `rotate`: 15% (rotan el modelo)
- `tilt`: 10% (cambian inclinación)

---

## 🎯 Conclusión

**El viewer de Cesium aparece en blanco en session recordings porque usa WebGL/Canvas.**

**Solución recomendada:**
- ✅ Aceptar esta limitación
- ✅ Usar eventos de cámara (`camera_moved`, `camera_zoomed`, etc.)
- ✅ Crear dashboards con coordenadas y métricas
- ✅ Session recordings solo para UI (suficiente para debugging)

**NO intentar grabar el canvas** (afecta performance severamente).

---

## 📚 Referencias

- PostHog Canvas Recording: https://posthog.com/docs/session-replay/canvas-recording
- WebGL Session Recording Limitations: https://github.com/rrweb-io/rrweb/issues/587
- Alternative: Event-based heatmaps: https://posthog.com/tutorials/heatmaps

---

**Estado:** ⚠️ Limitación conocida, sin fix recomendado
