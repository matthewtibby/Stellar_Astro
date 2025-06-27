import React from 'react';
import { QualityIndicatorsProps } from '../types/histogram.types';

export const QualityIndicators: React.FC<QualityIndicatorsProps> = ({ frame }) => {
  const indicators = [];

  if (frame.clipping_detected) {
    indicators.push({
      key: 'clipping',
      label: '📉 Clipping',
      className: 'px-2 py-1 bg-red-900/30 text-red-300 rounded text-xs'
    });
  }

  if (frame.requires_pedestal) {
    indicators.push({
      key: 'pedestal',
      label: '⚡ Needs Pedestal',
      className: 'px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs'
    });
  }

  if (frame.outlier_percent > 1.0) {
    indicators.push({
      key: 'outliers',
      label: '🔥 High Outliers',
      className: 'px-2 py-1 bg-orange-900/30 text-orange-300 rounded text-xs'
    });
  }

  if (frame.saturation_percent > 0.1) {
    indicators.push({
      key: 'saturation',
      label: '📊 Saturation',
      className: 'px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs'
    });
  }

  if (indicators.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {indicators.map(indicator => (
        <span key={indicator.key} className={indicator.className}>
          {indicator.label}
        </span>
      ))}
    </div>
  );
}; 