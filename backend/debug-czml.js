// Debug endpoint para verificar configuración del plan de actividades
const express = require('express');
const router = express.Router();
const pool = require('./db');

// Debug endpoint para verificar el plan de actividades de un proyecto
router.get('/debug/project/:id/plan', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT id, name, weekly_construction_plan FROM projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.json({ error: 'Proyecto no encontrado', projectId: id });
    }
    
    const project = result.rows[0];
    const planUrl = project.weekly_construction_plan;
    
    // Información de debug
    const debug = {
      projectId: id,
      projectName: project.name,
      weekly_construction_plan: planUrl,
      hasActivityPlan: Boolean(planUrl),
      planType: typeof planUrl,
      planLength: planUrl ? planUrl.length : 0,
      isRelativePath: planUrl ? planUrl.startsWith('/data/') : false,
      isAbsoluteUrl: planUrl ? /^https?:\/\//i.test(planUrl) : false
    };
    
    // Si hay plan, construir URLs de acceso
    if (planUrl) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      if (planUrl.startsWith('/data/')) {
        debug.accessUrl = `${baseUrl}${planUrl}`;
        debug.directUrl = `${baseUrl}/data/weekly_construction_plan.czml`;
      } else if (planUrl.startsWith('http')) {
        debug.accessUrl = planUrl;
      } else {
        debug.accessUrl = `${baseUrl}/api/projects/${id}/weekly-plan`;
      }
    }
    
    res.json(debug);
    
  } catch (error) {
    console.error('Debug plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint para listar todos los proyectos y sus planes
router.get('/debug/projects/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, weekly_construction_plan FROM projects ORDER BY id');
    
    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      weekly_construction_plan: project.weekly_construction_plan,
      hasActivityPlan: Boolean(project.weekly_construction_plan)
    }));
    
    res.json({
      totalProjects: projects.length,
      projectsWithPlan: projects.filter(p => p.hasActivityPlan).length,
      projects
    });
    
  } catch (error) {
    console.error('Debug projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
