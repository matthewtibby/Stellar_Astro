import React from 'react';
import { CheckCircle, Moon, Sun, Zap } from 'lucide-react';
import { EmptyFilesSVG } from '../../ui/missing-components';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { 
  FRAME_TYPES, 
  STATUS_LABELS,
  ADVANCED_BIAS_STACKING_METHODS,
  ADVANCED_DARK_STACKING_METHODS,
  ADVANCED_FLAT_STACKING_METHODS,
  BEGINNER_DARK_STACKING_METHODS,
  BEGINNER_FLAT_STACKING_METHODS,
  STACKING_METHOD_TOOLTIPS,
  COSMETIC_METHODS,
} from '../types/calibration.types';
import type { MasterType, MasterStatus } from '../types/calibration.types';

// Frame type icons
const FRAME_TYPE_ICONS: Record<MasterType, React.ReactElement> = {
  dark: <Moon className="w-6 h-6 text-blue-400 drop-shadow" />,
  flat: <Sun className="w-6 h-6 text-yellow-400 drop-shadow" />,
  bias: <Zap className="w-6 h-6 text-pink-400 drop-shadow" />,
};

// Define mutually exclusive method groups
const MUTUALLY_EXCLUSIVE_METHODS = [
  ['la_cosmic', 'la_cosmic_enhanced'],
  // Add more groups as needed
];

// Helper to check if a method is disabled due to mutual exclusion
function isMethodDisabled(methodValue: string, tabState: any, selectedType: string) {
  for (const group of MUTUALLY_EXCLUSIVE_METHODS) {
    if (group.includes(methodValue)) {
      // If any other method in the group is enabled, disable this one
      return group.some(other => other !== methodValue && tabState[selectedType].cosmeticMethods?.[other]?.enabled);
    }
  }
  return false;
}

