import { useEffect } from 'react';
import { trackPageview } from '@ingeia/analytics';

/**
 * Hook for automatic SPA pageview tracking
 * Tracks page changes in PostHog, Clarity, Customer.io, and Segment
 * 
 * @param getUrl Function that returns current URL
 * 
 * @example
 * ```tsx
 * import { useLocation } from 'react-router-dom';
 * import { useSpaPageviews } from './hooks/useSpaPageviews';
 * 
 * function App() {
 *   const location = useLocation();
 *   useSpaPageviews(() => window.location.pathname + location.search);
 *   // ...
 * }
 * ```
 */
export function useSpaPageviews(getUrl: () => string) {
  useEffect(() => {
    const url = getUrl();
    trackPageview(url);
  }, [getUrl()]);
}
