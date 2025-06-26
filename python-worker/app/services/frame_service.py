import logging
import asyncio
import os
import tempfile
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from astropy.io import fits
import numpy as np

from models.requests import OutlierDetectRequest, FrameConsistencyRequest, TrailDetectRequest
from supabase_io import download_file
from outlier_rejection import detect_outlier_frames
from frame_consistency import analyze_frame_consistency
from trail_detection import detect_trails

logger = logging.getLogger(__name__)

class FrameService:
    """Service for handling frame analysis operations"""
    
    @classmethod
    async def detect_outlier_frames(cls, fits_paths: List[str], bucket: str, project_id: str, 
                                   user_id: str, frame_type: str, sigma_thresh: float = 3.0) -> Dict[str, Any]:
        """Detect outlier frames in a set of calibration frames"""
        try:
            # Build file paths
            full_paths = []
            for path in fits_paths:
                if not path.startswith('fits-files/'):
                    full_path = f"fits-files/{user_id}/{project_id}/{path}"
                else:
                    full_path = path
                full_paths.append(full_path)
            
            if not full_paths:
                return {'good': [], 'outliers': [], 'summary': {}, 'recommendations': []}
            
            logger.info(f"Detecting outliers in {len(full_paths)} files")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = []
                for i, path in enumerate(full_paths):
                    local_path = os.path.join(tmpdir, f"outlier_input_{i}.fits")
                    try:
                        download_file(bucket, path, local_path)
                        local_files.append(local_path)
                    except Exception as e:
                        logger.error(f"Failed to download {path}: {e}")
                        continue
                
                if not local_files:
                    return {'good': [], 'outliers': [], 'summary': {}, 'recommendations': []}
                
                # Perform outlier detection
                outlier_result = detect_outlier_frames(
                    local_files,
                    sigma_thresh=sigma_thresh,
                    frame_type=frame_type
                )
                
                return {
                    'good': outlier_result.get('good_frames', []),
                    'outliers': outlier_result.get('outlier_frames', []),
                    'summary': outlier_result.get('summary', {}),
                    'recommendations': outlier_result.get('recommendations', [])
                }
                
        except Exception as e:
            logger.error(f"Error in outlier detection: {e}")
            return {'good': [], 'outliers': [], 'summary': {}, 'recommendations': []}
    
    @classmethod
    async def analyze_frame_consistency(cls, fits_paths: List[str], bucket: str, project_id: str, 
                                       user_id: str, frame_type: str, consistency_threshold: float = 0.95,
                                       sigma_threshold: float = 3.0, min_frames: int = 3, max_frames: int = 50) -> Dict[str, Any]:
        """Analyze frame consistency and provide selection recommendations"""
        try:
            # Build file paths
            full_paths = []
            for path in fits_paths:
                if not path.startswith('fits-files/'):
                    full_path = f"fits-files/{user_id}/{project_id}/{path}"
                else:
                    full_path = path
                full_paths.append(full_path)
            
            if not full_paths:
                return {'consistency_scores': [], 'selection_advice': {}, 'analysis_summary': {}, 'frame_recommendations': []}
            
            logger.info(f"Analyzing frame consistency for {len(full_paths)} files")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = []
                for i, path in enumerate(full_paths):
                    local_path = os.path.join(tmpdir, f"consistency_input_{i}.fits")
                    try:
                        download_file(bucket, path, local_path)
                        local_files.append(local_path)
                    except Exception as e:
                        logger.error(f"Failed to download {path}: {e}")
                        continue
                
                if not local_files:
                    return {'consistency_scores': [], 'selection_advice': {}, 'analysis_summary': {}, 'frame_recommendations': []}
                
                # Perform consistency analysis
                consistency_result = analyze_frame_consistency(
                    local_files,
                    consistency_threshold=consistency_threshold,
                    sigma_threshold=sigma_threshold,
                    min_frames=min_frames,
                    max_frames=max_frames,
                    frame_type=frame_type
                )
                
                return {
                    'consistency_scores': consistency_result.get('consistency_scores', []),
                    'selection_advice': consistency_result.get('selection_advice', {}),
                    'analysis_summary': consistency_result.get('analysis_summary', {}),
                    'frame_recommendations': consistency_result.get('frame_recommendations', [])
                }
                
        except Exception as e:
            logger.error(f"Error analyzing frame consistency: {e}")
            return {'consistency_scores': [], 'selection_advice': {}, 'analysis_summary': {}, 'frame_recommendations': []}
    
    @classmethod
    async def detect_trails(cls, fits_path: str, sensitivity: float = 0.5, min_length: int = 30,
                           mask_output: bool = True, preview_output: bool = True, 
                           output_dir: str = 'output') -> Dict[str, Any]:
        """Detect satellite/airplane trails in frames"""
        try:
            logger.info(f"Detecting trails in {fits_path}")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download file if it's a remote path
                if fits_path.startswith('fits-files/'):
                    local_file = os.path.join(tmpdir, 'trail_input.fits')
                    download_file('fits-files', fits_path, local_file)
                else:
                    local_file = fits_path
                
                # Perform trail detection
                trail_result = detect_trails(
                    local_file,
                    sensitivity=sensitivity,
                    min_length=min_length,
                    mask_output=mask_output,
                    preview_output=preview_output,
                    output_dir=output_dir
                )
                
                return {
                    'trails_detected': trail_result.get('trails_detected', 0),
                    'trail_coordinates': trail_result.get('trail_coordinates', []),
                    'mask_path': trail_result.get('mask_path'),
                    'preview_path': trail_result.get('preview_path')
                }
                
        except Exception as e:
            logger.error(f"Error detecting trails: {e}")
            return {'trails_detected': 0, 'trail_coordinates': [], 'mask_path': None, 'preview_path': None} 