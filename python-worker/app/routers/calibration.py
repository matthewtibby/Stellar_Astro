from fastapi import APIRouter, BackgroundTasks, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uuid
import logging

from ..models.requests import CalibrationJobRequest, CancelJobRequest
from ..services.calibration_service import CalibrationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["calibration"])

@router.post("/submit")
async def submit_job(job: CalibrationJobRequest, request: Request, background_tasks: BackgroundTasks):
    """Submit a calibration job for processing"""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Submitting calibration job {job_id}")
        
        # Insert job into database/storage
        await CalibrationService.insert_job(job_id, "queued")
        
        # Add to background tasks
        background_tasks.add_task(CalibrationService.run_calibration_job, job, job_id)
        
        return {"job_id": job_id, "status": "submitted"}
    except Exception as e:
        logger.error(f"Error submitting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_job_status(job_id: str):
    """Get the status of a calibration job"""
    try:
        job_data = await CalibrationService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "progress": job_data.get('progress', 0),
            "error": job_data.get('error'),
            "result": job_data.get('result')
        }
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results") 
async def get_job_results(job_id: str):
    """Get the results of a completed calibration job"""
    try:
        job_data = await CalibrationService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_data.get('status') != 'completed':
            raise HTTPException(status_code=400, detail="Job not completed yet")
            
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "result": job_data.get('result'),
            "diagnostics": job_data.get('diagnostics'),
            "warnings": job_data.get('warnings')
        }
    except Exception as e:
        logger.error(f"Error getting job results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}/progress")
async def get_job_progress(job_id: str):
    """Get the progress of a running calibration job"""
    try:
        job_data = await CalibrationService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
            
        return {
            "job_id": job_id,
            "progress": job_data.get('progress', 0),
            "status": job_data.get('status')
        }
    except Exception as e:
        logger.error(f"Error getting job progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_job(payload: CancelJobRequest):
    """Cancel a running calibration job"""
    try:
        result = await CalibrationService.cancel_job(payload.jobId)
        return {"success": result}
    except Exception as e:
        logger.error(f"Error canceling job: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 