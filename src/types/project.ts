export interface Project {
  id: string;
  name: string;
  title?: string;
<<<<<<< HEAD
  target: any; // Use a more specific type if available
  telescope?: any;
  camera?: any;
  filters?: any[];
=======
  target: unknown; // Use a more specific type if available
  telescope?: unknown;
  camera?: unknown;
  filters?: unknown[];
>>>>>>> calibration
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'archived' | 'deleted';
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: Date | string;
  }[];
  isFavorite?: boolean;
  tags?: string[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  required: boolean;
  category: string;
  completedAt?: Date;
} 