// === HERRAMIENTAS DE DEBUGGING PARA VIEWER.JS CAPTIONS ===

// 1. FUNCIÓN PRINCIPAL: Diagnosticar y resaltar captions
(function diagnosticarCaptions(){
  console.log('=== DIAGNÓSTICO DE CAPTIONS VIEWER.JS ===');
  
  const modal = document.querySelector('.viewer-container');
  if (!modal) {
    console.warn('❌ No se encontró .viewer-container - La galería no está abierta');
    return;
  }
  
  console.log('✅ Contenedor encontrado:', modal);
  
  const title = modal.querySelector('.viewer-title');
  if (!title) {
    console.warn('❌ No se encontró .viewer-title');
    // Intentar crear el título si no existe
    const titleElement = document.createElement('div');
    titleElement.className = 'viewer-title';
    titleElement.textContent = 'Título de prueba';
    modal.appendChild(titleElement);
    console.log('📝 Título de prueba creado');
  } else {
    console.log('✅ Título encontrado:', title);
    console.log('📝 Contenido del título:', title.textContent);
    console.log('🎨 Estilos computados:', window.getComputedStyle(title));
    
    // Resaltar el título para debugging
    title.style.outline = '3px solid #ff0000';
    title.style.background = 'rgba(255,0,0,0.3)';
    title.style.zIndex = '99999';
    console.log('🔍 Título resaltado en rojo para debugging');
  }
  
  // Mostrar info de imágenes
  const imgs = modal.querySelectorAll('img');
  console.log(`📸 Imágenes encontradas: ${imgs.length}`);
  imgs.forEach((img,i)=>{
    console.log(`img[${i}]:`);
    console.log('  - src:', img.src);
    console.log('  - title:', img.title);
    console.log('  - alt:', img.alt);
  });
  
  // Verificar tema actual
  const temas = ['viewer-dark-theme', 'viewer-light-theme', 'viewer-blue-theme', 'viewer-green-theme'];
  const temaActual = temas.find(tema => modal.classList.contains(tema));
  console.log('🎨 Tema actual:', temaActual || 'Sin tema específico');
  
  return { modal, title, imgs, temaActual };
})();

// 2. FUNCIÓN: Cambiar tema rápidamente
function cambiarTemaRapido(tema) {
  const modal = document.querySelector('.viewer-container');
  if (!modal) {
    console.warn('No hay galería abierta');
    return;
  }
  
  const temas = ['viewer-dark-theme', 'viewer-light-theme', 'viewer-blue-theme', 'viewer-green-theme'];
  
  // Remover todos los temas
  temas.forEach(t => modal.classList.remove(t));
  
  // Agregar el nuevo tema
  if (temas.includes(tema)) {
    modal.classList.add(tema);
    console.log(`✅ Tema cambiado a: ${tema}`);
  } else {
    console.warn(`❌ Tema inválido. Usa uno de: ${temas.join(', ')}`);
  }
}

// 3. FUNCIÓN: Probar todos los temas automáticamente
function probarTemasAutomatico() {
  const temas = ['viewer-dark-theme', 'viewer-light-theme', 'viewer-blue-theme', 'viewer-green-theme'];
  let indice = 0;
  
  console.log('🔄 Iniciando prueba automática de temas...');
  
  const intervalo = setInterval(() => {
    if (indice < temas.length) {
      cambiarTemaRapido(temas[indice]);
      console.log(`🎨 Probando tema ${indice + 1}/${temas.length}: ${temas[indice]}`);
      indice++;
    } else {
      clearInterval(intervalo);
      console.log('✅ Prueba de temas completada');
    }
  }, 2000);
  
  return intervalo;
}

// 4. FUNCIÓN: Forzar visibilidad del caption
function forzarVisibilidadCaption() {
  const modal = document.querySelector('.viewer-container');
  if (!modal) return console.warn('No hay galería abierta');
  
  let title = modal.querySelector('.viewer-title');
  if (!title) {
    title = document.createElement('div');
    title.className = 'viewer-title';
    modal.appendChild(title);
  }
  
  // Aplicar estilos forzados para máxima visibilidad
  title.style.cssText = `
    position: absolute !important;
    bottom: 60px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(255, 255, 0, 0.9) !important;
    color: #000000 !important;
    font-size: 18px !important;
    font-weight: bold !important;
    padding: 15px 25px !important;
    border-radius: 10px !important;
    border: 3px solid #ff0000 !important;
    z-index: 99999 !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    text-align: center !important;
    box-shadow: 0 0 20px rgba(255, 255, 0, 0.8) !important;
  `;
  
  title.textContent = 'CAPTION FORZADO - Si ves esto, los captions funcionan!';
  console.log('💡 Caption forzado aplicado con máxima visibilidad');
}

// 5. COMANDOS RÁPIDOS
console.log('\n=== COMANDOS DISPONIBLES ===');
console.log('cambiarTemaRapido("viewer-dark-theme")   - Tema oscuro');
console.log('cambiarTemaRapido("viewer-light-theme")  - Tema claro');
console.log('cambiarTemaRapido("viewer-blue-theme")   - Tema azul');
console.log('cambiarTemaRapido("viewer-green-theme")  - Tema verde');
console.log('probarTemasAutomatico()                   - Probar todos los temas');
console.log('forzarVisibilidadCaption()               - Forzar caption visible');
console.log('\n💡 Abre una galería de fotos y ejecuta estos comandos!');

// Exponer funciones globalmente
window.cambiarTemaRapido = cambiarTemaRapido;
window.probarTemasAutomatico = probarTemasAutomatico;
window.forzarVisibilidadCaption = forzarVisibilidadCaption;
