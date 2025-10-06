import React, { useMemo, useRef, useEffect } from 'react';
import { Viewer, Entity, PointGraphics } from 'resium';
import { Cartesian3, Color, Ion, Rectangle } from 'cesium';
import { Paper, Typography } from '@mui/material';

// Lee el token desde las variables de entorno de Vite
const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;

// Configura el token de acceso para Cesium una sola vez
if (CESIUM_ION_TOKEN) {
  Ion.defaultAccessToken = CESIUM_ION_TOKEN;
} else {
  console.warn('Advertencia: El token de Cesium Ion no está configurado. El mapa base puede no funcionar.');
}

const fallbackProjects = [
  {
    id: 'mock-mata-mora',
    name: 'Proyecto CPF Mata Mora',
    status: 'Operativo',
    progress_percentage: 100,
    initial_location: { lat: -37.08, lon: -68.25 },
  },
  {
    id: 'mock-anelo-norte',
    name: 'Proyecto Añelo Norte',
    status: 'Planeado',
    progress_percentage: 25,
    initial_location: { lat: -38.56, lon: -68.78 },
  },
  {
    id: 'mock-anelo-este',
    name: 'Proyecto Añelo Este',
    status: 'Planeado',
    progress_percentage: 10,
    initial_location: { lat: -38.53, lon: -68.70 },
  },
];

const GlobalMap = ({ projects }) => {
  // Si no hay token, muestra un mensaje en lugar del mapa.
  if (!CESIUM_ION_TOKEN) {
    return (
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Token de Cesium Ion no configurado en el archivo .env
        </Typography>
      </Paper>
    );
  }

  const enrichedProjects = useMemo(() => {
    const base = Array.isArray(projects) ? [...projects] : [];
    const seenNames = new Set(base.map((project) => project?.name?.toLowerCase?.()).filter(Boolean));

    fallbackProjects.forEach((mock) => {
      if (!seenNames.has(mock.name.toLowerCase())) {
        base.push(mock);
      }
    });

    return base.filter(
      (project) =>
        project?.initial_location &&
        typeof project.initial_location.lon === 'number' &&
        typeof project.initial_location.lat === 'number'
    );
  }, [projects]);

  const projectPositions = useMemo(() => {
    return enrichedProjects.map((project) => ({
      lon: project.initial_location.lon,
      lat: project.initial_location.lat,
    }));
  }, [enrichedProjects]);

  const boundingRectangle = useMemo(() => {
    if (!projectPositions.length) {
      return Rectangle.fromDegrees(-68.78, -38.6, -68.7, -38.5);
    }

    let minLon = projectPositions[0].lon;
    let maxLon = projectPositions[0].lon;
    let minLat = projectPositions[0].lat;
    let maxLat = projectPositions[0].lat;

    projectPositions.forEach(({ lon, lat }) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    const padding = 0.2;
    return Rectangle.fromDegrees(minLon - padding, minLat - padding, maxLon + padding, maxLat + padding);
  }, [projectPositions]);

  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !boundingRectangle) {
      return;
    }

    viewer.camera.flyTo({ destination: boundingRectangle, duration: 1.5 });
  }, [boundingRectangle]);

  return (
    <Paper elevation={3} sx={{ height: '100%' }}>
      <Viewer
        ref={viewerRef}
        full
        animation={false}
        timeline={false}
        baseLayerPicker={false}
      >
        {enrichedProjects.map((project) => (
          <Entity
            key={project.id ?? project.name}
            name={project.name}
            position={Cartesian3.fromDegrees(project.initial_location.lon, project.initial_location.lat)}
            description={`<p><b>${project.name}</b></p><p>Estado: ${project.status ?? 'Sin dato'}</p><p>Progreso: ${project.progress_percentage ?? 0}%</p>`}
          >
            <PointGraphics pixelSize={10} color={Color.ORANGE} />
          </Entity>
        ))}
      </Viewer>
    </Paper>
  );
};

export default GlobalMap;
