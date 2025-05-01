import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/src/utils/storage';
import { Project } from '@/src/types/project';

export function useProjects(userId?: string, isAuthenticated?: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Normalize createdAt, updatedAt, and steps[].completedAt to Date objects
      const normalized = (data || []).map((p: any) => ({
        ...p,
        createdAt: p.created_at ? new Date(p.created_at) : new Date(),
        updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
        steps: Array.isArray(p.steps)
          ? p.steps.map((s: any) => ({
              ...s,
              completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
            }))
          : [],
      }));
      setProjects(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated) fetchProjects();
  }, [isAuthenticated, userId, fetchProjects]);

  return { projects, isLoading, error, fetchProjects };
} 