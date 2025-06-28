import React from 'react';

interface ChecklistCategoryPanelProps {
  category: string;
  expanded: boolean;
  progress: number;
  onToggle: () => void;
  children: React.ReactNode;
}

const ChecklistCategoryPanel: React.FC<ChecklistCategoryPanelProps> = ({ category, expanded, progress, onToggle, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <div className="flex items-center space-x-2">
        <span className="text-white capitalize">{category}</span>
        <span className="text-sm text-gray-400">({progress.toFixed(0)}% complete)</span>
      </div>
      <span>{expanded ? '▼' : '▶'}</span>
    </div>
    {expanded && <div className="pl-4 space-y-2">{children}</div>}
  </div>
);

export default ChecklistCategoryPanel; 