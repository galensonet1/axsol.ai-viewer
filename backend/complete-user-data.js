const pool = require('./db');

async function completeUserData() {
  try {
    console.log('🔧 Completando datos de usuarios y roles...');
    
    // Crear roles faltantes
    const missingRoles = [
      { name: 'operator', description: 'Operador con permisos limitados de edición' },
      { name: 'viewer', description: 'Usuario con permisos de solo lectura' }
    ];
    
    for (const role of missingRoles) {
      try {
        const result = await pool.query(
          'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING *',
          [role.name, role.description]
        );
        if (result.rows.length > 0) {
          console.log(`✅ Rol creado: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        }
      } catch (err) {
        console.log(`⚠️  Rol ${role.name} ya existe o error: ${err.message}`);
      }
    }
    
    // Crear usuarios faltantes
    const missingUsers = [
      { name: 'Juan Operador', email: 'juan.operador@axsol.ai', active: true },
      { name: 'Carlos Técnico', email: 'carlos.tecnico@axsol.ai', active: false }
    ];
    
    for (const user of missingUsers) {
      try {
        const auth0Sub = `auth0|${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const result = await pool.query(
          'INSERT INTO users (name, email, active, auth0_sub) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING *',
          [user.name, user.email, user.active, auth0Sub]
        );
        if (result.rows.length > 0) {
          console.log(`✅ Usuario creado: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        }
      } catch (err) {
        console.log(`⚠️  Usuario ${user.email} ya existe o error: ${err.message}`);
      }
    }
    
    // Obtener IDs actualizados
    const rolesResult = await pool.query('SELECT id, name FROM roles WHERE name IN (\'operator\', \'viewer\')');
    const usersResult = await pool.query('SELECT id, name FROM users WHERE name IN (\'Juan Operador\', \'Carlos Técnico\')');
    
    const roles = {};
    rolesResult.rows.forEach(row => roles[row.name] = row.id);
    
    const users = {};
    usersResult.rows.forEach(row => users[row.name] = row.id);
    
    // Crear asignaciones faltantes
    const assignments = [
      { user: 'Juan Operador', roles: ['operator', 'viewer'] },
      { user: 'Carlos Técnico', roles: ['operator'] }
    ];
    
    for (const assignment of assignments) {
      const userId = users[assignment.user];
      if (!userId) {
        console.log(`⚠️  Usuario ${assignment.user} no encontrado`);
        continue;
      }
      
      for (const roleName of assignment.roles) {
        const roleId = roles[roleName];
        if (!roleId) {
          console.log(`⚠️  Rol ${roleName} no encontrado`);
          continue;
        }
        
        try {
          await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING',
            [userId, roleId]
          );
          console.log(`✅ Asignación creada: ${assignment.user} → ${roleName}`);
        } catch (err) {
          console.log(`⚠️  Error asignando ${roleName} a ${assignment.user}: ${err.message}`);
        }
      }
    }
    
    // Mostrar resumen final
    const finalStats = await pool.query('SELECT COUNT(*) as total FROM user_roles');
    console.log(`\n📊 Total de asignaciones: ${finalStats.rows[0].total}`);
    
    // Mostrar todas las asignaciones
    const allAssignments = await pool.query(`
      SELECT u.name as user_name, r.name as role_name 
      FROM user_roles ur 
      JOIN users u ON ur.user_id = u.id 
      JOIN roles r ON ur.role_id = r.id 
      ORDER BY u.name, r.name
    `);
    
    console.log('\n🔗 Asignaciones actuales:');
    allAssignments.rows.forEach(row => {
      console.log(`   - ${row.user_name} → ${row.role_name}`);
    });
    
    console.log('\n🎉 Datos completados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

completeUserData();
