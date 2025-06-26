import React from 'react';
import { FileType, StorageFile } from '../types';
import { CSS_CLASSES } from '../constants';
import { FileTypeNavigation } from './FileTypeNavigation';
import { SearchAndFilter } from './SearchAndFilter';
import { FileListDisplay } from './FileListDisplay';

interface MainContentAreaProps {
  activeTab: FileType;
  onTabChange: (tab: FileType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  tagFilter: string;
  onTagFilterChange: (filter: string) => void;
  onClearTagFilter: () => void;
  showSearchInput: boolean;
  files: StorageFile[];
  onPreview: (file: StorageFile) => void;
  onDownload: (file: StorageFile) => void;
  onDelete: (file: StorageFile) => void;
  hasFiles: boolean;
}

/**
 * MainContentArea component for the main content layout
 * Combines navigation, search/filter, and file list display
 */
export const MainContentArea: React.FC<MainContentAreaProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  onClearTagFilter,
  showSearchInput,
  files,
  onPreview,
  onDownload,
  onDelete,
  hasFiles
}) => {
  return (
    <div className="flex">
      <FileTypeNavigation 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className={CSS_CLASSES.CONTENT}>
        <SearchAndFilter 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          tagFilter={tagFilter}
          onTagFilterChange={onTagFilterChange}
          onClearTagFilter={onClearTagFilter}
          showSearchInput={showSearchInput}
        />

        <FileListDisplay 
          files={files}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
          hasFiles={hasFiles}
        />
      </div>
    </div>
  );
}; 