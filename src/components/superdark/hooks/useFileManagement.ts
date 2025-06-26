import { useState, useEffect } from 'react';
import { DarkFileWithMetadata, Project } from '../types/superdark.types';
import { MetadataService, ValidationService } from '../services';

export const useFileManagement = (
  showModal: boolean,
  userId?: string,
  projects?: Project[]
) => {
  const [availableDarks, setAvailableDarks] = useState<DarkFileWithMetadata[]>([]);
  const [tempFiles, setTempFiles] = useState<DarkFileWithMetadata[]>([]);
  const [selectedDarkPaths, setSelectedDarkPaths] = useState<string[]>([]);

  // Fetch available dark frames when modal opens
  useEffect(() => {
    if (!showModal || !userId || !projects || projects.length === 0) return;
    
    const fetchDarks = async () => {
      const allDarks = await MetadataService.fetchAllProjectDarks(
        projects.filter(p => p.title) as Project[], 
        userId
      );
      setAvailableDarks(allDarks);
    };

    fetchDarks();
  }, [showModal, userId, projects]);

  // Handle dark frame checkbox selection
  const handleDarkCheckbox = (path: string, checked: boolean) => {
    setSelectedDarkPaths(prev => 
      checked ? [...prev, path] : prev.filter(p => p !== path)
    );
  };

  // Add temporary files to the list
  const addTempFiles = (newTempFiles: DarkFileWithMetadata[]) => {
    setTempFiles(prev => [...prev, ...newTempFiles]);
  };

  // Remove a specific temporary file
  const removeTempFile = (tempFile: DarkFileWithMetadata) => {
    setTempFiles(prev => prev.filter(tf => tf.path !== tempFile.path));
    setSelectedDarkPaths(prev => prev.filter(path => path !== tempFile.path));
  };

  // Clear all temporary files
  const clearTempFiles = () => {
    setTempFiles([]);
  };

  // Reset all selections
  const resetSelection = () => {
    setSelectedDarkPaths([]);
    setTempFiles([]);
  };

  // Combine permanent and temporary files
  const allFiles = [...availableDarks, ...tempFiles];

  // Get the best matching group for highlighting
  const { bestGroup } = ValidationService.groupByMatchingFrames(allFiles);

  return {
    availableDarks,
    tempFiles,
    selectedDarkPaths,
    allFiles,
    bestGroup,
    handleDarkCheckbox,
    addTempFiles,
    removeTempFile,
    clearTempFiles,
    resetSelection
  };
}; 