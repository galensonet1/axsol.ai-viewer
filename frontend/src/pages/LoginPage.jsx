import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL a la que redirigir después del login (viene del ProtectedRoute)
  const redirectTo = location.state?.from || '/';
  
  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir a la URL original
    if (isAuthenticated) {
      console.log('[LoginPage] Usuario ya autenticado, redirigiendo a:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);
  
  const handleLogin = () => {
    console.log('[LoginPage] Iniciando login con redirección a:', redirectTo);
    
    // Guardar el destino de redirección en sessionStorage
    const appState = { returnTo: redirectTo };
    sessionStorage.setItem('auth0.appState', JSON.stringify(appState));
    
    // Configurar Auth0 para redirigir a la URL original después del login
    loginWithRedirect({
      appState: appState
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
      </Box>
    </Box>
  );
};

export default LoginPage;
