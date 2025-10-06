const db = require('./db');
const fs = require('fs');
const path = require('path');

// Función para ejecutar el script SQL completo
const executeSQLFile = async () => {
  try {
    const sqlFilePath = path.join(__dirname, 'setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Ejecutando script SQL de inicialización...');
    await db.query(sqlContent);
    console.log('¡Script SQL ejecutado con éxito!');
  } catch (error) {
    console.error('Error ejecutando el script SQL:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    console.log('Iniciando la inicialización de la base de datos...');
    await executeSQLFile();
    console.log('¡La base de datos se ha inicializado correctamente!');
  } catch (err) {
    console.error('Error durante la inicialización de la base de datos:', err);
    process.exit(1);
  } finally {
    // Cerrar la conexión después de la inicialización
    process.exit(0);
  }
};

// Solo ejecutar si este archivo es llamado directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, executeSQLFile };
