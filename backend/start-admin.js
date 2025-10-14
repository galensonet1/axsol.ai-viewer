#!/usr/bin/env node

// Script de inicio rápido para el panel de administración
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AXSOL.ai Admin Panel - Inicio Rápido\n');

// Verificar si el servidor está corriendo
function checkServer() {
  return new Promise((resolve) => {
    exec('curl -s http://localhost:3001/api/admin/stats', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        try {
          const response = JSON.parse(stdout);
          resolve(response.success === true);
        } catch (e) {
          resolve(false);
        }
      }
    });
  });
}

// Abrir el navegador
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`❌ No se pudo abrir el navegador automáticamente`);
      console.log(`🔗 Abre manualmente: ${url}`);
    } else {
      console.log(`✅ Navegador abierto en: ${url}`);
    }
  });
}

// Mostrar estadísticas del sistema
async function showStats() {
  try {
    const { stdout } = await new Promise((resolve, reject) => {
      exec('curl -s http://localhost:3001/api/admin/stats/extended', (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
    
    const stats = JSON.parse(stdout);
    
    if (stats.success) {
      console.log('📊 Estadísticas del Sistema:');
      console.log(`   📁 Proyectos: ${stats.data.totalProjects} (${stats.data.activeProjects} activos)`);
      console.log(`   👥 Usuarios: ${stats.data.totalUsers} (${stats.data.activeUsers} activos)`);
      console.log(`   🛡️  Roles: ${stats.data.totalRoles}`);
      console.log(`   🔗 Asignaciones: ${stats.data.totalAssignments}`);
    }
  } catch (error) {
    console.log('⚠️  No se pudieron obtener las estadísticas');
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando estado del servidor...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ El servidor no está corriendo');
    console.log('\n📋 Para iniciar el servidor:');
    console.log('   1. cd backend');
    console.log('   2. npm run dev');
    console.log('\n⏳ Esperando a que inicies el servidor...');
    
    // Esperar hasta que el servidor esté disponible
    const checkInterval = setInterval(async () => {
      const isRunning = await checkServer();
      if (isRunning) {
        clearInterval(checkInterval);
        console.log('✅ Servidor detectado!');
        await continueStartup();
      }
    }, 2000);
    
    return;
  }
  
  await continueStartup();
}

async function continueStartup() {
  console.log('✅ Servidor corriendo correctamente');
  
  await showStats();
  
  console.log('\n🎯 Panel de Administración Disponible:');
  console.log('   🔗 URL: http://localhost:3001/admin/admin.html');
  
  console.log('\n👥 Usuarios de Prueba:');
  console.log('   👑 Admin: admin@axsol.ai');
  console.log('   👔 Manager: maria.gerente@axsol.ai');
  console.log('   👁️  Viewer: ana.consultora@axsol.ai');
  
  console.log('\n🚀 Funcionalidades Disponibles:');
  console.log('   📁 Gestión de Proyectos (con polígonos GeoJSON)');
  console.log('   👥 Gestión de Usuarios');
  console.log('   🛡️  Gestión de Roles');
  console.log('   🔗 Gestión de Permisos');
  console.log('   📊 Dashboard con Estadísticas');
  
  // Preguntar si abrir el navegador
  console.log('\n❓ ¿Abrir el panel en el navegador? (y/n)');
  
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (input) => {
    const answer = input.trim().toLowerCase();
    
    if (answer === 'y' || answer === 'yes' || answer === 's' || answer === 'si') {
      openBrowser('http://localhost:3001/admin/admin.html');
    } else {
      console.log('🔗 Accede manualmente a: http://localhost:3001/admin/admin.html');
    }
    
    console.log('\n✨ ¡Disfruta del panel de administración AXSOL.ai!');
    process.exit(0);
  });
}

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 ¡Hasta luego!');
  process.exit(0);
});

// Ejecutar
main().catch(console.error);
