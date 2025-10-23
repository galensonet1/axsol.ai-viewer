/**
 * Hook para usar el Analytics Monitor
 */

import { useState, useEffect } from 'react';
import { analyticsMonitor } from '../utils/analyticsMonitor';

export const useAnalyticsMonitor = () => {
  const [eventsStatus, setEventsStatus] = useState([]);
  const [monitorStats, setMonitorStats] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const handleUpdate = (events) => {
      setEventsStatus(events);
      setMonitorStats(analyticsMonitor.getMonitorStats());
      setIsMonitoring(analyticsMonitor.isMonitoring);
    };

    // Suscribirse a actualizaciones
    analyticsMonitor.addListener(handleUpdate);
    
    // Cargar datos iniciales
    handleUpdate(analyticsMonitor.getEventsStatus());

    return () => {
      analyticsMonitor.removeListener(handleUpdate);
    };
  }, []);

  const toggleEvent = (eventName, enabled) => {
    analyticsMonitor.toggleEvent(eventName, enabled);
  };

  const testEvent = (eventName) => {
    analyticsMonitor.testEvent(eventName);
  };

  const exportData = () => {
    return analyticsMonitor.exportData();
  };

  const resetMonitor = () => {
    analyticsMonitor.reset();
  };

  const getEventStatus = (eventName) => {
    return eventsStatus.find(event => event.name === eventName);
  };

  const getDiscrepancies = () => {
    return eventsStatus.filter(event => event.discrepancy);
  };

  const getEmittingEvents = () => {
    return eventsStatus.filter(event => event.isEmitting);
  };

  const getFunctionalEvents = () => {
    return eventsStatus.filter(event => event.realStatus === 'FUNCIONANDO');
  };

  const getNotDetectedEvents = () => {
    return eventsStatus.filter(event => event.realStatus === 'NO_DETECTADO');
  };

  return {
    // Estado
    eventsStatus,
    monitorStats,
    isMonitoring,
    
    // Acciones
    toggleEvent,
    testEvent,
    exportData,
    resetMonitor,
    
    // Helpers
    getEventStatus,
    getDiscrepancies,
    getEmittingEvents,
    getFunctionalEvents,
    getNotDetectedEvents,
    
    // Monitor directo
    monitor: analyticsMonitor
  };
};

export default useAnalyticsMonitor;
