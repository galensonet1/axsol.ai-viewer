class CameraRecorder {
    constructor(viewer) {
        this.viewer = viewer;
        this.recordedPoints = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.unsubscribePostRender = null;
        this.pathEntity = null; // Para visualizar la ruta grabada
    }

    startRecording() {
        if (this.isRecording) {
            console.warn("Ya se está grabando una trayectoria.");
            return;
        }

        this.recordedPoints = [];
        this.isRecording = true;
        this.recordingStartTime = Cesium.JulianDate.now();
        console.log("Grabación iniciada...");

        // Añadir una entidad para visualizar la trayectoria en tiempo real
        this.pathEntity = this.viewer.entities.add({
            name: 'Recorded Camera Path',
            path: {
                resolution: 1, // Resolución de los segmentos de línea
                material: Cesium.Color.RED,
                width: 4
            },
            position: new Cesium.SampledPositionProperty() // Usaremos esto para añadir puntos
        });

        // Suscribirse al evento postRender para capturar la posición en cada frame
        this.unsubscribePostRender = this.viewer.scene.postRender.addEventListener(() => {
            if (this.isRecording) {
                const currentTime = Cesium.JulianDate.now();
                const position = this.viewer.camera.positionWC; // Posición en coordenadas de mundo
                const orientation = this.viewer.camera.transform; // Matriz de transformación para orientación

                const secondsElapsed = Cesium.JulianDate.secondsDifference(currentTime, this.recordingStartTime);

                // Convertir posición a Cartographic (Lat/Lon/Alt) si lo prefieres para el CZML final
                const cartographic = Cesium.Cartographic.fromCartesian(position);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                const altitude = cartographic.height;

                this.recordedPoints.push({
                    seconds: secondsElapsed,
                    position: [longitude, latitude, altitude], // Usamos cartographicDegrees para CZML
                    // Para orientación, puedes capturar la orientación completa o solo heading/pitch/roll
                    // La propiedad `orientation` en CZML es compleja, usar `velocityReference` es más simple
                    // Si necesitas orientación explícita, tendrías que grabar la orientación y exportar unitQuaternion.
                });

                // Actualizar la entidad de la ruta en tiempo real
                if (this.pathEntity && this.pathEntity.position instanceof Cesium.SampledPositionProperty) {
                    this.pathEntity.position.addSample(currentTime, position);
                }
            }
        });
    }

    stopRecording() {
        if (!this.isRecording) {
            console.warn("No se está grabando ninguna trayectoria.");
            return null;
        }

        this.isRecording = false;
        if (this.unsubscribePostRender) {
            this.unsubscribePostRender(); // Desuscribirse del evento
            this.unsubscribePostRender = null;
        }
        console.log("Grabación detenida. Puntos registrados:", this.recordedPoints.length);

        // Eliminar la entidad de la ruta visualizada (o dejarla si es útil)
        if (this.pathEntity) {
            this.viewer.entities.remove(this.pathEntity);
            this.pathEntity = null;
        }

        return this.generateCzmlPath();
    }

    getRecordedPath() {
        return this.recordedPoints;
    }

    generateCzmlPath(startIso, endIso) {
        if (this.recordedPoints.length === 0) {
            return null;
        }
        const czmlPositions = [];
        // Recalcular los segundos para que el primer punto sea 0 y el último sea endIso-startIso
        const totalDuration = (new Date(endIso) - new Date(startIso)) / 1000;
        const firstSeconds = this.recordedPoints[0].seconds;
        const lastSeconds = this.recordedPoints[this.recordedPoints.length - 1].seconds;
        this.recordedPoints.forEach((p, idx) => {
            // Escalar los segundos al rango global
            let scaledSeconds = 0;
            if (lastSeconds > 0) {
                scaledSeconds = (p.seconds - firstSeconds) * (totalDuration / (lastSeconds - firstSeconds));
            }
            czmlPositions.push(scaledSeconds);
            czmlPositions.push(...p.position);
        });
        const pathId = `recorded-path-${Date.now()}`;
        const czmlPacket = {
            id: pathId,
            name: `Recorded Path (${startIso} - ${endIso})`,
            availability: `${startIso}/${endIso}`,
            position: {
                epoch: startIso,
                cartographicDegrees: czmlPositions
            },
            orientation: {
                velocityReference: `#${pathId}`
            },
            path: {
                show: [
                    {
                        "interval": `${startIso}/${endIso}`,
                        "boolean": true
                    }
                ],
                width: 5,
                material: {
                    "solidColor": {
                        "color": {
                            "rgba": [0, 255, 0, 255]
                        }
                    }
                }
            }
        };
        const fullCzml = [
            {
                id: "document",
                name: "Recorded Camera Path Document",
                version: "1.0",
                clock: {
                    interval: `${startIso}/${endIso}`,
                    currentTime: startIso,
                    multiplier: 1,
                    range: "LOOP_STOP",
                    step: "SYSTEM_CLOCK_MULTIPLIER"
                }
            },
            czmlPacket
        ];
        return fullCzml;
    }

    exportCZML(startIso, endIso) {
        return this.generateCzmlPath(startIso, endIso);
    }
}

export { CameraRecorder };