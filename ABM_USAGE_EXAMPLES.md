# ABM (Account-Based Marketing) - Ejemplos de Uso

## 🎯 SDK de Analytics Actualizado

El paquete `@ingeia/analytics` ahora expone funciones específicas para ABM.

### Funciones Disponibles:

```typescript
import { 
  analyticsInit,
  enrichWithABM,      // Enriquecimiento automático via proxy
  groupCompany,       // Agrupar por empresa (ABM)
  groupAccount,       // Agrupar por cuenta (multi-tenancy)
  identify,           // Identificar usuario
  useSpaPageviews     // Hook para tracking SPA
} from '@ingeia/analytics';
```

---

## ✅ Opción 1: Automático (Actual - Recomendado)

**Ya implementado en SITE y WWW**

El sistema llama automáticamente al proxy `/api/reveal` al cargar la app y agrupa la empresa en PostHog.

```javascript
// apps/site/src/main.jsx (ya implementado)
import { analyticsInit, enrichWithABM } from '@ingeia/analytics';

// Inicializa PostHog
analyticsInit(posthogKey, apiHost);

// Enriquece automáticamente con ABM
enrichWithABM(apiBaseUrl).catch(err => {
  console.log('[Analytics] ABM enrichment skipped');
});
```

### Ventajas:
- ✅ **Cero código adicional**: Funciona automáticamente
- ✅ **Fire & forget**: No bloquea la carga de la app
- ✅ **Manejo de errores**: Falla silenciosamente sin afectar UX

---

## 🔧 Opción 2: Manual (Control Total)

Si necesitas más control sobre cuándo y cómo se ejecuta el enriquecimiento ABM:

### Ejemplo Básico:

```javascript
import { groupCompany } from '@ingeia/analytics';

async function abmReveal() {
  try {
    const response = await fetch('/api/reveal', { 
      method: 'POST',
      credentials: 'include'
    });
    
    const { ok, firmo, source } = await response.json();
    
    if (ok && firmo?.companyDomain) {
      // Agrupar en PostHog
      groupCompany(firmo.companyDomain, {
        name: firmo.companyName,
        location: firmo.location,
        industry: firmo.industry,
        ...firmo
      });
      
      console.log(`[ABM] Empresa identificada: ${firmo.companyName} (via ${source})`);
      return firmo;
    }
    
    return null;
  } catch (error) {
    console.error('[ABM] Error:', error);
    return null;
  }
}

// Llamar cuando necesites
abmReveal();
```

### Ejemplo con Condiciones:

```javascript
import { groupCompany } from '@ingeia/analytics';

async function identifyCompanyIfB2B() {
  // Solo ejecutar en páginas específicas
  if (!window.location.pathname.startsWith('/enterprise')) {
    return;
  }
  
  const response = await fetch('/api/reveal', { method: 'POST' });
  const { ok, firmo } = await response.json();
  
  if (ok && firmo?.companyDomain) {
    // Filtrar solo empresas grandes
    if (firmo.employees && firmo.employees > 100) {
      groupCompany(firmo.companyDomain, firmo);
      
      // Mostrar mensaje personalizado
      showEnterpriseWelcome(firmo.companyName);
    }
  }
}
```

### Ejemplo con React Hook:

```javascript
import { useEffect } from 'react';
import { groupCompany } from '@ingeia/analytics';

export function useABMIdentification() {
  useEffect(() => {
    async function identifyCompany() {
      const response = await fetch('/api/reveal', { method: 'POST' });
      const { ok, firmo } = await response.json();
      
      if (ok && firmo?.companyDomain) {
        groupCompany(firmo.companyDomain, firmo);
      }
    }
    
    identifyCompany();
  }, []);
}

// Uso en componente
function App() {
  useABMIdentification();
  return <div>...</div>;
}
```

---

## 📊 Datos Disponibles en `firmo`

Después de llamar a `/api/reveal`, recibes:

