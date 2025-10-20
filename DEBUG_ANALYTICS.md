# 🔍 Debug Analytics - No Aparecen Eventos

**Problema:** No se ven eventos con `[Analytics]` en consola

---

## ✅ Cambios Aplicados para Diagnosticar

### **1. analytics.js**

Agregado log de debug temporal en `trackEvent`:

```javascript
export const trackEvent = (eventName, properties = {}, options = {}) => {
  // Debug: verificar que la función se está llamando
  console.log('🔍 [DEBUG] trackEvent llamado:', eventName);
  
  // ... resto del código
  
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || !import.meta.env.PROD;
  if (isDev) {
    console.log(`📊 [Analytics] ${eventName}`, enrichedProps);
  }
}
```

### **2. useCameraTracking.js**

Agregados logs en el hook:

```javascript
useEffect(() => {
  console.log('🔍 [DEBUG] useCameraTracking effect ejecutado', { 
    hasViewer: !!viewer, 
    enabled, 
    projectId 
  });
  
  if (!viewer || !enabled) {
    console.log('⚠️ [DEBUG] useCameraTracking: viewer o enabled es falso');
    return;
  }

  console.log('✅ [DEBUG] useCameraTracking: Inicializando tracking');
  
  if (trackOnMount) {
    console.log('🎯 [DEBUG] useCameraTracking: Trackeando posición inicial');
    trackCameraPosition('initial');
  }
  // ...
```

```javascript
const trackCameraPosition = useCallback((movementType = 'manual') => {
  console.log('🎯 [DEBUG] trackCameraPosition llamado, tipo:', movementType);
  
  if (!enabled || !viewer) {
    console.log('⚠️ [DEBUG] trackCameraPosition: viewer o enabled es falso');
    return;
  }

  const cameraData = getCameraData();
  if (!cameraData) {
    console.log('⚠️ [DEBUG] trackCameraPosition: No hay camera data');
    return;
  }
  
  console.log('📸 [DEBUG] Camera data obtenido:', cameraData);
  // ... llamada a trackEvent
```

---

## 🧪 Pasos para Diagnosticar

### **Paso 1: Abrir el Proyecto**

```bash
cd apps/site
npm run dev
```

Luego abrir: http://localhost:5173/projects/[PROJECT_ID]/viewer

### **Paso 2: Abrir DevTools**

`F12` o `Cmd+Option+I` (Mac) o `Ctrl+Shift+I` (Windows)

### **Paso 3: Ver Console y Buscar Logs**

Deberías ver logs de debug al cargar la página:

---

## 📊 Escenarios Posibles

### **✅ CASO 1: Todo Funciona**

Si ves esto en consola:
```
🔍 [DEBUG] useCameraTracking effect ejecutado { hasViewer: true, enabled: true, projectId: '123' }
✅ [DEBUG] useCameraTracking: Inicializando tracking
🎯 [DEBUG] useCameraTracking: Trackeando posición inicial
🎯 [DEBUG] trackCameraPosition llamado, tipo: initial
📸 [DEBUG] Camera data obtenido: { latitude: -33.45, longitude: -70.64, ... }
🔍 [DEBUG] trackEvent llamado: camera_moved
📊 [Analytics] camera_moved { latitude: '-33.456700', ... }
🔍 [DEBUG] trackEvent llamado: viewer_loaded
📊 [Analytics] viewer_loaded { project_id: '123', load_time_ms: 1234 }
```

**✅ Todo funciona correctamente**

---

### **⚠️ CASO 2: Hook No Se Ejecuta**

Si ves esto:
```
🔍 [DEBUG] useCameraTracking effect ejecutado { hasViewer: false, enabled: true, projectId: '123' }
⚠️ [DEBUG] useCameraTracking: viewer o enabled es falso
```

**Problema:** El `cesiumViewer` aún no está disponible cuando se ejecuta el hook.

**Solución:**
- Verificar que `cesiumViewer` esté siendo pasado correctamente desde `ProjectVisualizer.jsx`
- El viewer se pasa después de `handleViewerReady`, puede haber un timing issue

**Fix en ProjectVisualizer.jsx:**
```javascript
// Verificar que esto esté DESPUÉS de setCesiumViewer(viewer)
const { trackHomeView } = useCameraTracking(cesiumViewer, projectId, {
  throttleMs: 3000,
  trackOnMount: true
});
```

---

### **⚠️ CASO 3: trackEvent No Se Llama**

