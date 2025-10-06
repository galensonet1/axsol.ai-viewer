import { loadCzml } from '../utils/czml-loader.js';
import { showPanel } from '../components/panel-inspeccion.js';
import { fetchInspecciones, fetchAssets, assignAvailabilityToDeliveries } from '../utils/api-client.js';
import {
  cameraViewpoints,
  addAroundCameras,
  addInternalCameras,
  startCameraTour,
  stopCameraTour,
  isTourActive
} from './utils/cameras.js';


// Declaramos 'viewer' y otras variables globales aquí, una sola vez.
let viewer;
let appConfig;
let projectLayoutDataSource;
let projectCentroid = null;
let loaded3DTilesets = []; // Array para almacenar las referencias a los Cesium3DTileset cargados
let loaded360Photos = []; // Array para almacenar las referencias a las entidades de fotos 360
let loadedBillboards = []; // Array para almacenar las referencias a las entidades de fotos normales
// Variable para almacenar el datasource de CZML de inspecciones
let inspectionsDataSource = null;
// Variable para almacenar el datasource de CZML de áreas
let areasDataSource = null;
// Variable para almacenar el datasource de CZML de mallas 3D
let meshesDataSource = null;
// Variable para almacenar el datasource de CZML de fotos 360
let photos360DataSource = null;
// Variable para almacenar el datasource de CZML de fotos normales
let photosDataSource = null;
// Variable para almacenar el datasource de CZML de videos
let videosDataSource = null;
// Variable para almacenar el datasource de CZML de esquema
let layoutDataSource = null;
// Variable global para el tema actual de Viewer.js
let currentViewerTheme = 'viewer-dark-theme';
// Variable global para almacenar las fotos actuales de la galería
let currentGalleryPhotos = [];



// --- Funciones auxiliares ---

// Visualiza una inspección desde la API y muestra 3D Tiles y fotos
async function visualizarInspeccionDesdeAPI(viewer) {
  // Cargar polígono desde archivo
  const polygonResp = await fetch('data/Poligono-proyecto.json');
  const polygonData = await polygonResp.json();
  const polygon = polygonData.features[0].geometry;
  const configResp = await fetch('config.json');
  const config = await configResp.json();
  try {
    const data = await fetchAssets({ polygon });
    let deliveries = data?.deliveries || [];
    deliveries = assignAvailabilityToDeliveries(deliveries, config);
        
    // Almacenar deliveries globalmente para uso del calendario
    window.axsolDeliveries = deliveries;

    // --- Nueva lógica: separar por type y generar CZML por tipo ---
    const czmlByType = {};
    const types = ['3dtile', 'images', 'images360']; // Puedes agregar más tipos si aparecen
    types.forEach(type => czmlByType[type] = [
      { id: 'document', name: type + ' assets', version: '1.0' }
    ]);

    // ID del proyecto para generar IDs únicos por proyecto, entrega y tipo
    const idProyecto = config.proyecto && config.proyecto.id_proyecto ? config.proyecto.id_proyecto : 'proyecto';
    deliveries.forEach((delivery, idxEntrega) => {
      for (const asset of (delivery.assets || [])) {
        if (!czmlByType[asset.type]) continue;
        if (Array.isArray(asset.data)) {
          asset.data.forEach((item, idx) => {
            // 3D Tiles: ahora se cargan de forma clásica, no por CZML
            if (asset.type === '3dtile' && item.asset_id) {
              // Guardar info para cargar luego los tilesets clásicos
              if (!window.axsol3DTilesAssets) window.axsol3DTilesAssets = [];
              window.axsol3DTilesAssets.push({
                asset_id: item.asset_id,
                name: asset.name || `Tileset ${item.asset_id}`,
                availability: item.availability || asset.availability || delivery.availability
              });
              // NO agregar al CZML
              return;
            }
            // Images (como billboard CZML)
            if (asset.type === 'images' && item.metadata && item.url) {
              czmlByType['images'].push({
                id: `${idProyecto}_${delivery._id}_${asset.type}_${item.id}`,
                name: item.name || `Foto ${idx}`,
                availability: item.availability || asset.availability || delivery.availability,
                position: {
                  cartographicDegrees: [
                    item.metadata.longitude,
                    item.metadata.latitude,
                    item.metadata.abs_alt || 0
                  ]
                },
                billboard: {
                  image: './iconos/photography-location.png',
                  width: 32,
                  height: 32,
                  verticalOrigin: 'BOTTOM',
                  heightReference: 'CLAMP_TO_GROUND'
                },
                description: `<div style="cursor:pointer;" onclick="abrirGaleriaFotosCercanas('${idProyecto}_${delivery._id}_${asset.type}_${item.id}')"><img src='${item.url}' style='max-width:100%;max-height:400px;display:block;margin:auto;'><p style='text-align:center;color:white;padding-top:8px;'>Ver Timelapse</p></div>`
              });
            }
            // Images360 (puedes adaptar la lógica si tienes metadatos específicos)
            if (asset.type === 'images360' && item.metadata && item.url) {
              czmlByType['images360'].push({
                id: `${idProyecto}_${delivery._id}_${asset.type}_${item.id}`,
                name: item.name || `Foto360 ${idx}`,
                availability: item.availability || asset.availability || delivery.availability,
                position: {
                  cartographicDegrees: [
                    item.metadata.longitude,
                    item.metadata.latitude,
                    item.metadata.abs_alt || 0
                  ]
                },
                billboard: {
                  image: './iconos/photo-360.png',
                  width: 32,
                  height: 32,
                  verticalOrigin: 'BOTTOM',
                  heightReference: 'CLAMP_TO_GROUND'
                },
                description: `<div style="cursor:pointer;" onclick="mostrarPopup360('${item.url}')"><img src='${item.url}' style='max-width:100%;max-height:400px;display:block;margin:auto;'><p style='text-align:center;color:white;padding-top:8px;'>Click para ver imagen 360°</p></div>`
              });
            }
          });
        }
      }
    }); 

    // --- Permitir descarga de los CZML generados antes de proyectar ---
    //descargarCzmlGenerados(czmlByType);
        // --- Cargar los datasources en el viewer y guardar referencias globales ---
    if (!window.axsolDatasources) window.axsolDatasources = {};
    for (const type of types) {
      if (type === '3dtile') continue; // Saltar 3dtile, ahora se carga clásico
      if (czmlByType[type].length > 1) { // Si hay datos además del document
        const ds = await Cesium.CzmlDataSource.load(czmlByType[type]);
        viewer.dataSources.add(ds);
        window.axsolDatasources[type] = ds;
                // --- Poblar loadedBillboards tras cargar las fotos normales ---
        if (type === 'images') {
          window.loadedBillboards = ds.entities.values.map(entity => {
  // Extraer información relevante para la descarga y filtrado
  const pos = entity.position && entity.position.getValue ? entity.position.getValue(Cesium.JulianDate.now()) : null;
  // Buscar la fecha de entrega asociada usando el id del entity
  let fechaCaptura = undefined;
  try {
    // Buscar en deliveries la entrega y asset/data correspondiente
    for (const delivery of deliveries) {
      for (const asset of (delivery.assets || [])) {
        if (asset.type === 'images' && Array.isArray(asset.data)) {
          for (const item of asset.data) {
            // El CZML id es `${idProyecto}_${delivery._id}_${asset.type}_${item.id}`
            const czmlId = `${idProyecto}_${delivery._id}_${asset.type}_${item.id}`;
            if (czmlId === entity.id) {
              fechaCaptura = delivery.date || undefined;
              break;
            }
          }
        }
      }
      if (fechaCaptura) break;
    }
  } catch(e) { fechaCaptura = undefined; }
  return {
    entity: entity,
    id: entity.id,
    name: entity.name,
    position: pos,
    url: (entity.description && entity.description.getValue) ? (entity.description.getValue() || '').match(/src='([^']+)'/)?.[1] : '',
    metadata: entity.properties || {},
    fechaCaptura: fechaCaptura
  };
});
                  }
        // --- Depuración: log de entidades visibles en images e images360 al mover el timeline ---
        if (type === 'images' || type === 'images360') {
          // Forzar heightReference en todas las entidades billboard tras cargar el datasource
          ds.entities.values.forEach(entity => {
            if (entity.billboard) {
              entity.billboard.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
            }
          });
          viewer.clock.onTick.addEventListener(function(clock) {
            const currentTime = clock.currentTime;
            const visibles = ds.entities.values.filter(e => e.isAvailable(currentTime));
            //console.log(`[DEBUG] ${type} visibles en ${Cesium.JulianDate.toIso8601(currentTime)}: ${visibles.length}`);
          });
        }
      }
    }

    // --- Cargar 3D Tiles clásicos y asociar availability temporal ---
    if (window.axsol3DTilesAssets && window.axsol3DTilesAssets.length > 0) {
      if (!window.axsol3DTilesets) window.axsol3DTilesets = [];
      for (const asset of window.axsol3DTilesAssets) {

        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(asset.asset_id);
        
        tileset.show = false; // Inicialmente oculto
        // Parsear availability ISO8601 a TimeInterval
        if (asset.availability) {
          //tileset.availability = Cesium.TimeInterval.fromIso8601({ iso8601: asset.availability });
          tileset.availability = asset.availability;
        } else {
          // Si no hay availability, mostrar siempre
          tileset.availability = null;
        }
                viewer.scene.primitives.add(tileset);
        window.axsol3DTilesets.push(tileset);
      }
      // Lógica temporal: mostrar/ocultar según availability
      viewer.clock.onTick.addEventListener(function(clock) {
        const currentTime = clock.currentTime;
        (window.axsol3DTilesets || []).forEach(tileset => {
          let debugMsg = `[${tileset.name}] `;
          if (!tileset.availability) {
            tileset.show = true;
            debugMsg += 'Sin availability, show=true';
          } else if (typeof tileset.availability === 'string') {
            // Parsear string ISO8601 a TimeInterval
            const intervals = Cesium.TimeIntervalCollection.fromIso8601({ iso8601: tileset.availability });
            const isIn = intervals.contains(currentTime);
            tileset.show = isIn;
            debugMsg += `Availability: ${tileset.availability}, currentTime: ${Cesium.JulianDate.toIso8601(currentTime)}, show=${isIn}`;
          } else if (Array.isArray(tileset.availability)) {
            // Puede ser array de TimeInterval
            const isIn = tileset.availability.some(interval => interval.contains(currentTime));
            tileset.show = isIn;
            debugMsg += `Array availability, show=${isIn}`;
          } else if (typeof tileset.availability.contains === 'function') {
            const isIn = tileset.availability.contains(currentTime);
            tileset.show = isIn;
            debugMsg += `Object availability, show=${isIn}`;
          } else {
            tileset.show = true;
            debugMsg += 'Caso no contemplado, show=true';
          }
          // Debug por consola
          //console.log(debugMsg);
        });
      });
    }


// Auto-zoom a lo cargado
if (window.axsol3DTilesets && window.axsol3DTilesets.length > 0) {
  viewer.zoomTo(window.axsol3DTilesets[0]);
} else if (window.axsolDatasources && window.axsolDatasources['images'] && window.axsolDatasources['images'].entities.values.length > 0) {
  viewer.zoomTo(window.axsolDatasources['images'].entities.values[0]);
} else if (window.axsolDatasources && window.axsolDatasources['images360'] && window.axsolDatasources['images360'].entities.values.length > 0) {
  viewer.zoomTo(window.axsolDatasources['images360'].entities.values[0]);
}
//console.log('DESPUES: Timeline del ',viewer.timeline.start.toString(),' al ' ,viewer.timeline.stop.toString());

// --- Refuerzo de timeline y clock ---
// Configura el timeline y clock SOLO aquí, usando los valores de config
viewer.timeline.zoomTo(TIMELINE_START, TIMELINE_END);
viewer.clock.startTime = TIMELINE_START.clone();
viewer.clock.stopTime = TIMELINE_END.clone();
//viewer.clock.currentTime = TIMELINE_START.clone();
viewer.clock.currentTime = TIMELINE_END.clone();
//
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // Loop stop para que no se detenga al llegar al final
viewer.clock.multiplier = config.timeline_multiplier || 120000; // Usa el valor de config o 60 por defecto
viewer.clock.shouldAnimate = config.timeline_loop_hasta_ultima_captura || false;
viewer.animation && (viewer.animation.viewModel.animate = config.timeline_loop_hasta_ultima_captura || false);
    // Segundo refuerzo tras retardo
   setTimeout(() => {
     viewer.timeline.zoomTo(TIMELINE_START, TIMELINE_END);
     viewer.clock.currentTime = TIMELINE_START.clone();
     const now = Cesium.JulianDate.now();
     if (Cesium.JulianDate.lessThanOrEquals(TIMELINE_START, now) && Cesium.JulianDate.lessThanOrEquals(now, TIMELINE_END)) {
       viewer.clock.currentTime = now;
       console.log('Clock seteado a la fecha actual:', Cesium.JulianDate.toIso8601(now));
     } else {
       viewer.clock.currentTime = TIMELINE_END.clone();
       console.log('Clock seteado a la fecha de inicio del proyecto:', viewer.clock.currentTime.toString());
     }
   }, 500); // 500 ms de retardo. Puedes ajustar este valor si es necesario.
  } catch (error) {
    console.error('Error en visualizarInspeccionDesdeAPI:', error);
    alert('Ocurrió un error al cargar los datos de la inspección: ' + error.message);
  }
}



