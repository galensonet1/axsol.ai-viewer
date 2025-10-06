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
        `SELECT r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         JOIN users u ON u.id = ur.user_id
         WHERE u.auth0_sub = $1`,
        [auth0Sub]
      );

      const userRoles = userRolesQuery.rows.map(row => row.name);

      const hasRequiredRole = userRoles.some(role => requiredRoles.includes(role));

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
