import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/src/lib/supabase';
import { supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

interface Superdark {
  name: string;
  path: string;
  // Add any other relevant superdark properties here
}

export const useSuperdarks = (userId?: string, projectId?: string) => {
  const [superdarks, setSuperdarks] = useState<Superdark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuperdarks = useCallback(async () => {
    if (!userId || !projectId) {
      setSuperdarks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const folderPath = `${userId}/${projectId}`;
      const { data, error } = await supabase.storage.from('superdarks').list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        throw error;
      }

      if (data) {
        const superdarkList: Superdark[] = data
          .filter(file => file.name.endsWith('.fits') || file.name.endsWith('.fit')) // Only FITS files
          .map((file) => ({
            name: file.name,
            path: `${folderPath}/${file.name}`,
          }));
        setSuperdarks(superdarkList);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, projectId]);

  useEffect(() => {
    fetchSuperdarks();
  }, [fetchSuperdarks]);

  // Return both the state and a refresh function
  return { 
    superdarks, 
    isLoading, 
    error, 
    refresh: fetchSuperdarks 
  };
}; 