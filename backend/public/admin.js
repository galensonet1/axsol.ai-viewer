// =========================
// Weekly Plan helpers
// =========================

async function uploadWeeklyPlanFile(fileInputId, urlInputId) {
    try {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showAlert('Seleccioná un archivo .czml para subir.', 'warning');
            return;
        }
        const projectId = document.getElementById('projectId').value;
        if (!projectId) {
            showAlert('Primero guardá el proyecto para obtener un ID.', 'warning');
            return;
        }
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const resp = await fetch(`${API_BASE}/projects/${projectId}/weekly-plan`, { method: 'POST', body: formData });
        const data = await resp.json();
        if (!data.success) {
            showAlert('Error subiendo plan semanal: ' + (data.error || 'desconocido'), 'danger');
            return;
        }
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = data.url;
        showAlert('Plan semanal subido correctamente.', 'success');
    } catch (e) {
        console.error('uploadWeeklyPlanFile error:', e);
        showAlert('Error de conexión subiendo plan semanal', 'danger');
    }
}

async function deleteWeeklyPlan(urlInputId) {
    try {
        const projectId = document.getElementById('projectId').value;
        if (!projectId) { showAlert('No hay proyecto seleccionado.', 'warning'); return; }
        if (!confirm('¿Eliminar el plan semanal del proyecto?')) return;
        const resp = await fetch(`${API_BASE}/projects/${projectId}/weekly-plan`, { method: 'DELETE' });
        const data = await resp.json();
        if (!data.success) {
            showAlert('Error eliminando plan semanal: ' + (data.error || 'desconocido'), 'danger');
            return;
        }
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = '';
        showAlert('Plan semanal eliminado.', 'success');
    } catch (e) {
        console.error('deleteWeeklyPlan error:', e);
        showAlert('Error de conexión eliminando plan semanal', 'danger');
    }
}

// Subida de logos a backend
async function uploadLogoFile(fileInputId, urlInputId, previewImgId) {
    try {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showAlert('Seleccioná un archivo de imagen para subir.', 'warning');
            return;
        }

function toggleIFCSelectAll(master) {
    document.querySelectorAll('#ifc-table-body .ifc-row-select').forEach(cb => { cb.checked = master.checked; });
}

async function deleteSelectedIFCs() {
    const projectId = document.getElementById('ifcProjectId').value;
    const ids = Array.from(document.querySelectorAll('#ifc-table-body .ifc-row-select:checked')).map(cb => parseInt(cb.value, 10));
    if (ids.length === 0) { showAlert('No hay IFCs seleccionados', 'warning'); return; }
    if (!confirm(`¿Eliminar ${ids.length} IFC(s)? Esta acción eliminará también los assets en Cesium Ion.`)) return;
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc/batch-delete`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids })
        });
        const data = await resp.json();
        if (data.success) {
            showAlert(`Borrado múltiple completado. OK: ${data.ok}, Fallidos: ${data.fail}`, 'success');
            await loadProjectIFCs(projectId);
        } else {
            showAlert('Error en borrado múltiple: ' + (data.error || 'desconocido'), 'danger');
        }
    } catch (e) {
        console.error('[IFC] Error batch-delete', e);
        showAlert('Error de conexión en borrado múltiple', 'danger');
    }
}

async function deleteSingleIFC(projectId, ifcId) {
    if (!confirm('¿Eliminar este IFC? Esto eliminará también el asset en Cesium Ion.')) return;
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc/${ifcId}`, { method: 'DELETE' });
        const data = await resp.json();
        if (data.success) {
            showAlert(data.message || 'IFC eliminado', 'success');
            await loadProjectIFCs(projectId);
        } else {
            showAlert('Error eliminando IFC: ' + (data.error || 'desconocido'), 'danger');
        }
    } catch (e) {
        console.error('[IFC] Error deleteSingleIFC', e);
        showAlert('Error de conexión al eliminar IFC', 'danger');
    }
}

