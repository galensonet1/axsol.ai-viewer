# Customer.io - Configuración e Integración

## ✅ Implementado

**Customer.io SDK integrado** en el paquete `@ingeia/analytics` con soporte completo para:
- ✅ **Screen tracking automático** en SPAs (SITE, WWW, LINE)
- ✅ **Event tracking** personalizado
- ✅ **User identification** sincronizado con PostHog
- ✅ **In-app messaging** y badges
- ✅ **Email campaigns** triggered por eventos

---

## 🚀 Configuración Inicial

### 1. Obtener Credenciales de Customer.io

1. Crea una cuenta en [Customer.io](https://customer.io)
2. Ve a **Settings** → **Account Settings** → **API Credentials**
3. Copia tu **Site ID** (ejemplo: `abc123def456`)
4. Identifica tu región: **US** o **EU**

### 2. Configurar Variables de Entorno

#### **SITE** (`apps/site/.env`):
```bash
VITE_CUSTOMERIO_SITE_ID=abc123def456
VITE_CUSTOMERIO_REGION=us  # o 'eu'
```

#### **WWW** (`apps/www/.env`):
```bash
VITE_CUSTOMERIO_SITE_ID=abc123def456
VITE_CUSTOMERIO_REGION=us  # o 'eu'
```

#### **LINE** (cuando se implemente):
```bash
VITE_CUSTOMERIO_SITE_ID=abc123def456
VITE_CUSTOMERIO_REGION=us
```

### 3. Reiniciar Apps

```bash
# Detener servidores
pkill -f vite

# Reiniciar
npm run dev        # Backend + SITE
npm run dev:www    # WWW
```

---

## 📊 Funcionalidad Implementada

### **Screen Tracking Automático**

Cada cambio de página en las SPAs se trackea automáticamente:

```typescript
// Ya implementado en useSpaPageviews()
// packages/analytics/src/index.ts

export function useSpaPageviews(getUrl: () => string) {
  useEffect(() => {
    const url = getUrl();
    
    // Track in PostHog
    posthog.capture('$pageview', { url });
    
    // Track in Clarity
    if (window.clarity) {
      window.clarity('set', 'page', url);
    }
    
    // Track in Customer.io ✅
    if (window._cio) {
      const pageName = url.split('?')[0];
      window._cio.page(pageName, { url });
    }
  }, [getUrl()]);
}
```

**Resultado:**
- Cada vista de página se registra en Customer.io
- Puedes crear **mensajes dirigidos a vistas específicas**
- Ejemplo: Mostrar badge solo en `/projects/:id/viewer`

---

### **Event: `first_visit`**

Se trackea automáticamente la primera visita:

```typescript
// Ya implementado en apps/site/src/main.jsx y apps/www/index.tsx

// Track first visit
const hasVisited = localStorage.getItem('cio_visited');
if (!hasVisited) {
  customerioTrack('first_visit', {
    app: 'site',
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('cio_visited', 'true');
}
```

**Este evento dispara el flujo de bienvenida.**

---

### **User Identification**

Cuando un usuario se autentica, se identifica automáticamente:

```typescript
import { identify } from '@ingeia/analytics';

// Ejemplo en componente de login/Auth0 callback
function onUserAuthenticated(user) {
  identify(user.id, {
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan,
    created_at: user.created_at
  });
}
```

**Esto sincroniza el usuario en PostHog + Customer.io**

---

## 🎯 Flujo de Bienvenida "first_visit"

### **Objetivo:**
1. Usuario llega por primera vez → Trigger `first_visit`
2. Mostrar **in-app badge** (mensaje dentro de la app)
3. Si no clickea en **24 horas** → Enviar **email de bienvenida**

---

## 📝 Configuración en Customer.io Dashboard

### **Paso 1: Crear el Flujo (Campaign)**

1. Ve a **Campaigns** → **New Campaign** → **Event-Triggered**
2. **Nombre:** "Bienvenida SITE"
3. **Trigger:** Evento `first_visit`
4. **Filtros:** `app = 'site'` (o 'www', 'line')

### **Paso 2: Agregar In-App Message**

1. **Agregar Acción** → **Send In-App Message**
2. **Tipo:** Badge (pequeño punto de notificación)
3. **Contenido:**
   ```
   Título: ¡Bienvenido! 👋
   Mensaje: Descubre cómo usar AXSOL Viewer
   CTA: Ver tutorial
   Link: /tutorial
   ```
4. **Display Rules:**
   - Mostrar en: Todas las páginas
   - O específicamente: `/projects/*`
5. **Expiration:** 7 días

### **Paso 3: Agregar Condición Wait (Esperar 24h)**

1. **Agregar Paso** → **Wait**
2. **Duración:** 24 horas
3. **Condición de salida:** Si hace click en el badge → Exit

### **Paso 4: Agregar Email**

1. **Agregar Acción** → **Send Email**
2. **Solo si:** No hizo click en el badge
3. **Asunto:** "¿Necesitas ayuda con AXSOL Viewer?"
4. **Contenido:**
   ```html
   Hola,
   
   Vimos que visitaste AXSOL Viewer pero no tuviste chance de explorar.
   
   Te dejamos algunos recursos:
   - Tutorial paso a paso
   - Video demo
   - FAQ
   
   ¿Preguntas? Responde este email.
   ```

---

## 🎨 Ejemplo de In-App Message Badge

### **Badge Configuration:**

```json
{
  "type": "badge",
  "position": "bottom-right",
  "color": "#00A99D",
  "icon": "👋",
  "title": "¡Bienvenido!",
  "message": "Descubre las funcionalidades de AXSOL Viewer",
  "actions": [
    {
      "text": "Ver tutorial",
      "url": "/tutorial",
      "style": "primary"
    },
    {
      "text": "Cerrar",
      "style": "secondary"
    }
  ]
}
```

---

## 📊 Eventos Disponibles para Tracking

Puedes trackear eventos adicionales desde tu código:

```typescript
import { customerioTrack } from '@ingeia/analytics';

// Ejemplo 1: Usuario completó onboarding
customerioTrack('onboarding_completed', {
  steps_completed: 5,
  time_taken_seconds: 180
});

// Ejemplo 2: Usuario vio un proyecto
customerioTrack('project_viewed', {
  project_id: '123',
  project_name: 'Mi Proyecto'
});

// Ejemplo 3: Usuario descargó un archivo
customerioTrack('file_downloaded', {
  file_type: 'ifc',
  file_size_mb: 45.2
});
```

---

## 🔍 Segmentación por Pantalla (SPA)

### **Mensajes solo en páginas específicas:**

#### Customer.io Dashboard:
1. Campaign → New → Event-Triggered
2. **Trigger:** `page` event
3. **Filtro:** `url contains '/projects/'`
4. **Acción:** Mostrar badge "¿Necesitas ayuda con este proyecto?"

#### Ejemplo de uso avanzado:

```typescript
// Trackear evento custom en página específica
import { customerioTrack } from '@ingeia/analytics';

function ProjectViewerPage() {
  useEffect(() => {
    // Track que el usuario entró al viewer 3D
    customerioTrack('viewer_3d_opened', {
      project_id: projectId,
      first_time: !localStorage.getItem(`viewed_${projectId}`)
    });
  }, [projectId]);
  
  return <CesiumViewer />;
}
```

---

## 🎯 Campaigns Sugeridos

### **1. Onboarding Series** (SITE)
- **Día 0:** Evento `first_visit` → Badge "Bienvenida"
- **Día 1:** Email "Primeros pasos"
- **Día 3:** Email "¿Exploraste tus proyectos?"
- **Día 7:** Email "Tips avanzados"

### **2. Re-engagement** (WWW)
- **Trigger:** Usuario no vuelve en 30 días
- **Email:** "Te extrañamos, mira las novedades"

### **3. Feature Announcement**
- **Trigger:** Evento `new_feature_released` (manual)
- **In-App Banner:** "Nueva funcionalidad: Viewer 360°"

### **4. Trial Expiration** (SITE)
- **Trigger:** Usuario cerca de fin de trial
- **Badge:** "Tu trial expira en 3 días"
- **Email:** Oferta de conversión

---

## 🧪 Testing

### **Probar el Flujo Localmente:**

1. **Limpiar localStorage:**
   ```javascript
   // En consola del navegador
   localStorage.removeItem('cio_visited');
   localStorage.removeItem('cio_visited_www');
   ```

2. **Recargar la página:**
   - Deberías ver en consola: `[Customer.io] Event tracked: first_visit`

3. **Verificar en Customer.io Dashboard:**
   - People → Busca tu email o ID
   - Deberías ver el evento `first_visit`

4. **Activar el flujo:**
   - El badge debería aparecer (si configuraste el campaign)
   - Después de 24h, envía el email (si no hiciste click)

---

## 📊 Métricas a Trackear

### **En Customer.io:**
- **Delivery Rate:** % de mensajes entregados
- **Open Rate:** % de in-app badges abiertos
- **Click Rate:** % de CTAs clickeados
- **Conversion Rate:** % que completan acción deseada

### **En PostHog:**
- Correlacionar eventos Customer.io con comportamiento en app
- Funnel: `first_visit` → `tutorial_viewed` → `project_created`

---

## 🔧 API Functions Disponibles

```typescript
import {
  customerioInit,         // Inicializar SDK
  customerioIdentify,     // Identificar usuario
  customerioTrack,        // Trackear evento
  customerioPage,         // Trackear página
  identify,               // Identificar en PostHog + Customer.io
} from '@ingeia/analytics';
```

### **Uso Manual:**

```typescript
// Identificar usuario al login
customerioIdentify('user_123', {
  email: 'user@example.com',
  name: 'Juan Pérez',
  plan: 'enterprise',
  company: 'ACME Corp'
});

// Trackear evento custom
customerioTrack('feature_used', {
  feature: '3d_viewer',
  duration_seconds: 45
});

// Trackear página manualmente (si no usas el hook)
customerioPage('/custom-page', {
  section: 'admin',
  role: 'viewer'
});
```

---

## 🚀 Próximos Pasos

### **1. Obtener Site ID de Customer.io**
- Registrarse y copiar credenciales

### **2. Configurar `.env` files**
```bash
# apps/site/.env
VITE_CUSTOMERIO_SITE_ID=tu_site_id_aqui
VITE_CUSTOMERIO_REGION=us
```

### **3. Reiniciar apps**
```bash
pkill -f vite && npm run dev
```

### **4. Crear Campaign "Bienvenida"** en Customer.io
- Trigger: `first_visit`
- Badge → Wait 24h → Email

### **5. Probar**
- Limpiar localStorage
- Recargar app
- Verificar evento en dashboard

---

## 📝 Resumen de Integración

| App | Customer.io | Screen Tracking | first_visit | Estado |
|-----|------------|-----------------|-------------|--------|
| **SITE** | ✅ Configurado | ✅ Automático | ✅ Implementado | Listo |
| **WWW** | ✅ Configurado | ✅ Automático | ✅ Implementado | Listo |
| **LINE** | ⏳ Pendiente | ⏳ Pendiente | ⏳ Pendiente | N/A |

---

## 💡 Tips

### **Debugging:**
```javascript
// En consola del navegador
window._cio // Debe existir si Customer.io está cargado

// Ver eventos trackeados
localStorage.getItem('cio_visited') // 'true' si ya visitó
```

### **Mensajes personalizados por URL:**
- Usa Customer.io segments: `url contains '/projects/'`
- Crea campaigns específicos para cada sección

### **A/B Testing:**
- Prueba diferentes mensajes de badge
- Mide conversión de diferentes CTAs

---

¡Tu sistema de comunicación Customer.io está listo para producción! 🎉
