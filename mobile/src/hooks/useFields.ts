import { useCallback, useState } from 'react';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { ApiErrorBody, Field } from '../types';

export const useFields = (token: string) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldsError, setFieldsError] = useState('');

  const handleLoadFields = useCallback(async () => {
    setFieldsError('');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/fields`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let data: unknown = [];
      try {
        data = await response.json();
      } catch {
        data = [];
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      setFields(Array.isArray(data) ? (data as Field[]) : []);
    } catch (error) {
      setFieldsError(error instanceof Error ? error.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { fields, loading, fieldsError, handleLoadFields };
};
