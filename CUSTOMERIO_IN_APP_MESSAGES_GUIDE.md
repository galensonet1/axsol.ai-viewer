# 📱 Customer.io In-App Messages - AXSOL Viewer

**Guía completa para configurar mensajes in-app contextuales**

**Workspace:** https://fly.customer.io/workspaces/200043/settings/actions/in_app  
**SDK Status:** ✅ Customer.io tracking script ya integrado (v2 - JavaScript SDK)

---

## 🎯 Objetivos de In-App Messages

1. **Onboarding contextual** - Guiar usuarios cuando descubren features
2. **Feature announcements** - Notificar nuevas funcionalidades
3. **Feedback prompts** - Capturar opiniones en momentos clave
4. **Gamification** - Celebrar logros y fomentar exploración
5. **Engagement** - Mantener usuarios activos con tips y actualizaciones

---

## 📋 Tipos de In-App Messages

### **1. Tooltips** 
Pequeños mensajes contextuales que apuntan a elementos específicos

### **2. Banners**
Barras horizontales no intrusivas (top o bottom)

### **3. Modales**
Pop-ups centrados que requieren interacción

### **4. Slideouts**
Paneles laterales que deslizan desde el borde

### **5. Full-screen takeovers**
Mensajes inmersivos que cubren toda la pantalla

---

## 🎯 Campaign 1: Onboarding Tooltips

**Objetivo:** Guiar nuevos usuarios a descubrir features clave  
**Tipo:** Tooltips contextuales triggered por eventos  
**Timing:** Primeros 7 días de uso

---

### 📍 Message 1A: Welcome to Timeline

**Trigger:**
- Event: `viewer_loaded` (count = 3)
- Event absence: `timeline_playback_control` NOT exists
- User age: < 7 days
- Display: On page load after 5 seconds

**Message Type:** Tooltip (apuntando al botón Timeline ⏯️)

**Content:**
```
👋 Descubre el Timeline

¿Ves este botón? Presiónalo para reproducir 
tu proyecto como una película.

[Probar ahora]  [Después]
```

**Visual:**
- Position: Bottom-right del botón timeline
- Style: Fondo azul, flecha apuntando al botón
- Duration: Persistent hasta interacción

**CTA Actions:**
- "Probar ahora" → Auto-click timeline button
- "Después" → Dismiss (no volver a mostrar por 3 días)

**Exit Condition:** User triggers `timeline_playback_control`

---

### 📍 Message 1B: 360° Photos Available

**Trigger:**
- Event: `viewer_loaded` (count = 2)
- Event absence: `feature_first_use` WHERE `feature_name` = 'photo360_viewer'
- Project has: `photo360_count` > 0
- Display: 10 seconds after viewer loads

**Message Type:** Banner (top)

**Content:**
```
📸 Tu proyecto tiene {{photo360_count}} fotos 360° 
    → [Ver primera foto 360°]  [×]
```

**Visual:**
- Style: Fondo gradient azul-celeste
- Icon: 360° icon
- Position: Top banner, full width
- Dismissible: Sí

**CTA Actions:**
- "Ver primera foto 360°" → Open layer panel + activate photo360 + open first marker
- "×" → Dismiss (no volver a mostrar)

**Exit Condition:** User views first 360° photo

---

### 📍 Message 1C: Layer Panel Discovery

**Trigger:**
- Event: `viewer_loaded` (count = 4)
- Event absence: `layer_toggled` NOT exists
- Display: On hover over viewer (after 30 seconds)

**Message Type:** Slideout (right side)

**Content:**
```
🗺️ ¿Has explorado las Capas?

Tu proyecto tiene múltiples capas disponibles:
✓ Realidad 3D
✓ Fotos aéreas
✓ Fotos 360°
✓ Planos BIM

[Abrir Panel de Capas]  [Ya lo conozco]
```

**Visual:**
- Style: Panel lateral derecho
- Width: 320px
- Animation: Slide-in from right
- Backdrop: Semi-transparent dark overlay

**CTA Actions:**
- "Abrir Panel de Capas" → Toggle layer panel open + highlight
- "Ya lo conozco" → Dismiss permanently

**Exit Condition:** User toggles any layer

---

