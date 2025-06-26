import React from 'react';
import { CreateSuperdarkUI } from '../../ui/missing-components';

interface SuperdarkCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
}

export const SuperdarkCreationModal: React.FC<SuperdarkCreationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  userId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Create Superdark</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <CreateSuperdarkUI
            projectId={projectId}
            userId={userId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
