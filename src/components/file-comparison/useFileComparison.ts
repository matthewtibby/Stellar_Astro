import { useState } from 'react';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useQuery } from '@tanstack/react-query';

export interface FileMetadata {
  filename: string;
  size: number;
  created_at: string;
  exposure: number;
  gain: number;
  temperature: number;
  filter: string;
  [key: string]: unknown;
}

export interface ComparisonResult {
  file1: string;
  file2: string;
  similarity: number;
  differences: {
    field: string;
    value1: unknown;
    value2: unknown;
  }[];
}

const fetchFiles = async (projectId: string) => {
  if (!projectId) return [];
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('project_files')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data.map((file: Record<string, unknown>) => ({
    filename: file.filename as string,
    size: file.size as number,
    created_at: file.created_at as string,
    exposure: file.exposure as number,
    gain: file.gain as number,
    temperature: file.temperature as number,
    filter: file.filter as string,
    metadata: file.metadata || {}
  }));
};

export default function useFileComparison(projectId: string) {
  const { addToast } = useToast();
  const queryResult = useQuery<FileMetadata[], Error>({
    queryKey: ['project_files', projectId],
    queryFn: () => fetchFiles(projectId),
    enabled: !!projectId,
  });
  const { data, isLoading, error, refetch } = queryResult;
  const files: FileMetadata[] = data ?? [];
  if (error) addToast('error', 'Failed to load files');

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

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
    setIsComparing(true);
    try {
      const file1 = files.find((f: FileMetadata) => f.filename === selectedFiles[0]);
      const file2 = files.find((f: FileMetadata) => f.filename === selectedFiles[1]);
      if (!file1 || !file2) return;
      const differences: ComparisonResult['differences'] = [];
      let similarity = 0;
      let totalFields = 0;
      const fieldsToCompare = ['exposure', 'gain', 'temperature', 'filter'];
      fieldsToCompare.forEach(field => {
        totalFields++;
        const meta1 = file1.metadata as Record<string, unknown>;
        const meta2 = file2.metadata as Record<string, unknown>;
        if (meta1[field] !== meta2[field]) {
          differences.push({
            field,
            value1: meta1[field],
            value2: meta2[field]
          });
        } else {
          similarity++;
        }
      });
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
      setIsComparing(false);
    }
  };

  const toggleResultExpansion = (index: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return {
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
    refetch,
  };
} 