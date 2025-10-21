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
const systemRoutes = require('./routes/system');
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

// Configuración CORS con soporte para Netlify deploy previews
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: Postman, curl)
    if (!origin) return callback(null, true);
    
    // Lista de origins permitidos
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'https://site.ingeia.tech',
      'https://bo.ingeia.tech',
      'https://site-ingeia-tech.netlify.app',
      'https://axsol-viewer.netlify.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Permitir si está en la lista exacta
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir todos los subdominios de ingeia.tech
    if (origin.endsWith('.ingeia.tech')) {
      return callback(null, true);
    }
    
    // Permitir todos los subdominios de netlify.app (deploy previews)
    if (origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    
    // Rechazar otros origins
    callback(new Error('Not allowed by CORS'));
  },
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
    
    // Detectar protocolo correcto (considerar proxies/load balancers)
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('host');
    const apiBaseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
    
    console.log('[CONFIG] Generando configuración:', { protocol, host, apiBaseUrl });
    
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
      clarity: {
        projectId: process.env.CLARITY_PROJECT_ID || null,
      },
      posthog: {
        apiHost: process.env.POSTHOG_API_HOST || null,
      },
      adminPanelUrl: '/admin/admin.html',
    };
    res.json(cfg);
  } catch (e) {
    console.error('[CONFIG] Error construyendo configuración:', e);
    res.json({});
  }
});

