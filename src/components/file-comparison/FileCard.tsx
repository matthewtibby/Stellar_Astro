import { File, CheckCircle } from 'lucide-react';
import { formatDate, formatFileSize } from './helpers';
import React from 'react';
import { FileMetadata } from './useFileComparison';
import { Card } from '@/src/components/ui/card';

interface FileCardProps {
  file: FileMetadata;
  selected: boolean;
  onClick: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, selected, onClick }) => (
  <Card
    onClick={onClick}
    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
      selected ? 'bg-blue-900/50 border-blue-700' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
    }`}
    tabIndex={0}
    role="button"
    aria-pressed={selected}
  >
    <div className="flex items-center space-x-3">
      <File className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm text-white">{file.filename}</p>
        <p className="text-xs text-gray-400">
          {formatFileSize(file.size)} • {formatDate(file.created_at)}
        </p>
      </div>
      {selected && <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />}
    </div>
  </Card>
);

export default FileCard; 