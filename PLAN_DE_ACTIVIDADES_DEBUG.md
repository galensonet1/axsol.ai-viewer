# 🔍 Debug: Plan de Actividades No Se Carga

## 📊 Análisis del Problema

### Cómo funciona la capa "Plan de Actividades"

La capa del Plan de Actividades se carga de manera diferente a otras capas (como fotos o imágenes 360):

**Otras capas (fotos, 360°):**
```javascript
// Usan useLayerData hook y cargan CZML desde el backend
const imagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
```

**Plan de Actividades:**
```javascript
// Obtiene URL directamente desde la base de datos
const planUrl = projectData?.weekly_construction_plan;
// Pasa la URL al componente CzmlLayer
<CzmlLayer 
  data={hasActivityPlan ? planUrl : null}
  visible={!!layerVisibility.plan}
  layerKey="plan"
/>
```

---

## 🔍 Posibles Causas del Error

### 1. ❌ El campo `weekly_construction_plan` no existe en la BD

**Ubicación:** Tabla `projects`, columna `weekly_construction_plan`

**Verificar:**
```sql
-- Conectar a PostgreSQL
SELECT 
  id, 
  name, 
  weekly_construction_plan 
FROM projects 
WHERE id = 'tu-project-id';
```

**Solución si está NULL:**
- Necesitas subir un archivo CZML del plan de actividades
- O agregar la URL del archivo en ese campo

---

### 2. ❌ La URL del archivo es incorrecta

**Logs actuales en consola:**

Busca estos logs en la consola del navegador:
```
[PLAN DEBUG] hasActivityPlan calculated: true/false
[PLAN DEBUG] raw weekly_construction_plan: ...
[PLAN DEBUG] constructed planUrl: ...
```

**Archivo:** `ProjectVisualizer.jsx` líneas 307-326

**Verificar:**
- ¿El log dice `hasActivityPlan: false`? → El campo está vacío en BD
- ¿El log dice `hasActivityPlan: true` pero no se ve la URL? → Hay un problema de construcción de URL
- ¿Sale error 404 en Network tab? → El archivo no existe en el servidor

---

### 3. ❌ El archivo CZML no existe en el servidor

**Ubicación esperada del archivo:**

Si `weekly_construction_plan = "/uploads/plans/plan-semanal.czml"`:
```
Backend: /path/to/backend/uploads/plans/plan-semanal.czml
```

**Verificar en el servidor:**
```bash
# SSH al servidor backend
ls -la uploads/plans/
# ¿Existe el archivo plan-semanal.czml?
```

---

### 4. ❌ Error de CORS o permisos

**Error en consola:**
```
Access to fetch at 'http://backend/uploads/...' from origin 'http://frontend' 
has been blocked by CORS policy
```

**Solución:**
Configurar CORS en el backend para permitir acceso a archivos estáticos.

---

## 🛠️ Pasos para Debugear

### Paso 1: Verificar Logs en Consola

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Filtra por: `[PLAN DEBUG]` o `[CzmlLayer]`
4. Busca estos mensajes:

```javascript
[PROJECT DEBUG] projectData completo: {...}
[PROJECT DEBUG] weekly_construction_plan: "/uploads/..." o null
[PLAN DEBUG] hasActivityPlan calculated: true/false
[PLAN DEBUG] raw weekly_construction_plan: ...
[PLAN DEBUG] constructed planUrl: http://...
[CzmlLayer] Error al cargar CZML (plan): ...
```

---

### Paso 2: Verificar Network Tab

1. Abre DevTools → Network tab
2. Filtra por: `czml` o `plan`
3. Busca request a la URL del plan
4. Verifica:
   - ❓ ¿Se hace el request? → Si NO, el problema es que `planUrl` es `null`
   - ❓ ¿Da 404? → El archivo no existe
   - ❓ ¿Da 403? → Problema de permisos
   - ❓ ¿Da 500? → Error del servidor

---

### Paso 3: Verificar Base de Datos

```sql
-- PostgreSQL
SELECT 
  p.id,
  p.name,
  p.weekly_construction_plan,
  p.opcions
FROM projects p
WHERE p.id = 'tu-project-id';
```

**Resultado esperado:**
```
weekly_construction_plan: "/uploads/plans/proyecto-x.czml"
```

**Si es NULL:**
Necesitas actualizar el registro:
```sql
UPDATE projects 
SET weekly_construction_plan = '/uploads/plans/plan-semanal.czml'
WHERE id = 'tu-project-id';
```

---

### Paso 4: Verificar el Archivo en el Servidor

```bash
# SSH al backend
cd /ruta/del/backend
ls -la uploads/plans/

# Verificar contenido del archivo
cat uploads/plans/plan-semanal.czml

# El archivo debe ser un JSON válido:
[
  {
    "id": "document",
    "version": "1.0"
  },
  {
    "id": "actividad-1",
    "name": "Excavación Zona A",
    "position": { ... },
    ...
  }
]
```

---

## 🔧 Soluciones Comunes

