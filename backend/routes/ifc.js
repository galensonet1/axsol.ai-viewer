const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { uploadIfcToIon, getIonAssetMetadata } = require('../services/cesiumIon');
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});

// Multer en disco para evitar picos de memoria con archivos grandes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `ifc-${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 * 1024 } }); // hasta 5GB

// Directorio local de IFCs
const DEFAULT_LOCAL_DIR = path.resolve(path.join(__dirname, '..', 'python', 'temp'));
const IFC_LOCAL_DIR = process.env.IFC_LOCAL_DIR ? path.resolve(process.env.IFC_LOCAL_DIR) : DEFAULT_LOCAL_DIR;

function listIfcFilesRecursive(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(listIfcFilesRecursive(full, base));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ifc')) {
      const rel = path.relative(base, full);
      files.push(rel);
    }
  }
  return files;
}

// Listar IFCs del proyecto
router.get('/:projectId/ifc', checkJwt, async (req, res) => {
  const { projectId } = req.params;
  try {
    const q = `SELECT id, project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status, created_at, updated_at
               FROM project_ifc_files WHERE project_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(q, [projectId]);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('[IFC] Error listando IFCs:', err);
    res.status(500).json({ success: false, error: 'Error interno al listar IFCs' });
  }
});

// Subir un IFC a Cesium Ion y registrar el asset_id
router.post('/:projectId/ifc', checkJwt, upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const file = req.file;
  const { inputCrs = 'EPSG:22182', description } = req.body || {};

  if (!file) {
    return res.status(400).json({ success: false, error: 'Falta el archivo IFC (campo "file").' });
  }

  // Validación básica de extensión
  const originalName = file.originalname || 'upload.ifc';
  if (!originalName.toLowerCase().endsWith('.ifc')) {
    return res.status(400).json({ success: false, error: 'El archivo debe ser .ifc' });
  }

  // Asegurar que el proyecto exista
  try {
    const p = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (p.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
  } catch (err) {
    console.error('[IFC] Error verificando proyecto:', err);
    return res.status(500).json({ success: false, error: 'Error interno verificando proyecto' });
  }

  const tmpPath = file.path; // provisto por multer.diskStorage

  try {
    // Subir a Ion
    const { assetId, etag } = await uploadIfcToIon({
      filePath: tmpPath,
      fileName: originalName,
      inputCrs,
      description,
    });

    // Registrar en BD
    const insert = `INSERT INTO project_ifc_files (project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'uploaded')
                    RETURNING *`;
    const values = [
      projectId,
      originalName,
      assetId,
      inputCrs,
      description || null,
      file.size || null,
      etag || null,
    ];
    const saved = await pool.query(insert, values);

    res.status(201).json({ success: true, data: saved.rows[0], message: 'IFC subido y registrado correctamente' });
  } catch (err) {
    console.error('[IFC] Error subiendo a Ion:', err);
    res.status(500).json({ success: false, error: err.message || 'Error subiendo IFC a Ion' });
  } finally {
    // Limpiar archivo temporal
    if (tmpPath) fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;

// Obtener estado de procesamiento en Cesium Ion para un IFC
router.get('/:projectId/ifc/:ifcId/status', checkJwt, async (req, res) => {
  const { projectId, ifcId } = req.params;
  try {
    const recQ = `SELECT id, project_id, asset_id, processing_status FROM project_ifc_files WHERE id = $1 AND project_id = $2`;
    const rec = await pool.query(recQ, [ifcId, projectId]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Registro IFC no encontrado' });

    const assetId = rec.rows[0].asset_id;
    const meta = await getIonAssetMetadata(assetId);
    const status = meta?.status || meta?.state || rec.rows[0].processing_status || 'unknown';

    return res.json({ success: true, data: { assetId, status, ion: meta } });
  } catch (err) {
    console.error('[IFC] Error consultando estado Ion:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error consultando estado' });
  }
});

// Refrescar y actualizar en BD el estado de un IFC según Cesium Ion
router.post('/:projectId/ifc/:ifcId/refresh-status', checkJwt, async (req, res) => {
  const { projectId, ifcId } = req.params;
  try {
    const recQ = `SELECT id, project_id, asset_id FROM project_ifc_files WHERE id = $1 AND project_id = $2`;
    const rec = await pool.query(recQ, [ifcId, projectId]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Registro IFC no encontrado' });

    const assetId = rec.rows[0].asset_id;
    const meta = await getIonAssetMetadata(assetId);
    const status = meta?.status || meta?.state || 'unknown';

    const upd = `UPDATE project_ifc_files SET processing_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const saved = await pool.query(upd, [status, ifcId]);

    return res.json({ success: true, data: { ...saved.rows[0], ion: meta } });
  } catch (err) {
    console.error('[IFC] Error actualizando estado Ion:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error refrescando estado' });
  }
});
