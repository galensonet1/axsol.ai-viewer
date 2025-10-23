# 🔧 **Diagnóstico: Auth0 + Microsoft Login**

## **🚨 Problema Reportado:**
Al hacer login desde Auth0 y seleccionar la opción Microsoft, no ofrece opciones y vuelve al login.

---

## **🔍 Análisis del Código:**

### **Configuración Auth0 Actual:**
```javascript
// main.jsx - Líneas 112-119
<Auth0Provider
  domain={auth0.domain || import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={auth0.clientId || import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: auth0.audience || import.meta.env.VITE_AUTH0_AUDIENCE,
    scope: 'openid profile email',
  }}
>
```

### **Login Implementation:**
```javascript
// LoginPage.jsx - Líneas 30-32
loginWithRedirect({
  appState: appState
});
```

---

## **🎯 Posibles Causas del Problema:**

### **1. Configuración de Microsoft Connection en Auth0 Dashboard**
- **Problema:** La conexión de Microsoft no está configurada correctamente
- **Verificar:**
  - ✅ Microsoft connection está habilitada
  - ✅ Client ID y Client Secret de Microsoft están configurados
  - ✅ Redirect URLs están configurados correctamente
  - ✅ Scopes necesarios están habilitados

### **2. Configuración de Redirect URLs**
- **Problema:** Las URLs de redirección no coinciden
- **Verificar en Auth0 Dashboard:**
  - `https://tu-dominio.auth0.com/login/callback`
  - `https://tu-app-domain.com` (tu dominio de aplicación)
  
### **3. Configuración de Microsoft Azure AD**
- **Problema:** La aplicación no está registrada correctamente en Azure AD
- **Verificar en Azure Portal:**
  - ✅ App Registration existe
  - ✅ Redirect URIs incluyen Auth0 callback URL
  - ✅ API permissions están configurados
  - ✅ Admin consent otorgado si es necesario

### **4. Configuración de Audience**
- **Problema:** El audience puede estar causando conflictos
- **Solución:** Verificar si el audience es necesario para Microsoft login

### **5. Configuración de Scopes**
- **Problema:** Los scopes pueden ser insuficientes o incorrectos
- **Scopes recomendados:** `openid profile email`

---

## **🛠️ Soluciones Propuestas:**

### **Solución 1: Verificar Configuración Auth0**
1. **Ir a Auth0 Dashboard**
2. **Applications → Tu App → Connections**
3. **Verificar que Microsoft está habilitado**
4. **Settings → Allowed Callback URLs:**
   ```
   https://tu-dominio.com,
   http://localhost:3000
   ```

### **Solución 2: Verificar Microsoft Azure AD**
1. **Ir a Azure Portal → App Registrations**
2. **Buscar tu aplicación**
3. **Authentication → Redirect URIs:**
   ```
   https://tu-tenant.auth0.com/login/callback
   ```
4. **API Permissions → Verificar permisos**

### **Solución 3: Agregar Logs de Debug**
```javascript
// En LoginPage.jsx
const handleLogin = () => {
  console.log('[LoginPage] Iniciando login con redirección a:', redirectTo);
  
  loginWithRedirect({
    appState: appState,
    // Agregar connection específica para debug
    connection: 'microsoft' // Solo para testing
  });
};
```

### **Solución 4: Verificar Variables de Entorno**
Verificar que estas variables estén configuradas:
```bash
VITE_AUTH0_DOMAIN=tu-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
VITE_AUTH0_AUDIENCE=tu-audience (opcional)
```

### **Solución 5: Configuración Alternativa sin Audience**
```javascript
// Probar sin audience si causa problemas
<Auth0Provider
  domain={auth0.domain || import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={auth0.clientId || import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin,
    // audience: auth0.audience || import.meta.env.VITE_AUTH0_AUDIENCE, // Comentar temporalmente
    scope: 'openid profile email',
  }}
>
```

---

## **🧪 Pasos de Diagnóstico:**

### **Paso 1: Verificar Network Tab**
1. Abrir DevTools → Network
2. Intentar login con Microsoft
3. Buscar requests fallidos o redirects infinitos
4. Verificar response codes y error messages

### **Paso 2: Verificar Auth0 Logs**
1. Ir a Auth0 Dashboard → Monitoring → Logs
2. Buscar logs de login fallidos
3. Revisar error messages específicos

### **Paso 3: Verificar Console Errors**
1. Abrir DevTools → Console
2. Buscar errores de JavaScript
3. Verificar warnings de Auth0

### **Paso 4: Test con Connection Específica**
```javascript
// Forzar conexión Microsoft para testing
loginWithRedirect({
  connection: 'windowslive' // o el nombre de tu Microsoft connection
});
```

---

## **📋 Checklist de Verificación:**

### **Auth0 Dashboard:**
- [ ] Microsoft connection está habilitada
- [ ] Callback URLs incluyen tu dominio
- [ ] Client ID y Secret están configurados
- [ ] Connection settings son correctos

### **Microsoft Azure AD:**
- [ ] App está registrada
- [ ] Redirect URIs incluyen Auth0 callback
- [ ] Permisos están configurados
- [ ] Admin consent otorgado

### **Código:**
- [ ] Variables de entorno están configuradas
- [ ] Redirect URI es correcto
- [ ] Scopes son apropiados
- [ ] No hay errores en console

---

## **🚨 Acciones Inmediatas:**

1. **Verificar Auth0 Dashboard** → Connections → Microsoft
2. **Revisar Network Tab** durante el intento de login
3. **Verificar Auth0 Logs** para errores específicos
4. **Probar sin audience** temporalmente
5. **Agregar logs de debug** para más información

---

## **📞 Información Adicional Necesaria:**

Para un diagnóstico más preciso, necesitaríamos:
- URL del tenant de Auth0
- Nombre de la Microsoft connection en Auth0
- Errores específicos en Auth0 Logs
- Network requests durante el login fallido
- Configuración actual de Microsoft Azure AD
