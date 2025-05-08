import { useState, useEffect } from 'react';
import { File, X, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useSupabaseClient } from '../../app/SupabaseProvider';
import { useToast } from '../hooks/useToast';

interface FileComparisonPanelProps {
  projectId: string;
}

interface FileMetadata {
  filename: string;
  size: number;
  created_at: string;
  exposure: number;
  gain: number;
  temperature: number;
  filter: string;
  [key: string]: any;
}

interface ComparisonResult {
  file1: string;
  file2: string;
  similarity: number;
  differences: {
    field: string;
    value1: any;
    value2: any;
  }[];
}

export default function FileComparisonPanel({ projectId }: FileComparisonPanelProps) {
  const supabaseClient = useSupabaseClient();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      const filesWithMetadata = data.map(file => ({
        ...file,
        metadata: file.metadata || {}
      }));

      setFiles(filesWithMetadata);
    } catch (error) {
      console.error('Error loading files:', error);
      addToast('error', 'Failed to load files');
    }
  };

  const handleFileSelect = (filename: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(filename)) {
        return prev.filter(f => f !== filename);
      }
      if (prev.length < 2) {
        return [...prev, filename];
      }
      return prev;
    });
  };

  const compareFiles = async () => {
    if (selectedFiles.length !== 2) return;

    setIsLoading(true);
    try {
      const file1 = files.find(f => f.filename === selectedFiles[0]);
      const file2 = files.find(f => f.filename === selectedFiles[1]);

      if (!file1 || !file2) return;

      const differences: ComparisonResult['differences'] = [];
      let similarity = 0;
      let totalFields = 0;

      // Compare metadata fields
      const fieldsToCompare = ['exposure', 'gain', 'temperature', 'filter'];
      fieldsToCompare.forEach(field => {
        totalFields++;
        if (file1.metadata[field] !== file2.metadata[field]) {
          differences.push({
            field,
            value1: file1.metadata[field],
            value2: file2.metadata[field]
          });
        } else {
          similarity++;
        }
      });

      // Compare file properties
      const propertiesToCompare = ['size', 'created_at'];
      propertiesToCompare.forEach(prop => {
        totalFields++;
        if (file1[prop] !== file2[prop]) {
          differences.push({
            field: prop,
            value1: file1[prop],
            value2: file2[prop]
          });
        } else {
          similarity++;
        }
      });

      const result: ComparisonResult = {
        file1: file1.filename,
        file2: file2.filename,
        similarity: (similarity / totalFields) * 100,
        differences
      };

      setComparisonResults(prev => [...prev, result]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error comparing files:', error);
      addToast('error', 'Failed to compare files');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResultExpansion = (index: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white">File Comparison</h3>
      
      <div className="space-y-4">
        {/* File selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map(file => (
            <div
              key={file.filename}
              onClick={() => handleFileSelect(file.filename)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedFiles.includes(file.filename)
                  ? 'bg-blue-900/50 border-blue-700'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-white">{file.filename}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)} • {formatDate(file.created_at)}
                  </p>
                </div>
                {selectedFiles.includes(file.filename) && (
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compare button */}
        <button
          onClick={compareFiles}
          disabled={selectedFiles.length !== 2 || isLoading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Comparing...' : 'Compare Selected Files'}
        </button>

        {/* Comparison results */}
        <div className="space-y-4">
          {comparisonResults.map((result, index) => (
            <div
              key={`${result.file1}-${result.file2}`}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleResultExpansion(index)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-white">
                    {result.file1} vs {result.file2}
                  </span>
                  <span className={`text-sm ${
                    result.similarity > 80 ? 'text-green-500' :
                    result.similarity > 50 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    ({result.similarity.toFixed(1)}% similar)
                  </span>
                </div>
                {expandedResults[index] ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {expandedResults[index] && (
                <div className="mt-4 space-y-2">
                  {result.differences.map((diff, i) => (
                    <div
                      key={i}
                      className="p-2 bg-gray-700/50 rounded-md text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-300">{diff.field}:</span>
                        <span className="text-red-400">{diff.value1}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-400">{diff.value2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 