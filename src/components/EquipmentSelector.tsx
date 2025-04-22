'use client';

import { useState } from 'react';
import { EquipmentItem, telescopes, cameras } from '@/src/utils/equipment';
import { useCurrency } from '@/components/CurrencyProvider';
import { formatPrice } from '@/lib/currency';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface EquipmentSelectorProps {
  onSelectTelescope: (telescope: EquipmentItem) => void;
  onSelectCamera: (camera: EquipmentItem) => void;
  selectedTelescope?: EquipmentItem;
  selectedCamera?: EquipmentItem;
}

export default function EquipmentSelector({
  onSelectTelescope,
  onSelectCamera,
  selectedTelescope,
  selectedCamera
}: EquipmentSelectorProps) {
  const [expandedTelescope, setExpandedTelescope] = useState<string | null>(null);
  const [expandedCamera, setExpandedCamera] = useState<string | null>(null);
  const { currency } = useCurrency();

  const toggleTelescope = (id: string) => {
    setExpandedTelescope(expandedTelescope === id ? null : id);
  };

  const toggleCamera = (id: string) => {
    setExpandedCamera(expandedCamera === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Telescopes Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Telescope</h3>
        <div className="space-y-2">
          {telescopes.map((telescope) => (
            <div 
              key={telescope.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedTelescope?.id === telescope.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-700 hover:border-primary/50'
              }`}
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => toggleTelescope(telescope.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden">
                    <img 
                      src={telescope.imageUrl} 
                      alt={telescope.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{telescope.name}</h4>
                    <p className="text-sm text-gray-400">{telescope.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-white">
                    {formatPrice(telescope.price, currency)}
                  </span>
                  {expandedTelescope === telescope.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedTelescope === telescope.id && (
                <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                  <ul className="space-y-1 mb-3">
                    {telescope.specs.map((spec, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onSelectTelescope(telescope)}
                    className={`w-full py-2 rounded-md transition-colors ${
                      selectedTelescope?.id === telescope.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedTelescope?.id === telescope.id ? 'Selected' : 'Select Telescope'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cameras Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Camera</h3>
        <div className="space-y-2">
          {cameras.map((camera) => (
            <div 
              key={camera.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedCamera?.id === camera.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-gray-700 hover:border-primary/50'
              }`}
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => toggleCamera(camera.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden">
                    <img 
                      src={camera.imageUrl} 
                      alt={camera.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{camera.name}</h4>
                    <p className="text-sm text-gray-400">{camera.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-white">
                    {formatPrice(camera.price, currency)}
                  </span>
                  {expandedCamera === camera.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedCamera === camera.id && (
                <div className="px-4 pb-4 border-t border-gray-700 pt-3">
                  <ul className="space-y-1 mb-3">
                    {camera.specs.map((spec, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-300">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5 mr-2" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onSelectCamera(camera)}
                    className={`w-full py-2 rounded-md transition-colors ${
                      selectedCamera?.id === camera.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {selectedCamera?.id === camera.id ? 'Selected' : 'Select Camera'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 