// Script para agregar columnas faltantes a la tabla projects
const pool = require('./db');

async function fixProjectsTable() {
  try {
    console.log('🔧 Agregando columnas faltantes a la tabla projects...');

    // Verificar si las columnas ya existen
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('created_at', 'updated_at')
    `;
    
    const existingColumns = await pool.query(checkQuery);
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    console.log('Columnas existentes:', existingColumnNames);

    // Agregar created_at si no existe
    if (!existingColumnNames.includes('created_at')) {
      console.log('➕ Agregando columna created_at...');
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna created_at agregada');
    } else {
      console.log('⚠️  Columna created_at ya existe');
    }

    // Agregar updated_at si no existe
    if (!existingColumnNames.includes('updated_at')) {
      console.log('➕ Agregando columna updated_at...');
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna updated_at agregada');
    } else {
      console.log('⚠️  Columna updated_at ya existe');
    }

    // Actualizar registros existentes que tengan NULL en estas columnas
    console.log('🔄 Actualizando registros existentes...');
    
    await pool.query(`
      UPDATE projects 
      SET 
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
      WHERE created_at IS NULL OR updated_at IS NULL
    `);

    // Crear trigger para actualizar updated_at automáticamente
    console.log('🔄 Creando trigger para updated_at...');
    
    // Crear función para el trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Crear el trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ Trigger creado para actualizar updated_at automáticamente');

    // Verificar la estructura final
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estructura final de la tabla projects:');
    finalCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    console.log('\n🎉 Tabla projects actualizada exitosamente!');
    console.log('🔗 Ahora puedes acceder al panel de administración en:');
    console.log('   http://localhost:3001/admin/admin.html');
    
  } catch (error) {
    console.error('❌ Error actualizando tabla:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixProjectsTable();
}

module.exports = { fixProjectsTable };
