from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from astropy.io import fits
import uvicorn
from typing import Optional
import tempfile
import os
import asyncio
import signal
import time
import sys
import requests
import io
import matplotlib.pyplot as plt
from PIL import Image
import numpy as np
import json
from .db import init_db, get_db
from contextlib import asynccontextmanager
import random
import string
from .fits_analysis import analyze_fits_headers
import logging

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    print("Shutting down gracefully...")

app = FastAPI(lifespan=lifespan)

# Configure CORS with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add a request timeout handler
@app.middleware("http")
async def timeout_middleware(request, call_next):
    try:
        start_time = time.time()
        response = await asyncio.wait_for(call_next(request), timeout=30.0)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timeout"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server error: {str(e)}"}
        )

def get_frame_type_from_header(header: fits.header.Header) -> str:
    """
    Determine the frame type from FITS headers with enhanced analysis.
    """
    analysis = analyze_fits_headers(header)
    
    # Log analysis results
    logger.info(f"Frame type analysis: {analysis.type} (confidence: {analysis.confidence:.2f})")
    if analysis.warnings:
        logger.warning(f"Warnings: {', '.join(analysis.warnings)}")
    if analysis.suggestions:
        logger.info(f"Suggestions: {', '.join(analysis.suggestions)}")
    
    return analysis.type

def extract_metadata(header: fits.header.Header) -> dict:
    """Extract comprehensive metadata from FITS header."""
    return {
        'exposure_time': header.get('EXPTIME'),
        'filter': header.get('FILTER'),
        'object': header.get('OBJECT'),
        'date_obs': header.get('DATE-OBS'),
        'instrument': header.get('INSTRUME'),
        'telescope': header.get('TELESCOP'),
        'gain': header.get('GAIN'),
        'temperature': header.get('CCD-TEMP'),
        'binning': f"{header.get('XBINNING', 1)}x{header.get('YBINNING', 1)}",
        'image_type': header.get('IMAGETYP'),
        'observation_type': header.get('OBSTYPE'),
        'pixel_size': f"{header.get('XPIXSZ', '?')}x{header.get('YPIXSZ', '?')}",
        'focal_length': header.get('FOCALLEN'),
        'ra': header.get('RA'),
        'dec': header.get('DEC'),
        'creator': header.get('CREATOR'),
        'offset': header.get('OFFSET'),
        'egain': header.get('EGAIN')
    }

@app.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Python worker is running"}

@app.post("/validate-fits")
async def validate_fits_file(
    file: UploadFile = File(...),
    expected_type: Optional[str] = Form(None),
    project_id: str = Form(...),
    user_id: str = Form(...)
) -> JSONResponse:
    try:
        print(f"Received file: {file.filename}")
        print(f"Expected type: {expected_type}")
        if not file:
            return JSONResponse(
                status_code=422,
                content={
                    "valid": False,
                    "message": "No file provided",
                    "details": "A FITS file must be uploaded"
                }
            )
        
        if not project_id or not user_id:
            return JSONResponse(
                status_code=422,
                content={
                    "valid": False,
                    "message": "Missing required fields",
                    "details": "Both project_id and user_id are required"
                }
            )

        # Create a temporary file to store the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fits') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Open the FITS file
            with fits.open(temp_file_path) as hdul:
                # Get the primary header
                header = hdul[0].header
                print('[validate-fits-debug] expected_type:', expected_type)
                
                # Extract metadata
                metadata = extract_metadata(header)
                
                # Determine the actual frame type
                actual_type = get_frame_type_from_header(header)
                print('[validate-fits-debug] actual_type:', actual_type)
                print('[validate-fits-debug] header:', dict(header))
                
                # Generate a consistent file path using the original filename
                sanitized_filename = file.filename.replace(' ', '_')
                actual_path = f"{user_id}/{project_id}/{actual_type}/{sanitized_filename}"
                
                # Save metadata with the correct path
                await save_fits_metadata(actual_path, project_id, user_id, metadata)
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "valid": True,
                        "message": "FITS file is valid",
                        "actual_type": actual_type,
                        "expected_type": expected_type,
                        "metadata": metadata,
                        "file_path": actual_path  # Return the correct path to the frontend
                    }
                )
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={
                    "valid": False,
                    "message": f"Invalid FITS file: {str(e)}",
                    "details": "The uploaded file is not a valid FITS file or is corrupted"
                }
            )
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
    except Exception as e:
        print(f"Error in validate_fits_file: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "valid": False,
                "message": f"Server error: {str(e)}",
                "details": "An unexpected error occurred while processing the file"
            }
        )

