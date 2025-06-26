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
from supabase_io import download_file, list_files
from main import save_fits_metadata, get_fits_metadata
from outlier_rejection import detect_outlier_frames
from frame_consistency import analyze_frame_consistency
from trail_detection import detect_trails

logger = logging.getLogger(__name__)

class FileService:
    """Service for handling file operations, validation, and frame analysis"""
    
    # In-memory storage for job tracking (would be database in production)
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def insert_job(cls, job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new file processing job into storage"""
        cls._jobs[job_id] = {
            'status': status,
            'error': error,
            'result': result,
            'diagnostics': diagnostics,
            'warnings': warnings,
            'progress': progress or 0,
            'created_at': datetime.utcnow().isoformat()
        }
        logger.info(f"Inserted file processing job {job_id} with status {status}")
    
    @classmethod
    async def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get file processing job data from storage"""
        return cls._jobs.get(job_id)
    
    @classmethod
    async def update_job_progress(cls, job_id: str, progress: int):
        """Update file processing job progress"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['progress'] = progress
            logger.info(f"Updated file processing job {job_id} progress to {progress}%")
    
    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel a running file processing job"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['status'] = 'cancelled'
            logger.info(f"Cancelled file processing job {job_id}")
            return True
        return False
    
    @classmethod
    async def list_project_files(cls, project_id: str, user_id: str) -> Dict[str, Any]:
        """List files for a project"""
        try:
            bucket = "fits-files"
            prefix = f"{user_id}/{project_id}/"
            
            files = list_files(bucket, prefix)
            
            # Organize files by type
            organized_files = {
                'bias': [],
                'dark': [],
                'flat': [],
                'light': [],
                'master': [],
                'other': []
            }
            
            for file_info in files:
                file_path = file_info['name']
                file_name = os.path.basename(file_path)
                
                # Determine file type based on path or name
                if 'bias' in file_path.lower():
                    organized_files['bias'].append(file_info)
                elif 'dark' in file_path.lower():
                    organized_files['dark'].append(file_info)
                elif 'flat' in file_path.lower():
                    organized_files['flat'].append(file_info)
                elif 'light' in file_path.lower():
                    organized_files['light'].append(file_info)
                elif 'master' in file_path.lower():
                    organized_files['master'].append(file_info)
                else:
                    organized_files['other'].append(file_info)
            
            return {
                'success': True,
                'total_files': len(files),
                'organized_files': organized_files,
                'project_id': project_id,
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"Error listing files for project {project_id}: {e}")
            return {
                'success': False,
                'error': str(e),
                'project_id': project_id,
                'user_id': user_id
            }
    
    @classmethod
    async def detect_outliers(cls, request: OutlierDetectRequest) -> Dict[str, Any]:
        """Detect outlier frames in a set of FITS files"""
        try:
            # Build file paths
            fits_paths = []
            if request.fits_paths:
                for path in request.fits_paths:
                    if not path.startswith('fits-files/'):
                        full_path = f"fits-files/{request.user_id}/{request.project_id}/{path}"
                    else:
                        full_path = path
                    fits_paths.append(full_path)
            
            if not fits_paths:
                return {'success': False, 'error': 'No FITS files provided'}
            
            logger.info(f"Detecting outliers in {len(fits_paths)} files")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = []
                for i, path in enumerate(fits_paths):
                    local_path = os.path.join(tmpdir, f"outlier_input_{i}.fits")
                    try:
                        download_file(request.bucket, path, local_path)
                        local_files.append(local_path)
                    except Exception as e:
                        logger.error(f"Failed to download {path}: {e}")
                        continue
                
                if not local_files:
                    return {'success': False, 'error': 'No files downloaded successfully'}
                
                # Perform outlier detection
                outlier_result = detect_outlier_frames(
                    local_files,
                    sigma_thresh=request.sigma_thresh,
                    frame_type=request.frame_type
                )
                
                return {
                    'success': True,
                    'total_files': len(local_files),
                    'outliers': outlier_result.get('outliers', []),
                    'statistics': outlier_result.get('statistics', {}),
                    'sigma_threshold': request.sigma_thresh,
                    'frame_type': request.frame_type,
                    'recommendations': outlier_result.get('recommendations', [])
                }
                
        except Exception as e:
            logger.error(f"Error in outlier detection: {e}")
            return {'success': False, 'error': str(e)}
    
    @classmethod
    async def analyze_frame_consistency(cls, request: FrameConsistencyRequest) -> Dict[str, Any]:
        """Analyze frame consistency for a set of FITS files"""
        try:
            # Build file paths
            fits_paths = []
            if request.fits_paths:
                for path in request.fits_paths:
                    if not path.startswith('fits-files/'):
                        full_path = f"fits-files/{request.user_id}/{request.project_id}/{path}"
                    else:
                        full_path = path
                    fits_paths.append(full_path)
            
            if not fits_paths:
                return {'success': False, 'error': 'No FITS files provided'}
            
            logger.info(f"Analyzing frame consistency for {len(fits_paths)} files")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = []
                for i, path in enumerate(fits_paths):
                    local_path = os.path.join(tmpdir, f"consistency_input_{i}.fits")
                    try:
                        download_file(request.bucket, path, local_path)
                        local_files.append(local_path)
                    except Exception as e:
                        logger.error(f"Failed to download {path}: {e}")
                        continue
                
                if not local_files:
                    return {'success': False, 'error': 'No files downloaded successfully'}
                
                # Perform consistency analysis
                consistency_result = analyze_frame_consistency(
                    local_files,
                    consistency_threshold=request.consistency_threshold,
                    sigma_threshold=request.sigma_threshold,
                    min_frames=request.min_frames,
                    max_frames=request.max_frames,
                    frame_type=request.frame_type
                )
                
                return {
                    'success': True,
                    'total_files': len(local_files),
                    'consistency_analysis': consistency_result.get('analysis', {}),
                    'recommended_frames': consistency_result.get('recommended_frames', []),
                    'excluded_frames': consistency_result.get('excluded_frames', []),
                    'statistics': consistency_result.get('statistics', {}),
                    'parameters': {
                        'consistency_threshold': request.consistency_threshold,
                        'sigma_threshold': request.sigma_threshold,
                        'min_frames': request.min_frames,
                        'max_frames': request.max_frames
                    },
                    'frame_type': request.frame_type
                }
                
        except Exception as e:
            logger.error(f"Error in frame consistency analysis: {e}")
            return {'success': False, 'error': str(e)}
    
    @classmethod
    async def detect_trails(cls, request: TrailDetectRequest, uploaded_file: Optional[bytes] = None) -> Dict[str, Any]:
        """Detect trails in FITS files"""
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                local_file = None
                
                if uploaded_file:
                    # Use uploaded file
                    local_file = os.path.join(tmpdir, 'uploaded_trail_input.fits')
                    with open(local_file, 'wb') as f:
                        f.write(uploaded_file)
                elif request.fits_path:
                    # Download from storage
                    local_file = os.path.join(tmpdir, 'trail_input.fits')
                    download_file('fits-files', request.fits_path, local_file)
                else:
                    return {'success': False, 'error': 'No FITS file provided'}
                
                # Perform trail detection
                trail_result = detect_trails(
                    local_file,
                    sensitivity=request.sensitivity,
                    min_length=request.min_length,
                    mask_output=request.mask_output,
                    preview_output=request.preview_output,
                    output_dir=request.output_dir
                )
                
                return {
                    'success': True,
                    'trails_detected': trail_result.get('trails_detected', 0),
                    'trail_statistics': trail_result.get('statistics', {}),
                    'mask_path': trail_result.get('mask_path'),
                    'preview_path': trail_result.get('preview_path'),
                    'parameters': {
                        'sensitivity': request.sensitivity,
                        'min_length': request.min_length,
                        'mask_output': request.mask_output,
                        'preview_output': request.preview_output
                    }
                }
                
        except Exception as e:
            logger.error(f"Error in trail detection: {e}")
            return {'success': False, 'error': str(e)}
    
    @classmethod
    async def validate_fits_file(cls, file_content: bytes, expected_type: Optional[str], 
                                project_id: str, user_id: str) -> Dict[str, Any]:
        """Validate a FITS file and extract metadata"""
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                temp_file = os.path.join(tmpdir, 'validate_input.fits')
                
                # Write file content to temporary file
                with open(temp_file, 'wb') as f:
                    f.write(file_content)
                
                # Validate and extract metadata
                with fits.open(temp_file) as hdul:
                    header = hdul[0].header
                    data = hdul[0].data
                    
                    # Extract metadata
                    metadata = cls._extract_fits_metadata(header)
                    
                    # Validate frame type
                    detected_type = cls._detect_frame_type(header, data)
                    type_match = expected_type is None or detected_type == expected_type
                    
                    # Perform quality checks
                    quality_issues = cls._check_fits_quality(header, data)
                    
                    return {
                        'success': True,
                        'valid': len(quality_issues) == 0,
                        'detected_type': detected_type,
                        'expected_type': expected_type,
                        'type_match': type_match,
                        'metadata': metadata,
                        'quality_issues': quality_issues,
                        'file_size_mb': len(file_content) / (1024 * 1024),
                        'dimensions': list(data.shape) if data is not None else None,
                        'data_type': str(data.dtype) if data is not None else None
                    }
                    
        except Exception as e:
            logger.error(f"Error validating FITS file: {e}")
            return {
                'success': False,
                'valid': False,
                'error': str(e)
            }
    
    @classmethod
    def _extract_fits_metadata(cls, header: fits.Header) -> Dict[str, Any]:
        """Extract metadata from FITS header"""
        metadata = {}
        
        # Standard FITS keywords
        common_keywords = [
            'BITPIX', 'NAXIS', 'NAXIS1', 'NAXIS2',
            'INSTRUME', 'TELESCOP', 'OBSERVER', 'OBJECT',
            'DATE-OBS', 'TIME-OBS', 'EXPTIME', 'FILTER',
            'XBINNING', 'YBINNING', 'GAIN', 'OFFSET',
            'CCD-TEMP', 'SET-TEMP', 'READOUTM', 'IMAGETYP'
        ]
        
        for keyword in common_keywords:
            if keyword in header:
                metadata[keyword] = header[keyword]
        
        # Calculate additional derived metadata
        if 'NAXIS1' in header and 'NAXIS2' in header:
            metadata['total_pixels'] = header['NAXIS1'] * header['NAXIS2']
        
        if 'XBINNING' in header and 'YBINNING' in header:
            metadata['binning'] = f"{header['XBINNING']}x{header['YBINNING']}"
        
        return metadata
    
    @classmethod
    def _detect_frame_type(cls, header: fits.Header, data: np.ndarray) -> str:
        """Detect the type of calibration frame"""
        # Check IMAGETYP first
        if 'IMAGETYP' in header:
            image_type = header['IMAGETYP'].lower()
            if 'bias' in image_type:
                return 'bias'
            elif 'dark' in image_type:
                return 'dark'
            elif 'flat' in image_type:
                return 'flat'
            elif 'light' in image_type or 'science' in image_type:
                return 'light'
        
        # Fallback to exposure time analysis
        if 'EXPTIME' in header:
            exp_time = header['EXPTIME']
            if exp_time == 0:
                return 'bias'
            elif exp_time > 0 and exp_time < 10 and data is not None:
                # Short exposure, check if it's dark by looking at mean
                mean_value = np.mean(data)
                if mean_value < 1000:  # Arbitrary threshold
                    return 'dark'
        
        return 'unknown'
    
    @classmethod
    def _check_fits_quality(cls, header: fits.Header, data: np.ndarray) -> List[Dict[str, str]]:
        """Check FITS file quality and return list of issues"""
        issues = []
        
        # Check for required keywords
        required_keywords = ['NAXIS1', 'NAXIS2', 'BITPIX']
        for keyword in required_keywords:
            if keyword not in header:
                issues.append({
                    'type': 'missing_keyword',
                    'severity': 'high',
                    'description': f'Required keyword {keyword} is missing'
                })
        
        # Check data integrity
        if data is not None:
            # Check for NaN or infinite values
            if np.any(np.isnan(data)):
                issues.append({
                    'type': 'data_integrity',
                    'severity': 'high',
                    'description': 'Data contains NaN values'
                })
            
            if np.any(np.isinf(data)):
                issues.append({
                    'type': 'data_integrity',
                    'severity': 'high',
                    'description': 'Data contains infinite values'
                })
            
            # Check for suspicious statistics
            std_dev = np.std(data)
            if std_dev == 0:
                issues.append({
                    'type': 'data_quality',
                    'severity': 'medium',
                    'description': 'Data has zero standard deviation (possibly all same value)'
                })
            
            # Check for saturation
            max_value = np.max(data)
            if header.get('BITPIX') == 16 and max_value >= 65535:
                issues.append({
                    'type': 'saturation',
                    'severity': 'medium',
                    'description': 'Data appears to be saturated (max value at 16-bit limit)'
                })
        else:
            issues.append({
                'type': 'data_integrity',
                'severity': 'high',
                'description': 'No image data found in FITS file'
            })
        
        return issues
    
    @classmethod
    async def save_file_metadata(cls, file_path: str, project_id: str, user_id: str, 
                               metadata: Dict[str, Any]) -> bool:
        """Save FITS file metadata to storage"""
        try:
            await save_fits_metadata(file_path, project_id, user_id, metadata)
            return True
        except Exception as e:
            logger.error(f"Error saving metadata for {file_path}: {e}")
            return False
    
    @classmethod
    async def get_file_metadata(cls, file_path: str) -> Optional[Dict[str, Any]]:
        """Get FITS file metadata from storage"""
        try:
            return await get_fits_metadata(file_path)
        except Exception as e:
            logger.error(f"Error getting file metadata for {file_path}: {e}")
            return None

    @classmethod
    async def generate_fits_preview(cls, signed_url: str) -> Dict[str, Any]:
        """Generate preview for FITS file from signed URL"""
        try:
            import requests
            import tempfile
            
            # Download file from signed URL
            response = requests.get(signed_url)
            response.raise_for_status()
            
            with tempfile.NamedTemporaryFile(suffix='.fits', delete=False) as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            try:
                with fits.open(temp_file_path) as hdul:
                    header = hdul[0].header
                    data = hdul[0].data
                    
                    # Extract metadata
                    metadata = cls._extract_fits_metadata(header)
                    
                    # Generate basic statistics
                    if data is not None:
                        statistics = {
                            'mean': float(np.mean(data)),
                            'median': float(np.median(data)),
                            'std': float(np.std(data)),
                            'min': float(np.min(data)),
                            'max': float(np.max(data)),
                            'shape': list(data.shape)
                        }
                    else:
                        statistics = {}
                    
                    # TODO: Generate actual preview image and upload to storage
                    preview_url = None
                    
                    return {
                        'preview_url': preview_url,
                        'metadata': metadata,
                        'statistics': statistics
                    }
                    
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Error generating FITS preview: {e}")
            return {
                'preview_url': None,
                'metadata': {},
                'statistics': {},
                'error': str(e)
            }
    
    @classmethod
    async def analyze_temp_file(cls, temp_path: str) -> Dict[str, Any]:
        """Analyze a temporary FITS file"""
        try:
            if not os.path.exists(temp_path):
                return {
                    'analysis': {},
                    'metadata': {},
                    'frame_type': 'unknown',
                    'quality_score': 0,
                    'error': 'File not found'
                }
            
            with fits.open(temp_path) as hdul:
                header = hdul[0].header
                data = hdul[0].data
                
                # Extract metadata
                metadata = cls._extract_fits_metadata(header)
                
                # Detect frame type
                frame_type = cls._detect_frame_type(header, data)
                
                # Perform quality checks
                quality_issues = cls._check_fits_quality(header, data)
                
                # Generate basic analysis
                if data is not None:
                    analysis = {
                        'mean': float(np.mean(data)),
                        'median': float(np.median(data)),
                        'std': float(np.std(data)),
                        'min': float(np.min(data)),
                        'max': float(np.max(data)),
                        'shape': list(data.shape),
                        'data_type': str(data.dtype)
                    }
                    
                    # Calculate basic quality score (0-10)
                    quality_score = 10.0 - min(10.0, len(quality_issues) * 2.0)
                else:
                    analysis = {}
                    quality_score = 0.0
                
                return {
                    'analysis': analysis,
                    'metadata': metadata,
                    'frame_type': frame_type,
                    'quality_score': quality_score,
                    'quality_issues': quality_issues
                }
                
        except Exception as e:
            logger.error(f"Error analyzing temp file {temp_path}: {e}")
            return {
                'analysis': {},
                'metadata': {},
                'frame_type': 'unknown',
                'quality_score': 0,
                'error': str(e)
            } 