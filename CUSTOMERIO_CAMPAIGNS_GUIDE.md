# 📧 Customer.io Campaigns - AXSOL Viewer

**Guía completa para configurar campaigns basados en eventos de analytics**

**Stack:** PostHog → Segment → Customer.io  
**Eventos implementados:** Ver `ANALYTICS_EVENTS_CATALOG.md`

---

## 📋 Eventos Clave Implementados

✅ **Core Events:**
- `viewer_loaded` - Usuario carga el visor 3D
- `camera_moved` - Navegación y exploración
- `timeline_playback_control` - Uso del timeline
- `layer_toggled` - Activación de capas
- `feature_first_use` - Primera vez usando una feature (con `feature_name`)
- `entity_clicked` - Interacción con elementos 3D

**Nota:** El evento `photo360_viewer` se trackea como `feature_first_use` con `feature_name: 'photo360_viewer'`

---

## 🎯 Campaign 1: Welcome Series

**Objetivo:** Activar nuevos usuarios y guiarlos hacia adopción de features clave  
**Duración:** 7 días  
**Tipo:** Triggered campaign (automated)

---

### 📧 Email 1: Bienvenida (Inmediato)

**Trigger en Customer.io:**
- Event: `viewer_loaded` 
- Filter: `First time = true` (first occurrence of event for user)
- Send: Immediately (0 delay)

**Subject Line:**
- Opción A: "¡Bienvenido a AXSOL Viewer, {{first_name}}! 🚀"
- Opción B: "Tu proyecto {{project_name}} está listo para explorar"
- **A/B Test:** Subject personalizado vs genérico

**Email Body:**

```
Hola {{first_name}},

¡Bienvenido a AXSOL Viewer! 👋

Estamos emocionados de que hayas abierto tu primer proyecto. 
AXSOL Viewer es la forma más poderosa de visualizar y analizar 
el progreso de tus obras en tiempo real.

🎯 PRIMEROS PASOS:

1. Navega en 3D → Haz clic y arrastra para explorar
2. Activa capas → Cambia entre realidad 3D, fotos y planos
3. Viaja en el tiempo → Usa el timeline para ver el progreso

[CTA PRINCIPAL]
→ Abrir mi proyecto ahora
{{project_viewer_url}}

---

💡 CONSEJO RÁPIDO:
Presiona el botón 🏠 (Home) en cualquier momento para volver 
a la vista inicial de tu proyecto.

¿Necesitas ayuda? Responde este email y te asistiremos.

Saludos,
El equipo de AXSOL

---
P.D. En 2 días te enviaremos tips para aprovechar al máximo 
las features más poderosas. ¡Estate atento! 📬
```

**Configuración técnica:**
- Template: Welcome email template
- Personalización: `{{first_name}}`, `{{project_name}}`, `{{project_viewer_url}}`
- Tracking: Click en CTA, open rate
- Success metric: >40% click-through rate

---

### 📧 Email 2: Features Principales (Día 2)

**Trigger en Customer.io:**
- Event: `Email 1 sent` 
- Delay: +2 days (48 hours)
- Additional filter: `viewer_loaded` count >= 1 (asegurar que usó al menos 1 vez)

**Subject Line:**
- Opción A: "3 features que transformarán tu workflow ⚡"
- Opción B: "{{first_name}}, descubre estas 3 herramientas poderosas"
- **A/B Test:** Número específico (3) vs vago

**Email Body:**

