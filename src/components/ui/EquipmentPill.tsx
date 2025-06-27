import React from 'react';
import { Equipment } from './types/projectCard.types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

interface EquipmentPillProps {
  item: Equipment;
  index: number;
  isLast: boolean;
  getEquipmentIcon: (type: Equipment['type']) => React.ReactNode;
}

const EquipmentPill: React.FC<EquipmentPillProps> = ({ item, index, isLast, getEquipmentIcon }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800/70 border border-gray-700 text-xs font-medium equipment-pill-animate">
          {getEquipmentIcon(item.type)}
          <span>{item.name}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}: {item.name}
      </TooltipContent>
    </Tooltip>
    {!isLast && <span className="mx-1 text-white/40">&bull;</span>}
  </TooltipProvider>
);

export default EquipmentPill; 