### Solución 1: Archivo No Existe

**Crear archivo CZML de ejemplo:**

```bash
# Crear directorio
mkdir -p uploads/plans

# Crear archivo CZML de prueba
cat > uploads/plans/plan-semanal.czml << 'EOF'
[
  {
    "id": "document",
    "version": "1.0",
    "name": "Plan Semanal"
  },
  {
    "id": "actividad-1",
    "name": "Excavación - Semana 1",
    "description": "Excavación de cimientos zona norte",
    "position": {
      "cartographicDegrees": [-70.6483, -33.4569, 0]
    },
    "billboard": {
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "scale": 0.5
    },
    "label": {
      "text": "Excavación",
      "font": "14pt sans-serif",
      "fillColor": {
        "rgba": [255, 255, 0, 255]
      },
      "outlineColor": {
        "rgba": [0, 0, 0, 255]
      },
      "outlineWidth": 2,
      "style": "FILL_AND_OUTLINE",
      "verticalOrigin": "BOTTOM",
      "pixelOffset": {
        "cartesian2": [0, -10]
      }
    }
  }
]
EOF
```

**Actualizar BD:**
```sql
UPDATE projects 
SET weekly_construction_plan = '/uploads/plans/plan-semanal.czml'
WHERE id = 'tu-project-id';
```

---

### Solución 2: URL Relativa vs Absoluta

**Problema:** La URL es relativa pero el backend espera absoluta.

**Código actual** (línea 319-322):
```javascript
const baseUrl = window.__CONFIG__?.apiBaseUrl || 'http://localhost:3001';
const fullUrl = `${baseUrl}${raw}`;
```

**Verificar que `window.__CONFIG__.apiBaseUrl` esté configurado:**

```javascript
// En consola del navegador:
console.log(window.__CONFIG__);
// Debe mostrar: { apiBaseUrl: 'https://tu-backend.com', ... }
```

---

### Solución 3: Activar la Capa en LayerSelector

**Verificar que la capa esté visible:**

1. Abrir panel de capas (botón "Layers")
2. Buscar checkbox "Plan de Actividades"
3. Marcar el checkbox

**Código:**
```javascript
layerVisibility.plan === true
```

---

## 📋 Checklist de Debug

### Consola del Navegador
- [ ] `[PLAN DEBUG] hasActivityPlan calculated: true` ✅
- [ ] `[PLAN DEBUG] constructed planUrl:` muestra URL completa ✅
- [ ] No hay error `[CzmlLayer] Error al cargar CZML (plan)` ✅

### Network Tab
- [ ] Se hace request al archivo CZML ✅
- [ ] Status Code: 200 ✅
- [ ] Response es JSON válido ✅

### Base de Datos
- [ ] Campo `weekly_construction_plan` NO es NULL ✅
- [ ] Valor es una ruta válida (ej: `/uploads/plans/plan.czml`) ✅

### Servidor Backend
- [ ] Archivo existe en la ruta especificada ✅
- [ ] Archivo tiene permisos de lectura ✅
- [ ] Archivo es JSON válido ✅

### Visor 3D
- [ ] Capa "Plan de Actividades" está marcada en LayerSelector ✅
- [ ] `layerVisibility.plan === true` ✅

---

## 🚀 Test Rápido

**Ejecuta esto en la consola del navegador:**

```javascript
// 1. Verificar datos del proyecto
console.log('Project Data:', window.__PROJECT_DATA__ || 'No disponible');

// 2. Verificar plan URL
const plan = window.__PROJECT_DATA__?.weekly_construction_plan;
console.log('Plan URL:', plan);

// 3. Verificar configuración
console.log('API Base URL:', window.__CONFIG__?.apiBaseUrl);

// 4. Construir URL completa
if (plan) {
  const base = window.__CONFIG__?.apiBaseUrl || window.location.origin;
  const fullUrl = plan.startsWith('http') ? plan : `${base}${plan}`;
  console.log('Full Plan URL:', fullUrl);
  
  // 5. Probar fetch
  fetch(fullUrl)
    .then(res => res.json())
    .then(data => console.log('Plan CZML cargado:', data))
    .catch(err => console.error('Error cargando plan:', err));
}
```

---

## 📞 Resultado Esperado

Después de solucionar, deberías ver:

**Consola:**
```
[PLAN DEBUG] hasActivityPlan calculated: true
[PLAN DEBUG] constructed planUrl: https://bo.ingeia.tech/uploads/plans/plan-semanal.czml
[CzmlLayer] Aplicado SplitDirection a X entidades (si aplica)
```

**Network Tab:**
```
GET /uploads/plans/plan-semanal.czml
Status: 200 OK
Type: application/json
Size: X KB
```

**Visor 3D:**
- ✅ Puntos/marcadores del plan visible en el mapa
- ✅ Al hacer click se muestra info de la actividad
- ✅ Labels con nombre de actividades

---

**¿Necesitas ayuda específica con algún paso?** Comparte los logs que ves en consola.
