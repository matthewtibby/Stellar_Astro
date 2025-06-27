import React from 'react';
import { HistogramAnalysisSummary } from '../types/histogram.types';

interface RecommendationsPanelProps {
  summary: HistogramAnalysisSummary;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ summary }) => {
  if (summary.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-blue-900/30 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-blue-300 mb-2">📋 Key Recommendations</h4>
      <ul className="text-sm text-blue-100 space-y-1">
        {summary.recommendations.slice(0, 3).map((rec, idx) => (
          <li key={idx}>{rec}</li>
        ))}
        {summary.recommendations.length > 3 && (
          <li className="text-blue-300">...and {summary.recommendations.length - 3} more</li>
        )}
      </ul>
    </div>
  );
}; 