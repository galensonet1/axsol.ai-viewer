const pool = require('./db');

/**
 * Finds an existing user or creates a new one based on the Auth0 profile.
 * @param {object} auth0Profile - The user profile object from Auth0 (req.auth.payload).
 * @returns {Promise<object>} The user object from our database.
 */
const findOrCreateUser = async (auth0Profile) => {
  const { sub, email, name } = auth0Profile;

  console.log('[AUTH] Buscando usuario con auth0_sub:', sub);
  console.log('[AUTH] Email:', email, 'Name:', name);

  // 1. Check if user exists by auth0_sub
  let user = await pool.query('SELECT * FROM users WHERE auth0_sub = $1', [sub]);

  if (user.rows.length > 0) {
    console.log('[AUTH] Usuario encontrado por auth0_sub:', user.rows[0].id);
    return { user: user.rows[0], isNewUser: false }; // Existing user
  }

  // 2. Check if user exists by email (for users created via admin panel)
  const existingUserByEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (existingUserByEmail.rows.length > 0) {
    console.log('[AUTH] Usuario encontrado por email, actualizando auth0_sub...');
    
    // Update existing user with correct auth0_sub
    const updatedUser = await pool.query(
      'UPDATE users SET auth0_sub = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3 RETURNING *',
      [sub, name || existingUserByEmail.rows[0].name, email]
    );
    
    console.log('[AUTH] Usuario actualizado:', updatedUser.rows[0].id);
    return { user: updatedUser.rows[0], isNewUser: false }; // Existing user (updated)
  }

  // 3. Create new user if doesn't exist
  console.log('[AUTH] Creando nuevo usuario...');
  const newUser = await pool.query(
    'INSERT INTO users (auth0_sub, email, name, active) VALUES ($1, $2, $3, $4) RETURNING *',
    [sub, email, name, true]
  );

  // 4. Assign a default role (e.g., 'Viewer') to the new user
  const viewerRole = await pool.query("SELECT id FROM roles WHERE LOWER(name) = 'viewer'");
  if (viewerRole.rows.length > 0) {
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [newUser.rows[0].id, viewerRole.rows[0].id]
    );
    console.log('[AUTH] Rol Viewer asignado al nuevo usuario');
  }

  console.log('[AUTH] Nuevo usuario creado:', newUser.rows[0].id);
  return { user: newUser.rows[0], isNewUser: true }; // NEW USER - Flag for analytics tracking
};

module.exports = { findOrCreateUser };
