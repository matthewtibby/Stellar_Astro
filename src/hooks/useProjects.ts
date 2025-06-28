'use client';
import { useEffect, useState, useCallback } from 'react';
// import { supabase } from '@/src/lib/supabaseClient';
import { Project } from '@/src/types/project';

// Define allowed sort fields
const allowedSortFields = ['created_at', 'name'];

export function useProjects(userId?: string, isAuthenticated?: boolean, initialProjects?: Project[]) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard-projects', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch projects');
      }
      const { projects: data } = await res.json();
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
      if (!normalized.length) {
        setError('No projects found. Create your first project!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load projects';
      setError(errorMessage);
      console.error('fetchProjects error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId && !initialProjects) {
      fetchProjects();
    }
  }, [isAuthenticated, userId, fetchProjects, initialProjects]);

  return { projects, isLoading, error, fetchProjects };
} 