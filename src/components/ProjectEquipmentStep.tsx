'use client';

import { useState } from 'react';
import { EquipmentItem } from '@/src/utils/equipment';
import EquipmentSelector from './EquipmentSelector';

interface ProjectEquipmentStepProps {
  onNext: (telescope: EquipmentItem, camera: EquipmentItem) => void;
  initialTelescope?: EquipmentItem;
  initialCamera?: EquipmentItem;
}

export default function ProjectEquipmentStep({
  onNext,
  initialTelescope,
  initialCamera
}: ProjectEquipmentStepProps) {
  const [selectedTelescope, setSelectedTelescope] = useState<EquipmentItem | undefined>(initialTelescope);
  const [selectedCamera, setSelectedCamera] = useState<EquipmentItem | undefined>(initialCamera);

  const handleNext = () => {
    if (selectedTelescope && selectedCamera) {
      onNext(selectedTelescope, selectedCamera);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Equipment</h2>
        <p className="text-gray-400">
          Choose the telescope and camera you&apos;ll be using for this project.
        </p>
      </div>

      <EquipmentSelector
        onSelectTelescope={setSelectedTelescope}
        onSelectCamera={setSelectedCamera}
        selectedTelescope={selectedTelescope}
        selectedCamera={selectedCamera}
      />

      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!selectedTelescope || !selectedCamera}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            selectedTelescope && selectedCamera
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
} 