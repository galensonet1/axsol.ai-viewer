import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSpaPageviews } from './hooks/useSpaPageviews';
import { useClarityScreen } from './hooks/useClarity';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProtectedRoute from './components/ProtectedRoute'; // Importación correcta
import ProjectDashboard from './components/ProjectDashboard';
import ProjectVisualizer from './components/ProjectVisualizer';

// Componente para manejar la redirección por defecto
const ProjectRedirect = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('[ProjectRedirect] Redirigiendo a viewer para proyecto:', projectId);
    navigate(`/projects/${projectId}/viewer`, { replace: true });
  }, [projectId, navigate]);
  
  return null;
};

export function LayoutRoot({ children }) {
  const { pathname, search } = useLocation();
  
  // Track pageviews in PostHog
  useSpaPageviews(() => pathname + search);
  
  // Track screen changes in Microsoft Clarity
  useClarityScreen();
  
  return children;
}

function App() {

  return (
    <LayoutRoot>
      <Routes>
        {/* La página de login tiene una lógica especial en AppWrapper */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route path="/" element={<ProtectedRoute component={HomePage} />} />
        
        {/* Rutas anidadas para un proyecto específico */}
        <Route path="/projects/:projectId" element={<ProtectedRoute component={ProjectDetailPage} />}>
          {/* Redirección por defecto a viewer */}
          <Route index element={<ProjectRedirect />} />
          <Route path="dashboard" element={<ProjectDashboard />} />
          <Route path="viewer" element={<ProjectVisualizer />} />
        </Route>
        
        {/* Puedes añadir más rutas protegidas aquí */}
      </Routes>
    </LayoutRoot>
  );
}

export default App;
