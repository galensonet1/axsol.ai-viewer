# 🔇 Console Logs - Estado de Limpieza

**Fecha:** 19 Oct 2025  
**Objetivo:** Reducir ruido en consola, mantener solo logs de `[Analytics]` y errores críticos

---

## ✅ Logs Deshabilitados (Comentados)

### **ProjectVisualizer.jsx**

**Debug de Proyecto y Plan:**
- ❌ `[PROJECT DEBUG] projectData completo`
- ❌ `[PROJECT DEBUG] weekly_construction_plan`
- ❌ `[PLAN DEBUG] hasActivityPlan calculated`
- ❌ `[PLAN DEBUG] raw weekly_construction_plan`
- ❌ `[PLAN DEBUG] URL absoluta detectada`
- ❌ `[PLAN DEBUG] constructed planUrl`
- ❌ `[PLAN DEBUG] raw NO es string válido`
- ❌ `[PLAN DEBUG] planUrl retornando NULL`

**BaseMap:**
- ❌ `useEffect baseMap disparado`
- ❌ `baseMap: viewer no disponible aún`
- ❌ `baseMap removido del viewer`
- ❌ `baseMap desactivado, removiendo datasource`
- ❌ `Solicitando IonResource 3910570`
- ❌ `Cargando GeoJsonDataSource Areas Nqn`
- ❌ `GeoJsonDataSource agregado al viewer`
- ❌ `Cleanup baseMap useEffect ejecutado`

**Viewer & Entidades:**
- ❌ `Viewer ready`
- ❌ `Componente inicializado con projectId`
- ❌ `LayerSelector principal colapsado`
- ❌ `LayerSelector principal restaurado`
- ❌ `selectedEntityChanged disparado`
- ❌ `selectedEntityChanged listener configurado`
- ❌ `handleElementSelection called with`
- ❌ `Entity details`
- ❌ `Activity plan entity selected`
- ❌ `Feature seleccionado, metadata`

**Extracción de Datos:**
- ❌ `Descripción encontrada`
- ❌ `URL extraída de descripción`
- ❌ `URL directa encontrada`
- ❌ `Datos de foto extraídos`
- ❌ `Datos de foto 360° extraídos`
- ❌ `Datos de foto sin propiedades extraídos`
- ❌ `Setting selectedElement`
- ❌ `Elemento seleccionado`

**Sincronización:**
- ❌ `Reloj sincronizado a`
- ❌ `Usando viewer desde ref como fallback`
- ❌ `Aplicando vista desde URL`

---

## ✅ Logs Activos (Mantenidos)

### **📊 Analytics** - SIEMPRE ACTIVOS

Todos los logs con prefijo `[Analytics]` están activos en modo desarrollo:

```javascript
console.log('📊 [Analytics] viewer_loaded', { ... });
console.log('📊 [Analytics] camera_moved', { ... });
console.log('📊 [Analytics] layer_toggled', { ... });
```

**Configuración en `src/utils/analytics.js`:**
```javascript
if (import.meta.env.DEV) {
  console.log(`📊 [Analytics] ${eventName}`, enrichedProps);
}
```

### **⚠️ Warnings Críticos** - ACTIVOS

Se mantienen activos para debugging de errores:

**ProjectVisualizer.jsx:**
- ⚠️ `Tipo de fecha no soportado` (línea ~168)
- ⚠️ `Fecha inválida después del procesamiento` (línea ~173)
- ⚠️ `No se pudo parsear project_polygon_geojson` (línea ~361)
- ⚠️ `No se pudo calcular BoundingSphere` (línea ~422)
- ⚠️ `Error buscando fotos cercanas` (línea ~832)
- ⚠️ `No se pudo calcular altura relativa async` (línea ~1063)

### **❌ Errors Críticos** - ACTIVOS

Se mantienen para troubleshooting:

**ProjectVisualizer.jsx:**
- ❌ `Error en planUrl` (línea ~346) - MANTENIDO
- ❌ `Error extrayendo URL de descripción` (línea ~771)

---

## 🎯 Resultado en Consola

