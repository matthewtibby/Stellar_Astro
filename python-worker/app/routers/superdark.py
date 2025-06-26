from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import logging

from services.superdark_service import SuperdarkService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/superdark", tags=["superdark"])

@router.post("/create")
async def create_superdark(request: Request):
    """Create a superdark master frame from multiple dark frames"""
    try:
        data = await request.json()
        logger.info(f"Creating superdark with {len(data.get('input_paths', []))} frames")
        
        # Validate request data
        input_paths = data.get('input_paths', [])
        if not input_paths:
            raise HTTPException(status_code=400, detail="No input paths provided")
        
        # Process superdark creation
        result = await SuperdarkService.create_superdark(
            input_bucket=data.get('input_bucket'),
            input_paths=input_paths,
            output_bucket=data.get('output_bucket'),
            output_path=data.get('output_path'),
            project_id=data.get('project_id'),
            user_id=data.get('user_id'),
            stacking_method=data.get('stacking_method', 'median'),
            sigma_threshold=data.get('sigma_threshold', 3.0),
            name=data.get('name', 'Superdark'),
            metadata=data.get('metadata', {})
        )
        
        return {
            "status": "success",
            "superdark_path": result.get('superdark_path'),
            "preview_url": result.get('preview_url'),
            "metadata": result.get('metadata', {}),
            "statistics": result.get('statistics', {}),
            "warnings": result.get('warnings', [])
        }
    except Exception as e:
        logger.error(f"Error creating superdark: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_superdark(request: Request):
    """Analyze an existing superdark frame"""
    try:
        data = await request.json()
        superdark_path = data.get('superdark_path')
        
        if not superdark_path:
            raise HTTPException(status_code=400, detail="No superdark path provided")
        
        logger.info(f"Analyzing superdark: {superdark_path}")
        
        # Process superdark analysis
        result = await SuperdarkService.analyze_superdark(
            superdark_path=superdark_path,
            bucket=data.get('bucket'),
            project_id=data.get('project_id'),
            user_id=data.get('user_id')
        )
        
        return {
            "status": "success",
            "analysis": result.get('analysis', {}),
            "quality_metrics": result.get('quality_metrics', {}),
            "preview_url": result.get('preview_url'),
            "compatibility": result.get('compatibility', {}),
            "recommendations": result.get('recommendations', [])
        }
    except Exception as e:
        logger.error(f"Error analyzing superdark: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_superdarks(project_id: str, user_id: str):
    """List all available superdarks for a project"""
    try:
        logger.info(f"Listing superdarks for project {project_id}, user {user_id}")
        
        superdarks = await SuperdarkService.list_superdarks(project_id, user_id)
        
        return {
            "status": "success",
            "superdarks": superdarks,
            "count": len(superdarks)
        }
    except Exception as e:
        logger.error(f"Error listing superdarks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{superdark_id}")
async def delete_superdark(superdark_id: str, project_id: str, user_id: str):
    """Delete a superdark"""
    try:
        logger.info(f"Deleting superdark {superdark_id}")
        
        result = await SuperdarkService.delete_superdark(superdark_id, project_id, user_id)
        
        return {
            "status": "success",
            "deleted": result.get('deleted', False),
            "message": result.get('message', '')
        }
    except Exception as e:
        logger.error(f"Error deleting superdark: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 