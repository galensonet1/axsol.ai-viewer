// Script para corregir los roles en la base de datos
const pool = require('./db');

async function fixRoles() {
  try {
    console.log('🔧 Corrigiendo roles en la base de datos...\n');

    // 1. Crear/actualizar roles necesarios
    console.log('📋 CREANDO/ACTUALIZANDO ROLES:');
    
    const requiredRoles = [
      { id: 5, name: 'Admin', description: 'Administrador del sistema con acceso completo' },
      { id: 6, name: 'Superadmin', description: 'Super administrador con acceso total al sistema' },
      { name: 'manager', description: 'Gerente de proyectos con permisos de gestión' },
      { name: 'viewer', description: 'Usuario con permisos de solo lectura' },
      { name: 'operator', description: 'Operador con permisos limitados de edición' }
    ];

    for (const role of requiredRoles) {
      try {
        let query, params;
        
        if (role.id) {
          // Para Admin y Superadmin, usar IDs específicos
          query = `
            INSERT INTO roles (id, name, description) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (id) DO UPDATE SET 
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `;
          params = [role.id, role.name, role.description];
        } else {
          // Para otros roles, dejar que PostgreSQL asigne el ID
          query = `
            INSERT INTO roles (name, description) 
            VALUES ($1, $2) 
            ON CONFLICT (name) DO UPDATE SET 
              description = EXCLUDED.description,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `;
          params = [role.name, role.description];
        }
        
        const result = await pool.query(query, params);
        console.log(`✅ Rol ${role.name}: ID=${result.rows[0].id}`);
      } catch (error) {
        console.log(`⚠️  Error con rol ${role.name}:`, error.message);
      }
    }

    // 2. Verificar tu usuario
    console.log('\n👤 VERIFICANDO TU USUARIO:');
    const userQuery = await pool.query(`
      SELECT * FROM users 
      WHERE email = 'cristian.h.sanz@gmail.com' 
      OR auth0_sub LIKE '%108240043112332215984%'
    `);

    let userId = null;
    if (userQuery.rows.length > 0) {
      userId = userQuery.rows[0].id;
      console.log(`✅ Usuario encontrado: ID=${userId}, Email=${userQuery.rows[0].email}`);
    } else {
      console.log('❌ Usuario no encontrado. Creando usuario...');
      
      // Crear usuario si no existe
      const createUserQuery = `
        INSERT INTO users (auth0_sub, email, name, active) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
      `;
      const newUser = await pool.query(createUserQuery, [
        'google-oauth2|108240043112332215984',
        'cristian.h.sanz@gmail.com',
        'Cristian Sanz',
        true
      ]);
      userId = newUser.rows[0].id;
      console.log(`✅ Usuario creado: ID=${userId}`);
    }

    // 3. Asignar rol Superadmin a tu usuario
    console.log('\n🛡️  ASIGNANDO ROL SUPERADMIN:');
    
    // Primero, limpiar roles existentes
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    console.log('🧹 Roles anteriores limpiados');
    
    // Obtener ID del rol Superadmin
    const superadminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['Superadmin']);
    
    if (superadminRole.rows.length > 0) {
      const superadminRoleId = superadminRole.rows[0].id;
      
      // Asignar rol Superadmin
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, superadminRoleId]
      );
      console.log(`✅ Rol Superadmin (ID=${superadminRoleId}) asignado al usuario`);
    } else {
      console.log('❌ Error: Rol Superadmin no encontrado después de crearlo');
    }

    // 4. Verificar resultado final
    console.log('\n🔍 VERIFICACIÓN FINAL:');
    const finalCheck = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        ARRAY_AGG(r.name) as roles,
        ARRAY_AGG(r.id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.email, u.name
    `, [userId]);

    if (finalCheck.rows.length > 0) {
      console.log('✅ Estado final del usuario:');
      console.table(finalCheck.rows);
      
      const userData = finalCheck.rows[0];
      console.log('\n📋 Datos que debería devolver /api/user/me:');
      console.log(JSON.stringify({
        id: userData.user_id,
        email: userData.email,
        name: userData.name,
        roles: userData.roles.filter(r => r !== null),
        roleIds: userData.role_ids.filter(r => r !== null)
      }, null, 2));
    }

    // 5. Mostrar todos los roles finales
    console.log('\n📋 ROLES FINALES EN LA BD:');
    const allRoles = await pool.query('SELECT * FROM roles ORDER BY id');
    console.table(allRoles.rows);

    console.log('\n🎉 Corrección de roles completada!');
    console.log('💡 Ahora reinicia el servidor backend y prueba el frontend');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixRoles();
}

module.exports = { fixRoles };
