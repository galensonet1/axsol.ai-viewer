/**
 * Analytics Monitor Provider
 * Proveedor que inicializa el monitor y lo hace disponible globalmente
 */

import { useEffect } from 'react';
import { analyticsMonitor } from '../utils/analyticsMonitor';
import AnalyticsMonitor from './AnalyticsMonitor';

const AnalyticsMonitorProvider = ({ children, showMonitor = false }) => {
  useEffect(() => {
    // Inicializar el monitor
    console.log('🔍 Inicializando Analytics Monitor...');
    
    // Exponer globalmente para debugging
    window.analyticsMonitor = analyticsMonitor;
    
    // Log de estado inicial
    const stats = analyticsMonitor.getMonitorStats();
    console.log('📊 Analytics Monitor Stats:', stats);
    
    return () => {
      // Cleanup si es necesario
      console.log('🔍 Analytics Monitor cleanup');
    };
  }, []);

  return (
    <>
      {children}
      {showMonitor && <AnalyticsMonitor />}
    </>
  );
};

export default AnalyticsMonitorProvider;
