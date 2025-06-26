import React, { useRef } from 'react';
import { XCircle } from 'lucide-react';
import { FRAME_TYPES } from '../types/calibration.types';
import type { MasterType } from '../types/calibration.types';

interface FileListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: MasterType;
  realFiles: string[];
  fileSearch: string;
  onFileSearchChange: (search: string) => void;
}

export const FileListModal: React.FC<FileListModalProps> = ({
  isOpen,
  onClose,
  selectedType,
  realFiles,
  fileSearch,
  onFileSearchChange,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter files based on search
  const filteredFiles = realFiles.filter(file =>
    file.toLowerCase().includes(fileSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div 
        ref={modalRef} 
        className="bg-[#10131a] rounded-2xl shadow-2xl border border-[#232946]/60 p-8 w-[420px] max-h-[80vh] flex flex-col animate-slide-in"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white">
            All {FRAME_TYPES.find(f => f.key === selectedType)?.label} Files
          </h4>
          <button
            className="p-2 rounded-full hover:bg-blue-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={onClose}
            aria-label="Close file list modal"
          >
            <XCircle className="w-6 h-6 text-blue-200" />
          </button>
        </div>
        
        <input
          type="text"
          className="mb-4 px-3 py-2 rounded bg-[#181c23] text-white border border-[#232946]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          placeholder="Search files..."
          value={fileSearch}
          onChange={e => onFileSearchChange(e.target.value)}
          aria-label="Search files"
        />
        
        <div className="overflow-y-auto flex-1">
          {filteredFiles.length === 0 ? (
            <div className="text-blue-200 text-center py-8">No files found.</div>
          ) : (
            <ul className="space-y-2">
              {filteredFiles.map((file, idx) => (
                <li 
                  key={file} 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#181c23] border border-[#232946]/40 shadow hover:bg-blue-900/30 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-blue-900/40 rounded-full text-blue-200 font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="text-blue-100 font-mono truncate">{file}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}; 