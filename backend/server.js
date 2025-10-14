const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { generateCzmlForImages } = require('./czml-generator');
const { fetchAndNormalizeAssets } = require('./api-utils');
const axios = require('axios');
const { findOrCreateUser } = require('./auth-utils');
const { checkRole } = require('./auth-middleware');
const { setupForestAdmin } = require('./forest-admin');
const ifcRoutes = require('./routes/ifc');
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

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

// Configuración de subida temporal (se mueve luego a /public/data/projects/:id)
const czmlStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'plan.czml').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `weekly-plan-${Date.now()}-${safe}`);
  },
});
const uploadCzml = multer({ storage: czmlStorage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch {} }

// POST subir plan semanal (solo Admin)
app.post('/api/projects/:id/weekly-plan', checkJwt, checkRole(['Admin']), uploadCzml.single('file'), async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'Falta el archivo (campo "file").' });
  const original = (file.originalname || '').toLowerCase();
  if (!original.endsWith('.czml')) return res.status(400).json({ success: false, error: 'El archivo debe ser .czml' });

  try {
    const proj = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = $1', [id]);
    if (proj.rows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const projDir = path.join(DATA_BASE_DIR, 'projects', String(id));
    ensureDir(projDir);
    const finalName = `weekly_plan_${Date.now()}.czml`;
    const finalPath = path.join(projDir, finalName);
    try { fs.renameSync(file.path, finalPath); } catch (e) { return res.status(500).json({ success: false, error: 'Error moviendo archivo' }); }

    // Borrar archivo anterior si existía y estaba en /data
    const prevUrl = proj.rows[0].weekly_construction_plan;
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('/data/')) {
      const prevAbs = path.join(__dirname, 'public', prevUrl.replace(/^\/data\//, 'data/'));
      try { if (fs.existsSync(prevAbs)) fs.unlinkSync(prevAbs); } catch {}
    }

    const publicUrl = `/data/projects/${id}/${finalName}`;
    await pool.query('UPDATE projects SET weekly_construction_plan = $2 WHERE id = $1', [id, publicUrl]);
    return res.status(201).json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('[WEEKLY-PLAN] Error subiendo CZML:', err);
    return res.status(500).json({ success: false, error: 'Error interno al subir el plan semanal' });
  } finally {
    try { if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch {}
  }
});

// GET obtener plan semanal (devuelve el archivo)
app.get('/api/projects/:id/weekly-plan', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const url = result.rows[0].weekly_construction_plan;
    if (!url) return res.status(404).json({ error: 'Plan semanal no configurado' });
    // Convertir URL pública a ruta absoluta
    const abs = url.startsWith('/data/')
      ? path.join(__dirname, 'public', url.replace(/^\/data\//, 'data/'))
      : path.isAbsolute(url) ? url : path.join(DATA_BASE_DIR, url);
    return res.sendFile(abs);
  } catch (err) {
    console.error('[WEEKLY-PLAN] Error obteniendo CZML:', err);
    return res.status(500).json({ error: 'Error interno obteniendo el plan semanal' });
  }
});

// DELETE eliminar plan semanal (solo Admin)
app.delete('/api/projects/:id/weekly-plan', checkJwt, checkRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    const url = result.rows[0].weekly_construction_plan;
    if (url && typeof url === 'string' && url.startsWith('/data/')) {
      const abs = path.join(__dirname, 'public', url.replace(/^\/data\//, 'data/'));
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
    }
    await pool.query('UPDATE projects SET weekly_construction_plan = NULL WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('[WEEKLY-PLAN] Error eliminando CZML:', err);
    return res.status(500).json({ success: false, error: 'Error interno eliminando el plan semanal' });
  }
});

// Configuración CORS
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://app.forestadmin.com',
    'https://tired-pants-speak.loca.lt'
  ],
  credentials: true
}));
app.use(express.json());

// Servir archivos estáticos (para el panel de administración)
app.use('/admin', express.static('public'));
// Servir imágenes subidas (logos) desde /imagenes
app.use('/imagenes', express.static(path.join(__dirname, 'public', 'imagenes')));
// Servir archivos de datos (CZML, etc.)
const DATA_BASE_DIR = path.join(__dirname, 'public', 'data');
try { fs.mkdirSync(DATA_BASE_DIR, { recursive: true }); } catch {}
app.use('/data', express.static(DATA_BASE_DIR));

// Endpoint para la configuración (temporalmente devuelve un objeto vacío)
app.get('/api/config', (req, res) => {
  console.log('[CONFIG] Solicitud de configuración recibida.');
  res.json({});
});

// Rutas de administración
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Rutas para gestión de IFC por proyecto
// GET /api/projects/:projectId/ifc -> listar
// POST /api/projects/:projectId/ifc -> subir
app.use('/api/projects', ifcRoutes);

