const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const path = require('path');
const { generateCzmlForImages } = require('./czml-generator');
const { fetchAndNormalizeAssets } = require('./api-utils');
const axios = require('axios');
const { findOrCreateUser } = require('./auth-utils');
const { checkRole } = require('./auth-middleware');
const { setupForestAdmin } = require('./forest-admin');


const startOfDayUtc = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfPreviousDayUtc = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - 1);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const endOfDayUtc = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const app = express();
const port = process.env.PORT || 3001;


// Configuración de AdminJS (comentado por ahora para evitar errores)
// const setupAdminJS = async () => {
//   try {
//     const AdminJS = require('adminjs');
//     const AdminJSExpress = require('@adminjs/express');
//     const { Database, Resource } = require('@adminjs/postgresql');
//     
//     AdminJS.registerAdapter({ Database, Resource });
//     
//     const adminRootPath = process.env.ADMINJS_ROOT_PATH || '/admin';
//     
//     const admin = new AdminJS({
//       rootPath: adminRootPath,
//       resources: [
//         {
//           resource: pool,
//           options: {
//             navigation: 'Gestión de proyecto',
//             properties: {
//               layout_geojson: { type: 'textarea' },
//               initial_location: { type: 'textarea' },
//             },
//             listProperties: ['id', 'name', 'business_id', 'start_date', 'end_date'],
//             filterProperties: ['name', 'business_id', 'start_date', 'end_date'],
//             editProperties: ['name', 'description', 'business_id', 'api_base_url', 'start_date', 'end_date', 'layout_geojson', 'initial_location'],
//             showProperties: ['id', 'name', 'description', 'business_id', 'api_base_url', 'start_date', 'end_date', 'layout_geojson', 'initial_location'],
//           },
//         },
//       ],
//       branding: {
//         companyName: 'AXSOL.ai Admin',
//         softwareBrothers: false,
//       },
//     });
//     
//     const adminRouter = AdminJSExpress.buildRouter(admin);
//     app.use(admin.options.rootPath, adminRouter);
//   } catch (error) {
//     console.error('Error setting up AdminJS:', error);
//   }
// };


app.use(cors());
app.use(express.json());

// Endpoint para la configuración (temporalmente devuelve un objeto vacío)
app.get('/api/config', (req, res) => {
  console.log('[CONFIG] Solicitud de configuración recibida.');
  res.json({});
});

// Endpoint para obtener KPIs de un proyecto (devuelve una estructura por defecto)
app.get('/api/projects/:id/kpis', (req, res) => {
  const { id } = req.params;
  console.log(`[KPIS] Solicitud de KPIs para el proyecto ${id}.`);
  // Devuelve una estructura de datos por defecto para evitar errores en el frontend
  res.json({
    sCurve: [],
    kpis: {
      totalCapex: 0,
      totalOpex: 0,
    },
  });
});

const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

// --- Endpoints de la API ---

// Endpoint para obtener la información del usuario actual y sus roles
app.get('/api/user/me', checkJwt, async (req, res) => {
  try {
    // 1. Obtener el accessToken de la cabecera
    const accessToken = req.headers.authorization.split(' ')[1];

    // 2. Llamar al endpoint /userinfo de Auth0
    const userInfoResponse = await axios.get(process.env.AUTH0_ISSUER_BASE_URL + 'userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 3. Los datos del usuario están en la respuesta
    const userInfo = userInfoResponse.data;

    // 4. Usar la información obtenida para encontrar o crear el usuario
    const user = await findOrCreateUser(userInfo);

    // 5. Obtener roles y devolver el perfil completo
    const rolesQuery = await pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user.id]
    );
    const roles = rolesQuery.rows.map(r => r.name);

    res.json({ ...user, roles });

  } catch (error) {
    console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint para obtener todos los proyectos (protegido por rol)
// Solo Admin y Superadmin pueden acceder
app.get('/api/projects', checkJwt, checkRole(['Admin', 'Superadmin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, start_date, end_date FROM projects ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener proyectos.' });
  }
});

