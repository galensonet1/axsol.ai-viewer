# 🚀 Panel de Administración AXSOL.ai

## 🎯 Inicio Rápido

### **1. Iniciar el Servidor**
```bash
cd backend
npm run dev
```

### **2. Acceder al Panel**
```
🔗 http://localhost:3001/admin/admin.html
```

### **3. Script de Inicio Automático**
```bash
cd backend
node start-admin.js
```

---

## 📋 Funcionalidades

### ✅ **Gestión de Proyectos**
- CRUD completo de proyectos
- Campos: nombre, descripción, business_id, fechas
- **Polígonos GeoJSON**: project_polygon, layout_polygon
- Estados automáticos: Planificado, En Progreso, Completado

### ✅ **Gestión de Usuarios**
- CRUD completo de usuarios
- Estados: activo/inactivo
- Visualización de roles asignados

### ✅ **Gestión de Roles**
- CRUD completo de roles
- Descripción y contador de usuarios
- Protección contra eliminación con usuarios asignados

### ✅ **Gestión de Permisos**
- Asignación de roles a usuarios
- Prevención de duplicados
- Eliminación de asignaciones

### ✅ **Dashboard**
- Estadísticas en tiempo real
- Proyectos, usuarios, roles y asignaciones

---

## 👥 Usuarios de Prueba

| Email | Nombre | Rol | Estado |
|-------|--------|-----|--------|
| admin@axsol.ai | Cristian Administrador | admin | ✅ Activo |
| maria.gerente@axsol.ai | María Gerente | manager | ✅ Activo |
| ana.consultora@axsol.ai | Ana Consultora | viewer | ✅ Activo |
| juan.operador@axsol.ai | Juan Operador | operator, viewer | ✅ Activo |
| carlos.tecnico@axsol.ai | Carlos Técnico | operator | ❌ Inactivo |

---

## 🛠️ Comandos Útiles

### **Crear Datos de Prueba**
```bash
# Usuarios y roles
node seed-users-roles.js

# Proyectos (opcional)
node seed-projects.js
```

### **Actualizar Esquema de BD**
```bash
# Agregar columnas de polígonos
node add-polygon-columns.js

# Actualizar esquema usuarios/roles
node update-user-role-schema.js

# Corregir tabla projects
node fix-projects-table.js
```

### **Verificar APIs**
```bash
# Estadísticas
curl http://localhost:3001/api/admin/stats/extended | jq

# Usuarios
curl http://localhost:3001/api/admin/users | jq

# Roles
curl http://localhost:3001/api/admin/roles | jq

# Proyectos
curl http://localhost:3001/api/admin/projects | jq
```

---

## 📊 Estadísticas Actuales

- **👥 6 usuarios** (5 activos)
- **🛡️ 9 roles** configurados  
- **🔗 7 asignaciones** de roles
- **📁 2 proyectos** de ejemplo
- **✅ 100% funcional** - Todas las secciones operativas

---

## 🎨 Tecnologías

### **Backend:**
- Node.js + Express
- PostgreSQL
- APIs RESTful

### **Frontend:**
- HTML5 + Bootstrap 5
- JavaScript ES6+
- Bootstrap Icons

---

## 📁 Estructura de Archivos

```
backend/
├── routes/admin.js              # APIs del panel admin
├── public/
│   ├── admin.html              # Interfaz del panel
│   └── admin.js                # Lógica JavaScript
├── seed-users-roles.js         # Datos de prueba
├── start-admin.js              # Script de inicio
└── update-user-role-schema.js  # Actualización de BD
```

---

## 🚀 Ventajas vs ForestAdmin

### ✅ **Personalización Total**
- Interfaz específica para AXSOL.ai
- Campos personalizados (polígonos GeoJSON)
- Lógica de negocio integrada

### ✅ **Performance**
- Consultas optimizadas
- Sin overhead de herramientas genéricas
- Carga rápida

### ✅ **Control**
- Código fuente completo
- Modificaciones inmediatas
- Sin dependencias externas

### ✅ **Costo**
- Sin licencias mensuales
- Sin límites de usuarios
- Escalabilidad ilimitada

---

## 📈 Próximos Pasos

### **Funcionalidades:**
- [ ] Autenticación integrada con Auth0
- [ ] Permisos granulares por acción
- [ ] Auditoría de cambios
- [ ] Exportación a CSV/Excel
- [ ] Filtros avanzados y búsqueda
- [ ] Paginación para grandes volúmenes

### **UX:**
- [ ] Confirmaciones mejoradas
- [ ] Acciones masivas (bulk actions)
- [ ] Drag & drop para reordenar
- [ ] Notificaciones en tiempo real

---

## 🆘 Soporte

### **Problemas Comunes:**

**❌ Error: "column does not exist"**
```bash
# Ejecutar actualización de esquema
node update-user-role-schema.js
```

**❌ Error: "server not running"**
```bash
# Verificar que el servidor esté corriendo
cd backend && npm run dev
```

**❌ Error: "no data"**
```bash
# Crear datos de prueba
node seed-users-roles.js
```

---

## 📞 Contacto

Para soporte técnico o mejoras, contactar al equipo de desarrollo de AXSOL.ai.

---

**🎉 ¡El panel de administración está listo para usar!**

**🔗 Acceso directo: http://localhost:3001/admin/admin.html**
