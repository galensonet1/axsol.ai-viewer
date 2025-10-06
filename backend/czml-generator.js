const PHOTO_BILLBOARD_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M22 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.4l1.4-2h8.4l1.4 2H22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z'/%3e%3ccircle cx='13' cy='14' r='4'/%3e%3c/g%3e%3c/svg%3e";
const PHOTO_360_BILLBOARD_SVG = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='14' cy='14' r='4'/%3e%3cpath d='M5 9.5c2.2-2.3 5.4-3.5 9-3.5s6.8 1.2 9 3.5'/%3e%3cpath d='M23 18.5c-2.2 2.3-5.4 3.5-9 3.5s-6.8-1.2-9-3.5'/%3e%3cpath d='M6.5 11.5L4 9'/%3e%3cpath d='M6.5 16.5 4 19'/%3e%3cpath d='M21.5 11.5 24 9'/%3e%3cpath d='M21.5 16.5 24 19'/%3e%3cpath d='M10.5 14h7'/%3e%3c/g%3e%3c/svg%3e";

function createDocumentPacket(name, projectStartDate, projectEndDate, { includeClock = true } = {}) {
  const packet = {
    id: 'document',
    name,
    version: '1.0',
  };

  if (includeClock) {
    packet.clock = {
      interval: `${projectStartDate.toISOString()}/${projectEndDate.toISOString()}`,
      currentTime: projectStartDate.toISOString(),
      multiplier: 86400,
      range: 'LOOP_STOP',
    };
  }

  return packet;
}

function generateCzmlFor3DTiles(deliveries, projectStartDate, projectEndDate) {
  const documentPacket = createDocumentPacket('CZML 3D Tiles', projectStartDate, projectEndDate);

  const tilesetDeliveries = (deliveries || [])
    .filter(d => d.asset_type === '3dtile')
    .filter(d => d.files?.[0]?.url || d.url)
    .sort((a, b) => new Date(a.date || projectStartDate) - new Date(b.date || projectStartDate));

  if (tilesetDeliveries.length === 0) {
    return [documentPacket];
  }

  const packets = tilesetDeliveries.map((delivery, index) => {
    const uri = delivery.files?.[0]?.url || delivery.url;
    const start = new Date(delivery.date || projectStartDate).toISOString();
    const end = index < tilesetDeliveries.length - 1
      ? new Date(tilesetDeliveries[index + 1].date || projectEndDate).toISOString()
      : projectEndDate.toISOString();

    return {
      id: `3dtile-${delivery.id || index}`,
      name: delivery.name || `3D Tiles ${index + 1}`,
      availability: `${start}/${end}`,
      tileset: {
        uri,
        show: true,
      },
    };
  });

  return [documentPacket, ...packets];
}

function buildBillboardPacket({ id, name, lon, lat, height, start, end, url, is360 }) {
  return {
    id,
    name,
    availability: `${start}/${end}`,
    position: {
      cartographicDegrees: [lon, lat, height ?? 0],
    },
    billboard: {
      image: is360 ? PHOTO_360_BILLBOARD_SVG : PHOTO_BILLBOARD_SVG,
      scale: is360 ? 0.8 : 0.65,
      verticalOrigin: 'BOTTOM',
      show: true,
    },
    description: `<img src='${url}' style='max-width:100%;max-height:400px;display:block;margin:auto;'>`,
  };
}

