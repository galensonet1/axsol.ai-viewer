# 🔧 **Corrección de Eventos de Analytics**

## **🚨 Problemas Identificados:**

### **1. Eventos de Autenticación usando función incorrecta**
- **Problema:** `user_logged_in` y `user_signed_up` usaban `customerioTrack()` directamente
- **Consecuencia:** No se registraban en PostHog ni en el Analytics Monitor
- **Solución:** Cambiados a usar `trackEvent()` centralizado

### **2. Hooks de tracking no conectados a UI**
- **Problema:** Los hooks `useTimelineTracking` y `useCameraTracking` se llamaban pero no se usaban sus funciones
- **Consecuencia:** Los eventos de timeline y cámara no se disparaban
- **Solución:** Extraer las funciones de los hooks para poder usarlas

---

## **✅ CORRECCIONES APLICADAS:**

### **1. AppWrapper.jsx - Eventos de Autenticación**

#### **Antes:**
```javascript
// Solo enviaba a Customer.io
customerioTrack('user_signed_up', { ... });
customerioTrack('user_logged_in', { ... });
```

#### **Después:**
```javascript
// Envía a todos los servicios (PostHog, Customer.io, Segment)
trackEvent('user_signed_up', {
  email: userData.email,
  name: userData.name,
  roles: userData.roles,
  source: 'auth0'
});

trackEvent('user_logged_in', {
  email: userData.email,
  roles: userData.roles
});
```

### **2. ProjectVisualizer.jsx - Hooks de Tracking**

#### **Antes:**
```javascript
// No se usaban las funciones retornadas
const { trackHomeView } = useCameraTracking(cesiumViewer, projectId, { ... });
useTimelineTracking(cesiumViewer, projectId);
```

#### **Después:**
```javascript
// Extraer todas las funciones para poder usarlas
const { trackHomeView, trackZoom, trackCameraPosition, getCameraData } = useCameraTracking(cesiumViewer, projectId, {
  throttleMs: 3000,
  trackOnMount: true,
  enabled: true
});

const { trackDateJump, trackLoopToggle, trackPlaybackControl, trackSpeedChange } = useTimelineTracking(cesiumViewer, projectId);
```

### **3. useTimelineTracking.js - Debug Mejorado**

#### **Agregado:**
```javascript
console.log('[useTimelineTracking] Inicializando hook:', { 
  hasViewer: !!viewer, 
  enabled, 
  hasClock: !!viewer?.clock,
  projectId 
});

console.log('[useTimelineTracking] 🎬 Cambio de velocidad detectado:', previousMultiplier, '->', clock.multiplier);
console.log('[useTimelineTracking] ⏯️ Cambio de reproducción detectado:', previousShouldAnimate, '->', clock.shouldAnimate);
```

---

## **🎯 EVENTOS QUE AHORA DEBERÍAN FUNCIONAR:**

### **✅ Eventos de Autenticación:**
- `user_signed_up` - Se dispara al registrarse por primera vez
- `user_logged_in` - Se dispara al hacer login (una vez por sesión/24h)

### **✅ Eventos de Timeline (automáticos):**
- `timeline_playback_control` - Se dispara al hacer play/pause en el timeline de Cesium
- `timeline_speed_changed` - Se dispara al cambiar la velocidad de reproducción
- `timeline_play_session` - Se dispara al finalizar una sesión de reproducción

### **✅ Eventos de Cámara (automáticos):**
- `camera_moved` - Se dispara cada 3 segundos cuando se mueve la cámara (throttled)
- `camera_session_ended` - Se dispara al finalizar una sesión de movimiento de cámara

### **🔧 Eventos que requieren conexión manual:**
- `timeline_date_jumped` - Requiere conectar a controles de fecha
- `timeline_loop_toggled` - Requiere conectar a control de loop
- `camera_zoomed` - Requiere conectar a controles de zoom
- `home_view_activated` - ✅ Ya conectado al botón Home

---

## **🧪 CÓMO PROBAR:**

### **1. Eventos de Autenticación:**
1. Hacer logout y login → Debería disparar `user_logged_in`
2. Registrar nuevo usuario → Debería disparar `user_signed_up`

### **2. Eventos de Timeline:**
1. Abrir proyecto con timeline
2. Hacer clic en Play/Pause → Debería disparar `timeline_playback_control`
3. Cambiar velocidad → Debería disparar `timeline_speed_changed`

### **3. Eventos de Cámara:**
1. Mover la cámara → Debería disparar `camera_moved` (cada 3s)
2. Hacer clic en botón Home → Debería disparar `home_view_activated`

### **4. Verificar en Consola:**
- Buscar logs que empiecen con `📊 [Analytics]`
- Buscar logs de hooks: `[useTimelineTracking]` y `🎥 [Camera]`

---

## **🚨 EVENTOS PENDIENTES DE IMPLEMENTAR:**

### **`viewer_load_failed`**
- **Estado:** NO IMPLEMENTADO (solo en catálogo)
- **Ubicación sugerida:** `ProjectVisualizer.jsx` en bloques `catch`
- **Acción:** Agregar `trackEvent('viewer_load_failed', ...)` en manejo de errores

### **Eventos manuales de Timeline:**
- `timeline_date_jumped` - Conectar a date picker/calendar
- `timeline_loop_toggled` - Conectar a control de loop

### **Eventos manuales de Cámara:**
- `camera_zoomed` - Conectar a controles de zoom

---

## **📋 PRÓXIMOS PASOS:**

1. **Probar los eventos corregidos** en la aplicación
2. **Verificar logs en consola** para confirmar que se disparan
3. **Implementar `viewer_load_failed`** si es necesario
4. **Conectar eventos manuales** restantes a controles de UI
5. **Remover logs de debug** una vez confirmado que funciona
