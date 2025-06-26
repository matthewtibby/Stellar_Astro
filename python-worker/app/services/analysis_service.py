import logging
import asyncio
import os
import tempfile
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from astropy.io import fits
import numpy as np

from models.requests import HistogramAnalysisRequest, GradientAnalysisRequest
from supabase_io import download_file
from histogram_analysis import analyze_calibration_frame_histograms, HistogramAnalyzer
from gradient_analysis import analyze_calibration_frame_gradients

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for handling histogram and gradient analysis operations"""
    
    # In-memory storage for job tracking (would be database in production)
    _jobs: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def insert_job(cls, job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new analysis job into storage"""
        cls._jobs[job_id] = {
            'status': status,
            'error': error,
            'result': result,
            'diagnostics': diagnostics,
            'warnings': warnings,
            'progress': progress or 0,
            'created_at': datetime.utcnow().isoformat(),
            'summary': None,
            'analysis_results': None,
            'frame_results': None
        }
        logger.info(f"Inserted analysis job {job_id} with status {status}")
    
    @classmethod
    async def get_job(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis job data from storage"""
        return cls._jobs.get(job_id)
    
    @classmethod
    async def update_job_progress(cls, job_id: str, progress: int):
        """Update analysis job progress"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['progress'] = progress
            logger.info(f"Updated analysis job {job_id} progress to {progress}%")
    
    @classmethod
    async def cancel_job(cls, job_id: str) -> bool:
        """Cancel a running analysis job"""
        if job_id in cls._jobs:
            cls._jobs[job_id]['status'] = 'cancelled'
            logger.info(f"Cancelled analysis job {job_id}")
            return True
        return False
    
    @classmethod
    async def run_histogram_analysis_job(cls, request: HistogramAnalysisRequest, job_id: str):
        """Run histogram analysis job"""
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
            
            logger.info(f"Processing {len(fits_paths)} files for histogram analysis")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = await cls._download_files(fits_paths, request.bucket, tmpdir, job_id)
                
                if not local_files:
                    await cls.insert_job(job_id, status="failed", error="No files downloaded", progress=0)
                    return
                
                await cls.update_job_progress(job_id, 30)
                
                # Analyze histograms using the correct function
                result = analyze_calibration_frame_histograms(local_files, request.frame_type)
                
                await cls.update_job_progress(job_id, 95)
                
                # Generate summary
                summary = result
                
                await cls.update_job_progress(job_id, 100)
                await cls.insert_job(
                    job_id, 
                    status="completed", 
                    result=summary,
                    summary=summary.get('summary', {}),
                    analysis_results=summary.get('frame_results', [])
                )
                
        except Exception as e:
            logger.error(f"Error in histogram analysis job {job_id}: {e}")
            tb = traceback.format_exc()
            await cls.insert_job(job_id, status="failed", error=str(e), progress=0)
    
    @classmethod
    async def run_gradient_analysis_job(cls, request: GradientAnalysisRequest, job_id: str):
        """Run gradient analysis job"""
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
            
            logger.info(f"Processing {len(fits_paths)} files for gradient analysis")
            
            with tempfile.TemporaryDirectory() as tmpdir:
                # Download files
                local_files = await cls._download_files(fits_paths, request.bucket, tmpdir, job_id)
                
                if not local_files:
                    await cls.insert_job(job_id, status="failed", error="No files downloaded", progress=0)
                    return
                
                await cls.update_job_progress(job_id, 30)
                
                # Analyze gradients
                frame_results = []
                for i, local_file in enumerate(local_files):
                    if await cls._is_job_cancelled(job_id):
                        logger.info(f"Gradient analysis job {job_id} cancelled")
                        return
                    
                    progress = 30 + int((i / len(local_files)) * 60)
                    await cls.update_job_progress(job_id, progress)
                    
                    result = await cls._analyze_gradient_single(local_file, request.frame_type)
                    if result:
                        frame_results.append(result)
                
                await cls.update_job_progress(job_id, 95)
                
                # Generate summary
                summary = cls._generate_gradient_summary(frame_results)
                
                await cls.update_job_progress(job_id, 100)
                await cls.insert_job(
                    job_id, 
                    status="completed", 
                    result=summary,
                    summary=summary.get('summary', {}),
                    frame_results=frame_results
                )
                
        except Exception as e:
            logger.error(f"Error in gradient analysis job {job_id}: {e}")
            tb = traceback.format_exc()
            await cls.insert_job(job_id, status="failed", error=str(e), progress=0)
    
    @classmethod
    async def _download_files(cls, paths: List[str], bucket: str, tmpdir: str, job_id: str) -> List[str]:
        """Download FITS files for processing"""
        local_files = []
        
        for i, path in enumerate(paths):
            if await cls._is_job_cancelled(job_id):
                return []
            
            local_path = os.path.join(tmpdir, f"analysis_input_{i}.fits")
            try:
                download_file(bucket, path, local_path)
                local_files.append(local_path)
            except Exception as e:
                logger.error(f"Failed to download {path}: {e}")
                continue
        
        return local_files
    
    @classmethod
    async def _analyze_histogram_single(cls, local_file: str, frame_type: Optional[str]) -> Optional[Dict]:
        """Analyze histogram for a single file"""
        try:
            # Use HistogramAnalyzer for single file analysis
            analyzer = HistogramAnalyzer()
            result = analyzer.analyze_frame_histogram(local_file, frame_type=frame_type)
            
            return {
                'file': os.path.basename(local_file),
                'frame_type': frame_type or 'auto-detected',
                'histogram_data': result.histogram.tolist() if result.histogram is not None else [],
                'statistics': {
                    'mean': result.mean,
                    'median': result.median,
                    'std': result.std,
                    'skewness': result.skewness,
                    'kurtosis': result.kurtosis
                },
                'analysis': {
                    'histogram_score': result.histogram_score,
                    'distribution_type': result.distribution_type,
                    'peak_count': result.peak_count
                },
                'recommendations': result.recommendations,
                'issues': result.issues_detected
            }
            
        except Exception as e:
            logger.error(f"Histogram analysis failed for {local_file}: {e}")
            return {
                'file': os.path.basename(local_file),
                'frame_type': frame_type or 'unknown',
                'error': str(e)
            }
    
    @classmethod
    async def _analyze_gradient_single(cls, local_file: str, frame_type: Optional[str]) -> Optional[Dict]:
        """Analyze gradient for a single file"""
        try:
            # Use existing gradient analysis function
            result = analyze_calibration_frame_gradients(local_file, frame_type=frame_type)
            
            return {
                'file': os.path.basename(local_file),
                'frame_type': frame_type or 'auto-detected',
                'gradient_score': result.gradient_score,
                'uniformity_score': result.uniformity_score,
                'analysis': result.statistics,
                'issues': result.detected_issues,
                'recommendations': result.recommendations
            }
            
        except Exception as e:
            logger.error(f"Gradient analysis failed for {local_file}: {e}")
            return {
                'file': os.path.basename(local_file),
                'frame_type': frame_type or 'unknown',
                'error': str(e)
            }
    
    @classmethod
    def _generate_histogram_summary(cls, analysis_results: dict) -> Dict:
        """Generate summary of histogram analysis results"""
        frame_results = analysis_results.get('frame_results', [])
        
        if not frame_results:
            return {'error': 'No frame results to summarize'}
        
        successful_analyses = [r for r in frame_results if 'error' not in r]
        failed_analyses = [r for r in frame_results if 'error' in r]
        
        # Calculate aggregate statistics
        total_issues = []
        total_recommendations = []
        
        for result in successful_analyses:
            total_issues.extend(result.get('issues', []))
            total_recommendations.extend(result.get('recommendations', []))
        
        # Count issue types
        issue_counts = {}
        for issue in total_issues:
            issue_type = issue.get('type', 'unknown') if isinstance(issue, dict) else str(issue)
            issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
        
        return {
            'total_files': len(frame_results),
            'successful_analyses': len(successful_analyses),
            'failed_analyses': len(failed_analyses),
            'success_rate': len(successful_analyses) / len(frame_results) if frame_results else 0,
            'total_issues_found': len(total_issues),
            'issue_breakdown': issue_counts,
            'common_recommendations': list(set(total_recommendations)),
            'summary': {
                'overall_quality': cls._assess_overall_quality(successful_analyses),
                'major_issues': [issue for issue in total_issues if isinstance(issue, dict) and issue.get('severity') == 'high'],
                'frame_count': len(successful_analyses)
            }
        }
    
    @classmethod
    def _generate_gradient_summary(cls, results: List[Dict]) -> Dict:
        """Generate summary of gradient analysis results"""
        if not results:
            return {'error': 'No results to summarize'}
        
        successful_results = [r for r in results if 'error' not in r]
        failed_results = [r for r in results if 'error' in r]
        
        if not successful_results:
            return {'error': 'No successful gradient analyses'}
        
        # Calculate gradient statistics
        gradient_scores = [r.get('gradient_score', 0.0) for r in successful_results]
        avg_gradient_score = sum(gradient_scores) / len(gradient_scores)
        max_gradient_score = max(gradient_scores)
        min_gradient_score = min(gradient_scores)
        
        # Count gradient issues
        total_issues = []
        for result in successful_results:
            total_issues.extend(result.get('issues', []))
        
        issue_counts = {}
        for issue in total_issues:
            issue_type = issue if isinstance(issue, str) else str(issue)
            issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
        
        # Generate overall recommendation
        if avg_gradient_score > 7.0:
            overall_recommendation = "Excellent uniformity. Frames are well-suited for calibration."
        elif avg_gradient_score > 5.0:
            overall_recommendation = "Good uniformity. Minor gradients detected but acceptable."
        elif avg_gradient_score > 3.0:
            overall_recommendation = "Moderate gradients detected. Consider flat field correction."
        else:
            overall_recommendation = "Significant gradients detected. Review acquisition setup."
        
        return {
            'total_files': len(results),
            'successful_analyses': len(successful_results),
            'failed_analyses': len(failed_results),
            'success_rate': len(successful_results) / len(results),
            'gradient_statistics': {
                'average_score': avg_gradient_score,
                'max_score': max_gradient_score,
                'min_score': min_gradient_score,
                'score_range': max_gradient_score - min_gradient_score
            },
            'issue_summary': {
                'total_issues': len(total_issues),
                'issue_breakdown': issue_counts
            },
            'overall_recommendation': overall_recommendation,
            'summary': {
                'gradient_severity': 'low' if avg_gradient_score > 7.0 else 'medium' if avg_gradient_score > 3.0 else 'high',
                'uniformity_assessment': 'excellent' if avg_gradient_score > 7.0 else 'good' if avg_gradient_score > 5.0 else 'poor'
            }
        }
    
    @classmethod
    def _assess_overall_quality(cls, successful_analyses: List[Dict]) -> str:
        """Assess overall quality based on analysis results"""
        if not successful_analyses:
            return 'unknown'
        
        total_issues = sum(len(r.get('issues', [])) for r in successful_analyses)
        avg_issues_per_frame = total_issues / len(successful_analyses)
        
        if avg_issues_per_frame > 3:
            return 'poor'
        elif avg_issues_per_frame > 1:
            return 'fair'
        else:
            return 'good'
    
    @classmethod
    async def _is_job_cancelled(cls, job_id: str) -> bool:
        """Check if job has been cancelled"""
        job_data = await cls.get_job(job_id)
        return job_data and job_data.get('status') == 'cancelled' 