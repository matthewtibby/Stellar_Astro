import logging
import asyncio
import os
import tempfile
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from astropy.io import fits
import numpy as np

from supabase_io import download_file, list_files
from fits_analysis import analyze_fits_headers

logger = logging.getLogger(__name__)

class SuperdarkService:
    """Service for handling superdark creation and analysis operations"""
    
    # In-memory storage for job tracking (would be database in production)
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def insert_job(cls, job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new superdark job into storage"""
        cls._jobs[job_id] = {
            'status': status,
            'error': error,
            'result': result,
            'diagnostics': diagnostics,
            'warnings': warnings,
            'progress': progress or 0,
            'created_at': datetime.utcnow().isoformat()
        }
        logger.info(f"Inserted superdark job {job_id} with status {status}")
    
    @classmethod
    async def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get superdark job data from storage"""
        return cls._jobs.get(job_id)
    
    @classmethod
    async def update_job_progress(cls, job_id: str, progress: int):
        """Update superdark job progress"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['progress'] = progress
            logger.info(f"Updated superdark job {job_id} progress to {progress}%")
    
    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel a running superdark job"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['status'] = 'cancelled'
            logger.info(f"Cancelled superdark job {job_id}")
            return True
        return False
    
    @classmethod
    async def create_superdark(cls, project_ids: List[str], user_id: str, 
                             requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Create a superdark from multiple projects"""
        try:
            logger.info(f"Creating superdark for projects {project_ids}")
            
            # Collect all dark frames from specified projects
            all_dark_frames = []
            for project_id in project_ids:
                dark_frames = await cls._collect_project_darks(project_id, user_id)
                all_dark_frames.extend(dark_frames)
            
            if not all_dark_frames:
                return {
                    'success': False,
                    'error': 'No dark frames found in specified projects'
                }
            
            logger.info(f"Found {len(all_dark_frames)} total dark frames")
            
            # Filter frames based on requirements
            filtered_frames = cls._filter_frames_by_requirements(all_dark_frames, requirements)
            
            if not filtered_frames:
                return {
                    'success': False,
                    'error': 'No frames match the specified requirements'
                }
            
            logger.info(f"Using {len(filtered_frames)} frames after filtering")
            
            # Group frames by matching characteristics
            frame_groups = cls._group_matching_frames(filtered_frames)
            
            # Create superdarks for each group
            superdark_results = []
            for group_key, group_frames in frame_groups.items():
                if len(group_frames) >= requirements.get('min_frames', 5):
                    result = await cls._create_superdark_group(
                        group_frames, group_key, user_id, requirements
                    )
                    if result:
                        superdark_results.append(result)
            
            return {
                'success': True,
                'total_frames_found': len(all_dark_frames),
                'frames_used': len(filtered_frames),
                'superdarks_created': len(superdark_results),
                'superdark_results': superdark_results,
                'frame_groups': {k: len(v) for k, v in frame_groups.items()}
            }
            
        except Exception as e:
            logger.error(f"Error creating superdark: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    async def analyze_superdark(cls, superdark_path: str, bucket: str) -> Dict[str, Any]:
        """Analyze a superdark file for quality and characteristics"""
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                local_path = os.path.join(tmpdir, 'superdark_analysis.fits')
                
                # Download superdark file
                download_file(bucket, superdark_path, local_path)
                
                # Perform analysis
                with fits.open(local_path) as hdul:
                    header = hdul[0].header
                    data = hdul[0].data.astype(np.float32)
                    
                    # Basic statistics
                    stats = {
                        'mean': float(np.mean(data)),
                        'median': float(np.median(data)),
                        'std': float(np.std(data)),
                        'min': float(np.min(data)),
                        'max': float(np.max(data)),
                        'shape': data.shape
                    }
                    
                    # Noise analysis
                    noise_analysis = cls._analyze_noise_patterns(data)
                    
                    # Hot pixel detection
                    hot_pixels = cls._detect_hot_pixels(data)
                    
                    # Gradient analysis
                    gradient_analysis = cls._analyze_gradients(data)
                    
                    # Header analysis
                    header_analysis = analyze_fits_headers(header)
                    
                    return {
                        'success': True,
                        'file_path': superdark_path,
                        'statistics': stats,
                        'noise_analysis': noise_analysis,
                        'hot_pixels': hot_pixels,
                        'gradient_analysis': gradient_analysis,
                        'header_analysis': {
                            'confidence': header_analysis.confidence,
                            'warnings': header_analysis.warnings,
                            'detected_type': header_analysis.frame_type
                        },
                        'quality_assessment': cls._assess_superdark_quality(
                            stats, noise_analysis, hot_pixels, gradient_analysis
                        )
                    }
                    
        except Exception as e:
            logger.error(f"Error analyzing superdark {superdark_path}: {e}")
            return {
                'success': False,
                'error': str(e),
                'file_path': superdark_path
            }
    
    @classmethod
    async def _collect_project_darks(cls, project_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Collect all dark frames from a project"""
        try:
            bucket = "fits-files"
            prefix = f"{user_id}/{project_id}/"
            
            files = list_files(bucket, prefix)
            
            dark_frames = []
            for file_info in files:
                file_path = file_info['name']
                
                # Check if it's a dark frame
                if 'dark' in file_path.lower() and file_path.lower().endswith(('.fit', '.fits')):
                    # Download and analyze header to get metadata
                    try:
                        with tempfile.TemporaryDirectory() as tmpdir:
                            local_path = os.path.join(tmpdir, 'temp_dark.fits')
                            download_file(bucket, file_path, local_path)
                            
                            with fits.open(local_path) as hdul:
                                header = hdul[0].header
                                
                                dark_frames.append({
                                    'path': file_path,
                                    'name': os.path.basename(file_path),
                                    'project': project_id,
                                    'camera': header.get('INSTRUME', 'unknown'),
                                    'binning': f"{header.get('XBINNING', 1)}x{header.get('YBINNING', 1)}",
                                    'gain': header.get('GAIN', 0),
                                    'temp': header.get('CCD-TEMP', 0),
                                    'exposure': header.get('EXPTIME', 0),
                                    'size': file_info.get('size', 0)
                                })
                    except Exception as e:
                        logger.warning(f"Could not analyze dark frame {file_path}: {e}")
                        continue
            
            return dark_frames
            
        except Exception as e:
            logger.error(f"Error collecting darks from project {project_id}: {e}")
            return []
    
    @classmethod
    def _filter_frames_by_requirements(cls, frames: List[Dict[str, Any]], 
                                     requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter frames based on requirements"""
        filtered = []
        
        for frame in frames:
            # Check camera requirement
            if 'camera' in requirements and frame.get('camera') != requirements['camera']:
                continue
            
            # Check binning requirement
            if 'binning' in requirements and frame.get('binning') != requirements['binning']:
                continue
            
            # Check gain requirement (with tolerance)
            if 'gain' in requirements:
                frame_gain = frame.get('gain', 0)
                req_gain = requirements['gain']
                if abs(frame_gain - req_gain) > requirements.get('gain_tolerance', 0.1):
                    continue
            
            # Check temperature requirement (with tolerance)
            if 'temp' in requirements:
                frame_temp = frame.get('temp', 0)
                req_temp = requirements['temp']
                if abs(frame_temp - req_temp) > requirements.get('temp_tolerance', 2.0):
                    continue
            
            # Check exposure requirement (with tolerance)
            if 'exposure' in requirements:
                frame_exp = frame.get('exposure', 0)
                req_exp = requirements['exposure']
                if abs(frame_exp - req_exp) > requirements.get('exposure_tolerance', 1.0):
                    continue
            
            filtered.append(frame)
        
        return filtered
    
    @classmethod
    def _group_matching_frames(cls, frames: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group frames by matching characteristics"""
        groups = {}
        
        for frame in frames:
            # Create a key based on frame characteristics
            key = f"{frame.get('camera', 'unknown')}_" \
                  f"{frame.get('binning', '1x1')}_" \
                  f"G{frame.get('gain', 0)}_" \
                  f"T{frame.get('temp', 0)}_" \
                  f"E{frame.get('exposure', 0)}"
            
            if key not in groups:
                groups[key] = []
            groups[key].append(frame)
        
        return groups
    
    @classmethod
    async def _create_superdark_group(cls, frames: List[Dict[str, Any]], group_key: str, 
                                    user_id: str, requirements: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a superdark from a group of matching frames"""
        try:
            logger.info(f"Creating superdark for group {group_key} with {len(frames)} frames")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download all frames
                local_files = []
                for i, frame in enumerate(frames):
                    local_path = os.path.join(tmpdir, f"dark_{i}.fits")
                    download_file("fits-files", frame['path'], local_path)
                    local_files.append(local_path)
                
                # Stack frames to create superdark
                stacked_data = cls._stack_dark_frames(local_files, requirements.get('stacking_method', 'median'))
                
                # Create output filename
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                output_filename = f"superdark_{group_key}_{timestamp}.fits"
                output_path = os.path.join(tmpdir, output_filename)
                
                # Create FITS file
                header = fits.Header()
                header['IMAGETYP'] = 'MASTER DARK'
                header['CREATOR'] = 'Stellar Astro Superdark Service'
                header['DATE'] = datetime.utcnow().isoformat()
                header['NFRAMES'] = len(frames)
                header['STACKMTH'] = requirements.get('stacking_method', 'median')
                header['GROUPKEY'] = group_key
                
                # Add frame characteristics to header
                if frames:
                    first_frame = frames[0]
                    header['INSTRUME'] = first_frame.get('camera', 'unknown')
                    header['XBINNING'] = int(first_frame.get('binning', '1x1').split('x')[0])
                    header['YBINNING'] = int(first_frame.get('binning', '1x1').split('x')[1])
                    header['GAIN'] = first_frame.get('gain', 0)
                    header['CCD-TEMP'] = first_frame.get('temp', 0)
                    header['EXPTIME'] = first_frame.get('exposure', 0)
                
                hdu = fits.PrimaryHDU(stacked_data, header=header)
                hdu.writeto(output_path, overwrite=True)
                
                # TODO: Upload to storage
                # upload_path = f"{user_id}/superdarks/{output_filename}"
                # upload_file("fits-files", output_path, upload_path)
                
                return {
                    'group_key': group_key,
                    'filename': output_filename,
                    'frames_used': len(frames),
                    'stacking_method': requirements.get('stacking_method', 'median'),
                    'characteristics': {
                        'camera': frames[0].get('camera') if frames else 'unknown',
                        'binning': frames[0].get('binning') if frames else '1x1',
                        'gain': frames[0].get('gain') if frames else 0,
                        'temp': frames[0].get('temp') if frames else 0,
                        'exposure': frames[0].get('exposure') if frames else 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Error creating superdark for group {group_key}: {e}")
            return None
    
    @classmethod
    def _stack_dark_frames(cls, local_files: List[str], method: str = 'median') -> np.ndarray:
        """Stack dark frames using specified method"""
        if not local_files:
            raise ValueError("No files to stack")
        
        # Load all frames
        frames = []
        for file_path in local_files:
            with fits.open(file_path) as hdul:
                frames.append(hdul[0].data.astype(np.float32))
        
        # Stack frames
        frame_stack = np.stack(frames, axis=0)
        
        if method == 'median':
            return np.median(frame_stack, axis=0)
        elif method == 'mean':
            return np.mean(frame_stack, axis=0)
        elif method == 'sigma':
            # Sigma clipping
            return cls._sigma_clip_stack(frame_stack)
        else:
            logger.warning(f"Unknown stacking method {method}, using median")
            return np.median(frame_stack, axis=0)
    
    @classmethod
    def _sigma_clip_stack(cls, frame_stack: np.ndarray, sigma: float = 3.0) -> np.ndarray:
        """Stack frames using sigma clipping"""
        mean_frame = np.mean(frame_stack, axis=0)
        std_frame = np.std(frame_stack, axis=0)
        
        # Create mask for values within sigma range
        mask = np.abs(frame_stack - mean_frame) <= (sigma * std_frame)
        
        # Calculate masked mean
        masked_stack = np.where(mask, frame_stack, np.nan)
        return np.nanmean(masked_stack, axis=0)
    
    @classmethod
    def _analyze_noise_patterns(cls, data: np.ndarray) -> Dict[str, Any]:
        """Analyze noise patterns in the superdark"""
        # Calculate noise statistics
        std_noise = np.std(data)
        median_noise = np.median(np.abs(data - np.median(data)))
        
        # Analyze spatial noise patterns
        row_noise = np.std(np.mean(data, axis=1))
        col_noise = np.std(np.mean(data, axis=0))
        
        return {
            'overall_noise_std': float(std_noise),
            'median_absolute_deviation': float(median_noise),
            'row_noise_variation': float(row_noise),
            'column_noise_variation': float(col_noise),
            'spatial_noise_ratio': float(max(row_noise, col_noise) / min(row_noise, col_noise)) if min(row_noise, col_noise) > 0 else 0
        }
    
    @classmethod
    def _detect_hot_pixels(cls, data: np.ndarray, threshold_sigma: float = 5.0) -> Dict[str, Any]:
        """Detect hot pixels in the superdark"""
        median_val = np.median(data)
        std_val = np.std(data)
        
        # Find pixels above threshold
        hot_pixel_mask = data > (median_val + threshold_sigma * std_val)
        hot_pixel_count = np.sum(hot_pixel_mask)
        
        # Get hot pixel locations
        hot_pixel_coords = np.where(hot_pixel_mask)
        hot_pixel_values = data[hot_pixel_mask]
        
        return {
            'hot_pixel_count': int(hot_pixel_count),
            'hot_pixel_percentage': float(hot_pixel_count / data.size * 100),
            'threshold_sigma': threshold_sigma,
            'max_hot_pixel_value': float(np.max(hot_pixel_values)) if hot_pixel_count > 0 else 0,
            'avg_hot_pixel_value': float(np.mean(hot_pixel_values)) if hot_pixel_count > 0 else 0
        }
    
    @classmethod
    def _analyze_gradients(cls, data: np.ndarray) -> Dict[str, Any]:
        """Analyze gradients in the superdark"""
        # Calculate gradients
        grad_x = np.gradient(data, axis=1)
        grad_y = np.gradient(data, axis=0)
        
        # Calculate gradient magnitude
        grad_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        return {
            'mean_gradient_magnitude': float(np.mean(grad_magnitude)),
            'max_gradient_magnitude': float(np.max(grad_magnitude)),
            'gradient_std': float(np.std(grad_magnitude)),
            'horizontal_gradient_bias': float(np.mean(np.abs(grad_x))),
            'vertical_gradient_bias': float(np.mean(np.abs(grad_y)))
        }
    
    @classmethod
    def _assess_superdark_quality(cls, stats: Dict, noise_analysis: Dict, 
                                hot_pixels: Dict, gradient_analysis: Dict) -> Dict[str, Any]:
        """Assess overall superdark quality"""
        quality_score = 100.0
        issues = []
        
        # Check noise levels
        if noise_analysis['overall_noise_std'] > 10:
            quality_score -= 20
            issues.append('High noise levels detected')
        
        # Check hot pixel count
        if hot_pixels['hot_pixel_percentage'] > 1.0:
            quality_score -= 15
            issues.append('Excessive hot pixels detected')
        
        # Check gradients
        if gradient_analysis['mean_gradient_magnitude'] > 5.0:
            quality_score -= 10
            issues.append('Significant gradients detected')
        
        # Check spatial noise uniformity
        if noise_analysis['spatial_noise_ratio'] > 2.0:
            quality_score -= 10
            issues.append('Non-uniform spatial noise pattern')
        
        # Determine quality rating
        if quality_score >= 90:
            rating = 'excellent'
        elif quality_score >= 80:
            rating = 'good'
        elif quality_score >= 70:
            rating = 'fair'
        else:
            rating = 'poor'
        
        return {
            'quality_score': max(0, quality_score),
            'quality_rating': rating,
            'issues': issues,
            'usable': quality_score >= 70
        } 