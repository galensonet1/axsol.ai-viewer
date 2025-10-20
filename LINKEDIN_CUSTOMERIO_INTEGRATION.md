# LinkedIn + Customer.io - Integración de Reverse Webhooks

## 🎯 Objetivo

Orquestar **LinkedIn outreach** con **nurturing automatizado** en Customer.io mediante webhooks bidireccionales.

### Flujo Completo:
```
LinkedIn Automation Tool (Expandi/LaGrowthMachine)
    ↓ Webhook
Backend (/api/webhooks/linkedin)
    ↓ Trigger Event
Customer.io Campaign
    ↓ Email/In-App Message
Prospect Nurturing
```

---

## 🔧 Componentes Implementados

### **1. Backend Webhook Endpoints**

#### **LinkedIn Webhook** (`POST /api/webhooks/linkedin`)

Recibe eventos de herramientas de automatización de LinkedIn.

**Eventos Soportados:**
```javascript
{
  "event": "connection_accepted",
  "data": {
    "linkedin_profile": "https://linkedin.com/in/johndoe",
    "name": "John Doe",
    "company": "ACME Corp",
    "title": "CEO",
    "email": "john@acme.com"  // Si está disponible
  }
}
```

```javascript
{
  "event": "message_replied",
  "data": {
    "linkedin_profile": "https://linkedin.com/in/johndoe",
    "message": "Hi! I'm interested in your product",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

```javascript
{
  "event": "profile_visited",
  "data": {
    "visitor_profile": "https://linkedin.com/in/janedoe",
    "visitor_name": "Jane Doe",
    "timestamp": "2025-01-15T09:15:00Z"
  }
}
```

#### **Customer.io Webhook** (`POST /api/webhooks/customerio`)

Recibe eventos de Customer.io (reverse webhooks).

**Eventos Soportados:**
- `email_opened`
- `email_clicked`
- `in_app_message_clicked`
- `email_bounced`
- `email_unsubscribed`

---

## 🚀 Setup: Herramientas de LinkedIn Automation

### **Opción 1: Expandi (Recomendado)**

#### **Características:**
- ✅ LinkedIn automation cloud-based
- ✅ Webhooks nativos
- ✅ Smart inbox
- ✅ ~$99/mes

#### **Configuración:**

1. **Crear cuenta en Expandi:**
   - https://expandi.io/signup

2. **Configurar Webhook:**
   - Settings → Webhooks → Add Webhook
   - **URL:** `https://tu-backend.com/api/webhooks/linkedin`
   - **Secret:** Genera un token seguro y guárdalo en `backend/.env`

3. **Eventos a Enviar:**
   - ✅ Connection Accepted
   - ✅ Message Replied
   - ✅ Profile Viewed (opcional)

4. **Payload Format:**
   ```json
   {
     "event": "{{event_type}}",
     "data": {
       "linkedin_profile": "{{profile_url}}",
       "name": "{{first_name}} {{last_name}}",
       "company": "{{company}}",
       "title": "{{job_title}}",
       "message": "{{message_text}}"
     }
   }
   ```

---

### **Opción 2: LaGrowthMachine**

#### **Características:**
- ✅ Multi-channel (LinkedIn + Email + Twitter)
- ✅ Webhooks via Zapier/Make
- ✅ ~$80/mes

#### **Configuración:**

1. **Crear cuenta:**
   - https://www.lagrowthmachine.com

2. **Conectar con Zapier:**
   - LaGrowthMachine → Zapier → Webhook

3. **Zap Configuration:**
   ```
   Trigger: LaGrowthMachine - New Connection Accepted
   Action: Webhooks by Zapier - POST
   URL: https://tu-backend.com/api/webhooks/linkedin
   Payload: {
     "event": "connection_accepted",
     "data": {
       "linkedin_profile": "{{LinkedInURL}}",
       "name": "{{FirstName}} {{LastName}}",
       "company": "{{Company}}"
     }
   }
   ```

---

### **Opción 3: Phantombuster + Make.com (Más Complejo)**

