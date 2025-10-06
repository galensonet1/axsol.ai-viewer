const pool = require('./db');

/**
 * Finds an existing user or creates a new one based on the Auth0 profile.
 * @param {object} auth0Profile - The user profile object from Auth0 (req.auth.payload).
 * @returns {Promise<object>} The user object from our database.
 */
const findOrCreateUser = async (auth0Profile) => {
  const { sub, email, name } = auth0Profile;

  // 1. Check if user exists
  let user = await pool.query('SELECT * FROM users WHERE auth0_sub = $1', [sub]);

  if (user.rows.length > 0) {
    return user.rows[0]; // User found
  }

  // 2. If not, create the user
  const newUser = await pool.query(
    'INSERT INTO users (auth0_sub, email, name) VALUES ($1, $2, $3) RETURNING *',
    [sub, email, name]
  );

  // 3. Assign a default role (e.g., 'Viewer') to the new user
  const viewerRole = await pool.query("SELECT id FROM roles WHERE name = 'Viewer'");
  if (viewerRole.rows.length > 0) {
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [newUser.rows[0].id, viewerRole.rows[0].id]
    );
  }

  return newUser.rows[0];
};

module.exports = { findOrCreateUser };
