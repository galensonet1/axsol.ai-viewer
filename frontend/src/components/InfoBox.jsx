import React from 'react';
import { Box, Paper, Typography, IconButton, Divider, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MediaLightbox from './MediaLightbox';
import { useProject } from '../context/ProjectContext';
import './InfoBox.css';

const InfoBox = ({ selectedElement, onClose }) => {
  console.log('[InfoBox] Rendering with selectedElement:', selectedElement);
  
  if (!selectedElement) {
    console.log('[InfoBox] No selectedElement, returning null');
    return null;
  }

  const renderContent = () => {
    switch (selectedElement.type) {
      case 'photo':
        return <PhotoContent data={selectedElement.data} entity={selectedElement.entity} />;
      case 'photo360':
        return <Photo360Content data={selectedElement.data} />;
      case 'ifc':
        return <IFCContent data={selectedElement.data} />;
      case 'activity':
        return <ActivityContent data={selectedElement.data} />;
      default:
        return <DefaultContent data={selectedElement.data} />;
    }
  };

  const getIcon = () => {
    switch (selectedElement.type) {
      case 'photo':
        return <PhotoCameraIcon fontSize="small" />;
      case 'photo360':
        return <ViewInArIcon fontSize="small" />;
      case 'ifc':
        return <AccountBalanceIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (selectedElement.type) {
      case 'photo':
        return 'Fotografía';
      case 'photo360':
        return 'Foto 360°';
      case 'ifc':
        return 'Elemento IFC';
      case 'activity':
        return selectedElement?.data?.name || 'Plan de Actividades';
      default:
        return 'Información';
    }
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      try {
        const lbOpen = typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('axslb-open');
        if (lbOpen) return;
        if (onClose) onClose();
      } catch {}
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); };
  }, [onClose]);

  return (
    <Box className="info-box">
      <Paper elevation={6} className="info-box-surface">
        <Box className="info-box-header">
          <Box className="info-box-title">
            {getIcon()}
            <Typography variant="subtitle2" className="info-box-title-text">
              {getTitle()}
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={onClose}
            className="info-box-close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Box className="info-box-content">
          {renderContent()}
        </Box>
      </Paper>
    </Box>
  );
};

