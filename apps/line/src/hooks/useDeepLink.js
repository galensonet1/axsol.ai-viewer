import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook para manejar enlaces profundos (deep links) en el visor 3D
 * Permite compartir y restaurar el estado completo de la vista 3D
 */
export const useDeepLink = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  /**
   * Codifica el estado de la vista 3D en una cadena base64
   */
  const encodeViewState = useCallback((viewState) => {
    try {
      const jsonString = JSON.stringify(viewState);
      return btoa(jsonString);
    } catch (error) {
      console.error('[useDeepLink] Error encoding view state:', error);
      return null;
    }
  }, []);
  
  /**
   * Decodifica una cadena base64 al estado de la vista 3D
   */
  const decodeViewState = useCallback((encoded) => {
    try {
      const jsonString = atob(encoded);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[useDeepLink] Error decoding view state:', error);
      return null;
    }
  }, []);
  
  /**
   * Actualiza la URL con el estado actual de la vista
   */
  const updateURL = useCallback((viewState) => {
    const encoded = encodeViewState(viewState);
    if (encoded) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('view', encoded);
      setSearchParams(newParams, { replace: true });
    }
  }, [encodeViewState, searchParams, setSearchParams]);
  
  /**
   * Obtiene el estado de la vista desde la URL
   */
  const getViewFromURL = useCallback(() => {
    const view = searchParams.get('view');
    return view ? decodeViewState(view) : null;
  }, [searchParams, decodeViewState]);
  
  /**
   * Genera una URL completa para compartir
   */
  const generateShareableURL = useCallback((viewState) => {
    const encoded = encodeViewState(viewState);
    if (!encoded) return null;
    
    const currentURL = new URL(window.location);
    currentURL.searchParams.set('view', encoded);
    return currentURL.toString();
  }, [encodeViewState]);
  
  /**
   * Limpia el parámetro de vista de la URL
   */
  const clearViewFromURL = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('view');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  return {
    updateURL,
    getViewFromURL,
    generateShareableURL,
    clearViewFromURL
  };
};

/**
 * Estructura del estado de vista 3D
 */
export const createViewState = (camera, date, layers, additionalData = {}) => ({
  camera: {
    lat: camera.lat,
    lon: camera.lon,
    alt: camera.alt,
    heading: camera.heading,
    pitch: camera.pitch,
    roll: camera.roll
  },
  date: date,
  layers: layers || [],
  timestamp: Date.now(),
  version: '1.0',
  ...additionalData
});

export default useDeepLink;
