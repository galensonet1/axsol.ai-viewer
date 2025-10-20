// Cliente simple para la API de inspecciones
export async function fetchInspecciones(apiUrl) {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error('Error al obtener inspecciones');
  return res.json();
}

// Cliente para la nueva API de assets
export async function fetchAssets({ polygon, output = 'json' }) {
  // Cargar configuración desde config.json
  const configResp = await fetch('config.json');
  const config = await configResp.json();
  const apiBaseUrl = config.rutas.api_base_url;
  const project = config.proyecto.id_proyecto;
  const types = 'images,images360,3dtile';
  const from = config.proyecto.fecha_inicio.split('T')[0];
  const to = config.proyecto.fecha_fin.split('T')[0];

  // Construir parámetros de consulta
  const params = new URLSearchParams();
  params.append('polygon', JSON.stringify(polygon));
  params.append('project', project);
  params.append('types', types);
  params.append('from', from);
  params.append('to', to);
  if (output) params.append('output', output);

  const url = `${apiBaseUrl}/asset?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener assets');
  return res.json();
}

export function assignAvailabilityToDeliveries(deliveries, config) {
  // Ordenar por fecha ascendente
  deliveries.sort((a, b) => new Date(a.date) - new Date(b.date));
  for (let i = 0; i < deliveries.length; i++) {
    const ini = deliveries[i].date;
    let fin;
    if (i < deliveries.length - 1) {
      // Un día antes de la próxima entrega
      const nextDate = new Date(deliveries[i + 1].date);
      nextDate.setDate(nextDate.getDate() - 1);
      fin = nextDate.toISOString().split('T')[0] + 'T23:59:59Z';
    } else {
      // Fin del proyecto
      fin = config.proyecto.fecha_fin;
    }
    const availability = `${ini}/${fin}`;
    deliveries[i].availability = availability;
    // Asignar availability a cada dato de cada asset
    if (Array.isArray(deliveries[i].assets)) {
      deliveries[i].assets.forEach(asset => {
        if (Array.isArray(asset.data)) {
          asset.data.forEach(d => {
            d.availability = availability;
          });
        }
      });
    }
  }
  return deliveries;
}
