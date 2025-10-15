'use strict';

const db = require('../db');

function escapeString(val) {
  return String(val).replace(/'/g, "''");
}

function asSqlLiteral(val, opts = {}) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';

  // Numbers (including numeric strings)
  const s = String(val);
  if (/^-?\d+$/.test(s) && !opts.forceString) return s; // integer-like

  return `'${escapeString(s)}'`;
}

(async function exportIfcSeed() {
  try {
    const q = `
      SELECT project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status
      FROM project_ifc_files
      ORDER BY project_id, id
    `;
    const { rows } = await db.query(q);

    if (!rows || rows.length === 0) {
      console.log('-- No rows found in project_ifc_files');
      process.exit(0);
    }

    const values = rows.map(r => {
      const cols = [
        asSqlLiteral(r.project_id),
        asSqlLiteral(r.file_name, { forceString: true }),
        asSqlLiteral(r.asset_id), // BIGINT may arrive as string; keep unquoted if digits
        asSqlLiteral(r.input_crs || null, { forceString: true }),
        asSqlLiteral(r.description || null, { forceString: true }),
        asSqlLiteral(r.file_size),
        asSqlLiteral(r.etag || null, { forceString: true }),
        asSqlLiteral(r.processing_status || null, { forceString: true }),
      ];
      return `(${cols.join(', ')})`;
    });

    console.log('-- BEGIN project_ifc_files seed export');
    console.log('INSERT INTO project_ifc_files (project_id, file_name, asset_id, input_crs, description, file_size, etag, processing_status) VALUES');
    console.log('  ' + values.join(',\n  ') + ';');
    console.log('-- END project_ifc_files seed export');
    process.exit(0);
  } catch (err) {
    console.error('Error exporting project_ifc_files:', err);
    process.exit(1);
  }
})();
