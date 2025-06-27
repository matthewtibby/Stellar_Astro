import React from 'react';
import { Trash2, Info } from 'lucide-react';
import type { FileType } from '@/src/types/store';
import type { StorageFileWithMetadata } from '../types/upload.types';

interface FileListProps {
  filesByType: Record<FileType, StorageFileWithMetadata[]>;
  activeTab: FileType;
  viewAll: boolean;
  selectedFiles: Set<string>;
  toggleFileSelection: (filePath: string) => void;
  handleFileListKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, idx: number, file: StorageFileWithMetadata) => void;
  fileRowRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  handlePreview: (file: StorageFileWithMetadata) => void;
  handleDelete: (file: StorageFileWithMetadata) => void;
  handleBulkDelete: () => void;
  filesLoading: boolean;
  selectedFilePath?: string | null;
  setMetadataModalFile: (file: StorageFileWithMetadata | null) => void;
  formatFileSize: (size: number) => string;
}

export const FileList: React.FC<FileListProps> = ({
  filesByType,
  activeTab,
  viewAll,
  selectedFiles,
  toggleFileSelection,
  handleFileListKeyDown,
  fileRowRefs,
  handlePreview,
  handleDelete,
  handleBulkDelete,
  filesLoading,
  selectedFilePath,
  setMetadataModalFile,
  formatFileSize,
}) => (
  <div className="bg-[#10131a]/90 rounded-2xl p-6 border border-[#232946]/60 shadow-xl">
    <h3 className="text-lg font-bold text-white mb-4">
      {viewAll
        ? 'All Frames'
        : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Frames`}
      <span className="ml-2 text-sm text-blue-300">
        {viewAll
          ? `(${Object.values(filesByType).flat().length} files)`
          : `(${filesByType[activeTab]?.length || 0} files)`}
      </span>
    </h3>
    {viewAll && (
      <div className="mb-2 p-2 bg-blue-900/30 text-blue-200 rounded text-sm text-center">
        Viewing all frames across all types
      </div>
    )}
    {selectedFiles.size > 0 && (
      <button
        className="mb-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm font-semibold shadow"
        onClick={() => handleBulkDelete()}
        aria-label="Delete selected files"
      >
        Delete Selected ({selectedFiles.size})
      </button>
    )}
    <div className="space-y-2">
      {filesLoading ? (
        <div className="flex flex-col items-center justify-center py-8 text-blue-300/80">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#232946" /><circle cx="32" cy="18" r="4" fill="#3b82f6" /><circle cx="18" cy="30" r="2" fill="#fbbf24" /><circle cx="28" cy="32" r="1.5" fill="#fff" /><circle cx="14" cy="18" r="1.5" fill="#fff" /></svg>
          <div className="mt-4 text-lg font-semibold animate-bounce">Loading files...</div>
        </div>
      ) : (
        (viewAll
          ? Object.entries(filesByType).flatMap(([type, files]) =>
              files.map(file => ({ ...file, type: type as FileType }))
            )
          : filesByType[activeTab] || []
        )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((file, idx) => (
            <div
              key={file.path}
              className={`flex items-center p-2 bg-[#181c23] rounded-lg group border border-[#232946]/40 shadow transition-colors cursor-pointer ${
                (selectedFilePath ? selectedFilePath === file.path : false)
                  ? 'bg-blue-900/60 border-blue-400 ring-2 ring-blue-400' : 'hover:bg-blue-800/30'
              }`}
              onClick={() => handlePreview(file)}
              onKeyDown={e => handleFileListKeyDown(e, idx, file)}
              ref={el => { fileRowRefs.current[idx] = el; }}
              role="option"
              aria-label={`File ${file.name}`}
              aria-selected={selectedFilePath ? selectedFilePath === file.path : false}
              tabIndex={selectedFilePath ? 0 : -1}
            >
              <input
                type="checkbox"
                className="mr-3 accent-blue-500 h-4 w-4 rounded focus:ring-2 focus:ring-blue-400"
                checked={selectedFiles.has(file.path)}
                onChange={e => { e.stopPropagation(); toggleFileSelection(file.path); }}
                aria-label={`Select file ${file.name}`}
                tabIndex={0}
              />
              <span className="text-xs text-blue-100 font-mono truncate overflow-hidden whitespace-nowrap max-w-[12rem]" title={`${file.name} (${formatFileSize(file.size)})`}>{file.name}</span>
              {viewAll && (
                <span className="ml-2 px-2 py-0.5 rounded bg-blue-900 text-xs text-blue-300 border border-blue-700">
                  {file.type}
                </span>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  className="text-blue-300 hover:text-blue-500"
                  onClick={e => { e.stopPropagation(); setMetadataModalFile(file); }}
                  aria-label="Show file metadata"
                >
                  <Info className="h-4 w-4" />
                </button>
                <button
                  className="text-blue-300 hover:text-red-500"
                  onClick={e => { e.stopPropagation(); handleDelete(file); }}
                  aria-label="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
      )}
      {((viewAll && Object.values(filesByType).flat().length === 0) || (!viewAll && (!filesByType[activeTab] || filesByType[activeTab].length === 0))) && !filesLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-blue-300/80 animate-fade-in">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#232946" /><circle cx="32" cy="18" r="4" fill="#3b82f6" /><circle cx="18" cy="30" r="2" fill="#fbbf24" /><circle cx="28" cy="32" r="1.5" fill="#fff" /><circle cx="14" cy="18" r="1.5" fill="#fff" /></svg>
          <div className="mt-4 text-lg font-semibold animate-bounce">No files yet</div>
          <div className="text-sm animate-fade-in">Launch your first upload to see your data here!</div>
        </div>
      )}
    </div>
  </div>
); 