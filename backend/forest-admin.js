const { createAgent } = require('@forestadmin/agent');
const { createSqlDataSource } = require('@forestadmin/datasource-sql');
const {
  configureUsersCollection,
  configureProjectsCollection,
  configureRolesCollection,
  configureUserRolesCollection,
} = require('./forest-collections');

// Configuración de ForestAdmin Agent
const setupForestAdmin = async () => {
  try {
    console.log('[ForestAdmin] Inicializando Forest Admin Agent...');

    // Crear el agente de ForestAdmin
    const agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET,
      envSecret: process.env.FOREST_ENV_SECRET,
      isProduction: process.env.NODE_ENV === 'production',
    });

    // Configurar la fuente de datos SQL (PostgreSQL)
    const dataSource = createSqlDataSource({
      uri: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
      schema: {
        include: ['users', 'roles', 'user_roles', 'projects'], // Tablas a incluir
      },
    });

    // Agregar la fuente de datos al agente
    agent.addDataSource(dataSource);

    // Aplicar configuraciones personalizadas de las colecciones
    configureUsersCollection(agent);
    configureProjectsCollection(agent);
    configureRolesCollection(agent);
    configureUserRolesCollection(agent);

    console.log('[ForestAdmin] Forest Admin Agent configurado correctamente');
    return agent;

  } catch (error) {
    console.error('[ForestAdmin] Error configurando Forest Admin:', error);
    throw error;
  }
};

module.exports = { setupForestAdmin };
