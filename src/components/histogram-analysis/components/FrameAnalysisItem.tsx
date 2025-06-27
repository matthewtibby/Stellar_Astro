import React from 'react';
import { FrameActionButtons } from './FrameActionButtons';
import { QualityIndicators } from './QualityIndicators';
import { FrameDetailsPanel } from './FrameDetailsPanel';
import { FrameAnalysisItemProps } from '../types/histogram.types';
import { 
  getQualityIcon, 
  getQualityColor, 
  getDistributionIcon, 
  getStatusText, 
  getQualityBadgeStyle 
} from '../utils/histogramUtils';

export const FrameAnalysisItem: React.FC<FrameAnalysisItemProps> = ({
  frame,
  selectedFrame,
  onFrameAction,
  frameActions
}) => {
  const isSelected = selectedFrame === frame.frame_path;

  return (
    <div
      className={`bg-gray-900/50 rounded-lg p-3 border ${
        isSelected ? 'border-blue-500' : 'border-gray-700'
      } hover:border-gray-600 transition-colors cursor-pointer`}
      onClick={frameActions.getFrameClickHandler(frame.frame_path, selectedFrame, frameActions.setSelectedFrame)}
    >
      {/* Frame Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {getQualityIcon(frame.histogram_score)}
          <div>
            <p className="font-medium text-white">
              {frame.frame_path.split('/').pop()}
            </p>
            <p className="text-xs text-gray-300">
              Score: <span className={getQualityColor(frame.histogram_score)}>
                {frame.histogram_score.toFixed(1)}/10
              </span>
              {' • '}
              Type: <span className="text-blue-300">{frame.frame_type}</span>
              {' • '}
              Distribution: <span className="text-purple-300">
                {getDistributionIcon(frame.distribution_type)} {frame.distribution_type}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityBadgeStyle(frame.histogram_score)}`}>
            {getStatusText(frame.histogram_score, frame.distribution_type)}
          </span>
          
          {onFrameAction && (
            <FrameActionButtons
              frame={frame}
              onFrameAction={onFrameAction}
              frameActions={frameActions}
            />
          )}
        </div>
      </div>

      {/* Quality Indicators */}
      <QualityIndicators frame={frame} />

      {/* Expanded Details */}
      {isSelected && (
        <FrameDetailsPanel frame={frame} />
      )}
    </div>
  );
}; 