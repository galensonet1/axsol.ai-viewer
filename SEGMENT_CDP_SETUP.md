# Segment - Customer Data Platform (CDP) Setup

## 🎯 ¿Qué es Segment?

**Segment** es una **Customer Data Platform (CDP)** que actúa como **capa de datos unificada** entre tu aplicación y todas tus herramientas de analytics y marketing.

### **Arquitectura Actual:**
```
Frontend → PostHog
Frontend → Clarity
Frontend → Customer.io
Frontend → (futuros tools...)
```

### **Arquitectura con Segment:**
```
Frontend → Segment → {PostHog, Clarity, Customer.io, Mixpanel, Amplitude, ...}
```

---

## ✅ Ventajas de Usar Segment

### **1. Single Source of Truth**
- Un solo SDK para todos los destinos
- Eventos consistentes en todas las plataformas
- Menos código para mantener

### **2. Flexibilidad**
- Agregar/quitar herramientas sin tocar código
- A/B test de analytics platforms
- Cambiar de vendor sin re-deployment

### **3. Data Governance**
- Schema validation centralizado
- Data quality control
- Compliance (GDPR/CCPA) más fácil

### **4. Warehouse Integration**
- Enviar datos a BigQuery, Snowflake, Redshift
- Data science y BI avanzados
- Long-term data retention

---

## 🔧 Implementación

### **SDK Instalado:**
```bash
npm install @segment/analytics-next
```

**Paquete:** `packages/analytics`

---

## 📊 Funciones Disponibles

### **Inicialización:**
```typescript
import { segmentInit } from '@ingeia/analytics';

// Initialize Segment
await segmentInit(writeKey);
```

### **Tracking de Eventos:**
```typescript
import { segmentTrack } from '@ingeia/analytics';

// Track custom event
segmentTrack('Button Clicked', {
  button_name: 'Sign Up',
  page: '/homepage'
});
```

### **Identificación de Usuarios:**
```typescript
import { segmentIdentify } from '@ingeia/analytics';

// Identify user
segmentIdentify('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'enterprise'
});
```

### **Tracking de Páginas:**
```typescript
import { segmentPage } from '@ingeia/analytics';

// Track page view
segmentPage('/projects', {
  title: 'Projects Dashboard',
  url: window.location.href
});
```

---

## 🎯 Integración Automática

### **SPA Screen Tracking:**

El hook `useSpaPageviews()` **ya incluye Segment** automáticamente:

```typescript
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
    
    // Track in Customer.io
    if (window._cio) {
      window._cio.page(url, { url });
    }
    
    // Track in Segment ✅ NEW
    if (window.analytics) {
      segmentPage(url, { url });
    }
  }, [getUrl()]);
}
```

### **Unified Identify:**

La función `identify()` **ya incluye Segment**:

```typescript
export function identify(userId: string, props?: Record<string, any>) {
  posthog.identify(userId, props);      // PostHog
  customerioIdentify(userId, props);    // Customer.io
  segmentIdentify(userId, props);       // Segment ✅ NEW
}
```

---

## 🚀 Setup en Segment Dashboard

### **1. Crear Cuenta en Segment**

```
https://app.segment.com/signup
```

### **2. Crear Source (JavaScript)**

1. Dashboard → Sources → Add Source
2. Seleccionar **JavaScript** (Web)
3. Nombre: "AXSOL.ai Viewer - SITE" (o "WWW")
4. Copiar **Write Key**

### **3. Configurar Destinations**

Segment puede enviar datos a múltiples destinos:

#### **Opción A: Destinations Oficiales (Recomendado)**

1. Connections → Destinations → Add Destination
2. Buscar y agregar:
   - **PostHog**
   - **Customer.io**
   - **Google Analytics 4** (opcional)
   - **Mixpanel** (opcional)
   - **Amplitude** (opcional)

3. Configurar cada destination:
   - **PostHog:** API Key + Host
   - **Customer.io:** Site ID + API Key
   - **GA4:** Measurement ID

#### **Opción B: Keep Direct Integrations**

Puedes mantener las integraciones directas actuales y usar Segment **además**:

- PostHog: Direct + Segment (redundant but safe)
- Customer.io: Direct + Segment
- Clarity: Solo Direct (no hay destination en Segment)

---

## 📝 Configuración de Variables de Entorno

