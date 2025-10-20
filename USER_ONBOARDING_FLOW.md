# Flujo de Alta de Usuarios - Integración con Analytics

## 🎯 Objetivo

Documentar el flujo completo de registro/login de usuarios y cómo está integrado con toda la arquitectura de analytics (PostHog, Customer.io, Segment, IPinfo, etc.).

---

## 🔄 Flujo Completo de Alta de Usuarios

### **1. Usuario Visita la App (Sin Autenticar)**

```
Usuario → https://axsol-viewer.com/site
    ↓
Frontend carga
    ↓
Track: first_visit (Customer.io + Segment)
    ↓
ABM Enrichment (IPinfo.io → PostHog company grouping)
```

**Eventos Trackeados:**
- ✅ `first_visit` (Customer.io + Segment)
- ✅ `$pageview` (PostHog + Segment)
- ✅ Company identification (PostHog groups)

**Archivo:** `apps/site/src/main.jsx` (líneas 58-81)

---

### **2. Usuario Hace Click en "Login"**

```
Usuario click "Login"
    ↓
Redirect a Auth0 Universal Login
    ↓
Usuario elige: Sign Up / Log In
```

**Auth0 maneja:**
- Formulario de registro
- Validación de email
- Password creation
- Social login (Google, LinkedIn, etc.)

---

### **3. Auth0 Callback → Backend**

```
Auth0 callback → /api/user/me
    ↓
Backend: Obtener token de Auth0
    ↓
Backend: Llamar a Auth0 /userinfo
    ↓
Backend: findOrCreateUser(userInfo)
```

#### **3.1 Función `findOrCreateUser()`**

**Archivo:** `backend/auth-utils.js`

**Lógica:**

```javascript
// 1. Buscar usuario por auth0_sub
SELECT * FROM users WHERE auth0_sub = $1

// Si existe → Return { user, isNewUser: false }

// 2. Si no existe, buscar por email (admin panel users)
SELECT * FROM users WHERE email = $1

// Si existe → Actualizar auth0_sub → Return { user, isNewUser: false }

// 3. Si no existe, CREAR NUEVO USUARIO
INSERT INTO users (auth0_sub, email, name, active) VALUES (...)

// Asignar rol default "Viewer"
INSERT INTO user_roles (user_id, role_id) VALUES (...)

// Return { user, isNewUser: true } ← FLAG IMPORTANTE para analytics
```

**Resultado:**
- Usuario creado en BD
- Rol "Viewer" asignado
- Flag `isNewUser: true` para nuevos usuarios

---

### **4. Backend → Frontend (Respuesta)**

```json
{
  "id": 123,
  "email": "user@example.com",
  "name": "John Doe",
  "auth0_sub": "auth0|abc123",
  "active": true,
  "created_at": "2025-01-15T10:30:00Z",
  "roles": ["Viewer"],
  "roleIds": [1],
  "isNewUser": true  ← FLAG para detectar signup
}
```

**Archivo:** `backend/server.js` (línea 548)

---

### **5. Frontend: Identificación y Tracking**

**Archivo:** `apps/site/src/AppWrapper.jsx` (líneas 75-146)

#### **5.1 Identificar Usuario en Analytics**

```javascript
identify(userData.id.toString(), {
  email: userData.email,
  name: userData.name,
  roles: userData.roles,
  active: userData.active,
  created_at: userData.created_at,
  user_id: userData.id,
  auth0_sub: userData.auth0_sub
});
```

**Esto ejecuta:**
- ✅ `posthog.identify()` → PostHog
- ✅ `customerioIdentify()` → Customer.io
- ✅ `segmentIdentify()` → Segment (si configurado)

**Resultado:**
- Usuario identificado en todas las plataformas
- Todos los eventos futuros estarán asociados a este usuario
- Propiedades de usuario disponibles para segmentación

---

#### **5.2 Track Signup (Nuevos Usuarios)**

