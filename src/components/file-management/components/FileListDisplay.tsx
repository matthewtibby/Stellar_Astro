import React from 'react';
import { File, Download, Eye, X } from 'lucide-react';
import { StorageFile } from '../types';
import { UI_TEXT, CSS_CLASSES } from '../constants';
import { UtilityService } from '../services';

interface FileListDisplayProps {
  files: StorageFile[];
  onPreview: (file: StorageFile) => void;
  onDownload: (file: StorageFile) => void;
  onDelete: (file: StorageFile) => void;
  hasFiles: boolean;
}

/**
 * FileListDisplay component for rendering file list with actions
 * Handles file display, empty state, and file action buttons
 */
export const FileListDisplay: React.FC<FileListDisplayProps> = ({
  files,
  onPreview,
  onDownload,
  onDelete,
  hasFiles
}) => {
  if (!hasFiles) {
    return (
      <div className="text-center py-8">
        <File className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">{UI_TEXT.EMPTY_STATE_TITLE}</p>
        <p className="text-sm text-gray-500 mt-1">{UI_TEXT.EMPTY_STATE_SUBTITLE}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const displayInfo = UtilityService.getFileDisplayInfo(file);
        
        return (
          <div key={file.path} className={CSS_CLASSES.FILE_ITEM}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-white">{displayInfo.name}</p>
                  <p className="text-xs text-gray-400">
                    {displayInfo.sizeFormatted} • {displayInfo.dateFormatted} • {displayInfo.typeDisplay}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPreview(file)}
                  className={CSS_CLASSES.ICON_BUTTON}
                  title={UI_TEXT.PREVIEW_TOOLTIP}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDownload(file)}
                  className={CSS_CLASSES.ICON_BUTTON}
                  title={UI_TEXT.DOWNLOAD_TOOLTIP}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(file)}
                  className={CSS_CLASSES.ICON_BUTTON_DANGER}
                  title={UI_TEXT.DELETE_TOOLTIP}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray((file as unknown as { tags?: unknown }).tags) ? (file as unknown as { tags: string[] }).tags : [])
                .map((tag: string, i: number) => (
                  <span key={i} className={CSS_CLASSES.TAG_BADGE}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 