### **SITE** (`apps/site/.env`):
```bash
VITE_SEGMENT_WRITE_KEY=abc123def456xyz789
```

### **WWW** (`apps/www/.env`):
```bash
VITE_SEGMENT_WRITE_KEY=abc123def456xyz789
```

**Nota:** Puedes usar el mismo Write Key para ambas apps o crear sources separados.

---

## 🔄 Estrategias de Migración

### **Estrategia 1: Segment como Layer Adicional (Recomendado)**

**Configuración Actual:**
- Mantener PostHog directo
- Mantener Customer.io directo
- Mantener Clarity directo
- **Agregar Segment** en paralelo

**Ventajas:**
- ✅ Sin riesgo de perder datos
- ✅ Comparar datos entre direct vs Segment
- ✅ Migración gradual

**Implementación:**
```bash
# .env
VITE_POSTHOG_KEY=phc_xxx         # Mantener
VITE_CUSTOMERIO_SITE_ID=cio_xxx  # Mantener
VITE_SEGMENT_WRITE_KEY=seg_xxx   # Nuevo
```

---

### **Estrategia 2: Segment como Única Fuente**

**Configuración:**
- Remover PostHog directo
- Remover Customer.io directo
- Mantener Clarity directo (no soportado en Segment)
- **Solo Segment** para todo lo demás

**Ventajas:**
- ✅ Menos código
- ✅ Menos dependencias en frontend
- ✅ Más fácil agregar nuevos tools

**Desventajas:**
- ❌ Vendor lock-in a Segment
- ❌ Latencia adicional
- ❌ Costo de Segment en escala

**Implementación:**
```typescript
// packages/analytics/src/index.ts
// Comentar inicializaciones directas

export function analyticsInit() {
  // Solo Segment
  segmentInit(writeKey);
}

export function identify(userId, props) {
  // Solo Segment (destinations configurados en dashboard)
  segmentIdentify(userId, props);
}
```

---

### **Estrategia 3: Híbrida (Para Producción)**

- **PostHog:** Mantener directo (product analytics crítico)
- **Customer.io:** Enviar via Segment (easier management)
- **Nuevos tools:** Via Segment (Mixpanel, Amplitude, etc.)
- **Clarity:** Directo (no hay alternativa)

---

## 📊 Eventos a Trackear en Segment

### **Eventos Automáticos (Ya Implementados):**
```typescript
// SPA pageviews
segmentPage('/projects', { url: '...' });

// First visit
segmentTrack('first_visit', {
  app: 'site',
  url: window.location.href
});

// User identification
segmentIdentify('user_123', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

### **Eventos Custom (Por Implementar):**
```typescript
// Onboarding
segmentTrack('Tutorial Started');
segmentTrack('Tutorial Completed', { steps: 5 });

// Projects
segmentTrack('Project Created', {
  project_id: '123',
  project_name: 'My Project'
});

segmentTrack('Project Viewed', {
  project_id: '123',
  duration_seconds: 45
});

// Files
segmentTrack('File Uploaded', {
  file_type: 'ifc',
  file_size_mb: 45.2
});

// Viewer 3D
segmentTrack('3D Viewer Opened', {
  project_id: '123',
  first_time: false
});

// Features
segmentTrack('Feature Used', {
  feature_name: 'mesh_analysis',
  duration_seconds: 30
});
```

---

## 🧪 Testing

### **Test 1: Segment Initialization**

```javascript
// En consola del navegador
window.analytics  // Debe existir si Segment está cargado

// Verificar métodos disponibles
window.analytics.track
window.analytics.identify
window.analytics.page
```

### **Test 2: Track Event**

```javascript
// En consola del navegador
import { segmentTrack } from '@ingeia/analytics';

segmentTrack('Test Event', {
  test: true,
  timestamp: new Date().toISOString()
});

