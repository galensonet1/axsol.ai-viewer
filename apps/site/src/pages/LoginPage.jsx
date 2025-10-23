import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, error } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL a la que redirigir después del login (viene del ProtectedRoute)
  const redirectTo = location.state?.from || '/';
  
  useEffect(() => {
    console.log('[LoginPage] Estado Auth0:', { isAuthenticated, error, redirectTo });
    
    // Si hay error de Auth0, mostrarlo y limpiar URL
    if (error) {
      console.error('[LoginPage] ❌ Error de Auth0:', error);
      
      // Limpiar parámetros de error de la URL
      if (window.location.search.includes('error=')) {
        console.log('[LoginPage] 🧹 Limpiando parámetros de error de la URL');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // También limpiar cualquier estado de Auth0 en localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('@@auth0spajs@@')) {
            console.log('[LoginPage] 🧹 Limpiando cache de Auth0:', key);
            localStorage.removeItem(key);
          }
        });
      }
    }
    
    // Si el usuario ya está autenticado, redirigir a la URL original
    if (isAuthenticated) {
      console.log('[LoginPage] Usuario ya autenticado, redirigiendo a:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, error, navigate, redirectTo]);
  
  const handleLogin = () => {
    console.log('[LoginPage] Iniciando login con redirección a:', redirectTo);
    console.log('[LoginPage] Auth0 config:', {
      domain: import.meta.env.VITE_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    });
    
    // Guardar el destino de redirección en sessionStorage
    const appState = { returnTo: redirectTo };
    sessionStorage.setItem('auth0.appState', JSON.stringify(appState));
    
    // Configurar Auth0 para redirigir a la URL original después del login
    loginWithRedirect({
      appState: appState
    }).catch(error => {
      console.error('[LoginPage] Error en loginWithRedirect:', error);
    });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      backgroundColor: 'rgb(15, 22, 31)',
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 2,
        width: '100%',
        color: '#ffffff',
      }}>
        <Box component="img" src="/ingeIA-logo-1-oscuro.png" alt="IngeIA" sx={{ width: '50vmin', height: 'auto', maxWidth: '90vw' }} />
        <Typography variant="body1" sx={{ color: '#ffffff' }}>Por favor, inicia sesión para continuar.</Typography>
        <Button
          variant="contained"
          onClick={handleLogin}
          sx={{
            mt: 1,
            px: 3,
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#ffffff',
            color: '#0f161f',
            '&:hover': { backgroundColor: '#e6e6e6' },
          }}
        >
          Iniciar Sesión
        </Button>
        
        
        {/* Botón para limpiar estado */}
        {error && (
          <Button
            variant="outlined"
            onClick={() => {
              console.log('[LoginPage] 🧹 Limpiando estado de Auth0 manualmente');
              
              // Limpiar localStorage de Auth0
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('@@auth0spajs@@')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Limpiar sessionStorage
              Object.keys(sessionStorage).forEach(key => {
                if (key.includes('auth0')) {
                  sessionStorage.removeItem(key);
                }
              });
              
              // Recargar página
              window.location.reload();
            }}
            sx={{
              mt: 1,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: '#ff6b6b',
              color: '#ff6b6b',
              '&:hover': { borderColor: '#ff5252', backgroundColor: 'rgba(255,107,107,0.1)' },
            }}
          >
            🧹 Limpiar Estado y Reintentar
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LoginPage;
