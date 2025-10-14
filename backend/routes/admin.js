const express = require('express');
const router = express.Router();
const pool = require('../db');
const { uploadIfcToIon, getIonAssetMetadata, deleteIonAsset } = require('../services/cesiumIon');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const os = require('os');

// Directorio local para localizar IFCs cuando se migran desde disco
const DEFAULT_LOCAL_DIR = path.resolve(path.join(__dirname, '..', 'python', 'temp'));
const IFC_LOCAL_DIR = process.env.IFC_LOCAL_DIR ? path.resolve(process.env.IFC_LOCAL_DIR) : DEFAULT_LOCAL_DIR;

function listIfcFilesRecursive(baseDir, subDir = '.') {
  const dir = path.join(baseDir, subDir);
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const rel = path.join(subDir, entry.name);
    const full = path.join(baseDir, rel);
    if (entry.isDirectory()) {
      files = files.concat(listIfcFilesRecursive(baseDir, rel));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ifc')) {
      const stat = fs.statSync(full);
      files.push({ relativePath: rel, size: stat.size, mtime: stat.mtime });
    }
  }
  return files;
}

// ==========================================
// UPLOAD DE LOGOS (IMÁGENES)
// ==========================================

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'imagenes');
try { fs.mkdirSync(IMAGES_DIR, { recursive: true }); } catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const name = `${Date.now()}_${base}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Solo se permiten archivos de imagen'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// POST /api/admin/upload/logo - Subir una imagen de logo
router.post('/upload/logo', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Archivo no recibido' });
    const filename = req.file.filename;
    const url = `/imagenes/${filename}`;
    return res.status(201).json({ success: true, filename, url });
  } catch (error) {
    console.error('[ADMIN][UPLOAD] Error subiendo imagen:', error);
    res.status(500).json({ success: false, error: 'Error interno subiendo imagen' });
  }
});

// ==========================================
// WEEKLY PLAN (CZML) ADMIN UPLOAD
// ==========================================

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}

const czmlTempStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'plan.czml').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `weekly-plan-${Date.now()}-${safe}`);
  },
});

const uploadWeeklyPlan = multer({ storage: czmlTempStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Subir plan semanal (.czml) para un proyecto
router.post('/projects/:projectId/weekly-plan', uploadWeeklyPlan.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'Falta el archivo (campo "file").' });
  const original = (file.originalname || '').toLowerCase();
  if (!original.endsWith('.czml')) return res.status(400).json({ success: false, error: 'El archivo debe ser .czml' });

  try {
    const proj = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = $1', [projectId]);
    if (proj.rows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const projDir = path.join(DATA_DIR, 'projects', String(projectId));
    try { fs.mkdirSync(projDir, { recursive: true }); } catch {}
    const finalName = `weekly_plan_${Date.now()}.czml`;
    const finalPath = path.join(projDir, finalName);
    try { fs.renameSync(file.path, finalPath); } catch (e) { return res.status(500).json({ success: false, error: 'Error moviendo archivo' }); }

    const prevUrl = proj.rows[0].weekly_construction_plan;
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('/data/')) {
      const prevAbs = path.join(__dirname, '..', 'public', prevUrl.replace(/^\/data\//, 'data/'));
      try { if (fs.existsSync(prevAbs)) fs.unlinkSync(prevAbs); } catch {}
    }

    const publicUrl = `/data/projects/${projectId}/${finalName}`;
    await pool.query('UPDATE projects SET weekly_construction_plan = $2 WHERE id = $1', [projectId, publicUrl]);
    return res.status(201).json({ success: true, url: publicUrl });
  } catch (e) {
    console.error('[ADMIN][WEEKLY-PLAN] Error subiendo CZML:', e);
    return res.status(500).json({ success: false, error: 'Error interno al subir el plan semanal' });
  } finally {
    try { if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch {}
  }
});

// Eliminar plan semanal para un proyecto
router.delete('/projects/:projectId/weekly-plan', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query('SELECT weekly_construction_plan FROM projects WHERE id = $1', [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    const url = result.rows[0].weekly_construction_plan;
    if (url && typeof url === 'string' && url.startsWith('/data/')) {
      const abs = path.join(__dirname, '..', 'public', url.replace(/^\/data\//, 'data/'));
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
    }
    await pool.query('UPDATE projects SET weekly_construction_plan = NULL WHERE id = $1', [projectId]);
    return res.json({ success: true });
  } catch (e) {
    console.error('[ADMIN][WEEKLY-PLAN] Error eliminando CZML:', e);
    return res.status(500).json({ success: false, error: 'Error interno eliminando el plan semanal' });
  }
});

// Eliminar un IFC (DB + Cesium Ion)
router.delete('/projects/:projectId/ifc/:ifcId', async (req, res) => {
  const { projectId, ifcId } = req.params;
  try {
    const recQ = `SELECT id, project_id, asset_id, file_name FROM project_ifc_files WHERE id = $1 AND project_id = $2`;
    const rec = await pool.query(recQ, [ifcId, projectId]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Registro IFC no encontrado' });

    const assetId = rec.rows[0].asset_id;
    try { if (assetId) await deleteIonAsset(assetId); } catch (e) { console.warn('[ADMIN][IFC] Error eliminando asset Ion:', e.message); }

    await pool.query('DELETE FROM project_ifc_files WHERE id = $1', [ifcId]);
    return res.json({ success: true, message: `IFC eliminado (ID ${ifcId})` });
  } catch (error) {
    console.error('[ADMIN][IFC] Error eliminando IFC:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error eliminando IFC' });
  }
});

// Borrado múltiple de IFCs
router.post('/projects/:projectId/ifc/batch-delete', async (req, res) => {
  const { projectId } = req.params;
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'Debe enviar ids: []' });
  }
  let ok = 0, fail = 0;
  for (const id of ids) {
    try {
      const rec = await pool.query('SELECT id, asset_id FROM project_ifc_files WHERE id = $1 AND project_id = $2', [id, projectId]);
      if (rec.rows.length === 0) { fail++; continue; }
      const assetId = rec.rows[0].asset_id;
      try { if (assetId) await deleteIonAsset(assetId); } catch (e) { console.warn('[ADMIN][IFC] Error eliminando asset Ion:', e.message); }
      await pool.query('DELETE FROM project_ifc_files WHERE id = $1', [id]);
      ok++;
    } catch (e) {
      fail++;
    }
  }
  return res.json({ success: true, ok, fail });
});

// Reemplazar un IFC desde archivo local (crear nuevo asset en Ion y actualizar registro)
router.post('/projects/:projectId/ifc/:ifcId/replace-local', async (req, res) => {
  const { projectId, ifcId } = req.params;
  const { relativePath, inputCrs = 'EPSG:22182', description, deleteOld = true } = req.body || {};
  if (!relativePath) return res.status(400).json({ success: false, error: 'relativePath es requerido' });

  try {
    const recQ = `SELECT id, project_id, asset_id FROM project_ifc_files WHERE id = $1 AND project_id = $2`;
    const rec = await pool.query(recQ, [ifcId, projectId]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Registro IFC no encontrado' });

    const requested = path.resolve(path.join(IFC_LOCAL_DIR, relativePath));
    if (!requested.startsWith(IFC_LOCAL_DIR)) {
      return res.status(400).json({ success: false, error: 'Ruta fuera de directorio permitido' });
    }
    if (!fs.existsSync(requested)) {
      return res.status(404).json({ success: false, error: 'Archivo IFC no encontrado en servidor' });
    }

    const fileName = path.basename(relativePath);
    let size = null;
    try { const st = fs.statSync(requested); size = st.size; } catch {}

    const { assetId: newAssetId, etag } = await uploadIfcToIon({ filePath: requested, fileName, inputCrs, description });

    // Actualizar registro con el nuevo asset
    const upd = `UPDATE project_ifc_files
                 SET file_name = $1, asset_id = $2, input_crs = $3, description = $4, file_size = $5, etag = $6, processing_status = 'uploaded', updated_at = NOW()
                 WHERE id = $7
                 RETURNING *`;
    const saved = await pool.query(upd, [fileName, newAssetId, inputCrs, description || null, size, etag || null, ifcId]);

    // Opcional: eliminar asset anterior
    const oldAssetId = rec.rows[0].asset_id;
    if (deleteOld && oldAssetId && oldAssetId !== newAssetId) {
      try { await deleteIonAsset(oldAssetId); } catch (e) { console.warn('[ADMIN][IFC] Error eliminando asset anterior Ion:', e.message); }
    }

    return res.json({ success: true, data: saved.rows[0], message: 'IFC reemplazado correctamente' });
  } catch (error) {
    console.error('[ADMIN][IFC] Error reemplazando IFC:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error reemplazando IFC' });
  }
});

// ==========================================
// CRUD COMPLETO PARA PROYECTOS
// ==========================================

// GET /api/admin/projects - Listar todos los proyectos
router.get('/projects', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo lista de proyectos');
    
    const query = `
      SELECT 
        id,
        name,
        description,
        business_id,
        api_base_url,
        start_date,
        end_date,
        layout_geojson,
        project_polygon,
        layout_polygon,
        initial_location,
        opcions,
        weekly_construction_plan,
        created_at,
        updated_at,
        CASE 
          WHEN start_date > CURRENT_DATE THEN 'Planificado'
          WHEN end_date < CURRENT_DATE THEN 'Completado'
          ELSE 'En Progreso'
        END as status,
        CASE 
          WHEN end_date IS NOT NULL AND start_date IS NOT NULL 
          THEN end_date - start_date 
          ELSE NULL 
        END as duration_days
      FROM projects 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('[ADMIN] Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// GESTIÓN DE IFC (ADMIN)
// ==========================================

// Listar archivos IFC locales disponibles en el servidor
router.get('/projects/:projectId/ifc/local-files', async (req, res) => {
  try {
    const files = listIfcFilesRecursive(IFC_LOCAL_DIR);
    res.json({ success: true, data: files, total: files.length, baseDir: IFC_LOCAL_DIR });
  } catch (error) {
    console.error('[ADMIN][IFC] Error listando IFC locales:', error);
    res.status(500).json({ success: false, error: 'Error interno listando IFC locales' });
  }
});

// Listar registros IFC en BD por proyecto
router.get('/projects/:projectId/ifc', async (req, res) => {
  const { projectId } = req.params;
  try {
    const q = `SELECT id, project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status, created_at, updated_at
               FROM project_ifc_files WHERE project_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(q, [projectId]);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('[ADMIN][IFC] Error listando registros IFC:', error);
    res.status(500).json({ success: false, error: 'Error interno listando IFC' });
  }
});

// Migrar un archivo IFC local a Cesium Ion y registrar en BD
router.post('/projects/:projectId/ifc/migrate', async (req, res) => {
  const { projectId } = req.params;
  const { relativePath, inputCrs = 'EPSG:22182', description } = req.body || {};
  if (!relativePath) {
    return res.status(400).json({ success: false, error: 'relativePath es requerido' });
  }

  // Validar proyecto existe
  try {
    const p = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (p.rows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  } catch (e) {
    console.error('[ADMIN][IFC] Error validando proyecto:', e);
    return res.status(500).json({ success: false, error: 'Error validando proyecto' });
  }

  // Resolver y asegurar que el archivo esté dentro de IFC_LOCAL_DIR
  const requested = path.resolve(path.join(IFC_LOCAL_DIR, relativePath));
  if (!requested.startsWith(IFC_LOCAL_DIR)) {
    return res.status(400).json({ success: false, error: 'Ruta fuera de directorio permitido' });
  }
  if (!fs.existsSync(requested)) {
    return res.status(404).json({ success: false, error: 'Archivo IFC no encontrado en servidor' });
  }

  const fileName = path.basename(relativePath);
  let size = null;
  try { const st = fs.statSync(requested); size = st.size; } catch {}

  try {
    const { assetId, etag } = await uploadIfcToIon({ filePath: requested, fileName, inputCrs, description });
    const insert = `INSERT INTO project_ifc_files (project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded') RETURNING *`;
    const values = [projectId, fileName, assetId, inputCrs, description || null, size, etag || null];
    const saved = await pool.query(insert, values);
    return res.status(201).json({ success: true, data: saved.rows[0] });
  } catch (error) {
    console.error('[ADMIN][IFC] Error migrando IFC:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error migrando IFC' });
  }
});

// GET /api/admin/projects/:id - Obtener un proyecto específico
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Obteniendo proyecto ID: ${id}`);
    
    const query = `
      SELECT 
        id,
        name,
        description,
        business_id,
        api_base_url,
        start_date,
        end_date,
        layout_geojson,
        project_polygon,
        layout_polygon,
        initial_location,
        opcions,
        weekly_construction_plan,
        created_at,
        updated_at
      FROM projects 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/admin/projects - Crear nuevo proyecto
router.post('/projects', async (req, res) => {
  try {
    const {
      name,
      description,
      business_id,
      api_base_url,
      start_date,
      end_date,
      layout_geojson,
      project_polygon,
      layout_polygon,
      initial_location,
      opcions,
      weekly_construction_plan
    } = req.body;
    
    console.log('[ADMIN] Creando nuevo proyecto:', { name, business_id });
    
    // Validaciones básicas
    if (!name || !business_id) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y Business ID son requeridos'
      });
    }
    
    const query = `
      INSERT INTO projects (
        name, description, business_id, api_base_url, 
        start_date, end_date, layout_geojson, project_polygon, layout_polygon, initial_location, opcions, weekly_construction_plan
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *
    `;
    
    const values = [
      name,
      description || null,
      business_id,
      api_base_url || null,
      start_date || null,
      end_date || null,
      layout_geojson || null,
      project_polygon || null,
      layout_polygon || null,
      initial_location || null,
      opcions || {},
      weekly_construction_plan || null
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Proyecto creado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error creando proyecto:', error);
    
    // Manejar errores específicos
    if (error.code === '23505') { // Unique violation
      // Determinar qué campo causó el conflicto
      let conflictField = 'nombre o business_id';
      if (error.constraint && error.constraint.includes('name')) {
        conflictField = 'nombre';
      } else if (error.constraint && error.constraint.includes('business_id')) {
        conflictField = 'business_id';
      }
      
      return res.status(409).json({
        success: false,
        error: `Ya existe un proyecto con ese ${conflictField}`,
        details: error.detail || 'Violación de restricción única'
      });
    }
    
    // Error de validación NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        success: false,
        error: `Campo requerido faltante: ${error.column}`,
        details: 'Todos los campos obligatorios deben ser completados'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
});

