// Script para actualizar el esquema de usuarios y roles
const pool = require('./db');

async function updateUserRoleSchema() {
  try {
    console.log('🔧 Actualizando esquema de usuarios y roles...');

    // Verificar columnas existentes en la tabla users
    const userColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const existingUserColumns = userColumns.rows.map(row => row.column_name);
    console.log('Columnas existentes en users:', existingUserColumns);

    // Agregar columnas faltantes a users
    if (!existingUserColumns.includes('active')) {
      console.log('➕ Agregando columna active a users...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN active BOOLEAN DEFAULT true
      `);
      console.log('✅ Columna active agregada a users');
    }

    if (!existingUserColumns.includes('created_at')) {
      console.log('➕ Agregando columna created_at a users...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna created_at agregada a users');
    }

    if (!existingUserColumns.includes('updated_at')) {
      console.log('➕ Agregando columna updated_at a users...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna updated_at agregada a users');
    }

    // Verificar columnas existentes en la tabla roles
    const roleColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'roles'
    `);
    
    const existingRoleColumns = roleColumns.rows.map(row => row.column_name);
    console.log('Columnas existentes en roles:', existingRoleColumns);

    // Agregar columnas faltantes a roles
    if (!existingRoleColumns.includes('description')) {
      console.log('➕ Agregando columna description a roles...');
      await pool.query(`
        ALTER TABLE roles 
        ADD COLUMN description TEXT
      `);
      console.log('✅ Columna description agregada a roles');
    }

    if (!existingRoleColumns.includes('created_at')) {
      console.log('➕ Agregando columna created_at a roles...');
      await pool.query(`
        ALTER TABLE roles 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna created_at agregada a roles');
    }

    if (!existingRoleColumns.includes('updated_at')) {
      console.log('➕ Agregando columna updated_at a roles...');
      await pool.query(`
        ALTER TABLE roles 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna updated_at agregada a roles');
    }

    // Verificar tabla user_roles
    const userRolesExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_roles'
      )
    `);

    if (!userRolesExists.rows[0].exists) {
      console.log('➕ Creando tabla user_roles...');
      await pool.query(`
        CREATE TABLE user_roles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, role_id)
        )
      `);
      console.log('✅ Tabla user_roles creada');
    } else {
      // Verificar si tiene created_at
      const userRoleColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_roles'
      `);
      
      const existingUserRoleColumns = userRoleColumns.rows.map(row => row.column_name);
      
      if (!existingUserRoleColumns.includes('created_at')) {
        console.log('➕ Agregando columna created_at a user_roles...');
        await pool.query(`
          ALTER TABLE user_roles 
          ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Columna created_at agregada a user_roles');
      }
    }

    // Crear triggers para updated_at
    console.log('🔄 Creando triggers para updated_at...');
    
    // Función para el trigger (si no existe)
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Trigger para users
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    // Trigger para roles
    await pool.query(`
      DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
      CREATE TRIGGER update_roles_updated_at
        BEFORE UPDATE ON roles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ Triggers creados');

    // Actualizar registros existentes
    console.log('🔄 Actualizando registros existentes...');
    
    await pool.query(`
      UPDATE users 
      SET 
        active = COALESCE(active, true),
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
      WHERE active IS NULL OR created_at IS NULL OR updated_at IS NULL
    `);

    await pool.query(`
      UPDATE roles 
      SET 
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
      WHERE created_at IS NULL OR updated_at IS NULL
    `);

    // Verificar estructura final
    console.log('\n📋 Estructura final de las tablas:');
    
    const finalUserColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('\n👥 Tabla users:');
    finalUserColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    const finalRoleColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'roles' 
      ORDER BY ordinal_position
    `);

    console.log('\n🛡️  Tabla roles:');
    finalRoleColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    const finalUserRoleColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      ORDER BY ordinal_position
    `);

    console.log('\n🔗 Tabla user_roles:');
    finalUserRoleColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🎉 Esquema actualizado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error actualizando esquema:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  updateUserRoleSchema();
}

module.exports = { updateUserRoleSchema };