// Endpoint para obtener un proyecto por ID
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error al obtener el proyecto ${id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Endpoint para obtener el layout de un proyecto
app.get('/api/projects/:id/layout', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT layout_geojson FROM projects WHERE id = $1', [id]);
    if (result.rows.length > 0 && result.rows[0].layout_geojson) {
      res.json(result.rows[0].layout_geojson);
    } else {
      res.status(404).json({ error: 'Layout no encontrado para el proyecto.' });
    }
  } catch (error) {
    console.error(`Error al obtener el layout para el proyecto ${id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Endpoint para obtener assets externos de un proyecto
app.get('/api/projects/:id/assets', async (req, res) => {
  const projectId = req.params.id;
  console.log(`[ASSETS] Iniciando obtención de assets para el proyecto: ${projectId}`);

  try {
    const { deliveries } = await fetchAndNormalizeAssets(projectId);
    res.json({ deliveries });
  } catch (error) {
    console.error(`[ASSETS] Error al obtener assets para el proyecto ${projectId}:`, error.message);
    res.status(500).json({ error: 'Error interno al obtener los assets.' });
  }
});

app.get('/api/projects/:id/czml/:layerType', async (req, res) => {
  const { id, layerType } = req.params;
  console.log(`[CZML] Solicitud para proyecto ${id}, capa ${layerType}`);

  try {
    const { deliveries, projectDetails } = await fetchAndNormalizeAssets(id);
    const { start_date, end_date } = projectDetails;

    const projectStartDate = new Date(start_date);
    const projectEndDate = new Date(end_date);

    // Filtra los assets por el tipo de capa solicitado
    const filteredDeliveries = deliveries.filter(d => d.asset_type === layerType);

    // Lógica específica para 3D Tiles: devolver JSON en lugar de CZML
    if (layerType === '3dtile') {
      const sortedTilesets = filteredDeliveries
        .filter(d => d.asset_id)
        .sort((a, b) => new Date(a.date || projectStartDate) - new Date(b.date || projectStartDate));

      const tilesetMetadata = sortedTilesets.map((delivery, index) => {
        const deliveryDate = startOfDayUtc(delivery.date) || startOfDayUtc(projectStartDate);
        const nextDelivery = sortedTilesets[index + 1];
        const nextDate = nextDelivery ? startOfDayUtc(nextDelivery.date) : null;

        let endDate;
        if (nextDate) {
          endDate = endOfPreviousDayUtc(nextDate);
        } else {
          endDate = endOfDayUtc(projectEndDate);
        }

        if (endDate && deliveryDate && endDate < deliveryDate) {
          endDate = endOfDayUtc(deliveryDate);
        }

        let startDateObj = deliveryDate || startOfDayUtc(projectStartDate) || new Date(projectStartDate);
        let endDateObj = endDate || endOfDayUtc(projectEndDate) || new Date(projectEndDate);

        if (!startDateObj || Number.isNaN(startDateObj.getTime())) {
          startDateObj = startOfDayUtc(projectStartDate) || new Date();
        }

        if (!endDateObj || Number.isNaN(endDateObj.getTime())) {
          endDateObj = new Date(startDateObj);
          endDateObj.setUTCHours(23, 59, 59, 999);
        }

        const availability = `${startDateObj.toISOString()}/${endDateObj.toISOString()}`;

        return {
          asset_id: delivery.asset_id,
          name: delivery.name || `Tileset ${delivery.asset_id}`,
          availability,
          cesium_token: delivery.cesium_token,
        };
      });

      return res.json(tilesetMetadata);
    }

    // Para otros tipos, generar CZML como antes
    let czmlData;
    switch (layerType) {
      case 'images':
      case 'images360':
        czmlData = generateCzmlForImages(filteredDeliveries, projectStartDate, projectEndDate);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de capa no válido.' });
    }

    res.json(czmlData);

  } catch (error) {
    console.error(`[CZML] Error al generar CZML para el proyecto ${id}:`, error.message);
    res.status(500).json({ error: 'Error interno al generar el archivo CZML.' });
  }
});

// Inicializar ForestAdmin
const initializeForestAdmin = async () => {
  try {
    if (process.env.FOREST_AUTH_SECRET && process.env.FOREST_ENV_SECRET) {
      console.log('[ForestAdmin] Inicializando Forest Admin...');
      const agent = await setupForestAdmin();
      
      // Montar ForestAdmin en la ruta /forest
      app.use('/forest', agent.mountOnExpress(app).expressRouter);
      
      console.log('[ForestAdmin] Forest Admin disponible en /forest');
    } else {
      console.log('[ForestAdmin] Variables de entorno de Forest Admin no configuradas. Saltando inicialización.');
    }
  } catch (error) {
    console.error('[ForestAdmin] Error inicializando Forest Admin:', error);
  }
};

// Inicializar servidor
const startServer = async () => {
  try {
    // Inicializar ForestAdmin
    await initializeForestAdmin();
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`El servidor está corriendo en el puerto: ${port}`);
      console.log(`API disponible en: http://localhost:${port}`);
      if (process.env.FOREST_AUTH_SECRET && process.env.FOREST_ENV_SECRET) {
        console.log(`Forest Admin disponible en: http://localhost:${port}/forest`);
      }
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();
