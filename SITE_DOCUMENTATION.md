# 📚 AXSOL Viewer - SITE Application

> **Base de Conocimientos Técnica**  
> Versión: 1.0.0 | Octubre 2025

---

## 📑 Índice

- [1. Overview](#1-overview)
- [2. Arquitectura](#2-arquitectura)
- [3. Páginas](#3-páginas)
- [4. Componentes](#4-componentes)
- [5. Hooks](#5-hooks)
- [6. Contextos](#6-contextos)
- [7. Funcionalidades](#7-funcionalidades)
- [8. Troubleshooting](#8-troubleshooting)

---

## 1. Overview

### 1.1 ¿Qué es AXSOL Viewer?

Aplicación web de visualización geoespacial 3D para proyectos de construcción e ingeniería.

**Capacidades principales:**
- 🗺️ Visualización 3D/4D (3D + tiempo) con Cesium
- 📊 Dashboards de KPIs y métricas
- 📸 Galería de media georreferenciada
- 📅 Navegación temporal (timeline)
- 🔄 Comparación antes/después
- 👥 Gestión de permisos por roles

### 1.2 Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.1.1 | UI Framework |
| Vite | 7.1.7 | Build tool |
| Cesium | 1.133.1 | Motor 3D |
| Material-UI | 7.3.2 | Componentes UI |
| Auth0 | 2.5.0 | Autenticación |
| Axios | 1.12.2 | HTTP client |
| React Router | 7.9.3 | Navegación |

---

## 2. Arquitectura

### 2.1 Estructura de Carpetas

```
apps/site/src/
├── components/      # 22 componentes reutilizables
├── pages/          # 3 páginas principales
├── hooks/          # 5 custom hooks
├── context/        # 2 contextos (User, Project)
├── config/         # Configuración API
├── App.jsx         # Router principal
├── AppWrapper.jsx  # Auth wrapper
└── main.jsx        # Entry point
```

### 2.2 Flujo de Autenticación

```
Usuario → Auth0 Login → Callback → GET /api/user/me 
→ UserContext → Analytics identify → App
```

### 2.3 Componentes por Categoría

**Visualización 3D:**
- `ProjectVisualizer` - Visor Cesium principal
- `LayerSelector` - Control de capas
- `DateSelector` - Selector temporal
- `ViewerToolBar` - Herramientas 3D
- `InfoBox` - Info de entidades

**Media:**
- `MediaLightbox` - Galería de imágenes
- `PannellumViewerSlide` - Visor 360°
- `ImageCropper` - Editor de imágenes

**Proyecto:**
- `ProjectDashboard` - KPIs y métricas
- `ProjectList` - Lista de proyectos
- `ProjectLayout` - Layout común
- `GlobalMap` - Mapa global

**Comparación:**
- `ComparisonModal` - Modal de comparación
- `ComparisonMode` - Lógica de split-screen
- `CzmlComparisonLayer` - Layers comparación

**UI/UX:**
- `ControlPanel` - Panel de controles
- `GlobalKPIs` - KPIs globales
- `UserMenu` - Menú de usuario
- `ProtectedRoute` - Rutas protegidas

---

## 3. Páginas

### 3.1 HomePage (`/`)

**Archivo:** `src/pages/HomePage.jsx`

**Función:** Página de inicio con lista de proyectos y mapa global.

**Componentes:**
- `GlobalMap` - Mapa 2D con pins de proyectos
- `ProjectList` - Lista filtrable de proyectos
- `UserMenu` - Menú usuario

**API:** `GET /api/projects`

**Permisos:** Usuario autenticado

---

### 3.2 LoginPage (`/login`)

**Archivo:** `src/pages/LoginPage.jsx`

**Función:** Redirect a Auth0 Universal Login.

**Flujo:**
```javascript
isAuthenticated ? navigate('/') : loginWithRedirect()
```

---

### 3.3 ProjectDetailPage (`/projects/:id`)

**Archivo:** `src/pages/ProjectDetailPage.jsx`

**Función:** Layout para vistas del proyecto.

**Sub-rutas:**
- `/projects/:id` → Redirect a `/projects/:id/viewer`
- `/projects/:id/viewer` → `ProjectVisualizer`
- `/projects/:id/dashboard` → `ProjectDashboard`

**Context:** Provee `ProjectContext` con `projectId`

---

## 4. Componentes

### 4.1 ProjectVisualizer

**Archivo:** `src/components/ProjectVisualizer.jsx` (2369 líneas)

**Propósito:** Visor 3D principal con Cesium.

**Features:**
- CZML data loading por fecha
- Timeline navigation
- Entity selection (click)
- Layer management
- Comparison mode
- 3D Tilesets (Cesium Ion)
- Terrain loading
- Deep linking (state en URL)

**Hooks usados:**
- `useProject()` - ProjectId
- `useCzmlData()` - CZML layers
- `useAssetDates()` - Fechas disponibles
- `useDeepLink()` - URL sync
- `useCesium()` - Viewer instance

**Estados clave:**
```javascript
{
  selectedDate: "2024-06-15",
  selectedEntity: CesiumEntity,
  showInfoBox: boolean,
  layers: Map<string, CzmlDataSource>,
  comparisonMode: boolean,
  tileset: Cesium3DTileset
}
```

**Eventos Cesium:**
```javascript
handler.setInputAction((click) => {
  const picked = viewer.scene.pick(click.position);
  if (picked) handleEntityClick(picked.id);
}, ScreenSpaceEventType.LEFT_CLICK);
```

---

### 4.2 LayerSelector

**Archivo:** `src/components/LayerSelector.jsx`

**Props:**
- `layers: Map<string, CzmlDataSource>`
- `onLayerToggle: (id, visible) => void`
- `onOpacityChange: (id, opacity) => void`

**UI:**
- Checkboxes para visibilidad
- Sliders para opacidad (0-100%)
- Iconos por tipo de capa

---

### 4.3 DateSelector

**Archivo:** `src/components/DateSelector.jsx`

**Props:**
- `availableDates: string[]`
- `selectedDate: string`
- `onDateChange: (date) => void`

**Modos:**
- Dropdown de fechas
- Date Picker (MUI X)
- Timeline Slider

---

### 4.4 InfoBox

**Archivo:** `src/components/InfoBox.jsx`

**Propósito:** Panel de información de entidad seleccionada.

**Secciones:**
- Header (nombre/título)
- Properties (key-value pairs)
- Description
- Media gallery
- Actions (ver imágenes, 360°, editar)

**API:** `GET /api/assets/:id`

---

### 4.5 ComparisonModal

**Archivo:** `src/components/ComparisonModal.jsx`

**Propósito:** Comparar dos fechas del proyecto.

**Modos:**
- Split Screen (lado a lado)
- Slider (deslizador)
- Swipe (toggle)

**Cesium API:**
```javascript
viewer.scene.splitPosition = 0.5;
entity.splitDirection = SplitDirection.LEFT;
```

---

### 4.6 ProjectDashboard

**Archivo:** `src/components/ProjectDashboard.jsx`

**Propósito:** Dashboard de KPIs.

**API:** `GET /api/projects/:id/kpis`

**Visualizaciones:**
- KPI Cards (CAPEX, Avance%, Plazo)
- S-Curve (planeado vs real)
- Timeline de hitos
- Recursos (personal, maquinaria)

**Librería de charts:** Recharts

---

## 5. Hooks

### 5.1 useApi

**Archivo:** `src/hooks/useApi.js`

**Propósito:** Fetch data del backend con manejo de estado.

**Uso:**
```javascript
const { data, loading, error } = useApi('/projects');
```

**Returns:**
- `data`: Datos del endpoint
- `loading`: Boolean si está cargando
- `error`: Mensaje de error

**Implementación:** Axios + useEffect + useState

---

### 5.2 useCzmlData

**Archivo:** `src/hooks/useCzmlData.js`

**Propósito:** Cargar datos CZML por fecha.

**Uso:**
```javascript
const { layers, loading } = useCzmlData(projectId, selectedDate);
```

**API:** `POST /api/projects/:id/czml`

**Returns:**
- `layers`: Map<string, CzmlDataSource>
- `loading`: Boolean

---

### 5.3 useAssetDates

**Archivo:** `src/hooks/useAssetDates.js`

**Propósito:** Obtener fechas con assets disponibles.

**Uso:**
```javascript
const { dates } = useAssetDates(projectId);
```

**API:** `GET /api/projects/:id/dates`

**Returns:** Array de strings ISO `['2024-01-15', '2024-02-20', ...]`

---

### 5.4 useDeepLink

**Archivo:** `src/hooks/useDeepLink.js`

**Propósito:** Sincronizar estado de la app con URL.

**Params en URL:**
- `?date=2024-06-15` - Fecha seleccionada
- `?entity=123` - Entidad seleccionada
- `?layer=construction` - Capa activa
- `?view=lat,lon,height` - Posición cámara

**Uso:**
```javascript
const { updateParams, getParam } = useDeepLink();
updateParams({ date: '2024-06-15' });
```

---

### 5.5 useProjectPermissions

**Archivo:** `src/hooks/useProjectPermissions.js`

**Propósito:** Verificar permisos del usuario en un proyecto.

**Uso:**
```javascript
const { canEdit, canDelete, isAdmin } = useProjectPermissions(projectId);
```

**Lógica:**
```javascript
canEdit = user.roleIds.includes(EDITOR_ROLE) || 
          project.permission_level === 'admin';
```

---

## 6. Contextos

### 6.1 UserContext

**Archivo:** `src/context/UserContext.jsx`

**Propósito:** Estado global del usuario autenticado.

**Provider:** `<UserProvider>`

**State:**
```javascript
{
  user: {
    id: 123,
    email: "user@example.com",
    name: "John Doe",
    roles: ["Admin", "Editor"],
    roleIds: [5, 3],
    active: true
  },
  loadingUser: false,
  setUser: (user) => {},
  hasRole: (role) => boolean
}
```

**Hook:** `useUser()`

---

### 6.2 ProjectContext

**Archivo:** `src/context/ProjectContext.jsx`

**Propósito:** Proveer `projectId` a componentes del proyecto.

**Provider:** `<ProjectProvider projectId={id}>`

**State:**
```javascript
{
  projectId: "550e8400-e29b-41d4-a716-446655440000",
  project: { ...projectData },
  loading: false
}
```

**Hook:** `useProject()`

---

## 7. Funcionalidades

### 7.1 Visualización 3D

**Librería:** Cesium + Resium

**Capacidades:**
- Terreno mundial (Cesium World Terrain)
- 3D Tilesets (modelos BIM desde Cesium Ion)
- Imagería satelital
- CZML layers dinámicos
- Timeline temporal
- Cámara controlable (orbit, pan, zoom)

**Cesium Ion Token:** Configurado en `/api/config`

---

### 7.2 CZML Loading

**¿Qué es CZML?**
Cesium Language (JSON) para describir escenas 4D.

**Endpoint:** `POST /api/projects/:id/czml`

**Body:**
```json
{
  "date": "2024-06-15",
  "layers": ["construction", "images"]
}
```

**Response:** CZML document

**Proceso:**
1. Usuario selecciona fecha
2. Frontend hace POST con fecha
3. Backend genera CZML desde DB
4. Frontend carga en Cesium via `CzmlDataSource`

---

### 7.3 Entity Selection

**Trigger:** Click izquierdo en mapa

**Flujo:**
```
Click → scene.pick() → Entity ID → GET /api/assets/:id 
→ Show InfoBox → Load media
```

**Entity properties:**
```javascript
{
  id: "asset-123",
  name: "Torre A - Piso 5",
  description: "...",
  position: Cartesian3,
  properties: { ... },
  billboard/model/polygon: { ... }
}
```

---

### 7.4 Comparison Mode

**Activación:** Botón en `ViewerToolBar`

**UI:** `ComparisonModal`

**Implementación:**
```javascript
// Cargar dos sets de CZML
const czmlA = await fetchCzml(projectId, dateA);
const czmlB = await fetchCzml(projectId, dateB);

// Aplicar split direction
viewer.scene.splitPosition = 0.5;
dataSourceA.entities.forEach(e => {
  e.splitDirection = SplitDirection.LEFT;
});
dataSourceB.entities.forEach(e => {
  e.splitDirection = SplitDirection.RIGHT;
});
```

---

### 7.5 Media Gallery

**Tipos de media:**
- Imágenes (JPG, PNG)
- Videos (MP4)
- 360° Panoramas (Pannellum)
- PDFs (planos, documentos)

**Componentes:**
- `MediaLightbox` - Galería de imágenes
- `PannellumViewerSlide` - Visor 360°

**API:** `GET /api/assets/:id/media`

---

### 7.6 Dashboard KPIs

**Métricas principales:**

| KPI | Descripción | Cálculo |
|-----|-------------|---------|
| **CAPEX Total** | Inversión total | Sum de costos |
| **Avance Real** | Progreso actual | (completado / total) * 100 |
| **Avance Programado** | Progreso esperado | Según cronograma |
| **Variación** | Desfase | Real - Programado |
| **Días Restantes** | Hasta fin programado | end_date - today |

**S-Curve:**
- X-axis: Tiempo (meses)
- Y-axis: % Avance acumulado
- Lines: Planeado (azul) vs Real (verde)

---

## 8. Troubleshooting

### 8.1 Problemas Comunes

#### **Error: "No projects found"**

**Causa:** Usuario no tiene permisos en ningún proyecto.

**Solución:**
1. Verificar en AdminJS: `/admin`
2. Tabla `project_permissions`
3. Agregar permiso para usuario

#### **Error: "Cesium viewer failed to initialize"**

**Causa:** Token de Cesium Ion inválido o expirado.

**Solución:**
1. Verificar token en `/api/config`
2. Renovar en [Cesium Ion](https://ion.cesium.com)
3. Actualizar en DB: tabla `config`

#### **Error: "CZML data not loading"**

**Causa:** Endpoint `/api/projects/:id/czml` retorna error.

**Debug:**
```bash
# Check logs backend
curl -X POST http://localhost:3001/api/projects/:id/czml \
  -H "Authorization: Bearer TOKEN" \
  -d '{"date":"2024-06-15"}'
```

**Soluciones:**
- Verificar fecha existe en `assets` table
- Check DB connection
- Verificar permisos de proyecto

#### **Error: "User not found after login"**

**Causa:** Usuario no creado en DB después de Auth0 signup.

**Solución:**
1. Check logs de `findOrCreateUser()`
2. Verificar Auth0 → DB sync
3. Crear usuario manualmente si necesario

---

### 8.2 Performance Issues

#### **Visor 3D lento**

**Causas:**
- Muchos entities (>10k)
- Tilesets muy pesados
- Imágenes no optimizadas

**Soluciones:**
- Clustering de entities
- LOD (Level of Detail) en tilesets
- Lazy loading de imágenes
- Reducir `maximumScreenSpaceError` en tilesets

#### **Dashboard lento al cargar**

**Causas:**
- Query de KPIs complejo
- Muchos datos en S-Curve

**Soluciones:**
- Cachear KPIs en backend (Redis)
- Paginar/limitar datos de S-Curve
- Usar indexes en DB

---

### 8.3 Logs Importantes

**Frontend (Console):**
```
[AppWrapper] Usuario autenticado
[Analytics] Identifying user: user@example.com
[HomePage] Projects loaded: 5
[ProjectVisualizer] CZML loaded for date: 2024-06-15
[Cesium] Tileset loaded: project-123-model
```

**Backend:**
```
[AUTH] Usuario encontrado: user@example.com
[PROJECTS] Proyectos cargados: 5 para user_id=123
[CZML] Generating CZML for project=456, date=2024-06-15
[CZML] Entities generated: 1523
```

---

**Fin de Documentación Base**

Para detalles de implementación específicos, revisar código fuente en `apps/site/src/`.
