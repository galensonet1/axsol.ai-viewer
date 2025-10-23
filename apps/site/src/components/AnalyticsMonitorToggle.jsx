/**
 * Analytics Monitor Toggle
 * Botón flotante para activar/desactivar el monitor
 */

import { useState, useEffect } from 'react';
import { useAnalyticsMonitor } from '../hooks/useAnalyticsMonitor';
import AnalyticsMonitor from './AnalyticsMonitor';

const AnalyticsMonitorToggle = () => {
  const [showMonitor, setShowMonitor] = useState(false);
  const { monitorStats, getDiscrepancies } = useAnalyticsMonitor();

  // Auto-mostrar si hay discrepancias críticas
  useEffect(() => {
    const discrepancies = getDiscrepancies();
    if (discrepancies.length > 3 && !showMonitor) {
      console.warn(`⚠️ ${discrepancies.length} discrepancias detectadas en analytics`);
    }
  }, [monitorStats.discrepancies]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl + Shift + A para toggle monitor
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowMonitor(!showMonitor);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showMonitor]);

  const getStatusColor = () => {
    if (monitorStats.discrepancies > 0) return '#dc3545'; // Rojo
    if (monitorStats.actuallyFunctional < monitorStats.implementedInCatalog) return '#ffc107'; // Amarillo
    return '#28a745'; // Verde
  };

  const getStatusText = () => {
    if (monitorStats.discrepancies > 0) {
      return `${monitorStats.discrepancies} discrepancias`;
    }
    if (monitorStats.actuallyFunctional < monitorStats.implementedInCatalog) {
      return `${monitorStats.implementedInCatalog - monitorStats.actuallyFunctional} eventos no funcionan`;
    }
    return 'Todo OK';
  };

  return (
    <>
      <div 
        className="analytics-monitor-toggle"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          background: getStatusColor(),
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          transform: showMonitor ? 'scale(0.9)' : 'scale(1)'
        }}
        onClick={() => setShowMonitor(!showMonitor)}
        title={`Analytics Monitor - ${getStatusText()} (Ctrl+Shift+A)`}
      >
        📊
        {monitorStats.discrepancies > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#fff',
              color: '#dc3545',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #dc3545'
            }}
          >
            {monitorStats.discrepancies}
          </div>
        )}
      </div>

      {showMonitor && <AnalyticsMonitor />}
    </>
  );
};

export default AnalyticsMonitorToggle;
