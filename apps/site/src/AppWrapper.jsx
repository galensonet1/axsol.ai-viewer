import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './context/UserContext.jsx';
import api from './config/api';
import App from './App';
import { identify, segmentTrack, customerioTrack } from '@ingeia/analytics';
import { trackEvent } from './utils/analytics';
import AnalyticsMonitorProvider from './components/AnalyticsMonitorProvider';

const AppWrapper = () => {
  const { isAuthenticated, getAccessTokenSilently, isLoading, error } = useAuth0();
  const { setUser, setLoadingUser, loadingUser } = useUser();
  const navigate = useNavigate();

  // Establecer loadingUser a false inmediatamente para usuarios no autenticados
  useEffect(() => {
    console.log('[AppWrapper] Estado Auth0 cambió:', { isLoading, isAuthenticated, error });
    
    if (error) {
      console.error('[AppWrapper] ❌ Error de Auth0 detectado:', error);
    }
    
    if (!isLoading && !isAuthenticated) {
      console.log('[AppWrapper] Usuario no autenticado, estableciendo loadingUser a false');
      setLoadingUser(false);
    }
  }, [isLoading, isAuthenticated, error, setLoadingUser]);

  // Manejar redirección post-login
  useEffect(() => {
    const handlePostLoginRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Solo procesar si hay parámetros de Auth0
      if (!code || !state) {
        return;
      }
      
      // Verificar si hay un returnTo en el appState (guardado antes del login)
      const appState = JSON.parse(sessionStorage.getItem('auth0.appState') || '{}');
      const returnTo = appState.returnTo;
      
      console.log('[AppWrapper] Post-login redirect:', { returnTo, currentPath: window.location.pathname });
      
      if (returnTo && returnTo !== '/') {
        console.log('[AppWrapper] Redirigiendo post-login a:', returnTo);
        
        // Limpiar los parámetros de Auth0 de la URL
        window.history.replaceState({}, document.title, returnTo);
        
        // Redirigir a la URL original
        navigate(returnTo, { replace: true });
        sessionStorage.removeItem('auth0.appState');
        return;
      }
      
      // Si no hay returnTo específico, solo limpiar los parámetros de Auth0 y quedarse en /
      console.log('[AppWrapper] No returnTo, redirigiendo a home');
      window.history.replaceState({}, document.title, '/');
      navigate('/', { replace: true });
      sessionStorage.removeItem('auth0.appState');
    };

    if (isAuthenticated && !isLoading) {
      handlePostLoginRedirect();
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const getUserProfile = async () => {
      if (isAuthenticated) {
        try {
          console.log('[AppWrapper] 🔑 Obteniendo token de Auth0...');
          const token = await getAccessTokenSilently();
          console.log('[AppWrapper] 🔑 Token obtenido:', token ? `${token.substring(0, 20)}...` : 'NULL');
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('[AppWrapper] 📡 Haciendo request a /api/user/me con token');
          const response = await api.get('/api/user/me');
          const userData = response.data;
          
          console.log('[AppWrapper] User loaded:', userData?.email, 'ID:', userData?.id, 'Roles:', userData?.roles);
          
          setUser(userData);
          
          // Identify user in analytics (PostHog + Customer.io + Segment)
          if (userData && userData.id) {
            console.log('[Analytics] Identifying user:', userData.email);
            
            identify(userData.id.toString(), {
              email: userData.email,
              name: userData.name,
              roles: userData.roles,
              active: userData.active,
              created_at: userData.created_at,
              // Add custom properties
              user_id: userData.id,
              auth0_sub: userData.auth0_sub
            });
            
            // Track signup event for NEW users
            if (userData.isNewUser) {
              console.log('[Analytics] NEW USER DETECTED - Tracking signup event');
              const now = new Date().toISOString();
              
              if (typeof segmentTrack === 'function') {
                segmentTrack('User Signed Up', {
                  app: 'site',
                  email: userData.email,
                  name: userData.name,
                  roles: userData.roles,
                  timestamp: now,
                  source: 'auth0'
                });
              }
              
              // Track con función centralizada
              trackEvent('user_signed_up', {
                email: userData.email,
                name: userData.name,
                roles: userData.roles,
                source: 'auth0'
              });
            } else {
              // Track login event for EXISTING users
              const lastLogin = localStorage.getItem('last_login_tracked');
              const now = new Date().toISOString();
              
              // Only track login once per session (or every 24 hours)
              if (!lastLogin || new Date(now) - new Date(lastLogin) > 24 * 60 * 60 * 1000) {
                console.log('[Analytics] Tracking login event');
                
                if (typeof segmentTrack === 'function') {
                  segmentTrack('User Logged In', {
                    app: 'site',
                    email: userData.email,
                    roles: userData.roles,
                    timestamp: now
                  });
                }
                
                // Track con función centralizada
                console.log('🔥 [AppWrapper] Llamando trackEvent user_logged_in');
                trackEvent('user_logged_in', {
                  email: userData.email,
                  roles: userData.roles
                });
                
                localStorage.setItem('last_login_tracked', now);
              }
            }
          }
        } catch (error) {
          console.error('[AppWrapper] ❌ Error fetching user profile:', error);
          console.error('[AppWrapper] ❌ Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
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

  return (
    <AnalyticsMonitorProvider>
      <App />
    </AnalyticsMonitorProvider>
  );
};

export default AppWrapper;
