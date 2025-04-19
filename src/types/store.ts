export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type FileType = 'light' | 'dark' | 'flat' | 'bias' | 'master' | 'final';

export interface FitsFile {
  id: string;
  projectId: string;
  fileType: FileType;
  filePath: string;
  fileSize: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ProcessingStep {
  id: string;
  projectId: string;
  stepName: string;
  status: ProcessingStatus;
  inputFiles: string[];
  outputFiles?: string[];
  parameters?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineState {
  currentProjectId: string | null;
  currentStep: string | null;
  steps: ProcessingStep[];
  files: FitsFile[];
  isProcessing: boolean;
  error: string | null;
}

export interface UserState {
  id: string | null;
  email: string | null;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: boolean;
  language: string;
} 