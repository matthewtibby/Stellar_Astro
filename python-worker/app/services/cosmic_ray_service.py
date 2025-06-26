import logging
import asyncio
import os
import tempfile
import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from astropy.io import fits
import numpy as np

from models.requests import CosmicRayDetectionRequest
from supabase_io import download_file
from cosmic_ray_detection import detect_cosmic_rays_simple, CosmicRayDetector

logger = logging.getLogger(__name__)

class CosmicRayService:
    """Service for handling cosmic ray detection operations"""
    
    # In-memory storage for job tracking (would be database in production)
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def insert_job(cls, job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new cosmic ray job into storage"""
        cls._jobs[job_id] = {
            'status': status,
            'error': error,
            'result': result,
            'diagnostics': diagnostics,
            'warnings': warnings,
            'progress': progress or 0,
            'created_at': datetime.utcnow().isoformat(),
            'recommendations': None,
            'parameter_suggestions': None,
            'image_quality_metrics': None,
            'cleaned_images': None,
            'masks': None,
            'statistics': None
        }
        logger.info(f"Inserted cosmic ray job {job_id} with status {status}")
    
    @classmethod
    async def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get cosmic ray job data from storage"""
        return cls._jobs.get(job_id)
    
    @classmethod
    async def update_job_progress(cls, job_id: str, progress: int):
        """Update cosmic ray job progress"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['progress'] = progress
            logger.info(f"Updated cosmic ray job {job_id} progress to {progress}%")
    
    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel a running cosmic ray job"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['status'] = 'cancelled'
            logger.info(f"Cancelled cosmic ray job {job_id}")
            return True
        return False
    
    @classmethod
    async def run_cosmic_ray_job(cls, request: CosmicRayDetectionRequest, job_id: str, params: dict):
        """Run cosmic ray detection job"""
        try:
            await cls.insert_job(job_id, status="running", progress=0)
            
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
                await cls.insert_job(job_id, status="failed", error="No FITS files provided", progress=0)
                return
            
            logger.info(f"Processing {len(fits_paths)} files for cosmic ray detection")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = await cls._download_files(fits_paths, request.bucket, tmpdir, job_id)
                
                if not local_files:
                    await cls.insert_job(job_id, status="failed", error="No files downloaded", progress=0)
                    return
                
                await cls.update_job_progress(job_id, 30)
                
                # Detect cosmic rays
                results = []
                for i, local_file in enumerate(local_files):
                    if await cls._is_job_cancelled(job_id):
                        logger.info(f"Cosmic ray job {job_id} cancelled")
                        return
                    
                    progress = 30 + int((i / len(local_files)) * 60)
                    await cls.update_job_progress(job_id, progress)
                    
                    result = await cls._detect_cosmic_rays_single(local_file, params, tmpdir)
                    if result:
                        results.append(result)
                
                await cls.update_job_progress(job_id, 95)
                
                # Generate summary
                summary = cls._generate_cosmic_ray_summary(results)
                
                await cls.update_job_progress(job_id, 100)
                await cls.insert_job(
                    job_id, 
                    status="completed", 
                    result=summary,
                    cleaned_images=summary.get('cleaned_images', []),
                    masks=summary.get('masks', []),
                    statistics=summary.get('statistics', {})
                )
                
        except Exception as e:
            logger.error(f"Error in cosmic ray job {job_id}: {e}")
            tb = traceback.format_exc()
            await cls.insert_job(job_id, status="failed", error=str(e), progress=0)
    
    @classmethod
    async def run_enhanced_cosmic_ray_job(cls, request: CosmicRayDetectionRequest, job_id: str):
        """Run enhanced cosmic ray detection with multiple methods and analysis"""
        try:
            await cls.insert_job(job_id, status="running", progress=0)
            
            # Similar to run_cosmic_ray_job but with enhanced features
            # Auto-tuning, multiple methods, image quality analysis, etc.
            
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
                await cls.insert_job(job_id, status="failed", error="No FITS files provided", progress=0)
                return
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = await cls._download_files(fits_paths, request.bucket, tmpdir, job_id)
                
                if not local_files:
                    await cls.insert_job(job_id, status="failed", error="No files downloaded", progress=0)
                    return
                
                await cls.update_job_progress(job_id, 20)
                
                # Enhanced processing with multiple methods
                enhanced_results = []
                for i, local_file in enumerate(local_files):
                    if await cls._is_job_cancelled(job_id):
                        return
                    
                    progress = 20 + int((i / len(local_files)) * 70)
                    await cls.update_job_progress(job_id, progress)
                    
                    # Auto-tune parameters if enabled
                    params = await cls._auto_tune_parameters(local_file, request) if request.auto_tune else cls._get_default_params(request)
                    
                    # Run multiple methods if requested
                    if len(request.multi_methods) > 1:
                        result = await cls._run_multi_method_detection(local_file, request, params, tmpdir)
                    else:
                        result = await cls._detect_cosmic_rays_single(local_file, params, tmpdir)
                    
                    if result and request.analyze_image_quality:
                        result['image_quality'] = cls._analyze_image_quality(local_file)
                    
                    if result:
                        enhanced_results.append(result)
                
                await cls.update_job_progress(job_id, 95)
                
                # Generate enhanced summary with recommendations
                summary = cls._generate_enhanced_summary(enhanced_results, request)
                recommendations = cls._generate_recommendations(enhanced_results)
                
                await cls.update_job_progress(job_id, 100)
                await cls.insert_job(
                    job_id,
                    status="completed",
                    result=summary,
                    recommendations=recommendations,
                    parameter_suggestions=recommendations.get('parameter_suggestions', {}),
                    image_quality_metrics=summary.get('image_quality_metrics', {}),
                    cleaned_images=summary.get('cleaned_images', []),
                    masks=summary.get('masks', []),
                    statistics=summary.get('statistics', {})
                )
                
        except Exception as e:
            logger.error(f"Error in enhanced cosmic ray job {job_id}: {e}")
            await cls.insert_job(job_id, status="failed", error=str(e), progress=0)
    
    @classmethod
    async def _download_files(cls, paths: List[str], bucket: str, tmpdir: str, job_id: str) -> List[str]:
        """Download FITS files for processing"""
        local_files = []
        
        for i, path in enumerate(paths):
            if await cls._is_job_cancelled(job_id):
                return []
            
            local_path = os.path.join(tmpdir, f"cosmic_ray_input_{i}.fits")
            try:
                download_file(bucket, path, local_path)
                local_files.append(local_path)
            except Exception as e:
                logger.error(f"Failed to download {path}: {e}")
                continue
        
        return local_files
    
    @classmethod
    async def _detect_cosmic_rays_single(cls, local_file: str, params: dict, tmpdir: str) -> Optional[Dict]:
        """Detect cosmic rays in a single file"""
        try:
            method = params.get('method', 'simple')
            
            if method == 'simple':
                return cls._run_simple_detection(local_file, params, tmpdir)
            elif method == 'lacosmic':
                return cls._run_lacosmic_detection(local_file, params, tmpdir)
            else:
                logger.warning(f"Unknown cosmic ray detection method: {method}")
                return None
                
        except Exception as e:
            logger.error(f"Error detecting cosmic rays in {local_file}: {e}")
            return None
    
    @classmethod
    def _run_simple_detection(cls, local_file: str, params: dict, tmpdir: str) -> Dict:
        """Run simple cosmic ray detection"""
        try:
            # Use existing cosmic ray detection function
            result = detect_cosmic_rays_simple(
                local_file,
                sigma_thresh=params.get('sigma_thresh', 5.0),
                box_size=params.get('box_size', 11),
                filter_size=params.get('filter_size', 3)
            )
            
            return {
                'file': os.path.basename(local_file),
                'method': 'simple',
                'cosmic_rays_detected': result.get('cosmic_rays_detected', 0),
                'cleaned_image_path': result.get('cleaned_image_path'),
                'mask_path': result.get('mask_path'),
                'statistics': result.get('statistics', {}),
                'parameters_used': params
            }
            
        except Exception as e:
            logger.error(f"Simple detection failed for {local_file}: {e}")
            return {
                'file': os.path.basename(local_file),
                'method': 'simple',
                'error': str(e)
            }
    
    @classmethod
    def _run_lacosmic_detection(cls, local_file: str, params: dict, tmpdir: str) -> Dict:
        """Run L.A.Cosmic detection using CosmicRayDetector"""
        try:
            # Use CosmicRayDetector class if available
            detector = CosmicRayDetector()
            result = detector.detect_and_clean(
                local_file,
                sigma_clip=params.get('sigma_clip', 4.5),
                sigma_frac=params.get('sigma_frac', 0.3),
                objlim=params.get('objlim', 5.0),
                gain=params.get('gain', 1.0),
                readnoise=params.get('readnoise', 6.5),
                satlevel=params.get('satlevel', 65535.0),
                niter=params.get('niter', 4)
            )
            
            return {
                'file': os.path.basename(local_file),
                'method': 'lacosmic',
                'cosmic_rays_detected': result.get('cosmic_rays_detected', 0),
                'cleaned_image_path': result.get('cleaned_image_path'),
                'mask_path': result.get('mask_path'),
                'statistics': result.get('statistics', {}),
                'parameters_used': params
            }
            
        except Exception as e:
            logger.error(f"L.A.Cosmic detection failed for {local_file}: {e}")
            return {
                'file': os.path.basename(local_file),
                'method': 'lacosmic',
                'error': str(e)
            }
    
    @classmethod
    async def _run_multi_method_detection(cls, local_file: str, request: CosmicRayDetectionRequest, 
                                        params: dict, tmpdir: str) -> Dict:
        """Run multiple detection methods and combine results"""
        results = {}
        
        for method in request.multi_methods:
            method_params = params.copy()
            method_params['method'] = method
            
            result = await cls._detect_cosmic_rays_single(local_file, method_params, tmpdir)
            if result:
                results[method] = result
        
        # Combine results based on combine_method
        combined = cls._combine_detection_results(results, request.combine_method)
        
        return {
            'file': os.path.basename(local_file),
            'method': 'multi_method',
            'individual_results': results,
            'combined_result': combined,
            'combine_method': request.combine_method
        }
    
    @classmethod
    def _combine_detection_results(cls, results: Dict, combine_method: str) -> Dict:
        """Combine results from multiple detection methods"""
        if combine_method == 'intersection':
            # Keep only cosmic rays detected by ALL methods
            return {'method': 'intersection', 'description': 'Conservative - only cosmic rays detected by all methods'}
        elif combine_method == 'union':
            # Keep cosmic rays detected by ANY method
            return {'method': 'union', 'description': 'Aggressive - cosmic rays detected by any method'}
        elif combine_method == 'voting':
            # Keep cosmic rays detected by majority of methods
            return {'method': 'voting', 'description': 'Majority voting - cosmic rays detected by most methods'}
        else:
            return {'method': 'unknown', 'error': f'Unknown combine method: {combine_method}'}
    
    @classmethod
    async def _auto_tune_parameters(cls, local_file: str, request: CosmicRayDetectionRequest) -> dict:
        """Auto-tune parameters based on image characteristics"""
        try:
            with fits.open(local_file) as hdul:
                data = hdul[0].data
                header = hdul[0].header
                
                # Basic auto-tuning based on image statistics
                std_dev = float(data.std())
                median = float(np.median(data))
                
                # Adjust sigma_thresh based on image noise
                sigma_thresh = 5.0
                if std_dev > 50:
                    sigma_thresh = 6.0  # Higher threshold for noisy images
                elif std_dev < 10:
                    sigma_thresh = 4.0  # Lower threshold for clean images
                
                # Adjust gain from header if available
                gain = header.get('GAIN', request.gain)
                readnoise = header.get('RDNOISE', request.readnoise)
                
                return {
                    'sigma_thresh': sigma_thresh,
                    'box_size': request.box_size if hasattr(request, 'box_size') else 11,
                    'filter_size': request.filter_size if hasattr(request, 'filter_size') else 3,
                    'gain': gain,
                    'readnoise': readnoise,
                    'method': request.method,
                }
        except Exception as e:
            logger.warning(f"Auto-tuning failed for {local_file}: {e}")
            return cls._get_default_params(request)
    
    @classmethod
    def _get_default_params(cls, request: CosmicRayDetectionRequest) -> dict:
        """Get default parameters from request"""
        return {
            'sigma_thresh': request.sigma_thresh if hasattr(request, 'sigma_thresh') else 5.0,
            'box_size': request.box_size if hasattr(request, 'box_size') else 11,
            'filter_size': request.filter_size if hasattr(request, 'filter_size') else 3,
            'gain': request.gain if hasattr(request, 'gain') else 1.0,
            'readnoise': request.readnoise if hasattr(request, 'readnoise') else 6.5,
            'method': request.method if hasattr(request, 'method') else 'simple',
        }
    
    @classmethod
    def _analyze_image_quality(cls, local_file: str) -> Dict:
        """Analyze image quality metrics"""
        try:
            with fits.open(local_file) as hdul:
                data = hdul[0].data
                
                return {
                    'std_dev': float(data.std()),
                    'median': float(np.median(data)),
                    'mean': float(data.mean()),
                    'min_value': float(data.min()),
                    'max_value': float(data.max()),
                    'dynamic_range': float(data.max() - data.min())
                }
        except Exception as e:
            logger.error(f"Image quality analysis failed for {local_file}: {e}")
            return {'error': str(e)}
    
    @classmethod
    def _generate_cosmic_ray_summary(cls, results: List[Dict]) -> Dict:
        """Generate summary of cosmic ray detection results"""
        total_cosmic_rays = sum(r.get('cosmic_rays_detected', 0) for r in results)
        successful_files = len([r for r in results if 'error' not in r])
        failed_files = len([r for r in results if 'error' in r])
        
        return {
            'total_files': len(results),
            'successful_files': successful_files,
            'failed_files': failed_files,
            'total_cosmic_rays_detected': total_cosmic_rays,
            'average_cosmic_rays_per_file': total_cosmic_rays / max(successful_files, 1),
            'results': results,
            'cleaned_images': [r.get('cleaned_image_path') for r in results if r.get('cleaned_image_path')],
            'masks': [r.get('mask_path') for r in results if r.get('mask_path')],
            'statistics': {
                'detection_rate': successful_files / len(results) if results else 0,
                'total_cosmic_rays': total_cosmic_rays
            }
        }
    
    @classmethod
    def _generate_enhanced_summary(cls, results: List[Dict], request: CosmicRayDetectionRequest) -> Dict:
        """Generate enhanced summary with quality metrics"""
        base_summary = cls._generate_cosmic_ray_summary(results)
        
        # Add enhanced metrics
        if hasattr(request, 'analyze_image_quality') and request.analyze_image_quality:
            quality_metrics = [r.get('image_quality', {}) for r in results if r.get('image_quality')]
            if quality_metrics:
                base_summary['image_quality_metrics'] = {
                    'average_std_dev': sum(q.get('std_dev', 0) for q in quality_metrics) / len(quality_metrics),
                    'average_dynamic_range': sum(q.get('dynamic_range', 0) for q in quality_metrics) / len(quality_metrics)
                }
        
        return base_summary
    
    @classmethod
    def _generate_recommendations(cls, results: List[Dict]) -> Dict:
        """Generate parameter recommendations based on results"""
        if not results:
            return {'parameter_suggestions': {}, 'general_recommendations': []}
        
        successful_results = [r for r in results if 'error' not in r]
        
        recommendations = {
            'parameter_suggestions': {
                'sigma_thresh': 'Consider adjusting sigma threshold based on noise levels',
                'method': 'Try different detection methods for comparison'
            },
            'general_recommendations': [
                'Review detection results for over/under-detection',
                'Consider manual inspection of flagged cosmic rays',
                'Use cleaned images for further processing'
            ]
        }
        
        # Add specific recommendations based on detection rates
        avg_detections = sum(r.get('cosmic_rays_detected', 0) for r in successful_results) / max(len(successful_results), 1)
        
        if avg_detections > 1000:
            recommendations['general_recommendations'].append('High cosmic ray count detected - check detection threshold')
        elif avg_detections < 10:
            recommendations['general_recommendations'].append('Low cosmic ray count - consider lowering detection threshold')
        
        return recommendations
    
    @classmethod
    async def _is_job_cancelled(cls, job_id: str) -> bool:
        """Check if job has been cancelled"""
        job_data = await cls.get_job(job_id)
        return job_data and job_data.get('status') == 'cancelled' 