# 🚀 Guía de Deployment a Producción - AXSOL Viewer

**Feature:** Analytics Phase 1 - PostHog + Customer.io Integration  
**Fecha:** 20 Oct 2025  
**Estrategia:** Blue-Green Deployment con Rollback Plan

---

## 📋 Pre-Deployment Checklist

### **✅ Verificaciones Locales**

- [x] Todos los eventos de analytics están funcionando en localhost
- [x] PostHog Live Events muestra eventos correctamente
- [x] Customer.io SDK inicializado correctamente
- [x] No hay errores críticos en console
- [x] Build local exitoso: `npm run build:site`
- [ ] Tests pasando (si existen)

### **📝 Cambios Implementados**

#### **Código:**
- ✅ `useCameraTracking.js` - Hook para tracking de cámara
- ✅ `useTimelineTracking.js` - Hook para tracking de timeline
- ✅ `ProjectVisualizer.jsx` - Integración de analytics
- ✅ `LayerSelector.jsx` - Tracking de capas
- ✅ `MediaLightbox.jsx` - Tracking de fotos 360°
- ✅ `@ingeia/analytics` package - SDK centralizado
- ✅ ViewerReadyDetector component fix

#### **Documentación:**
- ✅ `ANALYTICS_EVENTS_CATALOG.md`
- ✅ `ANALYTICS_IMPLEMENTATION_GUIDE.md`
- ✅ `CUSTOMERIO_CAMPAIGNS_GUIDE.md` (9 emails)
- ✅ `CUSTOMERIO_IN_APP_MESSAGES_GUIDE.md` (12 mensajes)
- ✅ `POSTHOG_DASHBOARDS_GUIDE.md`
- ✅ `FASE_1_IMPLEMENTATION_SUMMARY.md`

### **🔑 Variables de Entorno Requeridas**

Verificar en Netlify Dashboard que existan:

```bash
# PostHog
VITE_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Customer.io
VITE_CUSTOMERIO_SITE_ID=your_site_id_here
VITE_CUSTOMERIO_REGION=us

# Segment (opcional, para fase 2)
VITE_SEGMENT_WRITE_KEY=your_segment_key_here

# Existing vars (no tocar)
VITE_AUTH0_DOMAIN=xxx
VITE_AUTH0_CLIENT_ID=xxx
VITE_AUTH0_AUDIENCE=xxx
VITE_CESIUM_ION_TOKEN=xxx
VITE_API_BASE_URL=xxx
```

---

## 🎯 Estrategia de Deployment

### **Opción 1: Blue-Green via Netlify (RECOMENDADO)**

Netlify automáticamente crea un deploy preview por cada branch y permite rollback instantáneo.

```
┌──────────────┐
│ MAIN (BLUE)  │ ← Producción actual
│ v1.5.0       │
└──────────────┘
        ↓
   [DEPLOY NEW]
        ↓
┌──────────────┐
│ NEW (GREEN)  │ ← Nueva versión con analytics
│ v1.6.0       │
└──────────────┘
```

**Ventajas:**
- ✅ Rollback instantáneo (1 click)
- ✅ Zero downtime
- ✅ Deploy previews automáticos
- ✅ No requiere config adicional

---

## 📦 Paso 1: Preparar Release

### **1.1 Crear Branch de Release**

```bash
# Verificar estado actual
git status

# Asegurarse de estar en chore/bootstrapping
git checkout chore/bootstrapping

# Crear branch de release
git checkout -b release/v1.6.0-analytics-phase1
```

### **1.2 Commit de Cambios**

```bash
# Agregar archivos de código (críticos)
git add apps/site/src/
git add packages/analytics/
git add netlify.toml
git add package.json

# Agregar documentación (opcional pero recomendado)
git add *.md

# Commit
git commit -m "feat: Analytics Phase 1 - PostHog & Customer.io Integration

Features:
- Camera tracking with useCameraTracking hook
- Timeline tracking with useTimelineTracking hook
- Layer toggling analytics
- Photo 360° viewer tracking
- Viewer load performance tracking
- Customer.io SDK integration
- PostHog session recording (with WebGL fix)

Components Modified:
- ProjectVisualizer.jsx (analytics integration)
- LayerSelector.jsx (layer tracking)
- MediaLightbox.jsx (360° tracking)
- ViewerReadyDetector (fixed viewer_loaded event)

New Packages:
- @ingeia/analytics centralized SDK

Documentation:
- ANALYTICS_EVENTS_CATALOG.md
- ANALYTICS_IMPLEMENTATION_GUIDE.md
- CUSTOMERIO_CAMPAIGNS_GUIDE.md (9 email campaigns)
- CUSTOMERIO_IN_APP_MESSAGES_GUIDE.md (12 messages)
- POSTHOG_DASHBOARDS_GUIDE.md
- FASE_1_IMPLEMENTATION_SUMMARY.md

Breaking Changes: None
Migration Required: Add env vars for PostHog & Customer.io"
```