Para máxima customización pero requiere más setup técnico.

---

## 🔐 Seguridad del Webhook

### **Backend** (`backend/.env`):
```bash
LINKEDIN_WEBHOOK_SECRET=tu_secreto_super_seguro_aqui_123abc
```

### **Validación de Firma (Opcional pero Recomendado):**

```javascript
// backend/server.js - Ya preparado para validación
const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET;
if (webhookSecret) {
  const signature = req.headers['x-webhook-signature'];
  
  // Validar firma HMAC
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
}
```

---

## 📊 Integración con Customer.io

### **Flujo 1: Connection Accepted → Email de Bienvenida**

#### **Cuando LinkedIn acepta conexión:**

1. **Expandi/LaGrowthMachine** envía webhook a `/api/webhooks/linkedin`
2. **Backend** procesa evento `connection_accepted`
3. **Backend** llama a **Customer.io API** para crear/actualizar persona
4. **Customer.io** dispara campaign "LinkedIn Connection Welcome"

#### **Implementación en Backend:**

```javascript
// backend/server.js - Actualizar el switch case

case 'connection_accepted':
  console.log('[LINKEDIN] Connection accepted:', data.linkedin_profile);
  
  // Call Customer.io API to trigger campaign
  await fetch('https://track.customer.io/api/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(CUSTOMERIO_SITE_ID + ':' + CUSTOMERIO_API_KEY).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: data.email || data.linkedin_profile,  // Unique identifier
      email: data.email,
      name: data.name,
      company: data.company,
      linkedin_profile: data.linkedin_profile,
      linkedin_connected_at: new Date().toISOString()
    })
  });
  
  // Trigger event
  await fetch(`https://track.customer.io/api/v1/customers/${data.email}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(CUSTOMERIO_SITE_ID + ':' + CUSTOMERIO_API_KEY).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'linkedin_connection_accepted',
      data: {
        linkedin_profile: data.linkedin_profile,
        company: data.company
      }
    })
  });
  break;
```

#### **Customer.io Campaign:**

1. **Trigger:** Event `linkedin_connection_accepted`
2. **Action 1:** Wait 1 hour (para no parecer spam)
3. **Action 2:** Send Email
   ```
   Subject: Great connecting on LinkedIn!
   
   Hi {{customer.name}},
   
   Thanks for connecting! I noticed you work at {{customer.company}}.
   
   I thought you might find this resource helpful:
   [Download One-Pager] → Track click en Customer.io
   
   Looking forward to staying in touch!
   ```
4. **Action 3:** Wait 24 hours
5. **Action 4:** If email not opened → Send follow-up

---

### **Flujo 2: Message Replied → Create Task/Notify Sales**

#### **Cuando prospect responde en LinkedIn:**

1. **Herramienta** envía webhook `message_replied`
2. **Backend** procesa y actualiza Customer.io
3. **Customer.io** envía notificación a equipo de ventas
4. **Opcionalmente:** Crear task en CRM (HubSpot, Salesforce)

#### **Customer.io Campaign:**

1. **Trigger:** Event `linkedin_message_replied`
2. **Action:** Send Email to Sales Team
   ```
   Subject: 🔥 LinkedIn Reply from {{customer.name}}
   
   {{customer.name}} from {{customer.company}} replied on LinkedIn:
   
   "{{message}}"
   
   View profile: {{customer.linkedin_profile}}
   
   [Respond Now]
   ```

---

### **Flujo 3: Email Clicked → LinkedIn Follow-up**

#### **Reverse Webhook: Customer.io → Backend:**

1. **Customer.io** detecta click en email (e.g., descarga de one-pager)
2. **Customer.io** envía webhook a `/api/webhooks/customerio`
3. **Backend** procesa evento `email_clicked`
4. **Backend** puede disparar acción en LinkedIn tool (via API de Expandi)

#### **Configuración en Customer.io:**

1. Dashboard → Settings → Webhooks
2. **Add Webhook:**
   - **URL:** `https://tu-backend.com/api/webhooks/customerio`
   - **Events:** `email_clicked`, `in_app_message_clicked`