### 📍 Message 1D: Keyboard Shortcuts

**Trigger:**
- Event: `camera_moved` (count = 20)
- User age: >= 3 days
- Display: After 5 camera movements in single session

**Message Type:** Modal (centered)

**Content:**
```
⚡ Trabaja Más Rápido con Shortcuts

Presiona estas teclas para navegar como un pro:

🏠 H → Vista inicial (Home)
⏯️ SPACE → Play/Pause timeline
🔍 +/- → Zoom in/out
🎯 F → Enfocar selección

[Ver todos los shortcuts]  [Cerrar]
```

**Visual:**
- Style: Modal centrado, 500x400px
- Backdrop: Dark semi-transparent
- Design: Table with key + description
- Dismissible: Click outside or close button

**CTA Actions:**
- "Ver todos los shortcuts" → Open help modal with full list
- "Cerrar" → Dismiss (no volver a mostrar)

**Frequency:** Show once per user (lifetime)

---

## 🎯 Campaign 2: Feature Announcements

**Objetivo:** Notificar nuevas features a usuarios activos  
**Tipo:** Banners y modales para anuncios importantes  
**Timing:** Cuando se lanzan nuevas features

---

### 🚀 Message 2A: New Feature Launch - Banner

**Trigger:**
- Segment: Active users (last `viewer_loaded` < 7 days)
- Feature flag: `new_feature_announced` = true
- Display: On next viewer load

**Message Type:** Banner (top)

**Content:**
```
✨ NUEVO: [Feature Name] ya disponible
    [Probar ahora]  [Más info]  [×]
```

**Visual:**
- Style: Gradient background (accent color)
- Icon: Sparkle ✨
- Position: Top of viewer
- Duration: Persistent until dismissed

**CTA Actions:**
- "Probar ahora" → Navigate to feature or open tutorial
- "Más info" → Open help article
- "×" → Dismiss

---

### 🚀 Message 2B: Feature Update - Modal

**Trigger:**
- Segment: Power users (`viewer_loaded` > 20 times)
- Event: Major update deployed
- Display: First load after deployment

**Message Type:** Modal (centered)

**Content:**
```
🎉 Acabamos de Mejorar AXSOL Viewer

Novedades que te van a encantar:

✅ Timeline 2x más rápido
✅ Nuevo: Modo comparación lado a lado
✅ Mejoras en fotos 360°
✅ Exportación de vistas mejorada

[Ver todas las novedades]  [Empezar a explorar]
```

**Visual:**
- Style: Centered modal, 600x500px
- Design: Feature list with icons
- Animation: Fade in + scale
- Image: GIF or screenshot of new features

**CTA Actions:**
- "Ver todas las novedades" → Open changelog/release notes
- "Empezar a explorar" → Close and highlight new features

**Frequency:** Once per major release

---

## 🎯 Campaign 3: Engagement & Retention

**Objetivo:** Mantener usuarios activos y fomentar retorno  
**Tipo:** Celebraciones, tips y notificaciones de progreso  
**Timing:** Basado en comportamiento y logros

---

### 🎊 Message 3A: First Feature Used - Celebration

**Trigger:**
- Event: `feature_first_use` (any feature)
- Display: Immediately after event

**Message Type:** Toast notification (bottom-right)

**Content:**
```
🎉 ¡Felicitaciones!
Acabas de usar [Feature Name] por primera vez

[Continuar]
```

**Visual:**
- Style: Toast notification (bottom-right)
- Duration: 5 seconds auto-dismiss
- Animation: Slide-in + confetti effect
- Color: Success green

**CTA Actions:**
- "Continuar" → Dismiss
- Auto-dismiss after 5 seconds

**Exit Condition:** Automatically after dismiss

---

### 💡 Message 3B: Weekly Tip

**Trigger:**
- Segment: Active users (used viewer 2+ times this week)
- Frequency: Once per week (Monday 10am user timezone)
- Display: On first viewer load of the day

**Message Type:** Slideout (bottom-right)

**Content:**
```
💡 Tip de la Semana

¿Sabías que puedes...?
[Tip del día basado en uso]

[Probar este tip]  [Siguiente tip]  [×]
```