```javascript
if (userData.isNewUser) {
  // Track en Segment
  segmentTrack('User Signed Up', {
    app: 'site',
    email: userData.email,
    name: userData.name,
    roles: userData.roles,
    timestamp: now,
    source: 'auth0'
  });
  
  // Track en Customer.io
  customerioTrack('user_signed_up', {
    app: 'site',
    email: userData.email,
    name: userData.name,
    roles: userData.roles,
    timestamp: now,
    source: 'auth0'
  });
}
```

**Resultado:**
- ✅ Evento `User Signed Up` en Segment
- ✅ Evento `user_signed_up` en Customer.io
- ✅ Trigger de campaigns de onboarding

---

#### **5.3 Track Login (Usuarios Existentes)**

```javascript
else {
  // Solo trackear login 1 vez cada 24 horas
  const lastLogin = localStorage.getItem('last_login_tracked');
  
  if (!lastLogin || now - lastLogin > 24 hours) {
    segmentTrack('User Logged In', {...});
    customerioTrack('user_logged_in', {...});
    
    localStorage.setItem('last_login_tracked', now);
  }
}
```

**Resultado:**
- ✅ Evento `User Logged In` en Segment
- ✅ Evento `user_logged_in` en Customer.io
- ✅ Actualización de última actividad

---

## 📊 Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO NO AUTENTICADO                     │
│  - Llega a SITE                                                 │
│  - first_visit tracked                                          │
│  - IPinfo ABM enrichment                                        │
│  - Company grouped in PostHog                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Click "Login"
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH0 UNIVERSAL LOGIN                      │
│  - Sign Up form (new users)                                     │
│  - Log In form (existing users)                                 │
│  - Social login (Google, LinkedIn)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Callback
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (server.js)                        │
│  - Endpoint: GET /api/user/me                                   │
│  - Auth0 /userinfo                                              │
│  - findOrCreateUser()                                           │
│    • Buscar usuario                                             │
│    • Crear si no existe                                         │
│    • Asignar rol "Viewer"                                       │
│    • Return { user, isNewUser }                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Response
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (AppWrapper.jsx)                     │
│  - Recibe user data con flag isNewUser                          │
│  - identify() → PostHog + Customer.io + Segment                 │
│  - if (isNewUser):                                              │
│      → Track "User Signed Up"                                   │
│  - else:                                                        │
│      → Track "User Logged In" (1x/24h)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS PLATFORMS                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PostHog                                                   │  │
│  │  - User identified                                        │  │
│  │  - Event: User Signed Up / User Logged In                │  │
│  │  - Company grouping (ABM)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Customer.io                                               │  │
│  │  - User created/updated                                   │  │
│  │  - Event: user_signed_up / user_logged_in                │  │
│  │  - Trigger campaigns:                                     │  │
│  │    • Welcome email                                        │  │
│  │    • Onboarding sequence                                  │  │
│  │    • In-app messages                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Segment (Optional)                                        │  │
│  │  - User identified                                        │  │
│  │  - Event: User Signed Up / User Logged In                │  │
│  │  - Routes to all destinations                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Microsoft Clarity                                         │  │
│  │  - Session recording                                      │  │
│  │  - Heatmaps                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Eventos Críticos del Onboarding

### **1. first_visit** ✅
- **Cuándo:** Primera vez que visita la app (anónimo)
- **Dónde:** `apps/site/src/main.jsx`
- **Plataformas:** Customer.io, Segment
- **Uso:** Trigger campaign de bienvenida

### **2. ABM Company Identification** ✅
- **Cuándo:** Al cargar la app (anónimo)
- **Dónde:** `apps/site/src/main.jsx` → `enrichWithABM()`
- **Plataformas:** PostHog (groups)
- **Uso:** Identificar empresa del visitante para ABM

### **3. user_signed_up** ✅
- **Cuándo:** Nuevo usuario completa registro en Auth0
- **Dónde:** `apps/site/src/AppWrapper.jsx` (línea 107)
- **Plataformas:** Customer.io, Segment
- **Uso:** Trigger onboarding sequence