3. **Payload:**
   ```json
   {
     "event_type": "email_clicked",
     "data": {
       "link": "https://axsol.ai/one-pager.pdf",
       "campaign_name": "LinkedIn Welcome"
     },
     "customer": {
       "id": "user@example.com",
       "email": "user@example.com",
       "name": "John Doe",
       "linkedin_profile": "https://linkedin.com/in/johndoe"
     }
   }
   ```

#### **Backend procesa y dispara acción:**

```javascript
// backend/server.js
case 'email_clicked':
  console.log('[CUSTOMERIO] Link clicked:', data?.link);
  
  // Si es el one-pager, enviar follow-up en LinkedIn via Expandi API
  if (data?.link?.includes('one-pager')) {
    await sendLinkedInMessage(customer.linkedin_profile, 
      `Hi ${customer.name}, glad you found the one-pager useful! 
       Would love to chat more about how we can help ${customer.company}.`
    );
  }
  break;
```

---

## 🎯 Flujo Completo: Bienvenida SITE/WWW

### **Paso 1: Usuario Visita SITE**
```javascript
// apps/site/src/main.jsx - Ya implementado
customerioTrack('first_visit', {
  app: 'site',
  url: window.location.href
});
```

### **Paso 2: Campaign en Customer.io**

**Trigger:** Event `first_visit`

**Action 1: In-App Badge** (Inmediato)
```
Title: ¡Bienvenido! 👋
Message: Descarga nuestro one-pager para conocer AXSOL Viewer
CTA: [Descargar One-Pager] → Link tracked
```

**Action 2: Wait** (24 horas con condición de salida)
- Exit if: `in_app_message_clicked`

**Action 3: Email** (Solo si no clickeó badge)
```
Subject: ¿Te perdiste nuestro one-pager?

Hi there,

We noticed you visited AXSOL Viewer but didn't download our intro guide.

[Download One-Pager] → Track click

Questions? Reply to this email!
```

### **Paso 3: Si Descarga One-Pager**

**Customer.io** detecta click → **Webhook** a backend

**Backend** puede:
1. Enviar notificación a sales team
2. Disparar mensaje en LinkedIn (si tenemos su perfil)
3. Agregar a lista de "high intent leads"

---

## 📊 Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    AXSOL.ai SITE/WWW                        │
│  - first_visit event                                         │
│  - User identification                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    Customer.io                               │
│  Campaign: "Bienvenida"                                      │
│  - In-App Badge                                              │
│  - Wait 24h                                                  │
│  - Email Follow-up                                           │
└────────────────┬───────────────┬────────────────────────────┘
                 │               │
      If clicked │               │ If not clicked
                 ↓               ↓
    ┌────────────────┐    ┌────────────────┐
    │ Download       │    │ Email Sent     │
    │ One-Pager      │    │                │
    └────────┬───────┘    └────────────────┘
             │
             │ Webhook to Backend
             ↓
    ┌─────────────────────────────────────────┐
    │  Backend /api/webhooks/customerio       │
    │  - Detect high-intent lead              │
    │  - Notify sales team                    │
    │  - Trigger LinkedIn follow-up (optional)│
    └────────┬────────────────────────────────┘
             │
             ↓
    ┌─────────────────────────────────────────┐
    │  Expandi/LaGrowthMachine                │
    │  - Send personalized LinkedIn message   │
    └────────┬────────────────────────────────┘
             │
             │ When connection accepted
             ↓
    ┌─────────────────────────────────────────┐
    │  Backend /api/webhooks/linkedin         │
    │  - Process connection_accepted          │
    │  - Update Customer.io                   │
    └────────┬────────────────────────────────┘
             │
             ↓
    ┌─────────────────────────────────────────┐
    │  Customer.io Campaign: "LinkedIn Welcome"│
    │  - Wait 1 hour                           │
    │  - Send welcome email                    │
    │  - Nurture sequence                      │
    └──────────────────────────────────────────┘
