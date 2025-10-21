# 🚀 WWW App - Deployment Guide to www.ingeia.tech

## Método 1: Netlify Dashboard (Recomendado)

### **Paso 1: Crear Nuevo Sitio en Netlify**

1. Ve a [Netlify Dashboard](https://app.netlify.com)
2. Click en **"Add new site"** → **"Import an existing project"**
3. Selecciona **GitHub** y conecta el repo `galensonet1/axsol.ai-viewer`

### **Paso 2: Configurar Build Settings**

En la configuración del sitio:

```
Base directory: apps/www
Build command: npm install && npm run build
Publish directory: apps/www/dist
```

**IMPORTANTE:** Netlify detectará automáticamente el archivo `apps/www/netlify.toml` y usará esa configuración.

### **Paso 3: Configurar Dominio Personalizado**

1. En el dashboard del sitio nuevo, ve a **Domain management**
2. Click en **"Add custom domain"**
3. Ingresa: `www.ingeia.tech`
4. Netlify te pedirá configurar DNS

### **Paso 4: Configurar DNS**

En tu proveedor de DNS (donde tienes `ingeia.tech`):

**Opción A - CNAME (Recomendado si usas Netlify DNS):**
```
Tipo: CNAME
Nombre: www
Valor: [tu-sitio-netlify].netlify.app
TTL: Auto o 3600
```

**Opción B - A Record (si prefieres IP):**
```
Tipo: A
Nombre: www
Valor: 75.2.60.5 (IP de Netlify)
TTL: Auto o 3600
```

### **Paso 5: Verificar SSL**

Netlify configurará SSL automáticamente. Espera 1-2 minutos después de configurar DNS.

---

## Método 2: Netlify CLI (Más Rápido)

### **Instalación:**

```bash
npm install -g netlify-cli
netlify login
```

### **Deploy desde /apps/www:**

```bash
cd apps/www

# Primera vez (crea el sitio)
netlify deploy --prod

# Selecciona:
# - Create & configure a new site
# - Team: tu equipo
# - Site name: ingeia-www (o el que prefieras)
# - Publish directory: dist
```

### **Deploy subsiguientes:**

```bash
cd apps/www
npm run build
netlify deploy --prod
```

### **Configurar dominio custom:**

```bash
netlify sites:update --name ingeia-www
netlify domains:add www.ingeia.tech
```

---

## Método 3: Deploy Manual (Testing)

Si solo quieres probar:

```bash
cd apps/www
npm run build
netlify deploy --dir=dist
```

Esto te dará una URL temporal para testear antes del deploy a producción.

---

## 🔄 CI/CD Automático

### **Configurar Deploy Automático en cada Push:**

1. En Netlify dashboard → **Site settings** → **Build & deploy**
2. Configura:
   - **Branch to deploy:** `main` (o `release/v1.6.0-analytics-phase1` para testing)
   - **Base directory:** `apps/www`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `apps/www/dist`

3. Cada push al branch configurado triggereará un deploy automático

---

## 📊 Arquitectura Final

```
ingeia.tech              → App SITE (viewer) - Netlify Site 1
├─ www.ingeia.tech       → App WWW (landing) - Netlify Site 2 (NUEVO)
└─ bo.ingeia.tech        → Backend API - Servidor propio
```

---

## ✅ Checklist de Deployment

- [ ] `netlify.toml` creado en `apps/www/`
- [ ] Nuevo sitio creado en Netlify
- [ ] Build settings configurados
- [ ] Dominio custom `www.ingeia.tech` agregado
- [ ] DNS configurado (CNAME a Netlify)
- [ ] SSL verificado (certificado activo)
- [ ] Deploy exitoso
- [ ] Sitio accesible en `https://www.ingeia.tech`

---

## 🐛 Troubleshooting

### **Build falla:**
```bash
# Testear build localmente primero
cd apps/www
npm install
npm run build
```

### **Dominio no resuelve:**
- Verificar DNS con: `dig www.ingeia.tech`
- Puede tomar hasta 48h (usualmente 1-2h)
- Verificar en: `https://dnschecker.org/#CNAME/www.ingeia.tech`

### **SSL no activa:**
- Esperar 5-10 minutos después de configurar DNS
- En Netlify dashboard: **Domain settings** → **HTTPS** → **Verify DNS configuration**

---

## 🎯 Próximos Pasos Después del Deploy

1. ✅ Verificar que `https://www.ingeia.tech` carga correctamente
2. ✅ Testear todas las imágenes (3.png, 5.png, 10.png, logo)
3. ✅ Verificar que los links de navegación funcionan
4. ✅ Configurar Google Analytics (si aplica)
5. ✅ Agregar sitio a Google Search Console

---

## 📝 Comandos Rápidos

```bash
# Build local
cd apps/www && npm run build

# Preview local
cd apps/www && npm run dev

# Deploy a producción (Netlify CLI)
cd apps/www && netlify deploy --prod

# Ver logs de build
netlify logs

# Ver sitios
netlify sites:list
```
