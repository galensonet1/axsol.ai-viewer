# 📊 PostHog Dashboards - AXSOL Viewer

Guía paso a paso para crear dashboards en PostHog con los eventos implementados en Fase 1.

---

## 🎯 Dashboards Recomendados

### **1. Viewer Performance Dashboard**
### **2. User Navigation Dashboard**
### **3. Feature Adoption Dashboard**
### **4. Engagement Metrics Dashboard**

---

## 📋 Dashboard 1: Viewer Performance

**Objetivo:** Monitorear performance del visor y detectar problemas.

### **A. Load Times - Histogram**

**Métrica:** Tiempo de carga del viewer

**Cómo crear:**
1. PostHog → Dashboards → New Dashboard: "Viewer Performance"
2. Add Insight → Trends
3. Configurar:
   - Event: `viewer_loaded`
   - Graph type: **Histogram**
   - Property: Crear custom property calculando tiempo desde page load
   - Breakdown: `project_id`

**Query alternativa (SQL):**
```sql
SELECT 
  project_id,
  AVG(timestamp - session_start) as avg_load_time_ms,
  PERCENTILE(timestamp - session_start, 0.95) as p95_load_time
FROM events
WHERE event = 'viewer_loaded'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY project_id
ORDER BY avg_load_time_ms DESC
```

**Alertas:**
- ⚠️ Load time > 3 segundos (p95)
- 🚨 Load time > 5 segundos (p95)

---

### **B. Error Rate Over Time**

**Métrica:** Tasa de errores del viewer

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Series A: `viewer_error` (count)
   - Series B: `viewer_loaded` (count)
   - Formula: `(A / B) * 100`
   - Graph type: Line chart
   - Date range: Last 30 days

**Alertas:**
- ⚠️ Error rate > 5%
- 🚨 Error rate > 10%

---

### **C. Tileset Load Performance**

**Métrica:** Tiempo de carga de modelos 3D

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `tileset_loaded`
   - Property filters: `load_time_ms` exists
   - Breakdown: `project_id`
   - Visualization: Box plot

**Dashboard card:**
```
Title: "3D Model Load Times"
Description: "Average time to load 3D tilesets by project"
Filters: Last 7 days
```

---

## 📋 Dashboard 2: User Navigation

**Objetivo:** Entender cómo navegan los usuarios el visor.

### **A. Camera Movements - Heatmap**

**Métrica:** Coordenadas más visitadas

**Cómo crear en PostHog:**
1. Add Insight → Custom
2. Query:
```sql
SELECT 
  ROUND(CAST(properties->>'latitude' AS NUMERIC), 2) as lat,
  ROUND(CAST(properties->>'longitude' AS NUMERIC), 2) as lon,
  COUNT(*) as visits
FROM events
WHERE event = 'camera_moved'
  AND properties->>'project_id' = '1'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY lat, lon
HAVING COUNT(*) > 5
ORDER BY visits DESC
LIMIT 100
```

**Visualización externa:**
Para un heatmap geoespacial real, exportar datos y usar:
- **Kepler.gl**: https://kepler.gl/
- **Mapbox GL JS**: Con layer de heatmap
- **Google Maps Heatmap Layer**

**Ejemplo exportación:**
```javascript
// En PostHog: Export to CSV
// Formato: latitude, longitude, weight

// Importar en Kepler.gl
// 1. Subir CSV
// 2. Seleccionar Heatmap layer
// 3. Ajustar radius y intensity
```

---

### **B. Zoom Patterns - Altitude Distribution**

**Métrica:** Altitudes preferidas (zoom levels)

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `camera_moved`
   - Property: `altitude_m`
   - Breakdown: Crear bins (0-100m, 100-500m, 500-1000m, 1000-5000m, 5000m+)
   - Graph type: Bar chart

**Insights esperados:**
- Usuarios prefieren zoom medio (500-1000m)
- Pocos usan vista aérea extrema (>5000m)
- Identificar "sweet spot" de visualización

---

### **C. Session Duration Trends**

**Métrica:** Tiempo promedio de sesión de navegación

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `camera_session_ended`
   - Property: `session_duration_s`
   - Aggregation: Average
   - Date range: Last 30 days
   - Breakdown: `project_id`

**Insights:**
- Proyectos más "adictivos" (mayor session duration)
- Identificar proyectos con engagement bajo

---

### **D. Movement Type Distribution**

**Métrica:** Qué tipo de movimientos hacen los usuarios

**Cómo crear:**
1. Add Insight → **Trends**
2. Configurar:
   - Event: `camera_moved`
   - Aggregation: Total count
   - Breakdown: `movement_type` (zoom, pan, rotate, tilt)
   - Visualization: Pie chart o Bar chart
   - Date range: Last 7/30 days

**Ejemplo resultado:**
- Zoom: 45%
- Pan: 30%
- Rotate: 15%
- Tilt: 10%

---

## 📋 Dashboard 3: Feature Adoption

**Objetivo:** Medir adopción de features principales.

