# 🚀 Quick Deploy to www.ingeia.tech

## ⚡ Paso 1: Crear Sitio en Netlify (5 minutos)

### **1.1 Acceder a Netlify**
👉 https://app.netlify.com

### **1.2 Crear Nuevo Sitio**
1. Click en **"Add new site"** → **"Import an existing project"**
2. Seleccionar **GitHub**
3. Buscar y seleccionar: `galensonet1/axsol.ai-viewer`
4. Autorizar acceso si es necesario

### **1.3 Configurar Build Settings**

```
Repository branch:     release/v1.6.0-analytics-phase1
Base directory:        apps/www
Build command:         npm install && npm run build
Publish directory:     apps/www/dist
```

**IMPORTANTE:** Netlify detectará automáticamente el archivo `apps/www/netlify.toml` con toda la configuración.

### **1.4 Deploy**
1. Click en **"Deploy site"**
2. Esperar 2-3 minutos mientras se construye
3. ✅ Sitio publicado en: `https://[random-name].netlify.app`

---

## 🌐 Paso 2: Configurar Dominio Custom

### **2.1 Agregar Dominio en Netlify**
1. En tu sitio nuevo, ir a **"Domain management"**
2. Click en **"Add custom domain"**
3. Escribir: `www.ingeia.tech`
4. Click en **"Verify"**

### **2.2 Configurar DNS**

Ir a tu proveedor de DNS (donde tienes `ingeia.tech`) y agregar:

```
Tipo:   CNAME
Nombre: www
Valor:  [tu-sitio].netlify.app
TTL:    3600 (o Auto)
```

**Ejemplo:**
```
CNAME   www   →   ingeia-www.netlify.app
```

### **2.3 Esperar Propagación DNS**
- **Tiempo:** 5 minutos a 2 horas (usualmente 10-15 min)
- **Verificar:** https://dnschecker.org/#CNAME/www.ingeia.tech

### **2.4 Activar SSL**
Netlify activará SSL automáticamente después de que el DNS propague.
- Ir a **"Domain settings"** → **"HTTPS"**
- Esperar mensaje: ✅ "Certificate is active"

---

## ✅ Paso 3: Verificar Deployment

### **Checklist:**
- [ ] Sitio carga en `https://www.ingeia.tech`
- [ ] Todas las imágenes se ven correctamente
- [ ] Logo se muestra en Header y Footer
- [ ] Botón "Solicite un Demo" abre Calendly
- [ ] Navegación funciona (scroll a secciones)
- [ ] SSL activo (candado verde en navegador)

---

## 🔄 Paso 4: Deploy Automático (Opcional)

Para que cada push actualice automáticamente:

1. En Netlify: **"Site settings"** → **"Build & deploy"**
2. Verificar que esté configurado:
   - **Production branch:** `main` o `release/v1.6.0-analytics-phase1`
   - **Deploy contexts:** Production
3. Cada push al branch triggereará un deploy automático

---

## 📊 Arquitectura Final

```
www.ingeia.tech      → Landing page (apps/www) - Netlify
ingeia.tech          → Viewer app (apps/site) - Netlify  
bo.ingeia.tech       → Backend API - Servidor propio
```

---

## 🐛 Troubleshooting

### **Build falla en Netlify:**
```bash
# Testear localmente primero:
cd apps/www
npm install
npm run build
```

Si funciona localmente, verificar que Node version sea 22 en Netlify.

### **Dominio no resuelve:**
```bash
# Verificar DNS:
dig www.ingeia.tech

# Verificar propagación:
# https://dnschecker.org/#CNAME/www.ingeia.tech
```

### **Calendly no funciona:**
- Verificar que el script se cargue (abrir DevTools → Network → buscar `widget.js`)
- Verificar URL: `https://calendly.com/axsol/30min`

### **Imágenes no cargan:**
- Verificar que las rutas usen `/images/...` (con slash inicial)
- Verificar que las imágenes existan en `apps/www/public/images/`

---

## 📝 Comandos Útiles

```bash
# Ver build localmente
cd apps/www
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Deploy con Netlify CLI (alternativa)
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🎉 ¡Listo!

Tu landing page estará disponible en:
👉 **https://www.ingeia.tech**

Para soporte o cambios, contactar al equipo de desarrollo.
