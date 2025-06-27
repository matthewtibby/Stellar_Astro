import { useState, useEffect } from 'react';
import { useToast } from '@/src/hooks/useToast';
import { ProjectCardProps } from '../types/projectCard.types';

type DeletedProject = {
  id: string;
  targetName: string;
  status: "new" | "in_progress" | "completed";
  thumbnailUrl: string;
  userImageUrl?: string;
  creationDate: string;
  frameCount: number;
  fileSize: string;
  equipment: ProjectCardProps['equipment'];
  title?: string;
  name?: string;
  updatedAt?: string;
  target?: ProjectCardProps['target'];
};

export function useProjectCardState({
  id,
  targetName,
  status,
  thumbnailUrl,
  userImageUrl,
  creationDate,
  frameCount,
  fileSize,
  equipment,
  onDelete,
  onProjectNameUpdate,
  onProjectDeleted,
  title,
  name,
  updatedAt,
  target
}: Omit<ProjectCardProps, 'className' | 'onClick' | 'onExport' | 'onShare'>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(title || name || 'Untitled Project');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [deletedProject, setDeletedProject] = useState<DeletedProject | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToast } = useToast();
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  const handleDelete = async () => {
    if (onDelete) await onDelete(id);
    setShowDeleteConfirm(false);
    if (onProjectDeleted) onProjectDeleted();
    setShowUndo(true);
    setDeletedProject({
      id,
      targetName,
      status,
      thumbnailUrl,
      userImageUrl,
      creationDate,
      frameCount,
      fileSize,
      equipment,
      title,
      name,
      updatedAt,
      target,
    });
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => setShowUndo(false), 5000);
    setUndoTimeout(timeout);
  };

  async function handleInlineEditSave(field: string, value: string) {
    setIsSavingName(true);
    try {
      if (field === 'object') setThumbnailLoading(true);
      const res = await fetch('/api/project-file-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, field, value }),
      });
      if (!res.ok) throw new Error('Failed to update metadata');
      setIsEditingName(false);
      setEditedName(value);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onProjectDeleted) onProjectDeleted();
      if (onProjectNameUpdate) {
        await onProjectNameUpdate(id, value.trim());
      }
      addToast('success', `${field === 'object' ? 'Object name' : 'Equipment'} updated!`);
    } finally {
      setIsSavingName(false);
      if (field === 'object') setTimeout(() => setThumbnailLoading(false), 1200);
    }
  }

  useEffect(() => {
    if (showDeleteConfirm) {
      console.log('[ProjectCard] Delete confirmation popup shown for project:', id);
    }
  }, [showDeleteConfirm, id]);

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    isEditingName,
    setIsEditingName,
    editedName,
    setEditedName,
    isSavingName,
    showUndo,
    setShowUndo,
    deletedProject,
    undoTimeout,
    setUndoTimeout,
    showSuccess,
    thumbnailLoading,
    setThumbnailLoading,
    handleDelete,
    handleInlineEditSave,
  };
} 