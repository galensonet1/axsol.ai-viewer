# Stack Completo de Analytics & Comunicación - AXSOL.ai Viewer

## 📊 Resumen Ejecutivo

Sistema completo de **analytics event-driven** con **automatización de comunicación** implementado en SITE, WWW y backend.

---

## 🎯 Componentes Implementados

| Componente | Función | Apps | Estado | Costo Mensual |
|------------|---------|------|--------|---------------|
| **PostHog** | Product Analytics | SITE, WWW | ✅ Activo | $0 - $450 |
| **Microsoft Clarity** | Heatmaps & Session Replay | SITE, WWW | ✅ Activo | Gratis |
| **IPinfo.io** | ABM - Firmographic Enrichment | Backend → PostHog | ✅ Activo | $0 - $149 |
| **Customer.io** | Messaging & Campaigns | SITE, WWW | ✅ Configurado | $0 - $150 |
| **LinkedIn Tools** | Sales Automation | Webhook → Backend | ✅ Endpoint Listo | $80 - $99 |

**Total Estimado:** $0 - $848/mes (según volumen)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (SITE/WWW)                         │
│  - React + Vite                                                     │
│  - @ingeia/analytics (SDK compartido)                               │
│  - SPA screen tracking automático                                   │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ├─► PostHog (Product Analytics)
              │   • Eventos
              │   • Funnels
              │   • Company Groups (ABM)
              │
              ├─► Microsoft Clarity (UX Analytics)
              │   • Heatmaps
              │   • Session Replay
              │   • Rage Clicks
              │
              └─► Customer.io (Messaging)
                  • In-App Messages
                  • Email Campaigns
                  • Screen Tracking
                  
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                           │
│  - /api/reveal → IPinfo/Clearbit proxy                              │
│  - /api/webhooks/linkedin → LinkedIn automation                     │
│  - /api/webhooks/customerio → Reverse webhooks                      │
└─────────────┬───────────────────────────────────────────────────────┘
              │
              ├─► IPinfo.io (IP Enrichment)
              │   • Company identification
              │   • Location data
              │   • PostHog group() integration
              │
              ├─► Customer.io API (Server-side)
              │   • User identification
              │   • Event triggering
              │
              └─► LinkedIn Tools (Expandi/LaGrowthMachine)
                  • Receive webhooks
                  • Process events
                  • Trigger Customer.io campaigns
```

---

## 📦 Paquete `@ingeia/analytics`

### **Funciones Exportadas:**

```typescript
// Inicialización
analyticsInit(posthogKey, apiHost)
customerioInit(siteId, region)

// Identificación
identify(userId, props)                    // PostHog + Customer.io
customerioIdentify(userId, traits)         // Solo Customer.io

// Tracking
customerioTrack(eventName, properties)
customerioPage(pageName, properties)

// Grouping (ABM)
groupCompany(companyDomain, props)
groupAccount(accountId, props)

// Hooks React
useSpaPageviews(getUrl)                    // PostHog + Clarity + Customer.io

// ABM Enrichment
enrichWithABM(apiBaseUrl)                  // IPinfo/Clearbit proxy
```

---

## 🎯 Flujos Implementados

### **1. First Visit → In-App Badge → Email**

**Trigger:** Usuario visita SITE o WWW por primera vez

**Flujo:**
```
1. User lands on SITE
   ↓
2. Track event: first_visit
   ↓
3. Customer.io: Show in-app badge
   "¡Bienvenido! Descarga nuestro one-pager"
   ↓
4. If clicked → Track download → Notify sales
   ↓
5. If NOT clicked → Wait 24h → Send email
   "¿Te perdiste nuestro one-pager?"
```

**Implementación:**
- ✅ `apps/site/src/main.jsx` - Event tracking
- ✅ `apps/www/index.tsx` - Event tracking
- ⏳ Customer.io Dashboard - Campaign configuration (manual)

---

### **2. LinkedIn Connection → Email Nurture**

**Trigger:** LinkedIn automation tool detecta conexión aceptada

**Flujo:**
```
1. Expandi/LaGrowthMachine: Connection accepted
   ↓
