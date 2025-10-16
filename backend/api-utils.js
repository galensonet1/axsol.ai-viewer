const axios = require('axios');
const pool = require('./db');

const path = require('path');
const fs = require('fs');

const DEFAULT_POLYGON_OVERRIDE_PATH = path.resolve(__dirname, '../frontend/src/ejemplo/desa/data/Poligono-proyecto.json');

const fetchAndNormalizeAssets = async (projectId) => {
  console.log(`[ASSETS] Iniciando obtención de assets para el proyecto: ${projectId}`);

  // 1. Obtener detalles del proyecto desde la BD local
  const projectDetailsQuery = await pool.query(
    'SELECT business_id, start_date, end_date, api_base_url, project_polygon_geojson, layout_geojson FROM projects WHERE id = $1',
    [projectId]
  );

  if (projectDetailsQuery.rows.length === 0) {
    throw new Error('Proyecto no encontrado en la base de datos local.');
  }

  const projectDetails = projectDetailsQuery.rows[0];
  const {
    business_id,
    start_date,
    end_date,
    api_base_url,
    project_polygon_geojson: projectPolygonGeojson,
    layout_geojson,
  } = projectDetails;
  console.log('[ASSETS] Detalles del proyecto obtenidos:', { business_id, start_date, end_date, api_base_url });

  if (!business_id || !api_base_url) {
    throw new Error('La configuración del proyecto (business_id o api_base_url) es inválida.');
  }

  // 2. Construir la URL de la API externa
  const fromDate = new Date(start_date).toISOString().split('T')[0];
  const toDate = new Date(end_date).toISOString().split('T')[0];
  const types = 'images,images360,3dtile';

  const normalizePolygonGeometry = (value) => {
    if (!value) return null;
    let parsed = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (error) {
        console.warn('[ASSETS] No se pudo parsear string de polígono:', error);
        return null;
      }
    }

    if (parsed?.type === 'FeatureCollection') {
      const firstFeature = parsed.features?.[0];
      return firstFeature?.geometry || null;
    }

    if (parsed?.type === 'Feature' && parsed.geometry) {
      return parsed.geometry;
    }

    if (parsed?.type && parsed?.coordinates) {
      return parsed;
    }

    return null;
  };

  const polygonOverrideEnabled = process.env.AXSOL_POLYGON_OVERRIDE === 'true';
  const polygonOverridePath = process.env.AXSOL_POLYGON_OVERRIDE_PATH || DEFAULT_POLYGON_OVERRIDE_PATH;

  let polygonGeojson = null;
  if (polygonOverrideEnabled && fs.existsSync(polygonOverridePath)) {
    try {
      const polygonContent = fs.readFileSync(polygonOverridePath, 'utf-8');
      polygonGeojson = normalizePolygonGeometry(polygonContent);
      if (polygonGeojson) {
        console.log('[ASSETS] Polígono override cargado desde archivo. Tipo:', polygonGeojson.type);
      }
    } catch (error) {
      console.warn('[ASSETS] No se pudo leer/parsear polígono override. Se usará layout_geojson si existe.', error);
    }
  } else if (polygonOverrideEnabled) {
    console.warn('[ASSETS] Polígono override habilitado pero el archivo no existe en la ruta indicada:', polygonOverridePath);
  }

  if (!polygonGeojson && projectPolygonGeojson) {
    polygonGeojson = normalizePolygonGeometry(projectPolygonGeojson);
    if (polygonGeojson) {
      console.log('[ASSETS] Polígono obtenido desde project_polygon_geojson. Tipo:', polygonGeojson.type);
    }
  }

  if (!polygonGeojson && layout_geojson) {
    polygonGeojson = normalizePolygonGeometry(layout_geojson);
    if (polygonGeojson) {
      console.log('[ASSETS] Polígono obtenido desde layout_geojson. Tipo:', polygonGeojson.type);
    }
  }

  if (!polygonGeojson) {
    console.warn('[ASSETS] No se encontró polígono válido ni en la BD ni en override. La consulta externa se realizará sin polygon.');
  }

  const polygon = polygonGeojson ? encodeURIComponent(JSON.stringify(polygonGeojson)) : null;

  let apiUrl = `${api_base_url}/asset?project=${business_id}&types=${types}&from=${fromDate}&to=${toDate}`;
  if (polygon) {
    apiUrl += `&polygon=${polygon}`;
  }

  console.log('[ASSETS] URL de consulta final:', apiUrl);

  // 3. Realizar la llamada a la API externa
  console.log(`[ASSETS] Realizando llamada a la API externa: ${apiUrl}`);
  console.log(`[ASSETS] Headers de la petición:`, {
    'ax-api-key': process.env.AX_API_KEY ? `${process.env.AX_API_KEY.substring(0, 10)}...` : 'NO_KEY'
  });

  let externalData;
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'ax-api-key': process.env.AX_API_KEY,
      },
      timeout: 30000, // 30 segundos timeout
    });
    
    console.log(`[ASSETS] Respuesta externa exitosa. Status: ${response.status}`);
    console.log(`[ASSETS] Tamaño de respuesta: ${JSON.stringify(response.data).length} caracteres`);
    console.log(`[ASSETS] Estructura de respuesta:`, {
      isArray: Array.isArray(response.data),
      keys: typeof response.data === 'object' ? Object.keys(response.data) : 'not_object',
      deliveriesCount: response.data?.deliveries?.length || 'no_deliveries_key'
    });
    
    externalData = response.data;
  } catch (error) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const message = error.response?.data || error.message;
    const isTimeout = error.code === 'ECONNABORTED';
    
    console.error(`[ASSETS] ❌ Falló la consulta externa:`);
    console.error(`[ASSETS] Status: ${status || 'sin status'} (${statusText || 'sin statusText'})`);
    console.error(`[ASSETS] Timeout: ${isTimeout}`);
    console.error(`[ASSETS] Message:`, message);
    console.error(`[ASSETS] Full error:`, {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname
    });
    
    return { deliveries: [], projectDetails, externalError: { status, message, isTimeout } };
  }

  // 4. Normalizar los datos: usar flatMap para crear un asset por cada archivo compatible
  const extractDeliveriesArray = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.deliveries)) {
      return payload.deliveries;
    }

    if (Array.isArray(payload?.deliveries?.entregas)) {
      return payload.deliveries.entregas;
    }

    if (Array.isArray(payload?.data?.deliveries)) {
      return payload.data.deliveries;
    }

    return [];
  };

  const deliveriesRaw = extractDeliveriesArray(externalData);
  
  console.log(`[ASSETS] Extrayendo deliveries de la respuesta...`);
  console.log(`[ASSETS] deliveriesRaw type:`, Array.isArray(deliveriesRaw) ? 'array' : typeof deliveriesRaw);
  console.log(`[ASSETS] deliveriesRaw length:`, deliveriesRaw?.length || 'no_length');
  
  if (Array.isArray(deliveriesRaw) && deliveriesRaw.length > 0) {
    console.log(`[ASSETS] Primera delivery structure:`, {
      keys: Object.keys(deliveriesRaw[0] || {}),
      hasAssets: Array.isArray(deliveriesRaw[0]?.assets),
      assetsCount: deliveriesRaw[0]?.assets?.length || 'no_assets'
    });
  }

  if (!Array.isArray(deliveriesRaw) || deliveriesRaw.length === 0) {
    console.warn('[ASSETS] ⚠️ La respuesta externa no contiene entregas válidas.');
    console.warn('[ASSETS] Respuesta completa:', JSON.stringify(externalData, null, 2));
    return { deliveries: [], projectDetails, externalError: { status: 'empty_deliveries', rawResponse: externalData } };
  }

  const deliveries = deliveriesRaw.flatMap((delivery, deliveryIndex) => {
    if (!Array.isArray(delivery?.assets)) {
      return [];
    }

    return delivery.assets.flatMap((asset, assetIndex) => {
      if (!Array.isArray(asset?.data)) {
        return [];
      }

      const assetType = asset.type;

      return asset.data.map((item, itemIndex) => {
        let normalizedType;
        switch (assetType) {
          case 'tileset':
          case '3dtile':
            normalizedType = '3dtile';
            break;
          case 'image360':
          case 'images360':
            normalizedType = 'images360';
            break;
          case 'image':
          case 'images':
            normalizedType = 'images';
            break;
          default:
            return null;
        }

        const metadata = item.metadata || {};
        const locationCoords = Array.isArray(delivery.location?.coordinates)
          ? delivery.location.coordinates
          : [];

        const longitude = metadata.longitude ?? metadata.lon ?? locationCoords[0];
        const latitude = metadata.latitude ?? metadata.lat ?? locationCoords[1];
        const altitude = metadata.abs_alt ?? metadata.rel_alt ?? metadata.alt ?? null;

        const assetId = item.asset_id || metadata.cesium_asset_id || metadata.asset_id || metadata.ion_asset_id;
        const cesiumToken = item.cesium_token || metadata.cesium_token || metadata.token;

        const availability = item.availability || asset.availability || delivery.availability || null;

        return {
          id: item.id || `${delivery._id || deliveryIndex}-${assetIndex}-${itemIndex}`,
          delivery_id: delivery._id,
          name: item.name || asset.name || delivery.name,
          date: delivery.date,
          asset_type: normalizedType,
          asset_id: assetId,
          cesium_token: cesiumToken,
          url: item.url,
          metadata,
          lon: longitude,
          lat: latitude,
          alt: altitude,
          availability,
          provider: item.provider || metadata.provider,
        };
      }).filter(Boolean);
    });
  });

  console.log(`[ASSETS] ✅ ${deliveries.length} assets normalizados obtenidos.`);
  
  // Log de resumen por tipo
  const assetsByType = deliveries.reduce((acc, asset) => {
    acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`[ASSETS] Resumen por tipo:`, assetsByType);
  
  if (deliveries.length > 0) {
    console.log(`[ASSETS] Primer asset de ejemplo:`, {
      id: deliveries[0].id,
      name: deliveries[0].name,
      asset_type: deliveries[0].asset_type,
      asset_id: deliveries[0].asset_id,
      date: deliveries[0].date,
      hasUrl: !!deliveries[0].url,
      hasCoords: !!(deliveries[0].lon && deliveries[0].lat)
    });
  }
  
  return { deliveries, projectDetails };
};

module.exports = { fetchAndNormalizeAssets };