// IP Enrichment endpoint for ABM (Account-Based Marketing)
// Supports: IPinfo.io, Clearbit Reveal (legacy), and Mock mode
app.post('/api/reveal', async (req, res) => {
  try {
    // Extract IP from headers (considering proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;
    
    console.log('[ABM] Reveal request for IP:', ip);
    
    // Priority 1: IPinfo.io
    if (process.env.IPINFO_API_KEY) {
      console.log('[ABM] Using IPinfo.io');
      
      try {
        const response = await axios.get(`https://ipinfo.io/${ip}`, {
          params: { token: process.env.IPINFO_API_KEY },
          timeout: 5000
        });

        const data = response.data;
        
        // Parse organization name from "org" field (format: "AS15169 Google LLC")
        const orgMatch = data.org?.match(/^AS\d+\s+(.+)$/);
        const companyName = orgMatch ? orgMatch[1] : data.org || data.company?.name || null;
        
        // Extract domain from hostname or org
        const hostname = data.hostname || '';
        const companyDomain = hostname.includes('.') ? hostname : null;
        
        // Normalize firmographic data from IPinfo
        const firmo = {
          companyDomain: companyDomain,
          companyName: companyName,
          industry: data.company?.type || null,
          sector: null,
          employees: null,
          employeesRange: null,
          estimatedAnnualRevenue: null,
          tags: [],
          techCategories: [],
          location: [data.city, data.region, data.country].filter(Boolean).join(', '),
          country: data.country || null,
          city: data.city || null,
          region: data.region || null,
          timezone: data.timezone || null,
          postal: data.postal || null,
        };

        if (companyName) {
          console.log('[ABM] Company identified via IPinfo:', companyName);
          return res.json({ ok: true, firmo, source: 'ipinfo' });
        } else {
          console.log('[ABM] No company data from IPinfo');
          return res.status(404).json({ ok: false, error: 'No company data' });
        }
        
      } catch (error) {
        console.error('[ABM] IPinfo error:', error.message);
        return res.status(500).json({ ok: false, error: 'IPinfo request failed' });
      }
    }
    
    // Priority 2: Clearbit Reveal (legacy support)
    if (process.env.CLEARBIT_API_KEY) {
      console.log('[ABM] Using Clearbit Reveal');
      
      try {
        const response = await axios.get(`https://reveal.clearbit.com/v1/companies/find?ip=${ip}`, {
          headers: { 
            'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}` 
          },
          timeout: 5000
        });

        const data = response.data;
        
        const firmo = {
          companyDomain: data.domain || null,
          companyName: data.name || null,
          industry: data.category?.industry || null,
          sector: data.category?.sector || null,
          employees: data.metrics?.employees || null,
          employeesRange: data.metrics?.employeesRange || null,
          estimatedAnnualRevenue: data.metrics?.estimatedAnnualRevenue || null,
          tags: data.tags || [],
          techCategories: data.tech || [],
          location: data.geo?.city || data.geo?.state || data.geo?.country || null,
        };

        console.log('[ABM] Company found via Clearbit:', firmo.companyName);
        return res.json({ ok: true, firmo, source: 'clearbit' });
        
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('[ABM] No company found via Clearbit');
          return res.status(404).json({ ok: false, error: 'Company not found' });
        }
        console.error('[ABM] Clearbit error:', error.message);
        return res.status(500).json({ ok: false, error: 'Clearbit request failed' });
      }
    }
    
    // Priority 3: Mock mode for development
    console.warn('[ABM] No API key configured - using MOCK data');
    
    const mockFirmo = {
      companyDomain: 'example-company.com',
      companyName: 'Example Company Inc.',
      industry: 'Technology',
      sector: 'Software',
      employees: 250,
      employeesRange: '100-500',
      estimatedAnnualRevenue: '$25M-$50M',
      tags: ['SaaS', 'B2B', 'Enterprise'],
      techCategories: ['React', 'Node.js', 'AWS'],
      location: 'San Francisco, CA'
    };
    
    return res.json({ ok: true, firmo: mockFirmo, source: 'mock' });
    
  } catch (error) {
    console.error('[ABM] Unexpected error:', error.message);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// LinkedIn Automation Webhook Endpoint
// Receives webhooks from LinkedIn automation tools (Expandi, LaGrowthMachine, etc.)
app.post('/api/webhooks/linkedin', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    console.log('[LINKEDIN WEBHOOK] Received event:', event, data);
    
    // Validate webhook signature if configured
    const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      // Add signature validation logic here if needed
    }
    
    // Process different LinkedIn events
    switch (event) {
      case 'connection_accepted':
        // LinkedIn connection accepted - trigger Customer.io follow-up
        console.log('[LINKEDIN] Connection accepted:', data.linkedin_profile);
        
        // TODO: Call Customer.io API to trigger campaign
        // await triggerCustomerIOEvent('linkedin_connection_accepted', {
        //   linkedin_profile: data.linkedin_profile,
        //   name: data.name,
        //   company: data.company
        // });
        break;
        
      case 'message_replied':
        // Prospect replied to LinkedIn message
        console.log('[LINKEDIN] Message replied:', data.linkedin_profile);
        
        // TODO: Trigger Customer.io nurture campaign
        // await triggerCustomerIOEvent('linkedin_replied', {
        //   linkedin_profile: data.linkedin_profile,
        //   message: data.message
        // });
        break;
        
      case 'profile_visited':
        // Someone visited your LinkedIn profile
        console.log('[LINKEDIN] Profile visited:', data.visitor_profile);
        break;
        
      default:
        console.log('[LINKEDIN] Unknown event:', event);
    }
    
    res.json({ ok: true, event, processed: true });
    
  } catch (error) {
    console.error('[LINKEDIN WEBHOOK] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Webhook processing failed' });
  }
});

// Generic Webhook Endpoint for Customer.io Reverse Webhooks
app.post('/api/webhooks/customerio', async (req, res) => {
  try {
    const { event_type, data, customer } = req.body;
    
    console.log('[CUSTOMERIO WEBHOOK] Event:', event_type);
    
    // Process Customer.io webhook events
    // Examples: email_opened, email_clicked, in_app_message_clicked
    
    switch (event_type) {
      case 'email_opened':
        console.log('[CUSTOMERIO] Email opened by:', customer?.email);
        break;
        
      case 'email_clicked':
        console.log('[CUSTOMERIO] Link clicked:', data?.link);
        break;
        
      case 'in_app_message_clicked':
        console.log('[CUSTOMERIO] In-app message clicked:', data?.message_id);
        // Could trigger LinkedIn outreach or other actions
        break;
        
      default:
        console.log('[CUSTOMERIO] Event type:', event_type);
    }
    
    res.json({ ok: true });
    
  } catch (error) {
    console.error('[CUSTOMERIO WEBHOOK] Error:', error.message);
    res.status(500).json({ ok: false, error: 'Webhook processing failed' });
  }
});

// Debug routes (REMOVER EN PRODUCCIÓN)
const debugRoutes = require('./debug-auth');
const debugCzmlRoutes = require('./debug-czml');
app.use('/api', debugRoutes);
app.use('/api', debugCzmlRoutes);

