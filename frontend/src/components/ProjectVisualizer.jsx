import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Box, CircularProgress } from '@mui/material';
import { Viewer, GeoJsonDataSource as ResiumGeoJsonDataSource } from 'resium';
import {
  Color,
  Ion,
  JulianDate,
  Cesium3DTileset,
  Cesium3DTileStyle,
  TimeIntervalCollection,
  TimeInterval,
  ClockRange,
  createWorldTerrainAsync,
  CzmlDataSource as CesiumCzmlDataSource,
  Terrain,
  CesiumTerrainProvider,
  ScreenSpaceEventType,
  Cartographic,
  Cartesian3,
  Math as CesiumMath,
  SplitDirection,
  Matrix4,
  sampleTerrainMostDetailed,
  IonResource,
  GeoJsonDataSource as CesiumGeoJsonDataSource,
  BoundingSphere,
  HeadingPitchRange,
} from 'cesium';
import useLayerData from '../hooks/useCzmlData';
import useAssetDates from '../hooks/useAssetDates';
import { useCesium } from 'resium';
import './ProjectVisualizer.css';
import LayerSelector from './LayerSelector';
import ViewerToolBar from './ViewerToolBar';
import InfoBox from './InfoBox';
import ComparisonModal from './ComparisonModal';
import useApi from '../hooks/useApi';
import api from '../config/api';
import { API_BASE_URL } from '../config/api';

class TilesetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.warn('[TilesetErrorBoundary] Captured error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const cloneJulianDate = (value) => {
  if (value && typeof value.clone === 'function') {
    return value.clone();
  }
  return undefined;
};

const captureClockState = (viewer) => {
  if (!viewer?.clock) {
    return null;
  }

  const { clock } = viewer;
  return {
    currentTime: cloneJulianDate(clock.currentTime),
    startTime: cloneJulianDate(clock.startTime),
    stopTime: cloneJulianDate(clock.stopTime),
    minimumTime: cloneJulianDate(clock.minimumTime),
    maximumTime: cloneJulianDate(clock.maximumTime),
    multiplier: clock.multiplier,
    shouldAnimate: clock.shouldAnimate,
    clockRange: clock.clockRange,
  };
};

const restoreClockState = (viewer, state) => {
  if (!viewer?.clock || !state) {
    return;
  }

  const { clock } = viewer;
  if (state.startTime) {
    clock.startTime = state.startTime.clone();
  }
  if (state.stopTime) {
    clock.stopTime = state.stopTime.clone();
  }
  if (state.minimumTime) {
    clock.minimumTime = state.minimumTime.clone();
  }
  if (state.maximumTime) {
    clock.maximumTime = state.maximumTime.clone();
  }
  if (state.currentTime) {
    clock.currentTime = state.currentTime.clone();
  }
  if (typeof state.multiplier === 'number') {
    clock.multiplier = state.multiplier;
  }
  if (typeof state.shouldAnimate === 'boolean') {
    clock.shouldAnimate = state.shouldAnimate;
  }
  if (state.clockRange !== undefined) {
    clock.clockRange = state.clockRange;
  }
};

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN;
if (CESIUM_ION_TOKEN) {
  Ion.defaultAccessToken = CESIUM_ION_TOKEN;
}

