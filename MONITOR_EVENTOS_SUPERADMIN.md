# 📊 Monitor de Eventos - Solo Superadmin

**Monitor de analytics integrado en el menú de usuario, accesible solo para Superadmin (id=5)**

---

## ✅ **Cambios Implementados**

### **🔐 Acceso Restringido:**
- **Solo Superadmin** (user.id === 5) puede ver y acceder
- **Ubicación:** Menú de usuario (avatar) → "Monitor de Eventos"
- **Removido** del menú principal hamburguesa

### **📍 Nueva Ubicación del Acceso:**

```
┌─────────────────────────────────────────────────────┐
│  🏠 ☰ [Logo Cliente]              [Avatar] ⚙️      │
│                                      ↓              │
│                               ┌─────────────────┐   │
│                               │ Cerrar Sesión   │   │
│                               │ Consola Admin   │   │ ← Admin
│                               │ Monitor Eventos │   │ ← Superadmin
│                               └─────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 **Cómo Acceder (Solo Superadmin)**

### **Paso a Paso:**
1. **Login** como usuario con `id = 5` (Superadmin)
2. **Ir a cualquier proyecto** (ej: `/projects/123/viewer`)
3. **Click en avatar** (esquina superior derecha)
4. **Seleccionar "Monitor de Eventos"**
5. **URL resultante:** `/projects/123/admin`

### **Verificaciones de Seguridad:**
- ✅ **Verificación en menú:** Solo muestra opción si `user.id === 5`
- ✅ **Verificación en página:** AdminDashboard verifica permisos
- ✅ **Mensaje de error:** Si no es Superadmin, muestra acceso denegado

---

## 🔐 **Control de Acceso**

### **Niveles de Permisos:**

```javascript
// Usuario Normal (id ≠ 5)
- ❌ No ve "Monitor de Eventos" en menú
- ❌ No puede acceder a /projects/:id/admin

// Admin (hasRole('Admin'))  
- ✅ Ve "Consola Admin" en menú
- ❌ No ve "Monitor de Eventos" (a menos que id=5)

// Superadmin (id === 5)
- ✅ Ve "Consola Admin" en menú (si también es Admin)
- ✅ Ve "Monitor de Eventos" en menú
- ✅ Acceso completo al Monitor de Eventos
```

### **Verificación en Código:**

```javascript
// En ProjectLayout.jsx
const isSuperAdmin = user?.id === 5;

{isSuperAdmin && (
  <MenuItem onClick={openEventsMonitor}>
    <AnalyticsIcon fontSize="small" />
    Monitor de Eventos
  </MenuItem>
)}

// En AdminDashboard.jsx
const isSuperAdmin = user?.id === 5;

if (!isSuperAdmin) {
  return <Alert severity="error">
    Solo los Superadministradores pueden acceder al Monitor de Eventos.
  </Alert>;
}
```

---

## 📊 **Funcionalidades del Monitor**

### **🎯 Monitor Completo:**
- **Detección automática** de discrepancias entre catálogo y realidad
- **Monitoreo en tiempo real** de eventos emitidos
- **Control granular** enable/disable por evento
- **Exportación** de datos para análisis
- **Test manual** de eventos

### **🚨 Alertas Críticas:**
- **Eventos implementados** que no se disparan
- **Eventos funcionando** no catalogados
- **Servicios desconectados** (PostHog, Customer.io, Segment)

### **📈 Dashboard Ejecutivo:**
```
┌─────────────────────────────────────────────────────┐
│  📊 Monitor de Eventos                              │
│  Monitoreo en tiempo real de analytics - Solo SA   │
├─────────────────────────────────────────────────────┤
│  📈 Resumen: 3 Discrepancias | 15 Funcionando      │
├─────────────────────────────────────────────────────┤
│  🚨 ALERTAS: viewer_loaded | layer_toggled          │
├─────────────────────────────────────────────────────┤
│  📋 TABS: [Analytics Monitor] [Sistema] [Config]    │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 **Casos de Uso Específicos**

### **1. Debugging de Eventos (Superadmin)**
```
Problema: "timeline_playback_control no llega a Customer.io"
Acceso: Avatar → Monitor de Eventos → Buscar evento
Resultado: Ve que se dispara en PostHog pero no en Customer.io
```

### **2. Auditoría de Sistema**
```
Problema: "¿Qué eventos están rotos?"
Acceso: Avatar → Monitor de Eventos → Filtrar "Discrepancias"
Resultado: Lista de eventos con problemas específicos
```

