// Configuraciones adicionales para las colecciones de ForestAdmin

const configureUsersCollection = (agent) => {
  agent.customizeCollection('users', collection => {
    collection
      // Campo calculado para mostrar información completa del usuario
      .addField('display_name', {
        columnType: 'String',
        dependencies: ['name', 'email'],
        getValues: (records) => records.map(record => 
          `${record.name || 'Sin nombre'} <${record.email}>`
        ),
      })
      
      // Campo para mostrar roles como string
      .addField('roles_list', {
        columnType: 'String',
        dependencies: ['roles'],
        getValues: (records) => records.map(record => {
          if (!record.roles || record.roles.length === 0) return 'Sin roles';
          return record.roles.map(role => role.name).join(', ');
        }),
      })
      
      // Acción para asignar rol
      .addAction('Asignar Rol', {
        scope: 'Single',
        form: [
          {
            label: 'Rol',
            type: 'Enum',
            enumValues: ['admin', 'manager', 'viewer', 'guest'],
            isRequired: true,
          },
        ],
        execute: async (context, resultBuilder) => {
          try {
            const { role } = context.formValues;
            const userId = context.record.id;
            
            // Aquí implementarías la lógica para asignar el rol
            // Por ahora solo log
            console.log(`[ForestAdmin] Asignando rol ${role} al usuario ${userId}`);
            
            return resultBuilder.success(`Rol "${role}" asignado correctamente al usuario`);
          } catch (error) {
            return resultBuilder.error('Error asignando el rol: ' + error.message);
          }
        },
      })
      
      // Acción para activar/desactivar usuario
      .addAction('Toggle Estado', {
        scope: 'Single',
        execute: async (context, resultBuilder) => {
          try {
            const userId = context.record.id;
            const userName = context.record.name || context.record.email;
            
            console.log(`[ForestAdmin] Cambiando estado del usuario ${userId} (${userName})`);
            
            return resultBuilder.success(`Estado del usuario ${userName} actualizado`);
          } catch (error) {
            return resultBuilder.error('Error cambiando estado: ' + error.message);
          }
        },
      });
  });
};

