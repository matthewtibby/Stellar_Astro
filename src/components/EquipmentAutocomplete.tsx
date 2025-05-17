"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { Telescope, Camera, Filter, searchTelescopes, searchCameras, searchFilters } from '@/src/data/equipmentDatabase';
import CustomEquipmentForm from './CustomEquipmentForm';

interface EquipmentAutocompleteProps {
  onSelect: (item: Telescope | Camera | Filter) => void;
  placeholder?: string;
  className?: string;
  type: 'telescope' | 'camera' | 'filter';
}

export default function EquipmentAutocomplete({ 
  onSelect, 
  placeholder = "Search for equipment...", 
  className = "",
  type
}: EquipmentAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Telescope | Camera | Filter)[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Telescope | Camera | Filter | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
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

  // Search for items when query changes
  useEffect(() => {
    if (query.length >= 2) {
      let searchResults: (Telescope | Camera | Filter)[] = [];
      
      switch (type) {
        case 'telescope':
          searchResults = searchTelescopes(query);
          break;
        case 'camera':
          searchResults = searchCameras(query);
          break;
        case 'filter':
          searchResults = searchFilters(query);
          break;
      }
      
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedItem(null);
  };

  const handleSelectItem = (item: Telescope | Camera | Filter) => {
    setSelectedItem(item);
    setQuery(`${item.brand} ${item.model}`);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedItem(null);
    setResults([]);
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    setShowCustomForm(true);
    setIsOpen(false);
  };

  const handleSaveCustom = (item: Telescope | Camera) => {
    setSelectedItem(item);
    setQuery(`${item.brand} ${item.model}`);
    setShowCustomForm(false);
    onSelect(item);
  };

  const renderItemDetails = (item: Telescope | Camera | Filter) => {
    if (type === 'telescope' && 'aperture' in item) {
      const telescope = item as Telescope;
      return (
        <>
          <div className="text-sm text-gray-400">
            {telescope.aperture}mm • f/{telescope.focalLength / telescope.aperture} • {telescope.type}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {telescope.description}
          </div>
        </>
      );
    } else if (type === 'camera' && 'sensor' in item) {
      const camera = item as Camera;
      return (
        <>
          <div className="text-sm text-gray-400">
            {camera.sensor} • {camera.resolution} • {camera.sensorSize}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {camera.description}
          </div>
        </>
      );
    } else if (type === 'filter' && 'type' in item) {
      const filter = item as Filter;
      return (
        <>
          <div className="text-sm text-gray-400">
            {filter.type} • {filter.size}mm {filter.wavelength ? `• ${filter.wavelength}` : ''}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {filter.description}
          </div>
        </>
      );
    }
    return null;
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
          onFocus={() => query.length >= 2 && setIsOpen(true)}
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
      
      {showCustomForm && (type === 'telescope' || type === 'camera') && (
        <div className="absolute z-10 mt-1 w-full">
          <CustomEquipmentForm
            type={type}
            onSave={handleSaveCustom}
            onCancel={() => setShowCustomForm(false)}
          />
        </div>
      )}
      
      {isOpen && !showCustomForm && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 shadow-lg rounded-md border border-gray-700 max-h-60 overflow-auto">
          <ul className="py-1">
            {results.length > 0 ? (
              results.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex flex-col"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{item.brand} {item.model}</span>
                  </div>
                  {renderItemDetails(item)}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-400">
                No results found
              </li>
            )}
            
            {(type === 'telescope' || type === 'camera') && (
              <li 
                onClick={handleAddCustom}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center text-blue-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Add Custom {type === 'telescope' ? 'Telescope' : 'Camera'}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 