```
Hola {{first_name}},

Ya exploraste tu proyecto en AXSOL Viewer. Ahora te mostramos 
3 features que harán tu trabajo mucho más eficiente:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 1. TIMELINE - VE EL PROGRESO COMO UN VIDEO

Reproduce la construcción de tu obra como una película. 
Perfecto para:
- Detectar retrasos visualmente
- Crear videos de avance para clientes
- Analizar velocidad de construcción

[Ver tutorial →]
{{help_url}}/timeline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 2. FOTOS 360° - INMERSIÓN TOTAL

Entra dentro de tu obra como si estuvieras ahí.
Perfecto para:
- Inspecciones remotas detalladas
- Mostrar avance a stakeholders
- Detectar problemas de calidad

[Explorar en 360° →]
{{project_viewer_url}}?layer=photo360

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️ 3. CAPAS - COMPARA PLANIFICADO VS REAL

Superpone planos, modelos BIM y realidad 3D.
Perfecto para:
- Detectar desviaciones del diseño
- Control de calidad
- Coordinación de equipos

[Activar capas →]
{{project_viewer_url}}?panel=layers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CTA PRINCIPAL]
→ Explorar estas features ahora
{{project_viewer_url}}

---

💡 TIP PRO:
Todas estas features funcionan juntas. Activa fotos 360°, 
luego usa el timeline para ver cómo evolucionó tu proyecto 
en vista inmersiva.

¿Tienes preguntas? Responde este email.

Saludos,
El equipo de AXSOL
```

**Configuración técnica:**
- Template: Feature showcase template (3 columnas o cards)
- Personalización: `{{first_name}}`, `{{project_viewer_url}}`, `{{help_url}}`
- Deep links: URLs con parámetros para auto-activar features
- Tracking: Click por feature (3 CTAs separados)
- Success metric: >15% click en al menos 1 feature

---

### 📧 Email 3: Tips Avanzados (Día 7)

**Trigger en Customer.io:**
- Event: `feature_first_use`
- Filter: `feature_name` IN ('photo360_viewer', 'timeline', 'layer_toggled')
- Delay: 7 days after first `viewer_loaded`
- Condition: Al menos 1 feature avanzada usada

**Subject Line:**
- Opción A: "{{first_name}}, estás dominando AXSOL 🎓"
- Opción B: "Los shortcuts que usan los expertos (y tú también puedes)"
- **A/B Test:** Elogio vs curiosidad

**Email Body:**

```
Hola {{first_name}},

¡Felicitaciones! 🎉

Hemos notado que estás usando {{features_used_list}} en AXSOL Viewer.
Eso te pone en el top 20% de usuarios más activos.

Ahora te compartimos los trucos que usan los expertos:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ SHORTCUTS DE TECLADO

🏠 H → Volver a vista inicial (Home)
⏯️ Espacio → Play/Pause timeline
🔍 + / - → Zoom in/out
🎯 Doble click → Enfocar objeto

[Ver lista completa de shortcuts →]
{{help_url}}/shortcuts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DASHBOARD DE KPIs

¿Sabías que puedes ver métricas de tu proyecto?
- Progreso por área
- Comparativa de fechas
- Estadísticas de avance

[Abrir mi dashboard →]
{{project_dashboard_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 COMPARTIR CON TU EQUIPO

Genera links para que otros vean tu proyecto:
- Sin necesidad de login
- Vista específica guardada
- Fecha y capa pre-seleccionada

[Crear link para compartir →]
{{project_viewer_url}}?action=share

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CTA PRINCIPAL]
→ Convertirme en experto de AXSOL
{{help_center_url}}

---

💡 BONUS:
Próximamente: Modo comparación lado a lado, mediciones 
avanzadas y asistente IA. ¿Qué feature te gustaría ver?

[Déjanos tu feedback →]
{{feedback_form_url}}

Saludos,
El equipo de AXSOL

---
P.D. Responde "TIPS" para recibir 1 tip semanal de AXSOL.
```

**Configuración técnica:**
- Template: Advanced tips template
- Personalización dinámica: 
  - `{{features_used_list}}` → "Timeline y Fotos 360°" (generado desde eventos)
  - `{{project_dashboard_url}}`
  - `{{help_center_url}}`
  - `{{feedback_form_url}}`
- Tracking: Click por sección (3 CTAs)
- Success metric: >20% engagement, >5% feedback submissions

---

### 📊 Métricas de Éxito - Welcome Series

