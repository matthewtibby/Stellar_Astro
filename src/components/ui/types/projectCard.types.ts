// Types and interfaces for ProjectCard and related components

export interface Equipment {
  type: "telescope" | "camera" | "filter";
  name: string;
}

export interface ProjectTarget {
  name: string;
  coordinates: { ra: string; dec: string };
  category?: string;
  angularSizeArcmin?: number;
  catalogIds?: string[];
  constellation?: string;
  type?: string;
  commonNames?: string[];
  fitsMetadata?: Record<string, unknown>;
}

export interface ProjectCardProps {
  id: string;
  targetName: string;
  status: "new" | "in_progress" | "completed";
  thumbnailUrl: string;
  userImageUrl?: string;
  creationDate: string;
  frameCount: number;
  fileSize: string;
  equipment: Equipment[];
  onDelete?: (id: string) => void;
  onExport?: (id: string) => void;
  onShare?: (id: string) => void;
  className?: string;
  onClick?: () => void;
  title?: string;
  name?: string;
  updatedAt?: string;
  onProjectNameUpdate?: (id: string, newName: string) => Promise<void>;
  target?: ProjectTarget;
  onProjectDeleted?: () => void;
} 