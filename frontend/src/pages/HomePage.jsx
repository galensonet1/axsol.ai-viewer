import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Box, AppBar, Toolbar, Typography, Container, Grid, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import useApi from '../hooks/useApi';
import GlobalMap from '../components/GlobalMap';
import ProjectList from '../components/ProjectList';
import UserMenu from '../components/UserMenu';

const HomePage = () => {
  const { data: projects, loading, error } = useApi('/projects');
  
  console.log('[HomePage] Rendering with:', { projects, loading, error });

  try {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
          sx={{
            px: 3,
            py: 1,
            backgroundColor: '#ffffffdd',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Axsol
              </Typography>
              <Typography variant="h6" component="div">
                Inicio
              </Typography>
            </Box>
            <UserMenu />
          </Toolbar>
        </AppBar>
        <Container
          component="main"
          maxWidth="xl"
          sx={{
            flexGrow: 1,
            py: 3,
            mt: '72px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Cargando proyectos...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, flexDirection: 'column' }}>
              <Typography color="error" variant="h6">Error al cargar proyectos</Typography>
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
              <Grid xs={12} md={8} sx={{ height: { xs: '50%', md: '100%' } }}>
                <GlobalMap />
              </Grid>
              <Grid xs={12} md={4} sx={{ height: { xs: '50%', md: '100%' } }}>
                <ProjectList projects={projects} />
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    );
  } catch (renderError) {
    console.error('[HomePage] Error rendering:', renderError);
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Typography color="error" variant="h6">Error en la página de inicio</Typography>
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {renderError.message || 'Error desconocido'}
        </Typography>
      </Box>
    );
  }
};

export default HomePage;
