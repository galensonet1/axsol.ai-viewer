import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = 'http://localhost:3001/api';

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
      const fullUrl = `${API_BASE_URL}${url}`;

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
