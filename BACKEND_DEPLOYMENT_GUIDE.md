# 🚀 Backend Deployment Guide

## Problema Actual

El backend en producción (`bo.ingeia.tech`) está en una versión antigua que no tiene:
- `/api/projects/:id/layout` endpoint (404)
- `/api/projects/:id/permissions` endpoint actualizado (500)
- CORS actualizado para deploy previews
- `/api/system/*` endpoints (version, releases, health)

## ✅ Solución: Deploy del Backend

### **Opción 1: Deploy Manual (SSH)**

Si el backend está en un servidor con SSH:

```bash
# 1. SSH al servidor
ssh user@bo.ingeia.tech

# 2. Ir al directorio del proyecto
cd /path/to/axsol-viewer

# 3. Pull latest changes
git fetch origin
git checkout release/v1.6.0-analytics-phase1
git pull origin release/v1.6.0-analytics-phase1

# 4. Instalar dependencias (si hay nuevas)
cd backend
npm install

# 5. Restart backend service
pm2 restart backend
# O si usas systemd:
sudo systemctl restart backend
# O si usas nodemon/forever:
forever restart backend/server.js
```

---

### **Opción 2: Docker**

Si el backend está en Docker:

```bash
# 1. SSH al servidor
ssh user@bo.ingeia.tech

# 2. Pull latest changes
cd /path/to/axsol-viewer
git fetch origin
git checkout release/v1.6.0-analytics-phase1
git pull origin release/v1.6.0-analytics-phase1

# 3. Rebuild y restart container
docker-compose down
docker-compose build backend
docker-compose up -d backend

# O si es un solo container:
docker stop axsol-backend
docker build -t axsol-backend ./backend
docker run -d --name axsol-backend -p 3000:3000 axsol-backend
```

---

### **Opción 3: Render/Railway/Similar**

Si está en un servicio cloud:

1. **Render:**
   - Dashboard → tu backend service
   - Settings → Branch: Cambiar a `release/v1.6.0-analytics-phase1`
   - O hacer "Manual Deploy" → Latest commit

2. **Railway:**
   - Dashboard → tu backend service
   - Settings → Source → Branch: `release/v1.6.0-analytics-phase1`
   - Auto-redeploy

3. **Heroku:**
   ```bash
   git push heroku release/v1.6.0-analytics-phase1:main
   ```

---

### **Opción 4: PM2 Local (Testing)**

Si quieres probar localmente primero:

```bash
# 1. Ir al backend
cd backend

# 2. Instalar PM2 globalmente (si no lo tienes)
npm install -g pm2

# 3. Copiar .env.example a .env y configurar
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar con PM2
pm2 start server.js --name axsol-backend

# 5. Ver logs
pm2 logs axsol-backend

# 6. Ver status
pm2 status

# 7. Restart
pm2 restart axsol-backend

# 8. Stop
pm2 stop axsol-backend
```

---

## 🔍 Verificar que el Deploy Funcionó

### **Test 1: Health Check**
```bash
curl https://bo.ingeia.tech/api/system/health
```

**Esperado:**
```json
{
  "success": true,
  "status": "healthy",
  "uptime": {...}
}
```

### **Test 2: Version Check**
```bash
curl https://bo.ingeia.tech/api/system/version
```

**Esperado:**
```json
{
  "success": true,
  "version": "v1.6.0",
  "commit": {...}
}
```

### **Test 3: Layout Endpoint (requiere auth)**
```bash
curl https://bo.ingeia.tech/api/projects/8/layout
```

**Esperado:** JSON con layout o `{"layout_geojson": null}`
**NO esperado:** 404

### **Test 4: CORS**
Desde el deploy preview, verificar que las requests no den error CORS.

---

## ⚠️ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en producción
- [ ] Base de datos accesible
- [ ] Auth0 configurado correctamente
- [ ] Backup de la versión actual (por si necesitas rollback)

### **Variables de Entorno Críticas:**

```bash
# Database
DATABASE_URL=postgresql://...

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.axsol.ai
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/

# Optional pero recomendado
NODE_ENV=production
PORT=3000
```

---

## 🔄 Rollback Plan

Si algo sale mal después del deploy:

### **Git Rollback:**
```bash
# SSH al servidor
ssh user@bo.ingeia.tech
cd /path/to/axsol-viewer

# Volver a main (versión estable)
git checkout main
git pull origin main

# Restart
pm2 restart backend
```

### **Tag Rollback:**
```bash
# Volver al tag estable
git checkout v1.5.0-stable

# Restart
pm2 restart backend
```

---

## 📝 Logs de Debug

Si hay errores después del deploy:

```bash
# PM2 logs
pm2 logs axsol-backend --lines 100

# Docker logs
docker logs axsol-backend -f

# Systemd logs
journalctl -u backend -f

# Direct logs (si no usas gestor)
tail -f /var/log/backend.log
```

---

## 🎯 Después del Deploy

1. **Verificar Admin Panel:**
   - Ir a https://bo.ingeia.tech/admin/admin.html
   - Verificar que la versión muestre `v1.6.0` (o el commit actual)
   - Click "Ver Historial de Releases" → Debe mostrar releases

2. **Verificar Frontend Preview:**
   - Abrir deploy preview de Netlify
   - No debe haber errores CORS
   - No debe haber 404 en `/api/projects/8/layout`
   - No debe haber 500 en `/api/projects/8/permissions`

3. **Testing Completo:**
   - Login
   - Abrir un proyecto
   - Verificar que viewer carga
   - Verificar analytics en PostHog

---

## 🚨 Si No Puedes Acceder al Servidor

**Alternativa: Deployar backend localmente en otra instancia**

1. Crear nueva instancia en Render/Railway/Heroku
2. Configurar variables de entorno
3. Conectar repo de GitHub
4. Deploy branch `release/v1.6.0-analytics-phase1`
5. Actualizar `VITE_API_BASE_URL` en frontend para apuntar a nueva URL

---

## 📞 Siguiente Paso

**Dime cómo está deployado actualmente tu backend y te doy los comandos exactos:**
- ¿Servidor propio? (SSH, IP, credenciales)
- ¿Docker?
- ¿Servicio cloud? (Render, Railway, Heroku, etc)
- ¿PM2, systemd, otro?

Una vez deployado el backend, los errores desaparecerán y el deploy preview funcionará completamente.
