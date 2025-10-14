// Script de diagnóstico para ForestAdmin
require('dotenv').config();

console.log('🔍 Diagnóstico de ForestAdmin\n');

// 1. Verificar variables de entorno
console.log('1. Variables de entorno:');
console.log('   FOREST_AUTH_SECRET:', process.env.FOREST_AUTH_SECRET ? '✅ Presente' : '❌ Faltante');
console.log('   FOREST_ENV_SECRET:', process.env.FOREST_ENV_SECRET ? '✅ Presente' : '❌ Faltante');

if (process.env.FOREST_AUTH_SECRET) {
  console.log('   AUTH_SECRET longitud:', process.env.FOREST_AUTH_SECRET.length);
  console.log('   AUTH_SECRET primeros 8 chars:', process.env.FOREST_AUTH_SECRET.substring(0, 8) + '...');
}

if (process.env.FOREST_ENV_SECRET) {
  console.log('   ENV_SECRET longitud:', process.env.FOREST_ENV_SECRET.length);
  console.log('   ENV_SECRET primeros 8 chars:', process.env.FOREST_ENV_SECRET.substring(0, 8) + '...');
}

// 2. Verificar formato de credenciales
console.log('\n2. Formato de credenciales:');
if (process.env.FOREST_AUTH_SECRET) {
  const authSecretValid = /^[a-f0-9]{48}$/.test(process.env.FOREST_AUTH_SECRET);
  console.log('   AUTH_SECRET formato válido:', authSecretValid ? '✅' : '❌');
}

if (process.env.FOREST_ENV_SECRET) {
  const envSecretValid = /^[a-f0-9]{64}$/.test(process.env.FOREST_ENV_SECRET);
  console.log('   ENV_SECRET formato válido:', envSecretValid ? '✅' : '❌');
}

// 3. Verificar conexión a base de datos
console.log('\n3. Conexión a base de datos:');
const pool = require('./db');
pool.query('SELECT NOW() as current_time', (err, result) => {
  if (err) {
    console.log('   Conexión DB: ❌', err.message);
  } else {
    console.log('   Conexión DB: ✅', result.rows[0].current_time);
  }
  
  // 4. Verificar tablas
  pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', (err, result) => {
    if (err) {
      console.log('   Tablas: ❌', err.message);
    } else {
      console.log('   Tablas encontradas: ✅');
      result.rows.forEach(row => {
        console.log('     -', row.table_name);
      });
    }
    
    // 5. Probar creación del agente
    console.log('\n4. Prueba de agente ForestAdmin:');
    testForestAgent();
  });
});

async function testForestAgent() {
  try {
    const { createAgent } = require('@forestadmin/agent');
    const { createSqlDataSource } = require('@forestadmin/datasource-sql');
    
    console.log('   Creando agente...');
    const agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET,
      envSecret: process.env.FOREST_ENV_SECRET,
      isProduction: false,
      loggerLevel: 'Debug',
    });
    
    console.log('   Agente creado: ✅');
    
    console.log('   Creando fuente de datos...');
    const dbUri = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
    const dataSource = createSqlDataSource({ uri: dbUri });
    
    agent.addDataSource(dataSource);
    console.log('   Fuente de datos agregada: ✅');
    
    console.log('   Iniciando agente...');
    await agent.start();
    console.log('   Agente iniciado: ✅');
    
    console.log('\n✅ Diagnóstico completado - El agente funciona correctamente');
    console.log('\n💡 Si ForestAdmin sigue sin funcionar, el problema puede ser:');
    console.log('   1. Las credenciales no coinciden con el proyecto en ForestAdmin');
    console.log('   2. El proyecto no está configurado correctamente');
    console.log('   3. La URL del backend no está actualizada en ForestAdmin');
    
    process.exit(0);
    
  } catch (error) {
    console.log('   Error creando agente: ❌');
    console.log('   Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Problema de autenticación detectado:');
      console.log('   - Verifica que las credenciales sean correctas');
      console.log('   - Verifica que el proyecto exista en ForestAdmin');
      console.log('   - Verifica que estés usando el environment correcto (Development)');
    }
    
    process.exit(1);
  }
}