const startOfDayUtc = (value, fallback) => {
  const date = value ? new Date(value) : fallback ? new Date(fallback) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallback ? new Date(fallback) : null;
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDayUtc = (value, fallback) => {
  const date = value ? new Date(value) : fallback ? new Date(fallback) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return fallback ? new Date(fallback) : null;
  }
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

function resolveTimestamp(delivery, fallbackDate, { startOfDay = false, endOfDay = false } = {}) {
  const metadata = delivery.metadata || {};
  const ts = delivery.date || delivery.captured_at || metadata.captured_at;
  if (!ts) {
    const fallback = new Date(fallbackDate);
    if (startOfDay) {
      fallback.setUTCHours(0, 0, 0, 0);
    }
    if (endOfDay) {
      fallback.setUTCHours(23, 59, 59, 999);
    }
    return fallback.toISOString();
  }

  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return resolveTimestamp({ metadata: {} }, fallbackDate, { startOfDay, endOfDay });
  }

  if (startOfDay) {
    date.setUTCHours(0, 0, 0, 0);
  }

  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function resolveCoordinates(delivery) {
  const metadata = delivery.metadata || {};
  const lon = metadata.longitude ?? metadata.lon ?? delivery.longitude ?? delivery.lon;
  const lat = metadata.latitude ?? metadata.lat ?? delivery.latitude ?? delivery.lat;
  const alt = metadata.abs_alt ?? metadata.rel_alt ?? metadata.alt ?? delivery.altitude ?? delivery.alt;
  return { lon, lat, alt };
}

function generateCzmlForImages(deliveries, projectStartDate, projectEndDate) {
  const documentPacket = createDocumentPacket('CZML Images', projectStartDate, projectEndDate, { includeClock: false });

  if (!Array.isArray(deliveries) || deliveries.length === 0) {
    return [documentPacket];
  }

  const packets = [];
  const seenIds = new Set();

  const buildEntityId = (assetType, asset, fallbackIndex) => {
    const baseProjectId = asset.project_id || asset.project || 'proyecto';
    const prefix = `${baseProjectId}_${assetType}_`;

    const candidateOrder = fallbackIndex;
    let candidateId = `${prefix}${candidateOrder}`;

    if (asset.id) {
      candidateId = `${prefix}${asset.id}`;
    }

    let counter = 0;
    let uniqueId = candidateId;
    while (seenIds.has(uniqueId)) {
      counter += 1;
      uniqueId = `${candidateId}_${counter}`;
    }

    seenIds.add(uniqueId);
    return uniqueId;
  };

  const groupByType = {
    images: [],
    images360: [],
  };

  deliveries.forEach((asset) => {
    if (!asset) {
      return;
    }
    const assetType = asset.asset_type === 'images360' ? 'images360' : 'images';
    groupByType[assetType].push(asset);
  });

  const types = Object.keys(groupByType);

  types.forEach((assetType) => {
    const assets = groupByType[assetType]
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.date || a.captured_at || a.metadata?.captured_at || projectStartDate);
        const bTime = new Date(b.date || b.captured_at || b.metadata?.captured_at || projectStartDate);
        return aTime - bTime;
      });

    assets.forEach((asset, index) => {
      const captureTimestamp = asset.date || asset.captured_at || asset.metadata?.captured_at;
      const startDate = startOfDayUtc(captureTimestamp, projectStartDate) || startOfDayUtc(projectStartDate);

      let endDate = null;
      const nextAsset = assets[index + 1];

      if (nextAsset) {
        const nextCaptureTimestamp = nextAsset.date || nextAsset.captured_at || nextAsset.metadata?.captured_at;
        const nextStartDate = startOfDayUtc(nextCaptureTimestamp, projectEndDate);
        if (nextStartDate) {
          endDate = new Date(nextStartDate);
          endDate.setUTCDate(endDate.getUTCDate() - 1);
          endDate.setUTCHours(23, 59, 59, 999);

          if (startDate && endDate < startDate) {
            endDate = endOfDayUtc(startDate);
          }
        }
      }

      if (!endDate) {
        endDate = endOfDayUtc(projectEndDate) || (startDate ? endOfDayUtc(startDate) : new Date(projectEndDate));
      }

      const startIso = (startDate || new Date(projectStartDate)).toISOString();
      const endIso = endDate.toISOString();

      const baseNamePrefix = assetType === 'images360' ? 'Foto360' : 'Foto';

      if (Array.isArray(asset.files) && asset.files.length > 0) {
        asset.files.forEach((file, fileIndex) => {
          const { lon, lat, alt } = resolveCoordinates(file);
          if (lon === undefined || lat === undefined) {
            return;
          }
          const entityId = buildEntityId(assetType, asset, `${index}-${fileIndex}`);
          const entityName = `${baseNamePrefix} ${packets.length}`;
          packets.push(buildBillboardPacket({
            id: entityId,
            name: entityName,
            lon,
            lat,
            height: alt,
            start: startIso,
            end: endIso,
            url: file.url,
            is360: assetType === 'images360',
          }));
        });
        return;
      }

      const { lon, lat, alt } = resolveCoordinates(asset);
      if (lon === undefined || lat === undefined) {
        return;
      }

      const entityId = buildEntityId(assetType, asset, `${index}`);
      const entityName = `${baseNamePrefix} ${packets.length}`;
      packets.push(buildBillboardPacket({
        id: entityId,
        name: entityName,
        lon,
        lat,
        height: alt,
        start: startIso,
        end: endIso,
        url: asset.url,
        is360: assetType === 'images360',
      }));
    });
  });

  if (packets.length === 0) {
    return [documentPacket];
  }

  return [documentPacket, ...packets];
}

module.exports = {
  generateCzmlFor3DTiles,
  generateCzmlForImages,
};