| Email | Target Open Rate | Target CTR | Conversión a Acción |
|-------|------------------|------------|---------------------|
| Email 1 | >45% | >40% | >50% regresan al viewer |
| Email 2 | >35% | >15% | >10% usan nueva feature |
| Email 3 | >30% | >20% | >5% dan feedback |

**KPIs globales del Welcome Series:**
- ✅ >70% completan onboarding (usan 2+ features)
- ✅ >40% se convierten en usuarios activos semanales
- ✅ <10% tasa de unsubscribe

---

### ⚙️ Configuración en Customer.io

#### **Paso 1: Crear el Campaign**
1. Campaigns → Create Campaign → Triggered
2. Nombre: "Welcome Series - New Users"
3. Trigger event: `viewer_loaded` (first time)

#### **Paso 2: Workflow**
```
[ENTRY] viewer_loaded (first time)
    ↓
[EMAIL 1] Bienvenida (immediate)
    ↓
[WAIT] 2 days
    ↓
[BRANCH] Has viewer_loaded >= 1?
    ├─ YES → [EMAIL 2] Features (send)
    └─ NO → [WAIT] 1 day → [EMAIL 2] Features
    ↓
[WAIT] 5 days
    ↓
[BRANCH] feature_first_use exists?
    ├─ YES → [EMAIL 3] Tips Avanzados
    └─ NO → [SKIP] (send Email 3 solo a usuarios activos)
    ↓
[EXIT]
```

#### **Paso 3: Segments a crear**
- `new_users_welcome_series` → Currently in welcome workflow
- `welcome_series_completed` → Received all 3 emails
- `welcome_series_engaged` → Clicked at least 1 email

#### **Paso 4: A/B Testing**
- Test: Subject lines (2 variantes por email)
- Split: 50/50
- Winning criteria: Highest click-through rate
- Duration: 7 days, luego auto-select winner

---

## 🎯 Campaign 2: Feature Discovery

**Objetivo:** Maximizar adopción de features infrautilizadas  
**Tipo:** Triggered campaigns (individuales, no secuenciales)  
**Timing:** Después de detectar patrón de uso sin feature específica

---

### 📧 Campaign 2A: Timeline Not Used

**Trigger en Customer.io:**
- Event count: `viewer_loaded` >= 5
- Event absence: `timeline_playback_control` does NOT exist
- User age: Account created >= 7 days ago
- Send: When conditions met

**Subject Line:**
- Opción A: "{{first_name}}, estás perdiendo esta feature increíble 🎬"
- Opción B: "Ve tu proyecto como una película (en 1 click)"
- **A/B Test:** FOMO vs beneficio directo

**Email Body:**

```
Hola {{first_name}},

Hemos notado que has visitado tu proyecto {{viewer_count}} veces.
¡Genial! Pero hay algo que quizás no has descubierto...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 EL TIMELINE - TU OBRA EN MODO PELÍCULA

Imagina esto:
Presionas ▶️ Play y ves tu construcción avanzar como un timelapse.

✅ Perfecto para:
- Presentaciones a clientes (WOW factor garantizado)
- Detectar retrasos visualmente en segundos
- Crear videos de progreso sin edición

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 CÓMO USARLO:

1. Abre tu proyecto
2. Busca el botón ⏯️ en la parte inferior
3. Presiona Play
4. Ajusta la velocidad a tu gusto

[CTA PRINCIPAL]
→ Probar el Timeline ahora
{{project_viewer_url}}?feature=timeline&autoplay=true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Video Tutorial GIF]
[Muestra timeline en acción]

Saludos,
El equipo de AXSOL

---
P.D. El 89% de usuarios que prueban el Timeline lo usan 
semanalmente. Es ADICTIVO. 🎯
```

**Configuración técnica:**
- Segment: `active_users_no_timeline`
- Deep link: `?feature=timeline&autoplay=true` (auto-activar timeline)
- Success metric: >25% usan timeline después del email
- Exit condition: User triggers `timeline_playback_control` event

---

### 📧 Campaign 2B: 360 Photos Not Used

