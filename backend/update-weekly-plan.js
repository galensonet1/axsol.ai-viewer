const pool = require('./db');

async function updateWeeklyPlan() {
  try {
    console.log('🔄 Actualizando weekly_construction_plan para proyecto 1...');
    
    // Verificar el estado actual
    const currentResult = await pool.query('SELECT id, name, weekly_construction_plan FROM projects WHERE id = 1');
    if (currentResult.rows.length === 0) {
      console.log('❌ Proyecto 1 no encontrado');
      return;
    }
    
    const project = currentResult.rows[0];
    console.log('📋 Estado actual:', {
      id: project.id,
      name: project.name,
      weekly_construction_plan: project.weekly_construction_plan
    });
    
    // Actualizar con una URL de prueba
    const testPlanUrl = '/data/weekly_construction_plan.czml';
    
    await pool.query(
      'UPDATE projects SET weekly_construction_plan = $1 WHERE id = $2',
      [testPlanUrl, 1]
    );
    
    console.log('✅ weekly_construction_plan actualizado a:', testPlanUrl);
    
    // Verificar la actualización
    const updatedResult = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = 1');
    console.log('🔍 Verificación:', updatedResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateWeeklyPlan();
