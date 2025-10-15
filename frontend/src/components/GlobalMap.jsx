import React, { useMemo, useRef, useEffect } from 'react';
import { Viewer, Entity } from 'resium';
import { Cartesian3, Color, Ion, IonResource, Rectangle, PinBuilder, GeoJsonDataSource as CesiumGeoJsonDataSource } from 'cesium';
import * as Cesium from 'cesium';
import { Paper, Typography } from '@mui/material';
import useApi from '../hooks/useApi';

const CESIUM_TOKEN_READY = Boolean(Ion.defaultAccessToken);

// Rectangle mínimo para el mapa global (cubre Argentina)
const MIN_RECTANGLE = {
  minLon: -75,
  maxLon: -53,
  minLat: -55,
  maxLat: -20,
};

const GlobalMap = () => {
  const { data: projectsData, loading, error } = useApi('/projects');
  const projects = useMemo(() => {
    if (Array.isArray(projectsData)) {
      return projectsData;
    }
    if (projectsData?.data) {
      return Array.isArray(projectsData.data) ? projectsData.data : [];
    }
    return [];
  }, [projectsData]);

  console.log('[GlobalMap] Hook state', { loading, error, projectsCount: projects.length });

  if (!CESIUM_TOKEN_READY) {
    return (
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Token de Cesium Ion no configurado
        </Typography>
      </Paper>
    );
  }

  const pinBuilderRef = useRef(new PinBuilder());

  const enrichedProjects = useMemo(() => {
    console.log('[GlobalMap] Procesando proyectos para mapa', projects);

    const today = new Date();
    const pinBuilder = pinBuilderRef.current;
    const defaultAccent = '#FF6B00';

    const normalizeLocation = (raw) => {
      if (!raw) return null;
      let location = raw;
      if (typeof location === 'string') {
        try {
          location = JSON.parse(location);
        } catch (parseError) {
          console.warn('[GlobalMap] No se pudo parsear initial_location', raw, parseError);
          return null;
        }
      }

      const lat = Number(location.lat ?? location.latitude);
      const lng = Number(location.lng ?? location.lon ?? location.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }

      return { lat, lng };
    };

    const normalizeAccent = (project) => {
      const palette = project?.opcions?.branding?.colorPalette;
      const accent = palette?.accent || palette?.primary || palette?.secondary || defaultAccent;
      try {
        // Validar que Cesium pueda interpretar el color
        Color.fromCssColorString(accent);
        return accent;
      } catch {
        return defaultAccent;
      }
    };

    return projects
      .map((project) => {
        const location = normalizeLocation(project.initial_location);
        if (!location) {
          return null;
        }

        let status = 'Sin estado';
        let progress_percentage = 0;

        if (project.start_date && project.end_date) {
          const start = new Date(project.start_date);
          const end = new Date(project.end_date);

          if (today < start) {
            status = 'Planeado';
            progress_percentage = 0;
          } else if (today > end) {
            status = 'Ejecutado';
            progress_percentage = 100;
          } else {
            status = 'En Ejecución';
            const totalDays = (end - start) / (1000 * 60 * 60 * 24);
            const elapsedDays = (today - start) / (1000 * 60 * 60 * 24);
            progress_percentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
          }
        }

        const accent = normalizeAccent(project);
        let billboardImage = null;
        try {
          const color = Color.fromCssColorString(accent);
          billboardImage = pinBuilder.fromColor(color, 48);
        } catch (pinError) {
          console.warn('[GlobalMap] No se pudo crear pin con color', accent, pinError);
          billboardImage = pinBuilder.fromColor(Color.fromCssColorString(defaultAccent), 48);
        }

        const enriched = {
          ...project,
          status,
          progress_percentage: Math.round(progress_percentage),
          initial_location: location,
          accentColor: accent,
          billboardImage,
        };
        console.log('[GlobalMap] Proyecto enriquecido', enriched);
        return enriched;
      })
      .filter(Boolean);
  }, [projects]);

  const projectPositions = useMemo(() => {
    console.log('[GlobalMap] Calculando posiciones para proyectos', enrichedProjects);

    const positions = enrichedProjects.map((project) => ({
      lon: project.initial_location.lng,
      lat: project.initial_location.lat,
    }));
    console.log('[GlobalMap] Posiciones calculadas', positions);
    return positions;
  }, [enrichedProjects]);

  const boundingRectangle = useMemo(() => {
    console.log('[GlobalMap] Calculando boundingRectangle a partir de posiciones', projectPositions);

    let minLon = MIN_RECTANGLE.minLon;
    let maxLon = MIN_RECTANGLE.maxLon;
    let minLat = MIN_RECTANGLE.minLat;
    let maxLat = MIN_RECTANGLE.maxLat;

    projectPositions.forEach(({ lon, lat }) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);
  }, [projectPositions]);

  const viewerRef = useRef(null);
  const baseLayerDataSourceRef = useRef(null);
  const baseLayerLoadAttemptedRef = useRef(false);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !boundingRectangle) {
      return;
    }

    viewer.camera.flyTo({ destination: boundingRectangle, duration: 1.5 });
  }, [boundingRectangle]);

  useEffect(() => {
    let cancelled = false;
    let rafId = null;

    const loadBaseLayer = async () => {
      if (cancelled || baseLayerLoadAttemptedRef.current) {
        return;
      }

      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) {
        console.log('[GlobalMap] Viewer no listo, reintentando baseLayer');
        if (!cancelled) {
          rafId = requestAnimationFrame(loadBaseLayer);
        }
        return;
      }

      baseLayerLoadAttemptedRef.current = true;

      try {
        console.log('[GlobalMap] Solicitando IonResource asset 3910559');
        const resource = await IonResource.fromAssetId(3910559);
        if (cancelled) return;

        console.log('[GlobalMap] Cargando GeoJsonDataSource desde resource', resource);
        let dataSource = null;
        try {
          if (CesiumGeoJsonDataSource && typeof CesiumGeoJsonDataSource.load === 'function') {
            dataSource = await CesiumGeoJsonDataSource.load(resource, {
              stroke: Color.fromCssColorString('#FF6B00'),
              fill: Color.fromAlpha(Color.fromCssColorString('#FF6B00'), 0.25),
              strokeWidth: 2,
            });
          } else {
            throw new Error('CesiumGeoJsonDataSource.load not available');
          }
        } catch (primaryLoadError) {
          console.warn('[GlobalMap] Fallback: usando Cesium.GeoJsonDataSource', primaryLoadError);
          if (Cesium?.GeoJsonDataSource?.load) {
            dataSource = await Cesium.GeoJsonDataSource.load(resource, {
              stroke: Color.fromCssColorString('#FF6B00'),
              fill: Color.fromAlpha(Color.fromCssColorString('#FF6B00'), 0.25),
              strokeWidth: 2,
            });
          } else if (typeof Cesium?.GeoJsonDataSource === 'function') {
            const ds = new Cesium.GeoJsonDataSource('base-layer');
            await ds.load(resource, {
              stroke: Color.fromCssColorString('#FF6B00'),
              fill: Color.fromAlpha(Color.fromCssColorString('#FF6B00'), 0.25),
              strokeWidth: 2,
            });
            dataSource = ds;
          } else {
            throw primaryLoadError;
          }
        }

        if (cancelled) {
          dataSource.destroy?.();
          return;
        }

        baseLayerDataSourceRef.current = dataSource;
        await viewer.dataSources.add(dataSource);
        viewer.scene.requestRender();
        try {
          console.log('[GlobalMap] Ejecutando zoomTo sobre baseLayer');
          await viewer.zoomTo(dataSource);
          console.log('[GlobalMap] zoomTo completado');
        } catch (zoomError) {
          console.warn('[GlobalMap] No se pudo hacer zoom al baseLayer:', zoomError);
        }
      } catch (error) {
        console.error('[GlobalMap] Error cargando capa base Ion 3910559:', error);
        baseLayerLoadAttemptedRef.current = false;
      }
    };

    loadBaseLayer();

    return () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      const viewer = viewerRef.current?.cesiumElement;
      if (viewer && baseLayerDataSourceRef.current) {
        viewer.dataSources.remove(baseLayerDataSourceRef.current, true);
        baseLayerDataSourceRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Cargando proyectos...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">
          Error al cargar proyectos: {error}
        </Typography>
      </Paper>
    );
  }

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
            position={Cartesian3.fromDegrees(project.initial_location.lng, project.initial_location.lat)}
            description={`<div><p><b>${project.name}</b></p><p>Estado: ${project.status}</p><p>Progreso: ${project.progress_percentage}%</p><p>${project.description ?? ''}</p><p>Permiso: ${project.permission_level ?? '—'}</p></div>`}
            billboard={{
              image: project.billboardImage,
              width: 40,
              height: 40,
            }}
          />
        ))}
      </Viewer>
    </Paper>
  );
};

export default GlobalMap;
