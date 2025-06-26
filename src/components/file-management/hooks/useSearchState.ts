import { useState, useMemo } from 'react';
import { FileType, StorageFile, FilesByType } from '../types';
import { FilterService } from '../services';

/**
 * Custom hook for managing search and filter state
 * Handles active tab, search term, tag filter, and filtered results
 */
export const useSearchState = (filesByType: FilesByType) => {
  const [activeTab, setActiveTab] = useState<FileType>('light');
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Memoized filtered files based on current filters
  const filteredFiles = useMemo(() => {
    const files = filesByType[activeTab] || [];
    return FilterService.applyFilters(files, tagFilter, searchTerm);
  }, [filesByType, activeTab, tagFilter, searchTerm]);

  // Get file count for current tab
  const currentFileCount = useMemo(() => {
    const files = filesByType[activeTab] || [];
    return FilterService.getFileCount(files);
  }, [filesByType, activeTab]);

  // Check if current tab has files
  const hasFiles = useMemo(() => {
    const files = filesByType[activeTab] || [];
    return FilterService.hasFiles(files);
  }, [filesByType, activeTab]);

  const clearFilters = () => {
    setSearchTerm('');
    setTagFilter('');
  };

  const clearTagFilter = () => {
    setTagFilter('');
  };

  const clearSearchTerm = () => {
    setSearchTerm('');
  };

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    tagFilter,
    setTagFilter,
    filteredFiles,
    currentFileCount,
    hasFiles,
    clearFilters,
    clearTagFilter,
    clearSearchTerm
  };
}; 