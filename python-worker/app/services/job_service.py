import logging
from typing import Dict, Any, Optional

from .calibration_service import CalibrationService

logger = logging.getLogger(__name__)

class JobService:
    """Service for managing calibration jobs - delegates to specific services"""
    
    @staticmethod
    async def insert_job(job_id: str, status: str, error: Optional[str] = None, 
                        result: Optional[Dict] = None, diagnostics: Optional[Dict] = None, 
                        warnings: Optional[list] = None, progress: Optional[int] = None):
        """Insert a new job into storage"""
        await CalibrationService.insert_job(job_id, status, error, result, diagnostics, warnings, progress)
    
    @staticmethod
    async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        """Get job data from storage"""
        return await CalibrationService.get_job(job_id)
    
    @staticmethod
    async def update_job_progress(job_id: str, progress: int):
        """Update job progress"""
        await CalibrationService.update_job_progress(job_id, progress)
    
    @staticmethod
    async def cancel_job(job_id: str) -> bool:
        """Cancel a running job"""
        return await CalibrationService.cancel_job(job_id)
    
    @staticmethod
    async def run_calibration_job(job_request, job_id: str):
        """Run calibration job in background"""
        await CalibrationService.run_calibration_job(job_request, job_id) 