// --- Timeline personalizado ---
let TIMELINE_START, TIMELINE_END;
let calendarIntegration = null;

// --- Inicialización principal ---
(async function() {
  try {
    // Cargar config
    const configResp = await fetch('config.json');
    const config = await configResp.json();
    window.appConfig = config;

    // Integración del Módulo de Chat
    if (config.chatEnabled) {
      customElements.whenDefined('axsol-chat-module').then(() => {
        const chatModule = document.getElementById('chat-module');
        if (chatModule && typeof chatModule.setConfig === 'function') {
          chatModule.setConfig(config);
        }
      });
    }

    // Configurar timeline y clock
    if (!config.proyecto || !config.proyecto.fecha_inicio || !config.proyecto.fecha_fin) {
      throw new Error('Las fechas de inicio y fin del proyecto (fecha_inicio, fecha_fin) no están definidas en config.json');
    }
    TIMELINE_START = Cesium.JulianDate.fromIso8601(config.proyecto.fecha_inicio);
    TIMELINE_END = Cesium.JulianDate.fromIso8601(config.proyecto.fecha_fin);

    // Inicializar token y viewer
    if (config.cesium && config.cesium.ion_access_token) {
      Cesium.Ion.defaultAccessToken = config.cesium.ion_access_token;
    }
    viewer = new Cesium.Viewer('cesiumContainer', {

      timeline: true,
      animation: true,
      geocoder: false,
      homeButton: true,
      sceneModePicker: true,
      baseLayerPicker: true,
      navigationHelpButton: true,
      infoBox: true,
      selectionIndicator: true,
      shouldAnimate: config.timeline_loop_hasta_ultima_captura || false,
      terrainProvider: await Cesium.createWorldTerrainAsync(),
    });
    window.viewer = viewer;
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // Cargar KML de áreas
    let kmlDataSource = null;
    try {
      kmlDataSource = await Cesium.KmlDataSource.load('./data/areas.kml', { camera: viewer.scene.camera, canvas: viewer.scene.canvas });
      viewer.dataSources.add(kmlDataSource);
    } catch (e) {
      console.error('No se pudo cargar el archivo areas.kml:', e);
    }

    // Cargar CZML del Plan de Actividades
    let planDataSource = null;
    try {
      planDataSource = await Cesium.CzmlDataSource.load('./data/weekly_construction_plan.czml');
      planDataSource.show = false; // Inicia oculto
      viewer.dataSources.add(planDataSource);
    } catch (e) {
      console.error('No se pudo cargar el archivo weekly_construction_plan.czml:', e);
    }

    // Visualizar inspección desde API
    await visualizarInspeccionDesdeAPI(viewer);

    // Crear UI
    crearHeaderUX();
    crearPanelFlotanteUX(kmlDataSource, planDataSource);
    setupFileUploader(viewer);
    crearBotonMostrarPanelFlotante();
    crearFechaOverlay(viewer);
    activarTooltipImagenes(viewer);

    // Configurar y activar el tour de cámaras si está habilitado
    if (config.tour_ux_habilitado) {
      configurarCamaras(viewer);
    }

    // Integración condicional de CameraRecorder
    if (config.grabacion_habilitada) {
      const module = await import('./utils/camera-recorder.js');
      const cameraRecorder = new module.CameraRecorder(viewer);
      window.cameraRecorder = cameraRecorder;
      const controls = document.getElementById('camera-recorder-controls');
      if (controls) controls.style.display = 'block';
      const startBtn = document.getElementById('start-recording-btn');
      const stopBtn = document.getElementById('stop-recording-btn');
      const exportBtn = document.getElementById('export-czml-btn');
      if (startBtn) {
          startBtn.disabled = false;
          startBtn.onclick = () => {
            cameraRecorder.startRecording();
            startBtn.disabled = true;
            stopBtn.disabled = false;
            exportBtn.disabled = true;
          };
      }
      if (stopBtn) {
          stopBtn.disabled = true;
          stopBtn.onclick = () => {
            cameraRecorder.stopRecording();
            startBtn.disabled = false;
            stopBtn.disabled = true;
            exportBtn.disabled = cameraRecorder.getRecordedPath().length === 0;
            if (cameraRecorder.getRecordedPath().length > 0) {
              exportBtn.disabled = false;
            }
          };
      }
      if (exportBtn) {
          exportBtn.disabled = true;
          exportBtn.onclick = () => {
            const startIso = config.proyecto.fecha_inicio;
            const endIso = new Date().toISOString();
            const czml = cameraRecorder.exportCZML(startIso, endIso);
            const blob = new Blob([JSON.stringify(czml, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'camera_path.czml';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          };
      }
    }

    // Configurar timeline final
    viewer.timeline.zoomTo(TIMELINE_START, TIMELINE_END);
    viewer.clock.startTime = TIMELINE_START.clone();
    viewer.clock.stopTime = TIMELINE_END.clone();
    viewer.clock.currentTime = TIMELINE_END.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = config.timeline_multiplier || 120000;
    viewer.clock.shouldAnimate = config.timeline_loop_hasta_ultima_captura || false;

  } catch (e) {
    console.error('Error inicializando el visor o cargando datos:', e.message, e);
    alert('No se pudo inicializar el visor o cargar los datos.\n' + (e.message || e));
  }
})();

// --- Configuración de cámaras y tour
function configurarCamaras(viewer) {
  // Deshabilitar controles de cámara por defecto
  viewer.scene.screenSpaceCameraController.enableLook = false;
  viewer.scene.screenSpaceCameraController.enableRotate = false;
  viewer.scene.screenSpaceCameraController.enableZoom = false;
  viewer.scene.screenSpaceCameraController.enableTilt = false;
  viewer.scene.screenSpaceCameraController.enablePan = false;

  // --- Configuración de tus cámaras ---
  // Llama a las funciones para poblar tu array de cámaras.
  // Ajusta estas coordenadas al centro de tu obra.
  const approximateCenterLong = -68.32035; // 38.499 Ejemplo de longitud central de tu obra
  const approximateCenterLat = -38.500;   // Ejemplo de latitud central de tu obra
  const approximateBaseHeight = 460;     // Ejemplo de altura base de tu obra

  addAroundCameras(approximateCenterLong, approximateCenterLat, approximateBaseHeight);
  addInternalCameras(); // Asegúrate de ajustar las coordenadas dentro de esta función en cameras.js

  console.log("Cámaras configuradas:", cameraViewpoints);


  // --- Variables para control de tour e inactividad ---
  let inactivityTimeout = null;
  const INACTIVITY_LIMIT_MS = 60000; // 1 minuto

  function enableManualCameraControls(enable) {
    const ssc = viewer.scene.screenSpaceCameraController;
    ssc.enableLook = enable;
    ssc.enableRotate = enable;
    ssc.enableZoom = enable;
    ssc.enableTilt = enable;
    ssc.enablePan = enable;
    console.log('Controles de cámara manuales habilitados:', enable);
  }

  function stopTourAndEnableManual() {
    if (isTourActive) {
      stopCameraTour();
    }
    enableManualCameraControls(true);
  }

  function restartTourAndDisableManual() {
    // Solo reinicia si el tour no está activo
    if (!isTourActive) {
      enableManualCameraControls(false);
      startCameraTour(viewer, 3); // Puedes ajustar la duración
    }
  }

  function resetInactivityTimer() {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      restartTourAndDisableManual();
    }, INACTIVITY_LIMIT_MS);
  }

  // --- Controles de Depuración con Atajos de Teclado ---
  document.addEventListener('keydown', function(e) {
    const ssc = viewer.scene.screenSpaceCameraController;
    if (e.key === 'c') {
      ssc.enableLook = !ssc.enableLook;
      ssc.enableRotate = !ssc.enableRotate;
      ssc.enableZoom = !ssc.enableZoom;
      ssc.enableTilt = !ssc.enableTilt;
      ssc.enablePan = !ssc.enablePan;
      console.log('Controles de cámara manuales habilitados:', ssc.enableLook);
    }
    if (e.key === 't') {
      if (!isTourActive) {
        startCameraTour(viewer, 3);
      } else {
        stopCameraTour();
      }
    }
    if (e.key === 'r') {
      viewer.flyHome({ duration: 2 });
    }
    resetInactivityTimer();
  });

  // --- Interacción de usuario: mouse/touch en el visor Cesium ---
  const cesiumCanvas = viewer.scene.canvas;
  ['mousedown', 'touchstart'].forEach(evt => {
    cesiumCanvas.addEventListener(evt, () => {
      stopTourAndEnableManual();
      resetInactivityTimer();
    });
  });
  // También cualquier click en el visor (por si hay overlays)
  viewer.container.addEventListener('click', () => {
    stopTourAndEnableManual();
    resetInactivityTimer();
  });

  // --- Iniciar tour automáticamente al cargar ---
  startCameraTour(viewer, 3);
  // Iniciar timer de inactividad
  resetInactivityTimer();
}

// --- Header y elementos visuales globales ---
function crearHeaderUX() {
  // Fecha seleccionada (arriba al centro, overlay sobre Cesium)
  const fechaBox = document.createElement('div');
  fechaBox.id = 'headerDateOverlay';
  fechaBox.innerHTML = '<span id="headerDate">--/--/----</span>';
  document.body.appendChild(fechaBox);
  // Logo Phoenix (arriba izq, overlay, recortado al alto del header)
  const logoPhoenix = document.createElement('img');
  logoPhoenix.id = 'logoPhoenixOverlay';
  logoPhoenix.src = './iconos/Phoenix-Logo.png';
  logoPhoenix.alt = 'Phoenix';
  document.body.appendChild(logoPhoenix);
  // Logo AXSOL (inf der, más arriba)
  const logoAXSOL = document.createElement('img');
  logoAXSOL.id = 'logoAXSOL';
  // Usar ruta y nombre desde config si existe
  let logoAXSOLsrc = './iconos/logoaxsol.png';
  try {
    if (window.appConfig && window.appConfig.icons && window.appConfig.icons['logo-AXSOL']) {
      logoAXSOLsrc = './iconos/' + window.appConfig.icons['logo-AXSOL'];
    }
  } catch(e) {}
  logoAXSOL.src = logoAXSOLsrc;
  logoAXSOL.alt = 'AXSOL';
  document.body.appendChild(logoAXSOL);
  // Elimina toolboxBar (panel central inferior de herramientas)
  const toolbox = document.getElementById('toolboxBar');
  if (toolbox) toolbox.remove();
}

// --- Lógica de carga de archivos CZML/KML ---
function setupFileUploader(viewerInstance) {
  const fileInput = document.getElementById('file-input');
  if (!fileInput) return;

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      try {
        if (file.name.toLowerCase().endsWith('.czml')) {
          const czmlData = JSON.parse(content);
          const dataSource = await Cesium.CzmlDataSource.load(czmlData);
          viewerInstance.dataSources.add(dataSource);
          viewerInstance.zoomTo(dataSource);
        } else if (file.name.toLowerCase().endsWith('.kml')) {
          const kmlDataSource = await Cesium.KmlDataSource.load(content, {
            camera: viewerInstance.scene.camera,
            canvas: viewerInstance.scene.canvas
          });
          viewerInstance.dataSources.add(kmlDataSource);
          viewerInstance.zoomTo(kmlDataSource);
        } else {
          alert('Formato de archivo no soportado. Por favor, selecciona un archivo .czml o .kml');
        }
      } catch (error) {
        console.error('Error cargando el archivo:', error);
        alert('Error al procesar el archivo. Verifique el formato y contenido.');
      }
    };

    reader.readAsText(file);
  });
}

