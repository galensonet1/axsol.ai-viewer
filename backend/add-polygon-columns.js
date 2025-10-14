// Script para agregar columnas de polígonos a la tabla projects
const pool = require('./db');

async function addPolygonColumns() {
  try {
    console.log('🔧 Agregando columnas de polígonos a la tabla projects...');

    // Verificar si las columnas ya existen
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('project_polygon', 'layout_polygon')
    `;
    
    const existingColumns = await pool.query(checkQuery);
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    
    console.log('Columnas de polígonos existentes:', existingColumnNames);

    // Agregar project_polygon si no existe
    if (!existingColumnNames.includes('project_polygon')) {
      console.log('➕ Agregando columna project_polygon...');
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN project_polygon JSONB
      `);
      console.log('✅ Columna project_polygon agregada');
    } else {
      console.log('⚠️  Columna project_polygon ya existe');
    }

    // Agregar layout_polygon si no existe
    if (!existingColumnNames.includes('layout_polygon')) {
      console.log('➕ Agregando columna layout_polygon...');
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN layout_polygon JSONB
      `);
      console.log('✅ Columna layout_polygon agregada');
    } else {
      console.log('⚠️  Columna layout_polygon ya existe');
    }

    // Verificar la estructura final
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name LIKE '%polygon%'
      ORDER BY column_name
    `);

    console.log('\n📋 Columnas de polígonos en la tabla projects:');
    finalCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🎉 Columnas de polígonos agregadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error agregando columnas:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addPolygonColumns();
}

module.exports = { addPolygonColumns };
