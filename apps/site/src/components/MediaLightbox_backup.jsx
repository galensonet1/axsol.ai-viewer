import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Captions, Fullscreen, Thumbnails, Zoom } from 'yet-another-react-lightbox/plugins';
import { Tooltip, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SubtitlesOutlinedIcon from '@mui/icons-material/SubtitlesOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CollectionsIcon from '@mui/icons-material/Collections';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CropIcon from '@mui/icons-material/Crop';
import PannellumViewerSlide from './PannellumViewerSlide';
import ImageCropper from './ImageCropper';
import { trackEvent, trackFeatureFirstUse } from '../utils/analytics';
import './MediaLightbox.css';

export default function MediaLightbox({ open, onClose, slides, index = 0, onIndexChange }) {
  const [currentIndex, setCurrentIndex] = React.useState(index);
  const [captionsOn, setCaptionsOn] = React.useState(true);
  const [thumbsOn, setThumbsOn] = React.useState(true);
  const [zoomOn, setZoomOn] = React.useState(false);
  const [fsOn, setFsOn] = React.useState(false);
  const [cropping, setCropping] = React.useState(false);

  const currentSlide = slides?.[currentIndex] || {};
  const isPanorama = React.useMemo(
    () => !!(currentSlide?.axType === 'panorama' || currentSlide?.type === 'panorama'),
    [currentSlide]
  );

  const pluginsToUse = React.useMemo(
    () => (isPanorama ? [Captions] : [Captions, Fullscreen, Zoom, Thumbnails]),
    [isPanorama]
  );

  const slidesCount = Array.isArray(slides) ? slides.length : 0;

  // All useCallback hooks
  const handleClose = React.useCallback(() => {
    // 📊 ANALYTICS: Track lightbox close
    trackEvent('media_lightbox_closed', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: currentSlide?.src,
      media_title: currentSlide?.title,
      fecha_captura: currentSlide?.fechaCaptura,
      slide_index: currentIndex,
      total_slides: slides?.length || 0,
      time_viewed: Date.now() - (window.lightboxOpenTime || Date.now())
    });
    
    if (onClose) onClose();
  }, [isPanorama, currentSlide, currentIndex, slides, onClose]);

  const handleView = React.useCallback(({ index }) => {
    setCurrentIndex(index);
    if (onIndexChange) onIndexChange(index);
    
    // 📊 ANALYTICS: Track media view
    const currentSlide = slides?.[index] || {};
    const mediaType = currentSlide.axType === 'panorama' || currentSlide.type === 'panorama' 
      ? 'photo360' 
      : 'photo';
    
    trackEvent('media_lightbox_media_view', {
      media_type: mediaType,
      media_id: currentSlide.id || `slide_${index}`,
      media_url: currentSlide.src,
      media_title: currentSlide.title,
      fecha_captura: currentSlide.fechaCaptura,
      slide_index: index,
      total_slides: slides?.length || 0
    });
  }, [onIndexChange, slides]);

  const handleDownload = React.useCallback(() => {
    const url = currentSlide?.src;
    if (!url) return;
    
    // 📊 ANALYTICS: Track download
    trackEvent('media_downloaded', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: url,
      media_title: currentSlide?.title,
      fecha_captura: currentSlide?.fechaCaptura
    });
    
    const a = document.createElement('a');
    a.href = url;
    a.download = currentSlide?.title || 'image.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [currentSlide, isPanorama, currentIndex]);

  const toggleFullscreen = React.useCallback(() => {
    try {
      const container = document.querySelector('.yarl__portal');
      const isEnteringFullscreen = !document.fullscreenElement;
      
      if (isEnteringFullscreen) {
        container?.requestFullscreen?.();
        setFsOn(true);
      } else {
        document.exitFullscreen?.();
        setFsOn(false);
      }
      
      // 📊 ANALYTICS: Track fullscreen toggle
      trackEvent('media_fullscreen_toggled', {
        media_type: isPanorama ? 'photo360' : 'photo',
        media_id: currentSlide?.id || `slide_${currentIndex}`,
        media_url: currentSlide?.src,
        fullscreen_state: isEnteringFullscreen ? 'entered' : 'exited',
        fecha_captura: currentSlide?.fechaCaptura
      });
    } catch {}
  }, [isPanorama, currentSlide, currentIndex]);

  const toggleZoom = React.useCallback(() => {
    const wasZoomed = zoomOn;
    
    try {
      const img = document.querySelector('.yarl__slide_image');
      if (img) {
        const evt = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
        img.dispatchEvent(evt);
      }
    } catch {}
    
    setZoomOn((v) => {
      const newZoomState = !v;
      
      // 📊 ANALYTICS: Track zoom events
      trackEvent(newZoomState ? 'media_zoomed_in' : 'media_zoomed_out', {
        media_type: isPanorama ? 'photo360' : 'photo',
        media_id: currentSlide?.id || `slide_${currentIndex}`,
        media_url: currentSlide?.src,
        media_title: currentSlide?.title,
        fecha_captura: currentSlide?.fechaCaptura,
        zoom_state: newZoomState ? 'in' : 'out'
      });
      
      return newZoomState;
    });
  }, [zoomOn, isPanorama, currentSlide, currentIndex]);


  const toggleCaptions = React.useCallback(() => setCaptionsOn((v) => !v), []);
  const toggleThumbs = React.useCallback(() => setThumbsOn((v) => !v), []);
  const toggleCrop = React.useCallback(() => setCropping((v) => !v), []);

  React.useEffect(() => {
    document.body.classList.toggle('axslb-panorama', isPanorama);
    return () => {
      document.body.classList.remove('axslb-panorama');
    };
  }, [isPanorama]);

  React.useEffect(() => {
    const isSingle = slidesCount <= 1;
    document.body.classList.toggle('axslb-single', isSingle);
    return () => {
      document.body.classList.remove('axslb-single');
    };
  }, [slidesCount]);

  const topToolbarButtons = React.useMemo(() => {
    const items = [];
    if (!isPanorama) {
      items.push(
        <Tooltip key="download-top" title="Descargar" placement="left">
          <IconButton size="small" onClick={handleDownload} className="axslb-icon-btn">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    items.push('close');
    return items;
  }, [isPanorama, handleDownload]);

  return (
    <Lightbox
      open={open}
      close={handleClose}
      slides={(slides || []).map(s => ({ ...s, type: s.type || 'image' }))}
      index={currentIndex}
      on={{ view: handleView }}
      styles={{
        container: {
          width: 'min(70vw, calc(100vw - 24px))',
          height: 'min(70vh, calc(100vh - 24px))',
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100vh - 24px)',
          margin: '0 auto',
        },
      }}
      toolbar={{ buttons: topToolbarButtons }}
      plugins={pluginsToUse}
      thumbnails={{ position: 'bottom' }}
      captions={{ descriptionTextAlign: 'center' }}
      render={{
        slide: ({ slide }) => {
          if (cropping && slide?.type === 'image') {
            return (
              <ImageCropper
                src={slide.src}
                onSave={() => setCropping(false)}
                onCancel={() => setCropping(false)}
              />
            );
          }
          if (slide?.axType === 'panorama' || slide?.type === 'panorama') {
            return <PannellumViewerSlide src={slide.src} title={slide.title} />;
          }
          // fallback a slide por defecto
          return undefined;
        },
        toolbar: () => (
          <>
            <div className="axslb-toolbar">
              <Tooltip title={captionsOn ? 'Ocultar leyendas' : 'Mostrar leyendas'} placement="top">
                <IconButton size="small" onClick={toggleCaptions} className="axslb-icon-btn"><SubtitlesOutlinedIcon fontSize="small" /></IconButton>
              </Tooltip>
              {!isPanorama && (
                <>
                  <Tooltip title="Descargar" placement="top">
                    <IconButton size="small" onClick={handleDownload} className="axslb-icon-btn"><DownloadIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={fsOn ? 'Salir pantalla completa' : 'Pantalla completa'} placement="top">
                    <IconButton size="small" onClick={toggleFullscreen} className="axslb-icon-btn">{fsOn ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}</IconButton>
                  </Tooltip>
                  <Tooltip title={thumbsOn ? 'Ocultar miniaturas' : 'Mostrar miniaturas'} placement="top">
                    <IconButton size="small" onClick={toggleThumbs} className="axslb-icon-btn"><CollectionsIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={zoomOn ? 'Reducir' : 'Zoom'} placement="top">
                    <IconButton size="small" onClick={toggleZoom} className="axslb-icon-btn">{zoomOn ? <ZoomOutIcon fontSize="small" /> : <ZoomInIcon fontSize="small" />}</IconButton>
                  </Tooltip>
                  {!isPanorama && (
                    <Tooltip title={cropping ? 'Salir recorte' : 'Recortar'} placement="top">
                      <IconButton size="small" onClick={toggleCrop} className="axslb-icon-btn"><CropIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </div>
          </>
        ),
      }}
    />
  );
}
