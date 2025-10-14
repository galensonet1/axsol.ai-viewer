// Script para crear proyectos de prueba
const pool = require('./db');

async function seedProjects() {
  try {
    console.log('🌱 Creando proyectos de prueba...');

    const projects = [
      {
        name: 'Proyecto Solar Residencial',
        description: 'Instalación de paneles solares en complejo residencial',
        business_id: 'SOLAR-RES-001',
        api_base_url: 'https://api.solar-res.com',
        start_date: '2025-01-15',
        end_date: '2025-06-30',
        initial_location: { lat: -34.6037, lng: -58.3816 }
      },
      {
        name: 'Parque Eólico Patagonia',
        description: 'Construcción de parque eólico de 50MW',
        business_id: 'EOLICO-PAT-002',
        api_base_url: 'https://api.eolico-pat.com',
        start_date: '2024-08-01',
        end_date: '2025-12-31',
        initial_location: { lat: -42.7692, lng: -65.0438 }
      },
      {
        name: 'Planta Hidroeléctrica',
        description: 'Modernización de planta hidroeléctrica existente',
        business_id: 'HIDRO-MOD-003',
        start_date: '2025-03-01',
        end_date: '2025-11-15',
        initial_location: { lat: -31.4201, lng: -64.1888 }
      },
      {
        name: 'Red Inteligente Urbana',
        description: 'Implementación de smart grid en zona metropolitana',
        business_id: 'SMART-GRID-004',
        api_base_url: 'https://api.smartgrid.com',
        start_date: '2025-02-01',
        end_date: null,
        initial_location: { lat: -34.6118, lng: -58.3960 }
      },
      {
        name: 'Biomasa Industrial',
        description: 'Planta de generación con biomasa agrícola',
        business_id: 'BIOMASA-IND-005',
        start_date: '2024-12-01',
        end_date: '2024-11-30', // Proyecto ya completado
        initial_location: { lat: -32.8908, lng: -68.8272 }
      }
    ];

    for (const project of projects) {
      const query = `
        INSERT INTO projects (
          name, description, business_id, api_base_url, 
          start_date, end_date, initial_location
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name
      `;
      
      const values = [
        project.name,
        project.description,
        project.business_id,
        project.api_base_url,
        project.start_date,
        project.end_date,
        JSON.stringify(project.initial_location)
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length > 0) {
        console.log(`✅ Creado: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      } else {
        console.log(`⚠️  Ya existe: ${project.name}`);
      }
    }

    console.log('\n🎉 Proyectos de prueba creados exitosamente!');
    console.log('\n🔗 Accede al panel de administración en:');
    console.log('   http://localhost:3001/admin/admin.html');
    
  } catch (error) {
    console.error('❌ Error creando proyectos:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedProjects();
}

module.exports = { seedProjects };