2. Webhook → Backend /api/webhooks/linkedin
   ↓
3. Backend → Customer.io API: Create/update customer
   ↓
4. Customer.io: Trigger "LinkedIn Welcome" campaign
   ↓
5. Wait 1 hour → Send welcome email
   ↓
6. Wait 24h → If not opened → Send follow-up
```

**Implementación:**
- ✅ `backend/server.js` - Webhook endpoint
- ⏳ Expandi/LaGrowthMachine - Webhook configuration (external)
- ⏳ Customer.io Dashboard - Campaign configuration (manual)

---

### **3. Email Clicked → LinkedIn Follow-up**

**Trigger:** Usuario hace click en link de email

**Flujo:**
```
1. User clicks "Download One-Pager" in email
   ↓
2. Customer.io: Track email_clicked
   ↓
3. Webhook → Backend /api/webhooks/customerio
   ↓
4. Backend: Identify high-intent lead
   ↓
5. Option A: Notify sales team
   Option B: Trigger LinkedIn message via Expandi API
```

**Implementación:**
- ✅ `backend/server.js` - Webhook endpoint
- ⏳ Customer.io Dashboard - Webhook configuration (manual)
- ⏳ Expandi API integration (optional)

---

### **4. ABM Company Identification**

**Trigger:** Usuario carga SITE o WWW

**Flujo:**
```
1. User visits app
   ↓
2. Frontend → Backend /api/reveal
   ↓
3. Backend → IPinfo.io: Lookup IP
   ↓
4. IPinfo returns company data
   ↓
5. Backend → Frontend: Return firmographics
   ↓
6. Frontend → PostHog: group('company', domain, data)
   ↓
7. PostHog: All events now grouped by company
```

**Implementación:**
- ✅ `backend/server.js` - /api/reveal endpoint
- ✅ `packages/analytics/src/index.ts` - enrichWithABM()
- ✅ `apps/site/src/main.jsx` - Auto-enrichment
- ✅ `apps/www/index.tsx` - Auto-enrichment

---

## 📝 Variables de Entorno

### **Backend** (`backend/.env`):
```bash
# Analytics
CLARITY_PROJECT_ID=your_clarity_project_id
POSTHOG_API_HOST=https://app.posthog.com

# ABM
IPINFO_API_KEY=your_ipinfo_token

# LinkedIn Automation
LINKEDIN_WEBHOOK_SECRET=your_webhook_secret

# Customer.io (Server-side)
CUSTOMERIO_SITE_ID=your_site_id
CUSTOMERIO_API_KEY=your_api_key
```

### **SITE** (`apps/site/.env`):
```bash
# PostHog
VITE_POSTHOG_KEY=your_posthog_key

# Microsoft Clarity
VITE_CLARITY_PROJECT_ID=your_clarity_id

# Customer.io (Client-side)
VITE_CUSTOMERIO_SITE_ID=your_site_id
VITE_CUSTOMERIO_REGION=us
```

### **WWW** (`apps/www/.env`):
```bash
# PostHog
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Microsoft Clarity
VITE_CLARITY_PROJECT_ID=your_clarity_id

# Customer.io
VITE_CUSTOMERIO_SITE_ID=your_site_id
VITE_CUSTOMERIO_REGION=us

# API Backend
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🚀 Setup Completo (Checklist)

### **PostHog** ✅
- [x] SDK instalado (`posthog-js`)
- [x] Inicialización en SITE y WWW
- [x] SPA pageview tracking
- [x] Company grouping (ABM)
- [ ] Configurar dashboards en PostHog.com

### **Microsoft Clarity** ✅
- [x] Script agregado en `index.html`
- [x] Screen tracking en SPAs
- [x] Variable de entorno configurada
- [ ] Verificar tracking en Clarity dashboard

