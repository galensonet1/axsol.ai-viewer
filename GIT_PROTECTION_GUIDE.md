# 🛡️ Protección de Archivos Dinámicos en Git

## 🎯 Problema Resuelto

**Problema:** Los archivos subidos por usuarios (CZML del plan de actividades, logos de proyectos) se perdían al hacer `git pull` o `git push` porque estaban en carpetas versionadas.

**Solución:** Configurar `.gitignore` para que Git **ignore** estos archivos dinámicos pero **mantenga** la estructura de carpetas.

---

## 📁 Estructura de Archivos Dinámicos

### **Backend:**

```
backend/public/
├── data/
│   ├── .gitkeep                    ✅ Versionado en Git
│   └── projects/
│       ├── .gitkeep                ✅ Versionado en Git
│       ├── 1/
│       │   ├── weekly_plan_1760627194109.czml    🔒 IGNORADO por Git
│       │   └── logo_1760627194109.png            🔒 IGNORADO por Git
│       ├── 2/
│       │   └── weekly_plan_1760627194110.czml    🔒 IGNORADO por Git
│       └── .../
└── imagenes/
    ├── .gitkeep                    ✅ Versionado en Git
    └── *.jpg, *.png               🔒 IGNORADO por Git
```

### **¿Qué se versiona en Git?**

- ✅ Código fuente (`.js`, `.jsx`, `.css`, etc.)
- ✅ Configuración (`.env.example`, `package.json`)
- ✅ Estructura de carpetas (archivos `.gitkeep`)
- ❌ **NO** archivos subidos dinámicamente

---

## 🔧 Configuración Aplicada

### **Archivo:** `backend/.gitignore`

```gitignore
# ============================================
# 🚨 IMPORTANTE: Archivos subidos por usuarios
# ============================================

# Archivos dinámicos de proyectos
# Estructura: public/data/projects/{projectId}/weekly_plan_xxx.czml, logo_xxx.png
public/data/projects/*/

# Mantener solo la estructura base (directorios vacíos)
!public/data/.gitkeep
!public/data/projects/.gitkeep

# Otros archivos dinámicos
public/imagenes/*
!public/imagenes/.gitkeep
```

### **Archivos `.gitkeep` Creados:**

```bash
backend/public/data/.gitkeep
backend/public/data/projects/.gitkeep
backend/public/imagenes/.gitkeep
```

**¿Qué hace `.gitkeep`?**
- Son archivos vacíos
- Permiten versionar **carpetas vacías** en Git
- Git normalmente ignora carpetas vacías
- Con `.gitkeep`, la carpeta existe en el repositorio pero su contenido se ignora

---

## 🚀 Workflow de Git

### **Escenario 1: Hacer Commit de Código**

```bash
# 1. Modificas código
# 2. Verificar qué archivos se incluirán
git status

# ✅ Verás SOLO código fuente
# ❌ NO verás weekly_plan_*.czml ni logos

# 3. Hacer commit
git add .
git commit -m "feat: mejoras en el visor"
git push
```

### **Escenario 2: Hacer Pull de Cambios**

```bash
# 1. Alguien más hizo cambios en el código
git pull

# ✅ Se actualizan archivos .js, .jsx, etc.
# ✅ Se mantienen tus archivos en public/data/projects/
# ❌ NO se pierden los CZML ni logos
```

### **Escenario 3: Clonar el Repo en Nuevo Servidor**

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-repo/axsol-viewer.git

# 2. Estructura creada:
# ✅ backend/public/data/ (existe)
# ✅ backend/public/data/projects/ (existe)
# ❌ backend/public/data/projects/1/ (NO existe aún)

# 3. Al subir el primer archivo desde el admin:
# ✅ Se crea automáticamente public/data/projects/1/
# ✅ Se guarda weekly_plan_xxx.czml
# ✅ Git NO trackea estos archivos
```

---

## 📋 Checklist de Verificación

### **En Desarrollo Local:**

- [ ] Crear archivo `.gitignore` en `/backend/`
- [ ] Crear archivos `.gitkeep` en carpetas clave
- [ ] Hacer commit de estos cambios
- [ ] Verificar con `git status` que archivos CZML/logos NO aparecen

### **En Servidor de Producción:**

- [ ] Hacer backup de `public/data/projects/` antes del pull
- [ ] Ejecutar `git pull`
- [ ] Verificar que archivos dinámicos NO se perdieron
- [ ] Confirmar que nuevos archivos siguen siendo ignorados

---

## 🔍 Verificar que Funciona

### **Test 1: Verificar Ignorados**

```bash
cd backend
git status

