import React from 'react';
import { Moon, Sun, Zap } from 'lucide-react';
import { FRAME_TYPES, STATUS_COLORS, STATUS_LABELS } from '../types/calibration.types';
import type { MasterType, MasterStatus } from '../types/calibration.types';

// Frame type icons
const FRAME_TYPE_ICONS: Record<MasterType, React.ReactElement> = {
  dark: <Moon className="w-6 h-6 text-blue-400 drop-shadow" />,
  flat: <Sun className="w-6 h-6 text-yellow-400 drop-shadow" />,
  bias: <Zap className="w-6 h-6 text-pink-400 drop-shadow" />,
};

interface MasterTabNavigationProps {
  selectedType: MasterType;
  onTypeChange: (type: MasterType) => void;
  getMasterStatus: (type: MasterType) => MasterStatus;
}

export const MasterTabNavigation: React.FC<MasterTabNavigationProps> = ({
  selectedType,
  onTypeChange,
  getMasterStatus,
}) => {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {FRAME_TYPES.map(ft => (
        <button
          key={ft.key}
          onClick={() => onTypeChange(ft.key as MasterType)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold text-base transition-all border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d13] shadow-sm ${
            selectedType === ft.key 
              ? 'bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white shadow-lg' 
              : 'bg-[#10131a] text-blue-200 hover:bg-[#181c23]'
          }`}
          style={{ 
            position: 'relative', 
            minWidth: '120px', 
            transition: 'background 0.3s, color 0.3s, box-shadow 0.3s' 
          }}
        >
          <span 
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
              STATUS_COLORS[getMasterStatus(ft.key as MasterType)]
            }`}
          />
          <span className="ml-4 flex items-center gap-1">
            {FRAME_TYPE_ICONS[ft.key as MasterType]}
            <span className="drop-shadow font-bold text-base tracking-tight">
              {ft.label}
            </span>
          </span>
          <span 
            className={`ml-1 text-xs ${
              selectedType === ft.key ? 'text-white' : 'text-blue-300'
            }`}
          >
            {STATUS_LABELS[getMasterStatus(ft.key as MasterType)]}
          </span>
        </button>
      ))}
    </div>
  );
}; 