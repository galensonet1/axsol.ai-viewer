// Script para verificar credenciales de ForestAdmin
require('dotenv').config();

console.log('🔍 Verificación de credenciales ForestAdmin\n');

console.log('FOREST_AUTH_SECRET:');
console.log('  Presente:', !!process.env.FOREST_AUTH_SECRET);
console.log('  Longitud:', process.env.FOREST_AUTH_SECRET?.length || 0);
console.log('  Primeros 8 chars:', process.env.FOREST_AUTH_SECRET?.substring(0, 8) + '...');
console.log('  Últimos 8 chars:', '...' + process.env.FOREST_AUTH_SECRET?.substring(-8));

console.log('\nFOREST_ENV_SECRET:');
console.log('  Presente:', !!process.env.FOREST_ENV_SECRET);
console.log('  Longitud:', process.env.FOREST_ENV_SECRET?.length || 0);
console.log('  Primeros 8 chars:', process.env.FOREST_ENV_SECRET?.substring(0, 8) + '...');
console.log('  Últimos 8 chars:', '...' + process.env.FOREST_ENV_SECRET?.substring(-8));

console.log('\n💡 Pasos para resolver:');
console.log('1. Ve a ForestAdmin dashboard');
console.log('2. Settings > Environments > Development');
console.log('3. Copia EXACTAMENTE las credenciales mostradas');
console.log('4. Pégalas en tu .env (reemplazando las actuales)');
console.log('5. Reinicia el servidor');

console.log('\n🌐 URL del túnel actual: https://sweet-books-work.loca.lt');
console.log('📋 Esta debe ser la Admin Backend URL en ForestAdmin');
