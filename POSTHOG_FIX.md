# 🔧 PostHog Fix Aplicado

## ❌ Problema Encontrado

El warning `[Analytics] PostHog no disponible` aparecía porque:

**Causa raíz:**  
La función `analyticsInit` en `packages/analytics/src/index.ts` **NO exponía `window.posthog`**.

```typescript
// ANTES (packages/analytics/src/index.ts - línea 17-23)
export function analyticsInit(posthogKey: string, apiHost?: string) {
  posthog.init(posthogKey, {
    api_host: apiHost || 'https://app.posthog.com',
    autocapture: true,
  });
  return posthog;  // ❌ Solo retorna, no expone en window
}
```

Pero `apps/site/src/utils/analytics.js` esperaba:
```javascript
// analytics.js - línea 61-65
if (window.posthog) {
  window.posthog.capture(eventName, enrichedProps);
} else if (isDev) {
  console.warn('[Analytics] PostHog no disponible');  // ← Aparecía esto
}
```

---

## ✅ Fix Aplicado

### **Archivo:** `packages/analytics/src/index.ts`

```typescript
export function analyticsInit(posthogKey: string, apiHost?: string) {
  posthog.init(posthogKey, {
    api_host: apiHost || 'https://app.posthog.com',
    autocapture: false,  // Solo eventos manuales
    capture_pageview: false,  // Manejamos manualmente
  });
  
  // ✅ Exponer globalmente para analytics.js
  if (typeof window !== 'undefined') {
    (window as any).posthog = posthog;
    console.log('✅ [PostHog] Initialized and exposed globally');
  }
  
  return posthog;
}
```

---

## 🧪 Verificación

### **Paso 1: Rebuild del Paquete Analytics**

```bash
cd packages/analytics
npm run build
```

### **Paso 2: Reinstalar en apps/site**

```bash
cd ../../apps/site
npm install
```

### **Paso 3: Reiniciar Dev Server**

```bash
npm run dev
```

**Hard refresh en navegador:** `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows)

---

## 📊 Resultado Esperado

### **En Consola (al cargar la página):**

```javascript
✅ [PostHog] Initialized and exposed globally
📊 [Analytics] layer_toggled { layer_type: 'fotos', enabled: true, ... }
📊 [Analytics] camera_moved { movement_type: 'zoom', ... }
```

### **NO deberías ver:**
```
⚠️ [Analytics] PostHog no disponible  ← Ya NO debe aparecer
```

---

## 🔍 Debug si Sigue Fallando

Si después del rebuild aún ves el warning:

### **Check 1: Verificar que window.posthog existe**

```javascript
// En consola del navegador (F12)
console.log('PostHog disponible:', !!window.posthog);
console.log('PostHog objeto:', window.posthog);
```

**Esperado:**
```
PostHog disponible: true
PostHog objeto: Object { ... }
```

### **Check 2: Verificar que el paquete se rebuildeó**

```bash
# En packages/analytics/dist/ debe existir el archivo compilado
ls -la packages/analytics/dist/
```

**Debe mostrar:** `index.js`, `index.d.ts`, etc.

### **Check 3: Verificar VITE_POSTHOG_KEY en .env**

```bash
# En apps/site/
cat .env | grep POSTHOG
```

**Debe mostrar:**
```
VITE_POSTHOG_KEY=phc_tu_key_aqui
```

**Si no existe**, crear `apps/site/.env`:
```bash
echo "VITE_POSTHOG_KEY=phc_tu_key_aqui" > apps/site/.env
echo "VITE_POSTHOG_HOST=https://app.posthog.com" >> apps/site/.env
```

### **Check 4: Cache de Node Modules**

Si nada funciona, limpiar todo y reinstalar:

```bash
# Desde la raíz del monorepo
rm -rf node_modules package-lock.json
rm -rf packages/analytics/node_modules packages/analytics/package-lock.json
rm -rf apps/site/node_modules apps/site/package-lock.json

# Reinstalar
npm install

# Rebuild analytics
cd packages/analytics
npm run build
cd ../..

# Dev
cd apps/site
npm run dev
```

---

## ✅ Checklist Post-Fix

- [ ] Rebuild de `packages/analytics` completado
- [ ] `npm install` en `apps/site` ejecutado
- [ ] Dev server reiniciado
- [ ] Hard refresh en navegador realizado
- [ ] Log `✅ [PostHog] Initialized` visible en consola
- [ ] NO aparece warning `PostHog no disponible`
- [ ] Eventos de analytics aparecen en consola
- [ ] PostHog Live Events muestra eventos (si API key configurada)

---

## 🎯 Próximo Paso

Una vez que confirmes que ya NO aparece el warning:

1. ✅ Verifica que los eventos se trackean (consola)
2. 🚀 Ve a PostHog dashboard → Live Events
3. 📊 Confirma que los eventos llegan en tiempo real
4. 🎉 Crear dashboards y empezar a analizar

---

**Status:** 🔧 Fix aplicado, pendiente rebuild + test
