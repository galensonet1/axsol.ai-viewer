import axios from 'axios';

// Determinar base en runtime
const runtimeBase = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.apiBaseUrl)
  ? window.__CONFIG__.apiBaseUrl
  : (typeof window !== 'undefined' ? window.location.origin : '');

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: runtimeBase,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    // El token se agregará automáticamente por Auth0 cuando sea necesario
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
export const API_BASE_URL = runtimeBase;