```typescript
interface Firmo {
  companyDomain: string;        // "google.com"
  companyName: string;          // "Google LLC"
  industry?: string;            // "Technology"
  sector?: string;              // "Software"
  employees?: number;           // 150000
  employeesRange?: string;      // "10000+"
  estimatedAnnualRevenue?: string;  // "$100B+"
  tags?: string[];              // ["SaaS", "Cloud"]
  techCategories?: string[];    // ["React", "AWS"]
  location?: string;            // "Mountain View, CA, US"
  city?: string;                // "Mountain View"
  region?: string;              // "California"
  country?: string;             // "US"
  timezone?: string;            // "America/Los_Angeles"
  postal?: string;              // "94043"
}

interface ABMResponse {
  ok: boolean;
  firmo?: Firmo;
  source?: 'ipinfo' | 'clearbit' | 'mock';
  mock?: boolean;
}
```

---

## 🎯 Casos de Uso Avanzados

### 1. Personalización de Contenido por Empresa

```javascript
async function personalizeForCompany() {
  const response = await fetch('/api/reveal', { method: 'POST' });
  const { ok, firmo } = await response.json();
  
  if (ok && firmo) {
    groupCompany(firmo.companyDomain, firmo);
    
    // Personalizar UI
    if (firmo.employees > 1000) {
      showEnterprisePricing();
    } else {
      showSMBPricing();
    }
    
    // Personalizar CTA
    document.getElementById('cta-text').innerText = 
      `Join ${firmo.companyName} and 1000+ companies`;
  }
}
```

### 2. Lead Scoring Automático

```javascript
async function scoreVisitor() {
  const response = await fetch('/api/reveal', { method: 'POST' });
  const { ok, firmo } = await response.json();
  
  if (ok && firmo) {
    groupCompany(firmo.companyDomain, firmo);
    
    let score = 0;
    if (firmo.employees > 500) score += 30;
    if (firmo.industry === 'Technology') score += 20;
    if (firmo.estimatedAnnualRevenue?.includes('$100M')) score += 50;
    
    // Enviar score a tu CRM o webhook
    if (score > 70) {
      notifySalesTeam(firmo);
    }
  }
}
```

### 3. Segmentación en Tiempo Real

```javascript
async function segmentVisitor() {
  const response = await fetch('/api/reveal', { method: 'POST' });
  const { ok, firmo } = await response.json();
  
  if (ok && firmo) {
    groupCompany(firmo.companyDomain, firmo);
    
    // Determinar segment
    const segment = firmo.employees > 1000 ? 'enterprise' : 'smb';
    
    // Redirigir a experiencia personalizada
    if (segment === 'enterprise') {
      window.location.href = '/enterprise-demo';
    }
  }
}
```

---

## 🔍 Debugging y Testing

### Ver datos en consola:

```javascript
async function testABM() {
  console.log('[ABM] Testing IP enrichment...');
  
  const response = await fetch('/api/reveal', { method: 'POST' });
  const data = await response.json();
  
  console.table(data.firmo);
  console.log('Source:', data.source);
  console.log('Mock mode:', data.mock);
}

// Ejecutar en consola del navegador
testABM();
```

### Ver en PostHog:

1. Ve a tu dashboard de PostHog
2. People → Groups
3. Busca el grupo "company"
4. Verás todas las propiedades de la empresa

---

## 🚀 Recomendaciones

### Para la mayoría de casos:
✅ **Usa el modo automático** (ya implementado)
- Se ejecuta al cargar la app
- No requiere código adicional
- Funciona en todas las páginas

### Usa modo manual si:
- ⚙️ Necesitas ejecutar solo en páginas específicas
- ⚙️ Quieres personalizar UI basado en empresa
- ⚙️ Necesitas condicionar el comportamiento
- ⚙️ Quieres integrar con otros servicios

---

## 📝 Estado Actual

**SITE y WWW ya tienen el modo automático configurado:**

```javascript
// ✅ Ya implementado en apps/site/src/main.jsx
// ✅ Ya implementado en apps/www/index.tsx

if (posthogKey) {
  analyticsInit(posthogKey, posthogHost);
  enrichWithABM(apiBaseUrl).catch(err => {
    console.log('[Analytics] ABM enrichment skipped');
  });
}
```

**No necesitas hacer nada más**, a menos que quieras personalizar el comportamiento.

---

## 🎓 Próximos Pasos

1. **Activar IPinfo** → Agrega `IPINFO_API_KEY` a `backend/.env`
2. **Reiniciar backend** → `pkill -f nodemon && cd backend && npm run dev`
3. **Probar** → Abre SITE/WWW y verifica logs en consola
4. **Ver en PostHog** → Dashboard → Groups → company

¡Tu sistema ABM está completamente funcional!
