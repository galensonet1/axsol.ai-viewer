/**
 * Analytics Monitor Component
 * Panel de control para monitorear eventos de analytics en tiempo real
 */

import { useState, useEffect } from 'react';
import { analyticsMonitor } from '../utils/analyticsMonitor';
import './AnalyticsMonitor.css';

const AnalyticsMonitor = ({ onFilterChange }) => {
  const [eventsStatus, setEventsStatus] = useState([]);
  const [monitorStats, setMonitorStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Listener para actualizaciones del monitor
    const handleUpdate = (events) => {
      setEventsStatus(events);
      setMonitorStats(analyticsMonitor.getMonitorStats());
    };

    analyticsMonitor.addListener(handleUpdate);
    
    // Cargar datos iniciales
    handleUpdate(analyticsMonitor.getEventsStatus());

    return () => {
      analyticsMonitor.removeListener(handleUpdate);
    };
  }, []);

  const filteredEvents = eventsStatus.filter(event => {
    // Filtro por búsqueda
    if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por estado
    switch (filter) {
      case 'discrepancies':
        return event.discrepancy;
      case 'emitting':
        return event.isEmitting;
      case 'implemented':
        return event.catalogStatus === 'IMPLEMENTADO';
      case 'pending':
        return event.catalogStatus === 'PENDIENTE';
      case 'not_detected':
        return event.realStatus === 'NO_DETECTADO';
      case 'functional':
        return event.realStatus === 'FUNCIONANDO';
      default:
        return true;
    }
  });

  // Notificar cuando se cargan los datos iniciales
  useEffect(() => {
    if (onFilterChange && eventsStatus.length > 0) {
      console.log('[AnalyticsMonitor] Datos iniciales cargados:', eventsStatus.length, 'eventos');
      onFilterChange(filter, filteredEvents);
    }
  }, [eventsStatus.length]); // Solo cuando cambia la cantidad de eventos (carga inicial)

  // Notificar cambios de filtro al componente padre
  useEffect(() => {
    if (onFilterChange && eventsStatus.length > 0) {
      console.log('[AnalyticsMonitor] Filtro cambiado:', {
        filter,
        searchTerm,
        filteredEvents: filteredEvents.length
      });
      onFilterChange(filter, filteredEvents);
    }
  }, [filter, searchTerm]); // Solo cuando cambian los filtros

  const handleToggleEvent = (eventName, enabled) => {
    analyticsMonitor.toggleEvent(eventName, enabled);
  };

  const handleTestEvent = (eventName) => {
    analyticsMonitor.testEvent(eventName);
  };

  const handleExportData = () => {
    const data = analyticsMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-monitor-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres resetear el monitor? Se perderán todas las estadísticas.')) {
      analyticsMonitor.reset();
    }
  };

  const getStatusColor = (event) => {
    if (event.discrepancy) return 'status-error';
    if (event.isEmitting) return 'status-emitting';
    if (event.realStatus === 'FUNCIONANDO') return 'status-functional';
    if (event.realStatus === 'NO_DETECTADO') return 'status-not-detected';
    return 'status-unknown';
  };

  const getStatusText = (event) => {
    if (event.discrepancy) {
      return `⚠️ DISCREPANCIA: Catálogo dice "${event.catalogStatus}" pero ${event.realStatus}`;
    }
    if (event.isEmitting) return '📡 EMITIENDO AHORA';
    if (event.realStatus === 'FUNCIONANDO') return '✅ FUNCIONANDO';
    if (event.realStatus === 'NO_DETECTADO') return '❌ NO DETECTADO';
    return '🔍 DETECTADO';
  };

  if (!isExpanded) {
    return (
      <div className="analytics-monitor-collapsed">
        <button 
          className="monitor-toggle"
          onClick={() => setIsExpanded(true)}
          title="Abrir Analytics Monitor"
        >
          📊 Monitor ({monitorStats.discrepancies || 0} discrepancias)
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-monitor">
      <div className="monitor-header">
        <div className="monitor-title">
          <h2>📊 Analytics Monitor</h2>
          <button 
            className="monitor-collapse"
            onClick={() => setIsExpanded(false)}
            title="Minimizar"
          >
            ➖
          </button>
        </div>
        
        <div className="monitor-stats">
          <div className="stat">
            <span className="stat-label">Total Eventos:</span>
            <span className="stat-value">{monitorStats.totalCatalogEvents}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Detectados:</span>
            <span className="stat-value">{monitorStats.detectedEvents}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Funcionando:</span>
            <span className="stat-value">{monitorStats.actuallyFunctional}</span>
          </div>
          <div className="stat error">
            <span className="stat-label">Discrepancias:</span>
            <span className="stat-value">{monitorStats.discrepancies}</span>
          </div>
        </div>
      </div>

      <div className="monitor-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Buscar evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los eventos</option>
            <option value="discrepancies">⚠️ Solo discrepancias</option>
            <option value="emitting">📡 Emitiendo ahora</option>
            <option value="functional">✅ Funcionando</option>
            <option value="implemented">📋 Implementados (catálogo)</option>
            <option value="pending">⏳ Pendientes (catálogo)</option>
            <option value="not_detected">❌ No detectados</option>
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={handleExportData} className="btn-export">
            📥 Exportar Datos
          </button>
          <button onClick={handleReset} className="btn-reset">
            🔄 Reset Monitor
          </button>
        </div>
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <EventCard
            key={event.name}
            event={event}
            onToggle={handleToggleEvent}
            onTest={handleTestEvent}
            statusColor={getStatusColor(event)}
            statusText={getStatusText(event)}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="no-events">
          <p>No se encontraron eventos con los filtros aplicados.</p>
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event, onToggle, onTest, statusColor, statusText }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleString();
  };

  const formatProperties = (properties) => {
    if (!properties) return 'N/A';
    return JSON.stringify(properties, null, 2);
  };

  return (
    <div className={`event-card ${statusColor}`}>
      <div className="event-header">
        <div className="event-name">
          <h4>{event.name}</h4>
          <span className="event-category">{event.category}</span>
        </div>
        
        <div className="event-status">
          <span className="status-indicator" title={statusText}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="event-info">
        <div className="info-row">
          <span className="info-label">Componente:</span>
          <span className="info-value">{event.component}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Descripción:</span>
          <span className="info-value">{event.description}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Conteo:</span>
          <span className="info-value">{event.count}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Última emisión:</span>
          <span className="info-value">{formatTimestamp(event.lastSeen)}</span>
        </div>
        {event.sources.length > 0 && (
          <div className="info-row">
            <span className="info-label">Fuentes:</span>
            <span className="info-value">{event.sources.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="event-controls">
        <button 
          onClick={() => onToggle(event.name, !event.isEnabled)}
          className={event.isEnabled ? 'btn-disable' : 'btn-enable'}
          title={event.isEnabled ? 'Deshabilitar evento' : 'Habilitar evento'}
        >
          {event.isEnabled ? '🔇 Deshabilitar' : '🔊 Habilitar'}
        </button>
        
        <button 
          onClick={() => onTest(event.name)}
          className="btn-test"
          title="Disparar evento de prueba"
        >
          🧪 Test
        </button>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="btn-details"
          title="Ver detalles"
        >
          {showDetails ? '🔼 Ocultar' : '🔽 Detalles'}
        </button>
      </div>

      {showDetails && (
        <div className="event-details">
          <div className="details-section">
            <h5>Estado del Catálogo vs Realidad:</h5>
            <div className="status-comparison">
              <div className="status-item">
                <span className="status-label">Catálogo:</span>
                <span className={`status-badge ${event.catalogStatus.toLowerCase()}`}>
                  {event.catalogStatus}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Realidad:</span>
                <span className={`status-badge ${event.realStatus.toLowerCase().replace('_', '-')}`}>
                  {event.realStatus}
                </span>
              </div>
            </div>
          </div>

          {event.lastProperties && (
            <div className="details-section">
              <h5>Últimas Propiedades:</h5>
              <pre className="properties-code">
                {formatProperties(event.lastProperties)}
              </pre>
            </div>
          )}

          <div className="details-section">
            <h5>Historial:</h5>
            <div className="history-item">
              <span className="history-label">Primera detección:</span>
              <span className="history-value">{formatTimestamp(event.firstSeen)}</span>
            </div>
            <div className="history-item">
              <span className="history-label">Última detección:</span>
              <span className="history-value">{formatTimestamp(event.lastSeen)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsMonitor;
