import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

// Un componente reutilizable para cada tarjeta de KPI
const KpiCard = ({ title, value, color }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      p: 2, 
      textAlign: 'center', 
      color: 'white', 
      backgroundColor: color || 'primary.main'
    }}
  >
    <Typography variant="h6" component="div">{title}</Typography>
    <Typography variant="h4">{value}</Typography>
  </Paper>
);

const GlobalKPIs = ({ projects }) => {
  // Cálculo de los KPIs
  const totalProjects = projects.length;

  const activeProjects = projects.filter(p => p.status === 'Activo').length;

  const activeProjectsWithProgress = projects.filter(p => p.status === 'Activo' && p.progress_percentage != null);
  const averageProgress = activeProjectsWithProgress.length > 0
    ? Math.round(activeProjectsWithProgress.reduce((acc, p) => acc + p.progress_percentage, 0) / activeProjectsWithProgress.length)
    : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <KpiCard title="Total de Proyectos" value={totalProjects} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard title="Proyectos Activos" value={activeProjects} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard title="Avance Promedio (Activos)" value={`${averageProgress}%`} color="#f57c00" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GlobalKPIs;