### **4. user_logged_in** ✅
- **Cuándo:** Usuario existente hace login (1x/24h)
- **Dónde:** `apps/site/src/AppWrapper.jsx` (línea 135)
- **Plataformas:** Customer.io, Segment
- **Uso:** Actualizar última actividad, re-engagement

### **5. User Identified** ✅
- **Cuándo:** Después de login/signup (ambos)
- **Dónde:** `apps/site/src/AppWrapper.jsx` (línea 79)
- **Plataformas:** PostHog, Customer.io, Segment
- **Uso:** Asociar eventos futuros con usuario

---

## 📝 Campaigns de Customer.io

### **Campaign 1: Bienvenida Anónima**

**Trigger:** `first_visit`

**Flujo:**
```
Evento: first_visit
    ↓
In-app badge: "¡Bienvenido! Descarga nuestro one-pager"
    ↓
Wait 24 hours (exit if clicked)
    ↓
Email: "¿Te perdiste nuestro one-pager?"
```

**Estado:** ✅ Implementado (eventos trackeados)

---

### **Campaign 2: Onboarding de Nuevos Usuarios**

**Trigger:** `user_signed_up`

**Flujo:**
```
Evento: user_signed_up
    ↓
Email inmediato: "¡Bienvenido a AXSOL Viewer!"
    ↓
Wait 24 hours
    ↓
Email: "Cómo crear tu primer proyecto"
    ↓
Wait 48 hours
    ↓
If (no projects created):
    Email: "¿Necesitas ayuda? Mira este video"
```

**Estado:** ✅ Backend listo / ⏳ Campaign por configurar

---

### **Campaign 3: Re-engagement**

**Trigger:** `user_logged_in` (absence tracking)

**Flujo:**
```
User last login > 30 días
    ↓
Email: "Te extrañamos! Mira las novedades"
    ↓
Wait 7 días
    ↓
If (still inactive):
    Email: "¿Hay algo que podamos mejorar?"
```

**Estado:** ⏳ Por configurar

---

## 🧪 Testing del Flujo

### **Test 1: Signup Completo**

1. **Limpiar estado:**
   ```javascript
   // En consola del navegador
   localStorage.clear();
   ```

2. **Logout (si estás autenticado):**
   - Click en User Menu → Logout

3. **Visita la app:**
   ```
   http://localhost:5173
   ```

4. **Verificar `first_visit`:**
   ```javascript
   // Consola debe mostrar:
   [Customer.io] Event tracked: first_visit
   [Segment] Event tracked: first_visit
   ```

5. **Click "Login" → Sign Up:**
   - Usar nuevo email
   - Completar registro en Auth0

6. **Verificar signup:**
   ```javascript
   // Consola debe mostrar:
   [Analytics] Identifying user: user@example.com
   [Analytics] NEW USER DETECTED - Tracking signup event
   [Customer.io] Event tracked: user_signed_up
   [Segment] Event tracked: User Signed Up
   ```

7. **Verificar en Customer.io Dashboard:**
   - People → Buscar por email
   - Ver eventos: `first_visit`, `user_signed_up`

---

### **Test 2: Login de Usuario Existente**

1. **Logout**

2. **Login con usuario existente**

3. **Verificar login:**
   ```javascript
   // Consola debe mostrar:
   [Analytics] Identifying user: user@example.com
   [Analytics] Tracking login event
   [Customer.io] Event tracked: user_logged_in
   [Segment] Event tracked: User Logged In
   ```

4. **Verificar en PostHog:**
   - Dashboard → People
   - Buscar usuario por email
   - Ver propiedades: email, name, roles, etc.

---

## 🔍 Debugging

### **Issue 1: No se trackea signup**

**Síntomas:**
- Usuario nuevo se crea en BD
- Pero evento `user_signed_up` no aparece en Customer.io

