# 🔧 Analytics Monitor - Guía de Integración

**Monitor en tiempo real para detectar discrepancias entre el catálogo de eventos y la realidad**

---

## ✅ **Archivos Creados**

```
apps/site/src/
├── utils/
│   └── analyticsMonitor.js          # ✅ Monitor principal
├── components/
│   ├── AnalyticsMonitor.jsx         # ✅ Componente UI principal
│   ├── AnalyticsMonitor.css         # ✅ Estilos
│   ├── AnalyticsMonitorProvider.jsx # ✅ Provider
│   └── AnalyticsMonitorToggle.jsx   # ✅ Botón flotante
└── hooks/
    └── useAnalyticsMonitor.js       # ✅ Hook personalizado
```

---

## 🚀 **Integración en la App**

### **Opción 1: Integración Completa (Recomendada)**

Modificar `apps/site/src/App.jsx` o `AppWrapper.jsx`:

```jsx
import AnalyticsMonitorProvider from './components/AnalyticsMonitorProvider';
import AnalyticsMonitorToggle from './components/AnalyticsMonitorToggle';

function App() {
  return (
    <AnalyticsMonitorProvider>
      <div className="app">
        {/* Tu app existente */}
        <Router>
          <Routes>
            {/* Tus rutas */}
          </Routes>
        </Router>
        
        {/* Monitor flotante - solo en desarrollo o para admins */}
        {(import.meta.env.DEV || userIsAdmin) && <AnalyticsMonitorToggle />}
      </div>
    </AnalyticsMonitorProvider>
  );
}
```

### **Opción 2: Solo en Desarrollo**

```jsx
import AnalyticsMonitorToggle from './components/AnalyticsMonitorToggle';

function App() {
  return (
    <div className="app">
      {/* Tu app existente */}
      
      {/* Solo en desarrollo */}
      {import.meta.env.DEV && <AnalyticsMonitorToggle />}
    </div>
  );
}
```

### **Opción 3: Ruta Admin Específica**

```jsx
// En tu router
import AnalyticsMonitor from './components/AnalyticsMonitor';

<Route 
  path="/admin/analytics" 
  element={<AnalyticsMonitor />} 
/>
```

---

## 🎯 **Funcionalidades del Monitor**

### **🔍 Detección Automática**
- **Intercepta eventos** de PostHog, Customer.io, Segment y trackEvent()
- **Detecta discrepancias** entre catálogo y realidad
- **Monitoreo en tiempo real** de eventos emitidos
- **Estado real vs catalogado** para cada evento

### **🎛️ Control de Eventos**
- **Enable/Disable** eventos individualmente
- **Test firing** para probar eventos
- **Configuración persistente** en localStorage
- **Filtros y búsqueda** por estado, categoría, etc.

### **📊 Estadísticas**
- **Total eventos catalogados** vs **detectados**
- **Eventos funcionando** vs **marcados como implementados**
- **Discrepancias críticas** resaltadas
- **Exportación de datos** para análisis

---

## 🚨 **Detección de Discrepancias**

### **Tipos de Discrepancias Detectadas:**

#### **❌ Falsos Positivos en Catálogo**
```
Catálogo: "IMPLEMENTADO" ✅
Realidad: "NO_DETECTADO" ❌
```
**Problema:** Evento marcado como implementado pero nunca se dispara

#### **⚠️ Eventos Funcionando No Catalogados**
```
Catálogo: "PENDIENTE" ⏳
Realidad: "FUNCIONANDO" ✅
```
**Problema:** Evento funciona pero catálogo no está actualizado

#### **🔍 Eventos No Catalogados**
```
Catálogo: NO EXISTE
Realidad: "DETECTADO" 📡
```
**Problema:** Evento se dispara pero no está en el catálogo

---

## 🎮 **Uso del Monitor**

### **Activación:**
1. **Botón flotante** (esquina inferior derecha)
2. **Atajo de teclado:** `Ctrl + Shift + A`
3. **URL directa:** `/admin/analytics` (si configuraste la ruta)

### **Interfaz:**

