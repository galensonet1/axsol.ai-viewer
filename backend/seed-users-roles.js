// Script para crear usuarios y roles de prueba
const pool = require('./db');

async function seedUsersAndRoles() {
  try {
    console.log('🌱 Creando usuarios y roles de prueba...');

    // Crear roles
    const roles = [
      {
        name: 'admin',
        description: 'Administrador del sistema con acceso completo'
      },
      {
        name: 'manager',
        description: 'Gerente de proyectos con permisos de gestión'
      },
      {
        name: 'viewer',
        description: 'Usuario con permisos de solo lectura'
      },
      {
        name: 'operator',
        description: 'Operador con permisos limitados de edición'
      }
    ];

    console.log('📋 Creando roles...');
    const createdRoles = [];
    
    for (const role of roles) {
      try {
        const query = `
          INSERT INTO roles (name, description) 
          VALUES ($1, $2) 
          ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const result = await pool.query(query, [role.name, role.description]);
        createdRoles.push(result.rows[0]);
        console.log(`✅ Rol creado/actualizado: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } catch (error) {
        console.log(`⚠️  Error con rol ${role.name}:`, error.message);
      }
    }

    // Crear usuarios
    const users = [
      {
        name: 'Cristian Administrador',
        email: 'admin@axsol.ai',
        active: true,
        roles: ['admin']
      },
      {
        name: 'María Gerente',
        email: 'maria.gerente@axsol.ai',
        active: true,
        roles: ['manager']
      },
      {
        name: 'Juan Operador',
        email: 'juan.operador@axsol.ai',
        active: true,
        roles: ['operator', 'viewer']
      },
      {
        name: 'Ana Consultora',
        email: 'ana.consultora@axsol.ai',
        active: true,
        roles: ['viewer']
      },
      {
        name: 'Carlos Técnico',
        email: 'carlos.tecnico@axsol.ai',
        active: false,
        roles: ['operator']
      }
    ];

    console.log('\n👥 Creando usuarios...');
    const createdUsers = [];

    for (const user of users) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
        
        let userId;
        if (existingUser.rows.length > 0) {
          // Actualizar usuario existente
          const updateQuery = `
            UPDATE users 
            SET name = $1, active = $2, updated_at = CURRENT_TIMESTAMP
            WHERE email = $3
            RETURNING *
          `;
          const result = await pool.query(updateQuery, [user.name, user.active, user.email]);
          userId = result.rows[0].id;
          console.log(`🔄 Usuario actualizado: ${result.rows[0].name} (${result.rows[0].email})`);
        } else {
          // Crear nuevo usuario
          const insertQuery = `
            INSERT INTO users (name, email, active, auth0_sub) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
          `;
          const auth0Sub = `auth0|${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const result = await pool.query(insertQuery, [user.name, user.email, user.active, auth0Sub]);
          userId = result.rows[0].id;
          console.log(`✅ Usuario creado: ${result.rows[0].name} (${result.rows[0].email})`);
        }

        createdUsers.push({ ...user, id: userId });

        // Limpiar roles existentes del usuario
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

        // Asignar roles al usuario
        for (const roleName of user.roles) {
          const role = createdRoles.find(r => r.name === roleName);
          if (role) {
            await pool.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
              [userId, role.id]
            );
            console.log(`   🔗 Rol asignado: ${roleName}`);
          }
        }

      } catch (error) {
        console.log(`⚠️  Error con usuario ${user.email}:`, error.message);
      }
    }

    // Mostrar resumen
    console.log('\n📊 Resumen de datos creados:');
    
    const rolesCount = await pool.query('SELECT COUNT(*) as count FROM roles');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const assignmentsCount = await pool.query('SELECT COUNT(*) as count FROM user_roles');
    
    console.log(`   📋 Roles: ${rolesCount.rows[0].count}`);
    console.log(`   👥 Usuarios: ${usersCount.rows[0].count}`);
    console.log(`   🔗 Asignaciones: ${assignmentsCount.rows[0].count}`);

    // Mostrar estructura de roles y usuarios
    console.log('\n🏗️  Estructura creada:');
    
    const rolesSummary = await pool.query(`
      SELECT 
        r.name as role_name,
        r.description,
        COUNT(ur.user_id) as users_count,
        STRING_AGG(u.name, ', ') as users
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `);

    rolesSummary.rows.forEach(role => {
      console.log(`   🛡️  ${role.role_name}: ${role.users_count} usuarios`);
      if (role.users) {
        console.log(`      👤 ${role.users}`);
      }
    });

    console.log('\n🎉 Usuarios y roles de prueba creados exitosamente!');
    console.log('\n🔗 Accede al panel de administración en:');
    console.log('   http://localhost:3001/admin/admin.html');
    console.log('\n📋 Credenciales de prueba:');
    console.log('   👑 Admin: admin@axsol.ai');
    console.log('   👔 Manager: maria.gerente@axsol.ai');
    console.log('   👁️  Viewer: ana.consultora@axsol.ai');
    
  } catch (error) {
    console.error('❌ Error creando usuarios y roles:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedUsersAndRoles();
}

module.exports = { seedUsersAndRoles };
