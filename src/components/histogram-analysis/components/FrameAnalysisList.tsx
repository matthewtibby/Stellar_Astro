import React from 'react';
import { FrameAnalysisItem } from './FrameAnalysisItem';
import { FrameAnalysisListProps } from '../types/histogram.types';

export const FrameAnalysisList: React.FC<FrameAnalysisListProps> = ({
  frameResults,
  selectedFrame,
  onFrameAction,
  frameActions
}) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">Individual Frame Analysis</h4>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {frameResults.map((frame, index) => (
          <FrameAnalysisItem
            key={frame.frame_path}
            frame={frame}
            selectedFrame={selectedFrame}
            onFrameAction={onFrameAction}
            frameActions={frameActions}
          />
        ))}
      </div>
    </div>
  );
}; 