**Trigger en Customer.io:**
- Event count: `viewer_loaded` >= 3
- Event absence: `feature_first_use` WHERE `feature_name` = 'photo360_viewer'
- Project has: 360 photos available (check property)
- Send: When conditions met

**Subject Line:**
- Opción A: "¿Entramos en tu obra? Vista 360° disponible 👀"
- Opción B: "{{first_name}}, activa el modo inmersivo"
- **A/B Test:** Pregunta vs comando

**Email Body:**

```
Hola {{first_name}},

Tu proyecto tiene {{photo360_count}} fotos 360° esperando.
¿Las has visto? Es como ESTAR DENTRO de tu obra.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 FOTOS 360° - INSPECCIÓN INMERSIVA

✅ Beneficios:
- Inspecciones remotas ultra-detalladas
- Detecta problemas desde tu oficina
- Muestra cada rincón a stakeholders
- Reduce visitas a obra en 70%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 CÓMO ACTIVAR:

1. Panel de Capas (lado derecho)
2. Activa "Fotos 360°"
3. Click en cualquier marcador azul 🔵
4. Arrastra para mirar alrededor

[CTA PRINCIPAL]
→ Ver mi primera foto 360°
{{project_viewer_url}}?layer=photo360&open=first

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TIP PRO:
Combina fotos 360° + Timeline para ver cómo evolucionó
cada zona de tu obra. Es increíble.

Saludos,
El equipo de AXSOL
```

**Configuración técnica:**
- Segment: `active_users_no_360_photos`
- Condition: `{{photo360_count}} > 0` (solo si proyecto tiene 360s)
- Deep link: `?layer=photo360&open=first`
- Success metric: >30% abren primera foto 360° después del email

---

### 📧 Campaign 2C: Layers Not Used

**Trigger en Customer.io:**
- Event count: `viewer_loaded` >= 3
- Event absence: `layer_toggled` does NOT exist
- User age: Account created >= 3 days ago
- Send: When conditions met

**Subject Line:**
- Opción A: "Estás viendo solo el 20% de tu proyecto 🗺️"
- Opción B: "{{first_name}}, desbloquea todas las capas"
- **A/B Test:** Estadística impactante vs personalización

**Email Body:**

```
Hola {{first_name}},

Pregunta rápida: ¿Has explorado el Panel de Capas?

La mayoría de usuarios no lo hacen al principio.
Pero cuando lo descubren... 🤯

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️ CAPAS - TU PROYECTO EN MODO RAYOS X

Tu proyecto tiene múltiples capas:
✅ Realidad 3D (nube de puntos)
✅ Fotos aéreas y terrestres
✅ Fotos 360° inmersivas
✅ Planos de actividades
✅ Modelos BIM/IFC

Todas superpuestas. Todas comparables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 CASOS DE USO:

🔍 Control de Calidad
Activa "Plan" + "Realidad 3D" → Ve desviaciones

📅 Progreso vs Planificado
Compara fecha actual vs fecha planificada

🏗️ BIM vs Real
Superpone modelo BIM con construcción real

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CTA PRINCIPAL]
→ Abrir Panel de Capas ahora
{{project_viewer_url}}?panel=layers&highlight=true

---

🎯 TIP PRO:
Puedes activar/desactivar capas con un click.
Prueba diferentes combinaciones.

Saludos,
El equipo de AXSOL
```

**Configuración técnica:**
- Segment: `active_users_no_layers`
- Deep link: `?panel=layers&highlight=true` (abrir panel destacado)
- Success metric: >20% toggle al menos 1 capa después del email

---

### 📊 Métricas de Éxito - Feature Discovery

| Campaign | Target Open | Target CTR | Feature Adoption |
|----------|-------------|------------|------------------|
| Timeline | >30% | >25% | >15% usan timeline |
| 360 Photos | >35% | >30% | >20% abren 360° |
| Layers | >28% | >20% | >12% toggle capas |

