"use client";

import { useState, useEffect, useRef } from 'react';
import { AstronomicalTarget, searchTargets } from '@/src/data/astronomicalTargets';
import { Search, X } from 'lucide-react';

interface TargetAutocompleteProps {
  onSelect: (target: AstronomicalTarget) => void;
  placeholder?: string;
  className?: string;
}

export default function TargetAutocomplete({ 
  onSelect, 
  placeholder = "Search for a target...", 
  className = "" 
}: TargetAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AstronomicalTarget[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<AstronomicalTarget | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ensure dropdown is closed when a target is selected
  useEffect(() => {
    if (selectedTarget) {
      setIsOpen(false);
    }
  }, [selectedTarget]);

  // Search for targets when query changes
  useEffect(() => {
    if (query.length >= 2 && !selectedTarget) {
      const searchResults = searchTargets(query);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, selectedTarget]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selectedTarget) {
      setSelectedTarget(null);
    }
  };

  const handleSelectTarget = (target: AstronomicalTarget) => {
    if (selectedTarget?.id === target.id) return; // Prevent double selection
    setSelectedTarget(target);
    setQuery(target.name);
    setIsOpen(false); // Ensure dropdown is closed
    onSelect(target);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedTarget(null);
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && !selectedTarget && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 shadow-lg rounded-md border border-gray-700 max-h-60 overflow-auto">
          <ul className="py-1">
            {results.map((target) => (
              <li 
                key={target.id}
                onClick={() => handleSelectTarget(target)}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex flex-col"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-white">{target.name}</span>
                  <span className="text-sm text-gray-400">{target.catalogIds.join(', ')}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {target.constellation} • {target.category}
                </div>
                {target.commonNames.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Also known as: {target.commonNames.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 