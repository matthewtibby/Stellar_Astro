import React from 'react';
import { UploadProgress } from '../types/superdark.types';

interface UploadSectionProps {
  isUploading: boolean;
  uploadProgress: UploadProgress;
  uploadedCount: number;
  totalToUpload: number;
  onFileUpload: (files: File[]) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  isUploading,
  uploadProgress,
  uploadedCount,
  totalToUpload,
  onFileUpload
}) => {
  return (
    <div className="mb-6 p-4 bg-[#181c23] rounded-lg border border-[#232946]/60">
      <label className="block font-medium mb-2 text-blue-100 text-lg">
        Upload Additional Dark Frames
      </label>
      <input
        type="file"
        multiple
        accept=".fits,.fit,.fts"
        onChange={e => {
          if (e.target.files) {
            onFileUpload(Array.from(e.target.files));
            e.target.value = ''; // Reset input
          }
        }}
        disabled={isUploading}
        className="block w-full text-sm text-blue-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-blue-100 hover:file:bg-blue-800 disabled:opacity-50"
      />
      
      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-blue-200">
            <span>Uploading files...</span>
            <span>{uploadedCount}/{totalToUpload}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalToUpload > 0 ? (uploadedCount / totalToUpload) * 100 : 0}%` }}
            />
          </div>
          
          {/* Individual file progress */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(uploadProgress).map(([fileName, status]) => (
              <div key={fileName} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'validating' ? 'bg-yellow-500 animate-pulse' :
                  status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                  status === 'complete' ? 'bg-green-500' :
                  status === 'warning' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="flex-1 truncate">{fileName}</span>
                <span className="text-blue-300">
                  {status === 'validating' ? 'Validating...' :
                   status === 'uploading' ? 'Uploading...' :
                   status === 'complete' ? 'Complete' :
                   status === 'warning' ? 'Warning' :
                   'Error'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 