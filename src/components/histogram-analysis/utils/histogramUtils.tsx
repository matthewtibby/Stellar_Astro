import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { 
  QUALITY_THRESHOLDS, 
  QUALITY_COLORS, 
  STATUS_TEXT, 
  DISTRIBUTION_ICONS 
} from '../constants/histogramConstants';

/**
 * Get quality color class based on histogram score
 */
export const getQualityColor = (score: number): string => {
  if (score >= QUALITY_THRESHOLDS.EXCELLENT) return QUALITY_COLORS.EXCELLENT;
  if (score >= QUALITY_THRESHOLDS.GOOD) return QUALITY_COLORS.GOOD;
  if (score >= QUALITY_THRESHOLDS.MODERATE) return QUALITY_COLORS.MODERATE;
  return QUALITY_COLORS.POOR;
};

/**
 * Get quality icon component based on histogram score
 */
export const getQualityIcon = (score: number): React.ReactElement => {
  if (score >= QUALITY_THRESHOLDS.EXCELLENT) {
    return <CheckCircle className="w-4 h-4 text-green-400" />;
  }
  if (score >= QUALITY_THRESHOLDS.GOOD) {
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  }
  return <XCircle className="w-4 h-4 text-red-400" />;
};

/**
 * Get status text based on score and distribution type
 */
export const getStatusText = (score: number, distributionType: string): string => {
  if (score >= QUALITY_THRESHOLDS.EXCELLENT) return STATUS_TEXT.EXCELLENT;
  if (score >= QUALITY_THRESHOLDS.GOOD) return STATUS_TEXT.GOOD;
  if (score >= QUALITY_THRESHOLDS.MODERATE) return STATUS_TEXT.MODERATE;
  return STATUS_TEXT.POOR;
};

/**
 * Get distribution icon emoji based on distribution type
 */
export const getDistributionIcon = (distributionType: string): string => {
  return DISTRIBUTION_ICONS[distributionType as keyof typeof DISTRIBUTION_ICONS] || DISTRIBUTION_ICONS.default;
};

/**
 * Get quality badge style classes based on score
 */
export const getQualityBadgeStyle = (score: number): string => {
  if (score >= QUALITY_THRESHOLDS.EXCELLENT) return 'bg-green-900/50 text-green-300';
  if (score >= QUALITY_THRESHOLDS.GOOD) return 'bg-yellow-900/50 text-yellow-300';
  if (score >= QUALITY_THRESHOLDS.MODERATE) return 'bg-orange-900/50 text-orange-300';
  return 'bg-red-900/50 text-red-300';
};

/**
 * Calculate statistical ranges from frame results
 */
export const calculateStatisticalRanges = (frameResults: any[]) => {
  if (frameResults.length === 0) {
    return {
      outlierRange: { min: 0, max: 0 },
      pedestalRange: { min: 0, max: 0 }
    };
  }

  const outlierPercentages = frameResults.map(f => f.outlier_percent);
  const pedestalValues = frameResults
    .filter(f => f.requires_pedestal)
    .map(f => f.recommended_pedestal);

  return {
    outlierRange: {
      min: Math.min(...outlierPercentages),
      max: Math.max(...outlierPercentages)
    },
    pedestalRange: {
      min: pedestalValues.length > 0 ? Math.min(...pedestalValues) : 0,
      max: pedestalValues.length > 0 ? Math.max(...pedestalValues) : 0
    }
  };
}; 