import React from 'react';
import Grid from '@mui/material/Grid';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProject } from '../context/ProjectContext'; // Importar el hook del contexto
import useApi from '../hooks/useApi';

const formatCurrency = (value) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const KpiCard = ({ title, value, subValue }) => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
    <Typography variant="h4" component="p">{value}</Typography>
    {subValue && <Typography variant="body2" color="text.secondary">{subValue}</Typography>}
  </Paper>
);

const ProjectDashboard = () => {
  const { projectId } = useProject(); // Obtener projectId del contexto
  const { data, loading, error } = useApi(`/projects/${projectId}/kpis`);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">Error al cargar los datos: {error}</Typography>;
  }

    if (!data || !data.kpis || !data.sCurve) {
    // Muestra un estado vacío o un mensaje si la estructura de datos no es la esperada
    return <Typography>No hay datos de KPIs disponibles para este proyecto.</Typography>;
  }

  const { sCurve, kpis } = data;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Fila de KPIs */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="CAPEX Total" value={formatCurrency(kpis.totalCapex)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="OPEX Total" value={formatCurrency(kpis.totalOpex)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Desviación Total" value="-16,67%" subValue="-US$ 182.108,99" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard title="Proyección de Cierre" value="$15.2M" subValue="+8% sobre presupuesto" />
        </Grid>

        {/* Gráfico Curva S */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" mb={2}>Curva S</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={sCurve.map(d => ({...d, report_date: formatDate(d.report_date)}))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="report_date" />
                <YAxis 
                  tickFormatter={(value) => `${value}%`} 
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="planned_progress" name="Planificado" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="actual_progress" name="Real" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDashboard;
