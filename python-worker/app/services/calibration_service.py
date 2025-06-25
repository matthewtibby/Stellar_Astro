import logging
import asyncio
import os
import tempfile
import traceback
import numpy as np
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Optional, List
from astropy.io import fits

from ..models.requests import CalibrationJobRequest
from ..supabase_io import download_file, list_files
from ..fits_analysis import analyze_fits_headers, infer_frame_type
from ..calibration_worker import stack_frames

logger = logging.getLogger(__name__)

class CalibrationService:
    """Service for handling calibration job operations"""
    
    # In-memory storage for job tracking (would be database in production)
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def insert_job(cls, job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new job into storage"""
        cls._jobs[job_id] = {
            'status': status,
            'error': error,
            'result': result,
            'diagnostics': diagnostics,
            'warnings': warnings,
            'progress': progress or 0,
            'created_at': datetime.utcnow().isoformat()
        }
        logger.info(f"Inserted calibration job {job_id} with status {status}")
    
    @classmethod
    async def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job data from storage"""
        return cls._jobs.get(job_id)
    
    @classmethod
    async def update_job_progress(cls, job_id: str, progress: int):
        """Update job progress"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['progress'] = progress
            logger.info(f"Updated calibration job {job_id} progress to {progress}%")
    
    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel a running job"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['status'] = 'cancelled'
            logger.info(f"Cancelled calibration job {job_id}")
            return True
        return False
    
    @classmethod
    async def run_calibration_job(cls, job: CalibrationJobRequest, job_id: str):
        """Run calibration job with comprehensive processing logic"""
        try:
            await cls.insert_job(job_id, status="running", progress=0)
            
            # Filter FITS files
            fits_input_paths = [p for p in job.input_paths if p.lower().endswith((".fit", ".fits"))]
            fits_input_paths = fits_input_paths[:10]  # Limit for performance
            
            logger.info(f"FITS files to process: {fits_input_paths}")
            timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
            output_base_with_ts = f"{job.output_base}_{timestamp}"
            
            with tempfile.TemporaryDirectory() as tmpdir:
                logger.info(f"Created tempdir: {tmpdir}")
                
                # Download files in parallel
                local_files = await cls._download_files_parallel(
                    job.input_bucket, fits_input_paths, tmpdir, job_id
                )
                
                if not local_files:
                    await cls.insert_job(job_id, status="failed", error="No files downloaded", progress=0)
                    return
                
                # Handle light files if provided
                local_light_files = []
                if hasattr(job, 'light_input_paths') and job.light_input_paths:
                    local_light_files = await cls._download_light_files(
                        job, tmpdir, job_id
                    )
                
                await cls.update_job_progress(job_id, 30)
                
                # Check for cancellation
                if await cls._is_job_cancelled(job_id):
                    return
                
                # Handle bias subtraction
                local_files = await cls._handle_bias_subtraction(
                    job, local_files, tmpdir, job_id
                )
                
                if not local_files:
                    return  # Error already handled
                
                # Handle temperature/exposure matching for dark frames
                local_files = await cls._handle_frame_matching(
                    job, local_files, local_light_files, job_id
                )
                
                # Validate frames
                valid_files, rejected_files = await cls._validate_frames(
                    local_files, job_id
                )
                
                if not valid_files:
                    await cls.insert_job(
                        job_id, 
                        status="failed", 
                        error="No valid frames for stacking", 
                        progress=100,
                        result={
                            'used': 0,
                            'rejected': len(rejected_files),
                            'rejected_details': rejected_files
                        }
                    )
                    return
                
                # Prepare bad pixel map
                bad_pixel_map = await cls._prepare_bad_pixel_map(job, tmpdir)
                
                await cls.update_job_progress(job_id, 70)
                
                # Stack frames
                result = await cls._stack_frames(
                    valid_files, job, output_base_with_ts, bad_pixel_map, tmpdir, job_id
                )
                
                await cls.update_job_progress(job_id, 100)
                await cls.insert_job(job_id, status="completed", result=result)
                
        except Exception as e:
            logger.error(f"Error in calibration job {job_id}: {e}")
            tb = traceback.format_exc()
            await cls.insert_job(job_id, status="failed", error=str(e), progress=0)
    
    @classmethod
    async def _download_files_parallel(cls, bucket: str, paths: List[str], tmpdir: str, job_id: str) -> List[str]:
        """Download files in parallel for better performance"""
        from time import time as _time
        
        download_start = _time()
        
        def download_one(args):
            bucket, spath, local_path = args
            try:
                download_file(bucket, spath, local_path)
                return local_path
            except Exception as e:
                logger.error(f"Failed to download {spath}: {e}")
                return None
        
        download_args = [
            (bucket, spath, os.path.join(tmpdir, f"input_{i}.fits")) 
            for i, spath in enumerate(paths)
        ]
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            local_files = list(executor.map(download_one, download_args))
        
        local_files = [f for f in local_files if f is not None]
        logger.info(f"Downloaded {len(local_files)} files in {(_time() - download_start):.2f} seconds")
        
        return local_files
    
    @classmethod
    async def _download_light_files(cls, job: CalibrationJobRequest, tmpdir: str, job_id: str) -> List[str]:
        """Download light files for matching purposes"""
        local_light_files = []
        light_input_paths = job.light_input_paths[:10]  # Limit for performance
        
        for i, spath in enumerate(light_input_paths):
            if await cls._is_job_cancelled(job_id):
                logger.info(f"Job {job_id} cancelled during light file download")
                return []
            
            if not spath.lower().endswith((".fit", ".fits")):
                continue
                
            local_path = os.path.join(tmpdir, f"light_{i}.fits")
            try:
                download_file(job.input_bucket, spath, local_path)
                local_light_files.append(local_path)
            except Exception as e:
                logger.error(f"Failed to download light {spath}: {e}")
                continue
        
        return local_light_files
    
    @classmethod
    async def _handle_bias_subtraction(cls, job: CalibrationJobRequest, local_files: List[str], 
                                     tmpdir: str, job_id: str) -> List[str]:
        """Handle bias subtraction if enabled"""
        frame_type = infer_frame_type(local_files)
        
        # Use job frame_type if detection fails
        if frame_type == 'unknown' and hasattr(job, 'frame_type') and job.frame_type:
            frame_type = job.frame_type
        
        bias_subtraction = job.settings.get('biasSubtraction', False)
        
        if frame_type != 'dark' or not bias_subtraction:
            return local_files
        
        logger.info("Bias subtraction enabled")
        
        # Get master bias
        master_bias_local = await cls._get_master_bias(job, tmpdir, job_id)
        if not master_bias_local:
            return []  # Error already handled
        
        # Load bias data
        with fits.open(master_bias_local) as hdul:
            bias_data = hdul[0].data.astype(np.float32)
        
        # Apply bias subtraction
        bias_corrected_files = []
        for i, dark_path in enumerate(local_files):
            if await cls._is_job_cancelled(job_id):
                logger.info(f"Job {job_id} cancelled during bias subtraction")
                return []
            
            with fits.open(dark_path) as hdul:
                dark_data = hdul[0].data.astype(np.float32)
                
                if dark_data.shape != bias_data.shape:
                    error = f"Master bias and dark frame shape mismatch: {dark_data.shape} vs {bias_data.shape}"
                    await cls.insert_job(job_id, status="failed", error=error, progress=0)
                    return []
                
                corrected = dark_data - bias_data
                corrected_path = os.path.join(tmpdir, f"bias_corrected_{i}.fits")
                fits.PrimaryHDU(corrected, header=hdul[0].header).writeto(corrected_path, overwrite=True)
                bias_corrected_files.append(corrected_path)
        
        return bias_corrected_files
    
    @classmethod
    async def _get_master_bias(cls, job: CalibrationJobRequest, tmpdir: str, job_id: str) -> Optional[str]:
        """Get master bias file either from manual selection or auto-selection"""
        master_bias_path = job.settings.get('masterBiasPath')
        master_bias_local = os.path.join(tmpdir, 'master_bias.fits')
        
        if master_bias_path:
            logger.info(f"Using manually selected master bias: {master_bias_path}")
            try:
                download_file(job.input_bucket, master_bias_path, master_bias_local)
                return master_bias_local
            except Exception as e:
                error = f"Master bias download failed: {e}"
                await cls.insert_job(job_id, status="failed", error=error, progress=0)
                return None
        
        # Auto-select master bias
        logger.info(f"Auto-selecting master bias for project {job.project_id}")
        bias_prefix = f"{job.user_id}/{job.project_id}/master-bias/"
        
        try:
            bias_files = list_files(job.input_bucket, bias_prefix)
            bias_fits = [f for f in bias_files if f['name'].lower().endswith(('.fit', '.fits'))]
            
            if not bias_fits:
                error = f"No master bias found for project {job.project_id}"
                await cls.insert_job(job_id, status="failed", error=error, progress=0)
                return None
            
            # Select most recent bias
            selected_bias = sorted(bias_fits, key=lambda f: f['name'], reverse=True)[0]
            auto_bias_path = bias_prefix + selected_bias['name']
            
            logger.info(f"Auto-selected master bias: {auto_bias_path}")
            download_file(job.input_bucket, auto_bias_path, master_bias_local)
            return master_bias_local
            
        except Exception as e:
            error = f"Master bias auto-selection failed: {e}"
            await cls.insert_job(job_id, status="failed", error=error, progress=0)
            return None
    
    @classmethod
    async def _handle_frame_matching(cls, job: CalibrationJobRequest, local_files: List[str], 
                                   local_light_files: List[str], job_id: str) -> List[str]:
        """Handle temperature and exposure matching for dark frames"""
        frame_type = infer_frame_type(local_files)
        
        if frame_type != 'dark':
            return local_files
        
        temp_matching = job.settings.get('tempMatching', False)
        exposure_matching = job.settings.get('exposureMatching', False)
        
        if not (temp_matching or exposure_matching) or not local_light_files:
            return local_files
        
        # Get reference values from first light frame
        with fits.open(local_light_files[0]) as hdul:
            light_header = hdul[0].header
            ref_temp = light_header.get('CCD-TEMP')
            ref_exptime = light_header.get('EXPTIME')
        
        filtered_files = []
        for f in local_files:
            try:
                with fits.open(f) as hdul:
                    header = hdul[0].header
                    temp_ok = True
                    exptime_ok = True
                    
                    if temp_matching and ref_temp is not None and header.get('CCD-TEMP') is not None:
                        temp_ok = abs(header.get('CCD-TEMP') - ref_temp) <= 1.0
                    
                    if exposure_matching and ref_exptime is not None and header.get('EXPTIME') is not None:
                        exptime_ok = abs(header.get('EXPTIME') - ref_exptime) <= 0.1
                    
                    if temp_ok and exptime_ok:
                        filtered_files.append(f)
            except Exception as e:
                logger.warning(f"Failed to read FITS for temp/exptime matching: {f}: {e}")
        
        if filtered_files:
            logger.info(f"Using {len(filtered_files)} darks after temp/exptime matching (of {len(local_files)})")
            return filtered_files
        else:
            logger.warning(f"No darks matched temp/exptime criteria; using all {len(local_files)} darks")
            return local_files
    
    @classmethod
    async def _validate_frames(cls, local_files: List[str], job_id: str) -> tuple[List[str], List[dict]]:
        """Validate frames before stacking"""
        logger.info("Validating frames...")
        valid_files = []
        rejected_files = []
        
        for f in local_files:
            if await cls._is_job_cancelled(job_id):
                logger.info(f"Job {job_id} cancelled during validation")
                return [], []
            
            try:
                with fits.open(f) as hdul:
                    header = hdul[0].header
                    analysis = analyze_fits_headers(header)
                    is_valid = analysis.confidence >= 0.7 and not any(
                        'Missing' in w or 'must' in w for w in analysis.warnings
                    )
                    
                    if is_valid:
                        valid_files.append(f)
                    else:
                        rejected_files.append({
                            'file': os.path.basename(f),
                            'warnings': analysis.warnings
                        })
            except Exception as e:
                logger.error(f"Exception during validation of {f}: {e}")
                rejected_files.append({
                    'file': os.path.basename(f), 
                    'reason': f'Error reading FITS: {e}'
                })
        
        return valid_files, rejected_files
    
    @classmethod
    async def _prepare_bad_pixel_map(cls, job: CalibrationJobRequest, tmpdir: str) -> Optional[np.ndarray]:
        """Prepare bad pixel map if provided"""
        bpm_path = job.settings.get('badPixelMapPath')
        if not bpm_path:
            return None
        
        bpm_local_path = os.path.join(tmpdir, 'bad_pixel_map.fits')
        try:
            download_file(job.input_bucket, bpm_path, bpm_local_path)
            with fits.open(bpm_local_path) as hdul:
                bpm_data = hdul[0].data
                bad_pixel_map = (bpm_data != 0)  # Consider nonzero as bad pixel
            
            logger.info(f"Loaded bad pixel map, shape={bad_pixel_map.shape}, bad pixels={np.sum(bad_pixel_map)}")
            return bad_pixel_map
        except Exception as e:
            logger.error(f"Failed to load bad pixel map: {e}")
            return None
    
    @classmethod
    async def _stack_frames(cls, valid_files: List[str], job: CalibrationJobRequest, 
                          output_base: str, bad_pixel_map: Optional[np.ndarray], 
                          tmpdir: str, job_id: str) -> Dict[str, Any]:
        """Stack frames using the calibration worker"""
        stacking_method = job.settings.get('stackingMethod', 'sigma')
        sigma_low = job.settings.get('sigmaLow', 3.0)
        sigma_high = job.settings.get('sigmaHigh', 3.0)
        
        logger.info(f"Stacking {len(valid_files)} frames using {stacking_method} method")
        
        # Use the existing stack_frames function
        result = stack_frames(
            valid_files,
            stacking_method=stacking_method,
            sigma_low=sigma_low,
            sigma_high=sigma_high,
            bad_pixel_map=bad_pixel_map,
            output_path=os.path.join(tmpdir, f"{output_base}.fits")
        )
        
        # Upload result to storage
        output_path = f"{job.user_id}/{job.project_id}/master-{job.frame_type or 'unknown'}/{output_base}.fits"
        # TODO: Upload to storage bucket
        
        return {
            'output_path': output_path,
            'frames_used': len(valid_files),
            'stacking_method': stacking_method,
            'statistics': result.get('statistics', {}),
            'warnings': result.get('warnings', [])
        }
    
    @classmethod
    async def _is_job_cancelled(cls, job_id: str) -> bool:
        """Check if job has been cancelled"""
        job_data = await cls.get_job(job_id)
        return job_data and job_data.get('status') == 'cancelled' 