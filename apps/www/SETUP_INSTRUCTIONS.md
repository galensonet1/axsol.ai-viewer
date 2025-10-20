# 📸 WWW - Setup e Instrucciones

## 📁 Carpeta de Imágenes

**Ubicación:** `/apps/www/public/images/`

Sube todas las imágenes de la web en esta carpeta. La carpeta ya ha sido creada.

### Estructura recomendada:

```
/apps/www/public/images/
├── hero/
│   └── hero-background.jpg        # Imagen de fondo del Hero (1920x1080px)
├── projects/
│   ├── project-site-1.jpg         # Proyectos SITE (800x600px)
│   ├── project-site-2.jpg
│   ├── project-line-1.jpg         # Proyectos LINE (800x600px)
│   └── project-line-2.jpg
├── technology/
│   ├── drones.jpg                 # Imágenes de tecnología
│   ├── ai-platform.jpg
│   └── digital-twin.jpg
├── clients/
│   ├── logo-client-1.png          # Logos de clientes (transparente)
│   ├── logo-client-2.png
│   └── logo-client-3.png
└── team/
    └── team-photo.jpg             # Foto del equipo (opcional)
```

---

## 🔗 Navegación Implementada

### Menú Principal (Header)
- ✅ **Inicio** → `#inicio` (sección Hero)
- ✅ **Soluciones** → `#soluciones` (sección Solutions)
- ✅ **Tecnología** → `#tecnologia` (sección Technology)

### Botones CTA
- ✅ **"Solicite un Demo"** (Header) → `#contacto` (formulario de contacto)
- ✅ **"Descubre SITE"** (Hero) → `#soluciones`
- ✅ **"Descubre LINE"** (Hero) → `#soluciones`

### IDs de Secciones Agregados:
- ✅ `#inicio` - Hero
- ✅ `#valor` - ValueProposition
- ✅ `#soluciones` - Solutions
- ✅ `#tecnologia` - Technology
- ✅ `#proyectos` - Projects
- ✅ `#testimonios` - Testimonials
- ✅ `#contacto` - CTA/Formulario

---

## 📊 Analytics Integrado

### Tracking Implementado:

**PostHog (Principal)**
- ✅ Page views automáticos
- ✅ User identification
- ✅ Event tracking

**Microsoft Clarity**
- ✅ Session recording
- ✅ Heatmaps
- ✅ User behavior analytics

**Customer.io**
- ✅ First visit tracking
- ✅ User messaging

### Eventos Trackeados:

| Evento | Ubicación | Descripción |
|--------|-----------|-------------|
| `contact_form_submitted` | Formulario CTA | Usuario envía formulario |
| `page_view` | Todas las páginas | Vista de página (automático) |
| `first_visit` | Primera carga | Primera visita del usuario |

### Cómo añadir más tracking:

```typescript
// En cualquier componente, usar window.posthog
if (window.posthog) {
  window.posthog.capture('event_name', {
    property1: 'value1',
    property2: 'value2'
  });
}
```

**Ejemplos de eventos a añadir:**

```typescript
// Click en proyecto
window.posthog?.capture('project_clicked', {
  project_type: 'SITE',
  project_name: 'Proyecto X'
});

// Click en botón de solución
window.posthog?.capture('solution_button_clicked', {
  solution_type: 'SITE',
  cta_location: 'hero'
});

// Video reproducido
window.posthog?.capture('video_played', {
  video_title: 'Demo SITE'
});
```

---

## 🎨 Cómo Usar las Imágenes en Componentes

### Ejemplo 1: Hero Background

**Archivo:** `components/Hero.tsx`

```tsx
// ANTES (placeholder)
<div className="absolute inset-0 bg-cover bg-center" 
     style={{ backgroundImage: `url(https://picsum.photos/1920/1080?grayscale&blur=2)` }}>
</div>

// DESPUÉS (tu imagen)
<div className="absolute inset-0 bg-cover bg-center" 
     style={{ backgroundImage: `url(/images/hero/hero-background.jpg)` }}>
</div>
```

### Ejemplo 2: Projects

**Archivo:** `components/Projects.tsx`

```tsx
<ProjectCard 
  imageSrc="/images/projects/project-site-1.jpg"
  type="SITE"
  title="Planta de Procesamiento - Minera X"
  achievement="Reducción del 25% en tiempo de construcción"
/>

<ProjectCard 
  imageSrc="/images/projects/project-line-1.jpg"
  type="PIPE"
  title="Ducto de Transporte - 150km"
  achievement="Monitoreo 24/7 con drones autónomos"
/>
```

### Ejemplo 3: Clients Logos

**Archivo:** `components/Clients.tsx` (si existe)

```tsx
<img 
  src="/images/clients/logo-client-1.png" 
  alt="Cliente 1" 
  className="h-12 w-auto grayscale hover:grayscale-0 transition"
/>
```

---

## 🔧 Configuración de Analytics (.env)

Asegúrate de tener configuradas estas variables en `/apps/www/.env`:

```bash
# PostHog (Analytics principal)
VITE_POSTHOG_KEY=phc_fUL5s0NG9goywNDoCJI2kXaHXWTyOJkIiEJ3wv85hqJ
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Microsoft Clarity (Session Recording)
VITE_CLARITY_PROJECT_ID=ts57156okl

# Customer.io (Messaging - opcional)
VITE_CUSTOMERIO_SITE_ID=your_site_id_here
VITE_CUSTOMERIO_REGION=us

# Segment (CDP - opcional)
VITE_SEGMENT_WRITE_KEY=your_write_key_here
```

---

## ✅ Checklist de Implementación

### Imágenes
- [ ] Subir imagen de hero (`/images/hero/hero-background.jpg`)
- [ ] Subir imágenes de proyectos SITE (mínimo 2)
- [ ] Subir imágenes de proyectos LINE (mínimo 2)
- [ ] Subir logos de clientes (opcional)
- [ ] Reemplazar placeholders en componentes

### Navegación
- [x] Links del menú funcionando
- [x] Botón "Solicite un Demo" vinculado a formulario
- [x] Botones del Hero vinculados a secciones
- [x] IDs de secciones agregados

### Analytics
- [x] PostHog inicializado
- [x] Clarity inicializado
- [x] Customer.io inicializado (opcional)
- [x] Tracking de formulario implementado
- [ ] Verificar eventos en PostHog dashboard
- [ ] Verificar sesiones en Clarity dashboard

### Contenido
- [ ] Actualizar texto con información real de la empresa
- [ ] Añadir proyectos reales
- [ ] Añadir testimonios reales
- [ ] Completar información de contacto en Footer

---

## 🚀 Próximos Pasos

1. **Subir imágenes** en `/public/images/`
2. **Actualizar referencias** en componentes (Hero, Projects, etc.)
3. **Verificar analytics** en dashboards
4. **Probar navegación** (todos los links deben funcionar)
5. **Optimizar imágenes** (comprimir para web)
6. **Deploy** cuando esté listo

---

## 📝 Notas Importantes

- Las imágenes en `/public/` se sirven desde la raíz (usar `/images/...` no `./public/images/...`)
- Optimiza imágenes antes de subir (usa TinyPNG, ImageOptim, etc.)
- Tamaños recomendados:
  - Hero: 1920x1080px (max 500KB)
  - Proyectos: 800x600px (max 200KB cada una)
  - Logos: 300x100px PNG transparente (max 50KB)
- Formatos: JPG para fotos, PNG para logos con transparencia

---

**¿Necesitas ayuda?** Revisa la documentación o contacta al equipo de desarrollo.
