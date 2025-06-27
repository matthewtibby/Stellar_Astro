import { useEffect } from 'react';

export function useDeleteConfirmLogger({ showDeleteConfirm, id, onDelete, onProjectDeleted }: {
  showDeleteConfirm: boolean;
  id: string;
  onDelete?: (id: string) => void;
  onProjectDeleted?: () => void;
}) {
  useEffect(() => {
    if (showDeleteConfirm) {
      console.log('[ProjectCard] Delete confirmation popup shown for project:', id);
      console.log('[ProjectCard] Props:', { id, onDelete, onProjectDeleted });
    }
  }, [showDeleteConfirm, id, onDelete, onProjectDeleted]);
} 