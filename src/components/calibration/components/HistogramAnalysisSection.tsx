import React from 'react';
import { BarChart3 } from 'lucide-react';
import { MasterType } from '../types/calibration.types';

interface HistogramAnalysisSectionProps {
  frameType: MasterType;
  realFiles: string[];
  userId: string;
  projectId: string;
  histogramAnalysisResults: any;
  histogramAnalysisLoading: boolean;
  histogramAnalysisNotification: string | null;
  onHistogramAnalysis: (paths: string[]) => void;
  onShowHistogramReport: (show: boolean) => void;
}

export function HistogramAnalysisSection({
  frameType,
  realFiles,
  userId,
  projectId,
  histogramAnalysisResults,
  histogramAnalysisLoading,
  histogramAnalysisNotification,
  onHistogramAnalysis,
  onShowHistogramReport,
}: HistogramAnalysisSectionProps) {
  const fitsFiles = realFiles.filter((f: string) => f.endsWith('.fits') || f.endsWith('.fit'));
  
  return (
    <div className="mb-4 border-t border-purple-900 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-purple-400" />
        <h4 className="font-semibold text-purple-200">Histogram/Distribution Analysis</h4>
      </div>
      <p className="text-xs text-purple-300 mb-3">
        Analyze pixel value distributions for quality assessment, clipping detection, and pedestal requirements
      </p>
      
      {/* Notification */}
      {histogramAnalysisNotification && (
        <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            {histogramAnalysisLoading && (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            <span className="text-sm text-blue-200">{histogramAnalysisNotification}</span>
          </div>
        </div>
      )}
      
      <button
        className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
        onClick={() => {
          console.log('🔍 Button clicked - fitsFiles:', fitsFiles);
          const paths = fitsFiles.map((f: string) => `${userId}/${projectId}/${frameType}/${f}`);
          console.log('🔍 Generated paths:', paths);
          onHistogramAnalysis(paths);
        }}
        disabled={fitsFiles.length === 0 || histogramAnalysisLoading}
      >
        <BarChart3 className="w-4 h-4 inline mr-1" />
        {histogramAnalysisLoading ? 'Analyzing...' : `Analyze Histograms (${fitsFiles.length} files)`}
      </button>
      
      {histogramAnalysisResults && (
        <div className="mt-4">
          <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium text-purple-200">
                {histogramAnalysisResults.summary?.message || 'Analysis Complete'}
              </div>
            </div>
            
            {histogramAnalysisResults.summary?.frame_breakdown && (
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="text-green-300">
                  High Quality: {histogramAnalysisResults.summary.frame_breakdown.high_quality}
                </div>
                <div className="text-red-300">
                  Poor Quality: {histogramAnalysisResults.summary.frame_breakdown.poor_quality}
                </div>
                <div className="text-yellow-300">
                  Need Pedestal: {histogramAnalysisResults.summary.frame_breakdown.requiring_pedestal}
                </div>
                <div className="text-orange-300">
                  With Clipping: {histogramAnalysisResults.summary.frame_breakdown.with_clipping}
                </div>
              </div>
            )}
            
            {histogramAnalysisResults.summary?.recommendations && (
              <div className="mt-2">
                <div className="text-xs font-medium text-purple-300 mb-1">Key Recommendations:</div>
                <ul className="text-xs text-purple-200 space-y-1">
                  {histogramAnalysisResults.summary.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
              onClick={() => onShowHistogramReport(true)}
            >
              View Detailed Report →
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 