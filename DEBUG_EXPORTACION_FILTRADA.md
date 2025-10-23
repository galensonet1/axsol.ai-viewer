# 🐛 **DEBUG: Exportación Filtrada**

## **Problema Reportado:**
- El botón de exportar sigue exportando todos los eventos
- Debería exportar exactamente los que se muestran en pantalla según el filtro activo

## **🔧 Cambios Implementados:**

### **1. AnalyticsMonitor.jsx:**
```javascript
// Prop para comunicar filtros
const AnalyticsMonitor = ({ onFilterChange }) => {

// Cálculo de eventos filtrados (incluye búsqueda + filtro de estado)
const filteredEvents = eventsStatus.filter(event => {
  // Filtro por búsqueda
  if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }
  // Filtro por estado (discrepancies, emitting, etc.)
  switch (filter) {
    case 'discrepancies': return event.discrepancy;
    case 'emitting': return event.isEmitting;
    // ... otros filtros
  }
});

// Notificar cambios al padre
useEffect(() => {
  if (onFilterChange) {
    onFilterChange(filter, filteredEvents);
  }
}, [filter, searchTerm, eventsStatus, onFilterChange]);
```

### **2. AdminDashboard.jsx:**
```javascript
// Estados para recibir datos filtrados
const [currentFilter, setCurrentFilter] = useState('all');
const [filteredData, setFilteredData] = useState([]);

// Función para recibir datos del AnalyticsMonitor
const handleFilterChange = (filter, data) => {
  setCurrentFilter(filter);
  setFilteredData(data); // Estos son los datos que se ven en pantalla
};

// Función de exportar usando datos filtrados
const handleExportAnalytics = () => {
  const exportPayload = {
    filter: currentFilter,
    totalEvents: filteredData.length,
    events: filteredData // Solo los eventos visibles
  };
  // ... resto de la exportación
};

// Pasar función al AnalyticsMonitor
<AnalyticsMonitor onFilterChange={handleFilterChange} />
```

## **🔍 Logs de Debug Agregados:**

### **En AnalyticsMonitor:**
```
[AnalyticsMonitor] Notificando cambio de filtro: discrepancies searchTerm:  Eventos filtrados: 5
```

### **En AdminDashboard:**
```
[AdminDashboard] Recibiendo cambio de filtro: discrepancies Datos: 5 eventos
[AdminDashboard] Exportando datos: { filter: "discrepancies", totalEvents: 5, events: [...] }
```

## **🎯 Flujo Esperado:**

1. **Usuario selecciona filtro** en AnalyticsMonitor (ej: "Discrepancias")
2. **AnalyticsMonitor calcula** `filteredEvents` con el filtro
3. **AnalyticsMonitor notifica** a AdminDashboard con `onFilterChange(filter, filteredEvents)`
4. **AdminDashboard recibe** y guarda los datos en `filteredData`
5. **Usuario hace clic en Exportar**
6. **AdminDashboard exporta** solo los datos en `filteredData`

## **🚨 Posibles Problemas:**

### **1. Timing del useEffect:**
- El `useEffect` puede no ejecutarse al inicio
- Dependencias pueden estar mal configuradas

### **2. Datos no sincronizados:**
- `filteredEvents` puede no reflejar el estado actual de la pantalla
- `eventsStatus` puede estar vacío al inicio

### **3. Múltiples filtros:**
- Filtro de estado + filtro de búsqueda pueden no estar sincronizados
- `searchTerm` puede estar afectando sin notificar

## **🔧 Próximos Pasos de Debug:**

1. **Verificar logs en consola** al cambiar filtros
2. **Verificar que `filteredData.length`** coincida con lo mostrado en pantalla
3. **Probar diferentes filtros** y verificar exportación
4. **Verificar que el botón muestre** el número correcto: `Exportar (X)`

## **🧪 Casos de Prueba:**

### **Caso 1: Filtro "Todos"**
- Pantalla muestra: 20 eventos
- Botón debe mostrar: "Exportar (20)"
- Archivo debe contener: 20 eventos

### **Caso 2: Filtro "Discrepancias"**
- Pantalla muestra: 5 eventos con discrepancias
- Botón debe mostrar: "Exportar (5)"
- Archivo debe contener: 5 eventos con discrepancias

### **Caso 3: Filtro + Búsqueda**
- Filtro: "Emitiendo" + Búsqueda: "click"
- Pantalla muestra: 2 eventos
- Botón debe mostrar: "Exportar (2)"
- Archivo debe contener: 2 eventos que coincidan con ambos filtros

## **✅ Verificación:**
- [ ] Logs aparecen en consola
- [ ] `filteredData.length` coincide con pantalla
- [ ] Archivo exportado contiene solo eventos visibles
- [ ] Botón muestra número correcto