### **A. Layer Activation Funnel**

**Métrica:** Qué capas activan los usuarios

**Cómo crear:**
1. Add Insight → Funnel
2. Steps:
   - Step 1: `viewer_loaded`
   - Step 2: `layer_toggled` (filter: `enabled = true`)
   - Step 3: `capture_date_changed`
   - Step 4: `entity_clicked`

**Breakdown:** `layer_type` (fotos, fotos360, proyecto3D)

**Insights:**
- ¿Qué % de usuarios activa cada capa?
- Funnel de engagement: Load → Activar capa → Cambiar fecha → Interactuar

---

### **B. Timeline Usage Metrics**

**Métrica:** Adopción y uso del timeline

**Dashboard cards:**

#### **1. Timeline Activation Rate**

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Series A: `timeline_playback_control` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Date range: Last 30 days

**Insights:** % de usuarios que usan el timeline

---

#### **2. Play/Pause Distribution**

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `timeline_playback_control`
   - Aggregation: Total count
   - Breakdown: `action` (play, pause, stop)
   - Visualization: Pie chart
   - Date range: Last 7 days

**Insights:** Ratio de play vs pause, detectar si usuarios pausan mucho

---

#### **3. Average Playback Session Duration**

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `timeline_play_session`
   - Property: `play_duration_seconds`
   - Aggregation: **Average**
   - Date range: Last 30 days
   - Breakdown: `project_id` (opcional)

**Insights:** Duración promedio de reproducción, engagement con timeline

---

#### **4. Speed Multiplier Preferences**

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: `timeline_speed_changed`
   - Aggregation: Total count
   - Breakdown: `new_multiplier`
   - Visualization: Bar chart
   - Date range: Last 30 days

**Insights:** 
- Velocidades más usadas (ej: 86400 = 1 día/seg)
- Detectar si usuarios aceleran o ralentizan

---

### **C. 360 Viewer Adoption Rate**

**Métrica:** Cuántos usuarios usan fotos 360°

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Series A: `photo360_viewer` (Unique users)
   - Series B: `viewer_loaded` (Unique users)
   - Formula: `(A / B) * 100`
   - Label: "% Users who viewed 360 photos"

**Segmentación:**
- Por proyecto
- Por día de la semana
- Por primera sesión vs returning users

---

### **D. Feature Usage Matrix**

**Métrica:** Qué features usan juntos

**Cómo crear:**
1. PostHog → Insights → Correlation
2. Base event: `viewer_loaded`
3. Correlate with:
   - `layer_toggled`
   - `timeline_playback_control`
   - `photo360_viewer`
   - `entity_clicked`

**Insights:**
- Usuarios que usan timeline también usan más las capas
- Fotos 360 correlacionan con mayor engagement

---

## 📋 Dashboard 4: Engagement Metrics

**Objetivo:** Medir engagement general de usuarios.

### **A. Daily Active Users (DAU)**

**Cómo crear:**
1. Add Insight → Trends
2. Configurar:
   - Event: Any event (or `viewer_loaded`)
   - Unique users
   - Date range: Last 30 days
   - Graph type: Line chart

**Variantes:**
- WAU (Weekly Active Users)
- MAU (Monthly Active Users)
- DAU/MAU Ratio (stickiness)

---

### **B. Actions Per Session**

**Métrica:** Promedio de acciones por sesión

