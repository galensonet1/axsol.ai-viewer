import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    <div>
      <h1>Acceso a la Plataforma</h1>
      <p>Por favor, inicia sesión para continuar.</p>
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
  );
};

export default LoginPage;