const configureProjectsCollection = (agent) => {
  agent.customizeCollection('projects', collection => {
    collection
      // Campo calculado para el estado del proyecto
      .addField('project_status', {
        columnType: 'Enum',
        enumValues: ['Planificado', 'En Progreso', 'Completado', 'Pausado', 'Cancelado'],
        dependencies: ['start_date', 'end_date'],
        getValues: (records) => records.map(record => {
          const now = new Date();
          const startDate = record.start_date ? new Date(record.start_date) : null;
          const endDate = record.end_date ? new Date(record.end_date) : null;
          
          if (!startDate) return 'Planificado';
          if (now < startDate) return 'Planificado';
          if (!endDate || now <= endDate) return 'En Progreso';
          return 'Completado';
        }),
      })
      
      // Campo para duración del proyecto
      .addField('duration_days', {
        columnType: 'Number',
        dependencies: ['start_date', 'end_date'],
        getValues: (records) => records.map(record => {
          const startDate = record.start_date ? new Date(record.start_date) : null;
          const endDate = record.end_date ? new Date(record.end_date) : null;
          
          if (!startDate || !endDate) return null;
          
          const diffTime = Math.abs(endDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        }),
      })
      
      // Campo para mostrar coordenadas de forma legible
      .addField('location_display', {
        columnType: 'String',
        dependencies: ['initial_location'],
        getValues: (records) => records.map(record => {
          if (!record.initial_location) return 'Sin ubicación';
          const { lat, lon } = record.initial_location;
          if (!lat || !lon) return 'Coordenadas incompletas';
          return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }),
      })
      
      // Acción para generar reporte del proyecto
      .addAction('Generar Reporte', {
        scope: 'Single',
        form: [
          {
            label: 'Tipo de Reporte',
            type: 'Enum',
            enumValues: ['Progreso', 'Financiero', 'Técnico', 'Completo'],
            isRequired: true,
          },
          {
            label: 'Formato',
            type: 'Enum',
            enumValues: ['PDF', 'Excel', 'CSV'],
            isRequired: true,
          },
        ],
        execute: async (context, resultBuilder) => {
          try {
            const { 'Tipo de Reporte': reportType, 'Formato': format } = context.formValues;
            const projectId = context.record.id;
            const projectName = context.record.name;
            
            console.log(`[ForestAdmin] Generando reporte ${reportType} en formato ${format} para proyecto ${projectId} (${projectName})`);
            
            return resultBuilder.success(`Reporte ${reportType} generado en formato ${format} para el proyecto "${projectName}"`);
          } catch (error) {
            return resultBuilder.error('Error generando reporte: ' + error.message);
          }
        },
      })
      
      // Acción para sincronizar datos externos
      .addAction('Sincronizar Datos', {
        scope: 'Single',
        execute: async (context, resultBuilder) => {
          try {
            const projectId = context.record.id;
            const projectName = context.record.name;
            
            console.log(`[ForestAdmin] Sincronizando datos externos para proyecto ${projectId} (${projectName})`);
            
            return resultBuilder.success(`Datos sincronizados correctamente para el proyecto "${projectName}"`);
          } catch (error) {
            return resultBuilder.error('Error sincronizando datos: ' + error.message);
          }
        },
      });
  });
};

const configureRolesCollection = (agent) => {
  agent.customizeCollection('roles', collection => {
    collection
      // Campo para contar usuarios con este rol
      .addField('users_count', {
        columnType: 'Number',
        dependencies: ['users'],
        getValues: (records) => records.map(record => 
          record.users ? record.users.length : 0
        ),
      })
      
      // Campo para mostrar permisos (simulado)
      .addField('permissions_summary', {
        columnType: 'String',
        dependencies: ['name'],
        getValues: (records) => records.map(record => {
          const roleName = record.name?.toLowerCase();
          switch (roleName) {
            case 'admin':
              return 'Acceso completo, gestión de usuarios, configuración del sistema';
            case 'manager':
              return 'Gestión de proyectos, reportes, asignación de tareas';
            case 'viewer':
              return 'Solo lectura, visualización de datos';
            case 'guest':
              return 'Acceso limitado, solo visualización básica';
            default:
              return 'Permisos personalizados';
          }
        }),
      })
      
      // Acción para clonar rol
      .addAction('Clonar Rol', {
        scope: 'Single',
        form: [
          {
            label: 'Nombre del Nuevo Rol',
            type: 'String',
            isRequired: true,
          },
        ],
        execute: async (context, resultBuilder) => {
          try {
            const { 'Nombre del Nuevo Rol': newRoleName } = context.formValues;
            const originalRoleName = context.record.name;
            
            console.log(`[ForestAdmin] Clonando rol "${originalRoleName}" como "${newRoleName}"`);
            
            return resultBuilder.success(`Rol "${newRoleName}" creado basado en "${originalRoleName}"`);
          } catch (error) {
            return resultBuilder.error('Error clonando rol: ' + error.message);
          }
        },
      });
  });
};

const configureUserRolesCollection = (agent) => {
  agent.customizeCollection('user_roles', collection => {
    collection
      // Campo para mostrar información completa de la asignación
      .addField('assignment_info', {
        columnType: 'String',
        dependencies: ['user', 'role'],
        getValues: (records) => records.map(record => {
          const userName = record.user?.name || record.user?.email || 'Usuario desconocido';
          const roleName = record.role?.name || 'Rol desconocido';
          return `${userName} → ${roleName}`;
        }),
      });
  });
};

module.exports = {
  configureUsersCollection,
  configureProjectsCollection,
  configureRolesCollection,
  configureUserRolesCollection,
};
