import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ component: Component }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    // Muestra un indicador de carga mientras se verifica la autenticación
    return <div className="loading-container">Verificando sesión...</div>;
  }

  // Si el usuario está autenticado, renderiza el componente solicitado.
  // Si no, lo redirige a la página de login con la URL actual como estado
  return isAuthenticated ? (
    <Component />
  ) : (
    <Navigate 
      to="/login" 
      state={{ from: location.pathname + location.search }} 
      replace 
    />
  );
};

export default ProtectedRoute;
