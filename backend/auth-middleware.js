const pool = require('./db');

/**
 * Middleware to check if a user has one of the required roles.
 * @param {Array<string>} requiredRoles - An array of role names that are allowed to access the endpoint.
 */
const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    const auth0Sub = req.auth.payload.sub;
    if (!auth0Sub) {
      return res.status(401).json({ error: 'No user identifier found in token.' });
    }

    try {
      const userRolesQuery = await pool.query(
        `SELECT r.id, r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE u.auth0_sub = $1`,
        [auth0Sub]
      );

      const rows = userRolesQuery.rows || [];
      const userRoleNames = rows.map(row => row.name).filter(Boolean);
      const userRoleIds = rows
        .map(row => row.id)
        .filter((id) => typeof id === 'number' && Number.isInteger(id));

      const normalizedRequired = Array.isArray(requiredRoles) ? requiredRoles : [];
      const requiredIds = new Set(
        normalizedRequired
          .filter((role) => typeof role === 'number' || (typeof role === 'string' && /^\d+$/.test(role)))
          .map((role) => Number(role))
      );
      const requiredNames = normalizedRequired
        .filter((role) => typeof role === 'string' && !/^\d+$/.test(role))
        .map((role) => role.toLowerCase());

      const userRoleNamesLc = userRoleNames.map((name) => (typeof name === 'string' ? name.toLowerCase() : name));

      let hasRequiredRole = false;

      if (requiredIds.size > 0) {
        hasRequiredRole = userRoleIds.some((id) => requiredIds.has(id));
      }

      if (!hasRequiredRole && requiredNames.length > 0) {
        hasRequiredRole = userRoleNamesLc.some((role) => requiredNames.includes(role));
      }

      if (hasRequiredRole) {
        next(); // User has the role, proceed
      } else {
        res.status(403).json({ error: 'Forbidden: You do not have the required permissions.' });
      }
    } catch (error) {
      console.error('Error in checkRole middleware:', error);
      res.status(500).json({ error: 'Internal server error during permission check.' });
    }
  };
};

module.exports = { checkRole };
