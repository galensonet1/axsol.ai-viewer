import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../config/api';

// Flag para habilitar la descarga temporal del CZML con fines de depuración.
// Cambiar a "false" cuando ya no sea necesario.
const DEBUG_CZML_DOWNLOAD = false;

const layerCache = new Map();

const useLayerData = (projectId, layerType, { fetchOnMount = true } = {}) => {
  const [layerData, setLayerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestKeyRef = useRef(null);

  const shouldFetch = Boolean(projectId && layerType && fetchOnMount);

  useEffect(() => {
    console.log(`[useLayerData] Hook triggered for projectId: ${projectId}, layerType: ${layerType}, fetchOnMount: ${fetchOnMount}`);

    if (!projectId || !layerType) {
      setLayerData(null);
      return;
    }

    const cacheKey = `${projectId}:${layerType}`;
    if (layerCache.has(cacheKey)) {
      const cachedData = layerCache.get(cacheKey);
      setLayerData((prev) => (prev === cachedData ? prev : cachedData));
      if (!shouldFetch) {
        setIsLoading(false);
        setError(null);
        return;
      }
    }

    const fetchData = async () => {
      const cacheKey = `${projectId}:${layerType}`;
      requestKeyRef.current = cacheKey;

      if (layerCache.has(cacheKey)) {
        console.log(`[useLayerData] Cache hit for ${cacheKey}`);
        setLayerData(layerCache.get(cacheKey));
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log(`[useLayerData] Fetching data for projectId: ${projectId}, layerType: ${layerType}`);
        const response = await api.get(`/api/projects/${projectId}/czml/${layerType}`);
        const data = response.data;
        if (requestKeyRef.current !== cacheKey) {
          console.log('[useLayerData] Response discarded due to key mismatch.');
          return;
        }
        setLayerData(data);
        layerCache.set(cacheKey, data);

        if (DEBUG_CZML_DOWNLOAD && data) {
          const isCzml = layerType !== '3dtile';
          const fileExtension = isCzml ? 'czml' : 'json';
          console.log(`[useLayerData] Data received for ${layerType}. Triggering download as ${fileExtension}.`);
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${layerType}.${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error(`Error fetching data for layer ${layerType}:`, error);
        setLayerData(null);
        setError(error);
      }
      setIsLoading(false);
    };

    if (shouldFetch) {
      fetchData();
    }
  }, [projectId, layerType, shouldFetch, fetchOnMount]);

  const triggerFetch = useCallback(async (date = null) => {
    if (!projectId || !layerType) {
      return;
    }

    // Incluir fecha en la clave de caché si se proporciona
    const cacheKey = date ? `${projectId}:${layerType}:${date}` : `${projectId}:${layerType}`;
    if (layerCache.has(cacheKey)) {
      setLayerData(layerCache.get(cacheKey));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useLayerData] Triggered manual fetch for ${cacheKey}`);
      // Construir URL con parámetro de fecha si se proporciona
      const url = date 
        ? `/api/projects/${projectId}/czml/${layerType}?date=${date}`
        : `/api/projects/${projectId}/czml/${layerType}`;
      const response = await api.get(url);
      const data = response.data;
      layerCache.set(cacheKey, data);
      setLayerData(data);
    } catch (fetchError) {
      console.error(`[useLayerData] Error en triggerFetch para ${cacheKey}:`, fetchError);
      setError(fetchError);
      setLayerData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, layerType]);

  return { layerData, isLoading, error, triggerFetch };
};

export default useLayerData;
