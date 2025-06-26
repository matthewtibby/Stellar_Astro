import React from 'react';
import { ADVANCED_DARK_STACKING_METHODS } from '../constants/superdarkConstants';

interface SuperdarkSettingsProps {
  superdarkName: string;
  setSuperdarkName: (name: string) => void;
  superdarkStacking: string;
  setSuperdarkStacking: (method: string) => void;
  superdarkSigma: string;
  setSuperdarkSigma: (sigma: string) => void;
}

export const SuperdarkSettings: React.FC<SuperdarkSettingsProps> = ({
  superdarkName,
  setSuperdarkName,
  superdarkStacking,
  setSuperdarkStacking,
  superdarkSigma,
  setSuperdarkSigma
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block font-medium mb-1 text-blue-100">Superdark Name</label>
        <input
          type="text"
          value={superdarkName}
          onChange={e => setSuperdarkName(e.target.value)}
          placeholder="Enter superdark name"
          className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100 placeholder-blue-400"
        />
      </div>
      <div>
        <label className="block font-medium mb-1 text-blue-100">Stacking Method</label>
        <select
          value={superdarkStacking}
          onChange={e => setSuperdarkStacking(e.target.value)}
          className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100"
        >
          {ADVANCED_DARK_STACKING_METHODS.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1 text-blue-100">Sigma Threshold</label>
        <input
          type="number"
          value={superdarkSigma}
          onChange={e => setSuperdarkSigma(e.target.value)}
          step="0.1"
          min="1.0"
          max="5.0"
          className="w-full p-2 rounded bg-[#181c23] border border-[#232946]/60 text-blue-100"
        />
      </div>
    </div>
  );
}; 