const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

/**
 * Upload an IFC file to Cesium Ion using the 3-step flow.
 * Steps:
 * 1) POST /v1/assets to create the asset and get temporary S3 credentials
 * 2) PUT object to S3 using the provided credentials
 * 3) POST onComplete URL with ETag and PartNumber
 *
 * @param {Object} params
 * @param {string} params.filePath - Local path of the IFC file
 * @param {string} params.fileName - Name to use for the asset and S3 object
 * @param {string} [params.inputCrs='EPSG:22182'] - CRS to pass to Ion options
 * @param {string} [params.description] - Optional description
 * @param {string} [params.token=process.env.CESIUM_ION_ACCESS_TOKEN] - Ion access token
 * @returns {Promise<{ assetId: number, etag: string }>} - The created Ion asset id
 */
async function uploadIfcToIon({ filePath, fileName, inputCrs = 'EPSG:22182', description, token = process.env.CESIUM_ION_ACCESS_TOKEN }) {
  if (!token) {
    throw new Error('CESIUM_ION_ACCESS_TOKEN no está configurado. Agrega la variable al .env del backend.');
  }

  const ASSETS_API_URL = 'https://api.cesium.com/v1/assets';

  // Paso 1: crear asset y obtener credenciales temporales
  const headers = { Authorization: `Bearer ${token}` };
  const payload = {
    name: fileName,
    description: description || `Archivo IFC subido desde backend: ${fileName}`,
    type: '3DTILES',
    options: {
      sourceType: 'BIM_CAD',
      inputCrs,
    },
  };

  let assetId;
  let uploadLocation;
  let onCompleteUrl;

  try {
    const resp = await axios.post(ASSETS_API_URL, payload, { headers });
    const data = resp.data || {};
    uploadLocation = data.uploadLocation;
    onCompleteUrl = data.onComplete?.url;
    assetId = data.assetMetadata?.id;

    if (!uploadLocation || !onCompleteUrl || !assetId) {
      throw new Error('Respuesta incompleta de Cesium Ion al iniciar el asset.');
    }
  } catch (err) {
    const body = err.response?.data;
    throw new Error(`Error creando asset en Ion: ${err.message} ${body ? JSON.stringify(body) : ''}`);
  }

  // Paso 2: subir a S3 con credenciales temporales
  const bucket = uploadLocation.bucket;
  const key = `${uploadLocation.prefix}${fileName}`;
  const region = uploadLocation.region || 'us-east-1';

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: uploadLocation.accessKey,
      secretAccessKey: uploadLocation.secretAccessKey,
      sessionToken: uploadLocation.sessionToken,
    },
  });

  let etag;
  try {
    const fileStream = fs.createReadStream(filePath);
    const put = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: 'application/octet-stream',
    });
    const result = await s3.send(put);
    etag = result.ETag;
    if (!etag) {
      throw new Error('S3 no devolvió ETag');
    }
  } catch (err) {
    throw new Error(`Error subiendo a S3: ${err.message}`);
  }

  // Paso 3: notificar finalización a Ion
  try {
    await axios.post(onCompleteUrl, { parts: [{ ETag: etag, PartNumber: 1 }] }, { headers });
  } catch (err) {
    const body = err.response?.data;
    throw new Error(`Error notificando onComplete en Ion: ${err.message} ${body ? JSON.stringify(body) : ''}`);
  }

  return { assetId, etag };
}

module.exports = {
  uploadIfcToIon,
  /**
   * Fetch Cesium Ion asset metadata for a given assetId
   * @param {number|string} assetId
   * @param {string} [token=process.env.CESIUM_ION_ACCESS_TOKEN]
   * @returns {Promise<object>} metadata
   */
  async getIonAssetMetadata(assetId, token = process.env.CESIUM_ION_ACCESS_TOKEN) {
    if (!token) throw new Error('CESIUM_ION_ACCESS_TOKEN no está configurado.');
    if (!assetId) throw new Error('assetId es requerido.');
    const url = `https://api.cesium.com/v1/assets/${assetId}`;
    const headers = { Authorization: `Bearer ${token}` };
    const resp = await axios.get(url, { headers });
    return resp.data;
  },
  /**
   * Delete a Cesium Ion asset by id
   * @param {number|string} assetId
   * @param {string} [token=process.env.CESIUM_ION_ACCESS_TOKEN]
   */
  async deleteIonAsset(assetId, token = process.env.CESIUM_ION_ACCESS_TOKEN) {
    if (!token) throw new Error('CESIUM_ION_ACCESS_TOKEN no está configurado.');
    if (!assetId) throw new Error('assetId es requerido.');
    const url = `https://api.cesium.com/v1/assets/${assetId}`;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(url, { headers });
      return true;
    } catch (err) {
      // Si el asset ya no existe, considerar como éxito idempotente
      if (err.response && (err.response.status === 404 || err.response.status === 410)) {
        return true;
      }
      throw err;
    }
  },
};
