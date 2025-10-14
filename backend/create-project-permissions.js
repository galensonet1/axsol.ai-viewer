// Script para crear tabla de permisos por proyecto
const pool = require('./db');

async function createProjectPermissionsTable() {
  try {
    console.log('🔧 Creando tabla de permisos por proyecto...');

    // Crear tabla project_permissions
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS project_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        permission_level VARCHAR(20) NOT NULL DEFAULT 'viewer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      )
    `;

    await pool.query(createTableQuery);
    console.log('✅ Tabla project_permissions creada');

    // Crear índices para mejor performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_project_permissions_user_id ON project_permissions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_permissions_project_id ON project_permissions(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_project_permissions_level ON project_permissions(permission_level)'
    ];

    for (const indexQuery of createIndexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ Índices creados');

    // Crear trigger para updated_at
    const triggerQuery = `
      DROP TRIGGER IF EXISTS update_project_permissions_updated_at ON project_permissions;
      CREATE TRIGGER update_project_permissions_updated_at
        BEFORE UPDATE ON project_permissions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await pool.query(triggerQuery);
    console.log('✅ Trigger para updated_at creado');

    // Crear algunos permisos de ejemplo
    console.log('\n📋 Creando permisos de ejemplo...');

    // Obtener proyectos y usuarios existentes
    const projectsResult = await pool.query('SELECT id, name FROM projects ORDER BY id LIMIT 2');
    const usersResult = await pool.query('SELECT id, name FROM users ORDER BY id LIMIT 5');

    if (projectsResult.rows.length > 0 && usersResult.rows.length > 0) {
      const projects = projectsResult.rows;
      const users = usersResult.rows;

      // Permisos de ejemplo
      const samplePermissions = [
        // Proyecto 1 - Acceso completo para admin
        { user_id: users[0].id, project_id: projects[0].id, permission_level: 'admin' },
        // Proyecto 1 - Editor para segundo usuario
        { user_id: users[1]?.id, project_id: projects[0].id, permission_level: 'editor' },
        // Proyecto 1 - Viewer para tercer usuario
        { user_id: users[2]?.id, project_id: projects[0].id, permission_level: 'viewer' },
      ];

      // Si hay segundo proyecto
      if (projects[1]) {
        samplePermissions.push(
          { user_id: users[0].id, project_id: projects[1].id, permission_level: 'admin' },
          { user_id: users[3]?.id, project_id: projects[1].id, permission_level: 'editor' }
        );
      }

      for (const perm of samplePermissions) {
        if (perm.user_id && perm.project_id) {
          try {
            await pool.query(
              'INSERT INTO project_permissions (user_id, project_id, permission_level) VALUES ($1, $2, $3) ON CONFLICT (user_id, project_id) DO NOTHING',
              [perm.user_id, perm.project_id, perm.permission_level]
            );
            
            const user = users.find(u => u.id === perm.user_id);
            const project = projects.find(p => p.id === perm.project_id);
            console.log(`✅ Permiso creado: ${user?.name} → ${project?.name} (${perm.permission_level})`);
          } catch (err) {
            console.log(`⚠️  Error creando permiso: ${err.message}`);
          }
        }
      }
    }

    // Mostrar estructura de la tabla
    console.log('\n📋 Estructura de la tabla project_permissions:');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'project_permissions' 
      ORDER BY ordinal_position
    `);

    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Mostrar permisos creados
    const permissionsCount = await pool.query('SELECT COUNT(*) as total FROM project_permissions');
    console.log(`\n📊 Total de permisos por proyecto: ${permissionsCount.rows[0].total}`);

    if (permissionsCount.rows[0].total > 0) {
      const allPermissions = await pool.query(`
        SELECT 
          pp.id,
          u.name as user_name,
          p.name as project_name,
          pp.permission_level,
          pp.created_at
        FROM project_permissions pp
        JOIN users u ON pp.user_id = u.id
        JOIN projects p ON pp.project_id = p.id
        ORDER BY p.name, u.name
      `);

      console.log('\n🔗 Permisos por proyecto:');
      allPermissions.rows.forEach(perm => {
        console.log(`   - ${perm.user_name} → ${perm.project_name} (${perm.permission_level})`);
      });
    }

    console.log('\n🎉 Tabla de permisos por proyecto creada exitosamente!');
    console.log('\n📝 Niveles de permisos disponibles:');
    console.log('   - admin: Acceso completo al proyecto');
    console.log('   - editor: Puede editar y ver el proyecto');
    console.log('   - viewer: Solo puede ver el proyecto');

  } catch (error) {
    console.error('❌ Error creando tabla de permisos:', error.message);
  }

  process.exit(0);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createProjectPermissionsTable();
}

module.exports = { createProjectPermissionsTable };
