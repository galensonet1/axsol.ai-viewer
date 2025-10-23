import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { 
  Captions, 
  Download,
  Fullscreen, 
  Inline,
  Slideshow,
  Thumbnails, 
  Video,
  Zoom 
} from 'yet-another-react-lightbox/plugins';
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
import WebGL360Viewer from './WebGL360Viewer';
import ImageCropper from './ImageCropper';
import { trackEvent, trackFeatureFirstUse } from '../utils/analytics';
import './MediaLightbox.css';

export default function MediaLightbox({ open, onClose, slides, index = 0, onIndexChange }) {
  console.log('[MediaLightbox] 🚀 COMPONENTE RENDERIZADO - open:', open, 'slides:', slides?.length, 'currentIndex:', index);
  console.log('[MediaLightbox] Slide actual:', slides?.[index]);
  
  // All useState hooks
  const [currentIndex, setCurrentIndex] = React.useState(index);
  const [captionsOn, setCaptionsOn] = React.useState(true);
  const [thumbsOn, setThumbsOn] = React.useState(true);
  const [zoomOn, setZoomOn] = React.useState(false);
  const [fsOn, setFsOn] = React.useState(false);
  const [cropping, setCropping] = React.useState(false);

  // All useMemo hooks
  const currentSlide = React.useMemo(() => slides?.[currentIndex] || {}, [slides, currentIndex]);
  const isPanorama = React.useMemo(
    () => {
      const result = !!(currentSlide?.axType === 'panorama' || currentSlide?.type === 'panorama');
      console.log('[MediaLightbox] Slide actual:', currentSlide);
      console.log('[MediaLightbox] Es panorama:', result);
      return result;
    },
    [currentSlide]
  );
  const pluginsToUse = React.useMemo(
    () => {
      // Available plugins (excluding Counter and Share)
      const allPlugins = [
        Captions,
        Download,
        Fullscreen,
        Slideshow,
        Thumbnails,
        Video,
        Zoom
      ];
      
      // For panoramas, exclude some plugins that might not work well
      if (isPanorama) {
        return [Captions, Download, Slideshow];
      }
      
      // For regular images, use all plugins
      return allPlugins;
    },
    [isPanorama]
  );
  const slidesCount = React.useMemo(() => Array.isArray(slides) ? slides.length : 0, [slides]);

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
      total_slides: slidesCount,
      time_viewed: Date.now() - (window.lightboxOpenTime || Date.now())
    });
    
    if (onClose) onClose();
  }, [isPanorama, currentSlide, currentIndex, slidesCount, onClose]);

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
      total_slides: slidesCount
    });
  }, [onIndexChange, slides, slidesCount]);

  const handleDownload = React.useCallback(() => {
    const url = currentSlide?.src;
    if (!url) return;
    
    // ANALYTICS: Track download
    trackEvent('media_downloaded', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: url,
      media_title: currentSlide?.title,
      fecha_captura: currentSlide?.fechaCaptura,
      slide_index: currentIndex,
      total_slides: slidesCount
    });
    
    const link = document.createElement('a');
    link.href = url;
    link.download = currentSlide?.title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentSlide, currentIndex, slidesCount, isPanorama]);

  const handleThumbnailsToggle = React.useCallback((visible) => {
    trackEvent('media_thumbnails_toggled', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: currentSlide?.src,
      media_title: currentSlide?.title,
      thumbnails_visible: visible,
      slide_index: currentIndex,
      total_slides: slidesCount
    });
  }, [currentSlide, currentIndex, slidesCount, isPanorama]);

  const handleSlideshowToggle = React.useCallback((playing) => {
    trackEvent(playing ? 'media_slideshow_started' : 'media_slideshow_stopped', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: currentSlide?.src,
      media_title: currentSlide?.title,
      slide_index: currentIndex,
      total_slides: slidesCount
    });
  }, [currentSlide, currentIndex, slidesCount, isPanorama]);

  const handleToolbarButtonClick = React.useCallback((buttonType) => {
    trackEvent('media_toolbar_button_clicked', {
      media_type: isPanorama ? 'photo360' : 'photo',
      media_id: currentSlide?.id || `slide_${currentIndex}`,
      media_url: currentSlide?.src,
      media_title: currentSlide?.title,
      button_type: buttonType,
      slide_index: currentIndex,
      total_slides: slidesCount
    });
  }, [currentSlide, currentIndex, slidesCount, isPanorama]);

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
  }, [isPanorama, currentSlide, currentIndex]);

  const toggleCaptions = React.useCallback(() => setCaptionsOn((v) => !v), []);
  const toggleThumbs = React.useCallback(() => setThumbsOn((v) => !v), []);
  const toggleCrop = React.useCallback(() => setCropping((v) => !v), []);

  // All useEffect hooks
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(index);
      
      // Store open time for analytics
      window.lightboxOpenTime = Date.now();
      
      // 📊 ANALYTICS: Track media lightbox opened
      const currentSlide = slides?.[index] || {};
      const mediaType = currentSlide.axType === 'panorama' || currentSlide.type === 'panorama' 
        ? 'photo360' 
        : 'photo';
      
      trackEvent('media_lightbox_opened', {
        media_type: mediaType,
        media_id: currentSlide.id || `slide_${index}`,
        media_url: currentSlide.src,
        media_title: currentSlide.title,
        fecha_captura: currentSlide.fechaCaptura,
        source: 'entity_click',
        total_slides: slidesCount
      });
      
      // Track first use of photo360 viewer
      if (mediaType === 'photo360') {
        trackFeatureFirstUse('photo360_viewer', { 
          media_id: currentSlide.id 
        });
      }
    }
  }, [open, index, slides, slidesCount]);

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
        try { handleClose && handleClose(); } catch {}
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  React.useEffect(() => {
    document.body.classList.toggle('axslb-panorama', isPanorama);
    return () => {
      document.body.classList.remove('axslb-panorama');
    };
  }, [isPanorama]);

  // Agregar/remover clase cuando el lightbox se abre/cierra
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

  // Interceptar clicks en botones del toolbar para analytics
  React.useEffect(() => {
    if (!open) return;

    const handleToolbarClick = (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      // Detectar tipo de botón basado en clases CSS o contenido
      let buttonType = 'unknown';
      
      if (target.querySelector('[data-testid="ZoomInIcon"], [data-testid="ZoomOutIcon"]') || 
          target.textContent?.includes('zoom') || 
          target.className?.includes('zoom')) {
        buttonType = 'zoom';
      } else if (target.querySelector('[data-testid="FullscreenIcon"], [data-testid="FullscreenExitIcon"]') || 
                 target.textContent?.includes('fullscreen') || 
                 target.className?.includes('fullscreen')) {
        buttonType = 'fullscreen';
      } else if (target.querySelector('[data-testid="CollectionsIcon"]') || 
                 target.textContent?.includes('thumbnails') || 
                 target.className?.includes('thumbnails')) {
        buttonType = 'thumbnails';
        handleThumbnailsToggle(!thumbsOn);
      } else if (target.querySelector('[data-testid="DownloadIcon"]') || 
                 target.textContent?.includes('download') || 
                 target.className?.includes('download')) {
        buttonType = 'download';
      } else if (target.querySelector('[data-testid="PlayArrowIcon"], [data-testid="PauseIcon"]') || 
                 target.textContent?.includes('slideshow') || 
                 target.className?.includes('slideshow')) {
        buttonType = 'slideshow';
        // Detect if starting or stopping slideshow
        const isPlaying = target.querySelector('[data-testid="PauseIcon"]') !== null;
        handleSlideshowToggle(!isPlaying);
      } else if (target.querySelector('[data-testid="CloseIcon"]') || 
                 target.textContent?.includes('close') || 
                 target.className?.includes('close')) {
        buttonType = 'close';
      }

      // Track the button click
      handleToolbarButtonClick(buttonType);
    };

    // Add event listener to the lightbox container
    const lightboxContainer = document.querySelector('.yarl__portal');
    if (lightboxContainer) {
      lightboxContainer.addEventListener('click', handleToolbarClick);
      
      return () => {
        lightboxContainer.removeEventListener('click', handleToolbarClick);
      };
    }
  }, [open, thumbsOn, handleToolbarButtonClick, handleThumbnailsToggle, handleSlideshowToggle]);

  // Toolbar buttons - diferentes para panoramas vs imágenes normales
  const toolbarButtons = React.useMemo(() => {
    if (isPanorama) {
      // Solo herramientas esenciales para 360°
      return [
        'zoom',
        'fullscreen',
        'close'
      ];
    } else {
      // Herramientas completas para imágenes normales
      return [
        'zoom',
        'fullscreen', 
        'thumbnails',
        'download',
        'slideshow',
        'close'
      ];
    }
  }, [isPanorama]);

  return (
    <Lightbox
      open={open}
      close={handleClose}
      slides={(slides || []).map(s => ({ ...s, type: s.type || 'image' }))}
      index={currentIndex}
      on={{ 
        view: handleView,
        click: ({ index }) => {
          // Prevenir navegación en imágenes 360°
          if (isPanorama) {
            console.log('[MediaLightbox] 🚫 Click bloqueado para imagen 360°');
            return false;
          }
        }
      }}
      styles={{
        container: {
          width: 'min(70vw, calc(100vw - 24px))',
          height: 'min(70vh, calc(100vh - 24px))',
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100vh - 24px)',
          margin: '0 auto',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
        slide: {
          padding: '0',
        },
        button: {
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          borderRadius: '6px',
          padding: '8px',
          margin: '4px',
        },
        toolbar: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          padding: '8px',
          margin: '16px',
        },
      }}
      plugins={pluginsToUse}
      captions={{ showToggle: false }}
      thumbnails={{ showToggle: true }}
      zoom={{ 
        maxZoomPixelRatio: isPanorama ? 1 : 3,
        disabled: isPanorama 
      }}
      slideshow={{ autoplay: false, delay: 3000 }}
      download={{
        download: ({ slide }) => slide.src
      }}
      toolbar={{ 
        buttons: isPanorama ? ['close', 'download'] : toolbarButtons 
      }}
      controller={{ 
        closeOnPullDown: !isPanorama,
        closeOnBackdropClick: !isPanorama,
        closeOnEscape: true,
        preventDefaultWheelX: isPanorama,
        preventDefaultWheelY: isPanorama,
        // Deshabilitar navegación con teclas y clicks en panorama
        touchAction: isPanorama ? 'none' : 'auto'
      }}
      keyboard={{ disabled: isPanorama }}
      animation={{ 
        swipe: isPanorama ? 0 : 250,
        navigation: isPanorama ? 0 : 250,
        fade: isPanorama ? 0 : 250
      }}
      carousel={{ 
        finite: isPanorama,
        preload: isPanorama ? 0 : 2,
        padding: isPanorama ? 0 : '16px',
        spacing: isPanorama ? 0 : '30%',
        imageFit: isPanorama ? 'contain' : 'cover'
      }}
      render={{
        slide: ({ slide, rect }) => {
          console.log('[MediaLightbox] === RENDER SLIDE DEBUG ===');
          console.log('[MediaLightbox] Slide completo:', slide);
          console.log('[MediaLightbox] slide.src:', slide.src);
          console.log('[MediaLightbox] slide.axType:', slide.axType);
          console.log('[MediaLightbox] slide.type:', slide.type);
          console.log('[MediaLightbox] isPanorama (estado):', isPanorama);
          
          const isSlide360 = slide?.axType === 'panorama' || slide?.type === 'panorama';
          console.log('[MediaLightbox] isSlide360 (directo):', isSlide360);
          
          if (isPanorama || isSlide360) {
            console.log('[MediaLightbox] ✅ USANDO WebGL360Viewer para:', slide.src);
            return <WebGL360Viewer src={slide.src} title={slide.title} />;
          }
          
          console.log('[MediaLightbox] ❌ Usando render por defecto para:', slide.src);
          return undefined; // Usar render por defecto
        }
      }}
    />
  );
}