```

---

## 🧪 Testing

### **Test 1: LinkedIn Webhook**

```bash
# Simular conexión aceptada en LinkedIn
curl -X POST https://tu-backend.com/api/webhooks/linkedin \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: tu_firma_hmac" \
  -d '{
    "event": "connection_accepted",
    "data": {
      "linkedin_profile": "https://linkedin.com/in/test-user",
      "name": "Test User",
      "company": "Test Corp",
      "email": "test@testcorp.com"
    }
  }'
```

**Expected Output:**
```
[LINKEDIN WEBHOOK] Received event: connection_accepted {...}
[LINKEDIN] Connection accepted: https://linkedin.com/in/test-user
```

### **Test 2: Customer.io Webhook**

```bash
# Simular click en email
curl -X POST https://tu-backend.com/api/webhooks/customerio \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "email_clicked",
    "data": {
      "link": "https://axsol.ai/one-pager.pdf"
    },
    "customer": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }'
```

---

## 📝 Variables de Entorno

### **Backend** (`backend/.env`):
```bash
# LinkedIn Automation
LINKEDIN_WEBHOOK_SECRET=your_secure_secret_here

# Customer.io API (para llamadas server-side)
CUSTOMERIO_SITE_ID=abc123
CUSTOMERIO_API_KEY=your_api_key_here
```

---

## 🔄 Próximos Pasos

### **1. Elegir Herramienta de LinkedIn Automation**
- [ ] Registrarse en Expandi o LaGrowthMachine
- [ ] Configurar campaña de outreach
- [ ] Configurar webhook a tu backend

### **2. Configurar Customer.io Webhooks**
- [ ] Dashboard → Settings → Webhooks
- [ ] Agregar endpoint de tu backend
- [ ] Seleccionar eventos: `email_clicked`, `in_app_message_clicked`

### **3. Crear Campaigns en Customer.io**
- [ ] Campaign "Bienvenida SITE" (ya documentado)
- [ ] Campaign "LinkedIn Connection Welcome"
- [ ] Campaign "LinkedIn Reply Notification" (para sales team)

### **4. Testing**
- [ ] Probar webhook de LinkedIn
- [ ] Probar webhook de Customer.io
- [ ] Verificar flujo end-to-end

### **5. Monitoreo**
- [ ] Logs del backend
- [ ] Dashboard de Customer.io (delivery, open, click rates)
- [ ] Dashboard de LinkedIn tool (acceptance, reply rates)

---

## 📊 Métricas a Trackear

### **LinkedIn Automation:**
- Connection acceptance rate
- Message reply rate
- Profile view rate

### **Customer.io:**
- Email open rate
- Email click rate (especialmente one-pager)
- In-app message engagement

### **Combinadas:**
- **LinkedIn → Email:** % de conexiones que abren emails
- **Email → LinkedIn:** % de clicks que generan LinkedIn activity
- **Overall Conversion:** % de `first_visit` a qualified lead

---

## 💡 Ideas Avanzadas

### **1. Scoring Automatizado:**
```javascript
// Backend calcula score basado en eventos
let score = 0;
if (event === 'first_visit') score += 10;
if (event === 'email_opened') score += 20;
if (event === 'one_pager_downloaded') score += 50;
if (event === 'linkedin_connection_accepted') score += 30;
if (event === 'linkedin_message_replied') score += 100;

// Si score > 100, notificar a sales immediately
```

### **2. Multi-Touch Attribution:**
Trackear todos los touchpoints:
- First touch: LinkedIn ad
- Second touch: Website visit (`first_visit`)
- Third touch: One-pager download
- Fourth touch: LinkedIn connection
- Conversion: Demo request

### **3. A/B Testing de Mensajes:**
- Variant A: "Download our one-pager"
- Variant B: "Watch 2-min demo video"
- Medir conversión en Customer.io

---

¡Tu sistema de LinkedIn + Customer.io está listo para automatizar el nurturing de leads! 🚀
