// Endpoint temporal para debuggear Auth0 sin autenticación
const express = require('express');
const router = express.Router();

// Debug endpoint - REMOVER EN PRODUCCIÓN
router.get('/debug/auth-config', (req, res) => {
  const config = {
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || 'NOT_SET',
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || 'NOT_SET',
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'NOT_SET',
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  console.log('[DEBUG] Auth0 config:', config);
  res.json(config);
});

// Debug endpoint para probar lógica de roles sin JWT
router.get('/debug/test-user/:auth0Sub', async (req, res) => {
  const { auth0Sub } = req.params;
  const pool = require('./db');
  
  try {
    // Simular lo que hace /api/user/me
    const userResult = await pool.query('SELECT id FROM users WHERE auth0_sub = $1', [auth0Sub]);
    
    if (userResult.rows.length === 0) {
      return res.json({ error: 'Usuario no encontrado', auth0Sub });
    }
    
    const userId = userResult.rows[0].id;
    
    // Obtener roles
    const rolesQuery = await pool.query(
      'SELECT r.id, r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [userId]
    );
    
    const roles = rolesQuery.rows.map(r => r.name);
    const roleIds = rolesQuery.rows.map(r => r.id);
    
    res.json({
      userId,
      auth0Sub,
      roles,
      roleIds,
      hasAdminAccess: roleIds.includes(5) || roleIds.includes(6)
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
