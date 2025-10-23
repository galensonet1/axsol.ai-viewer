# 📋 Información Completa de las Aplicaciones IngeIA EPCM

## 🏢 **Información de la Empresa**

### **Nombre Completo**
**IngeIA EPCM - The Vision To Make It**

### **Descripción**
IngeIA EPCM es una joint venture entre Ingeniería SIMA S.A. y AXSOL que redefine la gestión de proyectos de ingeniería, procura y construcción (EPCM). Aplicamos IA y drones para la excelencia en proyectos de construcción de plantas de procesamiento (SITE) y ductos (LINE) en Oil & Gas y Minería.

### **Tagline/Slogan**
"The Vision To Make It" - La Visión que lo Hace Posible

### **Misión**
Eliminar la disociación espacio-temporal entre el diseño, la ejecución y el plan constructivo, ofreciendo una sincronización perfecta y una gestión proactiva de los proyectos mediante IA avanzada y experiencia probada en EPCM.

---

## 🌐 **Aplicaciones del Ecosistema**

### **1. WWW (Sitio Web Corporativo)**
- **URL:** https://ingeia.tech
- **Propósito:** Sitio web corporativo y marketing
- **Descripción:** Presenta la empresa, servicios SITE y LINE, tecnología y equipo
- **Framework:** React + TypeScript + Vite
- **Ubicación:** `/apps/www/`

### **2. SITE (Aplicación Viewer)**
- **URL:** TBD (En desarrollo)
- **Propósito:** Aplicación de visualización y gestión de proyectos SITE (plantas de procesamiento)
- **Descripción:** Herramienta EPCM para diseño, construcción y optimización de refinerías y plantas de procesamiento
- **Framework:** React + Vite + Cesium
- **Ubicación:** `/apps/site/`

### **3. LINE (Aplicación de Ductos)**
- **URL:** TBD (En desarrollo)
- **Propósito:** Aplicación para gestión de proyectos LINE (ductos)
- **Descripción:** Soluciones EPCM para topografía, construcción y monitoreo de ductos
- **Framework:** TBD
- **Ubicación:** `/apps/line/`

---

## 🎨 **Identidad Visual**

### **Colores Corporativos**
- **Teal Principal:** `#00A99D` (ing-teal)
- **Oscuro Principal:** `#101820` (ing-dark)
- **Oscuro Secundario:** `#1D2A35` (ing-dark-secondary)
- **Gris:** `#9CA3AF` (ing-gray)
- **Gris Claro:** `#E5E7EB` (ing-light-gray)

### **Tipografía**
- **Principal:** Inter (Google Fonts)
- **Pesos:** 400, 500, 600, 700, 800

### **Logos**
- **Logo Principal:** `/public/images/logo/7.png` (IngeIA EPCM)
- **Logo SIMA:** `/public/images/logo/ingenieria-sima-sa.jpg`
- **Logo AXSOL:** `/public/images/logo/logoaxsol.png`
- **Favicon Base:** `/public/logo-1-logo.png`

---

## 🛠️ **Servicios y Soluciones**

### **SITE: EPCM para Plantas de Procesamiento**
- Diseño Predictivo y Modelado con IA
- Construcción Monitoreada con Drones
- Gestión de Activos y Mantenimiento Predictivo
- **Industrias:** Oil & Gas, Minería
- **Tipo de Activos:** Refinerías, Plantas de Procesamiento

### **LINE: EPCM para Proyectos de Ductos**
- Ruta Óptima con Análisis Geoespacial IA
- Inspección Aérea Continua con Drones
- Aseguramiento de Integridad del ducto
- **Industrias:** Oil & Gas, Minería
- **Tipo de Activos:** Ductos, Facilidades de Transporte

---

## 🏛️ **Información Corporativa**

### **Ingeniería SIMA S.A.**
- **Fundada:** 1979 (45+ años de experiencia)
- **Empleados:** 800+ profesionales
- **Especialidad:** Infraestructura y energía, producción de hidrocarburos
- **Fortalezas:** Solidez, rigurosidad técnica, compromiso con la excelencia

### **AXSOL**
- **Especialidad:** Inteligencia Artificial y análisis geoespacial
- **Fortalezas:** Soluciones de IA nativas, transformación de datos visuales y espaciales
- **Enfoque:** Inteligencia accionable, optimización de toma de decisiones

### **Joint Venture: IngeIA EPCM**
- **Formación:** Unión estratégica SIMA + AXSOL
- **Enfoque:** EPCM con IA para Oil & Gas y Minería
- **Diferenciador:** Sincronización perfecta entre diseño, ejecución y construcción

---

## 📱 **Configuración PWA**

### **Configuración General**
- **Theme Color:** `#00A99D`
- **Background Color:** `#ffffff`
- **Display:** `standalone`
- **Start URL:** `/`

### **Iconos Disponibles**
- `favicon.ico` (32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon-192x192.png`
- `favicon-512x512.png`

---

## 🔗 **Enlaces y Contacto**

### **Redes Sociales**
- **LinkedIn:** https://linkedin.com (configurado en footer)

### **Navegación Principal**
- Inicio (`#inicio`)
- Soluciones (`#soluciones`)
- Tecnología (`#tecnologia`)
- Proyectos (`#proyectos`)
- Nosotros (`#nosotros`)
- Contacto (`#contacto`)

### **URLs de Demo Automático**
- **Rutas directas:** `/demo`, `/solicitar-demo`, `/request-demo`
- **Parámetros:** `?demo`, `?solicitar-demo`, `?request-demo`
- **Hash:** `#demo`, `#solicitar-demo`
- **Acción:** Abre automáticamente Calendly (`https://calendly.com/axsol/30min`)
- **Componente:** `DemoHandler.tsx`

---

## 📊 **Analytics y Tracking**

### **Herramientas Configuradas**
- **PostHog:** Configurado
- **Microsoft Clarity:** Configurado
- **Segment:** Configurado
- **Customer.io:** Configurado

### **Eventos Principales**
- `user_logged_in`
- `timeline_date_jumped`
- `timeline_loop_toggled`
- `camera_session_ended`
- `camera_zoomed`
- `home_view_activated`

---

## 🚀 **Tecnología**

### **Stack Principal**
- **Frontend:** React 19.2.0, TypeScript
- **Build:** Vite 6.2.0
- **Styling:** TailwindCSS
- **3D/GIS:** Cesium (en SITE)
- **Auth:** Auth0
- **Analytics:** PostHog, Segment, Clarity, Customer.io

### **Infraestructura**
- **Deployment:** Netlify
- **Domain:** ingeia.tech
- **Environment:** Development/Production

---

## 📝 **Notas de Desarrollo**

### **Estructura del Proyecto**
```
axsol-viewer/
├── apps/
│   ├── www/          # Sitio web corporativo (ingeia.tech)
│   ├── site/         # Aplicación SITE (plantas)
│   └── line/         # Aplicación LINE (ductos)
├── packages/
│   └── analytics/    # Paquete compartido de analytics
```

### **Configuración de Manifiestos**
- Cada aplicación tiene su propio `manifest.json`
- Configuración específica por aplicación (WWW vs SITE vs LINE)
- Iconos compartidos pero nombres diferenciados

### **Deployment**
- WWW: Sitio principal en ingeia.tech
- SITE: Aplicación de viewer para plantas
- LINE: Aplicación para ductos (futuro)

---

**Última actualización:** Octubre 2025
**Mantenido por:** Equipo de Desarrollo IngeIA EPCM