// Componente para contenido de fotografías simplificado
const PhotoContent = ({ data, entity }) => {
  console.log('[PhotoContent] Renderizando con data:', data);
  const { projectId } = useProject();
  
  // Validar que tenemos datos básicos
  if (!data) {
    return (
      <Box className="photo-content">
        <Box className="photo-placeholder">
          <PhotoCameraIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
          <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '8px' }}>
            No se encontraron datos de la foto
          </Typography>
        </Box>
      </Box>
    );
  }

  

  const withWidthParam = (url, width) => {
    if (!url) return url;
    const hasQuery = url.includes('?');
    const join = hasQuery ? '&' : '?';
    // Evitar duplicar width
    if (/([?&])width=/.test(url)) return url;
    return `${url}${join}width=${width}`;
  };

  const isPanoramaUrl = (u) => typeof u === 'string' && /images360/i.test(u);

  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const [nearby, setNearby] = React.useState([]);
  const images = React.useMemo(() => {
    if (Array.isArray(nearby) && nearby.length > 0) return nearby;
    if (Array.isArray(data.galleryImages) && data.galleryImages.length > 0) return data.galleryImages;
    return [data.thumbnail].filter(Boolean);
  }, [nearby, data.galleryImages, data.thumbnail]);
  const collectNearbyUrls = React.useCallback(() => {
    try {
      const viewer = window.cesiumViewer;
      if (!viewer || !entity) return [];
      const results = [];
      const seen = new Set();
      const add = (url, d) => { if (url && !seen.has(url)) { seen.add(url); results.push({ url, d }); } };
      if (data.thumbnail) add(data.thumbnail, 0);
      const getPos = (ent) => { try { return ent?.position?.getValue?.(); } catch { return null; } };
      const targetPos = getPos(entity);
      const dsCol = viewer.dataSources;
      const len = typeof dsCol.length === 'number' ? dsCol.length : (dsCol?._dataSources?.length || 0);
      const getDs = (i) => (typeof dsCol.get === 'function' ? dsCol.get(i) : dsCol?._dataSources?.[i]);
      for (let i = 0; i < len; i++) {
        const ds = getDs(i);
        const ents = ds?.entities?.values || [];
        for (let j = 0; j < ents.length; j++) {
          const e = ents[j];
          if (!e || e === entity) continue;
          if (!e.billboard) continue;
          const pos = getPos(e);
          if (!pos || !targetPos) continue;
          let d = 0;
          try { d = window.Cesium?.Cartesian3?.distance?.(targetPos, pos) || 0; } catch {}
          if (d <= 10) {
            let url = null;
            try {
              let desc = null;
              if (e.description) desc = e.description.getValue ? e.description.getValue() : e.description;
              if (desc) {
                const m1 = desc.match(/src=['"]([^'"]+)['"]/i);
                const m2 = desc.match(/(https?:\/\/[^\s<>'\"]+\.(jpg|jpeg|png|gif|webp))/i);
                if (m1 && m1[1]) url = m1[1];
                else if (m2 && m2[1]) url = m2[1];
              }
              if (!url && e.properties) {
                const p = e.properties;
                const gv = (k) => { try { return p[k]?.getValue?.() ?? p[k]; } catch { return null; } };
                url = gv('thumbnail') || gv('image') || gv('url');
              }
            } catch {}
            if (url) add(url, d);
          }
        }
      }
      results.sort((a, b) => a.d - b.d);
      return results.map(r => r.url);
    } catch { return []; }
  }, [entity, data.thumbnail]);

  const collectNearbyFromLoadedBillboards = React.useCallback(() => {
    try {
      const arr = window.loadedBillboards;
      const Cesium = window.Cesium;
      const eid = entity?.id;
      if (!Array.isArray(arr) || arr.length === 0 || !Cesium || !eid) return [];
      const clicked = arr.find(b => b && b.id === eid);
      if (!clicked || !clicked.position) return [];
      const nearbyPhotos = arr.filter(b => {
        if (!b || !b.position || b.id === eid) return false;
        try {
          const d = Cesium.Cartesian3.distance(clicked.position, b.position);
          return d <= 10.0;
        } catch { return false; }
      });
      const galleryPhotos = [clicked, ...nearbyPhotos].map(p => ({ href: p.url, fechaCaptura: p.fechaCaptura }));
      console.log('[PhotoContent] Fotos cercanas (loadedBillboards):', galleryPhotos);
      return galleryPhotos.map(p => p.href).filter(Boolean);
    } catch (e) {
      console.warn('[PhotoContent] Error en collectNearbyFromLoadedBillboards:', e);
      return [];
    }
  }, [entity]);

  const openGallery = async () => {
    // 1) Priorizar función probada del legacy: window.abrirGaleriaFotosCercanas
    try {
      if (typeof window.abrirGaleriaFotosCercanas === 'function' && entity?.id) {
        const gallery = window.abrirGaleriaFotosCercanas(entity.id);
        console.log('[PhotoContent] Fotos cercanas (window.abrirGaleriaFotosCercanas):', gallery);
        const urlsWindow = Array.isArray(gallery) ? gallery.map((it) => it?.href).filter(Boolean) : [];
        if (urlsWindow.length > 0) {
          setNearby(urlsWindow);
          setGalleryIndex(0);
          setGalleryOpen(true);
          return;
        }
      }
    } catch (e) {
      console.warn('[PhotoContent] Error llamando abrirGaleriaFotosCercanas:', e);
    }

    // 2) Intentar con loadedBillboards directamente
    const lbUrls = collectNearbyFromLoadedBillboards();
    if (Array.isArray(lbUrls) && lbUrls.length > 0) {
      setNearby(lbUrls);
      setGalleryIndex(0);
      setGalleryOpen(true);
      return;
    }
    // 3) Backend (si hay coords) como respaldo
    try {
      const getAltFromEntity = () => {
        try {
          const Cesium = window.Cesium;
          const pos = entity?.position?.getValue?.();
          if (!Cesium || !pos) return null;
          const carto = Cesium.Cartographic.fromCartesian(pos);
          return carto?.height ?? null;
        } catch { return null; }
      };
      const lat = data?.coordinates?.lat;
      const lon = data?.coordinates?.lon;
      const alt = getAltFromEntity();
      if (projectId && typeof lat === 'number' && typeof lon === 'number') {
        const params = new URLSearchParams();
        params.set('lat', String(lat));
        params.set('lon', String(lon));
        if (typeof alt === 'number') params.set('alt', String(alt));
        params.set('radius', '10');
        params.set('types', 'images,images360');
        const url = `/api/projects/${encodeURIComponent(projectId)}/photos/nearby?${params.toString()}`;
        const resp = await fetch(url);
        const json = await resp.json();
        const backendUrls = Array.isArray(json?.items) ? json.items.map((it) => it.url).filter(Boolean) : [];
        console.log('[PhotoContent] Fotos cercanas (backend):', json);
        if (backendUrls.length > 0) {
          setNearby(backendUrls);
          setGalleryIndex(0);
          setGalleryOpen(true);
          return;
        }
      }
    } catch (e) {
      console.warn('[PhotoContent] Error consultando backend nearby, usando fallback local:', e);
    }
    // 4) Fallback local usando dataSources si nada anterior funcionó
    const fallbackUrls = collectNearbyUrls();
    console.log('[PhotoContent] Fotos cercanas (fallback local):', fallbackUrls);
    if (Array.isArray(fallbackUrls) && fallbackUrls.length) setNearby(fallbackUrls);
    setGalleryIndex(0);
    setGalleryOpen(true);
  };
  const closeGallery = () => setGalleryOpen(false);

  return (
    <Box className="photo-content">
      {/* Foto principal */}
      <Box className="photo-gallery">
        <Box className="photo-main">
          {data.thumbnail ? (
            <img src={withWidthParam(data.thumbnail, 200)} alt={data.name || 'Fotografía'} />
          ) : (
            <Box className="photo-placeholder">
              <PhotoCameraIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
              <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '8px' }}>
                No se encontraron datos de la foto
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Botones de acción */}
      <Box className="photo-actions">
        <Button
          variant="outlined"
          size="small"
          onClick={openGallery}
          className="action-button action-button--accent"
        >
          Ampliar
        </Button>
      </Box>

      {/* Información de la foto */}
      <Box className="photo-info">
        {data.name && (
          <Typography variant="body2" className="info-item">
            <strong>Nombre:</strong> {data.name}
          </Typography>
        )}
        {data.date && (
          <Typography variant="body2" className="info-item">
            <strong>Fecha:</strong> {new Date(data.date).toLocaleDateString('es-AR')}
          </Typography>
        )}
        {data.coordinates && (
          <Typography variant="body2" className="info-item">
            <strong>Coordenadas:</strong> {data.coordinates.lat?.toFixed(6)}, {data.coordinates.lon?.toFixed(6)}
          </Typography>
        )}
        {typeof data.relativeAltitude === 'number' && (
          <Typography variant="body2" className="info-item">
            <strong>Altura relativa:</strong> {data.relativeAltitude.toFixed(2)} m
          </Typography>
        )}
        {data.description && (
          <Typography variant="body2" className="info-item">
            <strong>Descripción:</strong> {data.description}
          </Typography>
        )}
      </Box>

      <MediaLightbox
        open={galleryOpen}
        onClose={closeGallery}
        slides={images.map((src) => (isPanoramaUrl(src)
          ? { src, axType: 'panorama', title: data.name }
          : { src, type: 'image', title: data.name }
        ))}
        index={galleryIndex}
        onIndexChange={setGalleryIndex}
      />
    </Box>
  );
};

// Componente para contenido de fotos 360°
const Photo360Content = ({ data }) => {
  const withWidthParam = (url, width) => {
    if (!url) return url;
    const hasQuery = url.includes('?');
    const join = hasQuery ? '&' : '?';
    if (/([?&])width=/.test(url)) return url;
    return `${url}${join}width=${width}`;
  };
  const [open, setOpen] = React.useState(false);
  return (
    <Box className="photo360-content">
      {data.thumbnail && (
        <Box className="photo-thumbnail" onClick={() => setOpen(true)} style={{ cursor: 'zoom-in' }}>
          <img src={withWidthParam(data.thumbnail, 200)} alt="Vista previa 360°" />
          <Box className="photo360-badge">360°</Box>
        </Box>
      )}
      <Box className="photo-info">
        {data.name && (
          <Typography variant="body2" className="info-item">
            <strong>Nombre:</strong> {data.name}
          </Typography>
        )}
        {data.date && (
          <Typography variant="body2" className="info-item">
            <strong>Fecha:</strong> {new Date(data.date).toLocaleDateString('es-AR')}
          </Typography>
        )}
        {data.coordinates && (
          <Typography variant="body2" className="info-item">
            <strong>Coordenadas:</strong> {data.coordinates.lat?.toFixed(6)}, {data.coordinates.lon?.toFixed(6)}
          </Typography>
        )}
        {typeof data.relativeAltitude === 'number' && (
          <Typography variant="body2" className="info-item">
            <strong>Altura relativa:</strong> {data.relativeAltitude.toFixed(2)} m
          </Typography>
        )}
      </Box>
      <MediaLightbox
        open={open}
        onClose={() => setOpen(false)}
        slides={[{ src: data.thumbnail, axType: 'panorama', title: data.name }]}
        index={0}
      />
    </Box>
  );
};

// Componente para contenido de elementos IFC
const IFCContent = ({ data }) => (
  <Box className="ifc-content">
    <Box className="ifc-info">
      {data.name && (
        <Typography variant="body2" className="info-item">
          <strong>Elemento:</strong> {data.name}
        </Typography>
      )}
      {data.type && (
        <Typography variant="body2" className="info-item">
          <strong>Tipo:</strong> {data.type}
        </Typography>
      )}
      {data.material && (
        <Typography variant="body2" className="info-item">
          <strong>Material:</strong> {data.material}
        </Typography>
      )}
      {data.properties && Object.keys(data.properties).length > 0 && (
        <>
          <Typography variant="body2" className="info-section-title">
            <strong>Propiedades:</strong>
          </Typography>
          {Object.entries(data.properties).map(([key, value]) => (
            <Typography key={key} variant="body2" className="info-property">
              • {key}: {value}
            </Typography>
          ))}
        </>
      )}
    </Box>
  </Box>
);

// Componente para contenido por defecto
const DefaultContent = ({ data }) => (
  <Box className="default-content">
    <Typography variant="body2" className="info-item">
      Información del elemento seleccionado
    </Typography>
    {data && (
      <pre className="debug-data">
        {JSON.stringify(data, null, 2)}
      </pre>
    )}
  </Box>
);

export default InfoBox;

// Contenido para entidad de Plan de Actividades (CZML)
const ActivityContent = ({ data }) => {
  const safeHtml = (html) => ({ __html: String(html || '') });
  return (
    <Box className="activity-content">
      {data?.description ? (
        <div className="activity-description" dangerouslySetInnerHTML={safeHtml(data.description)} />
      ) : (
        <Typography variant="body2" className="info-item">
          Sin descripción disponible
        </Typography>
      )}
    </Box>
  );
};
