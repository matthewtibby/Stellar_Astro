export interface HistogramFrameResult {
  frame_path: string;
  frame_type: string;
  histogram_score: number;
  distribution_type: string;
  clipping_detected: boolean;
  saturation_percent: number;
  zero_pixel_percent: number;
  outlier_percent: number;
  requires_pedestal: boolean;
  recommended_pedestal: number;
  pedestal_reason: string;
  issues_detected: string[];
  recommendations: string[];
  quality_flags: Record<string, boolean>;
  // Statistical data
  mean: number;
  median: number;
  std: number;
  skewness: number;
  kurtosis: number;
}

export interface HistogramAnalysisSummary {
  message: string;
  quality_status: string;
  score: number;
  frame_breakdown: {
    total: number;
    high_quality: number;
    poor_quality: number;
    requiring_pedestal: number;
    with_clipping: number;
  };
  recommendations: string[];
  overall_recommendation: string;
}

export interface HistogramAnalysisReportProps {
  summary: HistogramAnalysisSummary;
  frameResults: HistogramFrameResult[];
  onFrameAction?: (framePath: string, action: 'accept' | 'reject' | 'apply_pedestal') => void;
  className?: string;
}

export type FrameAction = 'accept' | 'reject' | 'apply_pedestal';
export type FrameActionHandler = (framePath: string, action: FrameAction) => void;

// Type aliases for better compatibility
export type AnalysisSummary = HistogramAnalysisSummary;
export type FrameAnalysisResult = HistogramFrameResult;

// Utility types for statistical calculations
export interface StatisticalRange {
  min: number;
  max: number;
  median: number;
}

// Props for Phase 3 components
export interface HistogramSummaryHeaderProps {
  summary: AnalysisSummary;
  expanded: boolean;
  showStatistics: boolean;
  onToggleExpanded: () => void;
  onToggleStatistics: () => void;
}

export interface RecommendationsPanelProps {
  summary: AnalysisSummary;
}

export interface StatisticalOverviewProps {
  summary: AnalysisSummary;
  frameResults: FrameAnalysisResult[];
  outlierRange: StatisticalRange;
  pedestalRange: StatisticalRange;
}

// Props for Phase 4 Frame Analysis components
export interface FrameAnalysisListProps {
  frameResults: FrameAnalysisResult[];
  selectedFrame: string | null;
  onFrameAction?: FrameActionHandler;
  frameActions: any; // Will be typed from hook return
}

export interface FrameAnalysisItemProps {
  frame: FrameAnalysisResult;
  selectedFrame: string | null;
  onFrameAction?: FrameActionHandler;
  frameActions: any; // Will be typed from hook return
}

export interface QualityIndicatorsProps {
  frame: FrameAnalysisResult;
}

export interface FrameActionButtonsProps {
  frame: FrameAnalysisResult;
  onFrameAction: FrameActionHandler;
  frameActions: any; // Will be typed from hook return
}

export interface FrameDetailsPanelProps {
  frame: FrameAnalysisResult;
} 