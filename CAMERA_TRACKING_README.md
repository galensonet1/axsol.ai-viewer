# 📍 Camera & Timeline Tracking - Guía Rápida

## 🎯 Objetivo

Trackear **cómo los usuarios navegan** por el visor 3D para:
- 📊 Crear **heatmaps** de zonas visitadas
- 🎯 Identificar **áreas de interés**
- 📈 Medir **engagement** (cuánto exploran)
- 🔍 Optimizar **posición inicial** de cámara
- ⏱️ Entender patrones de **uso temporal** (timeline)

---

## 🚀 Quick Start

### 1. Importar Hooks

```javascript
import useCameraTracking from '../hooks/useCameraTracking';
import useTimelineTracking from '../hooks/useTimelineTracking';
```

### 2. Usar en ProjectVisualizer

```javascript
const ProjectVisualizer = ({ projectId }) => {
  const [cesiumViewer, setCesiumViewer] = useState(null);
  
  // ✅ TRACKING AUTOMÁTICO
  useCameraTracking(cesiumViewer, projectId);
  useTimelineTracking(cesiumViewer, projectId);
  
  return (
    <Viewer ref={(ref) => setCesiumViewer(ref?.cesiumElement)}>
      {/* ... */}
    </Viewer>
  );
};
```

**¡Eso es todo!** Los hooks trackean automáticamente.

---

## 📊 Datos Capturados

### **Camera Tracking**

Cada 3 segundos (throttled), se captura:

```javascript
{
  event: 'camera_moved',
  movement_type: 'zoom',        // 'zoom', 'pan', 'rotate', 'tilt', 'adjust'
  
  // Posición geográfica
  latitude: -33.4569,
  longitude: -70.6483,
  altitude_m: 1250,
  
  // Orientación (grados)
  heading_deg: 45,    // 0° = Norte, 90° = Este
  pitch_deg: -30,     // -90° = mirando abajo, 0° = horizonte
  roll_deg: 0,        // Inclinación cámara
  
  // Métricas de sesión
  move_count: 15,
  distance_moved_m: 120,
  session_duration_s: 180
}
```

### **Timeline Tracking**

```javascript
// Cuando usuario presiona Play
{
  event: 'timeline_playback_control',
  action: 'play',
  current_date: '2025-06-15T10:00:00Z',
  multiplier: 1,
  should_animate: true
}

// Cuando cambia velocidad
{
  event: 'timeline_speed_changed',
  previous_multiplier: 1,
  new_multiplier: 10,
  multiplier_change: 10
}

// Al terminar de reproducir
{
  event: 'timeline_play_session',
  play_duration_ms: 45000,
  play_duration_seconds: 45
}
```

---

## 🎨 Visualizaciones Posibles

### 1. **Heatmap de Navegación**

Con los datos de `camera_moved`, puedes crear un heatmap en PostHog/Tableau:

```sql
-- Query de ejemplo para heatmap
SELECT 
  latitude,
  longitude,
  COUNT(*) as visits,
  AVG(altitude_m) as avg_altitude
FROM camera_events
WHERE project_id = '123'
GROUP BY latitude, longitude
ORDER BY visits DESC
```

**Resultado:**
- Zonas rojas = Más visitadas
- Zonas azules = Poco visitadas
- Optimizar cámara inicial hacia zona roja

### 2. **Gráfico de Altitud en el Tiempo**

```javascript
// Datos: [timestamp, altitude_m]
// Muestra cuándo usuarios hacen zoom in/out
```

### 3. **Path de Navegación**

```javascript
// Conectar puntos de lat/lon en orden cronológico
// Ver "camino" que toma el usuario
```

---

## ⚙️ Configuración Avanzada

### Opciones de useCameraTracking

```javascript
useCameraTracking(viewer, projectId, {
  throttleMs: 3000,           // Frecuencia de tracking (ms)
  minMovementThreshold: 0.001, // Movimiento mínimo para trackear
  trackOnMount: true,          // Track posición inicial
  enabled: true                // Habilitar/deshabilitar
});
```

### Métodos Manuales

```javascript
const { 
  trackCameraPosition,  // Track manualmente
  trackZoom,            // Track zoom específico
  trackHomeView,        // Track botón Home
  getCameraData         // Obtener datos sin trackear
} = useCameraTracking(viewer, projectId);

// Ejemplo: track al hacer screenshot
const handleScreenshot = () => {
  trackCameraPosition('screenshot');
  // ... tomar screenshot
};
```

---

## 📈 Use Cases de Producto

### 1. **Optimizar Vista Inicial**

**Problema:** ¿Dónde poner la cámara al cargar el proyecto?

**Solución:**
1. Analizar `camera_moved` de todos los usuarios
2. Identificar zona más visitada (heatmap)
3. Configurar `initial_location` del proyecto a esa zona

### 2. **Detectar Áreas Problemáticas**

**Problema:** ¿Hay zonas que nadie visita?

**Solución:**
1. Crear heatmap de navegación
2. Zonas "frías" = No hay contenido interesante
3. Agregar más assets (fotos, IFCs) en esas zonas

