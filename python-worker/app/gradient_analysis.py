"""
Gradient Analysis Module for Calibration Frame Quality Assessment

Following industry standards:
- Detection and validation happen during calibration stage (this module)
- Actual gradient correction happens in post-processing (GraXpert, Siril, etc.)
"""

import numpy as np
from scipy import ndimage
from astropy.io import fits
from typing import Dict, List, Tuple, Optional

class GradientAnalysisResult:
    """Results from gradient analysis of a calibration frame."""
    
    def __init__(self):
        self.frame_type: str = ""
        self.gradient_score: float = 0.0  # 0-10 scale (10 = perfect uniformity)
        self.uniformity_score: float = 0.0
        self.detected_issues: List[str] = []
        self.recommendations: List[str] = []
        self.statistics: Dict = {}
        self.quality_flags: Dict[str, bool] = {}

def analyze_dark_frame_gradients(data: np.ndarray) -> GradientAnalysisResult:
    """Analyze dark frame for gradient issues."""
    result = GradientAnalysisResult()
    result.frame_type = "dark"
    
    mean_val = np.mean(data)
    std_val = np.std(data)
    
    result.statistics = {
        'mean': float(mean_val),
        'std': float(std_val),
        'min': float(np.min(data)),
        'max': float(np.max(data))
    }
    
    # Amp glow detection
    amp_glow_detected, amp_glow_severity = detect_amp_glow(data)
    if amp_glow_detected:
        result.detected_issues.append(f"Amp glow detected (severity: {amp_glow_severity:.2f})")
        result.recommendations.append("Consider cooling camera more or shorter exposures")
    
    # Light leak detection
    light_leaks = detect_light_leaks_dark(data, mean_val, std_val)
    if light_leaks['detected']:
        result.detected_issues.append("Light leak detected")
        result.recommendations.append("Check for light leaks during dark exposures")
    
    # Calculate gradient score
    result.gradient_score = 8.0
    if amp_glow_detected:
        result.gradient_score -= amp_glow_severity * 3
    if light_leaks['detected']:
        result.gradient_score -= 4.0
    result.gradient_score = max(0.0, min(10.0, result.gradient_score))
    
    return result

def analyze_flat_frame_gradients(data: np.ndarray) -> GradientAnalysisResult:
    """Analyze flat frame for gradient issues."""
    result = GradientAnalysisResult()
    result.frame_type = "flat"
    
    mean_val = np.mean(data)
    std_val = np.std(data)
    
    result.statistics = {
        'mean': float(mean_val),
        'std': float(std_val),
        'min': float(np.min(data)),
        'max': float(np.max(data))
    }
    
    # Illumination uniformity
    uniformity = analyze_illumination_uniformity(data)
    result.uniformity_score = uniformity['uniformity_score']
    if uniformity['uniformity_score'] < 7.0:
        result.detected_issues.append("Poor illumination uniformity")
        result.recommendations.append("Check flat field illumination source")
    
    # Vignetting detection
    vignetting = detect_vignetting_pattern(data)
    if vignetting['detected']:
        result.detected_issues.append(f"Vignetting detected ({vignetting['percentage_drop']:.1f}% falloff)")
        result.recommendations.append("Significant vignetting - ensure proper correction in post-processing")
    
    result.gradient_score = uniformity['uniformity_score']
    
    return result

def detect_amp_glow(data: np.ndarray) -> Tuple[bool, float]:
    """Detect amplifier glow in dark frames."""
    h, w = data.shape
    corner_size = min(h, w) // 8
    
    # Check corners for elevated signal
    corners = [
        data[:corner_size, :corner_size],
        data[:corner_size, -corner_size:],
        data[-corner_size:, :corner_size],
        data[-corner_size:, -corner_size:]
    ]
    
    center_region = data[h//4:3*h//4, w//4:3*w//4]
    center_median = np.median(center_region)
    
    max_corner_excess = 0.0
    for corner in corners:
        corner_median = np.median(corner)
        excess = max(0, corner_median - center_median)
        max_corner_excess = max(max_corner_excess, excess)
    
    frame_noise = np.std(center_region)
    severity = max_corner_excess / max(frame_noise, 1.0)
    
    detected = severity > 2.0
    return detected, min(1.0, severity / 10.0)

def detect_light_leaks_dark(data: np.ndarray, mean_val: float, std_val: float) -> Dict:
    """Detect unexpected bright regions in dark frames."""
    threshold = mean_val + 5 * std_val
    bright_pixels = data > threshold
    
    if np.sum(bright_pixels) > data.size * 0.001:
        return {'detected': True, 'description': 'Bright regions found'}
    
    return {'detected': False, 'description': ''}

def analyze_illumination_uniformity(data: np.ndarray) -> Dict:
    """Analyze illumination uniformity in flat frames."""
    h, w = data.shape
    regions = []
    region_size = min(h, w) // 10
    
    for i in range(0, h - region_size, region_size):
        for j in range(0, w - region_size, region_size):
            region = data[i:i+region_size, j:j+region_size]
            regions.append(np.median(region))
    
    if len(regions) > 0:
        region_mean = np.mean(regions)
        region_std = np.std(regions)
        cv = region_std / region_mean if region_mean > 0 else 1.0
        uniformity_score = max(0.0, 10.0 - cv * 50)
        
        return {'uniformity_score': uniformity_score}
    
    return {'uniformity_score': 0.0}

def detect_vignetting_pattern(data: np.ndarray) -> Dict:
    """Detect vignetting patterns in flat frames."""
    h, w = data.shape
    center_y, center_x = h // 2, w // 2
    
    # Sample center vs edges
    center_size = min(h, w) // 10
    center_region = data[center_y-center_size:center_y+center_size,
                        center_x-center_size:center_x+center_size]
    center_value = np.median(center_region)
    
    edge_size = min(h, w) // 20
    edges = [
        data[:edge_size, :],
        data[-edge_size:, :],
        data[:, :edge_size],
        data[:, -edge_size:]
    ]
    
    edge_values = [np.median(edge) for edge in edges]
    min_edge_value = min(edge_values)
    
    falloff_percentage = ((center_value - min_edge_value) / center_value * 100) if center_value > 0 else 0
    
    detected = falloff_percentage > 15  # 15% threshold
    
    return {
        'detected': detected,
        'percentage_drop': float(falloff_percentage),
        'center_value': float(center_value),
        'edge_value': float(min_edge_value)
    }

def analyze_calibration_frame_gradients(fits_path: str, frame_type: str = None) -> GradientAnalysisResult:
    """Main function to analyze gradients in a calibration frame."""
    try:
        with fits.open(fits_path) as hdul:
            data = hdul[0].data.astype(np.float32)
            header = hdul[0].header
            
            if frame_type is None:
                imagetyp = header.get('IMAGETYP', '').lower()
                if 'dark' in imagetyp:
                    frame_type = 'dark'
                elif 'flat' in imagetyp:
                    frame_type = 'flat'
                else:
                    frame_type = 'dark'  # Default
            
            if frame_type == 'dark':
                return analyze_dark_frame_gradients(data)
            elif frame_type == 'flat':
                return analyze_flat_frame_gradients(data)
            else:
                raise ValueError(f"Unsupported frame type: {frame_type}")
                
    except Exception as e:
        result = GradientAnalysisResult()
        result.frame_type = frame_type or "unknown"  
        result.detected_issues = [f"Analysis failed: {str(e)}"]
        result.gradient_score = 0.0
        return result 