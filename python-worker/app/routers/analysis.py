from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
import uuid
import logging

from ..models.requests import HistogramAnalysisRequest, GradientAnalysisRequest
from ..services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["analysis"])

@router.post("/histograms/analyze")
async def analyze_histograms(request: HistogramAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze histogram and distribution for calibration frames"""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Starting histogram analysis job {job_id}")
        
        # Insert job into storage
        await AnalysisService.insert_job(job_id, "queued")
        
        # Add background task
        background_tasks.add_task(AnalysisService.run_histogram_analysis_job, request, job_id)
        
        return {"job_id": job_id, "status": "submitted"}
    except Exception as e:
        logger.error(f"Error starting histogram analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/histograms/results/{job_id}")
async def get_histogram_results(job_id: str):
    """Get histogram analysis results"""
    try:
        job_data = await AnalysisService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_data.get('status') != 'completed':
            return {"job_id": job_id, "status": job_data.get('status'), "progress": job_data.get('progress', 0)}
            
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "result": job_data.get('result'),
            "summary": job_data.get('summary'),
            "analysis_results": job_data.get('analysis_results')
        }
    except Exception as e:
        logger.error(f"Error getting histogram results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gradients/analyze") 
async def analyze_gradients(request: GradientAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze gradients in calibration frames"""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Starting gradient analysis job {job_id}")
        
        # Insert job into storage
        await AnalysisService.insert_job(job_id, "queued")
        
        # Add background task
        background_tasks.add_task(AnalysisService.run_gradient_analysis_job, request, job_id)
        
        return {"job_id": job_id, "status": "submitted"}
    except Exception as e:
        logger.error(f"Error starting gradient analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gradients/results/{job_id}")
async def get_gradient_results(job_id: str):
    """Get gradient analysis results"""
    try:
        job_data = await AnalysisService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_data.get('status') != 'completed':
            return {"job_id": job_id, "status": job_data.get('status'), "progress": job_data.get('progress', 0)}
            
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "result": job_data.get('result'),
            "summary": job_data.get('summary'),
            "frame_results": job_data.get('frame_results')
        }
    except Exception as e:
        logger.error(f"Error getting gradient results: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 