**Exit Conditions:**
- ✅ Usuario usa la feature → Salir del campaign
- ✅ Usuario hace unsubscribe → Salir y no enviar más
- ⏰ Después de 1 envío → No re-enviar (evitar spam)

---

## 🎯 Campaign 3: Re-engagement

**Objetivo:** Reactivar usuarios inactivos y prevenir churn  
**Tipo:** Scheduled campaigns basados en inactividad  
**Segmento:** Usuarios que fueron activos pero dejaron de usar

---

### 📧 Campaign 3A: 7 Días Inactivo (At-Risk)

**Trigger en Customer.io:**
- Last event: `viewer_loaded` was 7 days ago
- Previous activity: `viewer_loaded` count >= 3 (fue usuario activo)
- Not in: Welcome Series (evitar overlap)
- Send: Daily check, send when condition met

**Subject Line:**
- Opción A: "{{first_name}}, te extrañamos en {{project_name}} 👋"
- Opción B: "Tu proyecto tiene {{updates_count}} actualizaciones nuevas"
- **A/B Test:** Emocional vs factual

**Email Body:**

```
Hola {{first_name}},

Hace una semana que no vemos actividad en tu proyecto.
¿Todo bien? 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 ACTUALIZACIONES RECIENTES:

{{#if new_captures}}
📸 {{new_captures_count}} nuevas capturas agregadas
Última: {{last_capture_date}}
{{/if}}

{{#if project_progress}}
📊 Avance del proyecto: {{progress_percentage}}%
(+{{progress_change}}% desde tu última visita)
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 ¿QUÉ HAY DE NUEVO EN AXSOL?

✨ Mejoras recientes:
- Timeline más fluido (velocidad ajustable)
- Nuevas opciones en fotos 360°
- Exportación de vistas mejorada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CTA PRINCIPAL]
→ Ver qué cambió en mi proyecto
{{project_viewer_url}}?highlight=new

---

¿Tienes problemas técnicos? ¿Algo no funciona?
Responde este email y te ayudamos inmediatamente.

Saludos,
El equipo de AXSOL

---
P.D. Si prefieres recibir menos emails, puedes ajustar 
tus preferencias aquí: {{email_preferences_url}}
```

**Configuración técnica:**
- Segment: `at_risk_users` (active pero 7 días sin uso)
- Personalización dinámica:
  - `{{new_captures_count}}` → Desde última visita
  - `{{progress_percentage}}` → Del proyecto
  - `{{updates_count}}` → Cambios en proyecto
- Success metric: >15% regresan al viewer en 48h
- Exit: Usuario vuelve a usar `viewer_loaded`

---

### 📧 Campaign 3B: 30 Días Inactivo (Dormant)

**Trigger en Customer.io:**
- Last event: `viewer_loaded` was 30 days ago
- Previous activity: `viewer_loaded` count >= 5 (fue usuario muy activo)
- Not received: Campaign 3A (o no respondió)
- Send: Weekly check, send when condition met

**Subject Line:**
- Opción A: "Te perdimos, {{first_name}}... ¿Volvemos? 🚀"
- Opción B: "Las 3 features nuevas que no viste (son increíbles)"
- **A/B Test:** Nostalgia vs novedad

**Email Body:**

```
Hola {{first_name}},

Han pasado 30 días desde que exploraste {{project_name}}.
Sabemos que estás ocupado, pero AXSOL ha evolucionado mucho.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 NOVEDADES QUE TE PERDISTE:

1️⃣ NUEVO: Comparación Lado a Lado
Compara 2 fechas simultáneamente en pantalla dividida

2️⃣ NUEVO: Mediciones Avanzadas
Mide distancias, áreas y volúmenes directamente en 3D

3️⃣ NUEVO: Asistente IA
Pregunta cualquier cosa sobre tu proyecto (beta)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TU PROYECTO HA CRECIDO:

Desde tu última visita:
- {{new_captures_count}} nuevas capturas
- {{days_progress}} días de progreso registrado
- {{new_features_count}} nuevas features disponibles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CTA PRINCIPAL]
→ Reconectar con mi proyecto
{{project_viewer_url}}?welcome_back=true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 ¿POR QUÉ DEJASTE DE USAR AXSOL?

Nos encantaría saber tu opinión:
- ¿No encontraste lo que buscabas?
- ¿Algo no funcionó bien?
- ¿El proyecto terminó?

[Responde esta encuesta rápida (2 min) →]
{{feedback_survey_url}}

Como agradecimiento, entrarás en sorteo de 
1 mes GRATIS de plan Premium. 🎁

---

Si definitivamente no quieres recibir más emails,
entendemos: {{unsubscribe_url}}

Saludos,
El equipo de AXSOL

---
P.D. Si vuelves en las próximas 48h, te daremos 
acceso anticipado a nuestras nuevas features. ⚡
```

