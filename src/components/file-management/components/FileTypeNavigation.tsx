import React from 'react';
import { FileType } from '../types';
import { INITIAL_FILE_TYPES, FILE_TYPE_LABELS, CSS_CLASSES } from '../constants';

interface FileTypeNavigationProps {
  activeTab: FileType;
  onTabChange: (tab: FileType) => void;
}

/**
 * FileTypeNavigation component for file type tab navigation
 * Displays sidebar with file type buttons
 */
export const FileTypeNavigation: React.FC<FileTypeNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className={CSS_CLASSES.SIDEBAR}>
      <div className="space-y-2">
        {INITIAL_FILE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onTabChange(type)}
            className={`${CSS_CLASSES.TAB_BASE} ${
              activeTab === type ? CSS_CLASSES.TAB_ACTIVE : CSS_CLASSES.TAB_INACTIVE
            }`}
          >
            {FILE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}; 