### **1.3 Tag de Versión Actual (Para Rollback)**

```bash
# Checkout a main para crear tag de versión estable
git checkout main
git pull origin main

# Crear tag de última versión estable (PRE-ANALYTICS)
git tag -a v1.5.0-stable -m "Stable version before Analytics Phase 1
Last known good state without analytics
Created: $(date)
Safe rollback point"

# Push tag
git push origin v1.5.0-stable

# Volver a release branch
git checkout release/v1.6.0-analytics-phase1
```

---

## 🧪 Paso 2: Deploy a Staging

### **2.1 Push Release Branch**

```bash
# Push branch (esto creará deploy preview en Netlify)
git push -u origin release/v1.6.0-analytics-phase1
```

### **2.2 Configurar Staging Environment en Netlify**

1. **Netlify Dashboard** → Site Settings → Build & Deploy
2. **Branch Deploys:**
   - Enable: Deploy only production branch + deploy previews
   - Production branch: `main`
   - Deploy previews: All branches

3. **Deploy Context:**
   ```toml
   # Ya configurado en netlify.toml
   [context.deploy-preview]
     # Heredará variables de environment
   ```

### **2.3 Obtener URL de Staging**

Netlify generará URL automática:
```
https://release-v1-6-0-analytics-phase1--axsol-viewer.netlify.app
```

O crea un Branch Deploy específico:
```
Site Settings → Domain Management → Branch Subdomains
→ Add: staging.axsol-viewer.netlify.app (branch: release/v1.6.0-analytics-phase1)
```

---

## ✅ Paso 3: Testing en Staging

### **3.1 Verificación Funcional**

**Core Functionality:**
- [ ] Página carga correctamente
- [ ] Login funciona
- [ ] Viewer 3D carga sin errores
- [ ] Timeline funciona
- [ ] Capas se pueden toggle
- [ ] Fotos 360° se abren
- [ ] No hay errores críticos en console

**Analytics Verification:**
- [ ] PostHog inicializado (check console: "✅ [PostHog] Initialized")
- [ ] Customer.io inicializado (check console: "✅ [Customer.io] Initialized")
- [ ] `viewer_loaded` event se dispara
- [ ] `camera_moved` events se trackean
- [ ] `layer_toggled` funciona
- [ ] Eventos aparecen en PostHog Live Events

### **3.2 Verificar PostHog Events**

1. **PostHog Dashboard** → https://app.posthog.com
2. **Activity → Live Events**
3. Filtrar por usuario de testing
4. Verificar eventos se reciben en tiempo real:
   - `viewer_loaded`
   - `camera_moved`
   - `timeline_playback_control`
   - `layer_toggled`
   - `feature_first_use` (para 360°)

### **3.3 Console Checks**

Abrir DevTools Console y verificar:

```javascript
// Verificar PostHog
window.posthog // Should be defined
window.posthog.get_distinct_id() // Should return user ID

// Verificar Customer.io
window._cio // Should be defined
window._cio.track // Should be function

// Ver eventos trackeados
// Check console logs para confirmar:
// ✅ [Analytics] PostHog tracked: viewer_loaded
// ✅ [Analytics] Customer.io tracked: viewer_loaded
```

### **3.4 Performance Check**

```bash
# Lighthouse CI (opcional)
npm install -g @lhci/cli
lhci autorun --collect.url=https://staging-url.netlify.app
```

**Targets:**
- Performance: >80
- Accessibility: >90
- Best Practices: >90
- SEO: >85

### **3.5 Error Monitoring**

Check for any errors in:
1. Browser Console
2. Network tab (failed requests)
3. Netlify Function Logs (si aplica)

---

## 🚀 Paso 4: Deploy a Producción

### **4.1 Merge a Main**

Solo si staging tests pasaron exitosamente:

```bash
# Asegurarse que staging está OK
git checkout main
git pull origin main

# Merge release branch
git merge release/v1.6.0-analytics-phase1 --no-ff -m "Release v1.6.0: Analytics Phase 1

Merged from: release/v1.6.0-analytics-phase1
Staging tested: ✅
Performance verified: ✅
Analytics verified: ✅

Deploy to production with confidence."

# Push a main (esto triggerea deploy automático en Netlify)
git push origin main
```

### **4.2 Tag Nueva Versión**

