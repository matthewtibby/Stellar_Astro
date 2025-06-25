import numpy as np
from astropy.io import fits
import os
from typing import List, Dict, Tuple, Optional
import scipy.stats as scipy_stats
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class FrameConsistencyMetrics:
    """Metrics for a single frame's consistency with the group"""
    path: str
    mean_consistency: float  # How close this frame's mean is to group median
    std_consistency: float   # How close this frame's std is to group median
    histogram_similarity: float  # Histogram correlation with group median
    pixel_correlation: float  # Pixel-wise correlation with group median
    outlier_deviation: float  # How many sigma this frame deviates
    consistency_score: float  # Overall consistency score (0-10)
    warnings: List[str]
    
@dataclass
class GroupConsistencyAnalysis:
    """Overall consistency analysis for a group of frames"""
    n_frames: int
    overall_consistency: float  # Group consistency score (0-10)
    mean_stability: float  # Coefficient of variation of means
    std_stability: float   # Coefficient of variation of stds
    temporal_drift: Optional[float]  # Linear trend in means over time
    recommended_frames: List[str]  # Frames to include in stacking
    questionable_frames: List[str]  # Frames that might be problematic
    rejected_frames: List[str]  # Frames to exclude
    metrics_by_frame: List[FrameConsistencyMetrics]
    group_statistics: Dict

