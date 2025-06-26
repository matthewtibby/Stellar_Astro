import React from 'react';
import { RefreshCw } from 'lucide-react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface HeaderSectionProps {
  fileCount: number;
  onRefresh: () => void;
}

/**
 * HeaderSection component for the panel header
 * Displays title, file count, and refresh button
 */
export const HeaderSection: React.FC<HeaderSectionProps> = ({
  fileCount,
  onRefresh
}) => {
  return (
    <div className={CSS_CLASSES.HEADER}>
      <h3 className={CSS_CLASSES.TITLE}>{UI_TEXT.TITLE}</h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">
          {fileCount} files
        </span>
        <button 
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
          title={UI_TEXT.REFRESH_TOOLTIP}
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}; 