**Cómo crear:**
1. Add Insight → Custom SQL
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) / COUNT(DISTINCT session_id) as avg_actions_per_session
FROM events
WHERE event NOT IN ('$pageview', '$pageleave')
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date
```

**Insights:**
- Sesiones muy activas (>20 acciones) = Power users
- Sesiones con <5 acciones = Posible fricción

---

### **C. Feature Usage Matrix**

**Métrica:** % de usuarios que usan cada feature principal

**Cómo crear (Dashboard con múltiples insights):**

---

#### **1. Timeline Usage Rate**

1. Add Insight → Trends
2. Configurar:
   - Series A: `timeline_playback_control` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Visualization: Number (big number)
   - Date range: Last 30 days

**Display:** "X% used Timeline"

---

#### **2. 360 Photos Usage Rate**

1. Add Insight → Trends
2. Configurar:
   - Series A: `photo360_viewer` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Visualization: Number
   - Date range: Last 30 days

**Display:** "X% viewed 360 Photos"

---

#### **3. Layers Usage Rate**

1. Add Insight → Trends
2. Configurar:
   - Series A: `layer_toggled` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Visualization: Number
   - Date range: Last 30 days

**Display:** "X% toggled Layers"

---

#### **4. Camera Movement Rate**

1. Add Insight → Trends
2. Configurar:
   - Series A: `camera_moved` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Visualization: Number
   - Date range: Last 30 days

**Display:** "X% moved Camera"

---

#### **5. Model Inspection Rate**

1. Add Insight → Trends
2. Configurar:
   - Series A: `model_inspected` → Unique users
   - Series B: `viewer_loaded` → Unique users
   - Formula: `(A / B) * 100`
   - Visualization: Number
   - Date range: Last 30 days

**Display:** "X% inspected Model"

---

#### **6. Combined Feature Adoption Chart**

1. Add Insight → Trends
2. Configurar:
   - Event: Multiple series
     - Serie 1: `timeline_playback_control` → Unique users
     - Serie 2: `photo360_viewer` → Unique users
     - Serie 3: `layer_toggled` → Unique users
     - Serie 4: `camera_moved` → Unique users
     - Serie 5: `model_inspected` → Unique users
   - Visualization: Bar chart
   - Date range: Last 30 days

**Insights:**
- Ver features más/menos usadas de un vistazo
- Identificar features que necesitan mejora UX
- Priorizar desarrollo basado en adopción

---

**💡 Tip:** Agrupa todos estos insights en un solo dashboard llamado "Feature Adoption Matrix"

---

### **D. Retention Cohorts**

**Métrica:** Retención de usuarios por cohorte

**Cómo crear:**
1. PostHog → Insights → Retention
2. Configurar:
   - Cohort event: `viewer_loaded` (first time)
   - Return event: `viewer_loaded` (any)
   - Interval: Daily
   - Date range: Last 8 weeks

**Insights:**
- Day 1 retention: ¿Vuelven al día siguiente?
- Day 7 retention: ¿Se convierten en usuarios habituales?
- Day 30 retention: ¿Long-term engagement?

---

## 🎨 Dashboard Layout Recomendado

### **Main Dashboard: Executive View**

```
┌─────────────────────────────────────────────────────┐
│  AXSOL Viewer - Overview Dashboard                  │
├──────────────┬──────────────┬──────────────────────┤
│ DAU          │ Avg Session  │ Error Rate           │
│ 1,234        │ 8.5 min      │ 2.1%                 │
├──────────────┴──────────────┴──────────────────────┤
│                                                      │
│  Daily Active Users (Last 30 days)                  │
│  [Line chart showing DAU trend]                     │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Feature Adoption                                   │
│  ┌─────────────────────────────────────┐            │
│  │ Timeline:  45% │████████░░░░░░░░│   │            │
│  │ Fotos 360: 32% │██████░░░░░░░░░░│   │            │
│  │ Capas:     78% │███████████████░│   │            │
│  └─────────────────────────────────────┘            │
├──────────────────────────────────────────────────────┤
│  Top Projects by Engagement                         │
│  [Table: Project | Sessions | Avg Duration]         │
└──────────────────────────────────────────────────────┘
```

---

## 🔔 Alertas Recomendadas

### **Performance Alerts**

```yaml
Alert 1: High Error Rate
  Condition: viewer_error count > 10 in last hour
  Severity: High
  Notify: Slack #tech-alerts

Alert 2: Slow Load Times
  Condition: viewer_loaded avg > 5 seconds (p95)
  Severity: Medium
  Notify: Email to devs

Alert 3: No Data
  Condition: No events received in last 30 minutes
  Severity: High
  Notify: Slack + PagerDuty
```

### **Business Alerts**

```yaml
Alert 4: Low DAU
  Condition: DAU drops below 80% of 7-day average
  Severity: Medium
  Notify: Slack #product

Alert 5: Feature Adoption Drop
  Condition: Timeline usage drops > 20% week-over-week
  Severity: Low
  Notify: Email to product team
```

---

## 📤 Exportación y Reporting

### **Weekly Report Automation**

PostHog permite enviar dashboards por email automáticamente:

1. Dashboard → Settings (⚙️)
2. **Subscriptions** → Add subscription
3. Configurar:
   - Recipients: team@axsol.com
   - Frequency: Weekly (Monday 9am)
   - Format: PDF or link

**Contenido sugerido:**
- DAU/WAU/MAU trends
- Feature adoption changes
- Top performing projects
- Performance issues summary

---

## 🎯 KPIs Clave a Monitorear

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| DAU | 500 | TBD | 🟡 |
| Avg Session Duration | 10 min | TBD | 🟡 |
| Error Rate | <3% | TBD | 🟡 |
| Timeline Adoption | >40% | TBD | 🟡 |
| 360 Adoption | >30% | TBD | 🟡 |
| Day 7 Retention | >30% | TBD | 🟡 |

---

## 🚀 Próximos Pasos

1. **Crear los 4 dashboards principales** (2-3 horas)
2. **Configurar alertas críticas** (30 minutos)
3. **Setup weekly reports** (15 minutos)
4. **Revisar dashboards con el equipo** (1 hora)
5. **Iterar basado en feedback** (ongoing)

---

## 📚 Recursos

- **PostHog Docs - Dashboards**: https://posthog.com/docs/user-guides/dashboards
- **PostHog SQL Querying**: https://posthog.com/docs/hogql
- **Retention Analysis**: https://posthog.com/docs/user-guides/retention
- **Correlation Analysis**: https://posthog.com/docs/user-guides/correlation

---

**Estado:** 📋 Guía completa - Lista para implementar dashboards
