import { useState, useEffect } from 'react';
import api from '../config/api';

const useAssetDates = (projectId) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setAvailableDates([]);
      return;
    }

    const fetchAssetDates = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // console.log(`[useAssetDates] Fetching assets for project ${projectId}`);
        const response = await api.get(`/api/projects/${projectId}/assets`);
        // console.log(`[useAssetDates] API response:`, response.data);
        const { deliveries } = response.data;
        
        if (!Array.isArray(deliveries)) {
          // console.warn('[useAssetDates] No deliveries found in response:', response.data);
          setAvailableDates([]);
          return;
        }
        
        // console.log(`[useAssetDates] Found ${deliveries.length} deliveries`);
        // deliveries.forEach((delivery, index) => {
        //   console.log(`[useAssetDates] Delivery ${index}:`, {
        //     date: delivery.date,
        //     asset_type: delivery.asset_type,
        //     name: delivery.name
        //   });
        // });

        // Extraer fechas únicas de las entregas
        const uniqueDates = new Set();
        
        deliveries.forEach((delivery) => {
          if (delivery.date) {
            try {
              const date = new Date(delivery.date);
              if (!isNaN(date.getTime())) {
                // Normalizar a formato YYYY-MM-DD
                date.setUTCHours(0, 0, 0, 0);
                uniqueDates.add(date.toISOString().slice(0, 10));
              }
            } catch (error) {
              // console.warn('[useAssetDates] Error parsing date:', delivery.date, error);
            }
          }
        });

        const sortedDates = Array.from(uniqueDates).sort();
        // console.log(`[useAssetDates] Found ${sortedDates.length} unique dates:`, sortedDates);
        setAvailableDates(sortedDates);
        
      } catch (error) {
        console.error('[useAssetDates] Error fetching asset dates:', error);
        setError(error);
        setAvailableDates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssetDates();
  }, [projectId]);

  return { availableDates, isLoading, error };
};

export default useAssetDates;
