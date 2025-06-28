import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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

  // Accessibility: focus modal when opened
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="superdark-creation-modal-title"
      tabIndex={-1}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="superdark-creation-modal-title" className="text-xl font-semibold">Create Superdark</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close Create Superdark Modal"
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

  // Use React Portal to render modal at document.body
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }
  return null;
};
