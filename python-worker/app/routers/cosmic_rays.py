from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
import uuid
import logging

from models.requests import CosmicRayDetectionRequest
from services.cosmic_ray_service import CosmicRayService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cosmic-rays", tags=["cosmic-rays"])

@router.post("/detect")
async def detect_cosmic_rays(request: CosmicRayDetectionRequest, background_tasks: BackgroundTasks):
    """Detect cosmic rays in calibration frames using L.A.Cosmic or other methods"""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Starting cosmic ray detection job {job_id} with method {request.method}")
        
        # Validate parameters
        params = {
            'sigma_clip': request.sigma_clip,
            'sigma_frac': request.sigma_frac,
            'objlim': request.objlim,
            'gain': request.gain,
            'readnoise': request.readnoise,
            'satlevel': request.satlevel,
            'niter': request.niter,
            'method': request.method,
            'auto_tune': request.auto_tune,
            'multi_methods': request.multi_methods,
            'combine_method': request.combine_method,
            'analyze_image_quality': request.analyze_image_quality
        }
        
        # Insert job into storage
        await CosmicRayService.insert_job(job_id, "queued")
        
        # Add background task
        background_tasks.add_task(CosmicRayService.run_cosmic_ray_job, request, job_id, params)
        
        return {"job_id": job_id, "status": "submitted", "method": request.method}
    except Exception as e:
        logger.error(f"Error starting cosmic ray detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-detect")
async def batch_detect_cosmic_rays(request: CosmicRayDetectionRequest, background_tasks: BackgroundTasks):
    """Batch detect cosmic rays across multiple frames with enhanced analysis"""
    try:
        job_id = str(uuid.uuid4())
        logger.info(f"Starting batch cosmic ray detection job {job_id}")
        
        # Insert job into storage
        await CosmicRayService.insert_job(job_id, "queued")
        
        # Add enhanced background task
        background_tasks.add_task(CosmicRayService.run_enhanced_cosmic_ray_job, request, job_id)
        
        return {"job_id": job_id, "status": "submitted", "batch_mode": True}
    except Exception as e:
        logger.error(f"Error starting batch cosmic ray detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{job_id}")
async def get_cosmic_ray_recommendations(job_id: str):
    """Get cosmic ray detection recommendations and parameter suggestions"""
    try:
        job_data = await CosmicRayService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_data.get('status') != 'completed':
            return {"job_id": job_id, "status": job_data.get('status'), "progress": job_data.get('progress', 0)}
        
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "recommendations": job_data.get('recommendations'),
            "parameter_suggestions": job_data.get('parameter_suggestions'),
            "image_quality_metrics": job_data.get('image_quality_metrics')
        }
    except Exception as e:
        logger.error(f"Error getting cosmic ray recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{job_id}")
async def get_cosmic_ray_results(job_id: str):
    """Get cosmic ray detection results"""
    try:
        job_data = await CosmicRayService.get_job(job_id)
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_data.get('status') != 'completed':
            return {"job_id": job_id, "status": job_data.get('status'), "progress": job_data.get('progress', 0)}
            
        return {
            "job_id": job_id,
            "status": job_data.get('status'),
            "result": job_data.get('result'),
            "cleaned_images": job_data.get('cleaned_images'),
            "masks": job_data.get('masks'),
            "statistics": job_data.get('statistics')
        }
    except Exception as e:
        logger.error(f"Error getting cosmic ray results: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 