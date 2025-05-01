export interface Project {
  id: string;
  name: string;
  target: any; // Use a more specific type if available
  telescope?: any;
  camera?: any;
  filters?: any[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed';
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: Date | string;
  }[];
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