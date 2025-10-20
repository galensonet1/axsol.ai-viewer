# AXSOL.ai Viewer

Una aplicación web para visualizar proyectos de construcción con datos 3D, imágenes y análisis temporal usando Cesium.

## 🏗️ Arquitectura del Proyecto

```
axsol-viewer/
├── apps/
│   ├── site/         # App principal (SITE.ingeia.tech)
│   ├── www/          # Sitio público (WWW.ingeia.tech)
│   └── line/         # App LINE (LINE.ingeia.tech)
├── backend/          # API Node.js con Express
├── packages/
│   ├── analytics/    # Utilidades compartidas (PostHog)
│   └── config/       # Configuración compartida
└── README.md         # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL (v13 o superior)
- npm o yarn

### 1. Configuración de la Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb axsol_viewer

# O usando psql
psql -U postgres -c "CREATE DATABASE axsol_viewer;"
```

### 2. Configuración del Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar base de datos
node init-db.js

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Configuración del Frontend (SITE)

```bash
cd apps/site

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar aplicación de desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno del Backend

```env
# Base de datos
DB_USER=tu_usuario
DB_HOST=localhost
DB_DATABASE=axsol_viewer
DB_PASSWORD=tu_password
DB_PORT=5432

# Auth0
AUTH0_AUDIENCE=https://api.axsol-viewer.com
AUTH0_ISSUER_BASE_URL=https://tu-dominio.auth0.com/

# API Keys
AX_API_KEY=tu_api_key_axsol
BING_MAPS_API_KEY=tu_api_key_bing

# Puerto
PORT=3001
```

### Variables de Entorno del Frontend

```env
# Backend API
VITE_API_BASE_URL=http://localhost:3001

# Auth0
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu_client_id
VITE_AUTH0_AUDIENCE=https://api.axsol-viewer.com

# Cesium Ion
VITE_CESIUM_ION_TOKEN=tu_cesium_token
```

## 📚 Funcionalidades

- **Autenticación**: Sistema de login con Auth0
- **Visualización 3D**: Mapas interactivos con Cesium
- **Gestión de Proyectos**: CRUD completo de proyectos
- **Análisis Temporal**: Visualización de progreso en el tiempo
- **Datos Externos**: Integración con APIs de AXSOL
- **Roles y Permisos**: Sistema de autorización por roles

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- Auth0 JWT
- Axios

### Frontend
- React 19
- Cesium + Resium
- Material-UI
- Auth0 React SDK
- Vite

## 📖 Scripts Disponibles

### Backend
```bash
npm start       # Producción
npm run dev     # Desarrollo con nodemon
```

### Frontend
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build para producción
npm run preview # Preview del build
```

## 🔍 Estructura de la Base de Datos

- **projects**: Información de proyectos
- **users**: Usuarios del sistema
- **roles**: Roles disponibles
- **user_roles**: Relación usuarios-roles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a AXSOL.ai