// POST /api/admin/projects/:id/clone - Clonar proyecto existente
router.post('/projects/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, business_id } = req.body;
    
    console.log(`[ADMIN] Clonando proyecto ID: ${id} con nuevo nombre: ${name}`);
    
    // Validaciones
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nombre es requerido para el proyecto clonado'
      });
    }
    
    // Obtener proyecto original
    const originalProject = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    
    if (originalProject.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto original no encontrado'
      });
    }
    
    const original = originalProject.rows[0];
    
    // Crear proyecto clonado (sin id, created_at, updated_at)
    const cloneQuery = `
      INSERT INTO projects (
        name, description, business_id, api_base_url, 
        start_date, end_date, layout_geojson, project_polygon_geojson, 
        project_polygon, layout_polygon, initial_location
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *
    `;
    
    const cloneValues = [
      name, // Nuevo nombre
      original.description,
      business_id || original.business_id, // Nuevo business_id o mantener original
      original.api_base_url,
      original.start_date,
      original.end_date,
      original.layout_geojson,
      original.project_polygon_geojson,
      original.project_polygon,
      original.layout_polygon,
      original.initial_location
    ];
    
    const clonedProject = await pool.query(cloneQuery, cloneValues);
    
    console.log(`[ADMIN] Proyecto clonado exitosamente. Nuevo ID: ${clonedProject.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      data: clonedProject.rows[0],
      message: `Proyecto clonado exitosamente desde "${original.name}"`
    });
    
  } catch (error) {
    console.error('[ADMIN] Error clonando proyecto:', error);
    
    // Manejar errores específicos
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Ya existe un proyecto con ese nombre o business_id'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// PUT /api/admin/projects/:id - Actualizar proyecto
router.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      business_id,
      api_base_url,
      start_date,
      end_date,
      layout_geojson,
      initial_location,
      opcions,
      weekly_construction_plan
    } = req.body;
    
    console.log(`[ADMIN] Actualizando proyecto ID: ${id}`);
    
    // Verificar que el proyecto existe
    const checkQuery = 'SELECT id FROM projects WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }
    
    const query = `
      UPDATE projects 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        business_id = COALESCE($3, business_id),
        api_base_url = COALESCE($4, api_base_url),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        layout_geojson = COALESCE($7, layout_geojson),
        initial_location = COALESCE($8, initial_location),
        opcions = COALESCE(opcions::jsonb, '{}'::jsonb) || COALESCE($9::jsonb, '{}'::jsonb),
        weekly_construction_plan = COALESCE($10, weekly_construction_plan),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    
    const values = [
      name,
      description,
      business_id,
      api_base_url,
      start_date,
      end_date,
      layout_geojson,
      initial_location,
      opcions || {},
      weekly_construction_plan || null,
      id
    ];
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Proyecto actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error actualizando proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// DELETE /api/admin/projects/:id - Eliminar proyecto
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Eliminando proyecto ID: ${id}`);
    
    // Verificar que el proyecto existe
    const checkQuery = 'SELECT id, name FROM projects WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }
    
    const projectName = checkResult.rows[0].name;
    
    // Eliminar el proyecto
    const deleteQuery = 'DELETE FROM projects WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    res.json({
      success: true,
      message: `Proyecto "${projectName}" eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('[ADMIN] Error eliminando proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// ESTADÍSTICAS Y DASHBOARD
// ==========================================

// GET /api/admin/stats - Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo estadísticas');
    
    const queries = {
      totalProjects: 'SELECT COUNT(*) as count FROM projects',
      activeProjects: `
        SELECT COUNT(*) as count FROM projects 
        WHERE start_date <= CURRENT_DATE 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      `,
      completedProjects: `
        SELECT COUNT(*) as count FROM projects 
        WHERE end_date < CURRENT_DATE
      `,
      plannedProjects: `
        SELECT COUNT(*) as count FROM projects 
        WHERE start_date > CURRENT_DATE
      `
    };
    
    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      const result = await pool.query(query);
      results[key] = parseInt(result.rows[0].count);
    }
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo lista de usuarios');
    
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.active,
        u.created_at,
        u.updated_at,
        STRING_AGG(r.name, ', ') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.name, u.email, u.active, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/admin/users/:id - Obtener un usuario específico
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Obteniendo usuario ID: ${id}`);
    
    const userQuery = `
      SELECT id, name, email, active, created_at, updated_at
      FROM users WHERE id = $1
    `;
    
    const rolesQuery = `
      SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `;
    
    const [userResult, rolesResult] = await Promise.all([
      pool.query(userQuery, [id]),
      pool.query(rolesQuery, [id])
    ]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const user = userResult.rows[0];
    user.roles = rolesResult.rows;
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/users', async (req, res) => {
  try {
    const { name, email, active = true, roles = [] } = req.body;
    
    console.log('[ADMIN] Creando nuevo usuario:', { name, email });
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }
    
    // Verificar que el email no exista
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un usuario con ese email'
      });
    }
    
    // Crear usuario (generar auth0_sub temporal)
    const auth0Sub = `admin_created|${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userQuery = `
      INSERT INTO users (name, email, active, auth0_sub) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    
    const userResult = await pool.query(userQuery, [name, email, active, auth0Sub]);
    const newUser = userResult.rows[0];
    
    // Asignar roles si se proporcionaron
    if (roles.length > 0) {
      for (const roleId of roles) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [newUser.id, roleId]
        );
      }
    }
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, active, roles } = req.body;
    
    console.log(`[ADMIN] Actualizando usuario ID: ${id}`);
    
    // Verificar que el usuario existe
    const checkResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Actualizar usuario
    const updateQuery = `
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        active = COALESCE($3, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [name, email, active, id]);
    
    // Actualizar roles si se proporcionaron
    if (roles !== undefined) {
      // Eliminar roles existentes
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      
      // Agregar nuevos roles
      for (const roleId of roles) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [id, roleId]
        );
      }
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Usuario actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Eliminando usuario ID: ${id}`);
    
    // Verificar que el usuario existe
    const checkResult = await pool.query('SELECT id, name FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const userName = checkResult.rows[0].name;
    
    // Eliminar relaciones de roles primero
    await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    
    // Eliminar usuario
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: `Usuario "${userName}" eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('[ADMIN] Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// GESTIÓN DE ROLES
// ==========================================

// GET /api/admin/roles - Listar todos los roles
router.get('/roles', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo lista de roles');
    
    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.created_at,
        r.updated_at,
        COUNT(ur.user_id) as users_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
      ORDER BY r.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/admin/roles - Crear nuevo rol
router.post('/roles', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    console.log('[ADMIN] Creando nuevo rol:', { name });
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nombre del rol es requerido'
      });
    }
    
    const query = `
      INSERT INTO roles (name, description) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, description || null]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Rol creado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error creando rol:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe un rol con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// PUT /api/admin/roles/:id - Actualizar rol
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    console.log(`[ADMIN] Actualizando rol ID: ${id}`);
    
    const query = `
      UPDATE roles 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, description, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Rol actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error actualizando rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// DELETE /api/admin/roles/:id - Eliminar rol
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Eliminando rol ID: ${id}`);
    
    // Verificar que el rol existe
    const checkResult = await pool.query('SELECT id, name FROM roles WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rol no encontrado'
      });
    }
    
    const roleName = checkResult.rows[0].name;
    
    // Verificar si hay usuarios asignados a este rol
    const usersWithRole = await pool.query('SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1', [id]);
    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar el rol porque tiene usuarios asignados'
      });
    }
    
    // Eliminar rol
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: `Rol "${roleName}" eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('[ADMIN] Error eliminando rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// GESTIÓN DE ASIGNACIONES USUARIO-ROL
// ==========================================

// GET /api/admin/user-roles - Listar todas las asignaciones
router.get('/user-roles', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo asignaciones usuario-rol');
    
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY u.name, r.name) as id,
        ur.user_id,
        ur.role_id,
        u.name as user_name,
        u.email as user_email,
        r.name as role_name,
        r.description as role_description,
        ur.created_at
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.name, r.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo asignaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/admin/user-roles - Asignar rol a usuario
router.post('/user-roles', async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    
    console.log('[ADMIN] Asignando rol:', { user_id, role_id });
    
    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id y role_id son requeridos'
      });
    }
    
    // Verificar que no exista ya la asignación
    const existingAssignment = await pool.query(
      'SELECT user_id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [user_id, role_id]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El usuario ya tiene asignado este rol'
      });
    }
    
    const query = `
      INSERT INTO user_roles (user_id, role_id) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, role_id]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Rol asignado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error asignando rol:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// DELETE /api/admin/user-roles/:userId/:roleId - Eliminar asignación
router.delete('/user-roles/:userId/:roleId', async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    console.log(`[ADMIN] Eliminando asignación Usuario: ${userId}, Rol: ${roleId}`);
    
    const result = await pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *', [userId, roleId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Asignación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error eliminando asignación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// ESTADÍSTICAS EXTENDIDAS
// ==========================================

// GET /api/admin/stats/extended - Estadísticas completas
router.get('/stats/extended', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo estadísticas extendidas');
    
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM projects) as totalProjects,
        (SELECT COUNT(*) FROM projects WHERE 
          (start_date IS NULL OR start_date <= CURRENT_DATE) AND 
          (end_date IS NULL OR end_date >= CURRENT_DATE)
        ) as activeProjects,
        (SELECT COUNT(*) FROM projects WHERE end_date < CURRENT_DATE) as completedProjects,
        (SELECT COUNT(*) FROM projects WHERE start_date > CURRENT_DATE) as plannedProjects,
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE active = true) as activeUsers,
        (SELECT COUNT(*) FROM roles) as totalRoles,
        (SELECT COUNT(*) FROM user_roles) as totalAssignments,
        (SELECT COUNT(*) FROM project_permissions) as totalProjectPermissions
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    // Convertir strings a números
    const data = {
      totalProjects: parseInt(stats.totalprojects) || 0,
      activeProjects: parseInt(stats.activeprojects) || 0,
      completedProjects: parseInt(stats.completedprojects) || 0,
      plannedProjects: parseInt(stats.plannedprojects) || 0,
      totalUsers: parseInt(stats.totalusers) || 0,
      activeUsers: parseInt(stats.activeusers) || 0,
      totalRoles: parseInt(stats.totalroles) || 0,
      totalAssignments: parseInt(stats.totalassignments) || 0,
      totalProjectPermissions: parseInt(stats.totalprojectpermissions) || 0
    };
    
    res.json({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo estadísticas extendidas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ==========================================
// GESTIÓN DE PERMISOS POR PROYECTO
// ==========================================

// GET /api/admin/project-permissions - Listar todos los permisos por proyecto
router.get('/project-permissions', async (req, res) => {
  try {
    console.log('[ADMIN] Obteniendo permisos por proyecto');
    
    const query = `
      SELECT 
        pp.id,
        pp.user_id,
        pp.project_id,
        pp.permission_level,
        u.name as user_name,
        u.email as user_email,
        p.name as project_name,
        p.description as project_description,
        pp.created_at,
        pp.updated_at
      FROM project_permissions pp
      JOIN users u ON pp.user_id = u.id
      JOIN projects p ON pp.project_id = p.id
      ORDER BY p.name, u.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo permisos por proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/admin/project-permissions/by-project/:projectId - Permisos de un proyecto específico
