# 🐛 Debug: Menú de Usuario - Solo muestra "Cerrar Sesión" y "Consola Admin"

**Problema:** El menú de usuario no muestra "Monitor de Eventos" para el Superadmin

---

## 🔍 **Debugging Implementado**

### **1. Logs en UserMenu.jsx**
```javascript
// Debug para entender por qué no aparece Monitor de Eventos
console.log('[UserMenu] Debug info:', {
  user,
  userId: user?.id,
  isSuperAdmin,
  projectId,
  hasRole56: hasRole([5, 6]),
  shouldShowMonitor: isSuperAdmin && projectId
});
```

### **2. Logs en AppWrapper.jsx**
```javascript
console.log('[AppWrapper] User data from /api/user/me:', userData);
console.log('[AppWrapper] User ID:', userData?.id, 'Type:', typeof userData?.id);
console.log('[AppWrapper] User roles:', userData?.roles);
console.log('[AppWrapper] User roleIds:', userData?.roleIds);
```

### **3. Logs Detallados en UserContext.jsx**
```javascript
console.log('[UserContext] Checking role:', role, 'User ID:', user?.id);
console.log('[UserContext] User roles:', user?.roles);
console.log('[UserContext] User roleIds:', user?.roleIds);
console.log('[UserContext] Full user object:', user);
console.log('[UserContext] roleIds includes check details:', role.map(roleId => ({
  roleId,
  included: user?.roleIds?.includes(roleId),
  userRoleIds: user?.roleIds
})));
```

### **4. Componente UserDebugInfo.jsx**
- **Ubicación:** Esquina inferior derecha
- **Activación:** Automático en desarrollo, `?debug=true` en producción
- **Información mostrada:**
  - Datos completos del usuario
  - ID y tipo del ID
  - Roles y roleIds
  - Verificaciones de permisos
  - Estado del menú

---

## 🎯 **Qué Verificar**

### **En la Consola del Navegador:**

1. **Datos del Usuario:**
   ```
   [AppWrapper] User data from /api/user/me: {id: ?, roles: ?, roleIds: ?}
   [AppWrapper] User ID: ? Type: ?
   ```

2. **Verificación de Roles:**
   ```
   [UserContext] Checking role: [5, 6] User ID: ?
   [UserContext] roleIds includes check details: [{roleId: 5, included: ?}, {roleId: 6, included: ?}]
   ```

3. **Estado del Menú:**
   ```
   [UserMenu] Debug info: {
     userId: ?,
     isSuperAdmin: ?,
     projectId: ?,
     hasRole56: ?,
     shouldShowMonitor: ?
   }
   ```

### **En el Componente Debug:**
- Verificar que `userId` sea exactamente `5`
- Verificar que `projectId` esté presente
- Verificar que `isSuperAdmin` sea `true`
- Verificar que `shouldShowMonitor` sea `true`

---

## 🔧 **Posibles Problemas y Soluciones**

### **1. ID del Usuario No es 5**
```javascript
// Si userData.id !== 5
// Verificar en base de datos el ID real del Superadmin
```

### **2. ID es String en lugar de Number**
```javascript
// Si typeof userData.id === 'string'
const isSuperAdmin = user?.id === 5 || user?.id === '5';
```

### **3. roleIds No Incluye 5 o 6**
```javascript
// Si user.roleIds no contiene [5] o [6]
// Verificar estructura de roles en base de datos
```

### **4. projectId No Está Presente**
```javascript
// Si projectId es undefined en contexto de proyecto
// Verificar que estés en una URL como /projects/1/viewer
```

### **5. Estructura de Datos Diferente**
```javascript
// Si la estructura del usuario es diferente a la esperada
// Verificar response de /api/user/me en Network tab
```

---

## 📋 **Checklist de Verificación**

### **✅ Datos del Usuario:**
- [ ] `user.id` existe y es correcto
- [ ] `user.roles` contiene roles esperados
- [ ] `user.roleIds` contiene IDs esperados
- [ ] Tipo de datos es consistente (number vs string)

### **✅ Contexto de la Aplicación:**
- [ ] Estás en una URL de proyecto (`/projects/1/viewer`)
- [ ] `projectId` se extrae correctamente de la URL
- [ ] UserContext tiene los datos del usuario

### **✅ Lógica del Menú:**
- [ ] `hasRole([5, 6])` retorna `true`
- [ ] `isSuperAdmin` es `true`
- [ ] `shouldShowMonitor` es `true`

### **✅ Configuración de API:**
- [ ] `/api/user/me` retorna datos correctos
- [ ] Token de autenticación es válido
- [ ] Base URL de API es correcta

---

## 🚀 **Próximos Pasos**

1. **Abrir la aplicación en producción**
2. **Agregar `?debug=true` a la URL** para ver el componente debug
3. **Revisar logs en consola** para identificar el problema específico
4. **Comparar datos esperados vs reales**
5. **Aplicar la corrección correspondiente**

---

## 📝 **Formato de Reporte**

Cuando encuentres el problema, reporta:

```
🐛 PROBLEMA ENCONTRADO:
- Usuario ID: [valor real]
- Tipo de ID: [number/string]
- Roles: [array real]
- RoleIds: [array real]
- ProjectId: [valor real]
- hasRole([5,6]): [true/false]
- isSuperAdmin: [true/false]

🔧 SOLUCIÓN APLICADA:
[Descripción del cambio necesario]
```

---

## ⚠️ **Notas Importantes**

- **El debugging está activo** - verás logs detallados en consola
- **UserDebugInfo aparece** en esquina inferior derecha
- **Solo afecta desarrollo** - no impacta usuarios finales
- **Remover después** - limpiar logs cuando se resuelva

**¡Con este debugging deberíamos identificar exactamente por qué no aparece "Monitor de Eventos"! 🕵️‍♂️**
