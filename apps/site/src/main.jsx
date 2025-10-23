import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Ion } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './index.css';
import AppWrapper from './AppWrapper.jsx';
import { UserProvider } from './context/UserContext.jsx';
import api from './config/api';
import { analyticsInit, customerioInit, customerioTrack, segmentInit, segmentTrack, clarityInit, enrichWithClearbit } from '@ingeia/analytics';

const root = createRoot(document.getElementById('root'));

async function bootstrap() {
  console.log('🚀🚀🚀 [Bootstrap] ========== INICIANDO ========== 🚀🚀🚀');
  
  try {
    const apiOrigin = (import.meta.env.VITE_API_BASE_URL || window.location.origin);
    console.log('📡 [Bootstrap] API Origin:', apiOrigin);
    
    const res = await fetch(`${apiOrigin.replace(/\/$/, '')}/api/config`, { credentials: 'include' });
    const cfg = await res.json().catch(() => ({}));
    window.__CONFIG__ = cfg || {};
    console.log('⚙️ [Bootstrap] Config loaded:', window.__CONFIG__);

    // Configure Cesium Ion token if provided
    const ionToken = window.__CONFIG__?.cesium?.ionToken;
    if (ionToken) {
      Ion.defaultAccessToken = ionToken;
    }

    // Configure API base URL for axios instance
    if (window.__CONFIG__?.apiBaseUrl) {
      api.defaults.baseURL = window.__CONFIG__.apiBaseUrl;
    } else if (import.meta.env.VITE_API_BASE_URL) {
      api.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    }

    // Configure Microsoft Clarity
    if (window.__CONFIG__?.clarity?.projectId) {
      window.CLARITY_PROJECT_ID = window.__CONFIG__.clarity.projectId;
    }

    // Configure PostHog Analytics
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    console.log('🔑 [Bootstrap] VITE_POSTHOG_KEY:', posthogKey ? `${posthogKey.substring(0, 10)}...` : 'NOT DEFINED');
    
    if (posthogKey) {
      console.log('🚀 [Bootstrap] Inicializando PostHog...');
      analyticsInit(posthogKey, window.__CONFIG__?.posthog?.apiHost);
      console.log('✅ [Bootstrap] PostHog inicializado. window.posthog:', !!window.posthog);
      
      // Enrich with Clearbit Reveal for ABM (Account-Based Marketing)
      // This will identify the company based on visitor's IP
      // TEMPORALMENTE DESHABILITADO: endpoint /api/reveal no existe
      // enrichWithClearbit(window.__CONFIG__?.apiBaseUrl || apiOrigin).catch(err => {
      //   console.log('[Analytics] Clearbit enrichment skipped:', err.message);
      // });
    } else {
      console.error('❌ [Bootstrap] VITE_POSTHOG_KEY no está definida en .env');
    }

    // Configure Microsoft Clarity (optional)
    const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
    if (clarityProjectId && clarityProjectId !== 'your_clarity_project_id_here') {
      await clarityInit(clarityProjectId).catch(err => {
        console.warn('[SITE] Clarity initialization failed:', err.message);
      });
    }

    // Configure Segment (optional - CDP layer)
    const segmentWriteKey = import.meta.env.VITE_SEGMENT_WRITE_KEY;
    if (segmentWriteKey && segmentWriteKey !== 'your_segment_write_key_here') {
      await segmentInit(segmentWriteKey).catch(err => {
        console.warn('[SITE] Segment initialization failed:', err.message);
      });
    }

    // Configure Customer.io for messaging
    const customerioSiteId = import.meta.env.VITE_CUSTOMERIO_SITE_ID;
    if (customerioSiteId && customerioSiteId !== 'your_customerio_site_id_here') {
      await customerioInit(customerioSiteId, import.meta.env.VITE_CUSTOMERIO_REGION || 'us').catch(err => {
        console.warn('[SITE] Customer.io initialization failed:', err.message);
      });
      
      // Track first visit (only after Customer.io is loaded)
      const hasVisited = localStorage.getItem('cio_visited');
      if (!hasVisited) {
        const eventData = {
          app: 'site',
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        customerioTrack('first_visit', eventData);
        
        // Also track in Segment if available
        if (segmentWriteKey && segmentWriteKey !== 'your_segment_write_key_here') {
          segmentTrack('first_visit', eventData);
        }
        
        localStorage.setItem('cio_visited', 'true');
      }
    }

    const auth0 = window.__CONFIG__?.auth0 || {};
    
    // Auth0 configuration loaded successfully

    root.render(
      <StrictMode>
        <BrowserRouter>
          <Auth0Provider
            domain={auth0.domain || import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={auth0.clientId || import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
              redirect_uri: window.location.origin,
              audience: auth0.audience || import.meta.env.VITE_AUTH0_AUDIENCE, // Restaurado para generar JWT válido
              scope: 'openid profile email',
            }}
          >
            <UserProvider>
              <AppWrapper />
            </UserProvider>
          </Auth0Provider>
        </BrowserRouter>
      </StrictMode>
    );
  } catch (e) {
    console.error('❌ [Bootstrap] Error en bootstrap:', e);
    
    // Using fallback Auth0 configuration
    
    // En caso de falla, render con variables de entorno como fallback
    root.render(
      <StrictMode>
        <BrowserRouter>
          <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
              redirect_uri: window.location.origin,
              audience: import.meta.env.VITE_AUTH0_AUDIENCE, // Restaurado para generar JWT válido
              scope: 'openid profile email',
            }}
          >
            <UserProvider>
              <AppWrapper />
            </UserProvider>
          </Auth0Provider>
        </BrowserRouter>
      </StrictMode>
    );
  }
}

bootstrap();