### **3. Validación de Implementación**
```
Problema: "¿Funciona el nuevo evento que implementé?"
Acceso: Avatar → Monitor de Eventos → Test manual
Resultado: Confirma que el evento se dispara correctamente
```

### **4. Monitoreo de Producción**
```
Problema: "¿Los analytics siguen funcionando?"
Acceso: Avatar → Monitor de Eventos → Ver "Emitiendo Ahora"
Resultado: Monitoreo en tiempo real de actividad
```

---

## 🔧 **Configuración de Superadmin**

### **Identificar Superadmin:**

Para verificar si un usuario es Superadmin:

```javascript
// En consola del browser (como Superadmin)
console.log('Usuario actual:', window.user);
console.log('Es Superadmin:', window.user?.id === 5);

// O en React DevTools
// UserContext → user → id === 5
```

### **Cambiar ID de Superadmin:**

Si necesitas cambiar el ID de Superadmin:

```javascript
// En ProjectLayout.jsx línea ~117
const isSuperAdmin = user?.id === 5; // Cambiar 5 por el ID deseado

// En AdminDashboard.jsx línea ~64  
const isSuperAdmin = user?.id === 5; // Cambiar 5 por el ID deseado
```

---

## 🚨 **Seguridad y Consideraciones**

### **✅ Ventajas de esta Implementación:**
- **Acceso ultra-restringido** - Solo 1 usuario específico
- **No visible** para otros usuarios (ni siquiera Admins)
- **Verificación doble** (menú + página)
- **Ubicación lógica** en menú de usuario

### **⚠️ Consideraciones:**
- **Hardcoded ID** - Cambiar si el Superadmin cambia
- **Solo 1 Superadmin** - Expandir si necesitas más
- **ID numérico** - Asegurar que sea el correcto

### **🔒 Alternativas Futuras:**
```javascript
// Opción 1: Rol específico
const isSuperAdmin = hasRole('SuperAdmin');

// Opción 2: Lista de IDs
const superAdminIds = [5, 12, 23];
const isSuperAdmin = superAdminIds.includes(user?.id);

// Opción 3: Propiedad específica
const isSuperAdmin = user?.permissions?.analytics_monitor === true;
```

---

## 📈 **Beneficios de la Nueva Ubicación**

### **✅ Para el Superadmin:**
- **Acceso directo** desde cualquier página
- **Siempre visible** en el menú de usuario
- **No interfiere** con la navegación normal
- **Contexto claro** - herramienta administrativa

### **✅ Para Otros Usuarios:**
- **No ven opción** que no pueden usar
- **Interfaz limpia** sin elementos confusos
- **Mejor UX** - solo ven lo que necesitan

### **✅ Para el Sistema:**
- **Seguridad mejorada** - acceso ultra-restringido
- **Mantenimiento fácil** - cambio de ID centralizado
- **Escalabilidad** - fácil agregar más Superadmins

---

## 🚀 **Próximos Pasos**

### **1. Verificar Acceso:**
```bash
# 1. Login como usuario con id=5
# 2. Ir a cualquier proyecto
# 3. Click en avatar → "Monitor de Eventos"
# 4. Verificar acceso completo
```

### **2. Confirmar Restricción:**
```bash
# 1. Login como usuario con id≠5
# 2. Verificar que NO aparece "Monitor de Eventos"
# 3. Intentar acceso directo a /projects/123/admin
# 4. Confirmar mensaje de acceso denegado
```

### **3. Usar Monitor:**
```bash
# 1. Revisar discrepancias automáticamente detectadas
# 2. Exportar datos para análisis
# 3. Test manual de eventos problemáticos
# 4. Monitorear en tiempo real
```

---

## ✅ **Resumen de Cambios**

### **Archivos Modificados:**
- `ProjectLayout.jsx` - Agregado "Monitor de Eventos" al menú de usuario
- `AdminDashboard.jsx` - Verificación de Superadmin (id=5)

### **Nueva Funcionalidad:**
- **Acceso:** Avatar → "Monitor de Eventos"
- **Restricción:** Solo user.id === 5
- **Ubicación:** `/projects/:projectId/admin`

### **Seguridad:**
- ✅ Verificación en menú
- ✅ Verificación en página  
- ✅ Mensaje de error claro

**¡El Monitor de Eventos está ahora accesible solo para Superadmin desde el menú de usuario! 🚀**
