from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import tempfile
import os

from ..services.file_service import FileService
from ..services.validation_service import ValidationService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["files"])

@router.get("/list-files")
async def list_files(project_id: str, user_id: str):
    """List all files for a project and user"""
    try:
        logger.info(f"Listing files for project {project_id}, user {user_id}")
        
        files = await FileService.list_project_files(project_id, user_id)
        
        return {
            "status": "success",
            "files": files,
            "total_count": len(files)
        }
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/preview-fits")
async def preview_fits(request: Request):
    """Generate preview for FITS file"""
    try:
        data = await request.json()
        signed_url = data.get('signed_url')
        
        if not signed_url:
            raise HTTPException(status_code=400, detail="No signed URL provided")
        
        logger.info(f"Generating preview for FITS file")
        
        # Process preview generation
        result = await FileService.generate_fits_preview(signed_url)
        
        return {
            "status": "success",
            "preview_url": result.get('preview_url'),
            "metadata": result.get('metadata', {}),
            "statistics": result.get('statistics', {})
        }
    except Exception as e:
        logger.error(f"Error generating FITS preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-fits")
async def validate_fits_file(
    file: UploadFile = File(...),
    expected_type: Optional[str] = Form(None),
    project_id: str = Form(...),
    user_id: str = Form(...)
) -> JSONResponse:
    """Validate FITS file and extract metadata"""
    try:
        logger.info(f"Validating FITS file: {file.filename}")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fits') as temp_file:
            # Read and save uploaded file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Validate the FITS file
            validation_result = await ValidationService.validate_fits_file(
                temp_file_path, 
                expected_type, 
                project_id, 
                user_id,
                original_filename=file.filename
            )
            
            return JSONResponse(content={
                "status": "success",
                "valid": validation_result.get('valid', False),
                "frame_type": validation_result.get('frame_type'),
                "metadata": validation_result.get('metadata', {}),
                "warnings": validation_result.get('warnings', []),
                "errors": validation_result.get('errors', []),
                "suggestions": validation_result.get('suggestions', [])
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Error validating FITS file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-temp-file")
async def analyze_temp_file(request: Request):
    """Analyze a temporary FITS file"""
    try:
        data = await request.json()
        temp_path = data.get('temp_path')
        
        if not temp_path:
            raise HTTPException(status_code=400, detail="No temporary path provided")
        
        logger.info(f"Analyzing temporary file: {temp_path}")
        
        # Process file analysis
        result = await FileService.analyze_temp_file(temp_path)
        
        return {
            "status": "success",
            "analysis": result.get('analysis', {}),
            "metadata": result.get('metadata', {}),
            "frame_type": result.get('frame_type'),
            "quality_score": result.get('quality_score')
        }
    except Exception as e:
        logger.error(f"Error analyzing temp file: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 