### **Antes (Ruidoso):**
```
🔍 [PROJECT DEBUG] projectData completo: {...}
🔍 [PROJECT DEBUG] weekly_construction_plan: /public/plans/...
📋 [PLAN DEBUG] hasActivityPlan calculated: true
🔗 [PLAN DEBUG] raw weekly_construction_plan: /public/plans/...
🔗 [PLAN DEBUG] constructed planUrl: http://localhost:3001/public/plans/...
[ProjectVisualizer] useEffect baseMap disparado { ... }
[ProjectVisualizer] Viewer ready: Viewer {...}
[ProjectVisualizer] handleElementSelection called with: Entity {...}
[ProjectVisualizer] Entity details: { id: '...', ... }
[ProjectVisualizer] Datos de foto extraídos: { ... }
[ProjectVisualizer] Setting selectedElement: { ... }
📊 [Analytics] viewer_loaded { project_id: '123', ... }
📊 [Analytics] entity_clicked { entity_type: 'photo', ... }
```

### **Ahora (Limpio):**
```
📊 [Analytics] viewer_loaded { project_id: '123', load_time_ms: 1234, ... }
📊 [Analytics] camera_moved { movement_type: 'zoom', altitude_m: 1250, ... }
📊 [Analytics] layer_toggled { layer_type: 'fotos', enabled: true, ... }
📊 [Analytics] entity_clicked { entity_type: 'photo', ... }
```

**Solo se ven:**
- ✅ Eventos de Analytics (📊)
- ⚠️ Warnings de errores críticos
- ❌ Errors importantes

---

## 🔧 Cómo Re-habilitar Logs de Debug

Si necesitas debugging temporal, descomentar líneas específicas:

### **Ejemplo: Debug de Plan de Actividades**

```javascript
// En ProjectVisualizer.jsx, líneas 328-350
const planUrl = useMemo(() => {
  try {
    const raw = projectData?.weekly_construction_plan;
    console.log('🔗 [PLAN DEBUG] raw weekly_construction_plan:', raw); // ← Descomentar
    if (raw && typeof raw === 'string') {
      if (/^https?:\/\//i.test(raw)) {
        console.log('🔗 [PLAN DEBUG] URL absoluta detectada:', raw); // ← Descomentar
        return raw;
      }
      const baseUrl = window.__CONFIG__?.apiBaseUrl || 'http://localhost:3001';
      const fullUrl = `${baseUrl}${raw}`;
      console.log('🔗 [PLAN DEBUG] constructed planUrl:', fullUrl); // ← Descomentar
      return fullUrl;
    }
  } catch (error) {
    console.error('❌ [PLAN DEBUG] Error en planUrl:', error); // ← YA ACTIVO
  }
  return null;
}, [projectData?.weekly_construction_plan, projectId]);
```

### **Ejemplo: Debug de Entity Selection**

```javascript
// En ProjectVisualizer.jsx, líneas 837-846
const handleElementSelection = useCallback(async (entity) => {
  console.log('[ProjectVisualizer] handleElementSelection called with:', entity); // ← Descomentar
  console.log('[ProjectVisualizer] Entity details:', {  // ← Descomentar
    id: entity.id,
    name: entity.name,
    hasProperties: !!entity.properties,
    hasBillboard: !!entity.billboard,
    hasPosition: !!entity.position,
    properties: entity.properties ? Object.keys(entity.properties) : 'none'
  });
  // ... resto del código
```

---

## 📋 Checklist de Limpieza

- [x] ProjectVisualizer.jsx - Debug de proyecto y plan
- [x] ProjectVisualizer.jsx - BaseMap logs
- [x] ProjectVisualizer.jsx - Viewer initialization
- [x] ProjectVisualizer.jsx - Entity selection
- [x] ProjectVisualizer.jsx - Data extraction
- [x] ProjectVisualizer.jsx - Clock sync
- [ ] LayerSelector.jsx (si tiene logs ruidosos)
- [ ] ViewerToolBar.jsx (si tiene logs ruidosos)
- [ ] InfoBox.jsx (si tiene logs ruidosos)
- [ ] MediaLightbox.jsx (revisar si tiene logs)
- [ ] ComparisonModal.jsx (revisar si tiene logs)

---

## 🎯 Beneficios

✅ **Consola más limpia** - Solo info relevante  
✅ **Testing de Analytics fácil** - Los eventos se ven claros  
✅ **Performance** - Menos operaciones de logging  
✅ **Debug selectivo** - Descomentar solo lo necesario  
✅ **Errors visibles** - Los problemas críticos siguen apareciendo  

---

## 📝 Notas

- Los logs de Analytics están controlados por `import.meta.env.DEV` en `analytics.js`
- En producción, los logs de Analytics NO se mostrarán automáticamente
- Los `console.warn` y `console.error` se mantienen para troubleshooting
- Si necesitas más debugging, usa React DevTools o PostHog Toolbar en lugar de console.log

---

**Última actualización:** 19 Oct 2025, 22:25 hrs
