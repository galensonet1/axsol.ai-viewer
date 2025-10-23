/**
 * Admin Dashboard Page
 * Panel de administración con Analytics Monitor integrado
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Alert,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import AnalyticsMonitor from '../components/AnalyticsMonitor';
import { useAnalyticsMonitor } from '../hooks/useAnalyticsMonitor';
import { useUser } from '../context/UserContext';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    aria-labelledby={`admin-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AdminDashboard = ({ isModal = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);
  const { hasRole, user } = useUser();
  const {
    monitorStats,
    getDiscrepancies,
    getEmittingEvents,
    getFunctionalEvents,
    getNotDetectedEvents,
    exportData,
    resetMonitor
  } = useAnalyticsMonitor();

  // Verificar permisos de superadmin (rol=6)
  const isSuperAdmin = user?.roleIds?.includes(6) || user?.roles?.includes('Superadmin');
  
  if (!isSuperAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Acceso Denegado</Typography>
          <Typography>Solo los Superadministradores pueden acceder al Monitor de Eventos.</Typography>
        </Alert>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (filter, data) => {
    console.log('[AdminDashboard] Recibiendo cambio de filtro:', filter, 'Datos:', data.length, 'eventos');
    setCurrentFilter(filter);
    setFilteredData(data);
  };

  const handleExportAnalytics = () => {
    console.log('[AdminDashboard] Estado antes de exportar:', {
      currentFilter,
      filteredDataLength: filteredData.length,
      filteredDataSample: filteredData.slice(0, 3), // Solo los primeros 3 para ver estructura
      allDataFromHook: exportData() // Para comparar
    });
    
    // Verificar que tenemos datos filtrados
    if (filteredData.length === 0) {
      console.warn('[AdminDashboard] No hay datos filtrados para exportar. filteredData está vacío.');
      alert('No hay datos para exportar con el filtro actual.');
      return;
    }

    // Exportar solo los datos filtrados actuales
    const exportPayload = {
      filter: currentFilter,
      timestamp: new Date().toISOString(),
      totalEvents: filteredData.length,
      events: filteredData
    };
    
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nombre de archivo más descriptivo según el filtro
    const filterName = currentFilter === 'all' ? 'todos' : 
                      currentFilter === 'discrepancies' ? 'discrepancias' :
                      currentFilter === 'emitting' ? 'emitiendo' :
                      currentFilter === 'implemented' ? 'implementados' :
                      currentFilter === 'pending' ? 'pendientes' :
                      currentFilter === 'not_detected' ? 'no-detectados' :
                      currentFilter === 'functional' ? 'funcionando' : currentFilter;
    
    a.download = `analytics-${filterName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const discrepancies = getDiscrepancies();
  const emittingEvents = getEmittingEvents();
  const functionalEvents = getFunctionalEvents();
  const notDetectedEvents = getNotDetectedEvents();

  // Debug: Estado actual (comentado para evitar spam)
  // console.log('[AdminDashboard] Estado actual:', { currentFilter, filteredDataLength: filteredData.length, activeTab });

  return (
    <Box sx={{ p: isModal ? 2 : 3 }}>
      {/* Header - Solo mostrar si no es modal */}
      {!isModal && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Monitor de Eventos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitoreo en tiempo real de analytics - Solo Superadmin
          </Typography>
        </Box>
      )}

      {/* Analytics Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Discrepancias
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="error.main">
                {monitorStats.discrepancies || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eventos con problemas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Funcionando
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="success.main">
                {monitorStats.actuallyFunctional || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eventos operativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Total Detectados
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="primary.main">
                {monitorStats.detectedEvents || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                de {monitorStats.totalCatalogEvents || 0} catalogados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  No Detectados
                </Typography>
              </Box>
              <Typography variant="h3" component="div" color="warning.main">
                {notDetectedEvents.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eventos sin actividad
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Section */}
      {discrepancies.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ {discrepancies.length} Discrepancias Detectadas
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Los siguientes eventos tienen inconsistencias entre el catálogo y la realidad:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {discrepancies.slice(0, 5).map(event => (
              <Chip
                key={event.name}
                label={event.name}
                size="small"
                color="error"
                variant="outlined"
              />
            ))}
            {discrepancies.length > 5 && (
              <Chip
                label={`+${discrepancies.length - 5} más`}
                size="small"
                color="error"
              />
            )}
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="admin dashboard tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<AnalyticsIcon />}
            label="Analytics Monitor"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<DashboardIcon />}
            label="Sistema"
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Configuración"
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
          />
        </Tabs>

        {/* Analytics Monitor Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Monitor de Analytics en Tiempo Real
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={`Exportar datos filtrados: ${currentFilter === 'all' ? 'Todos los eventos' : 
                  currentFilter === 'discrepancies' ? 'Solo discrepancias' :
                  currentFilter === 'emitting' ? 'Solo eventos emitiendo' :
                  currentFilter === 'implemented' ? 'Solo implementados' :
                  currentFilter === 'pending' ? 'Solo pendientes' :
                  currentFilter === 'not_detected' ? 'Solo no detectados' :
                  currentFilter === 'functional' ? 'Solo funcionando' : currentFilter} (${filteredData.length} eventos)`}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportAnalytics}
                    disabled={filteredData.length === 0}
                  >
                    Exportar ({filteredData.length})
                  </Button>
                </Tooltip>
                <Tooltip title="Resetear monitor">
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    startIcon={<RefreshIcon />}
                    onClick={resetMonitor}
                  >
                    Reset
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {emittingEvents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eventos Emitiendo Ahora
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main">
                    {functionalEvents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eventos Funcionando
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {discrepancies.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Discrepancias Críticas
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Analytics Monitor Component */}
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <AnalyticsMonitor onFilterChange={handleFilterChange} />
            </Box>
          </Box>
        </TabPanel>

        {/* Sistema Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado del Sistema
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Servicios de Analytics" />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>PostHog</Typography>
                        <Chip 
                          label={typeof window !== 'undefined' && window.posthog ? 'Conectado' : 'Desconectado'} 
                          color={typeof window !== 'undefined' && window.posthog ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Customer.io</Typography>
                        <Chip 
                          label={typeof window !== 'undefined' && window._cio ? 'Conectado' : 'Desconectado'} 
                          color={typeof window !== 'undefined' && window._cio ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Segment</Typography>
                        <Chip 
                          label={typeof window !== 'undefined' && window.analytics ? 'Conectado' : 'Desconectado'} 
                          color={typeof window !== 'undefined' && window.analytics ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Monitor de Analytics" />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Estado del Monitor</Typography>
                        <Chip 
                          label={monitorStats.isMonitoring ? 'Activo' : 'Inactivo'} 
                          color={monitorStats.isMonitoring ? 'success' : 'error'} 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Eventos Catalogados</Typography>
                        <Typography>{monitorStats.totalCatalogEvents || 0}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Eventos Detectados</Typography>
                        <Typography>{monitorStats.detectedEvents || 0}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Configuración Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configuración del Sistema
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Las configuraciones avanzadas están disponibles en la consola de administración externa.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Analytics Monitor" />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      El monitor de analytics detecta automáticamente discrepancias entre 
                      los eventos catalogados y los eventos que realmente funcionan en el sistema.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleExportAnalytics}
                        startIcon={<DownloadIcon />}
                      >
                        Exportar Configuración
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={resetMonitor}
                        startIcon={<RefreshIcon />}
                      >
                        Resetear Monitor
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