### 3. **Identificar Power Users**

**Problema:** ¿Quiénes exploran más el proyecto?

**Solución:**
```sql
SELECT 
  user_id,
  COUNT(*) as total_moves,
  SUM(distance_moved_m) as total_distance,
  AVG(session_duration_s) as avg_session
FROM camera_events
GROUP BY user_id
HAVING total_moves > 100  -- Power users
ORDER BY total_distance DESC
```

### 4. **Optimizar Performance**

**Problema:** ¿Cuándo se degrada el rendimiento?

**Solución:**
- Cross-reference `camera_moved.altitude_m` con `viewer_fps_low`
- Si FPS baja cuando altitude < 100m → Demasiados polígonos en detalle
- Optimizar modelos 3D en esas altitudes

---

## 🎯 Ejemplo Real de Análisis

### Dashboard en PostHog

```javascript
// 1. Insight: Top 10 posiciones más visitadas
SELECT 
  ROUND(latitude, 4) as lat,
  ROUND(longitude, 4) as lon,
  COUNT(*) as visits
FROM camera_moved
WHERE project_id = '123'
  AND created_at > NOW() - INTERVAL 30 DAY
GROUP BY lat, lon
ORDER BY visits DESC
LIMIT 10

// 2. Insight: Distribución de altitudes
SELECT 
  CASE 
    WHEN altitude_m < 100 THEN 'Muy cerca (<100m)'
    WHEN altitude_m < 500 THEN 'Cerca (100-500m)'
    WHEN altitude_m < 2000 THEN 'Media (500-2000m)'
    ELSE 'Lejos (>2000m)'
  END as altitude_range,
  COUNT(*) as count
FROM camera_moved
GROUP BY altitude_range

// 3. Insight: Tipos de movimiento más comunes
SELECT 
  movement_type,
  COUNT(*) as count,
  ROUND(AVG(distance_moved_m), 2) as avg_distance
FROM camera_moved
GROUP BY movement_type
ORDER BY count DESC
```

---

## 🔔 Customer.io Campaigns

### Campaign 1: Explorador Principiante

**Trigger:** `move_count < 5` en primera sesión

**Email:**
```
Subject: 🗺️ Explora tu proyecto en 3D

Hola [name],

Vimos que visitaste el proyecto [project_name]. 
¿Sabías que puedes navegar por todo el sitio en 3D?

👉 Haz click y arrastra para moverte
👉 Scroll para hacer zoom
👉 Botón Home para volver al inicio

[CTA: Explorar Proyecto]
```

### Campaign 2: Power User Recognition

**Trigger:** `total_moves > 100` AND `total_distance > 1000m`

**Email:**
```
Subject: 🌟 ¡Eres un explorador experto!

Has navegado más de 1km en el proyecto [project_name]. 
Nos encantaría saber qué te pareció.

[CTA: Compartir Feedback] [CTA: Invitar Colaboradores]
```

### Campaign 3: Timeline Discovery

**Trigger:** `camera_moved` > 10 pero NUNCA `timeline_playback_control`

**In-app message:**
```
💡 TIP: ¿Sabías que puedes ver el progreso en el tiempo?

Presiona ▶️ en la barra inferior para ver cómo avanzó la obra.
```

---

## 🐛 Troubleshooting

### No se trackea nada

**Verificar:**
1. ¿`cesiumViewer` está definido?
2. ¿El viewer terminó de cargar?
3. ¿PostHog está inicializado?

```javascript
// Debug
useEffect(() => {
  console.log('Viewer:', cesiumViewer);
  console.log('PostHog:', window.posthog);
}, [cesiumViewer]);
```

### Se trackea demasiado

**Solución:** Aumentar `throttleMs`

```javascript
useCameraTracking(viewer, projectId, {
  throttleMs: 5000  // Solo cada 5 segundos
});
```

### Falsos positivos en movimiento

**Solución:** Aumentar `minMovementThreshold`

```javascript
useCameraTracking(viewer, projectId, {
  minMovementThreshold: 0.01  // Ignorar movimientos < 1km
});
```

---

## 📚 Referencias

- **Hook:** `apps/site/src/hooks/useCameraTracking.js`
- **Hook:** `apps/site/src/hooks/useTimelineTracking.js`
- **Catálogo:** `ANALYTICS_EVENTS_CATALOG.md` → Sección 4.2 y 4.3
- **Implementación:** `ANALYTICS_IMPLEMENTATION_GUIDE.md`

---

## ✅ Checklist de Implementación

- [ ] Importar hooks en `ProjectVisualizer.jsx`
- [ ] Pasar `cesiumViewer` a los hooks
- [ ] Verificar eventos en PostHog Live Events
- [ ] Crear dashboard en PostHog con insights de navegación
- [ ] Configurar campaigns en Customer.io
- [ ] Analizar primeros datos (1 semana)
- [ ] Optimizar `initial_location` basado en heatmap
- [ ] Documentar insights encontrados

---

**🎉 Con esto tendrás visibilidad completa de cómo los usuarios navegan por tus proyectos 3D!**
