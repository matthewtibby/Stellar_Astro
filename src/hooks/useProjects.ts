'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabaseClient';
import { Project } from '@/src/types/project';

// Define allowed sort fields
const allowedSortFields = ['created_at', 'name'];

export function useProjects(userId?: string, isAuthenticated?: boolean, initialProjects?: Project[]) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (searchTerm = '', filterStatus = '', sortBy = 'created_at', sortOrder = 'desc') => {
    if (!userId) {
      console.warn('fetchProjects: No userId provided');
      setError('User ID is required to fetch projects');
      return;
    }

    if (!isAuthenticated) {
      console.warn('fetchProjects: User is not authenticated');
      setError('Authentication is required to fetch projects');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('fetchProjects called with:', { 
        searchTerm, 
        filterStatus, 
        sortBy, 
        sortOrder, 
        userId,
        isAuthenticated 
      });

      // Verify authentication state
      console.log('[USEPROJECTS] Fetching user with supabase.auth.getUser()');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[USEPROJECTS] getUser response:', { user, authError });
      if (authError) {
        console.error('Authentication check failed:', authError);
        throw new Error('Failed to verify authentication status');
      }

      if (!user || user.id !== userId) {
        console.error('User ID mismatch:', { 
          expected: userId, 
          actual: user?.id 
        });
        throw new Error('User authentication mismatch');
      }

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      // Apply search
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply filter
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      // Validate and apply sorting
      const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      console.log('Ordering by:', safeSortBy, 'ascending:', sortOrder === 'asc');
      query = query.order(safeSortBy, { ascending: sortOrder === 'asc' });

      // Log the final query object
      console.log('Final query object:', query);
      
      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.error('Supabase query error:', {
          code: queryError.code,
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint
        });
        throw queryError;
      }

      // Normalize createdAt, updatedAt, and steps[].completedAt to Date objects
      const normalized = (data || []).map((p: unknown) => ({
        ...p,
        createdAt: p.created_at ? new Date(p.created_at) : new Date(),
        updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
        steps: Array.isArray(p.steps)
          ? p.steps.map((s: unknown) => ({
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
      console.error('fetchProjects error:', {
        error: err,
        userId,
        isAuthenticated
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && userId && !initialProjects) {
      fetchProjects();
    }
  }, [isAuthenticated, userId, fetchProjects, initialProjects]);

  return { projects, isLoading, error, fetchProjects };
} 