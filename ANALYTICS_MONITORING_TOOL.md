# 🔧 Analytics Monitoring & Control Tool

**Herramienta para monitorear y controlar eventos de analytics en tiempo real**

---

## 🎯 Opciones de Implementación

### **Opción 1: Panel Admin Interno (Recomendado)**

**Crear un dashboard admin en tu app que permita:**

#### **A. Monitoreo en Tiempo Real**
```javascript
// components/admin/AnalyticsMonitor.jsx
import { useState, useEffect } from 'react';

const AnalyticsMonitor = () => {
  const [eventStats, setEventStats] = useState({});
  const [eventConfig, setEventConfig] = useState({});
  
  // Monitor eventos en tiempo real
  useEffect(() => {
    const eventListener = (eventName, properties) => {
      setEventStats(prev => ({
        ...prev,
        [eventName]: {
          count: (prev[eventName]?.count || 0) + 1,
          lastFired: new Date().toISOString(),
          lastProperties: properties
        }
      }));
    };
    
    // Hook into analytics system
    window.analyticsMonitor = eventListener;
    
    return () => {
      delete window.analyticsMonitor;
    };
  }, []);
  
  return (
    <div className="analytics-monitor">
      <h2>📊 Analytics Monitor</h2>
      
      {/* Event Status Grid */}
      <div className="events-grid">
        {Object.entries(EVENTS_CATALOG).map(([eventName, config]) => (
          <EventCard 
            key={eventName}
            eventName={eventName}
            config={config}
            stats={eventStats[eventName]}
            onToggle={(enabled) => toggleEvent(eventName, enabled)}
          />
        ))}
      </div>
      
      {/* Real-time Event Stream */}
      <EventStream events={eventStats} />
    </div>
  );
};
```

#### **B. Control de Eventos**
```javascript
// utils/analyticsController.js
class AnalyticsController {
  constructor() {
    this.eventConfig = this.loadConfig();
  }
  
  // Habilitar/deshabilitar eventos
  toggleEvent(eventName, enabled) {
    this.eventConfig[eventName] = { 
      ...this.eventConfig[eventName], 
      enabled 
    };
    this.saveConfig();
    console.log(`Event ${eventName} ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Verificar si evento está habilitado
  isEventEnabled(eventName) {
    return this.eventConfig[eventName]?.enabled !== false;
  }
  
  // Trackear solo si está habilitado
  trackEvent(eventName, properties) {
    if (!this.isEventEnabled(eventName)) {
      console.log(`🚫 Event ${eventName} disabled - not tracking`);
      return;
    }
    
    // Notificar al monitor
    if (window.analyticsMonitor) {
      window.analyticsMonitor(eventName, properties);
    }
    
    // Enviar a analytics services
    this.sendToAnalytics(eventName, properties);
  }
  
  sendToAnalytics(eventName, properties) {
    // PostHog
    if (window.posthog && this.eventConfig[eventName]?.posthog !== false) {
      window.posthog.capture(eventName, properties);
    }
    
    // Customer.io
    if (window._cio && this.eventConfig[eventName]?.customerio !== false) {
      window._cio.track(eventName, properties);
    }
    
    // Segment
    if (window.analytics && this.eventConfig[eventName]?.segment !== false) {
      window.analytics.track(eventName, properties);
    }
  }
  
  // Configuración persistente
  saveConfig() {
    localStorage.setItem('analyticsConfig', JSON.stringify(this.eventConfig));
  }
  
  loadConfig() {
    const saved = localStorage.getItem('analyticsConfig');
    return saved ? JSON.parse(saved) : {};
  }
}

