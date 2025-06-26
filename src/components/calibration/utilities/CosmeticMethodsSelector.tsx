import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { COSMETIC_METHODS } from '../types/calibration.types';

interface CosmeticMethodsSelectorProps {
  selectedMethods: Record<string, { enabled: boolean; order: number }>;
  onMethodToggle: (methodValue: string, enabled: boolean) => void;
  onOrderChange: (methodValue: string, newOrder: number) => void;
}

export function CosmeticMethodsSelector({
  selectedMethods,
  onMethodToggle,
  onOrderChange,
}: CosmeticMethodsSelectorProps) {
  // Sort methods by their order for display
  const sortedMethods = COSMETIC_METHODS.sort((a, b) => {
    const aOrder = selectedMethods[a.value]?.order || a.order;
    const bOrder = selectedMethods[b.value]?.order || b.order;
    return aOrder - bOrder;
  });

  const enabledMethods = sortedMethods.filter(method => selectedMethods[method.value]?.enabled);
  const disabledMethods = sortedMethods.filter(method => !selectedMethods[method.value]?.enabled);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-blue-200">Cosmetic Correction Methods</h5>
        <span className="text-xs text-blue-300">
          {enabledMethods.length} method{enabledMethods.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Enabled Methods (with ordering) */}
      {enabledMethods.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-blue-300 mb-2">
            ✅ Enabled (processed in order):
          </div>
          {enabledMethods.map((method, index) => (
            <TooltipProvider key={method.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between bg-blue-900/30 rounded p-3 border border-blue-600/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-blue-700 text-blue-100 px-2 py-1 rounded font-mono">
                        {index + 1}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMethods[method.value]?.enabled || false}
                          onChange={(e) => onMethodToggle(method.value, e.target.checked)}
                          className="accent-blue-600"
                        />
                        <span className="text-blue-100 font-medium">{method.label}</span>
                      </label>
                    </div>
                    
                    {/* Order controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => index > 0 && onOrderChange(method.value, selectedMethods[method.value].order - 1)}
                        disabled={index === 0}
                        className="p-1 text-blue-300 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => index < enabledMethods.length - 1 && onOrderChange(method.value, selectedMethods[method.value].order + 1)}
                        disabled={index === enabledMethods.length - 1}
                        className="p-1 text-blue-300 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{method.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Disabled Methods */}
      {disabledMethods.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">
            ⭕ Available methods:
          </div>
          {disabledMethods.map((method) => (
            <TooltipProvider key={method.value}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between bg-gray-900/30 rounded p-3 border border-gray-600/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMethods[method.value]?.enabled || false}
                        onChange={(e) => onMethodToggle(method.value, e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span className="text-gray-300">{method.label}</span>
                    </label>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{method.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-blue-300 bg-blue-900/20 rounded p-2">
        💡 <strong>Pro tip:</strong> Multiple methods work together - Hot Pixel Map removes sensor defects, 
        L.A.Cosmic Enhanced removes cosmic rays, and additional methods handle specific noise patterns.
      </div>
    </div>
  );
} 