import React, { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import { CzmlDataSource as CesiumCzmlDataSource, SplitDirection } from 'cesium';

const CzmlComparisonLayer = ({ data, visible, layerKey, splitDirection = null }) => {
  const { viewer } = useCesium();
  const dataSourceRef = useRef(null);
  const visibilityRef = useRef(visible);

  // Función para capturar el estado del reloj
  const captureClockState = (viewer) => {
    if (!viewer?.clock) {
      return null;
    }

    const { clock } = viewer;
    return {
      currentTime: clock.currentTime?.clone?.(),
      startTime: clock.startTime?.clone?.(),
      stopTime: clock.stopTime?.clone?.(),
      minimumTime: clock.minimumTime?.clone?.(),
      maximumTime: clock.maximumTime?.clone?.(),
      multiplier: clock.multiplier,
      shouldAnimate: clock.shouldAnimate,
      clockRange: clock.clockRange,
    };
  };

  // Función para restaurar el estado del reloj
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
          sourceUri: `${layerKey || 'czml'}-${splitDirection || 'normal'}.json`,
        });

        if (cancelled) {
          // No necesitamos destruir el DataSource aquí, solo retornar
          return;
        }

        if (dataSourceRef.current) {
          viewer.dataSources.remove(dataSourceRef.current, true);
        }

        viewer.dataSources.add(ds);
        ds.show = Boolean(visibilityRef.current);
        
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
          console.log(`[CzmlComparisonLayer] Aplicado SplitDirection.${splitDirection.toUpperCase()} a ${ds.entities.values.length} entidades (${layerKey})`);
        }
        
        dataSourceRef.current = ds;
        restoreClockState(viewer, clockState);
      } catch (error) {
        console.error(`[CzmlComparisonLayer] Error al cargar CZML (${layerKey}-${splitDirection}):`, error);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (dataSourceRef.current && viewer) {
        try {
          viewer.dataSources.remove(dataSourceRef.current, true);
        } catch (error) {
          console.warn('[CzmlComparisonLayer] Error removing data source:', error);
        }
        dataSourceRef.current = null;
      }
    };
  }, [viewer, data, layerKey, splitDirection]);

  return null;
};

export default CzmlComparisonLayer;