async function replaceIFCFromLocal(projectId, ifcId) {
    // Reusar panel de locales para seleccionar un archivo y reemplazar
    const panel = document.getElementById('ifc-migrate-panel');
    if (panel && panel.style.display !== 'block') toggleIfcMigratePanel();
    // Escuchar selección del primer archivo marcado y ejecutar replace
    const btn = document.getElementById('btn-open-migrate');
    showAlert('Marcá un archivo en la lista de IFCs locales y confirmá reemplazo en el siguiente diálogo.', 'info');
    // Esperar un pequeño delay para asegurar render
    setTimeout(async () => {
        const list = document.getElementById('ifc-local-files');
        const chk = list ? list.querySelector('input[type="checkbox"]:checked') : null;
        if (!chk) { showAlert('Seleccioná un archivo local primero', 'warning'); return; }
        const rel = chk.value;
        if (!confirm(`Reemplazar IFC ${ifcId} con archivo local: ${rel}?`)) return;
        try {
            const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc/${ifcId}/replace-local`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relativePath: rel })
            });
            const data = await resp.json();
            if (data.success) {
                showAlert('IFC reemplazado correctamente', 'success');
                await loadProjectIFCs(projectId);
            } else {
                showAlert('Error reemplazando IFC: ' + (data.error || 'desconocido'), 'danger');
            }
        } catch (e) {
            console.error('[IFC] Error replaceIFCFromLocal', e);
            showAlert('Error de conexión al reemplazar IFC', 'danger');
        }
    }, 200);
}
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const resp = await fetch(`${API_BASE}/upload/logo`, { method: 'POST', body: formData });
        const data = await resp.json();
        if (!data.success) {
            showAlert('Error subiendo imagen: ' + (data.error || 'desconocido'), 'danger');
            return;
        }
        const url = data.url;
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = url;
        const preview = document.getElementById(previewImgId);
        if (preview) { preview.src = url; preview.style.display = 'inline-block'; }
        showAlert('Imagen subida correctamente.', 'success');
    } catch (e) {
        console.error('uploadLogoFile error:', e);
        showAlert('Error de conexión subiendo imagen', 'danger');
    }
}
// ==========================================
// PANEL DE ADMINISTRACIÓN - AXSOL.ai
// ==========================================

const API_BASE = '/api/admin';
let currentEditingProject = null;

const PALETTE_PRESETS = {
    default: { primary: '#0d6efd', secondary: '#6c757d', accent: '#0dcaf0', background: '#ffffff', surface: '#f8f9fa', text: '#212529' },
    azul: { primary: '#1d4ed8', secondary: '#60a5fa', accent: '#3b82f6', background: '#ffffff', surface: '#f1f5f9', text: '#0f172a' },
    verde: { primary: '#16a34a', secondary: '#86efac', accent: '#22c55e', background: '#ffffff', surface: '#f0fdf4', text: '#052e16' },
    rojo: { primary: '#dc2626', secondary: '#fecaca', accent: '#ef4444', background: '#ffffff', surface: '#fef2f2', text: '#450a0a' },
    oscuro: { primary: '#0ea5e9', secondary: '#64748b', accent: '#22d3ee', background: '#0f172a', surface: '#111827', text: '#e5e7eb' },
    claro: { primary: '#0d9488', secondary: '#94a3b8', accent: '#22d3ee', background: '#ffffff', surface: '#f8fafc', text: '#0f172a' },
    amber: { primary: '#d97706', secondary: '#fde68a', accent: '#f59e0b', background: '#ffffff', surface: '#fffbeb', text: '#78350f' },
    morado: { primary: '#7c3aed', secondary: '#ddd6fe', accent: '#a855f7', background: '#ffffff', surface: '#f5f3ff', text: '#2e1065' },
};

function deepEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    const ak = Object.keys(a).sort();
    const bk = Object.keys(b).sort();
    if (ak.length !== bk.length) return false;
    for (let i = 0; i < ak.length; i++) {
        const k = ak[i];
        if (k !== bk[i]) return false;
        if (a[k] !== b[k]) return false;
    }
    return true;
}

function findPresetKeyForPalette(palette) {
    if (!palette) return 'default';
    for (const [key, preset] of Object.entries(PALETTE_PRESETS)) {
        if (deepEqual(palette, preset)) return key;
    }
    return 'custom';
}

function renderPalettePreview(palette) {
    const el = document.getElementById('palettePreview');
    if (!el) return;
    const p = palette || {};
    const items = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
    el.innerHTML = items.map(k => {
        const c = p[k] || '#cccccc';
        const border = k === 'text' ? `border:1px solid #ddd;` : '';
        return `<span style="display:inline-block;width:24px;height:16px;background:${c};${border} margin-right:6px;" title="${k}: ${c}"></span>`;
    }).join('');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel de administración iniciado');
    loadDashboard();
    updateLastUpdate();
    
    // Actualizar cada 30 segundos
    setInterval(updateLastUpdate, 30000);
    const paletteSelect = document.getElementById('colorPaletteSelect');
    if (paletteSelect) {
        paletteSelect.addEventListener('change', () => {
            const key = paletteSelect.value;
            const palette = key === 'custom'
                ? ((currentEditingProject && currentEditingProject.opcions && currentEditingProject.opcions.branding && currentEditingProject.opcions.branding.colorPalette) || {})
                : (PALETTE_PRESETS[key] || {});
            renderPalettePreview(palette);
        });
    }
});

// ==========================================
// NAVEGACIÓN
// ==========================================

function showSection(sectionName) {
    // Ocultar todas las secciones
    const sections = ['dashboard', 'projects', 'users', 'roles', 'permissions', 'project-permissions'];
    sections.forEach(section => {
        document.getElementById(`${section}-section`).style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Remover clase active de todos los links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Cargar datos según la sección
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'projects':
            loadProjects();
            break;
        case 'users':
            loadUsers();
            break;
        case 'roles':
            loadRoles();
            break;
        case 'permissions':
            loadPermissions();
            break;
        case 'project-permissions':
            loadProjectPermissions();
            break;
    }
}

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        console.log('Cargando estadísticas del dashboard...');
        
        // Load project stats
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            
            document.getElementById('total-projects').textContent = stats.totalProjects || 0;
            document.getElementById('active-projects').textContent = stats.activeProjects || 0;
            document.getElementById('completed-projects').textContent = stats.completedProjects || 0;
            document.getElementById('planned-projects').textContent = stats.plannedProjects || 0;
            
            console.log('Estadísticas cargadas:', stats);
        } else {
            console.error('Error cargando estadísticas:', data.error);
            showAlert('Error cargando estadísticas: ' + data.error, 'danger');
        }
        
        // Load system version info
        await loadSystemInfo();
        
    } catch (error) {
        console.error('Error en loadDashboard:', error);
        showAlert('Error de conexión al cargar estadísticas', 'danger');
    }
}

async function loadSystemInfo() {
    try {
        const response = await fetch(`${API_BASE}/system/version`);
        const data = await response.json();
        
        if (data.success) {
            // Update version badge
            const versionBadge = document.querySelector('.badge.bg-info');
            if (versionBadge) {
                versionBadge.textContent = data.version;
                versionBadge.title = `Branch: ${data.commit.branch} | Commit: ${data.commit.hash}`;
            }
            
            // Update last update with git commit date
            const systemUpdateEl = document.getElementById('system-update');
            if (systemUpdateEl) {
                systemUpdateEl.textContent = data.commit.date;
                systemUpdateEl.title = data.commit.message;
            }
            
            // Update backend status
            const statusBadge = document.querySelector('.badge.bg-success');
            if (statusBadge && data.hasUncommittedChanges) {
                statusBadge.classList.remove('bg-success');
                statusBadge.classList.add('bg-warning');
                statusBadge.textContent = 'Cambios sin commitear';
            }
            
            console.log('System info loaded:', data);
        }
    } catch (error) {
        console.error('Error loading system info:', error);
    }
}

function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleString('es-AR');
    
    document.getElementById('last-update').textContent = `Última actualización: ${timeString}`;
}

// ==========================================
// GESTIÓN DE PROYECTOS
// ==========================================