```
┌─────────────────────────────────────────────────────┐
│  📊 Analytics Monitor                               │
├─────────────────────────────────────────────────────┤
│  📈 Stats: 42 Total | 17 Detectados | 3 Discrepancias│
├─────────────────────────────────────────────────────┤
│  🔍 [Buscar...] [Filtro: Discrepancias ▼]          │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────┬─────────────┐ │
│  │ viewer_loaded   │ ✅ FUNCIONANDO  │ 🔊 📡 🧪   │ │
│  │ layer_toggled   │ ⚠️ DISCREPANCIA │ 🔇 ❌ 🧪   │ │
│  │ photo360_viewer │ ❌ NO DETECTADO │ 🔊 ❌ 🧪   │ │
│  └─────────────────┴─────────────────┴─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### **Controles por Evento:**
- **🔊/🔇** Enable/Disable evento
- **🧪** Test firing (disparar evento de prueba)
- **📡** Indicador de emisión en tiempo real
- **🔽** Ver detalles (propiedades, historial, etc.)

---

## 🔧 **Configuración Avanzada**

### **Personalizar Catálogo de Eventos**

Editar `analyticsMonitor.js` línea ~15:

```javascript
const EVENTS_CATALOG = {
  'tu_nuevo_evento': {
    component: 'TuComponente.jsx',
    status: 'IMPLEMENTADO', // o 'PENDIENTE'
    category: 'interaction',
    description: 'Descripción del evento'
  },
  // ... más eventos
};
```

### **Configurar Interceptores Personalizados**

```javascript
// En analyticsMonitor.js
setupInterceptors() {
  // Interceptar tu servicio personalizado
  if (window.tuServicioAnalytics) {
    const original = window.tuServicioAnalytics.track;
    window.tuServicioAnalytics.track = (event, props) => {
      this.recordEvent(event, props, 'tu_servicio');
      return original.call(window.tuServicioAnalytics, event, props);
    };
  }
}
```

### **Alertas Automáticas**

```javascript
// En tu código
import { useAnalyticsMonitor } from './hooks/useAnalyticsMonitor';

const { getDiscrepancies } = useAnalyticsMonitor();

useEffect(() => {
  const discrepancies = getDiscrepancies();
  if (discrepancies.length > 5) {
    // Enviar alerta a Slack, email, etc.
    console.error(`🚨 ${discrepancies.length} discrepancias críticas detectadas`);
  }
}, []);
```

---

## 🐛 **Debugging y Troubleshooting**

### **Verificar Integración:**

```javascript
// En console del browser
console.log('Monitor:', window.analyticsMonitor);
console.log('Stats:', window.analyticsMonitor.getMonitorStats());
console.log('Events:', window.analyticsMonitor.getEventsStatus());
```

### **Test Manual de Eventos:**

```javascript
// Disparar evento de prueba
window.analyticsMonitor.testEvent('viewer_loaded');

// Verificar si evento está habilitado
window.analyticsMonitor.isEventEnabled('layer_toggled');

// Ver eventos detectados
window.analyticsMonitor.getEventsStatus()
  .filter(e => e.realStatus === 'FUNCIONANDO');
```

### **Exportar Datos para Análisis:**

```javascript
// Exportar todo
const data = window.analyticsMonitor.exportData();
console.log(JSON.stringify(data, null, 2));

// Solo discrepancias
const discrepancies = window.analyticsMonitor.getEventsStatus()
  .filter(e => e.discrepancy);
console.table(discrepancies);
```

---

## 📈 **Casos de Uso Reales**

### **1. Desarrollo - Verificar Implementación**
```
❌ Problema: "Implementé layer_toggled pero no llega a Customer.io"
✅ Solución: Monitor muestra que evento se dispara en PostHog pero no en Customer.io
```

### **2. QA - Validar Features**
```
❌ Problema: "¿Funciona el tracking de timeline_playback_control?"
✅ Solución: Monitor muestra en tiempo real cuando se dispara y con qué propiedades
```

### **3. Producción - Monitoreo Continuo**
```
❌ Problema: "Los eventos de Customer.io dejaron de llegar"
✅ Solución: Monitor detecta que eventos se disparan localmente pero no llegan al servicio
```

### **4. Mantenimiento - Actualizar Catálogo**
```
❌ Problema: "El catálogo está desactualizado"
✅ Solución: Monitor muestra eventos funcionando marcados como 'PENDIENTE'
```

---

## 🚀 **Próximos Pasos**

1. **✅ Integrar** en tu app siguiendo las instrucciones
2. **🔍 Revisar** discrepancias detectadas
3. **🔧 Corregir** eventos que no funcionan como esperado
4. **📋 Actualizar** catálogo con estado real
5. **📊 Monitorear** continuamente en desarrollo y producción

---

## 🎯 **Beneficios Inmediatos**

- **✅ Fin de la frustración** - Sabes exactamente qué eventos funcionan
- **⚡ Debugging rápido** - Identificas problemas en segundos
- **📊 Visibilidad total** - Estado real vs documentado
- **🎛️ Control granular** - Enable/disable eventos para testing
- **📈 Confianza** - Datos de analytics confiables

**¡El monitor está listo para usar! 🚀**