// Permite descargar los CZML generados por tipo antes de ser proyectados
function descargarCzmlGenerados(czmlByType) {
  Object.entries(czmlByType).forEach(([type, czmlArr]) => {
    if (czmlArr.length > 1) { // Si hay datos además del document
      const blob = new Blob([JSON.stringify(czmlArr, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.czml`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  });
}

// --- Mostrar fecha sincronizada con el clock arriba al centro ---
function crearFechaOverlay(viewer) {
  let fechaBox = document.getElementById('fechaOverlayClock');
  if (!fechaBox) {
    fechaBox = document.createElement('div');
    fechaBox.id = 'fechaOverlayClock';
    fechaBox.style.position = 'absolute';
    fechaBox.style.top = '18px';
    fechaBox.style.left = '50%';
    fechaBox.style.transform = 'translateX(-50%)';
    fechaBox.style.background = 'rgba(0,0,0,0.7)';
    fechaBox.style.color = '#fff';
    fechaBox.style.padding = '6px 18px';
    fechaBox.style.borderRadius = '16px';
    fechaBox.style.fontSize = '1.2em';
    fechaBox.style.zIndex = '1000';
    fechaBox.style.fontFamily = 'monospace';
    document.body.appendChild(fechaBox);
  }
  function actualizarFecha() {
    const jd = viewer.clock.currentTime;
    const gregorian = Cesium.JulianDate.toDate(jd);
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const dia = gregorian.getDate().toString().padStart(2,'0');
    const mes = meses[gregorian.getMonth()];
    const anio = gregorian.getFullYear();
    fechaBox.textContent = `${dia}-${mes}-${anio}`;
  }
  actualizarFecha();
  viewer.clock.onTick.addEventListener(actualizarFecha);
}

// --- Galería de imágenes con Viewer.js ---

// Nueva función para abrir galería de fotos cercanas
window.abrirGaleriaFotosCercanas = function(entityId) {
  if (!window.loadedBillboards || window.loadedBillboards.length === 0) {
    alert('No hay fotos cargadas para buscar cercanas.');
    return;
  }

  const clickedPhoto = window.loadedBillboards.find(b => b.id === entityId);
  if (!clickedPhoto || !clickedPhoto.position) {
    console.error('No se encontró la foto clickeada o no tiene posición:', entityId);
    alert('No se pudo encontrar la foto seleccionada.');
    return;
  }

  const nearbyPhotos = window.loadedBillboards.filter(b => {
    if (!b.position || b.id === entityId) return false;
    const distance = Cesium.Cartesian3.distance(clickedPhoto.position, b.position);
    return distance <= 10.0; // 10 metros de radio
  });

  // Agrupar la foto clickeada con las cercanas
  const galleryPhotos = [clickedPhoto, ...nearbyPhotos].map(p => ({
    href: p.url,
    fechaCaptura: p.fechaCaptura
  }));

  if (galleryPhotos.length > 0) {
    // Abrir la galería con la foto clickeada como inicial
    abrirGaleriaViewerJS(galleryPhotos, 0);
  } else {
    alert('No se encontraron otras fotos en un radio de 10 metros.');
  }
}
function abrirGaleriaViewerJS(fotos, initialIndex = 0) {
  if (!fotos || fotos.length === 0) return;

  // Guardar fotos actuales
  currentGalleryPhotos = fotos;

  const ul = document.createElement('ul');
  ul.style.display = 'none';

  fotos.forEach(foto => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = foto.href;
    // Usar fecha como título
    img.alt = foto.fechaCaptura ? new Date(foto.fechaCaptura).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Foto';
    li.appendChild(img);
    ul.appendChild(li);
  });

  document.body.appendChild(ul);

    const viewerInstance = new Viewer(ul, {
    initialViewIndex: initialIndex,
    theme: currentViewerTheme,
    toolbar: {
      zoomIn: 2,
      zoomOut: 2,
      oneToOne: 2,
      reset: 2,
      prev: 2,
      play: { show: 2, size: 'large' },
      next: 2,
      rotateLeft: 2,
      rotateRight: 2,
      flipHorizontal: 2,
      flipVertical: 2,
      // Botón custom para descargar
      download: {
        show: true,
        size: 'large',
        click: () => {
          descargarFotosConMarcaDeAgua();
        }
      }
    },
    hidden: () => {
      document.body.removeChild(ul);
      viewerInstance.destroy();
    }
  });

  viewerInstance.show();
}

// --- Descarga de fotos con marca de agua ---
async function descargarFotosConMarcaDeAgua() {
  if (currentGalleryPhotos.length === 0) {
    alert('No hay fotos para descargar.');
    return;
  }

  mostrarSpinnerAXSOL('Preparando descarga...');

  try {
    const zip = new JSZip();
    const marcaAguaUrl = './iconos/ingenieria-sima-sa.jpg'; // Ruta a tu marca de agua
    const marcaAguaImg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = marcaAguaUrl;
    });

    for (const foto of currentGalleryPhotos) {
      const fotoImg = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = foto.href;
      });

      const canvas = document.createElement('canvas');
      canvas.width = fotoImg.width;
      canvas.height = fotoImg.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(fotoImg, 0, 0);

      // Aplicar marca de agua
      const escalaMarca = 0.2; // 20% del ancho de la imagen
      const marcaWidth = fotoImg.width * escalaMarca;
      const marcaHeight = marcaAguaImg.height * (marcaWidth / marcaAguaImg.width);
      ctx.globalAlpha = 0.6; // Opacidad
      ctx.drawImage(marcaAguaImg, canvas.width - marcaWidth - 20, canvas.height - marcaHeight - 20, marcaWidth, marcaHeight);
      ctx.globalAlpha = 1.0;

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const nombreArchivo = `foto_${new Date(foto.fechaCaptura || Date.now()).toISOString().split('T')[0]}.jpg`;
      zip.file(nombreArchivo, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'AXSOL_fotos.zip';
    link.click();
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Error al descargar fotos:', error);
    alert('Hubo un problema al generar el archivo de descarga.');
  } finally {
    ocultarSpinnerAXSOL();
  }
}

// --- Cambiar tema de Viewer.js ---
function cambiarTemaViewerJS(nuevoTema) {
  currentViewerTheme = nuevoTema;
  // Puedes agregar lógica para actualizar un viewer existente si es necesario
}

// --- Tooltip para miniaturas de imágenes (billboards) ---
function activarTooltipImagenes(viewer) {
  let tooltip = document.getElementById('imgTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'imgTooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '2000';
    tooltip.style.background = 'rgba(0,0,0,0.85)';
    tooltip.style.border = '1px solid #fff';
    tooltip.style.borderRadius = '8px';
    tooltip.style.padding = '4px';
    tooltip.style.boxShadow = '0 2px 8px #0008';
    document.body.appendChild(tooltip);
  }

  // Mouse move para mostrar miniatura
  viewer.screenSpaceEventHandler.setInputAction(function(movement) {
    const picked = viewer.scene.pick(movement.endPosition);
    if (picked && picked.id && picked.id.billboard && picked.id.description && picked.id.id) {
      const entityId = picked.id.id;
      const description = picked.id.description.getValue(viewer.clock.currentTime);
      const match = description && description.match(/src='([^']*)'/);

      if (match && match[1]) {
        let url = match[1] + (match[1].includes('?') ? '&' : '?') + 'width=200';
        let innerHTML = `<img src="${url}" style="max-width:200px;max-height:120px;display:block;">`;
        
        if (entityId.includes('_images360_')) {
          innerHTML = `<img src="${url}" style="max-width:200px;max-height:120px;display:block;border-radius:50%;">`;
        }

        tooltip.innerHTML = innerHTML;
        tooltip.style.display = 'block';
        tooltip.style.left = (movement.endPosition.x + 16) + 'px';
        tooltip.style.top = (movement.endPosition.y - 10) + 'px';
        return;
      }
    }
    tooltip.style.display = 'none';
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// --- Popup 360° con Pannellum ---
function mostrarPopup360(url, options = {}) {
  console.log('Mostrando popup 360° para URL:', url);
  // Si ya existe, reutiliza
  let popup = document.getElementById('popup360');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'popup360';
    popup.style.position = 'fixed';
    popup.style.left = '15vw';
    popup.style.top = '15vh';
    popup.style.width = '70vw';
    popup.style.height = '70vh';
    popup.style.background = '#111';
    popup.style.zIndex = '3000';
    popup.style.borderRadius = '18px';
    popup.style.boxShadow = '0 4px 32px #000a';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.innerHTML = `<div id="pnlmContainer" style="width:100%;height:100%;"></div><button id="close360" style="position:absolute;top:12px;right:18px;font-size:2em;background:none;color:#fff;border:none;cursor:pointer;z-index:10;">&times;</button>`;
    document.body.appendChild(popup);
    document.getElementById('close360').onclick = () => {
      popup.style.display = 'none';
      if (window.pnlmViewer) { window.pnlmViewer.destroy(); window.pnlmViewer = null; }
    };
  } else {
    popup.style.display = 'flex';
    document.getElementById('pnlmContainer').innerHTML = '';
  }
  // Carga Pannellum si no está
  if (typeof window.pannellum === 'undefined') {
    const script = document.createElement('script');
    script.src = 'lib/pannellum/pannellum.js';
    script.onload = () => lanzarPannellum(url, options);
    document.body.appendChild(script);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'lib/pannellum/pannellum.css';
    document.head.appendChild(link);
  } else {
    lanzarPannellum(url, options);
  }
}

function lanzarPannellum(url, options = {}) {
  if (window.pnlmViewer) { window.pnlmViewer.destroy(); window.pnlmViewer = null; }
  // Permite pasar opciones extra como autorotate y compass
  const pannellumConfig = {
    type: 'equirectangular',
    panorama: url,
    autoLoad: true,
    showControls: true,
    compass: true,
    northOffset: 0,
    ...options // Permite override desde la llamada
  };
  window.pnlmViewer = pannellum.viewer('pnlmContainer', pannellumConfig);
}

// Guardar config global para acceso en filtros
(async function() {
  try {
    // Cargar fechas de timeline desde config.json
    const configResp = await fetch('config.json');
    const config = await configResp.json();
    window.appConfig = config;

    // --- Inicialización de la vista ---
    const center = config.proyecto.centroid || [-68.321, -38.5];
    const zoom = config.proyecto.zoom || 15;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], zoom),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
      }
    });
  } catch (e) {
    console.error('Error cargando la configuración o inicializando la vista:', e);
  }
})();

// --- Popup para fotos normales con marca de agua y opciones ---
function mostrarPopupFotoNormal(url, options = {}) {
  console.log('[AXSOL][DEBUG][POPUP] Estado de window.loadedBillboards al abrir popup:', window.loadedBillboards);
  //console.log('[AXSOL][DEBUG][POPUP] Estado de loadedBillboards (local) al abrir popup:', loadedBillboards); // Ya no se usa la variable local
  let popup = document.getElementById('popupFotoNormal');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'popupFotoNormal';
    popup.style.position = 'fixed';
    popup.style.left = '15vw';
    popup.style.top = '15vh';
    popup.style.width = '70vw';
    popup.style.height = '70vh';
    popup.style.background = '#111';
    popup.style.zIndex = '3000';
    popup.style.borderRadius = '18px';
    popup.style.boxShadow = '0 4px 32px #000a';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.innerHTML = `
      <button id="closeFotoNormal" style="position:absolute;top:12px;right:18px;font-size:2em;background:none;color:#fff;border:none;cursor:pointer;z-index:10;">&times;</button>
      <img id="popupFotoImg" src="${url}" style="max-width:90%;max-height:70%;margin-top:40px;border-radius:12px;box-shadow:0 2px 16px #0008;" />
      <div style="margin-top:18px;display:flex;gap:18px;">
        <button id="descargarFotoMarcaAgua" class="popup-btn">Descargar</button>
        <button id="compartirFoto" class="popup-btn">Compartir</button>
        <button id="descargarSerie" class="popup-btn">Descargar Serie</button>
      </div>
    `;
    document.body.appendChild(popup);
  } else {
    // Eliminar handlers antiguos para evitar duplicados
    const oldDescargar = document.getElementById('descargarFotoMarcaAgua');
    const newDescargar = oldDescargar.cloneNode(true);
    oldDescargar.parentNode.replaceChild(newDescargar, oldDescargar);
    const oldCompartir = document.getElementById('compartirFoto');
    const newCompartir = oldCompartir.cloneNode(true);
    oldCompartir.parentNode.replaceChild(newCompartir, oldCompartir);
    const oldSerie = document.getElementById('descargarSerie');
    const newSerie = oldSerie.cloneNode(true);
    oldSerie.parentNode.replaceChild(newSerie, oldSerie);
    // Ocultar otros popups antes de mostrar uno nuevo
    document.querySelectorAll('.axsol-foto-popup').forEach(p => p.style.display = 'none');
    popup.style.display = 'flex';
    document.getElementById('popupFotoImg').src = url;
  }
  // Descargar con marca de agua
  document.getElementById('descargarFotoMarcaAgua').onclick = async () => {
    // Pasar availability, nombre e id a la función de descarga
    console.log('[Popup] Descargar con marca de agua', url, options);
    await descargarFotoConMarcaAgua(url, {
      nombre: options.nombre,
      id: options.id,
      availability: options.availability,
      cliente: window.appConfig?.proyecto?.cliente || '',
      proyecto: window.appConfig?.proyecto?.nombre || ''
    });
  };

  // Evitar duplicación de listeners en Descargar Serie
  const serieBtn = document.getElementById('descargarSerie');
  if (serieBtn._axsolListenerAttached) {
    serieBtn.onclick = null;
  }
  serieBtn._axsolListenerAttached = true;

  // Compartir
  document.getElementById('compartirFoto').onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: options.nombre || 'Foto',
        url
      });
    } else {
      alert('La función de compartir no está disponible en este navegador.');
    }
  };

  // Descargar Serie
  document.getElementById('descargarSerie').onclick = async () => {
    try {
      console.log('[Descargar Serie] Click detectado');
      if (!window.loadedBillboards || !Array.isArray(window.loadedBillboards)) {
        alert('No hay fotos cargadas en memoria (loadedBillboards vacío o no definido).');
        console.error('[Descargar Serie] loadedBillboards vacío o no definido');
        return;
      }
    // Cargar JSZip si es necesario
    if (typeof window.JSZip === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'lib/jszip.min.js';
        script.onload = () => {
  // Fix para compatibilidad: algunos bundles exponen JSZip como window.JSZip.default
  if (window.JSZip && window.JSZip.default) {
    window.JSZip = window.JSZip.default;
  }
  resolve();
};
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const zip = new window.JSZip();
    // Obtener la posición de la foto actual
    const posActual = options.position || (options.entity && options.entity.position) || null;
    if (!posActual) {
      alert('No se pudo determinar la posición de la foto actual.');
      console.error('[Descargar Serie] No se pudo determinar la posición de la foto actual.', options);
      return;
    }
    // Convertir a [x, y, z] si es Cesium.Cartesian3
    let posArray;
    if (window.Cesium && Cesium.Cartesian3 && posActual instanceof Cesium.Cartesian3) {
      console.log('[Descargar Serie][DEBUG] posActual es Cesium.Cartesian3:', posActual);

      posArray = [posActual.x, posActual.y, posActual.z];
    } else if (Array.isArray(posActual)) {
      posArray = posActual;
    } else if (typeof posActual === 'object' && 'x' in posActual && 'y' in posActual && 'z' in posActual) {
      posArray = [posActual.x, posActual.y, posActual.z];
    } else {
      alert('No se pudo interpretar la posición de la foto actual.');
      console.error('[Descargar Serie] No se pudo interpretar la posición de la foto actual.', posActual);
      return;
    }
    console.log('[Descargar Serie][DEBUG] loadedBillboards:', window.loadedBillboards);
    console.log('[Descargar Serie][DEBUG] posActual:', posActual, '->', posArray);
    // Buscar todas las fotos en loadedBillboards en un radio de 6 metros
    const nearbyPhotos = window.loadedBillboards.filter(foto => {
      let posFoto = foto.position || (foto.entity && foto.entity.position) || null;
      let arr;
      if (!posFoto) {
        console.log('[Descargar Serie][DEBUG] Foto sin posición:', foto);
        return false;
      }
      if (window.Cesium && Cesium.Cartesian3 && posFoto instanceof Cesium.Cartesian3) {
        arr = [posFoto.x, posFoto.y, posFoto.z];
      } else if (Array.isArray(posFoto)) {
        arr = posFoto;
      } else if (typeof posFoto === 'object' && 'x' in posFoto && 'y' in posFoto && 'z' in posFoto) {
        arr = [posFoto.x, posFoto.y, posFoto.z];
      } else {
        console.log('[Descargar Serie][DEBUG] Posición de foto no interpretable:', posFoto, foto);
        return false;
      }
      // Distancia euclídea
      const dx = arr[0] - posArray[0];
      const dy = arr[1] - posArray[1];
      const dz = arr[2] - posArray[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      //console.log(`[Descargar Serie][DEBUG] Foto`, foto, 'Pos:', arr, 'Dist:', dist);
      return dist <= 10.0;
    });
    console.log(`[Descargar Serie] Fotos cercanas encontradas: ${nearbyPhotos.length}`);
    if (nearbyPhotos.length === 0) {
      alert('No se encontraron fotos cercanas en un radio de 4 metros.');
      console.warn('[Descargar Serie] No se encontraron fotos cercanas en un radio de 4 metros.');
      return;
    }
    // Procesar cada foto: descargar, renombrar y poner marca de agua
    const cliente = window.appConfig?.proyecto?.cliente || '';
    const proyecto = window.appConfig?.proyecto?.nombre || '';
    const zipPromises = nearbyPhotos.map(async (foto, idx) => {
      const nombre = foto.nombre || `foto_${idx+1}`;
      const id = foto.id || '';
      const urlFoto = foto.url || (foto.entity && foto.entity.properties && foto.entity.properties.url && foto.entity.properties.url.getValue && foto.entity.properties.url.getValue()) || '';
      if (!urlFoto) return null;
      // Usar la misma lógica que descargarFotoConMarcaAgua
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = urlFoto;
      await new Promise(resolve => { img.onload = resolve; });
      const w = img.naturalWidth, h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // Marca de agua: cliente y nombre del proyecto, fecha, id
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, h-54, w, 54);
      ctx.fillStyle = '#fff';
      ctx.fillText(cliente + ' | ' + proyecto, 16, h-24);
      ctx.font = '18px sans-serif';
      ctx.fillText('ID: ' + id, 16, h-6);
      // Obtener blob y agregar al zip
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          zip.file(nombre + '.jpg', blob);
          resolve();
        }, 'image/jpeg', 0.92);
      });
    });
    await Promise.all(zipPromises);
    // Descargar el zip
    zip.generateAsync({type:'blob'}).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'serie_fotos.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      alert('Descarga de serie completada.');
      console.log('[Descargar Serie] Descarga de serie completada.');
    }).catch(e => {
      alert('Error generando el archivo zip: ' + e);
      console.error('[Descargar Serie] Error generando el zip', e);
    });
    } catch (err) {
      alert('Error inesperado en Descargar Serie: ' + err);
      console.error('[Descargar Serie] Error inesperado', err);
    }
  };
}

// --- Descargar imagen con marca de agua (nombre, fecha, logo, minimapa simple) ---
async function descargarFotoConMarcaAgua(url, options = {}) {
  // Usar fechaCaptura si está disponible
  let fecha = options.fechaCaptura || '';
  if (!fecha && options.availability) {
    let rawDate = options.availability.split('/')[0];
    if (/\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      fecha = rawDate.slice(0, 10);
    } else if (rawDate.length > 6) {
      fecha = rawDate;
    }
  }
  if (!fecha) fecha = 'Fecha_desconocida';
  options._captionDate = fecha;

  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await new Promise(resolve => { img.onload = resolve; });
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  // Marca de agua: cliente y nombre del proyecto, fecha de entrega, id completo
  const captionHeight = Math.round(h * 0.05);
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, h-captionHeight, w, captionHeight);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  // Título pequeño
  ctx.font = 'bold ' + Math.round(captionHeight * 0.28) + 'px sans-serif';
  const titulo = (window.appConfig?.proyecto?.cliente || '') + ' - ' + (window.appConfig?.proyecto?.nombre || '');
  ctx.fillText(titulo, 40, h - captionHeight + Math.round(captionHeight * 0.38));
  // Fecha legible debajo del título
  ctx.font = Math.round(captionHeight * 0.32) + 'px sans-serif';
  // --- Fecha desde availability ---
  let availabilityStr = '';
  if (options.availability) {
    //console.log('Extraer availability desde opciones:', options.availability);
    if (typeof options.availability === 'string') {
      availabilityStr = options.availability;
    } else if (typeof options.availability === 'object') {
      // Cesium.TimeIntervalCollection
      if (typeof options.availability.get === 'function' && options.availability.length > 0) {
        // Extraer el primer intervalo y formatear como ISO8601
        const interval = options.availability.get(0);
        if (interval && interval.start && interval.stop) {
          availabilityStr = Cesium.JulianDate.toIso8601(interval.start) + '/' + Cesium.JulianDate.toIso8601(interval.stop);
        }
      } else if (options.availability.iso8601) {
        availabilityStr = options.availability.iso8601;
      } else if (typeof options.availability.toString === 'function') {
        const str = options.availability.toString();
        if (str && str !== '[object Object]') {
          availabilityStr = str;
        }
      }
    }
  }
  console.log('availabilityStr extraído:', availabilityStr);
  
  // Si sigue sin ser string válida, dejar vacío
  if (typeof availabilityStr !== 'string' || !availabilityStr.includes('/')) {
    availabilityStr = '';
  }
  // --- Mostrar availability tal cual en la marca de agua ---
  // Si availabilityStr es un rango ISO8601, formatear solo la fecha de inicio como dd-mm-yyyy
  let fechaMarcaAgua = availabilityStr;
  if (typeof availabilityStr === 'string' && availabilityStr.includes('/')) {
    const inicio = availabilityStr.split('/')[0];
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    const match = inicio.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      fechaMarcaAgua = `Fecha captura: ${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  ctx.fillText(fechaMarcaAgua, 40, h - captionHeight + Math.round(captionHeight * 0.78));
  // ID en muy pequeño debajo de la fecha
  // ctx.font = Math.round(captionHeight * 0.16) + 'px monospace';
  // ctx.fillStyle = '#ccc';
  // ctx.textAlign = 'left';
  // ctx.fillText(options.id || '', 40, h - captionHeight + Math.round(captionHeight * 0.96));
  // ctx.textAlign = 'left';
  ctx.restore();
  // Descargar
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/jpeg', 0.92);
  // --- Nombre de archivo ---
  const safe = s => (typeof s === 'string' ? s : '').replace(/[^a-zA-Z0-9\-_]/g,'_');
  const fileName = `${safe(options.cliente)}-${safe(options.proyecto)}-${safe(options.nombre)}-${safe(availabilityStr)}.jpg`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
}

// --- Spinner de carga con logo AXSOL ---
function mostrarSpinnerAXSOL() {
  if (document.getElementById('axsolLoadingOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'axsolLoadingOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = `
    <div style="position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;">
      <svg width="120" height="120" viewBox="0 0 120 120" style="position:absolute;top:0;left:0;">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#fff" stroke-width="12" opacity="0.18"/>
        <circle cx="60" cy="60" r="48" fill="none" stroke="#e53935" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="75 225" stroke-dashoffset="0">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </svg>
      <img src="./iconos/logoaxsol.png" alt="AXSOL" style="width:56px;height:56px;border-radius:50%;background:#fff;position:absolute;top:32px;left:32px;box-shadow:0 2px 12px #0004;" />
    </div>
  `;
  document.body.appendChild(overlay);
}

function ocultarSpinnerAXSOL() {
  const overlay = document.getElementById('axsolLoadingOverlay');
  if (overlay) overlay.remove();
}

// --- Integración de CameraSetRecorder (grabación de cámaras) ---
(async function() {
  try {
    const configResp = await fetch('config.json');
    const config = await configResp.json();
    if (config.grabacion_camaras_habilitada) {
      const module = await import('./utils/camera-set-recorder.js');
      const cameraSetRecorder = new module.CameraSetRecorder(window.viewer);
      window.cameraSetRecorder = cameraSetRecorder;
      // UI flotante
      let panel = document.getElementById('camera-set-recorder-controls');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'camera-set-recorder-controls';
        panel.style.position = 'fixed';
        panel.style.top = '80px';
        panel.style.right = '32px';
        panel.style.zIndex = '3000';
        panel.style.background = 'rgba(30,30,30,0.97)';
        panel.style.borderRadius = '14px';
        panel.style.boxShadow = '0 2px 16px #0008';
        panel.style.padding = '18px 18px 12px 18px';
        panel.style.minWidth = '320px';
        panel.style.fontFamily = 'sans-serif';
        panel.style.color = '#fff';
        panel.innerHTML = `
          <div style="font-weight:bold;font-size:1.1em;margin-bottom:8px;">Grabación de Cámaras</div>
          <div style="margin-bottom:8px;">
            <label>Availability (ISO8601): <input id="camset-availability" type="text" style="width:180px;" placeholder="2025-07-01T00:00:00Z/2025-07-07T23:59:59Z"></label>
          </div>
          <div style="margin-bottom:8px;">
            <button id="camset-add-btn">Agregar cámara actual</button>
            <button id="camset-clear-btn">Limpiar</button>
          </div>
          <div id="camset-list" style="max-height:180px;overflow:auto;margin-bottom:8px;"></div>
          <div style="display:flex;gap:8px;">
            <button id="camset-export-btn">Exportar set</button>
            <button id="camset-close-btn">Cerrar</button>
          </div>
        `;
        document.body.appendChild(panel);
      }
      function renderList() {
        const list = panel.querySelector('#camset-list');
        list.innerHTML = cameraSetRecorder.camaras.map((c,i) => `
          <div style='margin-bottom:6px;padding:4px 0;border-bottom:1px solid #333;'>
            <input type='text' value='${c.nombre}' data-idx='${i}' class='camset-nombre' style='width:90px;'>
            Duración <input type='number' min='1' value='${c.duracion}' data-idx='${i}' class='camset-duracion' style='width:40px;'>s
            Transición <input type='number' min='0' value='${c.transicion}' data-idx='${i}' class='camset-transicion' style='width:40px;'>s
            <button data-idx='${i}' class='camset-del-btn' style='color:#e53935;'>✕</button>
          </div>
        `).join('') || '<div style="color:#aaa;">Sin cámaras registradas.</div>';
        // Listeners para editar
        list.querySelectorAll('.camset-nombre').forEach(inp => {
          inp.onchange = e => {
            cameraSetRecorder.updateCamera(Number(inp.dataset.idx), {nombre: inp.value});
          };
        });
        list.querySelectorAll('.camset-duracion').forEach(inp => {
          inp.onchange = e => {
            cameraSetRecorder.updateCamera(Number(inp.dataset.idx), {duracion: Number(inp.value)});
          };
        });
        list.querySelectorAll('.camset-transicion').forEach(inp => {
          inp.onchange = e => {
            cameraSetRecorder.updateCamera(Number(inp.dataset.idx), {transicion: Number(inp.value)});
          };
        });
        list.querySelectorAll('.camset-del-btn').forEach(btn => {
          btn.onclick = e => {
            cameraSetRecorder.removeCamera(Number(btn.dataset.idx));
            renderList();
          };
        });
      }
      // Botones
      panel.querySelector('#camset-add-btn').onclick = () => {
        cameraSetRecorder.addCurrentCamera();
        renderList();
      };
      panel.querySelector('#camset-clear-btn').onclick = () => {
        cameraSetRecorder.clear();
        renderList();
      };
      panel.querySelector('#camset-export-btn').onclick = () => {
        const avail = panel.querySelector('#camset-availability').value.trim();
        if (avail) cameraSetRecorder.setAvailability(avail);
        const data = cameraSetRecorder.exportJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camaras_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      };
      panel.querySelector('#camset-close-btn').onclick = () => {
        panel.style.display = 'none';
      };
      panel.querySelector('#camset-availability').onchange = e => {
        cameraSetRecorder.setAvailability(e.target.value.trim());
      };
      renderList();
    }
  } catch(e) { console.error('Error inicializando CameraSetRecorder:', e); }
})();

// --- Panel flotante arriba a la izquierda ---
function crearPanelFlotanteUX(kmlDataSource, planDataSource) {
  let panel = document.getElementById('panelFlotanteUX');
  if (panel) return; // Si ya existe, no hacer nada

  panel = document.createElement('div');
  panel.id = 'panelFlotanteUX';
  panel.style.position = 'fixed';
  panel.style.top = '110px';
  panel.style.left = '24px';
  panel.style.background = 'rgba(30,30,30,0.85)';
  panel.style.borderRadius = '16px';
  panel.style.boxShadow = '0 2px 16px #0008';
  panel.style.padding = '18px 22px';
  panel.style.minWidth = '320px';
  panel.style.maxWidth = '90vw';
  panel.style.zIndex = '4000';
  panel.style.color = '#fff';
  panel.style.fontFamily = 'sans-serif';
  panel.style.transition = 'opacity 0.2s';
  panel.style.display = 'none'; // Panel oculto al iniciar

  let panelContentHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div style="font-size:1.2em;font-weight:bold;">Panel de Control</div>
      <button id="btnCerrarPanelFlotante" style="background:none;border:none;color:#fff;font-size:1.5em;cursor:pointer;">×</button>
    </div>
    <div style="margin:12px 0 8px 0;">
      <label style="font-weight:600;">Proyecto:</label>
      <select id="selectorProyectoUX" style="width:100%;margin-top:4px;padding:4px 8px;border-radius:6px;">
        <option>CPF de Mata Mora</option>
        <option>...</option>
      </select>
    </div>
    <div style="margin-bottom:10px;">
      <label style="font-weight:600;">Fecha:</label>
      <input id="calendarUX" type="text" style="width:100%;margin-top:4px;padding:4px 8px;border-radius:6px;" placeholder="Selecciona fecha" />
    </div>
    <div style="margin-bottom:8px;">
      <label style="font-weight:600;">Capas:</label>
      <div style="margin-top:4px;display:flex;flex-direction:column;gap:2px;">
        <label><input type="checkbox" id="filtro-fotos"> Fotos</label>
        <label><input type="checkbox" id="filtro-videos"> Videos</label>
        <label><input type="checkbox" id="filtro-fotos360"> Fotos 360°</label>
        <label><input type="checkbox" id="filtro-esquema"> Layout</label>
        <label><input type="checkbox" id="filtro-terreno"> Terreno</label>
        <label><input type="checkbox" id="filtro-barras-progreso"> Ver Progreso</label>
        <label><input type="checkbox" id="togglePlan"> Plan de Actividades</label>
      </div>
    </div>
  `;

  if (window.appConfig && window.appConfig.cargaCzml) {
    panelContentHTML += `
      <div style="margin-top: 10px;">
        <button class="cesium-button" style="width: 100%;" onclick="document.getElementById('file-input').click();">
          Cargar CZML/KML
        </button>
      </div>
    `;
  }

  panel.innerHTML = panelContentHTML;
  document.body.appendChild(panel);

  // --- Lógica de eventos y filtros --- (Ahora se ejecuta después de crear el panel)
  document.getElementById('btnCerrarPanelFlotante').onclick = () => {
    panel.style.display = 'none';
    document.getElementById('btnMostrarPanelFlotante').style.display = 'block';
  };

  const btnMostrar = document.getElementById('btnMostrarPanelFlotante');
  if (btnMostrar) {
      btnMostrar.onclick = () => {
          panel.style.display = 'block';
          btnMostrar.style.display = 'none';
      };
  }

  let filtrosConfig = window.appConfig?.filtros || {};
  
  const filtroBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true';
    return !!val;
  }

  const setupCheckbox = (id, configKey, dataSource, isGlobe) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    checkbox.checked = filtroBool(filtrosConfig[configKey]);

    if (dataSource) {
        dataSource.show = checkbox.checked;
    }
    if (isGlobe && window.viewer?.scene?.globe) {
        window.viewer.scene.globe.show = checkbox.checked;
    }

    checkbox.onchange = (e) => {
      if (dataSource) dataSource.show = e.target.checked;
      if (isGlobe && window.viewer?.scene?.globe) window.viewer.scene.globe.show = e.target.checked;
    };
  };

  setupCheckbox('filtro-fotos', 'imagenes', window.axsolDatasources?.['images']);
  setupCheckbox('filtro-fotos360', 'imagenes_360', window.axsolDatasources?.['images360']);
  setupCheckbox('filtro-esquema', 'layout', kmlDataSource);
  setupCheckbox('filtro-terreno', 'terreno', null, true);
  setupCheckbox('togglePlan', 'plan_actividades', planDataSource);

  const chkVideo = document.getElementById('filtro-videos');
  if(chkVideo) {
    chkVideo.checked = filtroBool(filtrosConfig.videos);
    chkVideo.onchange = (e) => {
        alert('Filtro de videos aún no implementado.');
        e.target.checked = false;
    };
  }

  const chkBarrasProgreso = document.getElementById('filtro-barras-progreso');
  if (chkBarrasProgreso) {
    chkBarrasProgreso.checked = filtroBool(filtrosConfig['barras-progreso']);
    chkBarrasProgreso.onchange = e => {
      if (e.target.checked) {
        mostrarProgressBarHUD(window.appConfig);
      } else {
        ocultarProgressBarHUD();
      }
    };
    if (chkBarrasProgreso.checked) {
      mostrarProgressBarHUD(window.appConfig);
    }
  }
}

// Botón flotante para mostrar el panel
function crearBotonMostrarPanelFlotante() {
  let btn = document.getElementById('btnMostrarPanelFlotante');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'btnMostrarPanelFlotante';
    btn.innerHTML = '☰';
    btn.style.position = 'fixed';
    btn.style.top = '110px';
    btn.style.left = '18px';
    btn.style.zIndex = '4100';
    btn.style.background = 'rgba(30,30,30,0.85)';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '12px';
    btn.style.fontSize = '2em';
    btn.style.width = '48px';
    btn.style.height = '48px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 12px #0006';
    document.body.appendChild(btn);
  }
  btn.onclick = () => {
    const panel = document.getElementById('panelFlotanteUX');
    if (panel) {
      panel.style.display = 'block';
      btn.style.display = 'none';
    }
  };
}

// Asegura que el botón siempre se muestre si el panel está oculto
function asegurarBotonMostrarPanelFlotante() {
  const btn = document.getElementById('btnMostrarPanelFlotante');
  const panel = document.getElementById('panelFlotanteUX');
  if (panel && btn) {
    if (panel.style.display === 'none' || getComputedStyle(panel).display === 'none') {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  }
}

// --- Espacios para logos ---
function crearEspaciosLogos() {
  // Logo superior izquierdo
  let logoSup = document.getElementById('logoSuperiorIzq');
  if (!logoSup) {
    logoSup = document.createElement('div');
    logoSup.id = 'logoSuperiorIzq';
    logoSup.style.position = 'fixed';
    logoSup.style.top = '0';
    logoSup.style.left = '0';
    logoSup.style.width = '100vw';
    logoSup.style.height = '8vh';
    logoSup.style.display = 'flex';
    logoSup.style.alignItems = 'center';
    logoSup.style.justifyContent = 'flex-start';
    logoSup.style.zIndex = '5000';
    logoSup.style.pointerEvents = 'none';
    // Aquí puedes poner tu logo o imagen
    //logoSup.innerHTML = '<img src="./iconos/logoaxsol.png" alt="Logo Superior Izq" style="height:80%;margin-left:24px;pointer-events:auto;">';
    // Logo inferior: config.icons["logo-inferior"]

    let logoCliente = './iconos/Phoenix-Logo.png';
    try {
      if (window.appConfig && window.appConfig.icons && window.appConfig.icons["logo-cliente"]) {
        logoCliente = './iconos/' + window.appConfig.icons["logo-cliente"];
      }
    } catch(e) {}
    const imgSup = document.createElement('img');
    imgSup.alt = 'Logo Superior Izq';
    imgSup.style.height = '80%';
    imgSup.style.marginLeft = '24px';
    imgSup.style.pointerEvents = 'auto';
    // Controlar si existe el archivo antes de asignar src
    fetch(logoCliente, {method: 'HEAD'}).then(resp => {
      if (resp.ok) imgSup.src = logoCliente;
    });
    logoSup.appendChild(imgSup);
    
    document.body.appendChild(logoSup);
  }
  // Logo inferior derecho
  let logoInf = document.getElementById('logoInferiorDer');
  if (!logoInf) {
    logoInf = document.createElement('div');
    logoInf.id = 'logoInferiorDer';
    logoInf.style.position = 'fixed';
    logoInf.style.right = '0';
    logoInf.style.bottom = '4vh';
    logoInf.style.width = '100vw';
    logoInf.style.height = '5vh';
    logoInf.style.display = 'flex';
    logoInf.style.alignItems = 'center';
    logoInf.style.justifyContent = 'flex-end';
    logoInf.style.zIndex = '5000';
    logoInf.style.pointerEvents = 'none';
    // Aquí puedes poner tu logo o imagen
    //logoInf.innerHTML = '<img src="./iconos/Phoenix-Logo.png" alt="Logo Inferior Der" style="height:80%;margin-right:32px;pointer-events:auto;">';
    // Logo inferior: config.icons["logo-inferior"]
    let logoInferior = './iconos/logoInferior.png';
    try {
      if (window.appConfig && window.appConfig.icons && window.appConfig.icons["logo-inferior"]) {
        logoInferior = './iconos/' + window.appConfig.icons["logo-inferior"];
      }
    } catch(e) {}
    const imgInf = document.createElement('img');
    imgInf.alt = 'Logo Inferior Der';
    imgInf.style.height = '130%';
    imgInf.style.marginRight = '5px';
    imgInf.style.pointerEvents = 'auto';
    // Controlar si existe el archivo antes de asignar src
    fetch(logoInferior, {method: 'HEAD'}).then(resp => {
      if (resp.ok) imgInf.src = logoInferior;
    });
    logoInf.appendChild(imgInf);
    
    document.body.appendChild(logoInf);
  }
}

// --- Agregar HUD de barras de progreso (ProgressBarHUD) ---
let progressBarHUD = null;
let progressBarHUDVisible = false;

function crearProgressBarHUD(config) {
  // Evita duplicados
  if (document.getElementById('progressBarHUDContainer')) return;
  // Crear contenedor
  const container = document.createElement('div');
  container.id = 'progressBarHUDContainer';
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.bottom = '100px'; // Por defecto, sobre la timeline
  container.style.zIndex = '2000';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);
  // Instanciar ProgressBarHUD
  import('./utils/progressBarHUD.js').then(module => {
    progressBarHUD = new module.ProgressBarHUD('progressBarHUDContainer', config.rutas['progress-bar-data-url'], config.proyecto.fecha_inicio);
    progressBarHUDVisible = true;
    // Mover logoInferior hacia arriba si existe
    //moverLogoInferiorArriba();
    // --- Agregar actualización automática con el clock de Cesium ---
    if (progressBarHUD && window.viewer && window.viewer.clock) {
      window.viewer.clock.onTick.addEventListener(function(clock) {
        progressBarHUD.update(clock.currentTime);
      });
    }
  });
}


function mostrarProgressBarHUD(config) {
  let container = document.getElementById('progressBarHUDContainer');
  if (container) {
    container.style.display = 'block';
    //moverLogoInferiorArriba();
    progressBarHUDVisible = true;
    return;
  }
  // Si no existe, crearlo
  crearProgressBarHUD(config);
}

function ocultarProgressBarHUD() {
  const hud = document.getElementById('progressBarHUDContainer');
  if (hud) hud.style.display = 'none';
   //moverLogoInferiorAbajo();
  progressBarHUDVisible = false;
}

function moverLogoInferiorArriba() {
  const logo = document.getElementById('logoInferiorDer');
  if (logo) {
    logo.style.transition = 'bottom 0.3s';
    logo.style.bottom = '220px'; // Ajusta según altura del HUD + margen
  }
}

function moverLogoInferiorAbajo() {
  const logo = document.getElementById('logoInferiorDer');
  if (logo) {
    logo.style.transition = 'bottom 0.3s';
    logo.style.bottom = '40px'; // Valor original
  }
}

