import { useState } from 'react';
import { Share2, Download, Upload, Copy, CheckCircle, X, Star, Tag, Trash, Copy as Duplicate, Archive } from 'lucide-react';
import { useProjectStore } from '@/src/store/project';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '../hooks/useToast';
import { sendNotification } from '@/src/utils/sendNotification';

interface ProjectManagementPanelProps {
  projectId: string;
}

// Add a mapping from project title to image and target name
const projectThumbnails = {
  'Andromeda Galaxy': {
    image: '/images/andromeda.jpg',
    target: 'Andromeda Galaxy',
  },
  'Eagle Nebula': {
    image: '/images/eagle.jpg',
    target: 'Eagle Nebula',
  },
  'Horsehead Nebula': {
    image: '/images/horsehead.jpg',
    target: 'Horsehead Nebula',
  },
  'Orion Nebula': {
    image: '/images/orion.jpg',
    target: 'Orion Nebula',
  },
};

export default function ProjectManagementPanel({ projectId }: ProjectManagementPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { currentProject, updateProject } = useProjectStore();
  const { addToast } = useToast();
  const supabaseClient = useSupabaseClient();

  const handleExport = async () => {
    if (!currentProject) return;
    
    setIsExporting(true);
    try {
      // Get all files associated with the project
      const { data: files, error: filesError } = await supabaseClient
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);
      
      if (filesError) throw filesError;

      // Create export data
      const exportData = {
        project: currentProject,
        files: files,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Convert to JSON and create blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          
          // Validate import data
          if (!importData.project || !importData.files) {
            throw new Error('Invalid project export file');
          }

          // Create new project
          const { data: newProject, error: projectError } = await supabaseClient
            .from('projects')
            .insert([{
              ...importData.project,
              id: undefined, // Let database generate new ID
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              version: 1
            }])
            .select()
            .single();

          if (projectError) throw projectError;

          // Import files
          for (const file of importData.files) {
            const { error: fileError } = await supabaseClient
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
        } catch (error) {
          console.error('Import failed:', error);
          addToast('error', 'Failed to import project');
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
      addToast('error', 'Failed to import project');
      setIsImporting(false);
    }
  };

  const handleShare = async () => {
    if (!currentProject) return;

    try {
      // Create a share token
      const { data: shareToken, error: tokenError } = await supabaseClient
        .from('project_shares')
        .insert([{
          project_id: projectId,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }])
        .select()
        .single();

      if (tokenError) throw tokenError;

      // Generate share link
      const shareLink = `${window.location.origin}/share/${shareToken.id}`;
      setShareLink(shareLink);

      // Update project to be public
      await updateProject(supabaseClient, projectId, { isPublic: true });
      
      addToast('success', 'Project shared successfully');
      // Notification for project_shared
      // await sendNotification({ req, eventType: 'project_shared', type: 'info', message: `Project "${currentProject.name}" was shared with you.`, data: { projectId } });
    } catch (error) {
      console.error('Share failed:', error);
      addToast('error', 'Failed to share project');
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast('success', 'Link copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      addToast('error', 'Failed to copy link');
    }
  };

  const toggleFavorite = async () => {
    if (!currentProject) return;
    try {
      await updateProject(supabaseClient, projectId, { isFavorite: !currentProject.isFavorite });
      addToast('success', `Project ${currentProject.isFavorite ? 'removed from' : 'added to'} favorites`);
    } catch (error) {
      console.error('Failed to update favorite status:', error);
      addToast('error', 'Failed to update favorite status');
    }
  };

  const handleTagChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) return;
    const tags = e.target.value.split(',').map(tag => tag.trim());
    try {
      await updateProject(supabaseClient, projectId, { tags });
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
      await updateProject(supabaseClient, projectId, newProject);
      addToast('success', 'Project duplicated successfully');
      // Notification for project_duplicated
      // await sendNotification({ req, eventType: 'project_duplicated', type: 'success', message: `Project "${currentProject.name}" duplicated successfully!`, data: { projectId } });
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      addToast('error', 'Failed to duplicate project');
    }
  };

  const handleArchive = async () => {
    if (!currentProject) return;
    try {
      await updateProject(supabaseClient, projectId, { status: 'archived' });
      addToast('success', 'Project archived successfully');
      // Notification for project_archived
      // await sendNotification({ req, eventType: 'project_archived', type: 'info', message: `Project "${currentProject.name}" was archived.`, data: { projectId } });
    } catch (error) {
      console.error('Failed to archive project:', error);
      addToast('error', 'Failed to archive project');
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    try {
      await updateProject(supabaseClient, projectId, { status: 'deleted' });
      addToast('success', 'Project deleted successfully');
      // Notification for project_archived (deletion)
      // await sendNotification({ req, eventType: 'project_archived', type: 'warning', message: `Project "${currentProject.name}" was deleted.`, data: { projectId } });
    } catch (error) {
      console.error('Failed to delete project:', error);
      addToast('error', 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white">Project Management</h3>
      
      <div className="space-y-2">
        <button
          onClick={toggleFavorite}
          className={`w-full flex items-center space-x-2 px-4 py-2 ${currentProject?.isFavorite ? 'bg-yellow-500' : 'bg-gray-800'} hover:bg-yellow-600 text-white rounded-md transition-colors`}
        >
          <Star className="h-5 w-5" />
          <span>{currentProject?.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
        </button>

        <div className="relative">
          <input
            type="text"
            placeholder="Add tags, separated by commas"
            defaultValue={currentProject?.tags?.join(', ')}
            onBlur={handleTagChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Tag className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
        >
          <Download className="h-5 w-5" />
          <span>{isExporting ? 'Exporting...' : 'Export Project'}</span>
        </button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="project-import"
          />
          <label
            htmlFor="project-import"
            className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors cursor-pointer"
          >
            <Upload className="h-5 w-5" />
            <span>{isImporting ? 'Importing...' : 'Import Project'}</span>
          </label>
        </div>

        <button
          onClick={handleShare}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          <Share2 className="h-5 w-5" />
          <span>Share Project</span>
        </button>

        <button
          onClick={handleDuplicate}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <Duplicate className="h-5 w-5" />
          <span>Duplicate Project</span>
        </button>

        <button
          onClick={handleArchive}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <Archive className="h-5 w-5" />
          <span>Archive Project</span>
        </button>

        <button
          onClick={handleDelete}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <Trash className="h-5 w-5" />
          <span>Delete Project</span>
        </button>

        {shareLink && (
          <div className="mt-4 p-3 bg-gray-800 rounded-md">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                {isCopied ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 