# Deberías ver:
# modified: server.js
# modified: package.json
# ...

# NO deberías ver:
# public/data/projects/1/weekly_plan_xxx.czml ❌
# public/imagenes/logo.png ❌
```

### **Test 2: Forzar Check**

```bash
# Intentar añadir un archivo ignorado
git add public/data/projects/1/weekly_plan_1760627194109.czml

# Resultado esperado:
# The following paths are ignored by one of your .gitignore files:
# public/data/projects/1/weekly_plan_1760627194109.czml
```

### **Test 3: Ver Archivos Trackeados**

```bash
# Ver SOLO archivos que Git trackea en public/
git ls-files public/

# Deberías ver SOLO:
# public/admin.html
# public/admin.js
# public/data/.gitkeep
# public/data/projects/.gitkeep
# public/imagenes/.gitkeep
```

---

## ⚠️ Consideraciones Importantes

### **1. Backup de Archivos Dinámicos**

Los archivos en `public/data/projects/` **NO están en Git**, así que:

**✅ DEBES hacer backup externo:**
- Backup diario/semanal de `backend/public/data/`
- Usar rsync, AWS S3, Google Cloud Storage, etc.
- Ejemplo:

```bash
# Backup a otro servidor
rsync -avz backend/public/data/ usuario@backup-server:/backups/axsol-data/

# O comprimir y subir a cloud
tar -czf data-backup-$(date +%Y%m%d).tar.gz backend/public/data/
# Subir a S3, Drive, etc.
```

### **2. Nuevos Servidores / Deploy**

Al hacer deploy en un servidor nuevo:

1. ✅ Clonar el repositorio
2. ✅ Las carpetas `public/data/projects/` existirán (vacías con `.gitkeep`)
3. ⚠️ Restaurar backup de archivos dinámicos:

```bash
# Copiar archivos dinámicos desde backup
scp -r backup-server:/backups/axsol-data/* backend/public/data/
```

### **3. Base de Datos**

**IMPORTANTE:** La BD tiene referencias a estos archivos:

```sql
-- Tabla: projects
weekly_construction_plan = '/data/projects/1/weekly_plan_1760627194109.czml'
logo = '/data/projects/1/logo_1760627194109.png'
```

**Al hacer deploy:**
1. ✅ Restaurar BD (dump SQL)
2. ✅ Restaurar archivos en `public/data/` (backup externo)
3. ✅ Verificar que rutas coinciden

---

## 🎯 Resumen

| Aspecto | Estado |
|---------|--------|
| **Archivos protegidos** | ✅ CZML, logos, imágenes |
| **Git ignora dinámicos** | ✅ Configurado en `.gitignore` |
| **Estructura versionada** | ✅ Carpetas con `.gitkeep` |
| **Pull seguro** | ✅ No se pierden archivos |
| **Push limpio** | ✅ No se suben archivos dinámicos |
| **Backup necesario** | ⚠️ Hacer backup externo regular |

---

## 🚨 Importante para el Equipo

**Comunicar a todos los desarrolladores:**

1. 📝 Los archivos en `public/data/projects/` son **IGNORADOS por Git**
2. 💾 Hacer **backup externo** de estos archivos regularmente
3. 🔄 Al hacer pull, los archivos locales **SE MANTIENEN**
4. 🆕 En nuevos clones, **RESTAURAR archivos** desde backup
5. 🗄️ La BD y los archivos deben estar **SINCRONIZADOS**

---

## 📞 Comandos Útiles

```bash
# Ver archivos ignorados en una carpeta
git status --ignored public/data/projects/

# Limpiar archivos no trackeados (CUIDADO)
git clean -n  # Preview (no elimina nada)
# NO ejecutar 'git clean -f' en public/data/

# Ver todos los archivos que Git trackea
git ls-files

# Verificar patrón de .gitignore
git check-ignore -v public/data/projects/1/weekly_plan_1760627194109.czml
```

---

**✅ Configuración completa y documentada.**

**🎉 Tus archivos dinámicos ahora están protegidos de Git.**
