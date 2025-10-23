# 🔍 **Investigación de Eventos Implementados**

## **Eventos Investigados:**
- `user_logged_in`
- `user_signed_up` 
- `timeline_date_jumped`
- `timeline_loop_toggled`
- `camera_session_ended`
- `camera_zoomed`
- `home_view_activated`
- `viewer_load_failed`

---

## **✅ EVENTOS CORRECTAMENTE IMPLEMENTADOS:**

### **1. `user_signed_up`**
- **📍 Ubicación:** `apps/site/src/AppWrapper.jsx:110`
- **🎯 Implementación:**
```javascript
customerioTrack('user_signed_up', {
  app: 'site',
  email: userData.email,
  name: userData.name,
  roles: userData.roles,
  timestamp: now,
  source: 'auth0'
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **2. `user_logged_in`**
- **📍 Ubicación:** `apps/site/src/AppWrapper.jsx:138`
- **🎯 Implementación:**
```javascript
customerioTrack('user_logged_in', {
  app: 'site',
  email: userData.email,
  roles: userData.roles,
  timestamp: now
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **3. `timeline_date_jumped`**
- **📍 Ubicación:** `apps/site/src/hooks/useTimelineTracking.js:88`
- **🎯 Implementación:**
```javascript
trackEvent('timeline_date_jumped', {
  project_id: projectId,
  source, // 'manual', 'calendar', 'slider', 'button'
  previous_date: previousDate,
  new_date: newDate
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **4. `timeline_loop_toggled`**
- **📍 Ubicación:** `apps/site/src/hooks/useTimelineTracking.js:100`
- **🎯 Implementación:**
```javascript
trackEvent('timeline_loop_toggled', {
  project_id: projectId,
  loop_enabled: enabled
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **5. `camera_session_ended`**
- **📍 Ubicación:** `apps/site/src/hooks/useCameraTracking.js:218`
- **🎯 Implementación:**
```javascript
trackEvent('camera_session_ended', {
  project_id: projectId,
  total_moves: moveCountRef.current,
  session_duration_s: Math.round((Date.now() - sessionStartRef.current) / 1000)
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **6. `camera_zoomed`**
- **📍 Ubicación:** `apps/site/src/hooks/useCameraTracking.js:156`
- **🎯 Implementación:**
```javascript
trackEvent('camera_zoomed', {
  project_id: projectId,
  direction, // 'in' o 'out'
  altitude_m: Math.round(cameraData.altitude),
  latitude: cameraData.latitude.toFixed(6),
  longitude: cameraData.longitude.toFixed(6)
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

### **7. `home_view_activated`**
- **📍 Ubicación:** `apps/site/src/hooks/useCameraTracking.js:169`
- **🎯 Implementación:**
```javascript
trackEvent('home_view_activated', {
  project_id: projectId,
  trigger: 'button'
});
```
- **✅ Estado:** IMPLEMENTADO CORRECTAMENTE

---

## **❌ EVENTOS NO IMPLEMENTADOS:**

### **8. `viewer_load_failed`**
- **📍 Catálogo:** `apps/site/src/utils/analyticsMonitor.js:123`
- **🎯 Supuesta ubicación:** `ProjectVisualizer.jsx`
- **❌ Estado:** **NO IMPLEMENTADO**
- **🔍 Hallazgos:**
  - Solo existe la definición en el catálogo
  - No se encontró ninguna llamada a `trackEvent('viewer_load_failed', ...)`
  - En `ProjectVisualizer.jsx` hay múltiples bloques `try/catch` pero ninguno trackea errores de carga
  - Hay un `trackEvent('viewer_loaded', ...)` cuando el viewer se carga exitosamente
  - **FALTA:** Implementar el tracking cuando falla la carga del viewer

---

## **📊 RESUMEN:**

| Evento | Estado | Ubicación | Notas |
|--------|--------|-----------|-------|
| `user_signed_up` | ✅ IMPLEMENTADO | `AppWrapper.jsx:110` | Customer.io |
| `user_logged_in` | ✅ IMPLEMENTADO | `AppWrapper.jsx:138` | Customer.io |
| `timeline_date_jumped` | ✅ IMPLEMENTADO | `useTimelineTracking.js:88` | PostHog |
| `timeline_loop_toggled` | ✅ IMPLEMENTADO | `useTimelineTracking.js:100` | PostHog |
| `camera_session_ended` | ✅ IMPLEMENTADO | `useCameraTracking.js:218` | PostHog |
| `camera_zoomed` | ✅ IMPLEMENTADO | `useCameraTracking.js:156` | PostHog |
| `home_view_activated` | ✅ IMPLEMENTADO | `useCameraTracking.js:169` | PostHog |
| `viewer_load_failed` | ❌ **NO IMPLEMENTADO** | - | **PENDIENTE** |

---

## **🚨 ACCIÓN REQUERIDA:**

### **Implementar `viewer_load_failed`**
El evento `viewer_load_failed` está marcado como "IMPLEMENTADO" en el catálogo pero **NO existe en el código**.

**Ubicaciones sugeridas para implementar:**
1. **`ProjectVisualizer.jsx`** - En los bloques `catch` existentes
2. **Error boundaries** - En `TilesetErrorBoundary` 
3. **Hooks de carga** - En `useProject()` cuando hay errores de carga

**Ejemplo de implementación:**
```javascript
// En ProjectVisualizer.jsx, en algún catch block
catch (error) {
  console.error('Error cargando viewer:', error);
  trackEvent('viewer_load_failed', {
    project_id: projectId,
    error_message: error.message,
    error_type: error.name,
    cesium_version: Cesium.VERSION || 'unknown'
  });
}
```

---

## **✅ CONCLUSIÓN:**
- **7 de 8 eventos** están correctamente implementados
- **1 evento** (`viewer_load_failed`) requiere implementación
- Los eventos implementados usan tanto **PostHog** como **Customer.io**
- La implementación es consistente y bien estructurada