// Helper to handle mutually exclusive toggling
function handleMutuallyExclusiveToggle(methodValue: string, checked: boolean, tabState: any, selectedType: string, setTabState: any) {
  let newCosmeticMethods = { ...tabState[selectedType].cosmeticMethods };
  for (const group of MUTUALLY_EXCLUSIVE_METHODS) {
    if (group.includes(methodValue) && checked) {
      // Uncheck all other methods in the group
      for (const other of group) {
        if (other !== methodValue) {
          newCosmeticMethods[other] = { ...newCosmeticMethods[other], enabled: false };
        }
      }
    }
  }
  newCosmeticMethods[methodValue] = {
    ...newCosmeticMethods[methodValue],
    enabled: checked,
    order: COSMETIC_METHODS.find(m => m.value === methodValue)?.order || 0,
  };
  setTabState((prev: any) => ({
    ...prev,
    [selectedType]: {
      ...prev[selectedType],
      cosmeticMethods: newCosmeticMethods,
    },
  }));
}

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
  // Helper to get stacking methods and advanced state for each type
  const getStackingMethods = () => {
    if (selectedType === 'bias') {
      return tabState.bias.advanced ? ADVANCED_BIAS_STACKING_METHODS : [
        { value: 'median', label: 'Median' },
        { value: 'mean', label: 'Mean' },
      ];
    } else if (selectedType === 'dark') {
      return tabState.dark.advanced ? ADVANCED_DARK_STACKING_METHODS : BEGINNER_DARK_STACKING_METHODS;
    } else if (selectedType === 'flat') {
      return tabState.flat.advanced ? ADVANCED_FLAT_STACKING_METHODS : BEGINNER_FLAT_STACKING_METHODS;
    }
    return [];
  };

  // Only show cosmetic methods relevant for the current frame type
  const relevantCosmeticMethods = COSMETIC_METHODS.filter(method => method.frameTypes.includes(selectedType));

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
        {/* Beginner/Advanced toggle for bias, dark, and flat */}
        {(selectedType === 'bias' || selectedType === 'dark' || selectedType === 'flat') && (
          <div className="flex items-center gap-4 mb-4">
            <span className="text-blue-100 font-medium">Mode:</span>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-200 ${tabState[selectedType].advanced ? 'bg-gray-800 text-blue-300 border-blue-500' : 'bg-blue-600 text-white border-blue-600'}`}
              onClick={() => setTabState((prev: any) => ({
                ...prev,
                [selectedType]: {
                  ...prev[selectedType],
                  advanced: false,
                },
              }))}
            >
              Beginner
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-200 ${tabState[selectedType].advanced ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-blue-300 border-blue-500'}`}
              onClick={() => setTabState((prev: any) => ({
                ...prev,
                [selectedType]: {
                  ...prev[selectedType],
                  advanced: true,
                },
              }))}
            >
              Advanced
            </button>
          </div>
        )}
        {/* Stacking method selection for all types */}
        {(selectedType === 'bias' || selectedType === 'dark' || selectedType === 'flat') && (
          <div className="mb-4">
            <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
            <div className="flex flex-col gap-2">
              {getStackingMethods().map((m: any) => (
                <Tooltip key={m.value}>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-2 text-blue-200 cursor-pointer">
                      <input
                        type="radio"
                        name={`${selectedType}StackingMethod`}
                        value={m.value}
                        checked={tabState[selectedType].stackingMethod === m.value}
                        onChange={() => setTabState((prev: any) => ({
                          ...prev,
                          [selectedType]: {
                            ...prev[selectedType],
                            stackingMethod: m.value,
                          },
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
        
        {/* Cosmetic Correction (Advanced Only) */}
        {(selectedType === 'bias' || selectedType === 'dark' || selectedType === 'flat') && tabState[selectedType].advanced && (
          <div className="mt-6">
            <h4 className="text-blue-200 font-semibold mb-2">Cosmetic Correction</h4>
            <div className="flex flex-col gap-3">
              {relevantCosmeticMethods.map((method) => {
                const isChecked = tabState[selectedType].cosmeticMethods?.[method.value]?.enabled || false;
                return (
                  <div key={method.value} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => handleMutuallyExclusiveToggle(method.value, e.target.checked, tabState, selectedType, setTabState)}
                      className="accent-blue-600"
                      id={`${selectedType}-cosmetic-${method.value}`}
                    />
                    <label htmlFor={`${selectedType}-cosmetic-${method.value}`} className="text-blue-100 cursor-pointer">
                      {method.label}
                    </label>
                    <span className="text-xs text-blue-300" title={method.tooltip}>ⓘ</span>
                  </div>
                );
              })}
            </div>
            {/* Parameter controls for enabled methods */}
            {relevantCosmeticMethods.map((method) => (
              tabState[selectedType].cosmeticMethods?.[method.value]?.enabled && (
                <div key={method.value + '-params'} className="ml-6 mt-2 flex flex-col gap-2">
                  {/* Example: threshold for hot_pixel_map and bad_pixel_masking */}
                  {(method.value === 'hot_pixel_map' || method.value === 'bad_pixel_masking') && (
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Sigma Threshold</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={0.1}
                        value={tabState[selectedType].badPixelSigmaThreshold || 5.0}
                        onChange={e => setTabState((prev: any) => ({
                          ...prev,
                          [selectedType]: {
                            ...prev[selectedType],
                            badPixelSigmaThreshold: parseFloat(e.target.value),
                          },
                        }))}
                        className="bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 w-24"
                      />
                    </div>
                  )}
                  {/* Patterned noise method/strength */}
                  {method.value === 'patterned_noise_removal' && (
                    <>
                      <div>
                        <label className="block text-xs text-blue-200 mb-1">Patterned Noise Method</label>
                        <select
                          className="bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1"
                          value={tabState[selectedType].patternedNoiseMethod || 'auto'}
                          onChange={e => setTabState((prev: any) => ({
                            ...prev,
                            [selectedType]: {
                              ...prev[selectedType],
                              patternedNoiseMethod: e.target.value,
                            },
                          }))}
                        >
                          <option value="auto">Auto</option>
                          <option value="median_filter">Median Filter</option>
                          <option value="fourier_filter">Fourier Filter</option>
                          <option value="polynomial">Polynomial</option>
                          <option value="combined">Combined</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-blue-200 mb-1">Strength</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={tabState[selectedType].patternedNoiseStrength || 0.5}
                          onChange={e => setTabState((prev: any) => ({
                            ...prev,
                            [selectedType]: {
                              ...prev[selectedType],
                              patternedNoiseStrength: parseFloat(e.target.value),
                            },
                          }))}
                          className="bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 w-24"
                        />
                      </div>
                    </>
                  )}
                  {/* L.A.Cosmic params (example: sigclip) */}
                  {(method.value === 'la_cosmic' || method.value === 'la_cosmic_enhanced') && (
                    <div>
                      <label className="block text-xs text-blue-200 mb-1">Sigma Clip</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={0.1}
                        value={tabState[selectedType].laCosmicParams?.sigclip || 4.5}
                        onChange={e => setTabState((prev: any) => ({
                          ...prev,
                          [selectedType]: {
                            ...prev[selectedType],
                            laCosmicParams: {
                              ...prev[selectedType].laCosmicParams,
                              sigclip: parseFloat(e.target.value),
                            },
                          },
                        }))}
                        className="bg-[#181c23] text-white border border-[#232946] rounded px-2 py-1 w-24"
                      />
                    </div>
                  )}
                  {/* Add more parameter controls as needed for other methods */}
                </div>
              )
            ))}
          </div>
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