**Visual:**
- Style: Slideout panel (bottom-right corner)
- Size: 320x200px
- Animation: Slide up from bottom
- Icon: Lightbulb 💡

**CTA Actions:**
- "Probar este tip" → Execute tip action
- "Siguiente tip" → Show next tip in queue
- "×" → Dismiss

**Frequency:** Max 1 per week

---

### 🔔 Message 3C: Project Update Available

**Trigger:**
- Event: `new_capture_available` (from backend)
- User: Project owner or collaborator
- Display: Next time user opens that project

**Message Type:** Banner (top)

**Content:**
```
📸 Nuevas capturas agregadas a {{project_name}}
    Última actualización: {{last_capture_date}}
    [Ver actualizaciones]  [Después]
```

**Visual:**
- Style: Info blue background
- Icon: Camera 📸
- Position: Top banner
- Dismissible: Yes

**CTA Actions:**
- "Ver actualizaciones" → Highlight new captures in timeline
- "Después" → Dismiss for 24 hours

---

### 📊 Message 3D: Power User Milestone

**Trigger:**
- Event: `viewer_loaded` (count = 50)
- Display: Immediately on 50th load

**Message Type:** Modal (centered, celebratory)

**Content:**
```
🏆 ¡Eres un Power User de AXSOL!

Has explorado tu proyecto 50 veces.
Eso te pone en el top 10% de usuarios más activos.

Como agradecimiento, te damos acceso a:
✨ Features beta exclusivas
✨ Prioridad en soporte técnico
✨ Invitación a comunidad privada

[Reclamar beneficios]  [Tal vez después]
```

**Visual:**
- Style: Celebration modal with confetti animation
- Size: 600x500px
- Design: Trophy icon + benefits list
- Animation: Confetti + fade-in

**CTA Actions:**
- "Reclamar beneficios" → Navigate to benefits page
- "Tal vez después" → Dismiss (can re-show later)

---

## 🎯 Campaign 4: Feedback Collection

**Objetivo:** Capturar feedback en momentos estratégicos  
**Tipo:** Modales de feedback y NPS surveys  
**Timing:** Después de uso significativo

---

### 💬 Message 4A: Feature Feedback

**Trigger:**
- Event: `feature_first_use` (3 days after first use)
- Condition: User used feature 3+ times
- Display: After closing feature

**Message Type:** Slideout (bottom-right)

**Content:**
```
💬 ¿Qué opinas de [Feature Name]?

Tu opinión nos ayuda a mejorar AXSOL.

[★★★★★] Rate this feature

[Agregar comentario]  [No, gracias]
```

**Visual:**
- Style: Compact slideout panel
- Size: 350x250px
- Design: Star rating + optional text area
- Animation: Slide in from bottom-right

**CTA Actions:**
- Rating stars → Submit rating + show thank you
- "Agregar comentario" → Expand text area
- "No, gracias" → Dismiss (no volver a mostrar para esta feature)

---

### 📊 Message 4B: NPS Survey

**Trigger:**
- User age: 30 days
- Activity: `viewer_loaded` >= 10 times
- Frequency: Once per quarter
- Display: After successful session (no errors)

**Message Type:** Modal (centered)

**Content:**
```
📊 Tu opinión es importante

En una escala de 0 a 10, ¿qué tan probable es 
que recomiendes AXSOL Viewer a un colega?

[0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
Nada probable              Muy probable

[Continuar]  [Después]
```

**Visual:**
- Style: Clean modal, 500x300px
- Design: NPS scale (0-10 buttons)
- Follow-up: Show reason question based on score

**Follow-up questions:**
- Score 0-6: "¿Qué podríamos mejorar?"
- Score 7-8: "¿Qué te haría darnos un 10?"
- Score 9-10: "¿Qué es lo que más te gusta?"

**CTA Actions:**
- Select score → Show follow-up question
- "Continuar" → Submit feedback
- "Después" → Remind in 7 days

---

## ⚙️ Configuración Técnica en Customer.io

### **1. Verificar SDK Integrado**

Ya tienes el SDK instalado vía `@ingeia/analytics`:
```javascript
// En main.jsx
import { customerioInit } from '@ingeia/analytics';
await customerioInit(customerioSiteId, region);
```

✅ Status: **SDK ya integrado y funcional**

