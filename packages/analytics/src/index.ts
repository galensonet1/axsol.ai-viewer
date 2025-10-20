import posthog from 'posthog-js';
import { AnalyticsBrowser, Analytics } from '@segment/analytics-next';

// Global instances
declare global {
  interface Window {
    _cio?: any;
    analytics?: Analytics;  // Segment global
    clarity?: any;  // Microsoft Clarity
  }
}

// Segment instance
let segmentAnalytics: Analytics | null = null;

export function analyticsInit(posthogKey: string, apiHost?: string) {
  posthog.init(posthogKey, {
    api_host: apiHost || 'https://app.posthog.com',
    autocapture: false,  // Solo eventos manuales para control total
    capture_pageview: false,  // Manejamos pageviews con useSpaPageviews
  });
  
  // Exponer globalmente para analytics.js
  if (typeof window !== 'undefined') {
    (window as any).posthog = posthog;
    console.log('✅ [PostHog] Initialized and exposed globally');
  }
  
  return posthog;
}

// Initialize Segment (Customer Data Platform)
export async function segmentInit(writeKey: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const [analytics] = await AnalyticsBrowser.load({ writeKey });
    segmentAnalytics = analytics;
    window.analytics = analytics;
    
    console.log('[Segment] Initialized with write key:', writeKey.substring(0, 8) + '...');
    return analytics;
  } catch (error) {
    console.error('[Segment] Failed to initialize:', error);
    return null;
  }
}

// Initialize Customer.io (returns Promise that resolves when script loads)
export function customerioInit(siteId: string, region?: 'us' | 'eu'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window._cio && typeof window._cio.track === 'function') {
      console.log('[Customer.io] Already initialized');
      resolve();
      return;
    }
    
    // Customer.io uses different CDN URLs for different regions
    const regionUrl = region === 'eu' 
      ? 'https://assets-eu.customer.io/assets/track-eu.js' 
      : 'https://assets.customer.io/assets/track.js';
    
    // Initialize tracking queue
    window._cio = window._cio || [];
    
    // Load Customer.io snippet
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.id = 'cio-tracker';
    script.setAttribute('data-site-id', siteId);
    script.src = regionUrl;
    
    script.onload = () => {
      console.log('[Customer.io] Script loaded successfully');
      // Wait a bit for initialization
      setTimeout(() => {
        console.log('[Customer.io] Initialized with site ID:', siteId);
        resolve();
      }, 100);
    };
    
    script.onerror = (error) => {
      console.error('[Customer.io] Failed to load script:', error);
      reject(error);
    };
    
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  });
}

// Customer.io: Identify user
export function customerioIdentify(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined' || !window._cio) {
    console.warn('[Customer.io] Not initialized, skipping identify');
    return;
  }
  
  // Check if identify method exists
  if (typeof window._cio.identify !== 'function') {
    console.warn('[Customer.io] Script not fully loaded, skipping identify');
    return;
  }
  
  try {
    window._cio.identify({
      id: userId,
      ...traits
    });
    console.log('[Customer.io] User identified:', userId);
  } catch (error) {
    console.error('[Customer.io] Error identifying user:', error);
  }
}

// Customer.io: Track event
export function customerioTrack(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined' || !window._cio) {
    console.warn('[Customer.io] Not initialized, skipping track:', eventName);
    return;
  }
  
  // Check if track method exists (script fully loaded)
  if (typeof window._cio.track !== 'function') {
    console.warn('[Customer.io] Script not fully loaded, skipping track:', eventName);
    return;
  }
  
  try {
    window._cio.track(eventName, properties);
    console.log('[Customer.io] Event tracked:', eventName);
  } catch (error) {
    console.error('[Customer.io] Error tracking event:', eventName, error);
  }
}

// Customer.io: Track page/screen view
export function customerioPage(pageName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined' || !window._cio) {
    console.warn('[Customer.io] Not initialized, skipping page');
    return;
  }
  
  // Check if page method exists
  if (typeof window._cio.page !== 'function') {
    console.warn('[Customer.io] Script not fully loaded, skipping page');
    return;
  }
  
  try {
    window._cio.page(pageName, properties);
    console.log('[Customer.io] Page tracked:', pageName);
  } catch (error) {
    console.error('[Customer.io] Error tracking page:', error);
  }
}

