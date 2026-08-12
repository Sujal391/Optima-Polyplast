import { useState, useCallback } from 'react';
import apiClient from '../services/api/client';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (method, endpoint, data = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient[method](endpoint, data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, apiCall };
}; 