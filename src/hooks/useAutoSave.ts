import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/src/store/project';
import { useSupabaseClient } from '../../app/SupabaseProvider';

export function useAutoSave(debounceTime = 2000) {
  const { currentProject, autoSaveProject } = useProjectStore();
  const supabase = useSupabaseClient();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!currentProject) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      autoSaveProject(supabase);
    }, debounceTime);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentProject, autoSaveProject, debounceTime, supabase]);
} 