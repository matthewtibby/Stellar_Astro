import React, { useRef } from 'react';
import { Button } from '@/src/components/ui/button';

interface ImportProjectDialogProps {
  onImport: (file: File) => void;
  loading: boolean;
  error?: string;
}

const ImportProjectDialog: React.FC<ImportProjectDialogProps> = ({ onImport, loading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
  };

  return (
    <div className="relative w-full">
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        id="project-import"
        disabled={loading}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full"
        variant="secondary"
      >
        {loading ? 'Importing...' : 'Import Project'}
      </Button>
      {error && <div className="text-red-500 text-center mt-2">{error}</div>}
    </div>
  );
};

export default ImportProjectDialog; 