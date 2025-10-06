import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Box, CircularProgress } from '@mui/material';
import { Viewer, GeoJsonDataSource } from 'resium';
import {
  Color,
  Ion,
  JulianDate,
  Cesium3DTileset,
  TimeIntervalCollection,
  TimeInterval,
  ClockRange,
  createWorldTerrainAsync,
  CzmlDataSource as CesiumCzmlDataSource,
  Terrain,
  CesiumTerrainProvider,
  ScreenSpaceEventType,
  Cartographic,
  Math as CesiumMath,
} from 'cesium';
import useLayerData from '../hooks/useCzmlData';
import useAssetDates from '../hooks/useAssetDates';
import { useCesium } from 'resium';
import './ProjectVisualizer.css';
import LayerSelector from './LayerSelector';
import ViewerToolBar from './ViewerToolBar';
import InfoBox from './InfoBox';

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
  const imagesPrefetchedRef = useRef(false);
  const [layerVisibility, setLayerVisibility] = useState({
    layout: true,
    realidad3D: true,
    proyecto3D: false,
    fotos: true,
    fotos360: true,
    terreno: 20, // Opacidad del terreno en porcentaje (0-100)
  });
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [clockLabel, setClockLabel] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [terrainProvider, setTerrainProvider] = useState(null);
  const [selectedCaptureDate, setSelectedCaptureDate] = useState(null);
  const [cesiumViewer, setCesiumViewer] = useState(null);

  const tilesetLayer = useLayerData(projectId, '3dtile');
  const imagesLayer = useLayerData(projectId, 'images', { fetchOnMount: false });
  const images360Layer = useLayerData(projectId, 'images360', { fetchOnMount: false });
  const { availableDates: availableCaptureDates, isLoading: datesLoading } = useAssetDates(projectId);

  // Debug: verificar projectId
  useEffect(() => {
    console.log('[ProjectVisualizer] Componente inicializado con projectId:', projectId);
  }, [projectId]);

  const tilesetMetadata = tilesetLayer.layerData;
  const imagesCzml = imagesLayer.layerData;
  const images360Czml = images360Layer.layerData;
  const requestImagesLayer = imagesLayer.triggerFetch;
  const requestImages360Layer = images360Layer.triggerFetch;

  // Función para inicializar el viewer cuando esté listo
  const handleViewerReady = (viewer) => {
    console.log('[ProjectVisualizer] Viewer ready:', viewer);
    setCesiumViewer(viewer);
    
    // Exponer el viewer globalmente para InfoBox
    window.cesiumViewer = viewer;
    window.Cesium = window.Cesium || viewer.cesium || Cesium;
    
    // Configurar event handlers
    configureEventHandlers(viewer);
    
    // Test básico: agregar un console.log simple al hacer click en cualquier parte
    console.log('[ProjectVisualizer] Configurando event handler básico...');
    
    try {
      viewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
        console.log('🔥 CLICK DETECTADO! Posición:', event.position);
        
        const pickedObject = viewer.scene.pick(event.position);
        console.log('🔥 Objeto picked:', pickedObject);
        
        if (pickedObject) {
          console.log('🔥 Tipo de objeto:', pickedObject.constructor.name);
          console.log('🔥 Tiene ID?', !!pickedObject.id);
          
          if (pickedObject.id) {
            console.log('🔥 ID del objeto:', pickedObject.id);
            console.log('🔥 Propiedades del ID:', Object.keys(pickedObject.id));
            
            // Llamar directamente a handleElementSelection
            console.log('🔥 Llamando a handleElementSelection...');
            handleElementSelection(pickedObject.id);
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
      
      console.log('[ProjectVisualizer] Event handler configurado exitosamente');
      
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
        lon: CesiumMath.toDegrees(cartographic.longitude)
      };
    } catch (e) {
      return null;
    }
  };

  const handleElementSelection = useCallback((entity) => {
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
          
          elementData = {
            name: getPropertyValue(props, 'name') || entity.name || entity.id || 'Fotografía',
            date: getPropertyValue(props, 'date') || getPropertyValue(props, 'timestamp') || getPropertyValue(props, 'captureDate'),
            thumbnail: imageUrl,
            coordinates: entity.position ? getCoordinatesFromPosition(entity.position) : null,
            description: getPropertyValue(props, 'description') || getPropertyValue(props, 'notes')
          };
          
          console.log('[ProjectVisualizer] Datos de foto extraídos:', elementData);
        } else if (entityType === 'photo360' || entityType === 'panorama') {
          elementType = 'photo360';
          
          // Extraer URL de imagen desde la descripción
          const imageUrl = extractImageUrlFromDescription(entity) || 
                          getPropertyValue(props, 'thumbnail') || 
                          getPropertyValue(props, 'image') || 
                          getPropertyValue(props, 'url');
          
          elementData = {
            name: getPropertyValue(props, 'name') || entity.name || entity.id || 'Foto 360°',
            date: getPropertyValue(props, 'date') || getPropertyValue(props, 'timestamp') || getPropertyValue(props, 'captureDate'),
            thumbnail: imageUrl,
            coordinates: entity.position ? getCoordinatesFromPosition(entity.position) : null
          };
          
          console.log('[ProjectVisualizer] Datos de foto 360° extraídos:', elementData);
        }
      } else {
        // Si no tiene propiedades pero tiene billboard, asumir que es una foto
        elementType = 'photo';
        
        // Extraer URL de imagen desde la descripción incluso sin propiedades
        const imageUrl = extractImageUrlFromDescription(entity);
        
        elementData = {
          name: entity.name || entity.id || 'Fotografía',
          thumbnail: imageUrl,
          coordinates: entity.position ? getCoordinatesFromPosition(entity.position) : null
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

    console.log('[ProjectVisualizer] Elemento seleccionado:', elementType, elementData);
  }, [setSelectedElement]); // useCallback dependencies

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
      // Configurar event handler para clicks
      cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction((event) => {
        console.log('🔥 CLICK DETECTADO! Posición:', event.position);
        
        const pickedObject = cesiumViewer.scene.pick(event.position);
        console.log('🔥 Objeto picked:', pickedObject);
        
        if (pickedObject) {
          console.log('🔥 Tipo de objeto:', pickedObject.constructor.name);
          console.log('🔥 Tiene ID?', !!pickedObject.id);
          
          if (pickedObject.id) {
            console.log('🔥 ID del objeto:', pickedObject.id);
            console.log('🔥 Propiedades del ID:', Object.keys(pickedObject.id));
            
            // Llamar directamente a handleElementSelection
            console.log('🔥 Llamando a handleElementSelection...');
            handleElementSelection(pickedObject.id);
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
          baseLayerPicker={true}
          homeButton={true}
          sceneModePicker={true}
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
        {layerVisibility.layout && layoutData && (
          <GeoJsonDataSource
            data={layoutData}
            stroke={Color.YELLOW}
            fill={Color.YELLOW.withAlpha(0.2)}
            strokeWidth={3}
            onLoad={(dataSource) => viewerRef.current?.cesiumElement?.zoomTo(dataSource)}
          />
        )}

        {tilesetMetadata && (
          <TilesetLayer metadata={tilesetMetadata} visible={layerVisibility.realidad3D} />
        )}
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
        </Viewer>
        <Box className="axsol-watermark">
          <img src="/logo-axsol-ai.svg" alt="AXSOL.ai" />
        </Box>
        <LayerSelector
          layerVisibility={layerVisibility}
          onLayerVisibilityChange={setLayerVisibility}
          open={layerPanelOpen && !selectedElement}
          onToggle={() => {
            // Si hay InfoBox abierto, cerrarlo primero
            if (selectedElement) {
              console.log('[ProjectVisualizer] Cerrando InfoBox para abrir LayerSelector');
              setSelectedElement(null);
              // Luego abrir el LayerSelector en el próximo render
              setTimeout(() => setLayerPanelOpen(true), 50);
            } else {
              // Comportamiento normal de toggle
              setLayerPanelOpen((prev) => !prev);
            }
          }}
          availableCaptureDates={availableCaptureDates}
          selectedCaptureDate={selectedCaptureDate}
          onCaptureDateChange={setSelectedCaptureDate}
          datesLoading={datesLoading}
        />
        <ViewerToolBar
          onToolSelect={(tool, subTool) => {
            console.log('Herramienta seleccionada:', tool, subTool);
            // TODO: Implementar lógica de herramientas
          }}
        />
        <InfoBox
          selectedElement={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      </Box>

    </Box>
  );
}

const TilesetLayer = ({ metadata, visible }) => {
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
    if (!viewer) {
      return;
    }

    const entries = tilesetsRef.current;
    entries.forEach(({ tileset, availabilityCollections }) => {
      if (!visible) {
        tileset.show = false;
        return;
      }

      if (!availabilityCollections || availabilityCollections.length === 0) {
        tileset.show = true;
        return;
      }

      const time = currentTime ?? viewer.clock?.currentTime;
      tileset.show = Boolean(time && availabilityCollections.some((collection) => collection.contains(time)));
    });
  }, [viewer, visible]);

  useEffect(() => {
    if (!viewer) {
      return undefined;
    }

    const listener = (clock) => {
      applyVisibility(clock.currentTime);
    };

    viewer.clock.onTick.addEventListener(listener);

    return () => {
      viewer.clock.onTick.removeEventListener(listener);
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
        viewer.scene.primitives.remove(entry.tileset);
        existingMap.delete(assetId);
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
          continue;
        }

        try {
          if (item.cesium_token) {
            Ion.defaultAccessToken = item.cesium_token;
          }

          const tileset = await Cesium3DTileset.fromIonAssetId(item.asset_id);
          if (cancelled) {
            tileset.destroy?.();
            return;
          }

          tileset.name = item.name || `Tileset ${item.asset_id}`;
          tileset.show = false;
          tileset._axsolAvailabilityCollections = availabilityCollections.length > 0 ? availabilityCollections : null;

          viewer.scene.primitives.add(tileset);
          existingMap.set(item.asset_id, {
            tileset,
            availabilityCollections,
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

  useEffect(() => {
    applyVisibility();
  }, [applyVisibility]);

  useEffect(() => {
    if (!viewer) {
      return undefined;
    }

    return () => {
      tilesetsRef.current.forEach(({ tileset }) => {
        viewer.scene.primitives.remove(tileset);
        tileset.destroy?.();
      });
      tilesetsRef.current.clear();
    };
  }, [viewer]);

  return null;
};

const CzmlLayer = ({ data, visible, layerKey }) => {
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
