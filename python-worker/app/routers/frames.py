from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging

from models.requests import OutlierDetectRequest, FrameConsistencyRequest
from services.frame_service import FrameService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["frames"])

@router.post("/outliers/detect")
async def outliers_detect(request: OutlierDetectRequest):
    """Detect outlier frames in a set of calibration frames"""
    try:
        logger.info(f"Starting outlier detection for {len(request.fits_paths or [])} frames")
        
        # Validate request
        if not request.fits_paths:
            raise HTTPException(status_code=400, detail="No FITS paths provided")
        
        # Process outlier detection
        result = await FrameService.detect_outlier_frames(
            fits_paths=request.fits_paths,
            bucket=request.bucket,
            project_id=request.project_id,
            user_id=request.user_id,
            frame_type=request.frame_type,
            sigma_thresh=request.sigma_thresh
        )
        
        return {
            "status": "completed",
            "good": result.get('good', []),
            "outliers": result.get('outliers', []),
            "summary": result.get('summary', {}),
            "recommendations": result.get('recommendations', [])
        }
    except Exception as e:
        logger.error(f"Error detecting outliers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/consistency/analyze")
async def analyze_frames_consistency(request: FrameConsistencyRequest):
    """Analyze frame consistency and provide selection recommendations"""
    try:
        logger.info(f"Starting consistency analysis for {len(request.fits_paths or [])} frames")
        
        # Validate request
        if not request.fits_paths:
            raise HTTPException(status_code=400, detail="No FITS paths provided")
        
        # Process consistency analysis
        result = await FrameService.analyze_frame_consistency(
            fits_paths=request.fits_paths,
            bucket=request.bucket,
            project_id=request.project_id,
            user_id=request.user_id,
            frame_type=request.frame_type,
            consistency_threshold=request.consistency_threshold,
            sigma_threshold=request.sigma_threshold,
            min_frames=request.min_frames,
            max_frames=request.max_frames
        )
        
        return {
            "status": "completed",
            "consistency_scores": result.get('consistency_scores', []),
            "selection_advice": result.get('selection_advice', {}),
            "analysis_summary": result.get('analysis_summary', {}),
            "frame_recommendations": result.get('frame_recommendations', [])
        }
    except Exception as e:
        logger.error(f"Error analyzing frame consistency: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trails/detect")
async def detect_trails(request_data: dict):
    """Detect satellite/airplane trails in frames"""
    try:
        logger.info("Starting trail detection")
        
        # Extract parameters from request
        fits_path = request_data.get('fits_path')
        sensitivity = request_data.get('sensitivity', 0.5)
        min_length = request_data.get('min_length', 30)
        
        if not fits_path:
            raise HTTPException(status_code=400, detail="No FITS path provided")
        
        # Process trail detection
        result = await FrameService.detect_trails(
            fits_path=fits_path,
            sensitivity=sensitivity,
            min_length=min_length,
            mask_output=request_data.get('mask_output', True),
            preview_output=request_data.get('preview_output', True),
            output_dir=request_data.get('output_dir', 'output')
        )
        
        return {
            "status": "completed",
            "trails_detected": result.get('trails_detected', 0),
            "trail_coordinates": result.get('trail_coordinates', []),
            "mask_path": result.get('mask_path'),
            "preview_path": result.get('preview_path')
        }
    except Exception as e:
        logger.error(f"Error detecting trails: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 