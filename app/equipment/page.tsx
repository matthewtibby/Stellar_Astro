'use client';

import { useState } from 'react';
import { EquipmentItem } from '@/src/utils/equipment';
import EquipmentSelector from '@/src/components/EquipmentSelector';

export default function EquipmentPage() {
  const [selectedTelescope, setSelectedTelescope] = useState<EquipmentItem | undefined>();
  const [selectedCamera, setSelectedCamera] = useState<EquipmentItem | undefined>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Select Your Equipment
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Choose your telescope and camera from our curated selection
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Selected Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-2">Telescope</h3>
              {selectedTelescope ? (
                <div>
                  <p className="text-white font-medium">{selectedTelescope.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{selectedTelescope.description}</p>
                </div>
              ) : (
                <p className="text-gray-400">No telescope selected</p>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-2">Camera</h3>
              {selectedCamera ? (
                <div>
                  <p className="text-white font-medium">{selectedCamera.name}</p>
                  <p className="text-gray-400 text-sm mt-1">{selectedCamera.description}</p>
                </div>
              ) : (
                <p className="text-gray-400">No camera selected</p>
              )}
            </div>
          </div>
        </div>

        <EquipmentSelector
          onSelectTelescope={setSelectedTelescope}
          onSelectCamera={setSelectedCamera}
          selectedTelescope={selectedTelescope}
          selectedCamera={selectedCamera}
        />
      </div>
    </div>
  );
} 