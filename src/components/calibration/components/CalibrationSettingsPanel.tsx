import React from 'react';
import { CheckCircle, Moon, Sun, Zap } from 'lucide-react';
import { EmptyFilesSVG } from '../../ui/missing-components';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { 
  FRAME_TYPES, 
  STATUS_LABELS,
  BASIC_STACKING_METHODS,
  ADVANCED_BIAS_STACKING_METHODS,
  STACKING_METHOD_TOOLTIPS
} from '../types/calibration.types';
import type { MasterType, MasterStatus } from '../types/calibration.types';

// Frame type icons
const FRAME_TYPE_ICONS: Record<MasterType, React.ReactElement> = {
  dark: <Moon className="w-6 h-6 text-blue-400 drop-shadow" />,
  flat: <Sun className="w-6 h-6 text-yellow-400 drop-shadow" />,
  bias: <Zap className="w-6 h-6 text-pink-400 drop-shadow" />,
};

// Beginner bias methods (subset of basic methods)
const BEGINNER_BIAS_STACKING_METHODS = BASIC_STACKING_METHODS;

interface CalibrationSettingsPanelProps {
  selectedType: MasterType;
  realFiles: string[];
  onShowFileModal: () => void;
  getMasterStatus: (type: MasterType) => MasterStatus;
  tabState: any;
  setTabState: (updater: (prev: any) => any) => void;
}

export const CalibrationSettingsPanel: React.FC<CalibrationSettingsPanelProps> = ({
  selectedType,
  realFiles,
  onShowFileModal,
  getMasterStatus,
  tabState,
  setTabState,
}) => {
  return (
    <div className="w-2/5 bg-[#10131a]/90 rounded-2xl p-6 border border-[#232946]/60 flex flex-col shadow-xl relative">
      {/* Header row: title left, status chip right */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {FRAME_TYPE_ICONS[selectedType]}
          <h3 className="text-lg font-bold text-white tracking-tight drop-shadow">
            {FRAME_TYPES.find(f => f.key === selectedType)?.label} Calibration
          </h3>
          <span className="ml-2 px-2 py-1 rounded-full bg-green-900 text-green-300 text-xs font-semibold flex items-center gap-1 shadow">
            <CheckCircle className="w-3 h-3" /> {STATUS_LABELS[getMasterStatus(selectedType)]}
          </span>
        </div>
      </div>
      
      {/* Files for selected type */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <span className="font-medium text-blue-200 mr-2">{realFiles.length} files</span>
          <button
            className="ml-auto text-xs text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={onShowFileModal}
            aria-label={`View all ${FRAME_TYPES.find(f => f.key === selectedType)?.label} files`}
          >
            View All
          </button>
        </div>
        
        {realFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <EmptyFilesSVG />
            <div className="text-blue-200 mt-4 mb-2 font-semibold text-lg">
              No {FRAME_TYPES.find(f => f.key === selectedType)?.label} files yet!
            </div>
            <button
              className="mt-2 px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => alert('Trigger upload flow (to be implemented)')}
              aria-label="Upload files"
            >
              Upload Files
            </button>
          </div>
        ) : (
          <div className="flex flex-row gap-2 flex-wrap mb-1">
            {realFiles.slice(0, 3).map((file, idx) => (
              <Tooltip key={file}>
                <TooltipTrigger asChild>
                  <div
                    tabIndex={0}
                    className="w-12 h-12 bg-[#181c23] rounded-full flex items-center justify-center text-xs text-gray-400 border border-[#232946]/60 shadow hover:scale-110 focus:scale-110 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label={`File: ${file}`}
                  >
                    <span>{idx + 1}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="animate-fade-in">
                  {file}
                </TooltipContent>
              </Tooltip>
            ))}
            {realFiles.length > 3 && (
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-xs text-blue-200 border border-[#232946]/60 shadow">
                +{realFiles.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Divider */}
      <div className="h-px bg-[#232946]/40 mb-8" />
      
      {/* Calibration Settings */}
      <div className="flex flex-col gap-6">
        {/* Master Bias Tab */}
        {selectedType === 'bias' && (
          <>
            {/* Beginner/Advanced toggle for Bias */}
            <div className="flex items-center mb-4 gap-4">
              <span className="font-medium text-blue-200">Beginner</span>
              <label className="inline-flex relative items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={tabState.bias.advanced} 
                  onChange={e => setTabState((prev: any) => ({ 
                    ...prev, 
                    bias: { ...prev.bias, advanced: e.target.checked } 
                  }))} 
                />
                <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all flex items-center justify-start peer-checked:justify-end">
                  {!tabState.bias.advanced && <span className="w-3 h-3 bg-white rounded-full ml-1" />}
                  {tabState.bias.advanced && <span className="w-3 h-3 bg-blue-300 rounded-full mr-1" />}
                </div>
              </label>
              <span className="font-medium text-blue-200">Advanced</span>
            </div>
            
            {/* Beginner mode: only show stacking method (Median, Mean) */}
            {selectedType === 'bias' && !tabState.bias.advanced && (
              <div className="mb-4">
                <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                <div className="flex flex-col gap-2">
                  {BEGINNER_BIAS_STACKING_METHODS.map((m: any) => (
                    <Tooltip key={m.value}>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
                          <input
                            type="radio"
                            name="biasStackingMethod"
                            value={m.value}
                            checked={tabState.bias.stackingMethod === m.value}
                            onChange={() => setTabState((prev: any) => ({
                              ...prev,
                              bias: {
                                ...prev.bias,
                                stackingMethod: m.value,
                              }
                            }))}
                            className="accent-blue-600"
                          />
                          <span>{m.label}</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                        {STACKING_METHOD_TOOLTIPS[m.value]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            
            {/* Advanced mode: all stacking methods, cosmetic correction, custom rejection */}
            {tabState.bias.advanced && (
              <>
                <div className="mb-4">
                  <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
                  <div className="flex flex-col gap-2">
                    {ADVANCED_BIAS_STACKING_METHODS.map((m: any) => (
                      <Tooltip key={m.value}>
                        <TooltipTrigger asChild>
                          <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
                            <input
                              type="radio"
                              name="biasStackingMethod"
                              value={m.value}
                              checked={tabState.bias.stackingMethod === m.value}
                              onChange={() => setTabState((prev: any) => ({
                                ...prev,
                                bias: {
                                  ...prev.bias,
                                  stackingMethod: m.value,
                                }
                              }))}
                              className="accent-blue-600"
                            />
                            <span>{m.label}</span>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={4} className="max-w-xs text-sm">
                          {STACKING_METHOD_TOOLTIPS[m.value]}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                {/* Additional advanced settings can be added here */}
              </>
            )}
          </>
        )}
        
        {/* Add similar sections for 'dark' and 'flat' types */}
        {selectedType === 'dark' && (
          <div className="text-blue-200">
            Dark frame settings would go here...
          </div>
        )}
        
        {selectedType === 'flat' && (
          <div className="text-blue-200">
            Flat frame settings would go here...
          </div>
        )}
      </div>
    </div>
  );
}; 