export const analyticsController = new AnalyticsController();
```

#### **C. Componente EventCard**
```javascript
// components/admin/EventCard.jsx
const EventCard = ({ eventName, config, stats, onToggle }) => {
  const isEnabled = config?.enabled !== false;
  const isEmitting = stats?.count > 0;
  const lastFired = stats?.lastFired;
  
  return (
    <div className={`event-card ${isEnabled ? 'enabled' : 'disabled'}`}>
      <div className="event-header">
        <h4>{eventName}</h4>
        <div className="status-indicators">
          <span className={`status ${isEnabled ? 'enabled' : 'disabled'}`}>
            {isEnabled ? '✅ ON' : '❌ OFF'}
          </span>
          <span className={`emission ${isEmitting ? 'emitting' : 'silent'}`}>
            {isEmitting ? '📡 EMITTING' : '🔇 SILENT'}
          </span>
        </div>
      </div>
      
      <div className="event-stats">
        <p>Count: {stats?.count || 0}</p>
        <p>Last fired: {lastFired ? new Date(lastFired).toLocaleString() : 'Never'}</p>
      </div>
      
      <div className="event-controls">
        <button 
          onClick={() => onToggle(!isEnabled)}
          className={isEnabled ? 'btn-disable' : 'btn-enable'}
        >
          {isEnabled ? 'Disable' : 'Enable'}
        </button>
        <button onClick={() => testEvent(eventName)}>
          Test Fire
        </button>
      </div>
      
      {stats?.lastProperties && (
        <details className="last-properties">
          <summary>Last Properties</summary>
          <pre>{JSON.stringify(stats.lastProperties, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};
```

---

## 🔧 **Opción 2: Herramientas Externas**

### **A. PostHog Live Events**

**PostHog tiene un monitor en tiempo real:**

1. PostHog Dashboard → **Live Events**
2. Ver eventos llegando en tiempo real
3. Filtrar por evento específico
4. Ver propiedades completas

**Limitaciones:**
- Solo monitoreo, no control
- No puede habilitar/deshabilitar eventos

### **B. Segment Debugger**

**Si usas Segment:**

1. Segment Dashboard → **Debugger**
2. Ver eventos en tiempo real
3. Validar que lleguen a destinations
4. Debug problemas de tracking

**URL:** `https://app.segment.com/[workspace]/debugger`

### **C. Customer.io Activity Logs**

**Para Customer.io:**

1. Customer.io → **Activity** → **Logs**
2. Ver eventos llegando
3. Filtrar por usuario o evento
4. Debug campaigns triggers

### **D. Browser DevTools Extension**

**Crear extensión de Chrome:**

```javascript
// chrome-extension/content.js
// Interceptar todas las llamadas de analytics
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Interceptar calls a analytics services
  if (url.includes('posthog') || url.includes('customer.io') || url.includes('segment')) {
    console.log('📊 Analytics Call:', {
      url,
      method: options?.method,
      body: options?.body
    });
  }
  
  return originalFetch.apply(this, args);
};

// Interceptar PostHog
if (window.posthog) {
  const originalCapture = window.posthog.capture;
  window.posthog.capture = function(eventName, properties) {
    console.log('📊 PostHog Event:', eventName, properties);
    return originalCapture.call(this, eventName, properties);
  };
}
```

---

## 🚀 **Opción 3: Solución Híbrida (Mejor Práctica)**

### **Implementación Recomendada:**

#### **1. Analytics Wrapper con Control**
```javascript
// utils/analytics.js
import { analyticsController } from './analyticsController';

export const trackEvent = (eventName, properties = {}) => {
  // Log para debugging
  console.log(`🎯 Tracking: ${eventName}`, properties);
  
  // Usar el controller para verificar y enviar
  analyticsController.trackEvent(eventName, properties);
};

// Wrapper para cada servicio
export const posthogTrack = (eventName, properties) => {
  if (analyticsController.isEventEnabled(eventName)) {
    window.posthog?.capture(eventName, properties);
  }
};

export const customerioTrack = (eventName, properties) => {
  if (analyticsController.isEventEnabled(eventName)) {
    window._cio?.track(eventName, properties);
  }
};
```

#### **2. Panel Admin Route**
```javascript
// pages/admin/analytics.jsx
import AnalyticsMonitor from '../../components/admin/AnalyticsMonitor';

const AnalyticsAdminPage = () => {
  return (
    <div className="admin-page">
      <h1>🔧 Analytics Control Center</h1>
      <AnalyticsMonitor />
    </div>
  );
};

export default AnalyticsAdminPage;
```

#### **3. URL de Acceso**
```
https://tu-app.com/admin/analytics
```

---

## 📊 **Features del Panel Recomendado**

### **Dashboard Principal:**
```
┌─────────────────────────────────────────────────────┐
│  🔧 Analytics Control Center                        │
├─────────────────────────────────────────────────────┤
│  📊 Real-time Stats                                 │
│  • Events fired today: 1,247                       │
│  • Active events: 15/17                            │
│  • Last event: viewer_loaded (2s ago)              │
├─────────────────────────────────────────────────────┤
│  🎛️ Event Controls                                  │
│  ┌─────────────┬─────────────┬─────────────────────┐ │
│  │ viewer_loaded│    ✅ ON    │  📡 EMITTING (45/h) │ │
│  │ camera_moved │    ✅ ON    │  📡 EMITTING (123/h)│ │
│  │ layer_toggled│    ❌ OFF   │  🔇 SILENT          │ │
│  └─────────────┴─────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  📡 Live Event Stream                               │
│  • 14:32:15 - viewer_loaded {project_id: "abc123"} │
│  • 14:32:12 - camera_moved {lat: -34.5, lon: -58.4}│
│  • 14:32:08 - timeline_playback_control {action: "play"}│
└─────────────────────────────────────────────────────┘
```

### **Controles por Evento:**
- ✅/❌ **Toggle Enable/Disable**
- 🧪 **Test Fire** (disparar evento de prueba)
- 📊 **View Stats** (estadísticas detalladas)
- 🔧 **Edit Config** (configurar destinations)
- 📋 **Copy Event** (copiar para debugging)

---

## 🎯 **Implementación Paso a Paso**

### **Fase 1: Setup Básico (2 horas)**
1. Crear `AnalyticsController` class
2. Modificar `trackEvent` function para usar controller
3. Crear componente `EventCard` básico

### **Fase 2: Panel Admin (3 horas)**
1. Crear `AnalyticsMonitor` component
2. Implementar real-time event stream
3. Agregar controles enable/disable

### **Fase 3: Features Avanzadas (2 horas)**
1. Persistencia de configuración
2. Test firing de eventos
3. Export/import de configuraciones

### **Fase 4: Integración (1 hora)**
1. Agregar ruta `/admin/analytics`
2. Proteger con autenticación admin
3. Testing completo

---

## 🔒 **Seguridad y Acceso**

```javascript
// middleware/adminAuth.js
export const requireAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Proteger ruta admin
app.use('/admin/analytics', requireAdmin);
```

---

## 📈 **Beneficios de esta Solución**

### **✅ Ventajas:**
- **Control total**: Enable/disable eventos individualmente
- **Monitoreo real-time**: Ver eventos disparándose
- **Debugging**: Identificar eventos que no se disparan
- **Testing**: Disparar eventos manualmente
- **Configuración**: Personalizar por servicio (PostHog, Customer.io, etc.)
- **Persistencia**: Configuración guardada entre sesiones

### **🎯 Casos de Uso:**
- **Development**: Disable eventos durante testing
- **Debugging**: Identificar eventos problemáticos
- **Performance**: Disable eventos costosos temporalmente
- **Compliance**: Control granular para GDPR/privacy
- **A/B Testing**: Enable/disable eventos por feature flags

---

## 🚀 **Próximos Pasos**

1. **¿Prefieres implementar el panel interno o usar herramientas externas?**
2. **¿Necesitas que empiece con el `AnalyticsController`?**
3. **¿Quieres que cree el componente `AnalyticsMonitor` completo?**

**Recomendación:** Empezar con el panel interno, es la solución más flexible y poderosa para tu caso de uso. 🎯
