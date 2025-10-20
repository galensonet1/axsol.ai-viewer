# 🚀 PostHog Setup - AXSOL Viewer

**Objetivo:** Configurar PostHog para recibir eventos de analytics en tiempo real

---

## 📋 Estado Actual

### ✅ Lo Que Funciona
- ✅ Sistema de tracking implementado
- ✅ Eventos se capturan en desarrollo (logs en consola)
- ✅ 17 eventos core implementados

### ⚠️ Lo Que Falta
- ❌ PostHog API key no configurada
- ❌ Eventos no se envían a PostHog
- ❌ Solo warnings: `[Analytics] PostHog no disponible`

---

## 🔧 Configuración Rápida

### **Paso 1: Obtener API Key de PostHog**

#### **Opción A: Ya tienes cuenta PostHog**

1. Ve a: https://app.posthog.com/project/settings
2. Busca la sección **"Project API Key"**
3. Copia el token (formato: `phc_xxxxxxxxxxxxx`)

#### **Opción B: Crear cuenta nueva (FREE)**

1. Ve a: https://posthog.com/
2. Click en **"Get started - free"**
3. Crea cuenta (GitHub, Google, o email)
4. Completa setup inicial:
   - **Organization name:** AXSOL
   - **Project name:** AXSOL Viewer
5. En el dashboard, ve a **Settings → Project API Key**
6. Copia el token

---

### **Paso 2: Configurar .env**

Crear o editar archivo `.env` en `apps/site/`:

```bash
# apps/site/.env

# PostHog Configuration
VITE_POSTHOG_KEY=phc_TU_API_KEY_AQUI
VITE_POSTHOG_HOST=https://app.posthog.com

# Segment (opcional por ahora)
# VITE_SEGMENT_WRITE_KEY=tu_segment_key

# Customer.io (opcional por ahora)
# VITE_CUSTOMERIO_SITE_ID=tu_customerio_id
```

**Reemplaza** `phc_TU_API_KEY_AQUI` con tu key real.

---

### **Paso 3: Instalar PostHog SDK**

Si no está instalado:

```bash
cd apps/site
npm install posthog-js
```

---

### **Paso 4: Inicializar PostHog**

Verificar que existe el archivo de inicialización:

**Ruta:** `apps/site/src/main.jsx` o `apps/site/src/App.jsx`

Agregar antes de ReactDOM.render:

```javascript
// main.jsx o App.jsx
import posthog from 'posthog-js';

// Inicializar PostHog
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    
    // Configuración recomendada
    autocapture: false,  // Solo eventos manuales
    capture_pageview: false,  // Lo manejamos manualmente
    capture_pageleave: true,
    
    // Session recording (opcional)
    disable_session_recording: false,
    
    // Persistence
    persistence: 'localStorage',
    
    // Debug en desarrollo
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        console.log('✅ PostHog inicializado correctamente');
        console.log('📊 PostHog API Key:', import.meta.env.VITE_POSTHOG_KEY?.substring(0, 15) + '...');
      }
    }
  });

  // Exponer globalmente para analytics.js
  window.posthog = posthog;
} else {
  console.warn('⚠️ PostHog: VITE_POSTHOG_KEY no configurado');
}
```

---

### **Paso 5: Reiniciar Servidor**

```bash
# En terminal del dev server
Ctrl+C

# Reiniciar
npm run dev
```

**Importante:** Las variables de entorno solo se cargan al iniciar el servidor.

---

## ✅ Verificación

### **1. Ver Logs en Consola**

Después de reiniciar, deberías ver:

```javascript
✅ PostHog inicializado correctamente
📊 PostHog API Key: phc_xxxxxxxxxx...
```

**Si NO ves esto:**
- ❌ La API key no está en `.env`
- ❌ El servidor no se reinició
- ❌ El código de inicialización no se ejecutó

---

### **2. Interactuar con el Viewer**

Abre el viewer: `http://localhost:5173/projects/1/viewer`

Realiza estas acciones:
- ✅ Activar/desactivar capas
- ✅ Cambiar fecha de captura
- ✅ Mover la cámara
- ✅ Click en una entidad

**Deberías ver en consola:**
```javascript
📊 [Analytics] layer_toggled { layer_type: 'fotos', enabled: true, ... }
📊 [Analytics] capture_date_changed { ... }
📊 [Analytics] camera_moved { ... }
📊 [Analytics] entity_clicked { ... }
```

