import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const resolveBase = () => {
  console.log('[useApi] Resolviendo base URL...');
  console.log('[useApi] window.__CONFIG__:', window.__CONFIG__);
  console.log('[useApi] VITE_API_BASE_URL:', import.meta?.env?.VITE_API_BASE_URL);
  
  if (typeof window !== 'undefined' && window.__CONFIG__?.apiBaseUrl) {
    console.log('[useApi] Usando window.__CONFIG__.apiBaseUrl:', window.__CONFIG__.apiBaseUrl);
    return window.__CONFIG__.apiBaseUrl;
  }
  if (import.meta?.env?.VITE_API_BASE_URL) {
    console.log('[useApi] Usando VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  const fallback = window?.location?.origin || '';
  console.log('[useApi] Usando fallback:', fallback);
  return fallback;
};

const useApi = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const origin = resolveBase();
      let path = url || '';
      if (!/^\/?api\//.test(path)) {
        path = `/api${path.startsWith('/') ? '' : '/'}${path}`;
      }
      const fullUrl = `${origin.replace(/\/$/, '')}${path}`;

      try {
        const token = await getAccessTokenSilently();
        console.log('url:', fullUrl);
        const response = await fetch(fullUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, getAccessTokenSilently]);

  return { data, loading, error };
};

export default useApi;
