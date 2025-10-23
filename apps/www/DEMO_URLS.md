# 🚀 URLs de Demo Automático - IngeIA EPCM

## 📋 **Descripción**
Sistema automático para abrir Calendly cuando se accede a URLs específicas que solicitan una demostración.

## 🔗 **URLs Disponibles**

### **Rutas de Página**
Estas URLs abren automáticamente el popup de Calendly:

- `https://ingeia.tech/demo`
- `https://ingeia.tech/solicitar-demo`
- `https://ingeia.tech/request-demo`

### **Parámetros de URL**
También funcionan como parámetros GET:

- `https://ingeia.tech/?demo`
- `https://ingeia.tech/?demo=true`
- `https://ingeia.tech/?solicitar-demo`
- `https://ingeia.tech/?request-demo`

### **Fragmentos de URL (Hash)**
Usando anchors en la URL:

- `https://ingeia.tech/#demo`
- `https://ingeia.tech/#solicitar-demo`

## ⚙️ **Configuración**

### **URL de Calendly**
- **Por defecto:** `https://calendly.com/axsol/30min`
- **Configurable** en el componente `DemoHandler`

### **Tiempo de Espera**
- **Página cargada:** 1.5 segundos
- **Página cargando:** 3 segundos
- **Reintentos:** Cada 1 segundo si Calendly no está disponible

## 🎯 **Casos de Uso**

### **1. Marketing Directo**
```
Enviar en emails: https://ingeia.tech/demo
```

### **2. Redes Sociales**
```
Link en LinkedIn: https://ingeia.tech/solicitar-demo
```

### **3. Campañas Publicitarias**
```
Google Ads: https://ingeia.tech/?demo=campaign-google
```

### **4. QR Codes**
```
Código QR apuntando a: https://ingeia.tech/demo
```

### **5. Presentaciones**
```
Slide final: "Visite ingeia.tech/demo"
```

## 📊 **Analytics**

### **Evento Trackeado**
```javascript
posthog.capture('demo_requested_via_url', {
  calendly_url: 'https://calendly.com/axsol/30min',
  source: 'direct_url'
});
```

### **Información Capturada**
- URL de Calendly utilizada
- Fuente del tráfico (direct_url)
- Timestamp del evento

## 🔧 **Funcionamiento Técnico**

### **Detección Automática**
El sistema detecta automáticamente:
1. **Rutas:** `/demo`, `/solicitar-demo`, `/request-demo`
2. **Parámetros:** `?demo`, `?solicitar-demo`, `?request-demo`
3. **Hash:** `#demo`, `#solicitar-demo`

### **Limpieza de URL**
Después de abrir Calendly:
- Las rutas se redirigen a `/`
- Los parámetros se eliminan de la URL
- Los hash de demo se limpian
- La URL queda limpia para compartir

### **Manejo de Errores**
- **Calendly no disponible:** Reintentos automáticos
- **Página no cargada:** Espera adicional
- **Múltiples activaciones:** Prevención automática

## 🚀 **Implementación**

### **Componente Principal**
```typescript
// apps/www/components/DemoHandler.tsx
<DemoHandler calendlyUrl="https://calendly.com/axsol/30min" />
```

### **Integración en App**
```typescript
// apps/www/App.tsx
import DemoHandler from './components/DemoHandler';

const App = () => (
  <div>
    <DemoHandler />
    {/* Resto de componentes */}
  </div>
);
```

## 📱 **Compatibilidad**

### **Navegadores**
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Móviles (iOS/Android)

### **Funcionalidades**
- ✅ Historia del navegador (back/forward)
- ✅ Navegación SPA
- ✅ Recarga de página
- ✅ Compartir URLs
- ✅ Bookmarks

## 🧪 **Testing**

### **URLs de Prueba**
Para probar en desarrollo:

```bash
# Desarrollo local
http://localhost:5173/demo
http://localhost:5173/?demo
http://localhost:5173/#demo

# Producción
https://ingeia.tech/demo
https://ingeia.tech/?demo
https://ingeia.tech/#demo
```

### **Verificación**
1. ✅ Calendly se abre automáticamente
2. ✅ URL se limpia después de abrir
3. ✅ Analytics event se registra
4. ✅ No se abre múltiples veces
5. ✅ Funciona en móviles

## 📝 **Logs de Debug**

### **Console Logs**
```javascript
[IngeIA] Demo URL detectada: https://ingeia.tech/demo
[IngeIA] Abriendo Calendly: https://calendly.com/axsol/30min
[IngeIA] Calendly no disponible, reintentando...
```

### **Monitoreo**
- Revisar console del navegador
- Verificar eventos en PostHog
- Confirmar apertura de Calendly

---

## 🎯 **Resumen de URLs Funcionales**

| Tipo | URL | Descripción |
|------|-----|-------------|
| **Ruta** | `/demo` | URL corta y fácil de recordar |
| **Ruta** | `/solicitar-demo` | Versión en español |
| **Ruta** | `/request-demo` | Versión en inglés |
| **Parámetro** | `/?demo` | Para tracking de campañas |
| **Parámetro** | `/?solicitar-demo` | Parámetro en español |
| **Hash** | `/#demo` | Para enlaces internos |

**Todas las URLs abren automáticamente el popup de Calendly para agendar una demostración.**

---

**Última actualización:** Octubre 2025  
**Mantenido por:** Equipo de Desarrollo IngeIA EPCM
