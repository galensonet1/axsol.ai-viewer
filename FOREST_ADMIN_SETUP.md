# ForestAdmin Setup - AXSOL.ai Viewer

## 🚀 Configuración de ForestAdmin

ForestAdmin está configurado para administrar usuarios, roles, permisos y proyectos del sistema AXSOL.ai Viewer.

### 📋 Prerrequisitos

1. **Cuenta en ForestAdmin**: Crear cuenta en [ForestAdmin](https://www.forestadmin.com/)
2. **Proyecto configurado**: Tener un proyecto en ForestAdmin
3. **Variables de entorno**: Configurar las credenciales

### 🔧 Variables de Entorno Requeridas

Agregar al archivo `.env` del backend:

```env
# ForestAdmin Configuration
FOREST_AUTH_SECRET=tu_forest_auth_secret_aqui
FOREST_ENV_SECRET=tu_forest_env_secret_aqui
```

### 🏗️ Estructura de Datos Administrada

#### 1. **Usuarios (users)**
- **Campos**: id, name, email, auth0_sub, created_at
- **Relaciones**: Muchos a muchos con roles
- **Campos calculados**:
  - `display_name`: Nombre completo con email
  - `roles_list`: Lista de roles asignados
- **Acciones**:
  - Asignar Rol
  - Toggle Estado

#### 2. **Proyectos (projects)**
- **Campos**: id, name, description, start_date, end_date, initial_location, etc.
- **Campos calculados**:
  - `project_status`: Estado calculado (Planificado, En Progreso, Completado)
  - `duration_days`: Duración en días
  - `location_display`: Coordenadas legibles
- **Acciones**:
  - Generar Reporte (Progreso, Financiero, Técnico, Completo)
  - Sincronizar Datos

#### 3. **Roles (roles)**
- **Campos**: id, name
- **Relaciones**: Muchos a muchos con usuarios
- **Campos calculados**:
  - `users_count`: Número de usuarios con este rol
  - `permissions_summary`: Descripción de permisos
- **Acciones**:
  - Clonar Rol

#### 4. **Asignaciones Usuario-Rol (user_roles)**
- **Campos**: user_id, role_id
- **Relaciones**: Pertenece a usuario y rol
- **Campos calculados**:
  - `assignment_info`: Información completa de la asignación

### 🎯 Funcionalidades Principales

#### **Gestión de Usuarios**
- Ver todos los usuarios registrados
- Asignar/remover roles
- Activar/desactivar usuarios
- Ver historial de actividad

#### **Gestión de Proyectos**
- CRUD completo de proyectos
- Generar reportes automáticos
- Sincronizar con APIs externas
- Monitorear estado y progreso

#### **Sistema de Roles y Permisos**
- Crear/editar roles personalizados
- Asignar permisos granulares
- Clonar configuraciones de roles
- Auditoría de asignaciones

### 🚀 Inicialización

El sistema se inicializa automáticamente cuando el servidor arranca:

```javascript
// En server.js
const startServer = async () => {
  await initializeForestAdmin();
  app.listen(port, () => {
    console.log(`Forest Admin disponible en: http://localhost:${port}/forest`);
  });
};
```

### 📱 Acceso a la Interfaz

Una vez configurado, ForestAdmin estará disponible en:
- **Desarrollo**: `http://localhost:3001/forest`
- **Producción**: `https://tu-dominio.com/forest`

### 🔐 Configuración de Seguridad

#### **Autenticación**
- Integrado con Auth0 para usuarios finales
- ForestAdmin maneja su propia autenticación para administradores
- Tokens seguros para comunicación con ForestAdmin

#### **Permisos**
- Roles predefinidos: admin, manager, viewer, guest
- Permisos granulares por colección
- Acciones personalizadas con validación

### 📊 Acciones Personalizadas Disponibles

#### **Para Usuarios**
- **Asignar Rol**: Asigna un rol específico al usuario
- **Toggle Estado**: Activa/desactiva el usuario

#### **Para Proyectos**
- **Generar Reporte**: Crea reportes en PDF/Excel/CSV
- **Sincronizar Datos**: Actualiza datos desde APIs externas

#### **Para Roles**
- **Clonar Rol**: Duplica un rol existente con nuevo nombre

### 🛠️ Desarrollo y Personalización

#### **Agregar Nuevas Colecciones**
1. Crear la tabla en PostgreSQL
2. Agregar al schema en `forest-admin.js`
3. Configurar en `forest-collections.js`

#### **Agregar Campos Calculados**
```javascript
collection.addField('campo_calculado', {
  columnType: 'String',
  dependencies: ['campo1', 'campo2'],
  getValues: (records) => records.map(record => {
    // Lógica de cálculo
    return resultado;
  }),
});
```

#### **Agregar Acciones Personalizadas**
```javascript
collection.addAction('Mi Acción', {
  scope: 'Single', // o 'Bulk'
  form: [
    {
      label: 'Parámetro',
      type: 'String',
      isRequired: true,
    },
  ],
  execute: async (context, resultBuilder) => {
    // Lógica de la acción
    return resultBuilder.success('Acción completada');
  },
});
```

### 🐛 Troubleshooting

#### **Error: Variables de entorno no configuradas**
- Verificar que `FOREST_AUTH_SECRET` y `FOREST_ENV_SECRET` estén en `.env`
- Reiniciar el servidor después de agregar las variables

#### **Error: No se puede conectar a la base de datos**
- Verificar `DATABASE_URL` o variables individuales de DB
- Confirmar que PostgreSQL esté corriendo

#### **Error: Colecciones no aparecen**
- Verificar que las tablas existan en la base de datos
- Confirmar que estén incluidas en el schema de `forest-admin.js`

### 📝 Logs y Monitoreo

El sistema incluye logging detallado:
```
[ForestAdmin] Inicializando Forest Admin Agent...
[ForestAdmin] Forest Admin Agent configurado correctamente
[ForestAdmin] Forest Admin disponible en /forest
```

### 🔄 Actualizaciones

Para actualizar ForestAdmin:
```bash
npm update @forestadmin/agent @forestadmin/datasource-sql
```

### 📚 Recursos Adicionales

- [Documentación ForestAdmin](https://docs.forestadmin.com/)
- [API Reference](https://docs.forestadmin.com/developer-guide-agents-nodejs/)
- [Ejemplos de Configuración](https://github.com/ForestAdmin/agent-nodejs)
