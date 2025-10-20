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
import './MediaLightbox.css';

export default function MediaLightbox({ open, onClose, slides, index = 0, onIndexChange }) {
  const [currentIndex, setCurrentIndex] = React.useState(index);
  const [captionsOn, setCaptionsOn] = React.useState(true);
  const [thumbsOn, setThumbsOn] = React.useState(true);
  const [zoomOn, setZoomOn] = React.useState(false);
  const [fsOn, setFsOn] = React.useState(false);
  const [cropping, setCropping] = React.useState(false);

  React.useEffect(() => {
    if (open) setCurrentIndex(index);
  }, [open, index]);

  React.useEffect(() => {
    if (open) {
      document.body.classList.add('axslb-open');
    } else {
      document.body.classList.remove('axslb-open');
    }
    return () => {
      document.body.classList.remove('axslb-open');
    };
  }, [open]);

  React.useEffect(() => {
    document.body.classList.toggle('axslb-captions-hidden', !captionsOn);
  }, [captionsOn]);

  React.useEffect(() => {
    document.body.classList.toggle('axslb-thumbs-hidden', !thumbsOn);
  }, [thumbsOn]);

  React.useEffect(() => {
    document.body.classList.toggle('axslb-zoomed', zoomOn);
  }, [zoomOn]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        try { e.preventDefault(); } catch {}
        try { onClose && onClose(); } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleView = React.useCallback(({ index }) => {
    setCurrentIndex(index);
    if (onIndexChange) onIndexChange(index);
  }, [onIndexChange]);

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

  const handleDownload = React.useCallback(() => {
    const url = currentSlide?.src;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = currentSlide?.title || 'image.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [currentSlide]);

  const toggleFullscreen = React.useCallback(() => {
    try {
      const container = document.querySelector('.yarl__portal');
      if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
        setFsOn(true);
      } else {
        document.exitFullscreen?.();
        setFsOn(false);
      }
    } catch {}
  }, []);

  const toggleZoom = React.useCallback(() => {
    try {
      const img = document.querySelector('.yarl__slide_image');
      if (img) {
        const evt = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
        img.dispatchEvent(evt);
      }
    } catch {}
    setZoomOn((v) => !v);
  }, []);

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
      close={onClose}
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