```bash
# Tag de nueva versión en producción
git tag -a v1.6.0 -m "Release v1.6.0 - Analytics Phase 1

Features:
- PostHog product analytics integration
- Customer.io marketing automation
- Camera movement tracking
- Timeline interaction tracking
- Layer activation tracking
- Photo 360° viewer tracking

Deployed: $(date)
Commit: $(git rev-parse HEAD)"

# Push tag
git push origin v1.6.0
```

### **4.3 Monitorear Deploy en Netlify**

1. **Netlify Dashboard** → Deploys
2. Ver progreso del build
3. Esperar a que termine (2-5 minutos)
4. **Status:** ✅ Published

URL de producción:
```
https://axsol-viewer.netlify.app
```

---

## 📊 Paso 5: Verificación Post-Deploy

### **5.1 Smoke Tests (Primeros 5 minutos)**

**Verificación inmediata:**
- [ ] Site carga sin errores
- [ ] Login funciona
- [ ] Viewer 3D funciona
- [ ] No hay errores 500 en Network
- [ ] Console clean (sin errores críticos)

**Quick Test:**
```bash
# Health check
curl -I https://axsol-viewer.netlify.app
# Should return: HTTP/2 200
```

### **5.2 Analytics Verification (Primeros 15 minutos)**

1. **PostHog** → Activity → Live Events
   - Verificar eventos de producción llegando
   - Confirmar usuarios reales trackeados

2. **Customer.io** → Data → Activity
   - Verificar eventos llegando desde producción
   - Confirmar identities creadas

### **5.3 Monitoreo Activo (Primera hora)**

**Métricas a vigilar:**
- Error rate (should be <1%)
- Page load time (should be <3s)
- PostHog event volume (should increase gradually)
- User complaints (Slack, email, soporte)

**Tools:**
- Netlify Analytics Dashboard
- PostHog Session Recordings
- Browser console de usuarios reales

### **5.4 Comunicación al Equipo**

```
📢 DEPLOY COMPLETADO - v1.6.0 Analytics Phase 1

✅ Status: LIVE en producción
🕐 Deployed: [timestamp]
📊 Monitoring: Active (próximas 24h)

Nuevas capacidades:
- Analytics de uso con PostHog
- Tracking de navegación y features
- Base para Customer.io campaigns

⚠️ Si detectas issues:
- Reportar inmediatamente en #tech
- Rollback disponible (1 click)

Testing en producción:
1. Abrir proyecto en viewer
2. Navegar normalmente
3. Check console para warnings
```

---

## 🔄 Paso 6: Rollback Plan (SI ALGO FALLA)

### **Escenarios de Rollback:**

#### **Scenario 1: Error Crítico (Site Down)**
**Síntomas:** 500 errors, blank screen, site no carga

**Rollback Inmediato (2 minutos):**

1. **Netlify Dashboard** → Deploys
2. Find deploy anterior (v1.5.0-stable)
3. Click "Publish deploy" en ese deploy
4. ✅ Rollback instantáneo

**Alternative (Git):**
```bash
# Revert main to previous version
git checkout main
git reset --hard v1.5.0-stable
git push -f origin main
# Netlify auto-deploys
```

---

#### **Scenario 2: Analytics Roto (Site funciona, eventos no)**
**Síntomas:** Site funciona pero eventos no llegan a PostHog

**Decisión:** NO hace falta rollback completo

**Fix Forward:**
```bash
# Deshabilitar analytics temporalmente
# 1. Netlify Dashboard → Environment Variables
# 2. Comentar o eliminar:
#    VITE_PUBLIC_POSTHOG_KEY
#    VITE_CUSTOMERIO_SITE_ID
# 3. Trigger redeploy

# Esto deshabilitará analytics sin romper el site
# El código tiene checks para cuando analytics no está disponible
```

**Debug:**
- Check PostHog API status: https://status.posthog.com
- Verify env vars en Netlify
- Check console logs en producción

---

#### **Scenario 3: Performance Degradation**
**Síntomas:** Site lento, high loading times

**Investigar primero (5 minutos):**
```bash
# Check Netlify Analytics
# Compare before/after deploy

# PostHog performance events
# Filter: viewer_load_failed, viewer_fps_low
```

**Si performance crítica:**
1. Rollback a v1.5.0-stable
2. Investigar offline
3. Optimizar analytics (throttling, sampling)
4. Re-deploy con fix

---

#### **Scenario 4: Bugs No Críticos**
**Síntomas:** Algún evento no se trackea bien, pero site funciona

**Decisión:** NO rollback

**Fix Forward:**
1. Crear hotfix branch
2. Fix específico
3. Deploy directo a main
4. Tag como v1.6.1

```bash
git checkout main
git checkout -b hotfix/analytics-event-fix
# Fix bug
git commit -m "hotfix: Fix [event] tracking"
git checkout main
git merge hotfix/analytics-event-fix
git push origin main
git tag v1.6.1
git push origin v1.6.1
```

