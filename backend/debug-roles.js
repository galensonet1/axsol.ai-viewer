// Script para debuggear los roles en la base de datos
const pool = require('./db');

async function debugRoles() {
  try {
    console.log('🔍 Debuggeando roles en la base de datos...\n');

    // 1. Mostrar todos los roles existentes
    console.log('📋 ROLES EXISTENTES:');
    const rolesQuery = await pool.query('SELECT * FROM roles ORDER BY id');
    console.table(rolesQuery.rows);

    // 2. Mostrar todos los usuarios y sus roles
    console.log('\n👥 USUARIOS Y SUS ROLES:');
    const usersRolesQuery = await pool.query(`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        u.auth0_sub,
        r.id as role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u.id, r.id
    `);
    console.table(usersRolesQuery.rows);

    // 3. Buscar tu usuario específico
    console.log('\n🔍 BUSCANDO TU USUARIO (cristian.h.sanz@gmail.com):');
    const yourUserQuery = await pool.query(`
      SELECT 
        u.*,
        ARRAY_AGG(r.name) as roles,
        ARRAY_AGG(r.id) as role_ids
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'cristian.h.sanz@gmail.com'
      GROUP BY u.id
    `);
    
    if (yourUserQuery.rows.length > 0) {
      console.log('✅ Usuario encontrado:');
      console.table(yourUserQuery.rows);
    } else {
      console.log('❌ Usuario no encontrado en la BD');
      
      // Buscar por auth0_sub similar
      const auth0Query = await pool.query(`
        SELECT * FROM users 
        WHERE auth0_sub LIKE '%108240043112332215984%'
        OR email LIKE '%cristian%'
      `);
      
      if (auth0Query.rows.length > 0) {
        console.log('🔍 Usuarios similares encontrados:');
        console.table(auth0Query.rows);
      }
    }

    // 4. Verificar si existe el rol Superadmin
    console.log('\n🛡️  VERIFICANDO ROL SUPERADMIN:');
    const superadminQuery = await pool.query(`
      SELECT * FROM roles WHERE name ILIKE '%superadmin%' OR name ILIKE '%super%'
    `);
    
    if (superadminQuery.rows.length > 0) {
      console.log('✅ Rol Superadmin encontrado:');
      console.table(superadminQuery.rows);
    } else {
      console.log('❌ Rol Superadmin NO encontrado');
      console.log('💡 Necesitas crear el rol Superadmin');
    }

    // 5. Mostrar resumen de la estructura
    console.log('\n📊 RESUMEN:');
    const summary = await pool.query(`
      SELECT 
        'Roles totales' as metric,
        COUNT(*) as count
      FROM roles
      UNION ALL
      SELECT 
        'Usuarios totales' as metric,
        COUNT(*) as count
      FROM users
      UNION ALL
      SELECT 
        'Asignaciones de roles' as metric,
        COUNT(*) as count
      FROM user_roles
    `);
    console.table(summary.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugRoles();
}

module.exports = { debugRoles };
