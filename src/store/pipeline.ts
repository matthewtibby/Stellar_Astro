import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PipelineState, ProcessingStep, FitsFile } from '@/types/store';

interface PipelineStore extends PipelineState {
  setCurrentProject: (projectId: string) => void;
  setCurrentStep: (step: string) => void;
  addStep: (step: ProcessingStep) => void;
  updateStep: (stepId: string, updates: Partial<ProcessingStep>) => void;
  addFile: (file: FitsFile) => void;
  removeFile: (fileId: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: PipelineState = {
  currentProjectId: null,
  currentStep: null,
  steps: [],
  files: [],
  isProcessing: false,
  error: null,
};

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentProject: (projectId) =>
        set({ currentProjectId: projectId }),

      setCurrentStep: (step) =>
        set({ currentStep: step }),

      addStep: (step) =>
        set((state) => ({
          steps: [...state.steps, step],
        })),

      updateStep: (stepId, updates) =>
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
          ),
        })),

      addFile: (file) =>
        set((state) => ({
          files: [...state.files, file],
        })),

      removeFile: (fileId) =>
        set((state) => ({
          files: state.files.filter((file) => file.id !== fileId),
        })),

      setProcessing: (isProcessing) =>
        set({ isProcessing }),

      setError: (error) =>
        set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'pipeline-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        currentStep: state.currentStep,
        steps: state.steps,
        files: state.files,
      }),
    }
  )
); 