// Initialize Microsoft Clarity
export function clarityInit(projectId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.clarity) {
      console.log('[Clarity] Already initialized');
      resolve();
      return;
    }
    
    try {
      // Microsoft Clarity snippet (simplified)
      window.clarity = window.clarity || function() { 
        (window.clarity.q = window.clarity.q || []).push(arguments); 
      };
      
      const script = document.createElement('script');
      script.async = true;
      script.src = "https://www.clarity.ms/tag/" + projectId;
      
      script.onload = () => {
        console.log('[Clarity] Initialized with project ID:', projectId.substring(0, 6) + '...');
        resolve();
      };
      
      script.onerror = (error: any) => {
        console.error('[Clarity] Failed to load script:', error);
        reject(error);
      };
      
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('[Clarity] Initialization error:', error);
      reject(error);
    }
  });
}

// Segment: Track page/screen
export function segmentPage(pageName?: string, properties?: Record<string, any>) {
  if (!segmentAnalytics && typeof window !== 'undefined' && window.analytics) {
    segmentAnalytics = window.analytics;
  }
  
  if (segmentAnalytics) {
    segmentAnalytics.page(pageName, properties);
    console.log('[Segment] Page tracked:', pageName || 'page');
  }
}

// Segment: Track event
export function segmentTrack(eventName: string, properties?: Record<string, any>) {
  if (!segmentAnalytics && typeof window !== 'undefined' && window.analytics) {
    segmentAnalytics = window.analytics;
  }
  
  if (segmentAnalytics) {
    segmentAnalytics.track(eventName, properties);
    console.log('[Segment] Event tracked:', eventName);
  }
}

// Segment: Identify user
export function segmentIdentify(userId: string, traits?: Record<string, any>) {
  if (!segmentAnalytics && typeof window !== 'undefined' && window.analytics) {
    segmentAnalytics = window.analytics;
  }
  
  if (segmentAnalytics) {
    segmentAnalytics.identify(userId, traits);
    console.log('[Segment] User identified:', userId);
  }
}

// Track pageview manually (for SPA routing)
// Note: Hook version (useSpaPageviews) moved to apps/site/src/hooks/
export function trackPageview(url: string) {
  // Track in PostHog
  posthog.capture('$pageview', { url });
  
  // Track in Microsoft Clarity (if available)
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('set', 'page', url);
  }
  
  // Track in Customer.io (if available)
  if (typeof window !== 'undefined' && window._cio) {
    const pageName = url.split('?')[0]; // Remove query params
    window._cio.page(pageName, { url });
  }
  
  // Track in Segment (if available)
  if (segmentAnalytics || (typeof window !== 'undefined' && window.analytics)) {
    const pageName = url.split('?')[0];
    segmentPage(pageName, { url });
  }
}

// Unified identify: PostHog + Customer.io + Segment
export function identify(userId: string, props?: Record<string, any>) {
  // Identify in PostHog
  posthog.identify(userId, props);
  
  // Identify in Customer.io
  customerioIdentify(userId, props);
  
  // Identify in Segment
  segmentIdentify(userId, props);
}

// Group user by account (for user-based grouping)
export function groupAccount(accountId: string, props?: Record<string, any>) {
  posthog.group('account', accountId, props);
}

// Group by company (for ABM - Account Based Marketing)
export function groupCompany(companyDomain: string, props?: Record<string, any>) {
  posthog.group('company', companyDomain, props);
}

// ABM Reveal integration (IPinfo/Clearbit proxy)
export async function enrichWithABM(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      console.log('[Analytics] No company data from ABM provider');
      return false;
    }

    const result = await response.json();
    
    if (result.ok && result.firmo) {
      const { companyDomain, companyName, ...firmographics } = result.firmo;
      
      // Group by company domain in PostHog for ABM
      if (companyDomain) {
        groupCompany(companyDomain, {
          name: companyName,
          ...firmographics
        });
        
        console.log('[Analytics] Company identified:', companyName, `(via ${result.source || 'unknown'})`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[Analytics] Error enriching with ABM:', error);
    return false;
  }
}

// Legacy alias for backward compatibility
export const enrichWithClearbit = enrichWithABM;