**Configuración técnica:**
- Segment: `dormant_users` (30+ días sin uso)
- Personalización dinámica:
  - `{{new_captures_count}}` → Capturas desde última visita
  - `{{days_progress}}` → Días transcurridos
  - `{{new_features_count}}` → Features lanzadas desde última visita
- Include: Link a feedback survey
- Incentivo: Early access o descuento
- Success metric: >8% regresan al viewer, >15% responden survey
- Exit: Usuario vuelve a usar o completa unsubscribe

---

### 📧 Campaign 3C: 60 Días Inactivo (Last Chance)

**Trigger en Customer.io:**
- Last event: `viewer_loaded` was 60 days ago
- Not responded: Campaigns 3A y 3B
- Send: One-time send

**Subject Line:**
- "¿Nos despedimos? (última oportunidad)"
- **Tono:** Sincero y directo

**Email Body:**

```
Hola {{first_name}},

Llevamos 60 días sin verte en AXSOL Viewer.

Este será nuestro último email (lo prometemos).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opción 1: VOLVER
Si quieres darle otra oportunidad a AXSOL:

[→ Reactivar mi cuenta]
{{project_viewer_url}}?reactivate=true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opción 2: PAUSAR EMAILS
Si prefieres no recibir emails pero mantener la cuenta:

[→ Pausar notificaciones]
{{pause_emails_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opción 3: CANCELAR
Si definitivamente AXSOL no es para ti:

[→ Cancelar mi cuenta]
{{cancel_account_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 ¿QUÉ SALIÓ MAL?

Ayúdanos a mejorar (solo 1 min):
[→ Feedback rápido]
{{exit_survey_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gracias por probar AXSOL.
Te deseamos el mayor éxito en tus proyectos.

Saludos,
{{sender_name}}
CEO, AXSOL

---
P.D. Si no tomas acción, pausaremos automáticamente
los emails en 7 días. Tu cuenta seguirá activa.
```

**Configuración técnica:**
- Segment: `inactive_60_days`
- Send: One-time only
- CTAs: 3 opciones claras (Volver, Pausar, Cancelar)
- Exit survey: Crítico para product feedback
- Auto-action: Si no responde en 7 días → Pausar emails automáticamente

---

### 📊 Métricas de Éxito - Re-engagement

| Campaign | Send to Segment | Target Response | Reactivation Rate |
|----------|----------------|-----------------|-------------------|
| 7 días | At-Risk (active) | >15% | >10% regresan |
| 30 días | Dormant | >10% | >8% regresan |
| 60 días | Inactive | >5% | >3% regresan o dan feedback |

**KPIs globales:**
- ✅ Win-back rate: >12% overall
- ✅ Survey completion: >20% de quienes responden
- ✅ Prevent churn: Identificar razones principales de abandono
- ✅ Clean list: Auto-pausar emails a usuarios completamente inactivos

---

### ⚙️ Configuración en Customer.io - Re-engagement

