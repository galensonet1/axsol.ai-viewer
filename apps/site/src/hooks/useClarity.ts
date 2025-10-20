import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export function useClarityScreen() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.clarity) window.clarity('set', 'page', pathname);
  }, [pathname]);
}