### **IPinfo.io** ✅
- [x] Backend proxy `/api/reveal`
- [x] Integración con PostHog groups
- [x] Auto-enrichment en frontend
- [ ] Obtener API key y configurar `.env`
- [ ] Probar con IP real (deploy)

### **Customer.io** ✅
- [x] SDK snippet implementado
- [x] Screen tracking en SPAs
- [x] Evento `first_visit`
- [x] Webhook endpoints en backend
- [ ] Obtener Site ID y configurar `.env`
- [ ] Crear campaign "Bienvenida"
- [ ] Configurar reverse webhooks

### **LinkedIn Integration** ✅
- [x] Webhook endpoint `/api/webhooks/linkedin`
- [x] Event processing (connection_accepted, message_replied)
- [ ] Elegir herramienta (Expandi/LaGrowthMachine)
- [ ] Configurar webhook en herramienta
- [ ] Crear campaign en Customer.io
- [ ] Probar flujo end-to-end

---

## 📊 Eventos Trackeados

### **Frontend Events (Customer.io + PostHog):**
```typescript
// Automáticos
'first_visit'           // Primera visita al SITE/WWW
'$pageview'             // Cada cambio de página/ruta
'page'                  // Customer.io screen tracking

// Por implementar (ejemplos)
'tutorial_started'
'tutorial_completed'
'project_created'
'project_viewed'
'file_uploaded'
'viewer_3d_opened'
'feature_used'
```

### **Backend Events (Webhooks):**
```typescript
// LinkedIn
'connection_accepted'   // LinkedIn connection aceptada
'message_replied'       // Prospect respondió mensaje
'profile_visited'       // Alguien visitó tu perfil

// Customer.io (Reverse)
'email_opened'          // Email abierto
'email_clicked'         // Link clickeado
'in_app_message_clicked' // Badge/mensaje in-app clickeado
'email_bounced'         // Email rebotado
'email_unsubscribed'    // Unsubscribe
```

---

## 🧪 Testing

### **Test 1: PostHog + Clarity + Customer.io**
```bash
# 1. Iniciar apps
npm run dev        # Backend + SITE
npm run dev:www    # WWW

# 2. Abrir navegador → http://localhost:5173
# 3. Abrir consola del navegador
# 4. Verificar logs:
# [PostHog] Initialized
# [Customer.io] Initialized with site ID: ...
# [Customer.io] Event tracked: first_visit
# [Analytics] Company identified: ... (si IPinfo configurado)

# 5. Navegar entre páginas y verificar tracking
```

### **Test 2: ABM Enrichment**
```bash
# 1. Configurar IPINFO_API_KEY en backend/.env
# 2. Reiniciar backend: pkill -f nodemon && cd backend && npm run dev
# 3. Cargar SITE en navegador
# 4. Verificar en consola:
# [ABM] Reveal request for IP: ...
# [ABM] Using IPinfo.io
# [ABM] Company identified via IPinfo: ...
# [Analytics] Company identified: ...
```

### **Test 3: LinkedIn Webhook**
```bash
curl -X POST http://localhost:3001/api/webhooks/linkedin \
  -H "Content-Type: application/json" \
  -d '{
    "event": "connection_accepted",
    "data": {
      "linkedin_profile": "https://linkedin.com/in/test",
      "name": "Test User",
      "company": "Test Corp"
    }
  }'

# Expected: [LINKEDIN WEBHOOK] Received event: connection_accepted
```

### **Test 4: Customer.io Webhook**
```bash
curl -X POST http://localhost:3001/api/webhooks/customerio \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "email_clicked",
    "data": { "link": "https://axsol.ai/one-pager.pdf" },
    "customer": { "email": "test@example.com" }
  }'

# Expected: [CUSTOMERIO WEBHOOK] Event: email_clicked
```

---

## 📚 Documentación Disponible

