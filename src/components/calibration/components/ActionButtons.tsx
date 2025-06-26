import React from 'react';

interface ActionButtonsProps {
  onBack: () => void;
  onNext: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onBack, onNext }) => {
  return (
    <div className="flex justify-end gap-4 mt-8">
      <button 
        className="px-6 py-2 bg-[#232946] text-white rounded shadow hover:bg-[#181c23]" 
        onClick={onBack}
      >
        Back
      </button>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700"
        onClick={onNext}
      >
        Next: Light Frame Calibration & Stacking
      </button>
    </div>
  );
}; 