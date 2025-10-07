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

    // Verificar credenciales
    console.log('[ForestAdmin] Verificando credenciales...');
    console.log('[ForestAdmin] AUTH_SECRET presente:', !!process.env.FOREST_AUTH_SECRET);
    console.log('[ForestAdmin] ENV_SECRET presente:', !!process.env.FOREST_ENV_SECRET);
    console.log('[ForestAdmin] AUTH_SECRET longitud:', process.env.FOREST_AUTH_SECRET?.length || 0);
    console.log('[ForestAdmin] ENV_SECRET longitud:', process.env.FOREST_ENV_SECRET?.length || 0);

    // Crear el agente de ForestAdmin
    const agent = createAgent({
      authSecret: process.env.FOREST_AUTH_SECRET,
      envSecret: process.env.FOREST_ENV_SECRET,
      isProduction: process.env.NODE_ENV === 'production',
      loggerLevel: 'Debug',
    });

    // Configurar la fuente de datos SQL (PostgreSQL)
    const dbUri = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
    console.log('[ForestAdmin] Conectando a base de datos...');
    console.log('[ForestAdmin] DB URI (sin credenciales):', dbUri.replace(/\/\/[^@]+@/, '//***:***@'));
    
    const dataSource = createSqlDataSource({
      uri: dbUri,
      // Remover configuración de schema por ahora para permitir auto-detección
    });

    // Agregar la fuente de datos al agente
    agent.addDataSource(dataSource);

    // Aplicar configuraciones personalizadas de las colecciones
    configureUsersCollection(agent);
    configureProjectsCollection(agent);
    configureRolesCollection(agent);
    configureUserRolesCollection(agent);

    // IMPORTANTE: Inicializar el agente
    console.log('[ForestAdmin] Inicializando agente...');
    await agent.start();
    console.log('[ForestAdmin] ✅ Agente inicializado correctamente');

    console.log('[ForestAdmin] Forest Admin Agent configurado correctamente');
    return agent;

  } catch (error) {
    console.error('[ForestAdmin] Error configurando Forest Admin:', error);
    throw error;
  }
};

module.exports = { setupForestAdmin };