router.get('/project-permissions/by-project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`[ADMIN] Obteniendo permisos para proyecto ID: ${projectId}`);
    
    const query = `
      SELECT 
        pp.id,
        pp.user_id,
        pp.permission_level,
        u.name as user_name,
        u.email as user_email,
        pp.created_at,
        pp.updated_at
      FROM project_permissions pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.project_id = $1
      ORDER BY u.name
    `;
    
    const result = await pool.query(query, [projectId]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo permisos del proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/admin/project-permissions/by-user/:userId - Proyectos de un usuario específico
router.get('/project-permissions/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[ADMIN] Obteniendo proyectos para usuario ID: ${userId}`);
    
    const query = `
      SELECT 
        pp.id,
        pp.project_id,
        pp.permission_level,
        p.name as project_name,
        p.description as project_description,
        pp.created_at,
        pp.updated_at
      FROM project_permissions pp
      JOIN projects p ON pp.project_id = p.id
      WHERE pp.user_id = $1
      ORDER BY p.name
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('[ADMIN] Error obteniendo proyectos del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/admin/project-permissions - Crear nuevo permiso por proyecto
router.post('/project-permissions', async (req, res) => {
  try {
    const { user_id, project_id, permission_level = 'viewer' } = req.body;
    
    console.log('[ADMIN] Creando permiso por proyecto:', { user_id, project_id, permission_level });
    
    if (!user_id || !project_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id y project_id son requeridos'
      });
    }

    // Validar nivel de permiso
    const validLevels = ['admin', 'editor', 'viewer'];
    if (!validLevels.includes(permission_level)) {
      return res.status(400).json({
        success: false,
        error: 'permission_level debe ser: admin, editor o viewer'
      });
    }
    
    // Verificar que no exista ya el permiso
    const existingPermission = await pool.query(
      'SELECT id FROM project_permissions WHERE user_id = $1 AND project_id = $2',
      [user_id, project_id]
    );
    
    if (existingPermission.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El usuario ya tiene permisos asignados para este proyecto'
      });
    }
    
    const query = `
      INSERT INTO project_permissions (user_id, project_id, permission_level) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, project_id, permission_level]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Permiso por proyecto asignado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error asignando permiso por proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// PUT /api/admin/project-permissions/:id - Actualizar permiso por proyecto
router.put('/project-permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_level } = req.body;
    
    console.log(`[ADMIN] Actualizando permiso por proyecto ID: ${id}`);
    
    if (!permission_level) {
      return res.status(400).json({
        success: false,
        error: 'permission_level es requerido'
      });
    }

    // Validar nivel de permiso
    const validLevels = ['admin', 'editor', 'viewer'];
    if (!validLevels.includes(permission_level)) {
      return res.status(400).json({
        success: false,
        error: 'permission_level debe ser: admin, editor o viewer'
      });
    }
    
    const query = `
      UPDATE project_permissions 
      SET permission_level = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [permission_level, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permiso no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Permiso actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error actualizando permiso por proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// DELETE /api/admin/project-permissions/:id - Eliminar permiso por proyecto
router.delete('/project-permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[ADMIN] Eliminando permiso por proyecto ID: ${id}`);
    
    const result = await pool.query('DELETE FROM project_permissions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Permiso no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Permiso eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('[ADMIN] Error eliminando permiso por proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;