async function loadProjects() {
    try {
        console.log('Cargando lista de proyectos...');
        
        // Mostrar loading
        document.getElementById('projects-loading').style.display = 'block';
        
        const response = await fetch(`${API_BASE}/projects`);
        const data = await response.json();
        
        // Ocultar loading
        document.getElementById('projects-loading').style.display = 'none';
        
        if (data.success) {
            renderProjectsTable(data.data);
            console.log(`${data.total} proyectos cargados`);
        } else {
            console.error('Error cargando proyectos:', data.error);
            showAlert('Error cargando proyectos: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en loadProjects:', error);
        showAlert('Error de conexión al cargar proyectos', 'danger');
    }
}

function renderProjectsTable(projects) {
  const tbody = document.getElementById('projects-table-body');
  tbody.innerHTML = '';
    
    if (projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No hay proyectos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    projects.forEach(project => {
        const row = document.createElement('tr');
        
        // Formatear fechas
        const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString('es-AR') : '-';
        const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString('es-AR') : '-';
        
        // Determinar clase de estado
        const statusClass = getStatusClass(project.status);
        
        const weeklyCell = project.weekly_construction_plan
          ? `<a href="${project.weekly_construction_plan}" target="_blank">Ver</a>`
          : '<span class="text-muted">Sin plan</span>';

        row.innerHTML = `
            <td>${project.id}</td>
            <td>
                <strong>${project.name}</strong>
                ${project.description ? `<br><small class="text-muted">${project.description}</small>` : ''}
            </td>
            <td><code>${project.business_id}</code></td>
            <td><span class="project-status ${statusClass}">${project.status}</span></td>
            <td>${startDate}</td>
            <td>${endDate}</td>
            <td>${weeklyCell}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="editProject(${project.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-info btn-action me-1" onclick="cloneProject(${project.id}, '${project.name.replace(/'/g, "\\'")}')" title="Clonar">
                    <i class="bi bi-copy"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary btn-action me-1" onclick="openIFCModal(${project.id}, '${project.name.replace(/'/g, "\\'")}')" title="Migrar IFCs">
                    <i class="bi bi-layers"></i> Migrar IFCs
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteProject(${project.id}, '${project.name}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Planificado': return 'status-planificado';
        case 'En Progreso': return 'status-en-progreso';
        case 'Completado': return 'status-completado';
        default: return '';
    }
}

// ==========================================
// MODAL DE PROYECTO
// ==========================================

function showCreateModal() {
    currentEditingProject = null;
    document.getElementById('projectModalTitle').innerHTML = '<i class="bi bi-folder-plus"></i> Nuevo Proyecto';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    const sel = document.getElementById('colorPaletteSelect');
    if (sel) { sel.value = 'default'; renderPalettePreview(PALETTE_PRESETS['default']); }
    
    const modal = new bootstrap.Modal(document.getElementById('projectModal'));
    modal.show();
}

async function editProject(id) {
    try {
        console.log(`Cargando proyecto para editar: ${id}`);
        
        const response = await fetch(`${API_BASE}/projects/${id}`);
        const data = await response.json();
        
        if (data.success) {
            currentEditingProject = data.data;
            populateProjectForm(data.data);
            
            document.getElementById('projectModalTitle').innerHTML = '<i class="bi bi-pencil"></i> Editar Proyecto';
            
            const modal = new bootstrap.Modal(document.getElementById('projectModal'));
            modal.show();
        } else {
            showAlert('Error cargando proyecto: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en editProject:', error);
        showAlert('Error de conexión al cargar proyecto', 'danger');
    }
}

function populateProjectForm(project) {
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name || '';
    document.getElementById('businessId').value = project.business_id || '';
    document.getElementById('description').value = project.description || '';
    document.getElementById('apiBaseUrl').value = project.api_base_url || '';
    
    // Formatear fechas para input date
    if (project.start_date) {
        document.getElementById('startDate').value = project.start_date.split('T')[0];
    }
    if (project.end_date) {
        document.getElementById('endDate').value = project.end_date.split('T')[0];
    }
    
    // Formatear polígonos (mapear desde los nombres de la BD)
    if (project.project_polygon_geojson) {
        document.getElementById('projectPolygon').value = JSON.stringify(project.project_polygon_geojson, null, 2);
    }
    if (project.layout_geojson) {
        document.getElementById('layoutPolygon').value = JSON.stringify(project.layout_geojson, null, 2);
    }
    
    // Formatear initial_location
    if (project.initial_location) {
        document.getElementById('initialLocation').value = JSON.stringify(project.initial_location, null, 2);
    }

    // Weekly construction plan URL
    const weeklyEl = document.getElementById('weeklyPlanUrl');
    console.log('[DEBUG] Weekly plan data:', {
        weeklyEl: !!weeklyEl,
        weekly_construction_plan: project.weekly_construction_plan,
        projectId: project.id
    });
    if (weeklyEl) {
        weeklyEl.value = project.weekly_construction_plan || '';
        console.log('[DEBUG] Set weeklyPlanUrl field to:', weeklyEl.value);
    } else {
        console.warn('[DEBUG] weeklyPlanUrl element not found in DOM');
    }

    // Branding (opcions)
    try {
        const opcions = project.opcions || {};
        const branding = opcions.branding || {};
        document.getElementById('primaryLogoUrl').value = branding.primaryLogoUrl || opcions.primaryLogoUrl || '';
        document.getElementById('secondaryLogoUrl').value = branding.secondaryLogoUrl || opcions.secondaryLogoUrl || '';
        const palette = branding.colorPalette || opcions.colorPalette;
        const sel = document.getElementById('colorPaletteSelect');
        if (sel) {
            const key = findPresetKeyForPalette(palette);
            sel.value = key;
            renderPalettePreview(palette || PALETTE_PRESETS[key]);
        }

        const primaryUrl = document.getElementById('primaryLogoUrl').value.trim();
        const primaryPreview = document.getElementById('primaryLogoPreview');
        if (primaryPreview) {
            if (primaryUrl) { primaryPreview.src = primaryUrl; primaryPreview.style.display = 'inline-block'; }
            else { primaryPreview.src = ''; primaryPreview.style.display = 'none'; }
        }
        const secondaryUrl = document.getElementById('secondaryLogoUrl').value.trim();
        const secondaryPreview = document.getElementById('secondaryLogoPreview');
        if (secondaryPreview) {
            if (secondaryUrl) { secondaryPreview.src = secondaryUrl; secondaryPreview.style.display = 'inline-block'; }
            else { secondaryPreview.src = ''; secondaryPreview.style.display = 'none'; }
        }
    } catch (e) {
        console.warn('No se pudo cargar branding desde opcions:', e);
    }
}

async function saveProject() {
    try {
        const form = document.getElementById('projectForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const projectId = document.getElementById('projectId').value;
        const isEditing = projectId !== '';
        
        const projectData = {
            name: document.getElementById('projectName').value,
            business_id: document.getElementById('businessId').value,
            description: document.getElementById('description').value || null,
            api_base_url: document.getElementById('apiBaseUrl').value || null,
            start_date: document.getElementById('startDate').value || null,
            end_date: document.getElementById('endDate').value || null,
        };
        
        // Parsear project_polygon si está presente
        const projectPolygonEl = document.getElementById('projectPolygon');
        const projectPolygonText = projectPolygonEl ? projectPolygonEl.value.trim() : '';
        if (projectPolygonText) {
            try {
                projectData.project_polygon = JSON.parse(projectPolygonText);
            } catch (e) {
                showAlert('Error en formato de polígono del proyecto. Debe ser JSON válido.', 'danger');
                return;
            }
        }
        
        // Parsear layout_polygon si está presente
        const layoutPolygonEl = document.getElementById('layoutPolygon');
        const layoutPolygonText = layoutPolygonEl ? layoutPolygonEl.value.trim() : '';
        if (layoutPolygonText) {
            try {
                projectData.layout_polygon = JSON.parse(layoutPolygonText);
            } catch (e) {
                showAlert('Error en formato de polígono de layout. Debe ser JSON válido.', 'danger');
                return;
            }
        }
        
        // Parsear initial_location si está presente
        const initialLocationEl = document.getElementById('initialLocation');
        const initialLocationText = initialLocationEl ? initialLocationEl.value.trim() : '';
        if (initialLocationText) {
            try {
                projectData.initial_location = JSON.parse(initialLocationText);
            } catch (e) {
                showAlert('Error en formato de ubicación inicial. Debe ser JSON válido.', 'danger');
                return;
            }
        }

        // Weekly plan URL - preservar valor existente si está vacío durante edición
        const weeklyEl = document.getElementById('weeklyPlanUrl');
        const weeklyUrl = weeklyEl ? weeklyEl.value.trim() : '';
        console.log('[DEBUG] saveProject weekly plan logic:', {
            isEditing,
            weeklyUrl,
            currentEditingProject: currentEditingProject ? {
                id: currentEditingProject.id,
                weekly_construction_plan: currentEditingProject.weekly_construction_plan
            } : null
        });
        if (isEditing) {
            // En edición: usar el valor del campo, o preservar el existente si está vacío
            const existingWeeklyPlan = (currentEditingProject && currentEditingProject.weekly_construction_plan) ? currentEditingProject.weekly_construction_plan : null;
            projectData.weekly_construction_plan = weeklyUrl !== '' ? weeklyUrl : existingWeeklyPlan;
            console.log('[DEBUG] Final weekly_construction_plan for editing:', projectData.weekly_construction_plan);
        } else {
            // En creación: usar el valor del campo o null
            projectData.weekly_construction_plan = weeklyUrl !== '' ? weeklyUrl : null;
            console.log('[DEBUG] Final weekly_construction_plan for creation:', projectData.weekly_construction_plan);
        }

        // Branding inputs
        const primaryEl = document.getElementById('primaryLogoUrl');
        const secondaryEl = document.getElementById('secondaryLogoUrl');
        const primaryLogoUrl = primaryEl ? primaryEl.value.trim() : '';
        const secondaryLogoUrl = secondaryEl ? secondaryEl.value.trim() : '';
        // Preservar branding existente en edición si los campos quedan vacíos
        const existingBranding = (isEditing && currentEditingProject && currentEditingProject.opcions && currentEditingProject.opcions.branding) ? currentEditingProject.opcions.branding : {};
        const paletteSelect = document.getElementById('colorPaletteSelect');
        const selectedPaletteKey = paletteSelect ? paletteSelect.value : 'default';
        const paletteToSave = selectedPaletteKey === 'custom' ? (existingBranding.colorPalette !== undefined ? existingBranding.colorPalette : null) : (PALETTE_PRESETS[selectedPaletteKey] || null);
        const newBranding = {
            primaryLogoUrl: primaryLogoUrl || existingBranding.primaryLogoUrl || null,
            secondaryLogoUrl: secondaryLogoUrl || existingBranding.secondaryLogoUrl || null,
            colorPalette: paletteToSave
        };
        projectData.opcions = { branding: newBranding };
        
        const url = isEditing ? `${API_BASE}/projects/${projectId}` : `${API_BASE}/projects`;
        const method = isEditing ? 'PUT' : 'POST';
        
        console.log(`${isEditing ? 'Actualizando' : 'Creando'} proyecto:`, projectData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
            modal.hide();
            
            // Recargar lista de proyectos
            loadProjects();
            
            // Actualizar dashboard si estamos en esa sección
            if (document.getElementById('dashboard-section').style.display !== 'none') {
                loadDashboard();
            }
            
        } else {
            showAlert('Error guardando proyecto: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en saveProject:', error);
        showAlert('Error de conexión al guardar proyecto', 'danger');
    }
}

async function deleteProject(id, name) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el proyecto "${name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        console.log(`Eliminando proyecto: ${id}`);
        
        const response = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadProjects();
            
            // Actualizar dashboard si estamos en esa sección
            if (document.getElementById('dashboard-section').style.display !== 'none') {
                loadDashboard();
            }
        } else {
            showAlert('Error eliminando proyecto: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en deleteProject:', error);
        showAlert('Error de conexión al eliminar proyecto', 'danger');
    }
}

async function viewProject(id) {
    try {
        const response = await fetch(`${API_BASE}/projects/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const project = data.data;
            
            let details = `
                <strong>ID:</strong> ${project.id}<br>
                <strong>Nombre:</strong> ${project.name}<br>
                <strong>Business ID:</strong> ${project.business_id}<br>
            `;
            
            if (project.description) {
                details += `<strong>Descripción:</strong> ${project.description}<br>`;
            }
            
            if (project.api_base_url) {
                details += `<strong>API URL:</strong> ${project.api_base_url}<br>`;
            }
            
            if (project.start_date) {
                details += `<strong>Fecha Inicio:</strong> ${new Date(project.start_date).toLocaleDateString('es-AR')}<br>`;
            }
            
            if (project.end_date) {
                details += `<strong>Fecha Fin:</strong> ${new Date(project.end_date).toLocaleDateString('es-AR')}<br>`;
            }
            
            if (project.initial_location) {
                details += `<strong>Ubicación Inicial:</strong> ${JSON.stringify(project.initial_location)}<br>`;
            }
            
            if (project.weekly_construction_plan) {
                details += `<strong>Plan Semanal:</strong> <a href="${project.weekly_construction_plan}" target="_blank">${project.weekly_construction_plan}</a><br>`;
            }
            
            details += `<strong>Creado:</strong> ${new Date(project.created_at).toLocaleString('es-AR')}<br>`;
            details += `<strong>Actualizado:</strong> ${new Date(project.updated_at).toLocaleString('es-AR')}`;
            
            showAlert(details, 'info', 'Detalles del Proyecto');
            
        } else {
            showAlert('Error cargando detalles: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en viewProject:', error);
        showAlert('Error de conexión al cargar detalles', 'danger');
    }
}

// ==========================================
// UTILIDADES
// ==========================================

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

async function loadUsers() {
    try {
        console.log('Cargando lista de usuarios...');
        
        document.getElementById('users-loading').style.display = 'block';
        
        const response = await fetch(`${API_BASE}/users`);
        const data = await response.json();
        
        document.getElementById('users-loading').style.display = 'none';
        
        if (data.success) {
            renderUsersTable(data.data);
            console.log(`${data.total} usuarios cargados`);
        } else {
            showAlert('Error cargando usuarios: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en loadUsers:', error);
        document.getElementById('users-loading').style.display = 'none';
        showAlert('Error de conexión al cargar usuarios', 'danger');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (!tbody) {
        console.error('No se encontró el elemento users-table-body');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const statusBadge = user.active ? 
            '<span class="badge bg-success">Activo</span>' : 
            '<span class="badge bg-secondary">Inactivo</span>';
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>${statusBadge}</td>
            <td>${user.roles || '<span class="text-muted">Sin roles</span>'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editUser(${user.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteUser(${user.id}, '${user.name}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showCreateUserModal() {
    document.getElementById('userModalTitle').innerHTML = '<i class="bi bi-person-plus"></i> Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

async function editUser(id) {
    try {
        const response = await fetch(`${API_BASE}/users/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const user = data.data;
            
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userActive').checked = user.active;
            
            document.getElementById('userModalTitle').innerHTML = '<i class="bi bi-pencil"></i> Editar Usuario';
            
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        } else {
            showAlert('Error cargando usuario: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en editUser:', error);
        showAlert('Error de conexión al cargar usuario', 'danger');
    }
}

async function saveUser() {
    try {
        const form = document.getElementById('userForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            active: document.getElementById('userActive').checked
        };
        
        const userId = document.getElementById('userId').value;
        const isEditing = userId !== '';
        
        const url = isEditing ? `${API_BASE}/users/${userId}` : `${API_BASE}/users`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            modal.hide();
            
            loadUsers();
        } else {
            showAlert('Error guardando usuario: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en saveUser:', error);
        showAlert('Error de conexión al guardar usuario', 'danger');
    }
}

async function deleteUser(id, name) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el usuario "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadUsers();
        } else {
            showAlert('Error eliminando usuario: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en deleteUser:', error);
        showAlert('Error de conexión al eliminar usuario', 'danger');
    }
}

// ==========================================
// GESTIÓN DE ROLES
// ==========================================

async function loadRoles() {
    try {
        console.log('Cargando lista de roles...');
        
        document.getElementById('roles-loading').style.display = 'block';
        
        const response = await fetch(`${API_BASE}/roles`);
        const data = await response.json();
        
        document.getElementById('roles-loading').style.display = 'none';
        
        if (data.success) {
            renderRolesTable(data.data);
            console.log(`${data.total} roles cargados`);
        } else {
            showAlert('Error cargando roles: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en loadRoles:', error);
        document.getElementById('roles-loading').style.display = 'none';
        showAlert('Error de conexión al cargar roles', 'danger');
    }
}

function renderRolesTable(roles) {
    const tbody = document.getElementById('roles-table-body');
    
    if (!tbody) {
        console.error('No se encontró el elemento roles-table-body');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (roles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No hay roles registrados
                </td>
            </tr>
        `;
        return;
    }
    
    roles.forEach(role => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${role.id}</td>
            <td><strong>${role.name}</strong></td>
            <td>${role.description || '<span class="text-muted">Sin descripción</span>'}</td>
            <td><span class="badge bg-info">${role.users_count} usuarios</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action" onclick="editRole(${role.id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteRole(${role.id}, '${role.name}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showCreateRoleModal() {
    document.getElementById('roleModalTitle').innerHTML = '<i class="bi bi-plus-circle"></i> Nuevo Rol';
    document.getElementById('roleForm').reset();
    document.getElementById('roleId').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('roleModal'));
    modal.show();
}

async function editRole(id) {
    try {
        const response = await fetch(`${API_BASE}/roles`);
        const data = await response.json();
        
        if (data.success) {
            const role = data.data.find(r => r.id === id);
            if (role) {
                document.getElementById('roleId').value = role.id;
                document.getElementById('roleName').value = role.name;
                document.getElementById('roleDescription').value = role.description || '';
                
                document.getElementById('roleModalTitle').innerHTML = '<i class="bi bi-pencil"></i> Editar Rol';
                
                const modal = new bootstrap.Modal(document.getElementById('roleModal'));
                modal.show();
            }
        } else {
            showAlert('Error cargando rol: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en editRole:', error);
        showAlert('Error de conexión al cargar rol', 'danger');
    }
}

async function saveRole() {
    try {
        const form = document.getElementById('roleForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const roleData = {
            name: document.getElementById('roleName').value,
            description: document.getElementById('roleDescription').value || null
        };
        
        const roleId = document.getElementById('roleId').value;
        const isEditing = roleId !== '';
        
        const url = isEditing ? `${API_BASE}/roles/${roleId}` : `${API_BASE}/roles`;
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roleData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('roleModal'));
            modal.hide();
            
            loadRoles();
        } else {
            showAlert('Error guardando rol: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en saveRole:', error);
        showAlert('Error de conexión al guardar rol', 'danger');
    }
}

async function deleteRole(id, name) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el rol "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/roles/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadRoles();
        } else {
            showAlert('Error eliminando rol: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en deleteRole:', error);
        showAlert('Error de conexión al eliminar rol', 'danger');
    }
}

// ==========================================
// GESTIÓN DE PERMISOS
// ==========================================

async function loadPermissions() {
    try {
        console.log('Cargando asignaciones de permisos...');
        
        document.getElementById('permissions-loading').style.display = 'block';
        
        const response = await fetch(`${API_BASE}/user-roles`);
        const data = await response.json();
        
        document.getElementById('permissions-loading').style.display = 'none';
        
        if (data.success) {
            renderPermissionsTable(data.data);
            console.log(`${data.total} asignaciones cargadas`);
        } else {
            showAlert('Error cargando permisos: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en loadPermissions:', error);
        document.getElementById('permissions-loading').style.display = 'none';
        showAlert('Error de conexión al cargar permisos', 'danger');
    }
}

function renderPermissionsTable(assignments) {
    const tbody = document.getElementById('permissions-table-body');
    
    if (!tbody) {
        console.error('No se encontró el elemento permissions-table-body');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (assignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No hay asignaciones de roles
                </td>
            </tr>
        `;
        return;
    }
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        
        const assignmentDate = new Date(assignment.created_at).toLocaleDateString('es-AR');
        
        row.innerHTML = `
            <td>${assignment.id}</td>
            <td><strong>${assignment.user_name}</strong></td>
            <td>${assignment.user_email}</td>
            <td><span class="badge bg-primary">${assignment.role_name}</span></td>
            <td>${assignment.role_description || '<span class="text-muted">Sin descripción</span>'}</td>
            <td>${assignmentDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="removeAssignment(${assignment.user_id}, ${assignment.role_id})" title="Remover asignación">
                    <i class="bi bi-x-circle"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function showAssignRoleModal() {
    try {
        // Cargar usuarios y roles para los selects
        const [usersResponse, rolesResponse] = await Promise.all([
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/roles`)
        ]);
        
        const usersData = await usersResponse.json();
        const rolesData = await rolesResponse.json();
        
        if (usersData.success && rolesData.success) {
            // Llenar select de usuarios
            const userSelect = document.getElementById('assignUserId');
            userSelect.innerHTML = '<option value="">Seleccionar usuario...</option>';
            usersData.data.forEach(user => {
                userSelect.innerHTML += `<option value="${user.id}">${user.name} (${user.email})</option>`;
            });
            
            // Llenar select de roles
            const roleSelect = document.getElementById('assignRoleId');
            roleSelect.innerHTML = '<option value="">Seleccionar rol...</option>';
            rolesData.data.forEach(role => {
                roleSelect.innerHTML += `<option value="${role.id}">${role.name}</option>`;
            });
            
            const modal = new bootstrap.Modal(document.getElementById('assignRoleModal'));
            modal.show();
        } else {
            showAlert('Error cargando datos para asignación', 'danger');
        }
        
    } catch (error) {
        console.error('Error en showAssignRoleModal:', error);
        showAlert('Error de conexión al cargar datos', 'danger');
    }
}

async function assignRole() {
    try {
        const form = document.getElementById('assignRoleForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const assignmentData = {
            user_id: parseInt(document.getElementById('assignUserId').value),
            role_id: parseInt(document.getElementById('assignRoleId').value)
        };
        
        const response = await fetch(`${API_BASE}/user-roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignRoleModal'));
            modal.hide();
            
            loadPermissions();
        } else {
            showAlert('Error asignando rol: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en assignRole:', error);
        showAlert('Error de conexión al asignar rol', 'danger');
    }
}

async function removeAssignment(userId, roleId) {
    if (!confirm('¿Estás seguro de que quieres remover esta asignación de rol?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user-roles/${userId}/${roleId}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadPermissions();
        } else {
            showAlert('Error removiendo asignación: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en removeAssignment:', error);
        showAlert('Error de conexión al remover asignación', 'danger');
    }
}

// ==========================================
// PERMISOS POR PROYECTO
// ==========================================

async function loadProjectPermissions() {
    try {
        console.log('Cargando permisos por proyecto...');
        document.getElementById('project-permissions-loading').style.display = 'block';
        
        const response = await fetch(`${API_BASE}/project-permissions`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`${data.data.length} permisos por proyecto cargados`);
            renderProjectPermissionsTable(data.data);
        } else {
            showAlert('Error cargando permisos por proyecto: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en loadProjectPermissions:', error);
        document.getElementById('project-permissions-loading').style.display = 'none';
        showAlert('Error de conexión al cargar permisos por proyecto', 'danger');
    }
}

function renderProjectPermissionsTable(permissions) {
    const tbody = document.getElementById('project-permissions-table-body');
    
    if (!tbody) {
        console.error('No se encontró el elemento project-permissions-table-body');
        return;
    }
    
    tbody.innerHTML = '';
    document.getElementById('project-permissions-loading').style.display = 'none';
    
    if (permissions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No hay permisos por proyecto asignados
                </td>
            </tr>
        `;
        return;
    }
    
    permissions.forEach(permission => {
        const row = document.createElement('tr');
        
        const levelBadge = getLevelBadge(permission.permission_level);
        const assignmentDate = new Date(permission.created_at).toLocaleDateString('es-AR');
        
        row.innerHTML = `
            <td>${permission.id}</td>
            <td><strong>${permission.user_name}</strong></td>
            <td>${permission.user_email}</td>
            <td>${permission.project_name}</td>
            <td>${levelBadge}</td>
            <td>${assignmentDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action me-1" onclick="editProjectPermission(${permission.id}, '${permission.permission_level}')" title="Editar nivel">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action" onclick="removeProjectPermission(${permission.id})" title="Remover permiso">
                    <i class="bi bi-x-circle"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getLevelBadge(level) {
    switch(level) {
        case 'admin':
            return '<span class="badge bg-danger">Admin</span>';
        case 'editor':
            return '<span class="badge bg-warning">Editor</span>';
        case 'viewer':
            return '<span class="badge bg-info">Viewer</span>';
        default:
            return '<span class="badge bg-secondary">' + level + '</span>';
    }
}

async function showAssignProjectPermissionModal() {
    try {
        // Cargar usuarios y proyectos para los selects
        const [usersResponse, projectsResponse] = await Promise.all([
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/projects`)
        ]);
        
        const usersData = await usersResponse.json();
        const projectsData = await projectsResponse.json();
        
        if (usersData.success && projectsData.success) {
            // Llenar select de usuarios
            const userSelect = document.getElementById('projectPermissionUserId');
            userSelect.innerHTML = '<option value="">Seleccionar usuario...</option>';
            usersData.data.forEach(user => {
                userSelect.innerHTML += `<option value="${user.id}">${user.name} (${user.email})</option>`;
            });
            
            // Llenar select de proyectos
            const projectSelect = document.getElementById('projectPermissionProjectId');
            projectSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
            projectsData.data.forEach(project => {
                projectSelect.innerHTML += `<option value="${project.id}">${project.name}</option>`;
            });
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('assignProjectPermissionModal'));
            modal.show();
        } else {
            showAlert('Error cargando datos para el formulario', 'danger');
        }
        
    } catch (error) {
        console.error('Error en showAssignProjectPermissionModal:', error);
        showAlert('Error de conexión al cargar formulario', 'danger');
    }
}

async function assignProjectPermission() {
    try {
        const userId = document.getElementById('projectPermissionUserId').value;
        const projectId = document.getElementById('projectPermissionProjectId').value;
        const permissionLevel = document.getElementById('projectPermissionLevel').value;
        
        if (!userId || !projectId || !permissionLevel) {
            showAlert('Todos los campos son requeridos', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE}/project-permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                project_id: parseInt(projectId),
                permission_level: permissionLevel
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignProjectPermissionModal'));
            modal.hide();
            
            // Limpiar formulario
            document.getElementById('assignProjectPermissionForm').reset();
            
            // Recargar lista
            loadProjectPermissions();
        } else {
            showAlert('Error asignando permiso: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en assignProjectPermission:', error);
        showAlert('Error de conexión al asignar permiso', 'danger');
    }
}

async function editProjectPermission(id, currentLevel) {
    const newLevel = prompt(`Cambiar nivel de permiso (actual: ${currentLevel}):\n\nadmin - Acceso completo\neditor - Puede editar y ver\nviewer - Solo lectura\n\nIngrese nuevo nivel:`, currentLevel);
    
    if (!newLevel || newLevel === currentLevel) {
        return;
    }
    
    const validLevels = ['admin', 'editor', 'viewer'];
    if (!validLevels.includes(newLevel)) {
        showAlert('Nivel inválido. Use: admin, editor o viewer', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/project-permissions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permission_level: newLevel
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadProjectPermissions();
        } else {
            showAlert('Error actualizando permiso: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en editProjectPermission:', error);
        showAlert('Error de conexión al actualizar permiso', 'danger');
    }
}

async function removeProjectPermission(id) {
    if (!confirm('¿Estás seguro de que quieres remover este permiso por proyecto?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/project-permissions/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadProjectPermissions();
        } else {
            showAlert('Error removiendo permiso: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en removeProjectPermission:', error);
        showAlert('Error de conexión al remover permiso', 'danger');
    }
}

// Función para clonar proyecto
async function cloneProject(id, originalName) {
    const newName = prompt(`Clonar proyecto "${originalName}":\n\nIngrese el nombre para el proyecto clonado:`, `${originalName} - Copia`);
    
    if (!newName || newName.trim() === '') {
        return;
    }
    
    const newBusinessId = prompt('Ingrese el Business ID para el proyecto clonado (opcional):', '');
    
    try {
        const response = await fetch(`${API_BASE}/projects/${id}/clone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newName.trim(),
                business_id: newBusinessId.trim() || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            loadProjects(); // Recargar lista de proyectos
        } else {
            showAlert('Error clonando proyecto: ' + data.error, 'danger');
        }
        
    } catch (error) {
        console.error('Error en cloneProject:', error);
        showAlert('Error de conexión al clonar proyecto', 'danger');
    }
}

// ==========================================
// GESTIÓN DE IFCs POR PROYECTO (UI)
// ==========================================

function formatDateTime(value) {
    if (!value) return '-';
    try { return new Date(value).toLocaleString('es-AR'); } catch { return String(value); }
}

async function openIFCModal(projectId, projectName) {
    document.getElementById('ifcProjectId').value = projectId;
    document.getElementById('ifcProjectTitle').textContent = `${projectName} (ID ${projectId})`;

    // Reset progress UI
    const bar = document.getElementById('ifc-migrate-progress');
    if (bar) { bar.style.width = '0%'; bar.textContent = '0%'; }
    const status = document.getElementById('ifc-migrate-status');
    if (status) status.textContent = '';
    const log = document.getElementById('ifc-migrate-log');
    if (log) log.innerHTML = '';

    // Hide migrate panel initially
    const panel = document.getElementById('ifc-migrate-panel');
    if (panel) panel.style.display = 'none';

    await loadProjectIFCs(projectId);

    const modal = new bootstrap.Modal(document.getElementById('ifcModal'));
    modal.show();
}

async function loadProjectIFCs(projectId) {
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc`);
        const data = await resp.json();
        if (data.success) {
            renderIFCTable(data.data || []);
        } else {
            showAlert('Error cargando IFCs: ' + (data.error || 'desconocido'), 'danger');
        }
    } catch (e) {
        console.error('[IFC] Error loadProjectIFCs', e);
        showAlert('Error de conexión al cargar IFCs', 'danger');
    }
}

function renderIFCTable(rows) {
    const tbody = document.getElementById('ifc-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
        tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center text-muted">
                <i class="bi bi-inbox"></i> No hay IFCs registrados para este proyecto
              </td>
            </tr>`;
        return;
    }
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="checkbox" class="ifc-row-select" value="${r.id}"></td>
          <td>${r.file_name || '-'}</td>
          <td><span class="badge ${r.processing_status === 'complete' ? 'bg-success' : 'bg-secondary'}">${r.processing_status || '-'}</span></td>
          <td>${r.asset_id || '-'}</td>
          <td>${r.project_id}</td>
          <td>${formatDateTime(r.created_at)}</td>
          <td>${formatDateTime(r.updated_at)}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger me-1" onclick="deleteSingleIFC(${r.project_id}, ${r.id})"><i class="bi bi-trash"></i></button>
            <button class="btn btn-sm btn-outline-secondary" onclick="replaceIFCFromLocal(${r.project_id}, ${r.id})"><i class="bi bi-arrow-repeat"></i></button>
          </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleIfcMigratePanel() {
    const panel = document.getElementById('ifc-migrate-panel');
    if (!panel) return;
    const projectId = document.getElementById('ifcProjectId').value;
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        loadLocalIfcFiles(projectId);
    } else {
        panel.style.display = 'none';
    }
}

async function loadLocalIfcFiles(projectId) {
    try {
        const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc/local-files`);
        const data = await resp.json();
        const list = document.getElementById('ifc-local-files');
        if (!list) return;
        list.innerHTML = '';
        if (!data.success) {
            list.innerHTML = `<div class="list-group-item text-danger">${data.error || 'Error listando IFCs locales'}</div>`;
            return;
        }
        if (!data.data || data.data.length === 0) {
            list.innerHTML = `<div class="list-group-item text-muted"><i class="bi bi-inbox"></i> No hay archivos .ifc en el servidor (${data.baseDir || ''})</div>`;
            return;
        }
        data.data.forEach(item => {
            const div = document.createElement('label');
            div.className = 'list-group-item d-flex align-items-center';
            div.innerHTML = `
              <input class="form-check-input me-2" type="checkbox" value="${item.relativePath}" />
              <span class="flex-grow-1">${item.relativePath}</span>
              <small class="text-muted ms-2">${(item.size/1024/1024).toFixed(2)} MB</small>
              <small class="text-muted ms-3">${formatDateTime(item.mtime)}</small>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        console.error('[IFC] Error listando IFC locales', e);
        showAlert('Error de conexión al listar IFCs locales', 'danger');
    }
}

async function migrateSelectedIFCs() {
    const projectId = document.getElementById('ifcProjectId').value;
    const list = document.getElementById('ifc-local-files');
    const checks = list ? Array.from(list.querySelectorAll('input[type="checkbox"]:checked')) : [];
    if (checks.length === 0) {
        showAlert('Seleccione al menos un IFC para migrar', 'warning');
        return;
    }
    const bar = document.getElementById('ifc-migrate-progress');
    const status = document.getElementById('ifc-migrate-status');
    const log = document.getElementById('ifc-migrate-log');
    let ok = 0, fail = 0;

    for (let i = 0; i < checks.length; i++) {
        const rel = checks[i].value;
        try {
            status.textContent = `Migrando (${i+1}/${checks.length}): ${rel}`;
            const resp = await fetch(`${API_BASE}/projects/${projectId}/ifc/migrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relativePath: rel })
            });
            const data = await resp.json();
            if (data.success) {
                ok++;
                const p = Math.round(((i+1) / checks.length) * 100);
                bar.style.width = `${p}%`; bar.textContent = `${p}%`;
                log.innerHTML += `<div class="text-success"><i class="bi bi-check-circle"></i> ${rel} → asset ${data.data.asset_id}</div>`;
            } else {
                fail++;
                log.innerHTML += `<div class="text-danger"><i class="bi bi-x-circle"></i> ${rel} → ${data.error || 'error'}</div>`;
            }
        } catch (e) {
            fail++;
            log.innerHTML += `<div class="text-danger"><i class="bi bi-x-circle"></i> ${rel} → ${e.message}</div>`;
        }
    }
    status.textContent = `Completado. OK: ${ok}, Fallidos: ${fail}`;
    await loadProjectIFCs(projectId);
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        // Auto-remover después de 5 segundos (excepto errores)
        if (type !== 'danger') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// ==========================================
// RELEASES HISTORY
// ==========================================

async function showReleasesModal() {
    const modal = new bootstrap.Modal(document.getElementById('releasesModal'));
    modal.show();
    
    // Show loading
    document.getElementById('releases-loading').style.display = 'block';
    document.getElementById('releases-content').style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/api/system/releases?limit=20`);
        const data = await response.json();
        
        if (data.success && data.releases && data.releases.length > 0) {
            renderReleases(data.releases);
        } else {
            document.getElementById('releases-content').innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No hay releases disponibles
                </div>
            `;
        }
        
        // Hide loading, show content
        document.getElementById('releases-loading').style.display = 'none';
        document.getElementById('releases-content').style.display = 'block';
    } catch (error) {
        console.error('Error loading releases:', error);
        document.getElementById('releases-content').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Error cargando historial de releases
            </div>
        `;
        document.getElementById('releases-loading').style.display = 'none';
        document.getElementById('releases-content').style.display = 'block';
    }
}

function renderReleases(releases) {
    const contentDiv = document.getElementById('releases-content');
    
    let html = '';
    releases.forEach((release, index) => {
        const isLatest = index === 0;
        const latestLabel = isLatest ? '<span class="badge bg-success ms-2">Actual</span>' : '';
        
        html += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">
                            <i class="bi bi-tag-fill"></i>
                            <strong>${escapeHtml(release.tag)}</strong>
                            ${latestLabel}
                        </h6>
                    </div>
                    <small class="text-muted">
                        <i class="bi bi-calendar3"></i>
                        ${escapeHtml(release.date)}
                    </small>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <strong>Changelog:</strong>
                        <pre class="bg-light p-3 rounded mt-2" style="white-space: pre-wrap; font-size: 0.9em;">${escapeHtml(release.changelog)}</pre>
                    </div>
                    ${release.commits && release.commits.length > 0 ? `
                        <div>
                            <strong>Commits incluidos (${release.commits.length}):</strong>
                            <button class="btn btn-sm btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#commits-${index}">
                                Ver/Ocultar
                            </button>
                            <div class="collapse" id="commits-${index}">
                                <ul class="list-group mt-2">
                                    ${release.commits.map(commit => `
                                        <li class="list-group-item d-flex justify-content-between align-items-start">
                                            <div class="ms-2 me-auto">
                                                <div class="fw-bold">
                                                    <code class="text-primary">${escapeHtml(commit.hash)}</code>
                                                    ${escapeHtml(commit.message)}
                                                </div>
                                                <small class="text-muted">
                                                    ${escapeHtml(commit.author)} • ${escapeHtml(commit.date)}
                                                </small>
                                            </div>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}