def compute_frame_statistics(fits_path: str) -> Dict:
    """Compute detailed statistics for a single frame"""
    try:
        with fits.open(fits_path) as hdul:
            data = hdul[0].data.astype(np.float64)
            
        # Basic statistics
        frame_stats = {
            'path': fits_path,
            'mean': float(np.mean(data)),
            'median': float(np.median(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'shape': data.shape,
            'total_pixels': data.size
        }
        
        # Advanced statistics
        frame_stats['mad'] = float(np.median(np.abs(data - frame_stats['median'])))  # Mean Absolute Deviation
        frame_stats['skewness'] = float(scipy_stats.skew(data.flatten()))
        frame_stats['kurtosis'] = float(scipy_stats.kurtosis(data.flatten()))
        
        # Percentile statistics
        percentiles = [1, 5, 10, 25, 75, 90, 95, 99]
        frame_stats['percentiles'] = {p: float(np.percentile(data, p)) for p in percentiles}
        
        # Histogram for comparison
        hist, bin_edges = np.histogram(data, bins=100, density=True)
        frame_stats['histogram'] = hist
        frame_stats['histogram_bins'] = bin_edges
        
        # Spatial statistics (divide into quadrants)
        h, w = data.shape
        quadrants = {
            'top_left': data[:h//2, :w//2],
            'top_right': data[:h//2, w//2:],
            'bottom_left': data[h//2:, :w//2], 
            'bottom_right': data[h//2:, w//2:]
        }
        
        frame_stats['quadrant_means'] = {k: float(np.mean(v)) for k, v in quadrants.items()}
        frame_stats['spatial_uniformity'] = float(np.std(list(frame_stats['quadrant_means'].values())))
        
        return frame_stats
        
    except Exception as e:
        logger.error(f"Error computing statistics for {fits_path}: {e}")
        return None

def compute_histogram_similarity(hist1: np.ndarray, hist2: np.ndarray) -> float:
    """Compute histogram similarity using correlation coefficient"""
    try:
        correlation = np.corrcoef(hist1, hist2)[0, 1]
        return max(0.0, correlation)  # Clamp to 0-1 range
    except:
        return 0.0

def compute_pixel_correlation(data1: np.ndarray, data2: np.ndarray, sample_size: int = 10000) -> float:
    """Compute pixel-wise correlation between two frames using sampling for efficiency"""
    try:
        # Flatten and sample for efficiency on large images
        flat1 = data1.flatten()
        flat2 = data2.flatten()
        
        if len(flat1) > sample_size:
            indices = np.random.choice(len(flat1), sample_size, replace=False)
            flat1 = flat1[indices]
            flat2 = flat2[indices]
            
        correlation = np.corrcoef(flat1, flat2)[0, 1]
        return max(0.0, correlation)  # Clamp to 0-1 range
    except:
        return 0.0

def analyze_frame_consistency(fits_paths: List[str], 
                            consistency_threshold: float = 0.7,
                            sigma_threshold: float = 2.5) -> GroupConsistencyAnalysis:
    """
    Analyze frame-to-frame consistency in a set of calibration frames
    
    Args:
        fits_paths: List of FITS file paths
        consistency_threshold: Minimum consistency score to be considered "good"
        sigma_threshold: Sigma threshold for outlier detection
        
    Returns:
        GroupConsistencyAnalysis with detailed metrics
    """
    logger.info(f"Analyzing consistency for {len(fits_paths)} frames")
    
    # Compute statistics for all frames
    all_stats = []
    for path in fits_paths:
        stats = compute_frame_statistics(path)
        if stats:
            all_stats.append(stats)
    
    if len(all_stats) < 2:
        raise ValueError("Need at least 2 valid frames for consistency analysis")
    
    # Extract key metrics for group analysis
    means = np.array([s['mean'] for s in all_stats])
    stds = np.array([s['std'] for s in all_stats])
    medians = np.array([s['median'] for s in all_stats])
    
    # Group statistics
    group_mean = np.median(means)
    group_std = np.median(stds)
    group_median = np.median(medians)
    
    mean_stability = np.std(means) / np.mean(means) if np.mean(means) > 0 else float('inf')
    std_stability = np.std(stds) / np.mean(stds) if np.mean(stds) > 0 else float('inf')
    
    # Temporal drift analysis (assume files are in temporal order)
    temporal_drift = None
    if len(means) >= 3:
        x = np.arange(len(means))
        slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(x, means)
        if p_value < 0.05:  # Statistically significant trend
            temporal_drift = slope
    
    # Load representative frame data for pixel correlation
    reference_frame_idx = len(all_stats) // 2  # Use middle frame as reference
    reference_path = all_stats[reference_frame_idx]['path']
    
    try:
        with fits.open(reference_path) as hdul:
            reference_data = hdul[0].data.astype(np.float64)
    except:
        reference_data = None
    
    # Analyze each frame's consistency
    frame_metrics = []
    for i, stats in enumerate(all_stats):
        path = stats['path']
        
        # Compute consistency metrics
        mean_dev = abs(stats['mean'] - group_mean)
        mean_consistency = max(0, 1 - (mean_dev / group_mean)) if group_mean > 0 else 0
        
        std_dev = abs(stats['std'] - group_std)
        std_consistency = max(0, 1 - (std_dev / group_std)) if group_std > 0 else 0
        
        # Histogram similarity with group median histogram
        hist_similarity = 0.0
        if len(all_stats) > 1:
            # Create median histogram from all frames
            all_hists = np.array([s['histogram'] for s in all_stats])
            median_hist = np.median(all_hists, axis=0)
            hist_similarity = compute_histogram_similarity(stats['histogram'], median_hist)
        
        # Pixel correlation with reference frame
        pixel_correlation = 0.0
        if reference_data is not None and i != reference_frame_idx:
            try:
                with fits.open(path) as hdul:
                    frame_data = hdul[0].data.astype(np.float64)
                    pixel_correlation = compute_pixel_correlation(frame_data, reference_data)
            except:
                pixel_correlation = 0.0
        elif i == reference_frame_idx:
            pixel_correlation = 1.0  # Perfect correlation with itself
        
        # Outlier deviation (how many sigma from group median)
        outlier_deviation = abs(stats['mean'] - group_mean) / np.std(means) if np.std(means) > 0 else 0
        
        # Overall consistency score (weighted average)
        consistency_score = (
            0.3 * mean_consistency +
            0.2 * std_consistency +
            0.25 * hist_similarity +
            0.25 * pixel_correlation
        ) * 10  # Scale to 0-10
        
        # Generate warnings
        warnings = []
        if mean_consistency < 0.8:
            warnings.append(f"Mean deviates significantly from group ({stats['mean']:.1f} vs {group_mean:.1f})")
        if std_consistency < 0.8:
            warnings.append(f"Noise level differs from group ({stats['std']:.1f} vs {group_std:.1f})")
        if hist_similarity < 0.7:
            warnings.append("Histogram shape differs significantly from group")
        if pixel_correlation < 0.7:
            warnings.append("Low pixel correlation with reference frame")
        if outlier_deviation > sigma_threshold:
            warnings.append(f"Frame is {outlier_deviation:.1f}σ outlier")
        
        frame_metrics.append(FrameConsistencyMetrics(
            path=path,
            mean_consistency=mean_consistency,
            std_consistency=std_consistency,
            histogram_similarity=hist_similarity,
            pixel_correlation=pixel_correlation,
            outlier_deviation=outlier_deviation,
            consistency_score=consistency_score,
            warnings=warnings
        ))
    
    # Categorize frames based on consistency scores
    recommended_frames = []
    questionable_frames = []
    rejected_frames = []
    
    for metric in frame_metrics:
        if metric.consistency_score >= consistency_threshold * 10:
            recommended_frames.append(metric.path)
        elif metric.consistency_score >= (consistency_threshold * 0.5) * 10:
            questionable_frames.append(metric.path)
        else:
            rejected_frames.append(metric.path)
    
    # Overall group consistency score
    individual_scores = [m.consistency_score for m in frame_metrics]
    overall_consistency = np.mean(individual_scores)
    
    # Penalize groups with high variation or temporal drift
    if mean_stability > 0.1:  # More than 10% variation in means
        overall_consistency *= 0.9
    if temporal_drift and abs(temporal_drift) > group_mean * 0.01:  # 1% drift per frame
        overall_consistency *= 0.8
    
    overall_consistency = max(0, min(10, overall_consistency))
    
    # Group statistics
    group_statistics = {
        'group_mean': float(group_mean),
        'group_std': float(group_std),
        'group_median': float(group_median),
        'mean_range': (float(np.min(means)), float(np.max(means))),
        'std_range': (float(np.min(stds)), float(np.max(stds))),
        'mean_stability': float(mean_stability),
        'std_stability': float(std_stability),
        'temporal_drift': float(temporal_drift) if temporal_drift else None
    }
    
    return GroupConsistencyAnalysis(
        n_frames=len(all_stats),
        overall_consistency=overall_consistency,
        mean_stability=mean_stability,
        std_stability=std_stability,
        temporal_drift=temporal_drift,
        recommended_frames=recommended_frames,
        questionable_frames=questionable_frames,
        rejected_frames=rejected_frames,
        metrics_by_frame=frame_metrics,
        group_statistics=group_statistics
    )

def suggest_frame_selection(analysis: GroupConsistencyAnalysis, 
                          min_frames: int = 5,
                          max_frames: Optional[int] = None) -> Dict:
    """
    Suggest optimal frame selection based on consistency analysis
    
    Args:
        analysis: GroupConsistencyAnalysis result
        min_frames: Minimum number of frames to keep
        max_frames: Maximum number of frames to keep (None for no limit)
        
    Returns:
        Dictionary with frame selection suggestions
    """
    # Sort frames by consistency score
    sorted_frames = sorted(analysis.metrics_by_frame, 
                          key=lambda x: x.consistency_score, 
                          reverse=True)
    
    # Determine optimal selection
    selected_frames = analysis.recommended_frames.copy()
    
    # If we don't have enough recommended frames, add best questionable ones
    if len(selected_frames) < min_frames:
        questionable_sorted = [f for f in sorted_frames if f.path in analysis.questionable_frames]
        needed = min_frames - len(selected_frames)
        for frame in questionable_sorted[:needed]:
            selected_frames.append(frame.path)
    
    # If we have too many frames and max_frames is set, keep only the best
    if max_frames and len(selected_frames) > max_frames:
        selected_sorted = [f for f in sorted_frames if f.path in selected_frames]
        selected_frames = [f.path for f in selected_sorted[:max_frames]]
    
    # Calculate impact of selection
    selected_metrics = [m for m in analysis.metrics_by_frame if m.path in selected_frames]
    avg_consistency = np.mean([m.consistency_score for m in selected_metrics])
    
    return {
        'selected_frames': selected_frames,
        'excluded_frames': [f.path for f in analysis.metrics_by_frame if f.path not in selected_frames],
        'selection_quality': avg_consistency,
        'frames_used': len(selected_frames),
        'frames_excluded': analysis.n_frames - len(selected_frames),
        'improvement_estimate': avg_consistency - analysis.overall_consistency
    } 