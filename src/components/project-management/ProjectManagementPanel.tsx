'use client';
import React, { useState } from 'react';
import { Star, Tag, Download, Upload, Copy, Archive, Trash } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import ActionButton from './ActionButton';
import TagInput from './TagInput';
import ImportProjectDialog from './ImportProjectDialog';
import { useProjectActions } from './useProjectActions';

interface ProjectManagementPanelProps {
  projectId: string;
}

const ProjectManagementPanel: React.FC<ProjectManagementPanelProps> = ({ projectId }) => {
  const {
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
  } = useProjectActions(projectId);

  const [tagValue, setTagValue] = useState(currentProject?.tags?.join(', ') || '');

  // Update tag value on blur
  const handleTagBlur = () => {
    const tags = tagValue.split(',').map(tag => tag.trim()).filter(Boolean);
    updateTags(tags);
  };

  return (
    <Card className="space-y-4 p-4 bg-gray-900/50 border border-gray-700">
      <h3 className="text-lg font-semibold text-white">Project Management</h3>
      <div className="space-y-2">
        <ActionButton
          onClick={toggleFavorite}
          icon={<Star className="h-5 w-5" />}
          label={currentProject?.isFavorite ? 'Unfavorite' : 'Favorite'}
          variant={currentProject?.isFavorite ? 'secondary' : 'default'}
        />
        <div className="relative">
          <TagInput
            value={tagValue}
            onChange={setTagValue}
            disabled={isExporting || isImporting}
          />
          <Tag className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        </div>
        <ActionButton
          onClick={handleExport}
          icon={<Download className="h-5 w-5" />}
          label="Export Project"
          loading={isExporting}
          disabled={isImporting}
        />
        <ImportProjectDialog
          onImport={handleImport}
          loading={isImporting}
          error={importError || undefined}
        />
        <ActionButton
          onClick={handleDuplicate}
          icon={<Copy className="h-5 w-5" />}
          label="Duplicate Project"
          disabled={isExporting || isImporting}
        />
        <ActionButton
          onClick={handleArchive}
          icon={<Archive className="h-5 w-5" />}
          label="Archive Project"
          disabled={isExporting || isImporting}
        />
        <ActionButton
          onClick={handleDelete}
          icon={<Trash className="h-5 w-5" />}
          label="Delete Project"
          variant="destructive"
          disabled={isExporting || isImporting}
        />
      </div>
    </Card>
  );
};

export default ProjectManagementPanel; 