**SIN los warnings de:**
```
⚠️ [Analytics] PostHog no disponible  ← Ya NO debe aparecer
```

---

### **3. Verificar en PostHog Dashboard**

#### **A. Live Events**

1. Ve a PostHog: https://app.posthog.com/
2. Click en **"Activity"** (sidebar izquierdo)
3. Click en **"Live Events"**
4. Deberías ver eventos llegando EN TIEMPO REAL

**Eventos a buscar:**
- `layer_toggled`
- `capture_date_changed`
- `camera_moved`
- `entity_clicked`
- `viewer_loaded`

#### **B. Persons**

1. Ve a **"Persons"** (sidebar)
2. Deberías ver tu sesión con:
   - IP address
   - Browser info
   - Events capturados

---

## 🐛 Troubleshooting

### **Problema 1: Sigue apareciendo "PostHog no disponible"**

**Causa:** `window.posthog` no está inicializado

**Solución:**

1. Verificar que `.env` existe y tiene la key:
   ```bash
   cat apps/site/.env | grep POSTHOG
   ```

2. Verificar que el código de init se ejecuta:
   ```javascript
   // Agregar log temporal en analytics.js
   console.log('🔍 window.posthog:', window.posthog);
   ```

3. Verificar orden de inicialización:
   - PostHog debe init ANTES de cargar el viewer
   - El código debe estar en `main.jsx` o importado antes del componente

---

### **Problema 2: PostHog init pero no llegan eventos**

**Causa:** Bloqueador de anuncios o adblocker

**Solución:**

1. Desactivar extensiones de ad-blocking temporalmente
2. Verificar en Network tab (DevTools) si hay requests a PostHog:
   ```
   https://app.posthog.com/capture/
   ```

3. Revisar errores CORS en consola

---

### **Problema 3: "Invalid API key"**

**Causa:** API key incorrecta o de otro proyecto

**Solución:**

1. Verificar que copiaste el key completo (empieza con `phc_`)
2. Verificar que es del proyecto correcto en PostHog
3. Regenerar key si es necesario:
   - PostHog → Settings → Project API Key → Regenerate

---

### **Problema 4: Eventos duplicados**

**Causa:** PostHog se inicializa múltiples veces

**Solución:**

```javascript
// Asegurar init solo una vez
if (!window.posthog && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, { ... });
  window.posthog = posthog;
}
```

---

## 📊 Dashboards Recomendados

Una vez que los eventos funcionen, crear estos dashboards:

### **1. Viewer Performance**
- `viewer_loaded` → Load time histogram
- `tileset_loaded` → Load time by project

### **2. User Navigation**
- `camera_moved` → Heatmap de posiciones
- `home_view_activated` → Count
- `camera_session_ended` → Session duration avg

### **3. Feature Adoption**
- `layer_toggled` → By layer_type (funnel)
- `capture_date_changed` → Frequency
- `timeline_playback_control` → Play/pause ratio

### **4. Content Engagement**
- `entity_clicked` → By entity_type
- `media_lightbox_opened` → By media_type
- `photo360_viewer` → First use rate

---

## 🔐 Seguridad

### **Variables de Entorno en Producción**

**NO subir `.env` a git:**

```bash
# .gitignore ya debe incluir:
.env
.env.local
.env.production
```

**En producción (Vercel, Netlify, etc):**

1. Configurar variables de entorno en el dashboard
2. Usar variables diferentes para staging/production
3. Considerar crear proyectos separados en PostHog:
   - `AXSOL Viewer - Dev`
   - `AXSOL Viewer - Staging`
   - `AXSOL Viewer - Production`

---

## 🎯 Próximos Pasos

Una vez que PostHog funcione:

1. ✅ **Validar datos** - Verificar que todos los 17 eventos llegan
2. 📊 **Crear dashboards** - Usar plantillas de arriba
3. 🔔 **Configurar alertas** - Errores, FPS bajo, etc.
4. 🎥 **Session recordings** - Ver cómo usan el visor
5. 🔥 **Heatmaps** - Donde hacen click
6. 🧪 **A/B testing** - Probar features nuevos

---

## 📚 Recursos

- **PostHog Docs:** https://posthog.com/docs
- **Event tracking:** https://posthog.com/docs/libraries/js
- **Dashboards:** https://posthog.com/docs/user-guides/dashboards
- **Session recording:** https://posthog.com/docs/session-replay

---

**¿Necesitas ayuda?** Comparte los logs de consola y podemos debuggear juntos. 🚀