@app.get("/list-files")
async def list_files(project_id: str, user_id: str):
    """List all files for a given project and user with their metadata."""
    try:
        conn = await get_db()
        rows = await conn.fetch(
            """
            SELECT file_path, metadata 
            FROM fits_metadata 
            WHERE project_id = $1 AND user_id = $2
            ORDER BY file_path
            """,
            project_id, user_id
        )
        await conn.close()
        
        # Format the response
        files = []
        for row in rows:
            metadata = row['metadata']
            if isinstance(metadata, str):
                metadata = json.loads(metadata)
            
            # Get the file type directly from metadata
            file_type = metadata.get('observation_type', 'light')
            if not file_type:
                # Fallback to image_type if observation_type is not set
                file_type = metadata.get('image_type', 'light')
            
            # Normalize the file type
            file_type = file_type.lower()
            if 'light' in file_type or 'object' in file_type:
                file_type = 'light'
            elif 'dark' in file_type:
                file_type = 'dark'
            elif 'flat' in file_type:
                file_type = 'flat'
            elif 'bias' in file_type or 'zero' in file_type:
                file_type = 'bias'
            
            files.append({
                'path': row['file_path'],
                'type': file_type,
                'metadata': metadata
            })
        
        return JSONResponse(
            status_code=200,
            content={
                "files": files,
                "count": len(files)
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to list files: {str(e)}"
            }
        )

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

@app.post("/preview-fits")
async def preview_fits(request: Request):
    # Get the signed URL from the request body
    file_url = await request.json()
    if isinstance(file_url, dict):
        file_url = file_url.get("url", list(file_url.values())[0])
    # Download the FITS file
    response = requests.get(file_url)
    response.raise_for_status()
    with fits.open(io.BytesIO(response.content)) as hdul:
        data = hdul[0].data.astype(np.float32)
        # Percentile clipping for better contrast
        vmin, vmax = np.percentile(data, [0.1, 99.9])
        data = np.clip(data, vmin, vmax)
        # Normalize to 0-255
        norm = (data - vmin) / (vmax - vmin) * 255
        norm = np.nan_to_num(norm)
        img = Image.fromarray(norm.astype(np.uint8), mode='L')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/png")

async def save_fits_metadata(file_path, project_id, user_id, metadata):
    conn = await get_db()
    try:
        await conn.execute(
            """
            insert into fits_metadata (file_path, project_id, user_id, metadata)
            values ($1, $2, $3, $4)
            on conflict (file_path) do update set metadata = $4
            """,
            file_path, project_id, user_id, json.dumps(metadata)
        )
    finally:
        await conn.close()

async def get_fits_metadata(file_path):
    conn = await get_db()
    try:
        row = await conn.fetchrow("select metadata from fits_metadata where file_path = $1", file_path)
        return row['metadata'] if row else None
    finally:
        await conn.close()

# Example usage after validation:
# await save_fits_metadata(file_path, project_id, user_id, metadata)

# In-memory job store for prototyping
job_store = {}

async def run_calibration_job(job_id: str):
    # Simulate calibration processing
    job = job_store.get(job_id)
    if not job:
        return
    job["status"] = "running"
    await asyncio.sleep(2)  # Simulate processing time
    # Store mock results/diagnostics
    job["result"] = {
        "calibrated_frames": [f"/output/calibrated_{i}.fits" for i in range(1, 3)],
        "logs": f"/output/{job_id}_logs.txt"
    }
    job["diagnostics"] = {
        "type": "light",
        "warnings": ["Simulated warning: check exposure time"]
    }
    job["warnings"] = ["Simulated warning: check exposure time"]
    job["status"] = "complete"

@app.post("/jobs/submit")
async def submit_calibration_job(request: Request, background_tasks: BackgroundTasks):
    """
    Submit a new calibration job.
    Expects JSON payload with:
      - input_files: list of file paths/IDs
      - settings: dict of calibration settings (optional)
      - project_id, user_id, job metadata
    Returns: job_id, initial status, validation errors
    """
    data = await request.json()
    job_id = f"job_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"
    job_store[job_id] = {
        "status": "pending",
        "input_files": data.get("input_files", []),
        "settings": data.get("settings", {}),
        "project_id": data.get("project_id"),
        "user_id": data.get("user_id"),
        "created_at": time.time(),
        "result": None,
        "diagnostics": None,
        "warnings": [],
        "error": None
    }
    background_tasks.add_task(run_calibration_job, job_id)
    return {"job_id": job_id, "status": "pending"}

@app.get("/jobs/status")
async def get_job_status(job_id: str):
    """
    Get the status of a calibration job.
    Returns: job_id, status, progress info, error message, timestamps
    """
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "created_at": job["created_at"],
        "error": job["error"]
    }

@app.get("/jobs/results")
async def get_job_results(job_id: str):
    """
    Get the results of a completed calibration job.
    Returns: job_id, output file URLs/paths, diagnostics JSON, warnings/errors, summary stats
    """
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail="Job not complete")
    return {
        "job_id": job_id,
        "results": job["result"] or {},
        "diagnostics": job.get("diagnostics", {}),
        "warnings": job.get("warnings", []),
        "error": job["error"]
    }

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 