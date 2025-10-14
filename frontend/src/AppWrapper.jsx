import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './context/UserContext.jsx';
import api from './config/api';
import App from './App';

const AppWrapper = () => {
  const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();
  const { setUser, setLoadingUser, loadingUser } = useUser();
  const navigate = useNavigate();

  // Establecer loadingUser a false inmediatamente para usuarios no autenticados
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[AppWrapper] Usuario no autenticado, estableciendo loadingUser a false');
      setLoadingUser(false);
    }
  }, [isLoading, isAuthenticated, setLoadingUser]);

  // Manejar redirección post-login
  useEffect(() => {
    const handlePostLoginRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state && isAuthenticated) {
        // Verificar si hay un returnTo en el appState
        const appState = JSON.parse(sessionStorage.getItem('auth0.appState') || '{}');
        const returnTo = appState.returnTo;
        
        if (returnTo && returnTo !== '/') {
          console.log('[AppWrapper] Redirigiendo post-login a:', returnTo);
          // Limpiar los parámetros de la URL y redirigir
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate(returnTo, { replace: true });
          sessionStorage.removeItem('auth0.appState');
          return;
        }
      }
    };

    if (isAuthenticated && !isLoading) {
      handlePostLoginRedirect();
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const getUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/api/user/me');
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoadingUser(false);
        }
      } else {
        // Para usuarios no autenticados, establecer inmediatamente loadingUser a false
        setLoadingUser(false);
      }
    };

    if (!isLoading) {
      getUserProfile();
    }
  }, [isAuthenticated, getAccessTokenSilently, setUser, setLoadingUser, isLoading]);

  console.log('[AppWrapper] Estado actual:', {
    isLoading,
    loadingUser,
    isAuthenticated
  });

  // Fallback de seguridad: si algo queda colgado, liberar el loading tras 8s
  useEffect(() => {
    if (!loadingUser) return;
    const t = setTimeout(() => {
      console.warn('[AppWrapper] Timeout de carga alcanzado, liberando loadingUser');
      try { setLoadingUser(false); } catch {}
    }, 8000);
    return () => clearTimeout(t);
  }, [loadingUser, setLoadingUser]);

  if (loadingUser) {
     return <div className="loading-container">Cargando aplicación...</div>;
  }

  return <App />;
};

export default AppWrapper;
