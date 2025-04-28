import { User } from '@supabase/supabase-js';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type FileType = 'light' | 'dark' | 'bias' | 'flat' | 'master-dark' | 'master-bias' | 'master-flat' | 'calibrated' | 'stacked' | 'aligned' | 'pre-processed' | 'post-processed';

export interface FitsFile {
  id: string;
  projectId: string;
  fileType: FileType;
  filePath: string;
  fileSize: number;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface ProcessingStep {
  id: string;
  projectId: string;
  stepName: string;
  status: ProcessingStatus;
  inputFiles: string[];
  outputFiles?: string[];
  parameters?: Record<string, string | number | boolean>;
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
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  subscription: {
    type: 'free' | 'pro' | 'enterprise';
    projectLimit: number;
  };
}

export interface UserStore extends UserState {
  user: User | null;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: boolean;
  language: string;
}

export interface AppStore extends AppState {
  setTheme: (theme: AppState['theme']) => void;
  toggleSidebar: () => void;
  setNotifications: (enabled: boolean) => void;
  setLanguage: (language: string) => void;
}

export interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  type: FileType;
  url?: string;
  metadata?: Record<string, any>;
} 