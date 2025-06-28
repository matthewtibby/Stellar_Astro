import { useState } from 'react';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useProjectStore } from '@/src/store/project';

export function useProjectActions(projectId: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { currentProject, updateProject } = useProjectStore();
  const { addToast } = useToast();
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const handleExport = async () => {
    if (!currentProject) return;
    setIsExporting(true);
    try {
      const { data: files, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);
      if (filesError) throw filesError;
      const exportData = {
        project: currentProject,
        files: files,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0'
        }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${currentProject.title}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'Project exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      addToast('error', 'Failed to export project');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      if (!importData.project || !importData.files) {
        throw new Error('Invalid project export file');
      }
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([{
          ...importData.project,
          id: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1
        }])
        .select()
        .single();
      if (projectError) throw projectError;
      for (const file of importData.files) {
        const { error: fileError } = await supabase
          .from('project_files')
          .insert([{
            ...file,
            id: undefined,
            project_id: newProject.id,
            created_at: new Date().toISOString()
          }]);
        if (fileError) throw fileError;
      }
      addToast('success', 'Project imported successfully');
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportError(error.message || 'Failed to import project');
      addToast('error', 'Failed to import project');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentProject) return;
    try {
      await updateProject(projectId, { isFavorite: !currentProject.isFavorite });
      addToast('success', `Project ${currentProject.isFavorite ? 'removed from' : 'added to'} favorites`);
    } catch (error) {
      console.error('Failed to update favorite status:', error);
      addToast('error', 'Failed to update favorite status');
    }
  };

  const updateTags = async (tags: string[]) => {
    if (!currentProject) return;
    try {
      await updateProject(projectId, { tags });
      addToast('success', 'Tags updated successfully');
    } catch (error) {
      console.error('Failed to update tags:', error);
      addToast('error', 'Failed to update tags');
    }
  };

  const handleDuplicate = async () => {
    if (!currentProject) return;
    try {
      const newProject = { ...currentProject, id: undefined, name: `${currentProject.name} (Copy)` };
      await updateProject(projectId, newProject);
      addToast('success', 'Project duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      addToast('error', 'Failed to duplicate project');
    }
  };

  const handleArchive = async () => {
    if (!currentProject) return;
    try {
      await updateProject(projectId, { status: 'archived' });
      addToast('success', 'Project archived successfully');
    } catch (error) {
      console.error('Failed to archive project:', error);
      addToast('error', 'Failed to archive project');
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    try {
      await updateProject(projectId, { status: 'deleted' });
      addToast('success', 'Project deleted successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
      addToast('error', 'Failed to delete project');
    }
  };

  return {
    isExporting,
    isImporting,
    importError,
    currentProject,
    handleExport,
    handleImport,
    toggleFavorite,
    updateTags,
    handleDuplicate,
    handleArchive,
    handleDelete,
  };
} 