// Rutas de administración (protegidas por Auth0 y rol Admin)
// SIEMPRE protegido con Auth0 - admin.html maneja la autenticación en el frontend
const adminRoutes = require('./routes/admin');
app.use('/api/admin', checkJwt, checkRole([5, 6]), adminRoutes);

// Rutas para gestión de IFC por proyecto
// GET /api/projects/:projectId/ifc -> listar
// POST /api/projects/:projectId/ifc -> subir
app.use('/api/projects', ifcRoutes);

// System information routes (version, releases, health)
app.use('/api/system', systemRoutes);

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
    const { user, isNewUser } = await findOrCreateUser(userInfo);

    // 5. Obtener roles y devolver el perfil completo
    const rolesQuery = await pool.query(
      'SELECT r.id, r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user.id]
    );
    const roles = rolesQuery.rows.map(r => r.name);
    const roleIds = rolesQuery.rows.map(r => r.id);

    // 6. Return user data with isNewUser flag for analytics tracking
    res.json({ ...user, roles, roleIds, isNewUser });

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
    
    const projectData = result.rows[0];
    console.log(`[PROJECT] Usuario ${auth0Sub} accedió exitosamente al proyecto ${id}`);
    console.log(`[PROJECT] weekly_construction_plan:`, projectData.weekly_construction_plan);
    res.json(projectData);
  } catch (error) {
    console.error(`Error al obtener el proyecto ${id}:`, error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Endpoint para obtener permisos del usuario en un proyecto específico
app.get('/api/projects/:id/permissions', checkJwt, async (req, res) => {
  const { id } = req.params;
  const auth0Sub = req.auth.payload.sub;
  
  try {
    console.log(`[PROJECT-PERMISSIONS] Usuario ${auth0Sub} consultando permisos para proyecto ${id}`);
    
    // Obtener el usuario
    const userQuery = 'SELECT id, role_id FROM users WHERE auth0_sub = $1';
    const userResult = await pool.query(userQuery, [auth0Sub]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    const userId = userResult.rows[0].id;
    const userRoleId = userResult.rows[0].role_id;
    
    // Verificar permisos específicos del proyecto
    const permissionsQuery = `
      SELECT permission_level 
      FROM project_permissions 
      WHERE project_id = $1 AND user_id = $2
    `;
    
    const permissionsResult = await pool.query(permissionsQuery, [id, userId]);
    
    const response = {
      user_id: userId,
      project_id: parseInt(id),
      global_role_id: userRoleId,
      permission_level: permissionsResult.rows.length > 0 ? permissionsResult.rows[0].permission_level : null,
      can_edit: userRoleId === 5 || userRoleId === 6 || (permissionsResult.rows.length > 0 && permissionsResult.rows[0].permission_level === 'admin')
    };
    
    console.log(`[PROJECT-PERMISSIONS] Permisos para usuario ${userId} en proyecto ${id}:`, response);
    res.json(response);
  } catch (error) {
    console.error(`Error al obtener permisos del proyecto ${id}:`, error);
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
  console.log(`[ASSETS] 🚀 Iniciando obtención de assets para el proyecto: ${projectId}`);
  console.log(`[ASSETS] Request headers:`, {
    'user-agent': req.get('user-agent'),
    'authorization': req.get('authorization') ? 'present' : 'missing'
  });

  try {
    const result = await fetchAndNormalizeAssets(projectId);
    const { deliveries, externalError } = result;
    
    console.log(`[ASSETS] 📊 Resultado final:`, {
      deliveriesCount: deliveries.length,
      hasExternalError: !!externalError,
      externalError: externalError
    });
    
    if (externalError) {
      console.warn(`[ASSETS] ⚠️ Hay errores externos pero se devuelve respuesta parcial`);
    }
    
    res.json({ 
      deliveries,
      meta: {
        count: deliveries.length,
        externalError: externalError || null
      }
    });
  } catch (error) {
    console.error(`[ASSETS] ❌ Error crítico al obtener assets para el proyecto ${projectId}:`);
    console.error(`[ASSETS] Error message:`, error.message);
    console.error(`[ASSETS] Error stack:`, error.stack);
    res.status(500).json({ 
      error: 'Error interno al obtener los assets.',
      details: error.message 
    });
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
