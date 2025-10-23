import React, { useEffect } from 'react';

interface DemoHandlerProps {
  calendlyUrl?: string;
}

const DemoHandler: React.FC<DemoHandlerProps> = ({ 
  calendlyUrl = 'https://calendly.com/axsol/30min' 
}) => {
  useEffect(() => {
    // Función para abrir Calendly
    const openCalendly = () => {
      if (typeof (window as any).Calendly !== 'undefined') {
        console.log('[IngeIA] Abriendo Calendly:', calendlyUrl);
        (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
        
        // Track analytics event
        if (typeof (window as any).posthog !== 'undefined') {
          (window as any).posthog.capture('demo_requested_via_url', {
            calendly_url: calendlyUrl,
            source: 'direct_url'
          });
        }
      } else {
        // Si Calendly no está cargado aún, intentar de nuevo
        console.log('[IngeIA] Calendly no disponible, reintentando...');
        setTimeout(openCalendly, 1000);
      }
    };

    // Detectar diferentes formas de solicitar demo
    const currentPath = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    
    const demoTriggers = [
      currentPath.includes('/demo'),
      currentPath.includes('/solicitar-demo'),
      currentPath.includes('/request-demo'),
      urlParams.get('demo') !== null,
      urlParams.get('solicitar-demo') !== null,
      urlParams.get('request-demo') !== null,
      hash === '#demo',
      hash === '#solicitar-demo'
    ];

    const shouldOpenDemo = demoTriggers.some(trigger => trigger);

    if (shouldOpenDemo) {
      console.log('[IngeIA] Demo URL detectada:', window.location.href);
      
      // Esperar para que la página y Calendly se carguen completamente
      const delay = document.readyState === 'complete' ? 1500 : 3000;
      setTimeout(openCalendly, delay);
      
      // Limpiar la URL para evitar que se abra múltiples veces
      const cleanUrl = () => {
        if (currentPath.includes('/demo') || currentPath.includes('/solicitar-demo') || currentPath.includes('/request-demo')) {
          window.history.replaceState({}, document.title, '/');
        } else {
          // Limpiar parámetros de URL
          ['demo', 'solicitar-demo', 'request-demo'].forEach(param => {
            urlParams.delete(param);
          });
          
          let newUrl = window.location.pathname;
          if (urlParams.toString()) {
            newUrl += '?' + urlParams.toString();
          }
          
          // Limpiar hash si es de demo
          if (!hash.includes('demo')) {
            newUrl += window.location.hash;
          }
          
          window.history.replaceState({}, document.title, newUrl);
        }
      };

      // Limpiar URL después de un delay
      setTimeout(cleanUrl, delay + 500);
    }

    // Listener para manejar cambios de URL (navegación SPA)
    const handlePopState = () => {
      // Re-evaluar si necesitamos abrir demo después de navegación
      const newPath = window.location.pathname.toLowerCase();
      if (newPath.includes('/demo') || newPath.includes('/solicitar-demo')) {
        setTimeout(openCalendly, 1000);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [calendlyUrl]);

  // Este componente no renderiza nada visible
  return null;
};

export default DemoHandler;
