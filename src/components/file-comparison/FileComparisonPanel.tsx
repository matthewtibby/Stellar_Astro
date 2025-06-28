import React from 'react';
import FileCard from './FileCard';
import ComparisonResultPanel from './ComparisonResultPanel';
import useFileComparison, { FileMetadata, ComparisonResult } from './useFileComparison';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';

interface FileComparisonPanelProps {
  projectId: string;
}

const FileComparisonPanel: React.FC<FileComparisonPanelProps> = ({ projectId }) => {
  const {
    files,
    selectedFiles,
    comparisonResults,
    isLoading,
    isComparing,
    error,
    expandedResults,
    handleFileSelect,
    compareFiles,
    toggleResultExpansion,
  } = useFileComparison(projectId);

  return (
    <Card className="space-y-4 p-4 bg-gray-900/50 border border-gray-700">
      <h3 className="text-lg font-semibold text-white">File Comparison</h3>
      <div className="space-y-4">
        {/* File selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file: FileMetadata) => (
            <FileCard
              key={file.filename}
              file={file}
              selected={selectedFiles.includes(file.filename)}
              onClick={() => handleFileSelect(file.filename)}
            />
          ))}
        </div>
        {/* Compare button */}
        <Button
          onClick={compareFiles}
          disabled={selectedFiles.length !== 2 || isComparing}
          className="w-full"
        >
          {isComparing ? 'Comparing...' : 'Compare Selected Files'}
        </Button>
        {/* Loading and error states */}
        {isLoading && <div className="text-blue-400 text-center">Loading files...</div>}
        {error && <div className="text-red-500 text-center">Failed to load files.</div>}
        {/* Comparison results */}
        <div className="space-y-4">
          {comparisonResults.map((result: ComparisonResult, index: number) => (
            <ComparisonResultPanel
              key={`${result.file1}-${result.file2}`}
              result={result}
              expanded={!!expandedResults[index]}
              onToggle={() => toggleResultExpansion(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FileComparisonPanel; 