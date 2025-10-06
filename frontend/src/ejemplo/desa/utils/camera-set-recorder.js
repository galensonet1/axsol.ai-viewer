// CameraSetRecorder.js
// Herramienta para grabar sets de cámaras con duración, transición y availability

export class CameraSetRecorder {
  constructor(viewer) {
    this.viewer = viewer;
    this.camaras = [];
    this.availability = null;
  }

  setAvailability(isoRange) {
    this.availability = isoRange;
  }

  addCurrentCamera(nombre = "") {
    const camera = this.viewer.camera;
    const carto = Cesium.Cartographic.fromCartesian(camera.positionWC);
    const position = [
      Cesium.Math.toDegrees(carto.longitude),
      Cesium.Math.toDegrees(carto.latitude),
      carto.height
    ];
    const orientation = {
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll)
    };
    this.camaras.push({
      nombre: nombre || `Camara ${this.camaras.length + 1}`,
      position,
      orientation,
      duracion: 5,
      transicion: 2
    });
  }

  updateCamera(idx, data) {
    if (this.camaras[idx]) {
      this.camaras[idx] = { ...this.camaras[idx], ...data };
    }
  }

  removeCamera(idx) {
    this.camaras.splice(idx, 1);
  }

  exportJSON() {
    return {
      availability: this.availability,
      camaras: this.camaras
    };
  }

  clear() {
    this.camaras = [];
    this.availability = null;
  }
}
