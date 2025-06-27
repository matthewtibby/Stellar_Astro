import React from 'react';
import type { UploadStatus as UploadStatusType } from '../types/upload.types';
import type { FileType } from '@/src/types/store';

interface UploadStatusPanelProps {
  isUploading: boolean;
  batchTotalBytes: number;
  batchUploadedBytes: number;
  batchSpeed: number;
  batchETA: number | null;
  uploadStatuses: UploadStatusType[];
  retryUpload: (file: File, fileType: FileType) => Promise<void>;
  retryAllFailed: () => void;
  activeTab: FileType;
}

export const UploadStatusPanel: React.FC<UploadStatusPanelProps> = ({
  isUploading,
  batchTotalBytes,
  batchUploadedBytes,
  batchSpeed,
  batchETA,
  uploadStatuses,
  retryUpload,
  retryAllFailed,
  activeTab,
}) => (
  isUploading ? (
    <div className="mt-4 bg-gray-800/70 rounded-lg p-4 border border-blue-700">
      <h4 className="text-blue-300 text-sm mb-2">Uploading Files...</h4>
      {/* Batch progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-200">Batch Progress</span>
          <span className="text-xs text-gray-400">
            {batchTotalBytes > 0 ? `${((batchUploadedBytes / batchTotalBytes) * 100).toFixed(0)}%` : '0%'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded h-2">
          <div
            className="h-2 rounded bg-blue-500"
            style={{ width: `${batchTotalBytes > 0 ? (batchUploadedBytes / batchTotalBytes) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
          <span>
            Speed: {batchSpeed > 0 ? `${(batchSpeed / 1024 / 1024).toFixed(2)} MB/s` : '--'}
          </span>
          <span>
            ETA: {batchETA !== null && batchETA > 0 ? `${Math.floor(batchETA / 60)}m ${Math.round(batchETA % 60)}s` : '--'}
          </span>
        </div>
      </div>
      {uploadStatuses.map((status) => (
        <div key={status.file.name} className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-200">
              {status.file.name}
            </span>
            <span className="text-xs text-gray-400">
              {status.status === 'completed' ? '✓' : `${Math.round((status.progress || 0) * 100)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2 mt-1">
            <div
              className={`h-2 rounded ${
                status.status === 'completed' 
                  ? 'bg-green-500' 
                  : status.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.round((status.progress || 0) * 100)}%` }}
            />
          </div>
          {status.status === 'error' && (
            <div className="flex items-center mt-1">
              <p className="text-xs text-red-400 flex-1">{status.error}</p>
              <button
                className="ml-2 px-2 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs"
                onClick={async (e) => {
                  e.stopPropagation();
                  await retryUpload(status.file, status.type || activeTab);
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      ))}
      {uploadStatuses.some(s => s.status === 'error') && (
        <button
          className="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm"
          onClick={retryAllFailed}
        >
          Retry All Failed
        </button>
      )}
    </div>
  ) : null
); 