// Endpoint de diagnóstico para ForestAdmin
app.get('/forest-status', (req, res) => {
  console.log('[FOREST-STATUS] Solicitud de estado de ForestAdmin');
  console.log('[FOREST-STATUS] Headers:', req.headers);
  
  res.json({
    status: 'ok',
    forestAdmin: {
      configured: !!(process.env.FOREST_AUTH_SECRET && process.env.FOREST_ENV_SECRET),
      authSecretLength: process.env.FOREST_AUTH_SECRET?.length || 0,
      envSecretLength: process.env.FOREST_ENV_SECRET?.length || 0,
    },
    database: {
      connected: true,
      uri: process.env.DATABASE_URL ? 'configured' : 'using individual vars'
    },
    timestamp: new Date().toISOString(),
    tunnel: 'https://thin-times-do.loca.lt'
  });
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

// --- Endpoints de la API ---

// Actualizar opciones (JSON) de un proyecto (solo Admin)
app.patch('/api/projects/:id/opcions', checkJwt, checkRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  try {
    // Merge JSONB: opcions = opcions || payload
    const result = await pool.query(
      `UPDATE projects
       SET opcions = COALESCE(opcions::jsonb, '{}'::jsonb) || $2::jsonb
       WHERE id = $1
       RETURNING opcions`,
      [id, JSON.stringify(payload)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    res.json({ success: true, opcions: result.rows[0].opcions });
  } catch (error) {
    console.error(`Error al actualizar opcions para el proyecto ${id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

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

// Endpoint para obtener proyectos accesibles por el usuario
// Muestra solo los proyectos donde el usuario tiene permisos (admin, editor, viewer)
app.get('/api/projects', checkJwt, async (req, res) => {
  try {
    const auth0Sub = req.auth.payload.sub;
    console.log('[PROJECTS] Obteniendo proyectos para usuario:', auth0Sub);
    
    // Obtener usuario por auth0_sub
    const userResult = await pool.query('SELECT id FROM users WHERE auth0_sub = $1', [auth0Sub]);
    
    if (userResult.rows.length === 0) {
      console.log('[PROJECTS] Usuario no encontrado en BD');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const userId = userResult.rows[0].id;
    console.log('[PROJECTS] Usuario ID:', userId);
    
    // Obtener proyectos donde el usuario tiene permisos
    const projectsQuery = `
      SELECT DISTINCT 
        p.id, 
        p.name, 
        p.description, 
        p.start_date, 
        p.end_date,
        pp.permission_level
      FROM projects p
      INNER JOIN project_permissions pp ON p.id = pp.project_id
      WHERE pp.user_id = $1
      ORDER BY p.name ASC
    `;
    
    const result = await pool.query(projectsQuery, [userId]);
    console.log(`[PROJECTS] ${result.rows.length} proyectos encontrados para el usuario`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    // Verificar si las variables de entorno están configuradas
    if (!process.env.FOREST_AUTH_SECRET || !process.env.FOREST_ENV_SECRET) {
      console.log('[ForestAdmin] Variables de entorno de Forest Admin no configuradas.');
      console.log('[ForestAdmin] Para habilitar ForestAdmin, configura FOREST_AUTH_SECRET y FOREST_ENV_SECRET en tu archivo .env');
      return;
    }

    console.log('[ForestAdmin] Inicializando Forest Admin...');
    const agent = await setupForestAdmin();
    
    // Verificar que el agente se creó correctamente
    if (!agent) {
      throw new Error('No se pudo crear el agente de ForestAdmin');
    }

    // Montar ForestAdmin en Express
    // Método correcto para ForestAdmin v1.66.0
    await agent.mountOnExpress(app);
    console.log('[ForestAdmin] ✅ Forest Admin montado correctamente');
    
  } catch (error) {
    console.error('[ForestAdmin] ❌ Error inicializando Forest Admin:', error.message);
    console.log('[ForestAdmin] El servidor continuará sin ForestAdmin');
  }
};

// Inicializar servidor
const startServer = async () => {
  try {
    // Inicializar ForestAdmin
    await initializeForestAdmin();
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`\n🚀 Servidor AXSOL.ai Viewer iniciado correctamente`);
      console.log(`📡 API disponible en: http://localhost:${port}`);
      console.log(`📊 Documentación: http://localhost:${port}/api-docs (si está configurada)`);
      
      if (process.env.FOREST_AUTH_SECRET && process.env.FOREST_ENV_SECRET) {
        console.log(`🌲 Forest Admin: https://thin-times-do.loca.lt/forest`);
      } else {
        console.log(`🌲 Forest Admin: No configurado (agrega FOREST_AUTH_SECRET y FOREST_ENV_SECRET)`);
      }
      
      console.log(`\n💡 Para configurar ForestAdmin:`);
      console.log(`   1. Crea una cuenta en https://forestadmin.com`);
      console.log(`   2. Agrega las variables FOREST_AUTH_SECRET y FOREST_ENV_SECRET a tu .env`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();
