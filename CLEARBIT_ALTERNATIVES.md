# ABM (Account-Based Marketing) - Configuración de Enriquecimiento IP

## ✅ IPinfo.io IMPLEMENTADO (Actual)

**El sistema usa IPinfo.io como proveedor principal** de enriquecimiento firmográfico por IP.

### Prioridad de Proveedores:
1. **IPinfo.io** (si `IPINFO_API_KEY` está configurado) ⭐ **RECOMENDADO**
2. **Clearbit Reveal** (si `CLEARBIT_API_KEY` está configurado - legacy)
3. **Mock Mode** (si no hay API keys configuradas)

## 🚀 Configurar IPinfo.io (AHORA)

### 1. Obtener Token de IPinfo:
- Ya tienes cuenta → Ve a https://ipinfo.io/account/token
- Copia tu token de acceso

### 2. Configurar en Backend:
```bash
# backend/.env
IPINFO_API_KEY=tu_token_aqui_xxxxxxxx
```

### 3. Reiniciar Backend:
```bash
# Detener servidor actual
pkill -f nodemon

# Reiniciar
cd backend && npm run dev
```

### 4. Verificar:
- Carga SITE o WWW en el navegador
- Abre la consola del navegador
- Deberías ver: `[ABM] Using IPinfo.io` y `[ABM] Company identified via IPinfo: Tu Empresa`

## 📊 Datos de IPinfo vs Clearbit

| Campo | IPinfo.io | Clearbit | Mock |
|-------|-----------|----------|------|
| **Company Name** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Company Domain** | ✅ Sí (hostname) | ✅ Sí | ✅ Sí |
| **Location** | ✅ Sí (city, region, country) | ✅ Sí | ✅ Sí |
| **Industry** | ⚠️ Limitado | ✅ Detallado | ✅ Sí |
| **Employee Count** | ❌ No | ✅ Sí | ✅ Sí |
| **Revenue** | ❌ No | ✅ Sí | ✅ Sí |
| **Tech Stack** | ❌ No | ✅ Sí | ✅ Sí |
| **Requests/mes (Free)** | 50,000 | ~100 | Ilimitado |
| **Facilidad Registro** | ✅ Fácil | ❌ Difícil | N/A |

### Datos Mock:
```json
{
  "companyDomain": "example-company.com",
  "companyName": "Example Company Inc.",
  "industry": "Technology",
  "sector": "Software",
  "employees": 250,
  "employeesRange": "100-500",
  "estimatedAnnualRevenue": "$25M-$50M",
  "tags": ["SaaS", "B2B", "Enterprise"],
  "techCategories": ["React", "Node.js", "AWS"],
  "location": "San Francisco, CA"
}
```

## 🔄 Alternativas a Clearbit

### 1. IPinfo.io (Recomendado)

**Ventajas:**
- ✅ Plan gratuito: 50,000 requests/mes
- ✅ Registro simple sin validación enterprise
- ✅ API estable y documentada
- ✅ Datos de empresa (limitados pero útiles)

**Implementación:**
```javascript
// Endpoint: https://ipinfo.io/{ip}?token={YOUR_TOKEN}
// Respuesta incluye: org, asn, company info
```

**Registro:**
1. https://ipinfo.io/signup
2. Obtener token
3. Agregar a `.env`: `IPINFO_API_KEY=xxx`

---

### 2. Abstract API - IP Geolocation

**Ventajas:**
- ✅ 20,000 requests/mes gratis
- ✅ Company enrichment básico
- ✅ Fácil de integrar

**Endpoint:**
```
https://ipgeolocation.abstractapi.com/v1/?api_key={key}&ip_address={ip}
```

**Registro:**
https://www.abstractapi.com/ip-geolocation-api

---

### 3. IPStack (Apilayer)

**Ventajas:**
- ✅ 100 requests/mes gratis
- ✅ Datos de empresa limitados
- ✅ Muy simple

**Registro:**
https://ipstack.com/signup/free

---

### 4. MaxMind GeoIP2 (Self-hosted)

**Ventajas:**
- ✅ Base de datos local (no API calls)
- ✅ Sin límites de requests
- ✅ Incluye datos de ISP/Organization

**Desventajas:**
- ❌ Requiere actualizar DB mensualmente
- ❌ Menos detalle que Clearbit

---

## 🚀 Cómo Implementar una Alternativa

### Opción A: IPinfo.io (Ejemplo)

1. **Obtener API key:**
   ```bash
   # Registrarse en ipinfo.io
   # Copiar token
   ```

2. **Agregar a `.env`:**
   ```bash
   # backend/.env
   IPINFO_API_KEY=your_token_here
   ```

3. **Actualizar endpoint** (reemplazar lógica Clearbit):
   ```javascript
   // backend/server.js
   const response = await axios.get(
     `https://ipinfo.io/${ip}?token=${process.env.IPINFO_API_KEY}`
   );
   
   const data = response.data;
   const firmo = {
     companyDomain: data.hostname,
     companyName: data.org || data.company?.name,
     location: `${data.city}, ${data.region}, ${data.country}`,
     // ... adaptar campos
   };
   ```

---

## 📝 Recomendación

### Para Desarrollo:
- ✅ **Usar modo MOCK** (ya configurado)
- ✅ Prueba la integración PostHog con datos simulados
- ✅ No requiere API key externa

### Para Producción B2B:
1. **Intentar Clearbit** (mejor calidad, más caro)
2. **Usar IPinfo.io** (buen balance precio/calidad)
3. **Combinar múltiples fuentes** (IPinfo + Abstract)

### Para Producción B2C:
- Probablemente no necesites ABM
- Usa solo PostHog analytics sin enrichment

---

## 🔧 Desactivar ABM Completamente

Si no necesitas ABM, puedes desactivarlo:

```javascript
// apps/site/src/main.jsx
// Comentar estas líneas:
/*
enrichWithClearbit(window.__CONFIG__?.apiBaseUrl || apiOrigin).catch(err => {
  console.log('[Analytics] Clearbit enrichment skipped:', err.message);
});
*/
```

---

## 📊 Comparación de Servicios

| Servicio | Requests/mes (Free) | Company Data | Registro | Calidad |
|----------|---------------------|--------------|----------|---------|
| **Clearbit** | ~100 | ⭐⭐⭐⭐⭐ | ❌ Difícil | Excelente |
| **IPinfo.io** | 50,000 | ⭐⭐⭐ | ✅ Fácil | Buena |
| **Abstract** | 20,000 | ⭐⭐ | ✅ Fácil | Básica |
| **IPStack** | 100 | ⭐⭐ | ✅ Fácil | Básica |
| **MaxMind** | Ilimitado | ⭐⭐⭐ | ✅ Fácil | Buena |

---

## 💡 Siguiente Paso

**¿Qué prefieres?**

1. **Dejar modo MOCK** → Ya funciona, puedes probarlo ahora
2. **Implementar IPinfo.io** → Dime y lo configuro
3. **Probar otra alternativa** → ¿Cuál te interesa?
4. **Desactivar ABM** → Si no lo necesitas

Todos los cambios están listos para funcionar con o sin Clearbit.