// Verificar en Segment Debugger:
// https://app.segment.com/[workspace]/sources/[source]/debugger
```

### **Test 3: Destination Delivery**

1. **Segment Debugger:** Ver eventos en tiempo real
2. **PostHog:** Verificar que eventos llegan (si configurado como destination)
3. **Customer.io:** Verificar que usuarios se crean/actualizan

---

## 📊 Segment Debugger

### **Live Events:**

Dashboard → Sources → [Tu Source] → Debugger

**Verás:**
- Raw events en tiempo real
- Payload completo
- Destinations que recibieron el evento
- Errores de delivery

---

## 💰 Costos de Segment

### **Plan Free:**
- 1,000 MTUs (Monthly Tracked Users) / mes
- 2 sources
- Unlimited destinations
- Data retention: 30 días

**Ideal para desarrollo y testing**

### **Plan Team ($120/mes):**
- 10,000 MTUs
- 5 sources
- Advanced features (Replay, Protocols)
- Data retention: 1 año

### **Plan Business ($Custom):**
- Unlimited MTUs
- Warehouse destinations
- Advanced security
- SLA

---

## 🎯 Recomendación

### **Para AXSOL.ai Viewer:**

**Fase 1: Testing (Ahora)**
```bash
# Usar plan gratuito de Segment
# Mantener integraciones directas
# Configurar Segment en paralelo
# Comparar datos
```

**Fase 2: Migración Parcial (1-2 meses)**
```bash
# Migrar Customer.io a via Segment
# Mantener PostHog directo
# Agregar Google Analytics 4 via Segment
# Agregar Mixpanel via Segment (opcional)
```

**Fase 3: Producción (3+ meses)**
```bash
# Evaluar si Segment aporta valor vs costo
# Decidir: Full Segment vs Híbrido vs Direct
# Implementar data warehouse (BigQuery) si es necesario
```

---

## 📝 Configuración de Destinations

### **PostHog via Segment:**

1. Segment Dashboard → Destinations → Add Destination → PostHog
2. Configurar:
   ```
   Project API Key: phc_xxx
   PostHog Instance: https://us.i.posthog.com
   ```
3. Mappings (opcional):
   - `track` → PostHog `capture`
   - `identify` → PostHog `identify`
   - `group` → PostHog `group`

### **Customer.io via Segment:**

1. Segment Dashboard → Destinations → Add Destination → Customer.io
2. Configurar:
   ```
   Site ID: abc123
   API Key: your_api_key
   ```
3. Event Mappings:
   - `first_visit` → Customer.io campaign trigger
   - `identify` → Create/update customer

---

## 🔍 Debugging Common Issues

### **Issue 1: `window.analytics` es undefined**

**Causa:** Segment no se inicializó o fallo la carga

**Solución:**
```javascript
// Verificar que VITE_SEGMENT_WRITE_KEY existe
console.log(import.meta.env.VITE_SEGMENT_WRITE_KEY);

// Verificar en Network tab que se cargó
// cdn.segment.com/analytics.js
```

### **Issue 2: Eventos no llegan a destinations**

**Causa:** Destination no configurado o evento filtrado

**Solución:**
1. Segment Debugger → Ver si evento llegó a Segment
2. Connections → Ver si destination está enabled
3. Destination settings → Ver filters

### **Issue 3: Datos duplicados**

**Causa:** Direct integration + Segment destination

**Solución:**
- Opción A: Desactivar direct integration
- Opción B: Desactivar Segment destination
- Opción C: Deduplicar en destino (e.g., PostHog distinct_id)

---

## 📚 Recursos

- **Segment Docs:** https://segment.com/docs/
- **JavaScript SDK:** https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/
- **Destinations Catalog:** https://segment.com/catalog/
- **Segment University:** https://segment.com/academy/

---

## 🎉 Resumen

| Componente | Estado | Función |
|------------|--------|---------|
| **Segment SDK** | ✅ Instalado | `@segment/analytics-next` |
| **Init Function** | ✅ Implementado | `segmentInit()` |
| **Track Function** | ✅ Implementado | `segmentTrack()` |
| **Page Function** | ✅ Implementado | `segmentPage()` |
| **Identify Function** | ✅ Implementado | `segmentIdentify()` |
| **SPA Integration** | ✅ Implementado | Auto-tracking en `useSpaPageviews()` |
| **SITE** | ✅ Configurado | Env var + init |
| **WWW** | ✅ Configurado | Env var + init |
| **Env Variables** | ✅ Documentado | `.env.example` actualizado |

### **Próximos Pasos:**
1. [ ] Crear cuenta en Segment
2. [ ] Crear JavaScript source
3. [ ] Copiar Write Key
4. [ ] Configurar `.env` files
5. [ ] Testing en desarrollo
6. [ ] Configurar destinations (PostHog, Customer.io)
7. [ ] Deploy y validar en producción

¡Tu CDP está listo para unificar todos tus datos! 🚀
