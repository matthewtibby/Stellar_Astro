import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectMetadata } from '@/types/store';
import { getSupabaseClient } from '@/src/utils/storage';
import { PostgrestError } from '@supabase/supabase-js';

interface ProjectStore {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  lastSaved: string | null;
  
  // Actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  autoSaveProject: () => Promise<void>;
}

const initialState = {
  currentProject: null,
  projects: [],
  isLoading: false,
  error: null,
  lastSaved: null,
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = getSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) throw new Error('User not authenticated');

          const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
            ...projectData,
            userId: user.id,
            version: 1,
          };

          const { data: project, error } = await supabase
            .from('projects')
            .insert([newProject])
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
            lastSaved: new Date().toISOString(),
          }));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      updateProject: async (projectId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = getSupabaseClient();
          const currentProject = get().currentProject;

          if (!currentProject) throw new Error('No project selected');

          const updatedProject = {
            ...currentProject,
            ...updates,
            version: currentProject.version + 1,
            updatedAt: new Date().toISOString(),
          };

          const { data: project, error } = await supabase
            .from('projects')
            .update(updatedProject)
            .eq('id', projectId)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            projects: state.projects.map((p) => 
              p.id === projectId ? project : p
            ),
            currentProject: project,
            lastSaved: new Date().toISOString(),
          }));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteProject: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = getSupabaseClient();
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

          if (error) throw error;

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
          }));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      loadProject: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const supabase = getSupabaseClient();
          const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (error) throw error;
          if (!project) throw new Error('Project not found');

          set({ currentProject: project });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      autoSaveProject: async () => {
        const currentProject = get().currentProject;
        if (!currentProject) return;

        try {
          await get().updateProject(currentProject.id, currentProject);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        currentProject: state.currentProject,
        projects: state.projects,
      }),
    }
  )
); 