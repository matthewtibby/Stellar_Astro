export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type FileType = 'light' | 'dark' | 'flat' | 'bias' | 'master' | 'final';

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
  id: string | null;
  email: string | null;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UserStore extends UserState {
  user: UserState | null;
  setUser: (user: Partial<UserState>) => void;
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