const formatClockDate = (julianDate) => {
  if (!julianDate) {
    return '';
  }

  const date = JulianDate.toDate(julianDate);

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Función para sincronizar fecha con el reloj de Cesium
const syncDateWithClock = (viewer, dateInput) => {
  if (!viewer || !dateInput) return;
  
  try {
    let selectedDate;
    
    // Manejar diferentes formatos de entrada
    if (typeof dateInput === 'string') {
      // Si es string, verificar si es formato YYYY-MM-DD o ISO completo
      if (dateInput.includes('T')) {
        // Es un ISO string completo, extraer solo la fecha
        selectedDate = new Date(dateInput.split('T')[0] + 'T12:00:00Z');
      } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Es formato YYYY-MM-DD
        selectedDate = new Date(`${dateInput}T12:00:00Z`);
      } else {
        // Intentar parsear directamente
        selectedDate = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      // Si es un objeto Date, usarlo directamente pero ajustar a mediodía UTC
      selectedDate = new Date(dateInput.toISOString().split('T')[0] + 'T12:00:00Z');
    } else {
      console.warn('[ProjectVisualizer] Tipo de fecha no soportado:', typeof dateInput, dateInput);
      return;
    }
    
    if (isNaN(selectedDate.getTime())) {
      console.warn('[ProjectVisualizer] Fecha inválida después del procesamiento:', dateInput, selectedDate);
      return;
    }

    const selectedJulian = JulianDate.fromDate(selectedDate);
    viewer.clock.currentTime = selectedJulian.clone();
    viewer.clock.shouldAnimate = false;
    
    console.log(`[ProjectVisualizer] Reloj sincronizado a: ${selectedDate.toISOString()}`);
  } catch (error) {
    console.error('[ProjectVisualizer] Error sincronizando fecha:', error, dateInput);
  }
};

// Función para obtener el viewer actual (fallback)
const getCurrentViewer = (viewerRef, cesiumViewer) => {
  if (cesiumViewer) return cesiumViewer;
  
  const refViewer = viewerRef.current?.cesiumElement;
  if (refViewer) {
    console.log('[ProjectVisualizer] Usando viewer desde ref como fallback');
    return refViewer;
  }
  
  return null;
};

const formatIsoDayLabel = (isoDay) => {
  if (!isoDay) {
    return '';
  }

  const date = new Date(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

const ProjectVisualizer = () => {
  const {
    projectId,
    layoutData,
    projectData,
    config,
    externalAssets,
    projectLoading,
    configLoading,
    projectError,
    configError,
    loadedCzml,
  } = useProject();

  const viewerRef = useRef(null);
  const baseMapDataSourceRef = useRef(null);
  const imagesPrefetchedRef = useRef(false);
  const watermarkLogoRaw = import.meta.env.VITE_WATERMARK_LOGO || '/logo-axsol-ai.svg';
  const watermarkLogo = useMemo(() => {
    if (!watermarkLogoRaw) return '/logo-axsol-ai.svg';
    // If it's an absolute URL
    if (/^https?:\/\//i.test(watermarkLogoRaw)) return watermarkLogoRaw;
    // If it's an absolute filesystem path that includes /frontend/public/, strip until public
    const idx = watermarkLogoRaw.indexOf('/frontend/public/');
    if (idx !== -1) {
      const rel = watermarkLogoRaw.substring(idx + '/frontend/public'.length);
      return rel.startsWith('/') ? rel : `/${rel}`;
    }
    // If it already starts with '/', assume it's under Vite public
    if (watermarkLogoRaw.startsWith('/')) return watermarkLogoRaw;
    // Fallback: treat as relative to public root
    return `/${watermarkLogoRaw}`;
  }, [watermarkLogoRaw]);
  const [layerVisibility, setLayerVisibility] = useState({
    layout: false,
    realidad3D: true,
    realidadClamped: false,
    realidadOpacity: 100,
    proyecto3D: true,
    fotos: false,
    fotos360: false,
    plan: false,
    baseMap: false,
    ifcs: {},
    terreno: 20, // Opacidad del terreno en porcentaje (0-100)
  });
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [clockLabel, setClockLabel] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [terrainProvider, setTerrainProvider] = useState(null);
  const [selectedCaptureDate, setSelectedCaptureDate] = useState(null);
  const [cesiumViewer, setCesiumViewer] = useState(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [layerPanelOpenBeforeComparison, setLayerPanelOpenBeforeComparison] = useState(true);
  const [ifcHeightOffset, setIfcHeightOffset] = useState(0);
  const [measureMode, setMeasureMode] = useState('none');
  const [measurePoints, setMeasurePoints] = useState([]); // puntos en curso
  const measurePreviewRef = useRef({ line: null, polygon: null, label: null });
  const [measureLines, setMeasureLines] = useState([]);   // [{polyline,label}]
  const [measureAreas, setMeasureAreas] = useState([]);   // [{polygon,label}]

  // Sincronizar offset de IFC desde projectData.opcions
  useEffect(() => {
    const offset = projectData?.opcions?.ifcHeightOffset;
    if (typeof offset === 'number' && !Number.isNaN(offset)) {
      setIfcHeightOffset(offset);
    }
  }, [projectData?.opcions?.ifcHeightOffset]);

  const tilesetLayer = useLayerData(projectId, '3dtile');
  const imagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const images360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });
  const { availableDates: availableCaptureDates, isLoading: datesLoading } = useAssetDates(projectId);
  const hasActivityPlan = useMemo(() => Boolean(projectData?.weekly_construction_plan), [projectData?.weekly_construction_plan]);
  const planUrl = useMemo(() => {
    try {
      const raw = projectData?.weekly_construction_plan;
      if (raw && typeof raw === 'string') {
        if (/^https?:\/\//i.test(raw)) return raw;
        // Asegurar URL absoluta al backend
        return `${API_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
      }
      if (projectId) {
        return `${API_BASE_URL}/api/projects/${projectId}/weekly-plan`;
      }
    } catch {}
    return null;
  }, [projectData?.weekly_construction_plan, projectId]);

  const projectPolygonFeature = useMemo(() => {
    const normalizePolygon = (value) => {
      if (!value) return null;
      let parsed = value;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch (error) {
          console.warn('[ProjectVisualizer] No se pudo parsear project_polygon_geojson:', error);
          return null;
        }
      }

      if (parsed?.type === 'FeatureCollection') {
        return parsed.features?.find((feature) => feature?.geometry) || null;
      }

      if (parsed?.type === 'Feature' && parsed.geometry) {
        return parsed;
      }

      if (parsed?.type && parsed?.coordinates) {
        return {
          type: 'Feature',
          properties: {},
          geometry: parsed,
        };
      }

      return null;
    };

    return normalizePolygon(projectData?.project_polygon_geojson || projectData?.polygon_geojson);
  }, [projectData?.project_polygon_geojson, projectData?.polygon_geojson]);

  const projectPolygonPositions = useMemo(() => {
    if (!projectPolygonFeature?.geometry) return [];

    const positions = [];
    const pushRing = (ring) => {
      if (!Array.isArray(ring)) return;
      ring.forEach((pt) => {
        if (!Array.isArray(pt) || pt.length < 2) return;
        const [lon, lat, h = 0] = pt;
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
          positions.push(Cartesian3.fromDegrees(lon, lat, h));
        }
      });
    };

    const { geometry } = projectPolygonFeature;
    if (geometry.type === 'Polygon') {
      const [outer, ..._] = geometry.coordinates || [];
      pushRing(outer);
    } else if (geometry.type === 'MultiPolygon') {
      (geometry.coordinates || []).forEach((poly) => {
        const [outer, ...__] = poly || [];
        pushRing(outer);
      });
    }

    return positions;
  }, [projectPolygonFeature]);

  const projectPolygonBoundingSphere = useMemo(() => {
    if (!projectPolygonPositions || projectPolygonPositions.length === 0) return null;
    try {
      return BoundingSphere.fromPoints(projectPolygonPositions);
    } catch (e) {
      console.warn('[ProjectVisualizer] No se pudo calcular BoundingSphere del polígono:', e);
      return null;
    }
  }, [projectPolygonPositions]);

  useEffect(() => {
    console.log('[ProjectVisualizer] useEffect baseMap disparado', {
      baseMap: layerVisibility.baseMap,
      hasCesiumViewer: Boolean(cesiumViewer),
      hasViewerRef: Boolean(viewerRef.current?.cesiumElement),
    });

    const viewer = viewerRef.current?.cesiumElement || cesiumViewer;
    if (!viewer) {
      console.log('[ProjectVisualizer] baseMap: viewer no disponible aún');
      return;
    }

    let cancelled = false;

    const removeBaseMap = (destroy = true) => {
      const dataSource = baseMapDataSourceRef.current;
      if (!dataSource) return;
      try {
        viewer.dataSources.remove(dataSource, destroy);
        console.log('[ProjectVisualizer] baseMap removido del viewer', { destroy });
      } catch (err) {
        console.warn('[ProjectVisualizer] No se pudo remover baseMap:', err);
      }
      if (destroy) {
        try { dataSource.destroy?.(); } catch {}
      }
      baseMapDataSourceRef.current = null;
      try { viewer.scene?.requestRender?.(); } catch {}
    };

    if (!layerVisibility.baseMap) {
      console.log('[ProjectVisualizer] baseMap desactivado, removiendo datasource');
      removeBaseMap(true);
      return () => { cancelled = true; };
    }

    const loadBaseMap = async () => {
      try {
        console.log('[ProjectVisualizer] Solicitando IonResource 3910570');
        const resource = await IonResource.fromAssetId(3910570);
        if (cancelled) return;

        console.log('[ProjectVisualizer] Cargando GeoJsonDataSource Areas Nqn - Oil&Gas');
        const dataSource = await CesiumGeoJsonDataSource.load(resource, {
          stroke: Color.fromCssColorString('#2E7D32'),
          fill: Color.fromAlpha(Color.fromCssColorString('#2E7D32'), 0.2),
          strokeWidth: 2,
        });

        if (cancelled) {
          dataSource.destroy?.();
          return;
        }

        baseMapDataSourceRef.current = dataSource;
        await viewer.dataSources.add(dataSource);
        console.log('[ProjectVisualizer] GeoJsonDataSource agregado al viewer');
        viewer.scene?.requestRender?.();
      } catch (error) {
        console.error('[ProjectVisualizer] Error cargando capa base (asset 3910570):', error);
        baseMapDataSourceRef.current = null;
      }
    };

    loadBaseMap();

    return () => {
      cancelled = true;
      removeBaseMap(true);
      console.log('[ProjectVisualizer] Cleanup baseMap useEffect ejecutado');
    };
  }, [layerVisibility.baseMap, cesiumViewer]);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement || cesiumViewer;
    if (!viewer || !projectPolygonBoundingSphere) {
      return;
    }

    const flyToPolygon = () => {
      try {
        const offset = new HeadingPitchRange(0, -CesiumMath.toRadians(45), projectPolygonBoundingSphere.radius * 2.5);
        viewer.camera.flyToBoundingSphere(projectPolygonBoundingSphere, {
          duration: 2,
          offset,
        });
      } catch (error) {
        console.warn('[ProjectVisualizer] Error ejecutando flyToBoundingSphere:', error);
      }
    };

    flyToPolygon();

    const command = viewer?.homeButton?.viewModel?.command;
    const handler = (event) => {
      if (event) {
        event.cancel = true;
      }
      flyToPolygon();
    };

    if (command?.beforeExecute) {
      command.beforeExecute.addEventListener(handler);
    }

    return () => {
      if (command?.beforeExecute) {
        command.beforeExecute.removeEventListener(handler);
      }
    };
  }, [projectPolygonBoundingSphere, cesiumViewer]);

  // Debug: verificar projectId
  useEffect(() => {
    console.log('[ProjectVisualizer] Componente inicializado con projectId:', projectId);
  }, [projectId]);

  // Manejar colapso del LayerSelector principal cuando se abre el modal de comparación
  useEffect(() => {
    if (comparisonModalOpen) {
      // Guardar el estado actual del panel antes de colapsarlo
      setLayerPanelOpenBeforeComparison(layerPanelOpen);
      // Colapsar el LayerSelector principal
      setLayerPanelOpen(false);
      console.log('[ProjectVisualizer] LayerSelector principal colapsado para modo comparación');
    } else {
      // Restaurar el estado anterior del panel al cerrar el modal
      setLayerPanelOpen(layerPanelOpenBeforeComparison);
      console.log('[ProjectVisualizer] LayerSelector principal restaurado');
    }
  }, [comparisonModalOpen]);

  const tilesetMetadata = tilesetLayer.layerData;
  const imagesCzml = imagesLayer.layerData;
  const images360Czml = images360Layer.layerData;
  const requestImagesLayer = imagesLayer.triggerFetch;
  const requestImages360Layer = images360Layer.triggerFetch;
  // IFCs del proyecto para Proyecto 3D
  const { data: ifcResponse } = useApi(projectId ? `/projects/${projectId}/ifc` : null);
  const ifcList = ifcResponse?.data || [];
  const projectIfcMetadata = useMemo(() =>
    (Array.isArray(ifcList) ? ifcList : []).filter((it) => it.asset_id).map((it) => ({ asset_id: it.asset_id, name: it.file_name })),
  [ifcList]);
  const visibleIfcMetadata = useMemo(() => {
    const map = layerVisibility.ifcs || {};
    if (!layerVisibility.proyecto3D) return [];
    return projectIfcMetadata.filter((it) => !!map[it.asset_id]);
  }, [layerVisibility.proyecto3D, layerVisibility.ifcs, projectIfcMetadata]);

  useEffect(() => {
    if (!Array.isArray(ifcList) || ifcList.length === 0) return;
    const currentMap = layerVisibility.ifcs || {};
    if (Object.keys(currentMap).length > 0) return;
    const newMap = {};
    for (const it of ifcList) {
      if (it.asset_id) newMap[it.asset_id] = true;
    }
    if (Object.keys(newMap).length === 0) return;
    setLayerVisibility((prev) => ({
      ...prev,
      proyecto3D: true,
      ifcs: newMap,
    }));
  }, [ifcList]);

  // Función para inicializar el viewer cuando esté listo
  const handleViewerReady = (viewer) => {
    console.log('[ProjectVisualizer] Viewer ready:', viewer);
    setCesiumViewer(viewer);
    
    // Exponer el viewer globalmente para InfoBox
    window.cesiumViewer = viewer;
    window.Cesium = window.Cesium || viewer.cesium || Cesium;

    try {
      cesiumViewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
      cesiumViewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);

      const pickCartesian = (pos) => {
        let cartesian = null;
        try { cartesian = cesiumViewer.scene.pickPosition(pos); } catch {}
        if (!cartesian) {
          try { cartesian = cesiumViewer.camera.pickEllipsoid(pos); } catch {}
        }
        return cartesian;
      };

      cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
        if (measureMode !== 'none') {
          // Solo permitir puntos sobre 3D Tiles (IFC/tileset)
          const picked = cesiumViewer.scene.pick(event.position);
          const isTileFeature = picked && typeof picked.getPropertyIds === 'function';
          if (!isTileFeature) return;
          const cart = pickCartesian(event.position);
          if (!cart) return;
          setMeasurePoints((prev) => [...prev, cart]);
          // Para línea: finalizar con 2 puntos automáticamente
          if (measureMode === 'line') {
            setTimeout(() => finalizeLineMeasurement(), 0);
          }
          return;
        }

        const pickedObject = cesiumViewer.scene.pick(event.position);
        if (pickedObject) {
          if (pickedObject.id) {
            handleElementSelection(pickedObject.id);
          } else if (typeof pickedObject.getPropertyIds === 'function' || typeof pickedObject.getPropertyNames === 'function') {
            const meta = extractCesiumFeatureMetadata(pickedObject);
            if (meta) {
              console.log('[ProjectVisualizer] Feature seleccionado, metadata:', meta);
              setSelectedElement(meta);
            }
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK);

      cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction(() => {
        if (measureMode === 'area' && measurePoints.length >= 3) {
          finalizeAreaMeasurement();
        }
      }, ScreenSpaceEventType.RIGHT_CLICK);

    } catch (error) {
      console.error('[ProjectVisualizer] Error configurando event handler:', error);
    }

    // También configurar selectedEntityChanged como respaldo
    try {
      viewer.selectedEntityChanged.addEventListener((selectedEntity) => {
        console.log('🔥 selectedEntityChanged disparado:', selectedEntity);
        if (selectedEntity) {
          handleElementSelection(selectedEntity);
        } else {
          setSelectedElement(null);
        }
      });
      console.log('[ProjectVisualizer] selectedEntityChanged listener configurado');
    } catch (error) {
      console.error('[ProjectVisualizer] Error configurando selectedEntityChanged:', error);
    }
  };

  // Funciones auxiliares para extraer propiedades
  const getPropertyValue = (props, key) => {
    try {
      return props[key]?.getValue?.() || props[key];
    } catch (e) {
      return null;
    }
  };

  const extractCesiumFeatureMetadata = (feature) => {
    if (!feature) return null;

    try {
      const propertyNames = typeof feature.getPropertyNames === 'function'
        ? feature.getPropertyNames()
        : typeof feature.getPropertyIds === 'function'
          ? feature.getPropertyIds()
          : [];

      const properties = {};
      propertyNames.forEach((name) => {
        try {
          properties[name] = typeof feature.getProperty === 'function'
            ? feature.getProperty(name)
            : feature[name];
        } catch (err) {
          try {
            properties[name] = feature[name];
          } catch {}
        }
      });

      const name = (typeof feature.getProperty === 'function' && (feature.getProperty('nombre') || feature.getProperty('name'))) || feature.id || 'Elemento';
      return {
        type: 'geojson',
        data: {
          name,
          properties,
        },
        entity: feature.id,
      };
    } catch (error) {
      console.warn('[ProjectVisualizer] No se pudo extraer metadata del feature Cesium:', error);
      return null;
    }
  };

  // Función para extraer URL de imagen desde la descripción HTML
  const extractImageUrlFromDescription = (entity) => {
    try {
      // Intentar obtener la descripción de la entidad
      let description = null;
      
      if (entity.description) {
        description = entity.description.getValue ? entity.description.getValue() : entity.description;
      }
      
      if (!description) return null;
      
      console.log('[ProjectVisualizer] Descripción encontrada:', description);
      
      // Buscar URL de imagen en el HTML de la descripción
      // Patrón para src='URL' o src="URL"
      const imgSrcMatch = description.match(/src=['"]([^'"]+)['"/]/i);
      if (imgSrcMatch && imgSrcMatch[1]) {
        console.log('[ProjectVisualizer] URL extraída de descripción:', imgSrcMatch[1]);
        return imgSrcMatch[1];
      }
      
      // Patrón alternativo para URLs directas en el texto
      const urlMatch = description.match(/(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp))/i);
      if (urlMatch && urlMatch[1]) {
        console.log('[ProjectVisualizer] URL directa encontrada:', urlMatch[1]);
        return urlMatch[1];
      }
      
      return null;
    } catch (error) {
      console.error('[ProjectVisualizer] Error extrayendo URL de descripción:', error);
      return null;
    }
  };

  const getCoordinatesFromPosition = (position) => {
    try {
      const cartographic = Cartographic.fromCartesian(position.getValue());
      return {
        lat: CesiumMath.toDegrees(cartographic.latitude),
        lon: CesiumMath.toDegrees(cartographic.longitude),
        alt: cartographic.height,
        _cartographic: cartographic,
      };
    } catch (e) {
      return null;
    }
  };

  // Recolecta URLs de fotos cercanas (billboards) en un radio dado (en metros)
  const collectNearbyPhotoUrls = (targetEntity, targetPos, selectedUrl, radiusM = 10) => {
    try {
      const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
      if (!currentViewer || !currentViewer.dataSources) return selectedUrl ? [selectedUrl] : [];
      const results = [];
      const seen = new Set();
      const addUrl = (url, d) => { if (url && !seen.has(url)) { seen.add(url); results.push({ url, d }); } };
      if (selectedUrl) addUrl(selectedUrl, 0);

      const dsCol = currentViewer.dataSources;
      const len = typeof dsCol.length === 'number' ? dsCol.length : dsCol._dataSources?.length || 0;
      const getDs = (i) => (typeof dsCol.get === 'function' ? dsCol.get(i) : dsCol._dataSources?.[i]);
      for (let i = 0; i < len; i++) {
        const ds = getDs(i);
        if (!ds || !ds.entities) continue;
        const entities = ds.entities.values || [];
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e === targetEntity) continue;
          if (!e.billboard) continue; // solo fotos normales
          if (!e.position || typeof e.position.getValue !== 'function') continue;
          let pos;
          try { pos = e.position.getValue(); } catch {}
          if (!pos) continue;
          let d = 0;
          try { d = Cartesian3.distance(targetPos, pos); } catch { continue; }
          if (d <= radiusM) {
            const url = extractImageUrlFromDescription(e) || (e.properties && (
              getPropertyValue(e.properties, 'thumbnail') ||
              getPropertyValue(e.properties, 'image') ||
              getPropertyValue(e.properties, 'url')
            ));
            addUrl(url, d);
          }
        }
      }
      results.sort((a, b) => a.d - b.d);
      return results.map(r => r.url);
    } catch (err) {
      console.warn('[ProjectVisualizer] Error buscando fotos cercanas:', err);
      return selectedUrl ? [selectedUrl] : [];
    }
  };

  const handleElementSelection = useCallback(async (entity) => {
    console.log('[ProjectVisualizer] handleElementSelection called with:', entity);
    console.log('[ProjectVisualizer] Entity details:', {
      id: entity.id,
      name: entity.name,
      hasProperties: !!entity.properties,
      hasBillboard: !!entity.billboard,
      hasPosition: !!entity.position,
      properties: entity.properties ? Object.keys(entity.properties) : 'none'
    });
    
    if (!entity) {
      setSelectedElement(null);
      return;
    }

    // Detectar entidad del Plan de Actividades (CZML layerKey: 'plan')
    try {
      if (entity._axsolLayerKey === 'plan') {
        let desc = null;
        try {
          if (entity.description) {
            desc = entity.description.getValue ? entity.description.getValue() : entity.description;
          }
        } catch {}
        const name = entity.name || 'Plan de Actividades';
        const activityData = { name, description: desc };
        const selectedElementData = { type: 'activity', data: activityData, entity };
        console.log('[ProjectVisualizer] Activity plan entity selected:', selectedElementData);
        setSelectedElement(selectedElementData);
        return;
      }
    } catch {}

    // Determinar el tipo de elemento basado en las propiedades de la entidad
    let elementType = 'default';
    let elementData = {};

    // Detectar fotos basándose en el billboard o propiedades
    if (entity.billboard) {
      // Si tiene propiedades, usarlas para determinar el tipo
      if (entity.properties) {
        const props = entity.properties;
        
        // Intentar obtener el tipo de diferentes formas
        let entityType = null;
        try {
          entityType = getPropertyValue(props, 'type') || getPropertyValue(props, 'entityType') || getPropertyValue(props, 'category');
        } catch (e) {
          // Si no se puede obtener el tipo, asumir que es una foto
          entityType = 'photo';
        }
        
        if (entityType === 'photo' || entityType === 'image' || !entityType) {
          elementType = 'photo';
          
          // Extraer URL de imagen desde la descripción
          const imageUrl = extractImageUrlFromDescription(entity) || 
                          getPropertyValue(props, 'thumbnail') || 
                          getPropertyValue(props, 'image') || 
                          getPropertyValue(props, 'url');
          
          // Coordenadas y altitud relativa
          let relAlt = null;
          let coords = entity.position ? getCoordinatesFromPosition(entity.position) : null;
          try {
            const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
            if (currentViewer && coords && coords._cartographic) {
              const ground = currentViewer.scene?.globe?.getHeight?.(coords._cartographic);
              if (typeof ground === 'number') {
                relAlt = (coords.alt ?? 0) - ground;
              }
            }
          } catch {}

          // Galería: fotos cercanas (10 m)
          let galleryImages = [];
          try {
            const posVal = entity.position && typeof entity.position.getValue === 'function' ? entity.position.getValue() : null;
            if (posVal) galleryImages = collectNearbyPhotoUrls(entity, posVal, imageUrl, 10);
          } catch {}

          elementData = {
            name: getPropertyValue(props, 'name') || entity.name || entity.id || 'Fotografía',
            date: getPropertyValue(props, 'date') || getPropertyValue(props, 'timestamp') || getPropertyValue(props, 'captureDate'),
            thumbnail: imageUrl,
            coordinates: coords && { lat: coords.lat, lon: coords.lon },
            relativeAltitude: typeof relAlt === 'number' ? relAlt : undefined,
            description: getPropertyValue(props, 'description') || getPropertyValue(props, 'notes'),
            galleryImages,
          };
          
          console.log('[ProjectVisualizer] Datos de foto extraídos:', elementData);
        } else if (entityType === 'photo360' || entityType === 'panorama') {
          elementType = 'photo360';
          
          // Extraer URL de imagen desde la descripción
          const imageUrl = extractImageUrlFromDescription(entity) || 
                          getPropertyValue(props, 'thumbnail') || 
                          getPropertyValue(props, 'image') || 
                          getPropertyValue(props, 'url');
          
          // Coordenadas y altitud relativa
          let relAlt = null;
          let coords = entity.position ? getCoordinatesFromPosition(entity.position) : null;
          try {
            const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
            if (currentViewer && coords && coords._cartographic) {
              const ground = currentViewer.scene?.globe?.getHeight?.(coords._cartographic);
              if (typeof ground === 'number') {
                relAlt = (coords.alt ?? 0) - ground;
              }
            }
          } catch {}

          elementData = {
            name: getPropertyValue(props, 'name') || entity.name || entity.id || 'Foto 360°',
            date: getPropertyValue(props, 'date') || getPropertyValue(props, 'timestamp') || getPropertyValue(props, 'captureDate'),
            thumbnail: imageUrl,
            coordinates: coords && { lat: coords.lat, lon: coords.lon },
            relativeAltitude: typeof relAlt === 'number' ? relAlt : undefined
          };
          
          console.log('[ProjectVisualizer] Datos de foto 360° extraídos:', elementData);
        }
      } else {
        // Si no tiene propiedades pero tiene billboard, asumir que es una foto
        elementType = 'photo';
        
        // Extraer URL de imagen desde la descripción incluso sin propiedades
        const imageUrl = extractImageUrlFromDescription(entity);
        // Coordenadas y altitud relativa
        let relAlt = null;
        let coords = entity.position ? getCoordinatesFromPosition(entity.position) : null;
        try {
          const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
          if (currentViewer && coords && coords._cartographic) {
            const ground = currentViewer.scene?.globe?.getHeight?.(coords._cartographic);
            if (typeof ground === 'number') {
              relAlt = (coords.alt ?? 0) - ground;
            }
          }
        } catch {}

        elementData = {
          name: entity.name || entity.id || 'Fotografía',
          thumbnail: imageUrl,
          coordinates: coords && { lat: coords.lat, lon: coords.lon },
          relativeAltitude: typeof relAlt === 'number' ? relAlt : undefined
        };
        
        console.log('[ProjectVisualizer] Datos de foto sin propiedades extraídos:', elementData);
      }
    }
    
    // Detectar elementos IFC basándose en el modelo 3D
    else if (entity.model || (entity.properties && entity.properties.ifc)) {
      elementType = 'ifc';
      const props = entity.properties;
      elementData = {
        name: getPropertyValue(props, 'name') || entity.name || 'Elemento IFC',
        type: getPropertyValue(props, 'ifcType') || getPropertyValue(props, 'type'),
        material: getPropertyValue(props, 'material'),
        properties: {}
      };
      
      // Extraer propiedades adicionales si existen
      if (props) {
        Object.keys(props).forEach(key => {
          if (!['name', 'ifcType', 'type', 'material'].includes(key)) {
            const value = getPropertyValue(props, key);
            if (value !== null) {
              elementData.properties[key] = value;
            }
          }
        });
      }
    }
    
    // Elemento genérico
    else {
      elementData = {
        name: entity.name || 'Elemento desconocido',
        id: entity.id
      };
    }

    const selectedElementData = {
      type: elementType,
      data: elementData,
      entity: entity
    };
    
    console.log('[ProjectVisualizer] Setting selectedElement:', selectedElementData);
    setSelectedElement(selectedElementData);

    // Si es foto/foto360 y no tenemos altura relativa, intentar calcularla asíncronamente
    if ((elementType === 'photo' || elementType === 'photo360') && entity.position) {
      try {
        const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
        if (currentViewer) {
          const carto = Cartographic.fromCartesian(entity.position.getValue());
          const updated = await sampleTerrainMostDetailed(currentViewer.scene.globe.terrainProvider, [carto]);
          const ground = updated?.[0]?.height;
          const relAlt = (Cartographic.fromCartesian(entity.position.getValue()).height ?? 0) - (ground ?? 0);
          setSelectedElement((prev) => {
            if (!prev || (prev.type !== 'photo' && prev.type !== 'photo360')) return prev;
            return { ...prev, data: { ...prev.data, relativeAltitude: relAlt } };
          });
        }
      } catch (e) {
        console.warn('[ProjectVisualizer] No se pudo calcular altura relativa async:', e);
      }
    }

    console.log('[ProjectVisualizer] Elemento seleccionado:', elementType, elementData);
  }, [setSelectedElement]); // useCallback dependencies

  const extractFeatureMetadata = useCallback((feature) => {
    try {
      const props = {};
      let name = null;
      let type = null;
      if (typeof feature.getPropertyIds === 'function') {
        const ids = feature.getPropertyIds();
        ids.forEach((key) => {
          try { props[key] = feature.getProperty(key); } catch {}
        });
        name = feature.getProperty('name') || feature.getProperty('Name') || feature.getProperty('id') || feature.getProperty('elementId');
        type = feature.getProperty('ifcType') || feature.getProperty('type') || feature.getProperty('category');
      }
      return {
        type: 'ifc',
        data: {
          name: name || 'Elemento IFC',
          type: type || null,
          material: props.material || props.Material || null,
          properties: props,
        },
        entity: null,
      };
    } catch (e) {
      console.warn('[ProjectVisualizer] extractFeatureMetadata error:', e);
      return null;
    }
  }, []);

  // useEffect para configurar event handlers cuando cesiumViewer esté disponible
  useEffect(() => {
    if (!cesiumViewer) {
      console.log('🚨 cesiumViewer no disponible aún');
      return;
    }

    console.log('🚨 CONFIGURANDO EVENT HANDLERS CON CESIUMVIEWER EXISTENTE!');
    console.log('🚨 cesiumViewer:', cesiumViewer);
    console.log('🚨 screenSpaceEventHandler:', cesiumViewer.cesiumWidget?.screenSpaceEventHandler);

    try {
      // Configurar event handler para clicks (efecto posterior)
      cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
        console.log('🔥 CLICK DETECTADO! Posición:', event.position);
        
        const pickedObject = cesiumViewer.scene.pick(event.position);
        console.log('🔥 Objeto picked:', pickedObject);
        if (pickedObject) {
          if (pickedObject.id) {
            console.log('🔥 Llamando a handleElementSelection...');
            handleElementSelection(pickedObject.id);
          } else if (typeof pickedObject.getPropertyIds === 'function') {
            const meta = extractFeatureMetadata(pickedObject);
            if (meta) {
              console.log('🔥 Feature IFC metadata extraída');
              setSelectedElement(meta);
            }
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
      
      console.log('🚨 Event handler configurado exitosamente en useEffect');
      
    } catch (error) {
      console.error('🚨 Error configurando event handler en useEffect:', error);
    }

    // También configurar selectedEntityChanged
    try {
      cesiumViewer.selectedEntityChanged.addEventListener((selectedEntity) => {
        console.log('🔥 selectedEntityChanged disparado:', selectedEntity);
        if (selectedEntity) {
          handleElementSelection(selectedEntity);
        } else {
          setSelectedElement(null);
        }
      });
      console.log('🚨 selectedEntityChanged listener configurado en useEffect');
    } catch (error) {
      console.error('🚨 Error configurando selectedEntityChanged en useEffect:', error);
    }

  }, [cesiumViewer, handleElementSelection]); // Dependencias

  useEffect(() => {
    window.abrirGaleriaFotosCercanas = function(entityId) {
      try {
        const arr = window.loadedBillboards;
        const CesiumNS = window.Cesium;
        if (!Array.isArray(arr) || arr.length === 0 || !CesiumNS) return [];
        const clicked = arr.find(b => b && b.id === entityId);
        if (!clicked || !clicked.position) return [];
        const nearby = arr.filter(b => {
          if (!b || !b.position || b.id === entityId) return false;
          try { return CesiumNS.Cartesian3.distance(clicked.position, b.position) <= 10.0; } catch { return false; }
        });
        const galleryPhotos = [clicked, ...nearby].map(p => ({ href: p.url, fechaCaptura: p.fechaCaptura }));
        console.log('[abrirGaleriaFotosCercanas] Fotos:', galleryPhotos);
        return galleryPhotos;
      } catch (e) {
        console.warn('[abrirGaleriaFotosCercanas] Error:', e);
        return [];
      }
    };
    return () => { try { delete window.abrirGaleriaFotosCercanas; } catch {} };
  }, []);

  const clearMeasurementEntities = useCallback(() => {
    const v = cesiumViewer;
    const ents = measurePreviewRef.current;
    if (v && v.entities) {
      if (ents.line) { try { v.entities.remove(ents.line); } catch {} ents.line = null; }
      if (ents.polygon) { try { v.entities.remove(ents.polygon); } catch {} ents.polygon = null; }
      if (ents.label) { try { v.entities.remove(ents.label); } catch {} ents.label = null; }
    }
  }, [cesiumViewer]);

  const resetMeasurement = useCallback(() => {
    clearMeasurementEntities();
    setMeasurePoints([]);
    setMeasureMode('none');
  }, [clearMeasurementEntities]);

  const formatMeters = (m) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${m.toFixed(2)} m`;
  };

  const computeCentroidCartesian = (pts) => {
    let cx = 0, cy = 0, cz = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; cz += p.z; });
    const n = pts.length || 1; return new Cartesian3(cx / n, cy / n, cz / n);
  };

  const computeAreaApprox = (pts) => {
    if (pts.length < 3) return 0;
    const c = computeCentroidCartesian(pts);
    const to2D = (p) => ({ x: p.x - c.x, y: p.y - c.y });
    const v = pts.map(to2D);
    let area = 0;
    for (let i = 0; i < v.length; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      area += a.x * b.y - b.x * a.y;
    }
    return Math.abs(area) * 1e-0;
  };

  useEffect(() => {
    if (!cesiumViewer) return;
    // Cambiar cursor cuando se mide
    try { cesiumViewer.canvas.style.cursor = measureMode !== 'none' ? 'crosshair' : 'default'; } catch {}
    if (measureMode === 'line') {
      if (measurePoints.length === 1) {
        clearMeasurementEntities();
        const p = measurePoints[0];
        const l = cesiumViewer.entities.add({ position: p, point: { pixelSize: 8, color: Color.YELLOW } });
        measurePreviewRef.current.line = l;
      }
      // el cierre de línea lo maneja finalizeLineMeasurement
    } else if (measureMode === 'area') {
      if (measurePoints.length >= 1) {
        clearMeasurementEntities();
        if (measurePoints.length === 1) {
          measurePreviewRef.current.line = cesiumViewer.entities.add({ position: measurePoints[0], point: { pixelSize: 8, color: Color.CYAN } });
        } else if (measurePoints.length >= 2) {
          measurePreviewRef.current.line = cesiumViewer.entities.add({ polyline: { positions: measurePoints, width: 3, material: Color.CYAN } });
        }
      }
    }
  }, [cesiumViewer, measureMode, measurePoints, clearMeasurementEntities]);

  const finalizeLineMeasurement = useCallback(() => {
    if (!cesiumViewer) return;
    if (measureMode !== 'line' || measurePoints.length < 2) return;
    clearMeasurementEntities();
    const positions = measurePoints.slice(0, 2);
    const d = Cartesian3.distance(positions[0], positions[1]);
    const mid = new Cartesian3((positions[0].x + positions[1].x) / 2, (positions[0].y + positions[1].y) / 2, (positions[0].z + positions[1].z) / 2);
    const polyline = cesiumViewer.entities.add({ polyline: { positions, width: 4, material: Color.YELLOW } });
    const label = cesiumViewer.entities.add({ position: mid, label: { text: `${d.toFixed(2)} m`, fillColor: Color.WHITE, outlineColor: Color.BLACK, outlineWidth: 2, showBackground: true, backgroundColor: Color.fromAlpha(Color.BLACK, 0.4), font: '14px sans-serif' } });
    setMeasureLines((prev) => [...prev, { polyline, label }]);
    setMeasurePoints([]);
  }, [cesiumViewer, measureMode, measurePoints, clearMeasurementEntities]);

  const finalizeAreaMeasurement = useCallback(() => {
    if (!cesiumViewer) return;
    if (measureMode !== 'area' || measurePoints.length < 3) return;
    clearMeasurementEntities();
    const area = computeAreaApprox(measurePoints);
    const centroid = computeCentroidCartesian(measurePoints);
    const polygon = cesiumViewer.entities.add({ polygon: { hierarchy: measurePoints, material: Color.fromAlpha(Color.CYAN, 0.25), outline: true, outlineColor: Color.CYAN, outlineWidth: 2 } });
    const label = cesiumViewer.entities.add({ position: centroid, label: { text: `${area.toFixed(2)} m²`, fillColor: Color.WHITE, outlineColor: Color.BLACK, outlineWidth: 2, showBackground: true, backgroundColor: Color.fromAlpha(Color.BLACK, 0.4), font: '14px sans-serif' } });
    setMeasureAreas((prev) => [...prev, { polygon, label }]);
    setMeasurePoints([]);
  }, [cesiumViewer, measureMode, measurePoints, clearMeasurementEntities]);

  // limpiar todas las mediciones
  const clearAllMeasurements = useCallback(() => {
    if (!cesiumViewer) return;
    try {
      measureLines.forEach(({ polyline, label }) => { try { cesiumViewer.entities.remove(polyline); } catch {}; try { cesiumViewer.entities.remove(label); } catch {} });
      measureAreas.forEach(({ polygon, label }) => { try { cesiumViewer.entities.remove(polygon); } catch {}; try { cesiumViewer.entities.remove(label); } catch {} });
    } finally {
      setMeasureLines([]);
      setMeasureAreas([]);
      clearMeasurementEntities();
      setMeasurePoints([]);
      setMeasureMode('none');
    }
  }, [cesiumViewer, measureLines, measureAreas, clearMeasurementEntities]);

  // useEffect para personalizar el botón Home cuando los datos estén listos
  useEffect(() => {
    if (!cesiumViewer || (!layoutData && !projectData)) {
      return;
    }

    console.log('[ProjectVisualizer] Personalizando botón Home con datos:', {
      hasLayoutData: !!layoutData,
      hasProjectData: !!projectData,
      hasInitialLocation: !!projectData?.initial_location
    });

    // Personalizar el botón Home para hacer flyTo al polígono del proyecto
    if (cesiumViewer.homeButton) {
      // Función personalizada para el botón Home
      const customHomeFunction = () => {
        console.log('[ProjectVisualizer] Custom Home button clicked');
        
        // Hacer flyTo al polígono del proyecto si existe
        if (layoutData) {
          console.log('[ProjectVisualizer] Flying to project polygon');
          // Buscar el dataSource del GeoJSON
          let geoJsonDataSource = null;
          for (let i = 0; i < cesiumViewer.dataSources.length; i++) {
            const ds = cesiumViewer.dataSources.get(i);
            if (ds.name === 'GeoJSON' || ds._name === 'GeoJSON') {
              geoJsonDataSource = ds;
              break;
            }
          }
          
          if (geoJsonDataSource) {
            cesiumViewer.flyTo(geoJsonDataSource);
          } else {
            // Si no hay dataSource, crear uno temporal para hacer flyTo
            import('cesium').then(({ GeoJsonDataSource }) => {
              GeoJsonDataSource.load(layoutData).then((tempDataSource) => {
                cesiumViewer.flyTo(tempDataSource);
              });
            });
          }
        } else {
          // Fallback: usar initial_location del proyecto si no hay polígono
          const initialLocation = projectData?.initial_location;
          if (initialLocation) {
            console.log('[ProjectVisualizer] Flying to initial location:', initialLocation);
            cesiumViewer.camera.flyTo({
              destination: Cartesian3.fromDegrees(
                initialLocation.lon, 
                initialLocation.lat, 
                initialLocation.alt || 1000
              ),
              orientation: {
                heading: CesiumMath.toRadians(initialLocation.heading || 0),
                pitch: CesiumMath.toRadians(initialLocation.pitch || -90),
                roll: CesiumMath.toRadians(initialLocation.roll || 0)
              }
            });
          } else {
            console.log('[ProjectVisualizer] No layout data or initial location, using default home');
            // Si no hay datos del proyecto, usar comportamiento por defecto
            cesiumViewer.camera.setView({
              destination: Cartesian3.fromDegrees(0, 0, 20000000)
            });
          }
        }
      };

      // Reemplazar el comando del botón Home
      cesiumViewer.homeButton.viewModel.command.func = customHomeFunction;
    }
  }, [cesiumViewer, layoutData, projectData]);

  // Monitorear el viewerRef para inicializar cesiumViewer
  useEffect(() => {
    const checkViewer = () => {
      const viewerRefCurrent = viewerRef.current;
      const viewer = viewerRefCurrent?.cesiumElement;
      
      console.log('[ProjectVisualizer] Verificando viewer:', {
        viewerRefCurrent: !!viewerRefCurrent,
        cesiumElement: !!viewer,
        cesiumViewer: !!cesiumViewer
      });
      
      if (viewer && !cesiumViewer) {
        console.log('[ProjectVisualizer] Viewer encontrado via ref, inicializando cesiumViewer');
        setCesiumViewer(viewer);
      }
    };

    // Verificar inmediatamente
    checkViewer();

    // Verificar periódicamente hasta que el viewer esté listo
    const interval = setInterval(() => {
      if (!cesiumViewer) {
        checkViewer();
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cesiumViewer]);

  // Monitorear cuando cesiumViewer cambia
  useEffect(() => {
    console.log('[ProjectVisualizer] cesiumViewer actualizado:', !!cesiumViewer);
  }, [cesiumViewer]);

  // Ocultar overlays cuando se abre el menú principal (drawer)
  useEffect(() => {
    const onMainDrawer = (ev) => {
      try {
        const { open } = ev.detail || {};
        if (open) {
          setLayerPanelOpen(false);
          setSelectedElement(null);
          setComparisonModalOpen(false);
        }
      } catch {}
    };
    window.addEventListener('axsol:main-drawer', onMainDrawer);
    return () => window.removeEventListener('axsol:main-drawer', onMainDrawer);
  }, []);

  // Monitorear cuando las fechas están disponibles
  useEffect(() => {
    console.log('[ProjectVisualizer] Fechas disponibles actualizadas:', {
      count: availableCaptureDates.length,
      dates: availableCaptureDates,
      loading: datesLoading
    });
  }, [availableCaptureDates, datesLoading]);

  useEffect(() => {
    if (!cesiumViewer || imagesPrefetchedRef.current) {
      return;
    }

    imagesPrefetchedRef.current = true;
    requestImagesLayer();
    requestImages360Layer();
  }, [cesiumViewer, requestImagesLayer, requestImages360Layer]);

  useEffect(() => {
    console.log('[ProjectVisualizer] useEffect configuración inicial:', { 
      cesiumViewer: !!cesiumViewer, 
      availableCaptureDates: availableCaptureDates.length 
    });
    
    if (!cesiumViewer) {
      return;
    }
    if (!availableCaptureDates.length) {
      return;
    }

    // Configurar el reloj y timeline con la fecha y hora actual del sistema
    const now = new Date();
    const currentDateTime = JulianDate.fromDate(now);
    const currentDateString = now.toISOString().slice(0, 10); // YYYY-MM-DD
    
    console.log('[ProjectVisualizer] Configurando reloj con fecha y hora actual:', now.toISOString());
    
    // Establecer el reloj de Cesium con la fecha y hora actual
    cesiumViewer.clock.currentTime = currentDateTime.clone();
    cesiumViewer.clock.shouldAnimate = false;
    
    // Actualizar el label del reloj
    setClockLabel(formatClockDate(currentDateTime));
    
    // Establecer la fecha seleccionada para el calendario
    setSelectedCaptureDate(currentDateString);
    
    console.log('[ProjectVisualizer] Reloj configurado con fecha actual:', currentDateString);
  }, [cesiumViewer, availableCaptureDates]);

  useEffect(() => {
    if (!selectedCaptureDate) {
      console.log('[ProjectVisualizer] Sincronización cancelada: no hay fecha seleccionada');
      return;
    }

    const currentViewer = getCurrentViewer(viewerRef, cesiumViewer);
    if (!currentViewer) {
      console.log('[ProjectVisualizer] Sincronización cancelada: no hay viewer disponible', { 
        selectedCaptureDate: !!selectedCaptureDate, 
        cesiumViewer: !!cesiumViewer,
        viewerRef: !!viewerRef.current?.cesiumElement
      });
      return;
    }

    console.log(`[ProjectVisualizer] Sincronizando fecha:`, {
      selectedCaptureDate,
      type: typeof selectedCaptureDate,
      isDate: selectedCaptureDate instanceof Date
    });
    
    // Sincronizar el reloj con la fecha seleccionada
    syncDateWithClock(currentViewer, selectedCaptureDate);
    
    // Actualizar el label del reloj usando la misma lógica de parsing
    let labelDate;
    if (typeof selectedCaptureDate === 'string') {
      if (selectedCaptureDate.includes('T')) {
        labelDate = new Date(selectedCaptureDate.split('T')[0] + 'T12:00:00Z');
      } else if (selectedCaptureDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        labelDate = new Date(`${selectedCaptureDate}T12:00:00Z`);
      } else {
        labelDate = new Date(selectedCaptureDate);
      }
    } else if (selectedCaptureDate instanceof Date) {
      labelDate = new Date(selectedCaptureDate.toISOString().split('T')[0] + 'T12:00:00Z');
    }
    
    if (labelDate && !isNaN(labelDate.getTime())) {
      const selectedJulian = JulianDate.fromDate(labelDate);
      setClockLabel(formatClockDate(selectedJulian));
      console.log(`[ProjectVisualizer] Label actualizado: ${formatClockDate(selectedJulian)}`);
    }
  }, [cesiumViewer, selectedCaptureDate]);

  useEffect(() => {
    if (!cesiumViewer) return;

    const controller = cesiumViewer.scene.screenSpaceCameraController;
    controller.inertiaZoom = 0.0;
    controller.inertiaTranslate = 0.0;
    cesiumViewer.scene.globe.depthTestAgainstTerrain = true;
    window.viewer = cesiumViewer;

    // Listener simple para actualizar el label del reloj
    const onClockUpdate = () => {
      if (cesiumViewer.clock.currentTime) {
        setClockLabel(formatClockDate(cesiumViewer.clock.currentTime));
      }
    };

    // Agregar listener al evento onTick del reloj
    const removeListener = cesiumViewer.clock.onTick.addEventListener(onClockUpdate);

    return () => {
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, [cesiumViewer]);

  useEffect(() => {
    if (!cesiumViewer) return;

    let cancelled = false;

    const loadTerrain = async () => {
      const terrainOpacity = layerVisibility.terreno;
      
      if (terrainOpacity > 0) {
        // Activar terreno con opacidad
        try {
          console.log(`[ProjectVisualizer] Cargando terreno de Cesium Ion con opacidad ${terrainOpacity}%...`);
          
          // Usar el asset de terreno de Cesium Ion (Asset ID 1 es el terreno mundial)
          const terrain = new Terrain(
            CesiumTerrainProvider.fromIonAssetId(1)
          );
          
          if (!cancelled) {
            cesiumViewer.scene.setTerrain(terrain);
            
            // Configurar la opacidad del terreno
            cesiumViewer.scene.globe.translucency.enabled = true;
            cesiumViewer.scene.globe.translucency.frontFaceAlpha = terrainOpacity / 100;
            cesiumViewer.scene.globe.translucency.backFaceAlpha = terrainOpacity / 100;
            
            setTerrainProvider(terrain);
            console.log(`[ProjectVisualizer] Terreno de Cesium Ion cargado con opacidad ${terrainOpacity}%`);
          }
        } catch (error) {
          console.error('[ProjectVisualizer] Error cargando terreno de Cesium Ion:', error);
          
          // Fallback al terreno mundial por defecto
          try {
            if (!cancelled) {
              console.log('[ProjectVisualizer] Usando terreno mundial como fallback...');
              const fallbackTerrain = await createWorldTerrainAsync();
              if (!cancelled) {
                cesiumViewer.scene.setTerrain(fallbackTerrain);
                
                // Configurar la opacidad del terreno fallback
                cesiumViewer.scene.globe.translucency.enabled = true;
                cesiumViewer.scene.globe.translucency.frontFaceAlpha = terrainOpacity / 100;
                cesiumViewer.scene.globe.translucency.backFaceAlpha = terrainOpacity / 100;
                
                setTerrainProvider(fallbackTerrain);
              }
            }
          } catch (fallbackError) {
            console.warn('[ProjectVisualizer] No se pudo cargar ningún terreno:', fallbackError);
          }
        }
      } else {
        // Desactivar terreno (opacidad 0)
        try {
          console.log('[ProjectVisualizer] Desactivando terreno...');
          cesiumViewer.scene.setTerrain(null);
          cesiumViewer.scene.globe.translucency.enabled = false;
          setTerrainProvider(null);
          console.log('[ProjectVisualizer] Terreno desactivado exitosamente');
        } catch (error) {
          console.error('[ProjectVisualizer] Error desactivando terreno:', error);
        }
      }
    };

    loadTerrain();

    return () => {
      cancelled = true;
    };
  }, [cesiumViewer, layerVisibility.terreno]);

  useEffect(() => {
    if (!cesiumViewer) {
      return;
    }

    const startIso = config?.proyecto?.fecha_inicio || projectData?.start_date;
    const endIso = config?.proyecto?.fecha_fin || projectData?.end_date;

    if (!startIso || !endIso) {
      return;
    }

    const projectStart = new Date(startIso);
    const projectEnd = new Date(endIso);

    if (isNaN(projectStart.getTime()) || isNaN(projectEnd.getTime())) {
      return;
    }

    const startJulian = JulianDate.fromDate(projectStart);
    const endJulian = JulianDate.fromDate(projectEnd);

    // Configurar el reloj del proyecto
    cesiumViewer.clock.startTime = startJulian.clone();
    cesiumViewer.clock.stopTime = endJulian.clone();
    cesiumViewer.clock.clockRange = ClockRange.LOOP_STOP;
    cesiumViewer.clock.multiplier = 86400; // 1 día por segundo
    cesiumViewer.clock.shouldAnimate = false;

    // No establecer fecha inicial aquí - se hará en el useEffect de configuración inicial
    // que establece la fecha y hora actual del sistema

    // Configurar timeline
    if (cesiumViewer.timeline) {
      cesiumViewer.timeline.zoomTo(startJulian, endJulian);
    }

    console.log('[ProjectVisualizer] Timeline configurado');
  }, [cesiumViewer, projectData, config, availableCaptureDates]);


  useEffect(() => {
    if (cesiumViewer && loadedCzml) {
      const clockState = captureClockState(cesiumViewer);
      CesiumCzmlDataSource.load(loadedCzml)
        .then(dataSource => {
          cesiumViewer.dataSources.add(dataSource);
          restoreClockState(cesiumViewer, clockState);
          cesiumViewer.flyTo(dataSource);
        })
        .catch(error => {
          console.error('Error loading local CZML data source:', error);
          alert('Hubo un error al cargar el archivo CZML local.');
        });
    }
  }, [cesiumViewer, loadedCzml]);

  // Este useEffect se eliminó porque la lógica se movió al useEffect anterior para evitar duplicación

  const displayClockLabel = clockLabel || formatIsoDayLabel(selectedCaptureDate);

  if (projectLoading || configLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  if (projectError || configError) {
    return <Box sx={{ color: 'red' }}>Error: {projectError || configError}</Box>;
  }

  console.log('🚨 PROJECTVISUALIZER RENDERIZANDO!');
  console.log('🚨 cesiumViewer state:', !!cesiumViewer);
  console.log('🚨 handleViewerReady function:', typeof handleViewerReady);

  return (
    <Box className="visualizer-root">
      <Box className="viewer-wrapper">
{displayClockLabel && <Box className="clock-label">{displayClockLabel}</Box>}
        <Viewer
          ref={viewerRef}
          className="visualizer-container"
          timeline={true}
          animation={true}
          baseLayerPicker={false}
          homeButton={true}
          sceneModePicker={false}
          navigationHelpButton={true}
          geocoder={false}
          infoBox={false}
          selectionIndicator={true}
          shouldAnimate={false}
          onReady={(viewer) => {
            console.log('🚨 ONREADY DISPARADO DIRECTAMENTE!');
            handleViewerReady(viewer);
          }}
          terrainProvider={terrainProvider}
      >
        {projectPolygonFeature && (
          <ResiumGeoJsonDataSource
            data={projectPolygonFeature}
            clampToGround={true}
            stroke={Color.fromCssColorString('#FF6B00')}
            fill={Color.fromAlpha(Color.fromCssColorString('#FF6B00'), 0.15)}
            strokeWidth={2}
          />
        )}
        {layerVisibility.layout && layoutData && (
          <ResiumGeoJsonDataSource
            data={layoutData}
            clampToGround={true}
            stroke={Color.WHITE}
            fill={Color.WHITE.withAlpha(0.25)}
            strokeWidth={2}
            onLoad={(dataSource) => viewerRef.current?.cesiumElement?.zoomTo(dataSource)}
          />
        )}

        {tilesetMetadata && (
          <TilesetErrorBoundary>
            <TilesetLayer 
              metadata={tilesetMetadata} 
              visible={layerVisibility.realidad3D} 
              clampToGround={layerVisibility.realidadClamped}
              opacityPercent={layerVisibility.realidadOpacity}
            />
          </TilesetErrorBoundary>
        )}
        <TilesetErrorBoundary>
          <TilesetLayer
            metadata={visibleIfcMetadata}
            visible={layerVisibility.proyecto3D}
            clampToGround={true}
            heightOffsetMeters={ifcHeightOffset}
            persist={true}
          />
        </TilesetErrorBoundary>
        <CzmlLayer
          data={imagesCzml}
          visible={layerVisibility.fotos}
          layerKey="fotos"
        />
        <CzmlLayer
          data={images360Czml}
          visible={layerVisibility.fotos360}
          layerKey="fotos360"
        />
        {/* Plan de Actividades (CZML) */}
        <CzmlLayer
          data={hasActivityPlan ? planUrl : null}
          visible={!!layerVisibility.plan}
          layerKey="plan"
        />
        </Viewer>
        <Box className="axsol-watermark">
          <img src={watermarkLogo} alt="Marca de agua" />
        </Box>
        {!selectedElement && (
          <LayerSelector
            layerVisibility={layerVisibility}
            onLayerVisibilityChange={(newVisibility) => {
              setLayerVisibility(newVisibility);
              
              // Trigger fetch para las capas que se activan
              if (newVisibility.fotos && !layerVisibility.fotos && !imagesLayer.layerData) {
                imagesLayer.triggerFetch();
              }
              if (newVisibility.fotos360 && !layerVisibility.fotos360 && !images360Layer.layerData) {
                images360Layer.triggerFetch();
              }
            }}
            open={layerPanelOpen}
            onToggle={() => setLayerPanelOpen(!layerPanelOpen)}
            availableCaptureDates={availableCaptureDates}
            selectedCaptureDate={selectedCaptureDate}
            onCaptureDateChange={setSelectedCaptureDate}
            datesLoading={datesLoading}
            ifcList={ifcList}
            ifcHeightOffset={ifcHeightOffset}
            onIfcHeightOffsetChange={(val) => {
              if (typeof val === 'number') setIfcHeightOffset(val);
            }}
            onIfcHeightOffsetChangeCommitted={async (val) => {
              try {
                await api.patch(`/api/projects/${projectId}/opcions`, { ifcHeightOffset: val });
                console.log('[ProjectVisualizer] ifcHeightOffset persisted:', val);
              } catch (e) {
                console.error('[ProjectVisualizer] Error persisting ifcHeightOffset:', e);
              }
            }}
            hasActivityPlan={hasActivityPlan}
          />
        )}
        <ViewerToolBar
          onToolSelect={(tool, subTool) => {
            console.log('Herramienta seleccionada:', tool, subTool);
            
            if (tool === 'compare') {
              console.log('[ProjectVisualizer] Abriendo modal de comparación');
              setComparisonModalOpen(true);
              return;
            }
            if (tool === 'measure') {
              // subTool: 'line' | 'area' (volumen está deshabilitado en la UI)
              clearMeasurementEntities();
              setSelectedElement(null);
              setMeasurePoints([]);
              if (subTool === 'line') {
                setMeasureMode('line');
              } else if (subTool === 'area') {
                setMeasureMode('area');
              } else {
                setMeasureMode('none');
              }
              return;
            }
          }}
        />
        <InfoBox
          selectedElement={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
        <ComparisonModal
          open={comparisonModalOpen}
          onClose={() => {
            console.log('[ProjectVisualizer] Cerrando modal de comparación');
            setComparisonModalOpen(false);
          }}
        />
      </Box>

    </Box>
  );
}

const TilesetLayer = ({ metadata, visible, clampToGround = false, persist = false, heightOffsetMeters = 0, opacityPercent }) => {
  const { viewer } = useCesium();
  const tilesetsRef = useRef(new Map());
  const hasFlownRef = useRef(false);

  const toCollections = useCallback((value) => {
    if (!value) {
      return [];
    }

    if (value instanceof TimeIntervalCollection) {
      return [value];
    }

    if (value instanceof TimeInterval) {
      return [new TimeIntervalCollection([value])];
    }

    if (typeof value === 'string') {
      try {
        return [TimeIntervalCollection.fromIso8601({ iso8601: value })];
      } catch (error) {
        console.warn('[TilesetLayer] No se pudo parsear availability ISO8601:', value, error);
        return [];
      }
    }

    if (Array.isArray(value)) {
      return value.flatMap(toCollections);
    }

    if (value?.start && value?.stop) {
      try {
        const interval = TimeInterval.fromIso8601({ iso8601: `${value.start}/${value.stop}` });
        return [new TimeIntervalCollection([interval])];
      } catch (error) {
        console.warn('[TilesetLayer] No se pudo crear TimeInterval desde objeto start/stop:', value, error);
      }
    }

    return [];
  }, []);

  const applyVisibility = useCallback((currentTime) => {
    if (!viewer || viewer.isDestroyed?.() || !viewer.scene) {
      return;
    }

    const entries = tilesetsRef.current;
    entries.forEach(({ tileset, availabilityCollections, disabled }) => {
      try {
        if (!tileset || tileset.isDestroyed?.()) {
          return;
        }
        if (disabled) {
          tileset.show = false;
          return;
        }
        if (!visible) {
          tileset.show = false;
          return;
        }

        if (!availabilityCollections || availabilityCollections.length === 0) {
          tileset.show = true;
          return;
        }

        const time = currentTime ?? viewer.clock?.currentTime;
        const shouldShow = Boolean(time && availabilityCollections.some((collection) => {
          try { return collection.contains(time); } catch { return false; }
        }));
        tileset.show = shouldShow;
      } catch (err) {
        console.warn('[TilesetLayer] applyVisibility error for tileset:', err);
        try { if (tileset && !tileset.isDestroyed?.()) tileset.show = false; } catch {}
      }
    });
  }, [viewer, visible]);

  const clampTilesetToGround = useCallback(async (tileset) => {
    try {
      if (!viewer || viewer.isDestroyed?.() || !viewer.scene || !viewer.scene.globe || !tileset) return;
      await tileset.readyPromise;
      if (tileset.isDestroyed?.()) return;
      const center = tileset.boundingSphere?.center;
      if (!center) return;
      const carto = Cartographic.fromCartesian(center);

      // Intentar obtener altura del terreno
      let terrainHeight = undefined;
      try {
        terrainHeight = viewer.scene.globe.getHeight(carto);
      } catch (e) {
        terrainHeight = undefined;
      }
      if (terrainHeight === undefined || terrainHeight === null) {
        try {
          const updated = await sampleTerrainMostDetailed(viewer.scene.globe.terrainProvider, [carto]);
          terrainHeight = updated?.[0]?.height ?? 0;
        } catch (e) {
          terrainHeight = 0;
        }
      }

      const surface = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0.0);
      const offset = Cartesian3.fromRadians(carto.longitude, carto.latitude, terrainHeight + (heightOffsetMeters || 0));
      const translation = Cartesian3.subtract(offset, surface, new Cartesian3());
      if (!tileset.isDestroyed?.()) {
        // Buscar la entrada para obtener la matriz original
        let original = null;
        for (const entry of tilesetsRef.current.values()) {
          if (entry.tileset === tileset) {
            if (!entry.originalModelMatrix) {
              entry.originalModelMatrix = Matrix4.clone(tileset.modelMatrix);
            }
            original = entry.originalModelMatrix;
            break;
          }
        }
        const translationMatrix = Matrix4.fromTranslation(translation);
        const composed = original ? Matrix4.multiply(translationMatrix, original, new Matrix4()) : translationMatrix;
        tileset.modelMatrix = composed;
      }
    } catch (err) {
      console.warn('[TilesetLayer] Error al ajustar tileset al terreno:', err);
    }
  }, [viewer, heightOffsetMeters]);

  // Aplicar opacidad (si se especifica) a todos los tilesets de esta capa
  useEffect(() => {
    if (!viewer) return;
    if (typeof opacityPercent !== 'number') return;
    const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
    tilesetsRef.current.forEach(({ tileset }) => {
      try {
        if (!tileset || tileset.isDestroyed?.()) return;
        tileset.style = new Cesium3DTileStyle({ color: `color('white', ${alpha})` });
      } catch (e) {
        console.warn('[TilesetLayer] No se pudo aplicar opacidad al tileset:', e);
      }
    });
  }, [viewer, opacityPercent]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed?.()) {
      return undefined;
    }

    const listener = (clock) => {
      try {
        applyVisibility(clock.currentTime);
      } catch (e) {
        console.warn('[TilesetLayer] onTick handler error:', e);
      }
    };

    try { viewer.clock.onTick.addEventListener(listener); } catch {}

    return () => {
      try { if (viewer && !viewer.isDestroyed?.()) viewer.clock.onTick.removeEventListener(listener); } catch {}
    };
  }, [viewer, applyVisibility]);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    const existingMap = tilesetsRef.current;
    const metadataById = new Map((metadata ?? []).filter((item) => item?.asset_id).map((item) => [item.asset_id, item]));

    // Remove tilesets not present anymore
    for (const [assetId, entry] of existingMap.entries()) {
      if (!metadataById.has(assetId)) {
        if (persist) {
          // Mantener el tileset pero ocultarlo y marcarlo deshabilitado
          entry.disabled = true;
          if (!entry.tileset.isDestroyed?.()) entry.tileset.show = false;
        } else {
          try {
            if (!entry.tileset.isDestroyed?.()) {
              if (viewer && !viewer.isDestroyed?.()) {
                try { viewer.scene?.primitives?.remove(entry.tileset); } catch {}
              }
              entry.tileset.destroy?.();
            }
          } catch (e) {
            console.warn('[TilesetLayer] Error removiendo tileset:', e);
          } finally {
            existingMap.delete(assetId);
          }
        }
      }
    }

    let cancelled = false;

    const loadTilesets = async () => {
      for (const item of metadata ?? []) {
        if (!item?.asset_id) {
          continue;
        }

        const availabilityCollections = toCollections(item.availability);
        const existingEntry = existingMap.get(item.asset_id);

        if (existingEntry) {
          existingEntry.tileset.name = item.name || existingEntry.tileset.name;
          existingEntry.tileset._axsolAvailabilityCollections = availabilityCollections.length > 0 ? availabilityCollections : null;
          existingEntry.availabilityCollections = availabilityCollections;
          if (!existingEntry.originalModelMatrix && existingEntry.tileset) {
            existingEntry.originalModelMatrix = Matrix4.clone(existingEntry.tileset.modelMatrix);
          }
          existingEntry.disabled = false; // reactivarlo si está en metadata
          continue;
        }

        try {
          let tileset;
          if (item.cesium_token) {
            const resource = await IonResource.fromAssetId(item.asset_id, { accessToken: item.cesium_token });
            tileset = await Cesium3DTileset.fromUrl(resource);
          } else {
            tileset = await Cesium3DTileset.fromIonAssetId(item.asset_id);
          }
          if (cancelled) {
            tileset.destroy?.();
            return;
          }

          tileset.name = item.name || `Tileset ${item.asset_id}`;
          tileset.show = false;
          tileset._axsolAvailabilityCollections = availabilityCollections.length > 0 ? availabilityCollections : null;

          if (viewer && !viewer.isDestroyed?.()) {
            try { viewer.scene?.primitives?.add(tileset); } catch (e) { console.warn('[TilesetLayer] add tileset error:', e); }
          }
          if (clampToGround) {
            // Ejecutar en background y chequear que no esté destruido al aplicar
            clampTilesetToGround(tileset);
          }
          // Aplicar opacidad inicial si corresponde
          try {
            if (typeof opacityPercent === 'number') {
              const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
              tileset.style = new Cesium3DTileStyle({ color: `color('white', ${alpha})` });
            }
          } catch (e) {
            console.warn('[TilesetLayer] No se pudo aplicar opacidad inicial:', e);
          }
          existingMap.set(item.asset_id, {
            tileset,
            availabilityCollections,
            disabled: false,
            originalModelMatrix: Matrix4.clone(tileset.modelMatrix),
          });

          if (!hasFlownRef.current) {
            viewer.flyTo(tileset).catch((error) => console.warn('[TilesetLayer] flyTo error:', error));
            hasFlownRef.current = true;
          }
        } catch (error) {
          console.error(`Error loading tileset ${item.asset_id}:`, error);
        }
      }

      applyVisibility();
    };

    loadTilesets();

    return () => {
      cancelled = true;
    };
  }, [viewer, metadata, toCollections, applyVisibility]);

  // Reaplicar o restaurar clamp cuando cambia el flag
  useEffect(() => {
    if (!viewer) return;
    const entries = tilesetsRef.current;
    entries.forEach(({ tileset, disabled, originalModelMatrix }) => {
      try {
        if (!tileset || tileset.isDestroyed?.() || disabled) return;
        if (clampToGround) {
          clampTilesetToGround(tileset);
        } else if (originalModelMatrix) {
          tileset.modelMatrix = Matrix4.clone(originalModelMatrix);
        }
      } catch (e) {
        console.warn('[TilesetLayer] Error al alternar clamp:', e);
      }
    });
  }, [viewer, clampToGround, clampTilesetToGround, heightOffsetMeters]);

  useEffect(() => {
    applyVisibility();
  }, [applyVisibility]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed?.()) {
      return undefined;
    }

    return () => {
      try {
        tilesetsRef.current.forEach(({ tileset }) => {
          try { if (viewer && !viewer.isDestroyed?.()) viewer.scene?.primitives?.remove(tileset); } catch {}
          try { tileset.destroy?.(); } catch {}
        });
      } finally {
        tilesetsRef.current.clear();
      }
    };
  }, [viewer]);

  return null;
};

const CzmlLayer = ({ data, visible, layerKey, splitDirection = null }) => {
  const { viewer } = useCesium();
  const dataSourceRef = useRef(null);
  const visibilityRef = useRef(visible);

  useEffect(() => {
    visibilityRef.current = visible;
    if (dataSourceRef.current) {
      dataSourceRef.current.show = Boolean(visible);
    }
  }, [visible]);

  useEffect(() => {
    if (!viewer) {
      return undefined;
    }

    let cancelled = false;
    const currentDataSource = dataSourceRef.current;

    const load = async () => {
      if (!data) {
        if (currentDataSource) {
          viewer.dataSources.remove(currentDataSource);
          dataSourceRef.current = null;
        }
        return;
      }

      const clockState = captureClockState(viewer);

      try {
        const ds = await CesiumCzmlDataSource.load(data, {
          sourceUri: `${layerKey || 'czml'}.json`,
        });

        if (cancelled) {
          ds.destroy();
          return;
        }

        if (dataSourceRef.current) {
          viewer.dataSources.remove(dataSourceRef.current, true);
        }

        viewer.dataSources.add(ds);
        ds.show = Boolean(visibilityRef.current);
        // Marcar entidades con la key de capa para detección al click
        try {
          const ents = ds?.entities?.values || [];
          ents.forEach((e) => { try { e._axsolLayerKey = layerKey; } catch {} });
        } catch {}
        // Populate global loadedBillboards for normal photos layer
        try {
          if (layerKey === 'fotos' || layerKey === 'images') {
            const entities = ds?.entities?.values || [];
            const toUrl = (entity) => {
              try {
                let description = null;
                if (entity.description) description = entity.description.getValue ? entity.description.getValue() : entity.description;
                if (description) {
                  const m1 = description.match(/src=['"]([^'\"]+)['"]/i);
                  const m2 = description.match(/(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp))/i);
                  if (m1 && m1[1]) return m1[1];
                  if (m2 && m2[1]) return m2[1];
                }
                if (entity.properties) {
                  const gv = (k) => { try { return entity.properties[k]?.getValue?.() ?? entity.properties[k]; } catch { return null; } };
                  return gv('thumbnail') || gv('image') || gv('url') || null;
                }
              } catch {}
              return null;
            };
            const getProp = (entity, key) => { try { return entity.properties?.[key]?.getValue?.() ?? entity.properties?.[key]; } catch { return undefined; } };
            const now = JulianDate.now ? JulianDate.now() : undefined;
            window.loadedBillboards = entities.map((entity) => {
              const pos = entity.position && entity.position.getValue ? entity.position.getValue(now) : null;
              const url = toUrl(entity);
              const fechaCaptura = getProp(entity, 'date') || getProp(entity, 'timestamp');
              return {
                entity,
                id: entity.id,
                name: entity.name,
                position: pos,
                url,
                fechaCaptura,
                metadata: entity.properties || {},
              };
            });
            console.log('[CzmlLayer] loadedBillboards poblado:', Array.isArray(window.loadedBillboards) ? window.loadedBillboards.length : 0);
          }
        } catch (e) {
          console.warn('[CzmlLayer] No se pudo poblar loadedBillboards:', e);
        }
        
        // Aplicar SplitDirection si está especificado
        if (splitDirection) {
          const direction = splitDirection === 'left' ? SplitDirection.LEFT : SplitDirection.RIGHT;
          ds.entities.values.forEach(entity => {
            if (entity.billboard) {
              entity.billboard.splitDirection = direction;
            }
            if (entity.model) {
              entity.model.splitDirection = direction;
            }
            if (entity.point) {
              entity.point.splitDirection = direction;
            }
            if (entity.label) {
              entity.label.splitDirection = direction;
            }
          });
          console.log(`[CzmlLayer] Aplicado SplitDirection.${splitDirection.toUpperCase()} a ${ds.entities.values.length} entidades`);
        }
        
        dataSourceRef.current = ds;
        restoreClockState(viewer, clockState);
      } catch (error) {
        console.error(`[CzmlLayer] Error al cargar CZML (${layerKey}):`, error);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (dataSourceRef.current) {
        viewer.dataSources.remove(dataSourceRef.current, true);
        dataSourceRef.current = null;
      }
    };
  }, [viewer, data, layerKey]);

  return null;
};

export default ProjectVisualizer;
