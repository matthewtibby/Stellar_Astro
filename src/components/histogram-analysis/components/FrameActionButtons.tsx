import React from 'react';
import { FrameActionButtonsProps } from '../types/histogram.types';
import { getQualityIcon } from '../utils/histogramUtils';

export const FrameActionButtons: React.FC<FrameActionButtonsProps> = ({
  frame,
  onFrameAction,
  frameActions
}) => {
  return (
    <div className="flex gap-1">
      {frame.requires_pedestal && (
        <button
          onClick={frameActions.handleFrameAction(frame.frame_path, 'apply_pedestal', onFrameAction)}
          className="p-1 bg-yellow-600/20 hover:bg-yellow-600/30 rounded text-yellow-400 transition-colors text-xs px-2"
          title={`Apply pedestal: ${frame.recommended_pedestal.toFixed(0)} DN`}
        >
          ⚡ Pedestal
        </button>
      )}
      <button
        onClick={frameActions.handleFrameAction(frame.frame_path, 'accept', onFrameAction)}
        className="p-1 bg-green-600/20 hover:bg-green-600/30 rounded text-green-400 transition-colors"
        title="Force Accept"
      >
        {getQualityIcon(10)}
      </button>
      <button
        onClick={frameActions.handleFrameAction(frame.frame_path, 'reject', onFrameAction)}
        className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400 transition-colors"
        title="Force Reject"
      >
        {getQualityIcon(0)}
      </button>
    </div>
  );
}; 