**Debug:**
```javascript
// En AppWrapper.jsx, línea 91
console.log('userData.isNewUser:', userData.isNewUser);

// Verificar que sea true para nuevos usuarios
```

**Solución:**
- Verificar que `findOrCreateUser()` devuelve `{ user, isNewUser: true }`
- Verificar que endpoint `/api/user/me` incluye `isNewUser` en respuesta

---

### **Issue 2: Eventos duplicados**

**Síntomas:**
- Mismo evento aparece múltiples veces en Customer.io/Segment

**Causa:**
- Múltiples renderizados de React
- Usuario refresca página

**Solución:**
- Login tracking usa localStorage para evitar duplicados (24h)
- Signup solo se trackea con flag `isNewUser` (1 vez)

---

### **Issue 3: Usuario no identificado en PostHog**

**Síntomas:**
- Eventos aparecen como anónimos en PostHog

**Debug:**
```javascript
// En consola del navegador
posthog.get_distinct_id()  // Debe retornar user ID, no anonymous_xyz
```

**Solución:**
- Verificar que `identify()` se llama después de obtener usuario
- Verificar que PostHog está inicializado antes de identify

---

## 📊 Métricas a Monitorear

### **Funnel de Conversión:**

```
1. Visitantes únicos (first_visit)
    ↓
2. Clicks en "Login"
    ↓
3. Signups completados (user_signed_up)
    ↓
4. Primera sesión > 5 min
    ↓
5. Proyecto creado
    ↓
6. Archivo subido
    ↓
7. Usuario activo (7 días)
```

**Herramienta:** PostHog Funnels

---

### **Activación:**

- **Tiempo hasta primer proyecto creado**
- **% usuarios que crean proyecto en primeras 24h**
- **% usuarios que suben archivo en primera semana**

**Herramienta:** PostHog Insights

---

### **Retención:**

- **Day 1 retention:** % que vuelve al día siguiente
- **Week 1 retention:** % que vuelve en la primera semana
- **Month 1 retention:** % que vuelve en el primer mes

**Herramienta:** PostHog Retention Tables

---

### **Engagement con Emails:**

- **Open rate:** Campaign "Bienvenida"
- **Click rate:** Link a "Crear primer proyecto"
- **Conversion rate:** Email → Proyecto creado

**Herramienta:** Customer.io Reporting

---

## 🎉 Resultado

### **✅ Flujo Completo Implementado:**

1. ✅ **Anonymous visitor tracking** (`first_visit`)
2. ✅ **ABM company identification** (IPinfo → PostHog)
3. ✅ **Signup detection** (backend `isNewUser` flag)
4. ✅ **User identification** (PostHog + Customer.io + Segment)
5. ✅ **Signup event tracking** (`user_signed_up`)
6. ✅ **Login event tracking** (`user_logged_in`)
7. ✅ **Deduplication** (24h cooldown para login)
8. ✅ **Campaign triggers** ready (Customer.io)

---

## 📝 Próximos Pasos

### **Corto Plazo:**

1. [ ] **Crear campaigns en Customer.io:**
   - Campaign "Bienvenida Anónima"
   - Campaign "Onboarding Nuevos Usuarios"
   
2. [ ] **Testing completo:**
   - Signup flow end-to-end
   - Login flow
   - Verificar eventos en todas las plataformas

3. [ ] **Agregar eventos adicionales:**
   - `project_created`
   - `file_uploaded`
   - `viewer_opened`
   - `tutorial_completed`

### **Mediano Plazo:**

1. [ ] **Dashboards en PostHog:**
   - Funnel de conversión
   - Activación metrics
   - Retención cohorts

2. [ ] **Optimización de campaigns:**
   - A/B testing de emails
   - Timing optimization
   - Personalización por rol

3. [ ] **Lead scoring:**
   - Puntaje basado en eventos
   - Segmentación automática
   - Notificación a sales team

---

¡Tu flujo de onboarding está completamente integrado con el stack de analytics! 🚀
