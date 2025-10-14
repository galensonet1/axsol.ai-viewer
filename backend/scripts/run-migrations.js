const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigrations() {
  const dir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(dir)) {
    console.log('No hay directorio de migraciones. Nada para ejecutar.');
    process.exit(0);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log('No se encontraron archivos .sql en migrations.');
    process.exit(0);
  }

  console.log(`Ejecutando ${files.length} migración(es)...`);
  for (const file of files) {
    const full = path.join(dir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log(`--> Ejecutando: ${file}`);
    try {
      await db.query(sql);
      console.log(`    OK: ${file}`);
    } catch (err) {
      console.error(`    ERROR en ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('Migraciones completadas.');
  process.exit(0);
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
