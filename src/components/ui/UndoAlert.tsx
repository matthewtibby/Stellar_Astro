import React from 'react';

interface UndoAlertProps {
  open: boolean;
  onUndo: () => void;
  projectName?: string;
}

const UndoAlert: React.FC<UndoAlertProps> = ({ open, onUndo, projectName }) => {
  if (!open) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 border border-gray-700">
      <span>Project deleted{projectName ? `: ${projectName}` : ''}.</span>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold"
        onClick={onUndo}
      >
        Undo
      </button>
    </div>
  );
};

export default UndoAlert; 