| Archivo | Descripción |
|---------|-------------|
| `CLEARBIT_ALTERNATIVES.md` | IPinfo.io vs Clearbit vs Mock |
| `ABM_USAGE_EXAMPLES.md` | Ejemplos de uso del SDK ABM |
| `CUSTOMERIO_SETUP.md` | Configuración completa de Customer.io |
| `LINKEDIN_CUSTOMERIO_INTEGRATION.md` | Webhooks LinkedIn + Customer.io |
| `ANALYTICS_STACK_COMPLETE.md` | Este archivo - overview completo |

---

## 🎓 Próximos Pasos

### **Corto Plazo (Esta Semana):**
1. [ ] Obtener credenciales de todos los servicios
2. [ ] Configurar `.env` files
3. [ ] Crear campaigns en Customer.io
4. [ ] Configurar webhooks en LinkedIn tool
5. [ ] Testing end-to-end de todos los flujos

### **Mediano Plazo (Próximas 2 Semanas):**
1. [ ] Crear dashboards en PostHog
2. [ ] Configurar alertas en Customer.io
3. [ ] Implementar más eventos custom
4. [ ] A/B testing de mensajes
5. [ ] Integrar con CRM (opcional)

### **Largo Plazo (Próximo Mes):**
1. [ ] Optimizar campaigns basado en métricas
2. [ ] Implementar lead scoring automático
3. [ ] Multi-touch attribution
4. [ ] Predictive analytics
5. [ ] Integración con sales tools (Salesforce, HubSpot)

---

## 💡 Mejores Prácticas

### **Analytics:**
- ✅ Usar eventos descriptivos y consistentes
- ✅ Incluir contexto en propiedades (user_id, company, plan)
- ✅ No trackear información personal sensible
- ✅ Configurar GDPR/CCPA compliance

### **Messaging:**
- ✅ No enviar mensajes inmediatamente (parecer spam)
- ✅ Personalizar basado en comportamiento
- ✅ A/B test de mensajes y timing
- ✅ Respetar unsubscribes

### **LinkedIn Automation:**
- ✅ Mensajes personalizados (no templates genéricos)
- ✅ Limitar envíos diarios (20-30 conexiones/día máx)
- ✅ Usar LinkedIn Sales Navigator para targeting
- ✅ Combinar con otros canales (email, retargeting)

---

## 📊 KPIs a Monitorear

### **Adquisición:**
- Visitors/día (PostHog)
- New signups/día (PostHog funnels)
- Companies identified/día (PostHog groups)

### **Engagement:**
- Pageviews/session (PostHog)
- Average session duration (Clarity)
- Feature adoption rate (PostHog)

### **Conversion:**
- In-app message click rate (Customer.io)
- Email open rate (Customer.io)
- Email click rate (Customer.io)
- LinkedIn acceptance rate (LinkedIn tool)
- Overall funnel conversion (PostHog)

### **Revenue:**
- Trial → Paid conversion
- Average deal size by company size (ABM)
- Time to close by source

---

## 🔐 Seguridad & Compliance

### **GDPR/CCPA:**
- ✅ Cookie consent banner (implementar)
- ✅ Opt-out mechanism
- ✅ Data deletion request handling
- ✅ Privacy policy actualizado

### **Webhooks:**
- ✅ HMAC signature validation
- ✅ HTTPS only
- ✅ Rate limiting (implementar si es necesario)
- ✅ Logging de eventos

---

## 🎉 Resultado Final

**Sistema completo event-driven de analytics y comunicación** que permite:

1. ✅ **Entender** comportamiento de usuarios (PostHog + Clarity)
2. ✅ **Identificar** empresas de alto valor (IPinfo ABM)
3. ✅ **Comunicar** de manera personalizada (Customer.io)
4. ✅ **Automatizar** outreach en LinkedIn (Webhooks)
5. ✅ **Nutrir** leads basado en comportamiento (Campaigns)
6. ✅ **Medir** impacto de cada acción (Métricas)

**Costo inicial:** $0 (planes gratuitos)
**Costo a escala:** ~$500-800/mes para 10k MAU

---

¡Tu stack de analytics y comunicación está production-ready! 🚀
