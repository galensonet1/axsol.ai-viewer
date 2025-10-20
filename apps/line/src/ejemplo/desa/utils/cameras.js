// cameras.js

// Definición de Puntos de Vista de la Cámara
const cameraViewpoints = [];

// --- Funciones para Definir Cámaras ---
// Puedes usar estas funciones para organizar tus cámaras o añadirlas directamente al array.

// Cámaras alrededor de una ubicación central (ejemplo: la obra)
// Puedes ajustar 'centerLong', 'centerLat', 'baseHeight' a las coordenadas aproximadas de tu obra.
function addAroundCameras(centerLong, centerLat, baseHeight) {
  const radius = 300.0; // Distancia de la cámara al centro
  const numAround = 6; // Número de cámaras alrededor
  const orbitalHeight = baseHeight + 100; // Altura sobre la base

  for (let i = 0; i < numAround; i++) {
    const angle = (i / numAround) * 2 * Math.PI;
    const currentLong = centerLong + (radius / 111320) * Math.cos(angle); // Aproximación de grados a metros
    const currentLat = centerLat + (radius / 111320) * Math.sin(angle);

    cameraViewpoints.push({
      name: `Around Camera ${i + 1}`,
      destination: Cesium.Cartesian3.fromDegrees(currentLong, currentLat, orbitalHeight),
      orientation: {
        heading: Cesium.Math.toRadians(270 - (angle * 180 / Math.PI)), // Ajusta para mirar hacia el centro
        pitch: Cesium.Math.toRadians(-25.0), // Mira 25 grados hacia abajo
        roll: 0.0,
      },
      duration: 3,
      flyToDuration: 2,
    });
    console.log(`Cámara añadida: ${cameraViewpoints[cameraViewpoints.length - 1].name} a ${currentLat}, ${currentLong}, altura ${orbitalHeight}`);
  }

  // Cámara cenital sobre el centro
  cameraViewpoints.push({
    name: "Cenital View",
    destination: Cesium.Cartesian3.fromDegrees(centerLong, centerLat, baseHeight + 350), // 1000m sobre el centro
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0), // Directamente hacia abajo
      roll: 0.0,
    },
    duration: 3,
    flyToDuration: 4,
  });
}

// Cámaras internas (DEBES AJUSTAR ESTAS COORDENADAS)
function addInternalCameras() {
  // --- EJEMPLOS DE CÁMARAS INTERNAS ---
  // Reemplaza estas coordenadas con las ubicaciones reales dentro de tu obra.
  // Usa Cesium Inspector (F12 en el navegador, luego Console, y mueve la cámara para obtener las coordenadas)
  // o tu conocimiento del modelo 3D.
  //const approximateCenterLong = -68.32035; // 38.499 Ejemplo de longitud central de tu obra
  //const approximateCenterLat = -38.49983;   // Ejemplo de latitud central de tu obra
  //const approximateBaseHeight = 460;     // Ejemplo de altura base de tu obra

  // Cámara Interna 1: Nivel bajo
  cameraViewpoints.push({
    name: "Interior View 1 (Low)",
    destination: Cesium.Cartesian3.fromDegrees(-68.3208, -38.50024, 490), // Ajusta Long, Lat, Height
    orientation: {
      heading: Cesium.Math.toRadians(45.0),  // Mira hacia el Noreste
      pitch: Cesium.Math.toRadians(-10.0), // Ligeramente hacia abajo
      roll: 0.0,
    },
    duration: 3,
    flyToDuration: 4,
  });

  // Cámara Interna 2: Nivel medio
  cameraViewpoints.push({
    name: "Interior View 2 (Mid)",
    destination: Cesium.Cartesian3.fromDegrees(-68.32023, -38.49928, 490), // Ajusta
    orientation: {
      heading: Cesium.Math.toRadians(180.0), // Mira hacia el Sur
      pitch: Cesium.Math.toRadians(-25.0),
      roll: 0.0,
    },
    duration: 3,
    flyToDuration: 4,
  });

  // Cámara Interna 3: Nivel alto
  cameraViewpoints.push({
    name: "Interior View 3 (High)",
    destination: Cesium.Cartesian3.fromDegrees(-68.31958, -38.4998, 460), // Ajusta
    orientation: {
      heading: Cesium.Math.toRadians(270.0), // Mira hacia el Oeste
      pitch: Cesium.Math.toRadians(-10.0), // Mirando hacia abajo
      roll: 0.0,
    },
    duration: 3,
    flyToDuration: 4,
  });

  // Cámara Interna 4: Nivel alto
  cameraViewpoints.push({
    name: "Interior View 4 (High)",
    destination: Cesium.Cartesian3.fromDegrees(-68.3218, -38.4995, 470), // Ajusta
    orientation: {
      heading: Cesium.Math.toRadians(90), // Mira hacia el Oeste
      pitch: Cesium.Math.toRadians(-10.0), // Mirando hacia abajo
      roll: 0.0,
    },
    duration: 3,
    flyToDuration: 4,
  });
}

// --- Parámetros y Estado del Tour ---
let currentCameraIndex = 0;
let isTourActive = false;
let tourTimeout; // Para el temporizador de la duración de la vista

// Necesitamos una referencia al viewer de Cesium que se pasará desde app.js
let cesiumViewer;

// --- Función para Iniciar el Recorrido de Cámaras ---
function startCameraTour(viewer, transitionTimeBetweenCameras = 2) {
  cesiumViewer = viewer; // Guardar la referencia al viewer

  if (cameraViewpoints.length === 0) {
    console.warn("No hay puntos de vista de cámara definidos para el recorrido.");
    return;
  }

  isTourActive = true;
  console.log("Iniciando recorrido de cámaras...");
  playNextCameraView(transitionTimeBetweenCameras);
}

function playNextCameraView(transitionTimeBetweenCameras) {
  if (!isTourActive || !cesiumViewer) return;

  const currentView = cameraViewpoints[currentCameraIndex];
  console.log(`Volando a: ${currentView.name} (Cámara ${currentCameraIndex + 1}/${cameraViewpoints.length})`);

  cesiumViewer.camera.flyTo({
    destination: currentView.destination,
    orientation: currentView.orientation,
    duration: currentView.flyToDuration !== undefined ? currentView.flyToDuration : transitionTimeBetweenCameras,
    complete: function () {
      tourTimeout = setTimeout(() => {
        currentCameraIndex++;
        if (currentCameraIndex >= cameraViewpoints.length) {
          currentCameraIndex = 0; // Bucle: volver al inicio
        }
        playNextCameraView(transitionTimeBetweenCameras);
      }, currentView.duration * 1000);
    },
    cancel: function () {
      console.warn(`Vuelo a ${currentView.name} cancelado.`);
    }
  });
}

// --- Función para Detener el Recorrido de Cámaras ---
function stopCameraTour() {
  isTourActive = false;
  clearTimeout(tourTimeout);
  if (cesiumViewer) {
    cesiumViewer.camera.cancelFlight();
  }
  console.log("Recorrido de cámaras detenido.");
}

// Exportar las funciones y variables necesarias para que app.js pueda acceder a ellas
export {
  cameraViewpoints,
  addAroundCameras,
  addInternalCameras,
  startCameraTour,
  stopCameraTour,
  isTourActive // Exportar el estado si lo necesitas para alguna lógica externa
};