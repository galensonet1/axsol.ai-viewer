# 🌲 Guía para configurar ForestAdmin desde cero

## 🚀 Pasos para crear un nuevo proyecto ForestAdmin

### 1. Crear nuevo proyecto en ForestAdmin

1. **Ve a**: https://app.forestadmin.com
2. **Haz clic en**: "Create a new project"
3. **Nombre del proyecto**: `AXSOL Viewer Admin`
4. **Selecciona**: "I have my own backend"

### 2. Configurar la conexión

1. **Database type**: PostgreSQL
2. **Connection details**:
   - Host: `localhost` (ForestAdmin se conectará a través del túnel)
   - Port: `5432`
   - Database: `axsol_viewer`
   - Username: `tu_usuario_db`
   - Password: `tu_password_db`

### 3. Configurar el backend

1. **Admin Backend URL**: `https://thin-times-do.loca.lt`
2. **Framework**: Node.js / Express
3. **Environment**: Development

### 4. Copiar las credenciales

Una vez creado el proyecto, ForestAdmin te dará:
- `FOREST_AUTH_SECRET`: Copia este valor
- `FOREST_ENV_SECRET`: Copia este valor

### 5. Actualizar tu .env

```env
# ForestAdmin Configuration
FOREST_AUTH_SECRET=el_nuevo_auth_secret_aqui
FOREST_ENV_SECRET=el_nuevo_env_secret_aqui
```

### 6. Reiniciar el servidor

```bash
# Detener servidor actual
pkill -f nodemon

# Reiniciar
npm run dev
```

### 7. Verificar la conexión

1. **Ve al dashboard de ForestAdmin**
2. **Navega a Operations > Data**
3. **Deberías ver**: Projects, Users, Roles, User Roles

## 🔧 Estado actual de tu configuración

✅ **Backend funcionando**: Puerto 3001
✅ **Túnel activo**: https://thin-times-do.loca.lt
✅ **Base de datos**: PostgreSQL conectada
✅ **Tablas**: projects, users, roles, user_roles
✅ **Agente ForestAdmin**: Se inicia correctamente

❌ **Problema**: Credenciales no coinciden con el proyecto

## 💡 Alternativa rápida

Si no quieres crear un nuevo proyecto:

1. **Ve a tu proyecto actual en ForestAdmin**
2. **Settings > Environments > Development**
3. **Regenera las credenciales** (Regenerate secrets)
4. **Copia las nuevas credenciales** a tu .env
5. **Reinicia el servidor**

## 🎯 Una vez configurado correctamente

Tendrás acceso a:
- 👥 **Gestión de usuarios** con roles
- 📊 **Administración de proyectos** 
- 🔐 **Sistema de permisos**
- 📈 **Acciones personalizadas**
- 📤 **Exportación de datos**

## 🆘 Si sigues teniendo problemas

El problema más común es:
- **Credenciales de un proyecto diferente**
- **Environment incorrecto** (Production vs Development)
- **URL del backend mal configurada**

¡El sistema está listo, solo necesita las credenciales correctas!