---

### **2. Habilitar In-App Messages**

1. **Customer.io Dashboard** → Settings → In-App Messaging
2. **Enable:** In-App Messages
3. **Configure:**
   - Trigger rules
   - Message templates
   - Frequency caps
   - Suppression rules

---

### **3. Crear Mensajes en Customer.io**

Para cada mensaje definido arriba:

#### **Paso 1: Create Message**
1. Go to: Messages → Create → In-App
2. Message type: Banner / Modal / Tooltip / Slideout
3. Name: Descriptivo (ej: "Onboarding - Timeline Discovery")

#### **Paso 2: Design**
1. Visual editor o HTML custom
2. Add CTAs con tracking
3. Preview en desktop + mobile

#### **Paso 3: Configure Trigger**
1. Event-based: Seleccionar evento trigger
2. Audience: Aplicar filtros de segmento
3. Timing: Delay, frequency cap, expiration

#### **Paso 4: Set Priority**
1. Priority level: 1-10 (10 = highest)
2. Avoid conflicts con otros mensajes
3. Set frequency cap: Max per user/day/week

---

### **4. Testing**

```javascript
// Para testear in-app messages localmente
// En tu console del browser:

// Trigger manual de mensaje
window._cio.track('viewer_loaded', { 
  count: 3 
});

// Ver mensajes disponibles
window._cio.getMessages();

// Forzar display de mensaje
window._cio.showMessage('message_id_here');
```

---

## 📊 Métricas y KPIs

### **Por Mensaje:**
- 👀 **Impressions** - Veces mostrado
- 👆 **Click-through rate** - % que hace click en CTA
- ❌ **Dismiss rate** - % que cierra sin interactuar
- ✅ **Conversion rate** - % que completa acción deseada

### **Targets:**
| Tipo | Target CTR | Target Conversion |
|------|------------|-------------------|
| Tooltips | >40% | >30% |
| Banners | >15% | >10% |
| Modals | >50% | >35% |
| Slideouts | >25% | >18% |

### **Global KPIs:**
- ✅ Feature adoption lift: +20% post in-app message
- ✅ User activation: >60% use 2+ features after onboarding
- ✅ Feedback response: >15% complete surveys

---

## 🚀 Roadmap de Implementación

### **Fase 1: Onboarding (Semana 1-2)** ⏩ PRIORIDAD
- [ ] Message 1A: Timeline Tooltip
- [ ] Message 1B: 360° Photos Banner
- [ ] Message 1C: Layer Panel Slideout
- [ ] Message 1D: Keyboard Shortcuts Modal

### **Fase 2: Engagement (Semana 3-4)**
- [ ] Message 3A: First Feature Celebration
- [ ] Message 3C: Project Update Banner
- [ ] Message 2A: Feature Announcement Banner

### **Fase 3: Feedback (Semana 5-6)**
- [ ] Message 4A: Feature Feedback
- [ ] Message 4B: NPS Survey
- [ ] Message 3B: Weekly Tips

### **Fase 4: Advanced (Semana 7-8)**
- [ ] Message 3D: Power User Milestone
- [ ] Message 2B: Feature Update Modal
- [ ] A/B testing de variantes

---

## 💡 Best Practices

### **DO:**
✅ Show messages contextually (right moment)  
✅ Allow users to dismiss permanently  
✅ Set frequency caps (avoid spam)  
✅ A/B test copy and design  
✅ Track conversion to target actions  
✅ Respect user preferences  

### **DON'T:**
❌ Show multiple messages at once  
❌ Block critical UI elements  
❌ Show same message repeatedly  
❌ Use aggressive CTAs  
❌ Ignore dismiss preferences  
❌ Forget mobile responsiveness  

---

## 📁 Recursos Adicionales

- **Customer.io Docs:** https://customer.io/docs/journeys/in-app-messages/
- **Message Templates:** Customer.io library
- **Analytics Events:** Ver `ANALYTICS_EVENTS_CATALOG.md`
- **Email Campaigns:** Ver `CUSTOMERIO_CAMPAIGNS_GUIDE.md`

---

**🎯 Próximo Paso:** Crear primer mensaje de onboarding (Timeline Tooltip) en Customer.io dashboard