#### **Flujo de Campaigns:**
```
[MONITOR] viewer_loaded events
    ↓
[7 DÍAS SIN USO] → Send Campaign 3A
    ├─ Responde → [EXIT]
    └─ No responde → [CONTINUAR]
    ↓
[30 DÍAS SIN USO] → Send Campaign 3B + Survey
    ├─ Responde → [EXIT]
    └─ No responde → [CONTINUAR]
    ↓
[60 DÍAS SIN USO] → Send Campaign 3C (Last Chance)
    ├─ Reactivate → [EXIT + Tag: won_back]
    ├─ Pause emails → [EXIT + Suppress emails]
    └─ Cancel → [EXIT + Tag: churned]
```

#### **Suppression Rules:**
- ✅ Exclude: Users in Welcome Series
- ✅ Exclude: Users who used viewer in last 7 days
- ✅ Frequency cap: Max 1 re-engagement email per 7 days

---

## 📋 Setup en Customer.io

### **1. Conectar PostHog → Segment → Customer.io**

1. PostHog: Settings → Integrations → Segment
   - Agregar Segment Write Key
   - Habilitar "Send events to Segment"

2. Segment: Sources → PostHog
   - Conectar Customer.io como Destination
   - Mapear eventos y propiedades

3. Customer.io: Data → Sources → Segment
   - Verificar que eventos lleguen correctamente

---

### **2. Crear Segments**

#### **New Users**
- **Condición:** `viewer_loaded` first time < 7 days ago
- **Uso:** Welcome Series

#### **Active Users**
- **Condición:** `viewer_loaded` within last 7 days
- **Uso:** Feature announcements, upselling

#### **Power Users**
- **Condición:** 
  - `viewer_loaded` > 20 times total
  - `camera_moved` > 50 times total
  - `feature_first_use` count >= 3
- **Uso:** Beta features, testimonials, referrals

#### **At-Risk Users**
- **Condición:** 
  - Last `viewer_loaded` between 7-30 days ago
  - Previously active (>5 sessions)
- **Uso:** Re-engagement campaigns

#### **Inactive Users**
- **Condición:** Last `viewer_loaded` > 30 days ago
- **Uso:** Win-back campaigns

#### **Feature-Specific Segments**

**Timeline Users:**
- `timeline_playback_control` EXISTS

**360 Viewers:**
- `feature_first_use` WHERE `feature_name` = 'photo360_viewer'

**Layer Explorers:**
- `layer_toggled` count >= 5

---

### **3. Configurar Campaigns**

#### **Campaign Type: Triggered**
- Welcome Series → Trigger on `viewer_loaded` (first time)
- Feature Discovery → Trigger on specific event absence
- Feature Adoption → Trigger on `feature_first_use`

#### **Campaign Type: Scheduled**
- Weekly digest → Send every Monday
- Monthly summary → Send first day of month

#### **Campaign Type: Behavioral**
- Re-engagement → Based on inactivity
- Upsell → Based on usage patterns

---

### **4. Tracking & Optimization**

**Métricas clave:**
- ✉️ **Email open rate** → Target: >25%
- 🖱️ **Click-through rate** → Target: >5%
- ✅ **Conversion to action** → Feature usage after email
- 🔄 **Re-activation rate** → Users returning after re-engagement

**A/B Testing:**
- Subject lines
- Send time (morning vs evening)
- CTA placement
- Email length (short vs detailed)

**Optimización:**
1. Revisar PostHog Feature Adoption Matrix semanal
2. Identificar features con baja adopción
3. Crear campaigns específicos
4. Medir impacto en PostHog dashboards

---

## 🎯 Próximos Pasos

- [ ] Conectar PostHog → Segment → Customer.io
- [ ] Crear los 5 segments principales
- [ ] Configurar Welcome Series (3 emails)
- [ ] Configurar Feature Discovery (3 campaigns)
- [ ] Configurar Re-engagement (2 campaigns)
- [ ] Diseñar templates de emails
- [ ] Testing en ambiente staging
- [ ] Launch gradual (10% → 50% → 100%)

---

**📊 Ver también:**
- `POSTHOG_DASHBOARDS_GUIDE.md` → Identificar features a promocionar
- `ANALYTICS_EVENTS_CATALOG.md` → Lista completa de eventos
