import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { analyticsInit, customerioInit, customerioTrack, segmentInit, segmentTrack, clarityInit, enrichWithClearbit } from '@ingeia/analytics';

// Initialize PostHog analytics
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

if (posthogKey) {
  analyticsInit(posthogKey, posthogHost);
  
  // Enrich with Clearbit Reveal for ABM
  enrichWithClearbit(apiBaseUrl).catch(err => {
    console.log('[Analytics] Clearbit enrichment skipped');
  });
}

// Initialize analytics asynchronously
(async () => {
  try {
    // Initialize Microsoft Clarity (optional)
    const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
    if (clarityProjectId && clarityProjectId !== 'your_clarity_project_id_here') {
      await clarityInit(clarityProjectId).catch(err => {
        console.warn('[WWW] Clarity initialization failed:', err.message);
      });
    }

    // Initialize Segment (optional - CDP layer)
    const segmentWriteKey = import.meta.env.VITE_SEGMENT_WRITE_KEY;
    if (segmentWriteKey && segmentWriteKey !== 'your_segment_write_key_here') {
      await segmentInit(segmentWriteKey).catch(err => {
        console.warn('[WWW] Segment initialization failed:', err.message);
      });
    }

    // Initialize Customer.io for messaging
    const customerioSiteId = import.meta.env.VITE_CUSTOMERIO_SITE_ID;
    if (customerioSiteId && customerioSiteId !== 'your_customerio_site_id_here') {
      await customerioInit(customerioSiteId, import.meta.env.VITE_CUSTOMERIO_REGION || 'us').catch(err => {
        console.warn('[WWW] Customer.io initialization failed:', err.message);
      });
      
      // Track first visit (only after Customer.io is loaded)
      const hasVisited = localStorage.getItem('cio_visited_www');
      if (!hasVisited) {
        const eventData = {
          app: 'www',
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        customerioTrack('first_visit', eventData);
        
        // Also track in Segment if available
        if (segmentWriteKey && segmentWriteKey !== 'your_segment_write_key_here') {
          segmentTrack('first_visit', eventData);
        }
        
        localStorage.setItem('cio_visited_www', 'true');
      }
    }
  } catch (error) {
    console.error('[WWW] Analytics initialization error:', error);
  }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
