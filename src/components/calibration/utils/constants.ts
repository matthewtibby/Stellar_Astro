import { MasterType } from '../types/calibration.types';
import { Moon, Sun, Zap } from 'lucide-react';
import React from 'react';

// Stacking methods
export const STACKING_METHODS = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'sigma', label: 'Sigma Clipping' },
];

export const OUTLIER_METHODS = [
  { value: 'sigma', label: 'Sigma Clipping' },
  { value: 'iqr', label: 'IQR Method' },
];

export const DEFAULT_SETTINGS = {
  method: 'median',
  sigma: 3.0,
};

// Frame type icons (fix linter: use React.ReactElement)
export const FRAME_TYPE_ICONS: Record<MasterType, React.ReactElement> = {
  dark: React.createElement(Moon, { className: "w-6 h-6 text-blue-400 drop-shadow" }),
  flat: React.createElement(Sun, { className: "w-6 h-6 text-yellow-400 drop-shadow" }),
  bias: React.createElement(Zap, { className: "w-6 h-6 text-pink-400 drop-shadow" }),
};

// Dynamic histogram info text
export const HISTOGRAM_INFO: Record<MasterType, string> = {
  dark: 'Check for hot pixels, amp glow, and clipped blacks. A good dark frame histogram should be smooth, with no sharp spikes at the edges.',
  flat: 'Check for even illumination and no clipping. A good flat frame histogram should be centered, with no spikes at the edges.',
  bias: 'Check for a narrow, centered peak. Bias frames should have low noise and no clipping.'
};
