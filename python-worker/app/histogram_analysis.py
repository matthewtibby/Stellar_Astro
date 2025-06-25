"""
Comprehensive Histogram/Distribution Analysis Module for Calibration Quality Assessment

This module implements market-leader level histogram analysis following PixInsight and Siril standards:
- Pre-calibration frame validation
- Post-calibration quality assessment  
- Automatic pedestal calculation
- Statistical distribution analysis
- Advanced outlier detection
- Frame rejection recommendations

Building on existing histogram functionality in main.py and frame_consistency.py
"""

import numpy as np
from astropy.io import fits
from scipy import stats, ndimage
from scipy.signal import find_peaks
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
import logging
import json

logger = logging.getLogger(__name__)

def _to_python_type(value):
    """Convert numpy types to native Python types for JSON serialization."""
    if hasattr(value, 'item'):  # numpy scalar
        return value.item()
    elif isinstance(value, (np.bool_, bool)):
        return bool(value)
    elif isinstance(value, (np.integer, int)):
        return int(value)
    elif isinstance(value, (np.floating, float)):
        return float(value)
    elif isinstance(value, dict):
        return {k: _to_python_type(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [_to_python_type(v) for v in value]
    else:
        return value

@dataclass
class HistogramAnalysisResult:
    """Comprehensive histogram analysis results for a calibration frame."""
    
    # Basic Statistics
    frame_path: str = ""
    frame_type: str = ""  # 'bias', 'dark', 'flat', 'light'
    
    # Histogram Data
    histogram: np.ndarray = None
    bin_edges: np.ndarray = None
    bin_centers: np.ndarray = None
    
    # Statistical Measures
    mean: float = 0.0
    median: float = 0.0
    mode: float = 0.0
    std: float = 0.0
    variance: float = 0.0
    skewness: float = 0.0
    kurtosis: float = 0.0
    mad: float = 0.0  # Median Absolute Deviation
    
    # Distribution Shape Analysis
    peak_count: int = 0
    peak_positions: List[float] = None
    peak_heights: List[float] = None
    distribution_type: str = ""  # 'normal', 'bimodal', 'clipped', 'anomalous'
    
    # Quality Metrics
    histogram_score: float = 0.0  # 0-10 scale
    clipping_detected: bool = False
    saturation_percent: float = 0.0
    zero_pixel_percent: float = 0.0
    negative_pixel_count: int = 0
    
    # Outlier Analysis
    outlier_count: int = 0
    outlier_percent: float = 0.0
    hot_pixel_count: int = 0
    cold_pixel_count: int = 0
    
    # Pedestal Analysis
    requires_pedestal: bool = False
    recommended_pedestal: float = 0.0
    pedestal_reason: str = ""
    
    # Frame-Specific Analysis
    bias_analysis: Dict = None
    dark_analysis: Dict = None
    flat_analysis: Dict = None
    
    # Quality Flags and Recommendations
    quality_flags: Dict[str, bool] = None
    issues_detected: List[str] = None
    recommendations: List[str] = None
    
    def __post_init__(self):
        if self.peak_positions is None:
            self.peak_positions = []
        if self.peak_heights is None:
            self.peak_heights = []
        if self.quality_flags is None:
            self.quality_flags = {}
        if self.issues_detected is None:
            self.issues_detected = []
        if self.recommendations is None:
            self.recommendations = []

class HistogramAnalyzer:
    """Advanced histogram analyzer implementing market-leader algorithms."""
    
    def __init__(self, bins: int = 256):
        self.bins = bins
        self.frame_type_thresholds = {
            'bias': {
                'max_std': 25,
                'max_range': 1000,
                'expected_mean_range': (500, 2000)
            },
            'dark': {
                'max_outlier_percent': 0.5,
                'max_hot_pixel_percent': 0.1,
                'expected_temp_signal': True
            },
            'flat': {
                'min_signal': 5000,
                'max_signal': 60000,
                'max_saturation_percent': 1.0,
                'min_uniformity': 0.8
            }
        }
    
    def analyze_frame_histogram(self, fits_path: str, frame_type: str = None) -> HistogramAnalysisResult:
        """
        Comprehensive histogram analysis of a calibration frame.
        
        Args:
            fits_path: Path to FITS file
            frame_type: 'bias', 'dark', 'flat', or 'light' (auto-detected if None)
            
        Returns:
            HistogramAnalysisResult with comprehensive analysis
        """
        try:
            with fits.open(fits_path) as hdul:
                data = hdul[0].data.astype(np.float64)
                header = hdul[0].header
                
                if frame_type is None:
                    frame_type = self._detect_frame_type(header, data)
                
                result = HistogramAnalysisResult()
                result.frame_path = fits_path
                result.frame_type = frame_type
                
                # Basic histogram computation
                self._compute_histogram(data, result)
                
                # Statistical analysis
                self._compute_statistics(data, result)
                
                # Distribution shape analysis
                self._analyze_distribution_shape(data, result)
                
                # Outlier and anomaly detection
                self._detect_outliers(data, result)
                
                # Clipping and saturation analysis
                self._analyze_clipping(data, result)
                
                # Pedestal analysis
                self._analyze_pedestal_requirements(data, result)
                
                # Frame-type specific analysis
                self._perform_frame_specific_analysis(data, result)
                
                # Generate quality score and recommendations
                self._generate_quality_assessment(result)
                
                return result
                
        except Exception as e:
            logger.error(f"Error analyzing histogram for {fits_path}: {e}")
            result = HistogramAnalysisResult()
            result.frame_path = fits_path
            result.frame_type = frame_type or "unknown"
            result.issues_detected = [f"Analysis failed: {str(e)}"]
            return result
    
    def _detect_frame_type(self, header: fits.header.Header, data: np.ndarray) -> str:
        """Auto-detect frame type from header and data characteristics."""
        imagetyp = header.get('IMAGETYP', '').lower()
        exptime = header.get('EXPTIME', 0.0)
        
        if 'bias' in imagetyp or exptime == 0:
            return 'bias'
        elif 'dark' in imagetyp:
            return 'dark'
        elif 'flat' in imagetyp:
            return 'flat'
        elif 'light' in imagetyp or 'science' in imagetyp:
            return 'light'
        else:
            # Heuristic detection based on statistics
            mean_val = np.mean(data)
            max_val = np.max(data)
            
            if mean_val < 2000 and max_val < 5000:
                return 'bias'
            elif mean_val < 5000 and max_val < 20000:
                return 'dark'
            elif mean_val > 10000:
                return 'flat'
            else:
                return 'unknown'
    
    def _compute_histogram(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Compute histogram with optimal binning."""
        # Use adaptive binning based on data range
        data_range = np.max(data) - np.min(data)
        if data_range > 0:
            bins = min(self.bins, int(data_range))
        else:
            bins = 64
        
        hist, bin_edges = np.histogram(data.flatten(), bins=bins)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        
        result.histogram = hist
        result.bin_edges = bin_edges
        result.bin_centers = bin_centers
    
    def _compute_statistics(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Compute comprehensive statistical measures."""
        flat_data = data.flatten()
        
        result.mean = float(np.mean(flat_data))
        result.median = float(np.median(flat_data))
        result.std = float(np.std(flat_data))
        result.variance = float(np.var(flat_data))
        result.mad = float(np.median(np.abs(flat_data - result.median)))
        
        # Robust statistics
        try:
            result.skewness = float(stats.skew(flat_data))
            result.kurtosis = float(stats.kurtosis(flat_data))
        except:
            result.skewness = 0.0
            result.kurtosis = 0.0
        
        # Mode estimation from histogram
        if result.histogram is not None and len(result.histogram) > 0:
            mode_idx = np.argmax(result.histogram)
            result.mode = float(result.bin_centers[mode_idx])
    
    def _analyze_distribution_shape(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Analyze the shape and characteristics of the distribution."""
        if result.histogram is None:
            return
        
        # Peak detection using simple method to avoid scipy dependency
        hist = result.histogram
        peaks = []
        
        # Find local maxima
        for i in range(1, len(hist) - 1):
            if hist[i] > hist[i-1] and hist[i] > hist[i+1] and hist[i] > np.max(hist) * 0.1:
                peaks.append(i)
        
        result.peak_count = len(peaks)
        result.peak_positions = [float(result.bin_centers[p]) for p in peaks]
        result.peak_heights = [float(result.histogram[p]) for p in peaks]
        
        # Distribution type classification
        if result.peak_count == 0:
            result.distribution_type = "flat"
        elif result.peak_count == 1:
            # Check for normal vs. clipped distribution
            if abs(result.skewness) < 0.5 and abs(result.kurtosis) < 3:
                result.distribution_type = "normal"
            elif result.skewness > 1.0:
                result.distribution_type = "right_clipped"
            elif result.skewness < -1.0:
                result.distribution_type = "left_clipped"
            else:
                result.distribution_type = "skewed"
        elif result.peak_count == 2:
            result.distribution_type = "bimodal"
        else:
            result.distribution_type = "multimodal"
    
    def _detect_outliers(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Detect various types of outliers and anomalous pixels."""
        flat_data = data.flatten()
        
        # Standard outlier detection (3-sigma rule)
        sigma_threshold = 3.0
        outlier_mask = np.abs(flat_data - result.mean) > (sigma_threshold * result.std)
        result.outlier_count = int(np.sum(outlier_mask))
        result.outlier_percent = (result.outlier_count / len(flat_data)) * 100
        
        # Hot pixel detection (frame-type specific)
        if result.frame_type in ['bias', 'dark']:
            hot_threshold = result.mean + 5 * result.std
            result.hot_pixel_count = int(np.sum(flat_data > hot_threshold))
        
        # Cold pixel detection
        cold_threshold = result.mean - 5 * result.std
        result.cold_pixel_count = int(np.sum(flat_data < cold_threshold))
    
    def _analyze_clipping(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Analyze clipping and saturation issues."""
        flat_data = data.flatten()
        total_pixels = len(flat_data)
        
        # Zero pixel detection
        zero_pixels = np.sum(flat_data <= 0)
        result.zero_pixel_percent = (zero_pixels / total_pixels) * 100
        result.negative_pixel_count = int(np.sum(flat_data < 0))
        
        # Saturation detection (assuming 16-bit data)
        max_value = np.max(flat_data)
        if max_value > 60000:  # Close to 16-bit saturation
            saturated_pixels = np.sum(flat_data >= 60000)
            result.saturation_percent = (saturated_pixels / total_pixels) * 100
        
        # Clipping detection
        result.clipping_detected = (result.zero_pixel_percent > 0.1 or 
                                  result.saturation_percent > 0.1)
    
    def _analyze_pedestal_requirements(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Analyze if pedestal correction is needed."""
        # Check for negative values or values close to zero
        min_value = np.min(data)
        
        if min_value < 0:
            result.requires_pedestal = True
            result.recommended_pedestal = abs(min_value) + 100
            result.pedestal_reason = f"Negative pixel values detected (min: {min_value:.1f})"
        elif min_value < 100 and result.frame_type != 'bias':
            result.requires_pedestal = True
            result.recommended_pedestal = 200 - min_value
            result.pedestal_reason = f"Very low pixel values may cause calibration issues (min: {min_value:.1f})"
        elif result.zero_pixel_percent > 0.1:
            result.requires_pedestal = True
            result.recommended_pedestal = 150
            result.pedestal_reason = f"{result.zero_pixel_percent:.2f}% zero pixels detected"
    
    def _perform_frame_specific_analysis(self, data: np.ndarray, result: HistogramAnalysisResult):
        """Perform analysis specific to frame type."""
        if result.frame_type == 'bias':
            result.bias_analysis = self._analyze_bias_frame(data, result)
        elif result.frame_type == 'dark':
            result.dark_analysis = self._analyze_dark_frame(data, result)
        elif result.frame_type == 'flat':
            result.flat_analysis = self._analyze_flat_frame(data, result)
    
    def _analyze_bias_frame(self, data: np.ndarray, result: HistogramAnalysisResult) -> Dict:
        """Specific analysis for bias frames."""
        analysis = {}
        thresholds = self.frame_type_thresholds['bias']
        
        # Check noise level
        analysis['noise_acceptable'] = result.std <= thresholds['max_std']
        analysis['noise_level'] = 'low' if result.std < 15 else 'high' if result.std > 25 else 'moderate'
        
        # Check for expected bias level
        expected_min, expected_max = thresholds['expected_mean_range']
        analysis['bias_level_normal'] = expected_min <= result.mean <= expected_max
        
        # Check histogram shape (should be narrow and centered)
        data_range = np.max(data) - np.min(data)
        analysis['histogram_narrow'] = data_range <= thresholds['max_range']
        
        return analysis
    
    def _analyze_dark_frame(self, data: np.ndarray, result: HistogramAnalysisResult) -> Dict:
        """Specific analysis for dark frames."""
        analysis = {}
        thresholds = self.frame_type_thresholds['dark']
        
        # Hot pixel analysis
        analysis['hot_pixel_acceptable'] = result.outlier_percent <= thresholds['max_outlier_percent']
        analysis['hot_pixel_level'] = (
            'low' if result.outlier_percent < 0.1 else
            'high' if result.outlier_percent > 0.5 else 'moderate'
        )
        
        # Thermal signal analysis
        analysis['thermal_signal_present'] = result.mean > (result.mode + 50)
        
        return analysis
    
    def _analyze_flat_frame(self, data: np.ndarray, result: HistogramAnalysisResult) -> Dict:
        """Specific analysis for flat frames."""
        analysis = {}
        thresholds = self.frame_type_thresholds['flat']
        
        # Exposure level analysis
        analysis['properly_exposed'] = (thresholds['min_signal'] <= result.mean <= thresholds['max_signal'])
        analysis['exposure_level'] = (
            'underexposed' if result.mean < thresholds['min_signal'] else
            'overexposed' if result.mean > thresholds['max_signal'] else 'good'
        )
        
        # Saturation check
        analysis['saturation_acceptable'] = result.saturation_percent <= thresholds['max_saturation_percent']
        
        # Uniformity analysis (simplified)
        regions = self._analyze_spatial_uniformity(data)
        analysis['uniformity_score'] = regions.get('uniformity_score', 0.0)
        analysis['uniformity_acceptable'] = analysis['uniformity_score'] >= thresholds['min_uniformity']
        
        return analysis
    
    def _analyze_spatial_uniformity(self, data: np.ndarray) -> Dict:
        """Analyze spatial uniformity of flat frames."""
        h, w = data.shape
        region_size = min(h, w) // 10
        
        regions = []
        for i in range(0, h - region_size, region_size):
            for j in range(0, w - region_size, region_size):
                region = data[i:i+region_size, j:j+region_size]
                regions.append(np.median(region))
        
        if len(regions) > 0:
            region_mean = np.mean(regions)
            region_std = np.std(regions)
            uniformity_score = max(0.0, 1.0 - (region_std / region_mean)) if region_mean > 0 else 0.0
            
            return {
                'uniformity_score': uniformity_score,
                'region_variation': region_std / region_mean if region_mean > 0 else 1.0
            }
        
        return {'uniformity_score': 0.0, 'region_variation': 1.0}
    
    def _generate_quality_assessment(self, result: HistogramAnalysisResult):
        """Generate overall quality score and recommendations."""
        score = 10.0
        issues = []
        recommendations = []
        
        # General quality checks
        if result.clipping_detected:
            score -= 2.0
            issues.append("Clipping detected in histogram")
            recommendations.append("Check exposure settings and avoid saturation")
        
        if result.outlier_percent > 1.0:
            score -= 1.5
            issues.append(f"High outlier percentage: {result.outlier_percent:.2f}%")
            recommendations.append("Check for hot pixels or cosmic rays")
        
        if result.requires_pedestal:
            score -= 1.0
            issues.append("Pedestal correction required")
            recommendations.append(f"Apply pedestal of {result.recommended_pedestal:.0f} DN: {result.pedestal_reason}")
        
        # Frame-specific quality assessment
        if result.frame_type == 'bias' and result.bias_analysis:
            if not result.bias_analysis.get('noise_acceptable', True):
                score -= 2.0
                issues.append("High noise in bias frame")
                recommendations.append("Check for electronic interference or cooling issues")
            
            if not result.bias_analysis.get('bias_level_normal', True):
                score -= 1.0
                issues.append("Unusual bias level")
                recommendations.append("Check camera offset settings")
        
        elif result.frame_type == 'dark' and result.dark_analysis:
            if not result.dark_analysis.get('hot_pixel_acceptable', True):
                score -= 2.0
                issues.append("Excessive hot pixels in dark frame")
                recommendations.append("Consider lower temperature or longer cooling time")
        
        elif result.frame_type == 'flat' and result.flat_analysis:
            if result.flat_analysis.get('exposure_level') == 'underexposed':
                score -= 2.0
                issues.append("Flat frame underexposed")
                recommendations.append("Increase exposure time or illumination")
            elif result.flat_analysis.get('exposure_level') == 'overexposed':
                score -= 2.0
                issues.append("Flat frame overexposed")
                recommendations.append("Decrease exposure time or illumination")
            
            if not result.flat_analysis.get('uniformity_acceptable', True):
                score -= 1.5
                issues.append("Poor illumination uniformity")
                recommendations.append("Check flat field illumination setup")
        
        # Distribution shape issues
        if result.distribution_type in ['right_clipped', 'left_clipped']:
            score -= 1.5
            issues.append(f"Distribution shows {result.distribution_type}")
            recommendations.append("Check for saturation or underexposure")
        
        # Finalize assessment
        result.histogram_score = max(0.0, min(10.0, score))
        result.issues_detected = issues
        result.recommendations = recommendations
        
        # Quality flags
        result.quality_flags = {
            'histogram_acceptable': result.histogram_score >= 7.0,
            'distribution_normal': result.distribution_type in ['normal', 'skewed'],
            'no_clipping': not result.clipping_detected,
            'outliers_acceptable': result.outlier_percent <= 1.0,
            'pedestal_not_required': not result.requires_pedestal
        }

def analyze_calibration_frame_histograms(fits_paths: List[str], 
                                       frame_type: str = None) -> Dict:
    """
    Analyze histograms for a set of calibration frames.
    
    Args:
        fits_paths: List of FITS file paths
        frame_type: Frame type ('bias', 'dark', 'flat') or None for auto-detection
        
    Returns:
        Dictionary with analysis results and summary
    """
    analyzer = HistogramAnalyzer()
    results = []
    
    for fits_path in fits_paths:
        result = analyzer.analyze_frame_histogram(fits_path, frame_type)
        # Convert to JSON-serializable format
        result_dict = _convert_result_to_dict(result)
        results.append(result_dict)
    
    # Generate summary statistics
    if results:
        scores = [r['histogram_score'] for r in results if r['histogram_score'] > 0]
        summary = {
            'total_frames': len(results),
            'analyzed_frames': len([r for r in results if r['histogram_score'] > 0]),
            'average_score': float(np.mean(scores)) if scores else 0.0,
            'score_std': float(np.std(scores)) if scores else 0.0,
            'frames_requiring_pedestal': len([r for r in results if r['requires_pedestal']]),
            'frames_with_clipping': len([r for r in results if r['clipping_detected']]),
            'high_quality_frames': len([r for r in results if r['histogram_score'] >= 8.0]),
            'acceptable_frames': len([r for r in results if r['histogram_score'] >= 6.0]),
            'poor_quality_frames': len([r for r in results if r['histogram_score'] < 6.0]),
            'common_issues': _extract_common_issues_from_dicts(results),
            'overall_recommendation': _generate_overall_recommendation_from_dicts(results)
        }
    else:
        summary = {
            'total_frames': 0,
            'analyzed_frames': 0,
            'average_score': 0.0,
            'overall_recommendation': 'No frames analyzed'
        }
    
    return {
        'frame_results': results,
        'summary': summary
    }

def _convert_result_to_dict(result: HistogramAnalysisResult) -> Dict:
    """Convert HistogramAnalysisResult to JSON-serializable dictionary."""
    return {
        'frame_path': str(result.frame_path),
        'frame_type': str(result.frame_type),
        'histogram_score': _to_python_type(result.histogram_score),
        'distribution_type': str(result.distribution_type),
        'clipping_detected': _to_python_type(result.clipping_detected),
        'saturation_percent': _to_python_type(result.saturation_percent),
        'zero_pixel_percent': _to_python_type(result.zero_pixel_percent),
        'outlier_percent': _to_python_type(result.outlier_percent),
        'requires_pedestal': _to_python_type(result.requires_pedestal),
        'recommended_pedestal': _to_python_type(result.recommended_pedestal),
        'pedestal_reason': str(result.pedestal_reason),
        'issues_detected': result.issues_detected or [],
        'recommendations': result.recommendations or [],
        'quality_flags': _to_python_type(result.quality_flags or {}),
        # Statistical data
        'mean': _to_python_type(result.mean),
        'median': _to_python_type(result.median),
        'std': _to_python_type(result.std),
        'skewness': _to_python_type(result.skewness),
        'kurtosis': _to_python_type(result.kurtosis),
        # Frame-specific analysis (simplified)
        'bias_analysis': _to_python_type(result.bias_analysis),
        'dark_analysis': _to_python_type(result.dark_analysis),
        'flat_analysis': _to_python_type(result.flat_analysis)
    }

def _extract_common_issues_from_dicts(results: List[Dict]) -> List[str]:
    """Extract the most common issues across all frames from dictionary format."""
    issue_counts = {}
    
    for result in results:
        for issue in result.get('issues_detected', []):
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
    
    # Return issues that affect more than 30% of frames
    threshold = max(1, len(results) * 0.3)
    common_issues = [issue for issue, count in issue_counts.items() if count >= threshold]
    return common_issues

def _generate_overall_recommendation_from_dicts(results: List[Dict]) -> str:
    """Generate overall recommendation from dictionary format results."""
    if not results:
        return "No frames to analyze"
    
    scores = [r['histogram_score'] for r in results if r['histogram_score'] > 0]
    if not scores:
        return "Unable to analyze frame quality"
    
    avg_score = np.mean(scores)
    poor_frames = len([r for r in results if r['histogram_score'] < 6.0])
    total_frames = len(results)
    
    if avg_score >= 8.0:
        return "Excellent histogram quality. Frames are ready for calibration."
    elif avg_score >= 6.0:
        if poor_frames > total_frames * 0.2:
            return "Good overall quality, but consider reviewing flagged frames."
        return "Good histogram quality. Proceed with calibration."
    elif avg_score >= 4.0:
        return "Moderate histogram quality. Review recommendations and consider re-acquisition of problematic frames."
    else:
        return "Poor histogram quality detected. Consider re-acquiring frames with improved setup."

def _extract_common_issues(results: List[HistogramAnalysisResult]) -> List[str]:
    """Extract the most common issues across all frames."""
    issue_counts = {}
    
    for result in results:
        for issue in result.issues_detected:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
    
    # Return issues affecting more than 25% of frames
    threshold = len(results) * 0.25
    common_issues = [issue for issue, count in issue_counts.items() if count >= threshold]
    
    return common_issues

def _generate_overall_recommendation(results: List[HistogramAnalysisResult]) -> str:
    """Generate an overall recommendation based on all frame analyses."""
    if not results:
        return "No frames to analyze"
    
    scores = [r.histogram_score for r in results if r.histogram_score > 0]
    if not scores:
        return "Analysis failed for all frames"
    
    avg_score = np.mean(scores)
    
    if avg_score >= 8.0:
        return "Excellent histogram quality across all frames. Ready for calibration."
    elif avg_score >= 6.0:
        return "Good histogram quality. Minor issues detected but frames are usable."
    elif avg_score >= 4.0:
        return "Moderate histogram quality. Review recommendations and consider re-acquisition of problematic frames."
    else:
        return "Poor histogram quality detected. Significant issues require attention before calibration." 