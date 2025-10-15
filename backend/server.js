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
const ifcRoutes = require('./routes/ifc');
const { auth } = require('express-oauth2-jwt-bearer');

const resolveAuth0Issuer = () => {
  const rawIssuer = process.env.AUTH0_ISSUER_BASE_URL?.trim();
  const rawDomain = process.env.AUTH0_DOMAIN?.trim();
  
  console.log('[Auth0] Raw values:', { rawIssuer, rawDomain });
  
  let issuer = rawIssuer && rawIssuer.length > 0 ? rawIssuer : null;

  if (!issuer && rawDomain && rawDomain !== 'NOT_SET') {
    issuer = rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`;
  }

  if (!issuer) {
    console.error('[Auth0] Faltan variables AUTH0_ISSUER_BASE_URL o AUTH0_DOMAIN.');
    return null;
  }

  // Asegurar prefijo https://
  if (!/^https?:\/\//i.test(issuer)) {
    issuer = `https://${issuer}`;
    console.log('[Auth0] Added https prefix:', issuer);
  }

  // Asegurar slash final
  if (!issuer.endsWith('/')) {
    issuer = `${issuer}/`;
    console.log('[Auth0] Added trailing slash:', issuer);
  }

  try {
    const parsed = new URL(issuer);
    const normalized = parsed.toString();
    console.log('[Auth0] Final issuer URL:', normalized);
    return normalized;
  } catch (err) {
    console.error('[Auth0] issuer inválido:', issuer, err?.message || err);
    return null;
  }
};

const computedIssuer = resolveAuth0Issuer();

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: computedIssuer,
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
app.post('/api/projects/:id/weekly-plan', checkJwt, checkRole([5, 6]), uploadCzml.single('file'), async (req, res) => {
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
app.delete('/api/projects/:id/weekly-plan', checkJwt, checkRole([5, 6]), async (req, res) => {
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
    'https://site.ingeia.tech',
    'https://bo.ingeia.tech',
    'https://site-ingeia-tech.netlify.app',
    'https://axsol-viewer.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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

// Endpoint para la configuración (exponer parámetros necesarios al frontend)
app.get('/api/config', (req, res) => {
  try {
    const issuer = process.env.AUTH0_ISSUER_BASE_URL || '';
    const domainFromIssuer = issuer
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
    const cfg = {
      apiBaseUrl,
      auth0: {
        domain: process.env.AUTH0_DOMAIN || domainFromIssuer || null,
        clientId: process.env.AUTH0_CLIENT_ID || null,
        audience: process.env.AUTH0_AUDIENCE || null,
      },
      cesium: {
        ionToken: process.env.CESIUM_ION_TOKEN || process.env.VITE_CESIUM_ION_TOKEN || null,
      },
      adminPanelUrl: '/admin/admin.html',
    };
    res.json(cfg);
  } catch (e) {
    console.error('[CONFIG] Error construyendo configuración:', e);
    res.json({});
  }
});

// Debug routes (REMOVER EN PRODUCCIÓN)
const debugRoutes = require('./debug-auth');
const debugCzmlRoutes = require('./debug-czml');
app.use('/api', debugRoutes);
app.use('/api', debugCzmlRoutes);

// Rutas de administración (protegidas por Auth0 y rol Admin)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', checkJwt, checkRole([5, 6]), adminRoutes);

// Rutas para gestión de IFC por proyecto
// GET /api/projects/:projectId/ifc -> listar
// POST /api/projects/:projectId/ifc -> subir
app.use('/api/projects', ifcRoutes);

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
app.patch('/api/projects/:id/opcions', checkJwt, checkRole([5, 6]), async (req, res) => {
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
    const issuerBase = process.env.AUTH0_ISSUER_BASE_URL || '';
    const userinfoUrl = issuerBase.endsWith('/') ? `${issuerBase}userinfo` : `${issuerBase}/userinfo`;
    
    const userInfoResponse = await axios.get(userinfoUrl, {
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
      'SELECT r.id, r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user.id]
    );
    const roles = rolesQuery.rows.map(r => r.name);
    const roleIds = rolesQuery.rows.map(r => r.id);

    res.json({ ...user, roles, roleIds });

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
    
    // Verificar si el usuario tiene rol global (ID 5) para ver todos los proyectos
    const rolesResult = await pool.query(
      `SELECT r.id FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    const hasGlobalAccess = rolesResult.rows.some((row) => row.id === 5);

    let projectsQuery;
    let queryParams = [userId];

    if (hasGlobalAccess) {
      projectsQuery = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.description,
          p.start_date,
          p.end_date,
          p.initial_location,
          p.opcions,
          pp.permission_level
        FROM projects p
        LEFT JOIN project_permissions pp
          ON p.id = pp.project_id AND pp.user_id = $1
        ORDER BY p.name ASC
      `;
    } else {
      projectsQuery = `
        SELECT DISTINCT 
          p.id, 
          p.name, 
          p.description, 
          p.start_date, 
          p.end_date,
          p.initial_location,
          p.opcions,
          pp.permission_level
        FROM projects p
        INNER JOIN project_permissions pp ON p.id = pp.project_id
        WHERE pp.user_id = $1
        ORDER BY p.name ASC
      `;
    }

    const result = await pool.query(projectsQuery, queryParams);
    console.log(`[PROJECTS] ${result.rows.length} proyectos encontrados para el usuario`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint para obtener un proyecto por ID (con verificación de permisos)
app.get('/api/projects/:id', checkJwt, async (req, res) => {
  const { id } = req.params;
  const auth0Sub = req.auth.payload.sub;
  
  try {
    console.log(`[PROJECT] Usuario ${auth0Sub} solicitando proyecto ${id}`);
    
    // Verificar que el usuario existe en la base de datos
    const userQuery = 'SELECT id FROM users WHERE auth0_sub = $1';
    const userResult = await pool.query(userQuery, [auth0Sub]);
    
    if (userResult.rows.length === 0) {
      console.log(`[PROJECT] Usuario ${auth0Sub} no encontrado en la base de datos`);
      return res.status(403).json({ error: 'Usuario no autorizado.' });
    }
    
    // Por ahora, permitir acceso a todos los usuarios autenticados que existen en la BD
    // TODO: Implementar verificación de permisos específicos por proyecto
    
    // Obtener el proyecto
    const projectQuery = 'SELECT * FROM projects WHERE id = $1';
    const result = await pool.query(projectQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    
    console.log(`[PROJECT] Usuario ${auth0Sub} accedió exitosamente al proyecto ${id}`);
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

// Inicializar servidor
const startServer = async () => {
  try {
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`\n🚀 Servidor AXSOL.ai Viewer iniciado correctamente`);
      console.log(`📡 API disponible en: http://localhost:${port}`);
      console.log(`📊 Documentación: http://localhost:${port}/api-docs (si está configurada)`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación
startServer();
