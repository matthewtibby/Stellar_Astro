// Types for calibration analysis operations

/**
 * Outlier detection result for a single frame.
 */
export interface OutlierResult {
  frame: string;
  score: number;
  reason: string;
  suggested_action: 'keep' | 'remove';
}

/**
 * Consistency analysis result for a single frame.
 */
export interface ConsistencyResult {
  frame: string;
  consistency_score: number;
  issues: string[];
  recommendation: 'accept' | 'review' | 'reject';
}

/**
 * Histogram analysis result for a single frame.
 */
export interface HistogramResult {
  frame: string;
  quality_score: number;
  issues: string[];
  histogram_data: any;
  recommendations: string[];
}

/**
 * State shape for all analysis operations.
 */
export interface AnalysisState {
  outliers: {
    loading: boolean;
    error: string | null;
    results: OutlierResult[];
    overrides: Record<string, 'keep' | 'remove'>;
  };
  consistency: {
    loading: boolean;
    error: string | null;
    results: ConsistencyResult[];
    selections: Record<string, boolean>;
  };
  histogram: {
    loading: boolean;
    error: string | null;
    results: HistogramResult[];
    notification: string | null;
  };
} 