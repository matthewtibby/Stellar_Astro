'use client';

import React, { useEffect, useState } from 'react';
import { getFilesByType, type StorageFile } from '@/src/utils/storage';
import { File, Trash2, Eye } from 'lucide-react';
import { type FileType } from '@/src/types/store';

interface FileListProps {
  projectId: string;
  fileType: FileType;
  onFileSelect?: (file: StorageFile) => void;
}

export function FileList({ projectId, fileType, onFileSelect }: FileListProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        const filesByType = await getFilesByType(projectId);
        setFiles(filesByType[fileType] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [projectId, fileType]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return <div>No files found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3 capitalize">
          {fileType.replace('-', ' ')} Frames
        </h3>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between bg-black/30 p-3 rounded-md hover:bg-black/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(file.size)} • {formatDate(file.created_at)}
                  </p>
                  {file.metadata && (
                    <div className="mt-1 text-xs text-gray-500">
                      <p>Exposure: {String(file.metadata.exposure_time ?? '')}s</p>
                      {typeof file.metadata.filter !== 'undefined' && <p>Filter: {String(file.metadata.filter)}</p>}
                      {typeof file.metadata.temperature !== 'undefined' && <p>Temp: {String(file.metadata.temperature)}°C</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onFileSelect?.(file)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="View file"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {/* TODO: Implement delete */}}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FileList; 