Si ves:
```
🎯 [DEBUG] trackCameraPosition llamado, tipo: initial
📸 [DEBUG] Camera data obtenido: { ... }
// PERO NO VES: 🔍 [DEBUG] trackEvent llamado
```

**Problema:** El import de `trackEvent` falló o hay un error en la llamada.

**Solución:**
1. Verificar import en `useCameraTracking.js`:
   ```javascript
   import { trackEvent } from '../utils/analytics';
   ```

2. Verificar que `analytics.js` existe en:
   ```
   apps/site/src/utils/analytics.js
   ```

3. Verificar errores en consola (pestaña Console, filtrar por "error")

---

### **⚠️ CASO 4: trackEvent Se Llama Pero No Loguea**

Si ves:
```
🔍 [DEBUG] trackEvent llamado: camera_moved
// PERO NO VES: 📊 [Analytics] camera_moved
```

**Problema:** La detección de modo desarrollo (`import.meta.env.DEV`) está fallando.

**Solución:**
Verificar variable de entorno en `analytics.js`:
```javascript
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || !import.meta.env.PROD;
console.log('🔍 [DEBUG] isDev:', isDev);
console.log('🔍 [DEBUG] import.meta.env:', import.meta.env);
```

**Si isDev es false**, agregar esta línea temporal:
```javascript
// analytics.js - línea 43
const isDev = true; // TEMPORAL: forzar dev mode para debugging
```

---

### **⚠️ CASO 5: No Aparece NINGÚN Log**

Si NO ves ningún log de `[DEBUG]`:

**Problema:** Los archivos no se recompilaron o el navegador tiene cache.

**Solución:**

1. **Hard Refresh del navegador:**
   - Mac: `Cmd+Shift+R`
   - Windows/Linux: `Ctrl+Shift+R`

2. **Reiniciar el dev server:**
   ```bash
   # En terminal donde corre npm run dev
   Ctrl+C
   npm run dev
   ```

3. **Limpiar cache de Vite:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

4. **Verificar que los archivos se guardaron:**
   ```bash
   # Verificar última modificación
   ls -la apps/site/src/utils/analytics.js
   ls -la apps/site/src/hooks/useCameraTracking.js
   ```

---

## 🔧 Verificaciones Adicionales

### **Check 1: Import en ProjectVisualizer.jsx**

```javascript
// Línea 37-39
import useCameraTracking from '../hooks/useCameraTracking';
import useTimelineTracking from '../hooks/useTimelineTracking';
import { trackEvent, trackTiming, trackError, trackFeatureFirstUse } from '../utils/analytics';
```

### **Check 2: Uso del Hook**

```javascript
// Línea 305-310
const { trackHomeView } = useCameraTracking(cesiumViewer, projectId, {
  throttleMs: 3000,
  trackOnMount: true
});
useTimelineTracking(cesiumViewer, projectId);
```

**¿`cesiumViewer` es null aquí?** → Ese es el problema

### **Check 3: Estado de cesiumViewer**

Agregar este log temporal en ProjectVisualizer.jsx después de los hooks:

```javascript
// Después de línea 310
useEffect(() => {
  console.log('🔍 [DEBUG] cesiumViewer state:', {
    cesiumViewer: !!cesiumViewer,
    projectId,
    viewerReady: cesiumViewer?.scene?.isReady
  });
}, [cesiumViewer, projectId]);
```

---

## 🎯 Reporte de Diagnóstico

**Por favor, copia y pega lo que ves en tu consola:**

```
# === LOGS DE CONSOLA ===

[Pegar aquí los logs que aparecen]

# === ERRORES (si hay) ===

[Pegar aquí los errores en rojo]

# === WARNINGS (si hay) ===

[Pegar aquí los warnings en amarillo]
```

---

## 🚀 Solución Rápida (Temporal)

Si nada funciona, agregar esto temporalmente al inicio de `ProjectVisualizer.jsx`:

```javascript
// TEMPORAL: Test de analytics
useEffect(() => {
  console.log('🧪 [TEST] Probando trackEvent directamente');
  
  // Importar al inicio del archivo si no está
  // import { trackEvent } from '../utils/analytics';
  
  trackEvent('test_event', {
    test: true,
    project_id: projectId
  });
}, [projectId]);
```

Si ves `🔍 [DEBUG] trackEvent llamado: test_event` → **trackEvent funciona**  
Si NO lo ves → **Problema con el import o el archivo**

---

**Siguiente paso:** Ejecuta el diagnóstico y comparte los logs que ves. 🔍