---

## 🔍 Paso 7: Monitoreo Post-Deploy (24-48h)

### **Día 1 (Monitoreo Activo)**

**Cada 2 horas:**
- [ ] Check PostHog event volume
- [ ] Verify no error spikes en Netlify
- [ ] Review user feedback channels
- [ ] Check session recordings para issues

**Métricas esperadas:**
- Event volume: Gradual increase
- Error rate: <1%
- Page load: <3s avg
- User complaints: 0 críticos

### **Día 2-7 (Monitoreo Pasivo)**

**Daily checks:**
- PostHog dashboard review
- Netlify analytics review
- User feedback review

**Success Criteria (Semana 1):**
- ✅ 0 rollbacks necesarios
- ✅ Event tracking funcionando >95%
- ✅ No degradación de performance
- ✅ 0 critical bugs reportados
- ✅ Usuarios usando el site normalmente

---

## 📈 Paso 8: Optimización Post-Deploy

### **Semana 2-3: Análisis**

1. **PostHog Dashboards**
   - Crear dashboards según `POSTHOG_DASHBOARDS_GUIDE.md`
   - Identificar features más/menos usadas
   - Detectar patrones de uso

2. **Customer.io Setup**
   - Configurar segments según `CUSTOMERIO_CAMPAIGNS_GUIDE.md`
   - Preparar 3 primeros email campaigns
   - Setup in-app messages según `CUSTOMERIO_IN_APP_MESSAGES_GUIDE.md`

3. **Optimizaciones**
   - Ajustar throttling de camera_moved si necesario
   - Tune event properties basado en datos reales
   - Configurar sampling para eventos de alto volumen

---

## 🎯 Checklist Final de Deployment

### **Pre-Deploy:**
- [ ] Código testeado en localhost
- [ ] Build exitoso
- [ ] Variables de entorno verificadas
- [ ] Tag v1.5.0-stable creado
- [ ] Release branch creada

### **Staging:**
- [ ] Deploy a staging branch
- [ ] Tests funcionales pasando
- [ ] Analytics funcionando en staging
- [ ] PostHog events verificados
- [ ] Performance aceptable

### **Producción:**
- [ ] Merge a main
- [ ] Tag v1.6.0 creado
- [ ] Deploy completado
- [ ] Smoke tests pasando
- [ ] Analytics verificado en prod
- [ ] Equipo notificado

### **Post-Deploy:**
- [ ] Monitoreo activo (24h)
- [ ] Métricas estables
- [ ] 0 critical issues
- [ ] Documentación actualizada
- [ ] Success metrics cumplidas

---

## 📚 Recursos Adicionales

### **Netlify Docs:**
- Rollbacks: https://docs.netlify.com/site-deploys/manage-deploys/#rollback
- Branch Deploys: https://docs.netlify.com/site-deploys/overview/#branch-deploy-controls
- Environment Variables: https://docs.netlify.com/environment-variables/overview/

### **PostHog:**
- Live Events: https://app.posthog.com/events
- Status Page: https://status.posthog.com

### **Customer.io:**
- Dashboard: https://fly.customer.io/workspaces/200043
- Data Activity: https://fly.customer.io/workspaces/200043/data

### **Internal Docs:**
- `ANALYTICS_EVENTS_CATALOG.md` - Eventos implementados
- `FASE_1_IMPLEMENTATION_SUMMARY.md` - Resumen de cambios
- `POSTHOG_DASHBOARDS_GUIDE.md` - Setup de dashboards
- `CUSTOMERIO_CAMPAIGNS_GUIDE.md` - Email campaigns

---

## 🚨 Contactos de Emergencia

**Si algo sale mal:**
1. Rollback inmediato en Netlify (sin esperar aprobación)
2. Notificar en #tech channel
3. Crear incident post-mortem

**Responsables:**
- Tech Lead: [nombre]
- DevOps: [nombre]
- Product: [nombre]

---

## ✅ Post-Deployment Success Checklist

- [ ] Site funcionando normalmente
- [ ] Analytics trackeando eventos
- [ ] 0 critical errors
- [ ] Performance dentro de targets
- [ ] Equipo notificado
- [ ] Documentación actualizada
- [ ] PostHog dashboards configurados (próximos días)
- [ ] Customer.io campaigns preparados (próxima semana)

---

**🎉 Deployment Completado - Fase 1 de Analytics LIVE en Producción**

**Próximos pasos:**
1. Monitorear métricas por 1 semana
2. Configurar dashboards en PostHog
3. Preparar campaigns en Customer.io
4. Planear Fase 2 (features adicionales)
