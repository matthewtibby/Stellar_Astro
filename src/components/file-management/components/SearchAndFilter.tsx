import React from 'react';
import { UI_TEXT, CSS_CLASSES } from '../constants';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  tagFilter: string;
  onTagFilterChange: (filter: string) => void;
  onClearTagFilter: () => void;
  showSearchInput: boolean;
}

/**
 * SearchAndFilter component for search and filter controls
 * Handles tag filtering and search input
 */
export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  onClearTagFilter,
  showSearchInput
}) => {
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={tagFilter}
          onChange={e => onTagFilterChange(e.target.value)}
          placeholder={UI_TEXT.TAG_FILTER_PLACEHOLDER}
          className={CSS_CLASSES.INPUT_BASE}
        />
        {tagFilter && (
          <button onClick={onClearTagFilter} className={CSS_CLASSES.BUTTON_SMALL}>
            {UI_TEXT.CLEAR_BUTTON}
          </button>
        )}
      </div>

      {showSearchInput && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={CSS_CLASSES.SEARCH_INPUT}
          />
        </div>
      )}
    </>
  );
}; 