import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[2]))
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request, Form, Body
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
from .fits_analysis import analyze_fits_headers, detect_camera, KNOWN_CAMERAS
from .calibration_worker import create_master_frame, save_master_frame, save_master_preview, analyze_frames, recommend_stacking, infer_frame_type
from .supabase_io import download_file, upload_file
from .cosmetic_masking import compute_bad_pixel_mask, compute_bad_column_mask, compute_bad_row_mask, apply_masks
from .patterned_noise_removal import remove_gradients_median, remove_striping_fourier, remove_background_polynomial, detect_pattern_type, apply_combined_correction
from .histogram_analysis import analyze_calibration_frame_histograms

async def download_file_with_fallback(bucket: str, remote_path: str, local_path: str, request_info: dict) -> bool:
    """
    Download a file with fallback to different frame type folders if the primary path fails.
    This handles cases where bias files might be stored in dark folders, etc.
    """
    filename = os.path.basename(remote_path)
    
    # Try primary path first
    try:
        download_file(bucket, remote_path, local_path)
        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
            logger.info(f"Successfully downloaded {remote_path}")
            return True
    except Exception as e:
        logger.warning(f"Failed to download {remote_path}: {e}")
    
    # If primary path failed, try fallback locations for misplaced files
    if request_info.get('project_id') and request_info.get('user_id') and request_info.get('frame_type'):
        fallback_frame_types = ['bias', 'dark', 'flat']
        if request_info['frame_type'] in fallback_frame_types:
            fallback_frame_types.remove(request_info['frame_type'])
        
        for fallback_type in fallback_frame_types:
            fallback_path = f"{request_info['user_id']}/{request_info['project_id']}/{fallback_type}/{filename}"
            try:
                logger.info(f"Trying fallback path: {fallback_path}")
                download_file(bucket, fallback_path, local_path)
                if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                    logger.info(f"Successfully downloaded from fallback path: {fallback_path}")
                    return True
            except Exception as e:
                logger.debug(f"Fallback path {fallback_path} also failed: {e}")
                continue
    
    logger.error(f"Could not download {filename} from any location")
    return False
from pydantic import BaseModel
import traceback
import uuid
from datetime import datetime
import glob
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter
from .trail_detection import detect_trails
from .outlier_rejection import detect_outlier_frames
from .frame_consistency import analyze_frame_consistency, suggest_frame_selection
from .cosmic_ray_detection import CosmicRayDetector, validate_cosmic_ray_parameters
from .gradient_analysis import analyze_calibration_frame_gradients, GradientAnalysisResult

logger = logging.getLogger(__name__)

# In-memory job storage (for development without database)
job_results = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
    except Exception as e:
        print(f"Database initialization failed: {e}. Using in-memory storage.")
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

def get_camera_max_gain(camera_name: str) -> int:
    """Get the maximum gain for a known camera."""
    if camera_name in KNOWN_CAMERAS:
        return KNOWN_CAMERAS[camera_name].max_gain
    return 0  # Unknown camera

def extract_metadata(header: fits.header.Header) -> dict:
    """Extract comprehensive metadata from FITS header."""
    # Prefer GAIN, fallback to EGAIN if present
    gain = header.get('GAIN')
    if gain is None:
        gain = header.get('EGAIN')
    # Prefer READNOIS, fallback to RDNOISE if present
    readnoise = header.get('READNOIS')
    if readnoise is None:
        readnoise = header.get('RDNOISE')
    # Prefer SATLEVEL, fallback to SATURATE, fallback to 65535
    satlevel = header.get('SATLEVEL')
    if satlevel is None:
        satlevel = header.get('SATURATE')
    if satlevel is None:
        satlevel = 65535
    return {
        'exposure_time': header.get('EXPTIME'),
        'filter': header.get('FILTER'),
        'object': header.get('OBJECT'),
        'date_obs': header.get('DATE-OBS'),
        'instrument': header.get('INSTRUME'),
        'telescope': header.get('TELESCOP'),
        'gain': gain,
        'readnoise': readnoise,
        'satlevel': satlevel,
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

@app.post("/test-camera-detection")
async def test_camera_detection(request: Request):
    """Test camera detection and gain validation."""
    try:
        body = await request.json()
        
        # Create a mock header that behaves like a FITS header
        class MockHeader:
            def __init__(self, data):
                self.data = data
            
            def get(self, key, default=None):
                return self.data.get(key, default)
            
            def __contains__(self, key):
                return key in self.data
            
            def __iter__(self):
                return iter(self.data)
            
            def __getitem__(self, key):
                return self.data[key]
        
        header = MockHeader(body)
        
        # Test camera detection
        camera_info = detect_camera(header)
        
        # Test full analysis
        result = analyze_fits_headers(header)
        
        return {
            "success": True,
            "camera_detected": camera_info.name if camera_info else None,
            "camera_max_gain": camera_info.max_gain if camera_info else None,
            "gain_value": body.get("GAIN"),
            "warnings": result.warnings,
            "validation_result": "PASS" if not any("Gain" in w for w in result.warnings) else "FAIL"
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/validate-fits")
async def validate_fits_file(
    file: UploadFile = File(...),
    expected_type: Optional[str] = Form(None),
    project_id: str = Form(...),
    user_id: str = Form(...)
) -> JSONResponse:
    try:
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

class CalibrationJobRequest(BaseModel):
    input_bucket: str
    input_paths: list[str]
    output_bucket: str
    output_base: str
    settings: dict = {}
    project_id: str = None
    user_id: str = None
    metadata: dict = None
    test_name: str = None
    frame_type: str = None

class CancelJobRequest(BaseModel):
    jobId: str

class CosmeticMaskRequest(BaseModel):
    input_bucket: str
    input_paths: list[str]  # List of dark frame paths for mask generation
    output_bucket: str
    output_base: str  # Base path for mask output
    project_id: str
    user_id: str
    settings: dict = {}  # sigma, min_bad_fraction, etc.

class PatternedNoiseRequest(BaseModel):
    input_bucket: str
    input_paths: list[str]  # List of image paths to correct
    output_bucket: str
    output_base: str  # Base path for corrected images
    project_id: str
    user_id: str
    settings: dict = {}  # method, filter_size, strength, etc.

# --- JOB STATUS/RESULTS DB HELPERS ---
async def insert_job(job_id, status, error=None, result=None, diagnostics=None, warnings=None, progress=None):
    conn = await get_db()
    try:
        # Build dynamic SQL based on which fields are not None
        fields = ["status", "error", "result", "warnings", "progress"]
        values = [status, error, json.dumps(result) if result is not None else None,
                  json.dumps(warnings) if warnings is not None else None, progress]
        set_clauses = ["status = excluded.status", "error = excluded.error", "result = excluded.result",
                       "warnings = excluded.warnings", "progress = excluded.progress"]
        if diagnostics is not None:
            fields.insert(3, "diagnostics")
            values.insert(3, json.dumps(diagnostics))
            set_clauses.insert(3, "diagnostics = excluded.diagnostics")
        sql = f"""
            insert into jobs (job_id, {', '.join(fields)})
            values ($1, {', '.join(f'${i+2}' for i in range(len(fields)))})
            on conflict (job_id) do update set
                {', '.join(set_clauses)}
        """
        await conn.execute(sql, job_id, *values)
    finally:
        await conn.close()

async def get_job(job_id):
    conn = await get_db()
    try:
        row = await conn.fetchrow("select * from jobs where job_id = $1", job_id)
        return dict(row) if row else None
    finally:
        await conn.close()

async def update_job_progress(job_id, progress):
    # 3. Preserve current job status
    job = await get_job(job_id)
    status = job['status'] if job and 'status' in job else None
    await insert_job(job_id, status=status, progress=progress)

@app.post("/jobs/cancel")
async def cancel_job(payload: CancelJobRequest):
    job_id = payload.jobId
    await insert_job(job_id, status="cancelled", progress=100, error="Job cancelled by user.")
    return {"job_id": job_id, "status": "cancelled"}

@app.post("/cosmetic-masks/generate")
async def generate_cosmetic_masks(request: CosmeticMaskRequest, background_tasks: BackgroundTasks):
    """
    Generate bad pixel, column, and row masks from a stack of dark frames.
    Returns job_id for async processing.
    """
    try:
        job_id = f"mask-{uuid.uuid4().hex[:8]}"
        await insert_job(job_id, status="queued", progress=0)
        background_tasks.add_task(run_cosmetic_mask_job, request, job_id)
        return {"jobId": job_id, "status": "queued"}
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] Exception in /cosmetic-masks/generate: {e}\n{tb}")
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})

async def run_cosmetic_mask_job(request: CosmeticMaskRequest, job_id: str):
    """
    Background task to generate cosmetic masks from dark frames.
    """
    try:
        await update_job_progress(job_id, 10)
        print(f"[{datetime.utcnow().isoformat()}] [MASK] Starting cosmetic mask generation: {job_id}")

        # Download dark frames
        await update_job_progress(job_id, 20)
        temp_dir = tempfile.mkdtemp()
        local_files = []
        
        def download_one(path):
            local_path = os.path.join(temp_dir, os.path.basename(path))
            download_file(request.input_bucket, path, local_path)
            return local_path

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(download_one, path) for path in request.input_paths]
            local_files = [f.result() for f in futures]

        print(f"[MASK] Downloaded {len(local_files)} dark frames")
        await update_job_progress(job_id, 40)

        # Load FITS stack
        dark_stack = []
        for file_path in local_files:
            with fits.open(file_path) as hdul:
                dark_stack.append(hdul[0].data.astype(np.float32))
        
        dark_stack = np.stack(dark_stack)
        print(f"[MASK] Loaded dark stack shape: {dark_stack.shape}")
        await update_job_progress(job_id, 60)

        # Generate masks with user settings
        settings = request.settings
        sigma = settings.get('sigma', 5)
        min_bad_fraction = settings.get('min_bad_fraction', 0.5)
        
        bad_pixel_mask = compute_bad_pixel_mask(dark_stack, sigma=sigma, min_bad_fraction=min_bad_fraction)
        bad_col_mask = compute_bad_column_mask(dark_stack, sigma=sigma)
        bad_row_mask = compute_bad_row_mask(dark_stack, sigma=sigma)
        
        print(f"[MASK] Generated masks - Bad pixels: {np.sum(bad_pixel_mask)}, Bad columns: {np.sum(bad_col_mask)}, Bad rows: {np.sum(bad_row_mask)}")
        await update_job_progress(job_id, 80)

        # Save masks as FITS files
        mask_paths = {}
        
        # Bad pixel mask (2D)
        pixel_mask_path = os.path.join(temp_dir, "bad_pixel_mask.fits")
        fits.writeto(pixel_mask_path, bad_pixel_mask.astype(np.uint8), overwrite=True)
        pixel_storage_path = f"{request.output_base}/bad_pixel_mask.fits"
        upload_file(request.output_bucket, pixel_storage_path, pixel_mask_path)
        mask_paths['bad_pixel_mask'] = pixel_storage_path
        
        # Bad column mask (1D)
        col_mask_path = os.path.join(temp_dir, "bad_column_mask.fits")
        fits.writeto(col_mask_path, bad_col_mask.astype(np.uint8), overwrite=True)
        col_storage_path = f"{request.output_base}/bad_column_mask.fits"
        upload_file(request.output_bucket, col_storage_path, col_mask_path)
        mask_paths['bad_column_mask'] = col_storage_path
        
        # Bad row mask (1D)
        row_mask_path = os.path.join(temp_dir, "bad_row_mask.fits")
        fits.writeto(row_mask_path, bad_row_mask.astype(np.uint8), overwrite=True)
        row_storage_path = f"{request.output_base}/bad_row_mask.fits"
        upload_file(request.output_bucket, row_storage_path, row_mask_path)
        mask_paths['bad_row_mask'] = row_storage_path

        # Generate statistics
        stats = {
            'total_pixels': int(dark_stack.shape[1] * dark_stack.shape[2]),
            'bad_pixels': int(np.sum(bad_pixel_mask)),
            'bad_pixel_percentage': float(np.sum(bad_pixel_mask) / (dark_stack.shape[1] * dark_stack.shape[2]) * 100),
            'total_columns': int(dark_stack.shape[2]),
            'bad_columns': int(np.sum(bad_col_mask)),
            'bad_column_percentage': float(np.sum(bad_col_mask) / dark_stack.shape[2] * 100),
            'total_rows': int(dark_stack.shape[1]),
            'bad_rows': int(np.sum(bad_row_mask)),
            'bad_row_percentage': float(np.sum(bad_row_mask) / dark_stack.shape[1] * 100),
            'settings_used': settings,
            'input_frames': len(local_files)
        }

        # Cleanup temp files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        result = {
            'mask_paths': mask_paths,
            'statistics': stats,
            'project_id': request.project_id,
            'user_id': request.user_id
        }

        await insert_job(job_id, status="success", result=result, progress=100)
        print(f"[{datetime.utcnow().isoformat()}] [MASK] Cosmetic mask generation completed: {job_id}")

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[FAIL] Cosmetic mask generation failed: job_id={job_id}, error={e}\n{tb}", flush=True)
        await insert_job(job_id, status="failed", error=f"Mask generation failed: {e}", progress=100)

@app.post("/patterned-noise/correct")
async def correct_patterned_noise(request: PatternedNoiseRequest, background_tasks: BackgroundTasks):
    """
    Correct patterned noise in astronomical images.
    Returns job_id for async processing.
    """
    try:
        job_id = f"pattern-{uuid.uuid4().hex[:8]}"
        await insert_job(job_id, status="queued", progress=0)
        background_tasks.add_task(run_patterned_noise_job, request, job_id)
        return {"jobId": job_id, "status": "queued"}
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] Exception in /patterned-noise/correct: {e}\n{tb}")
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})

async def run_patterned_noise_job(request: PatternedNoiseRequest, job_id: str):
    """
    Background task to correct patterned noise in images.
    """
    try:
        await update_job_progress(job_id, 10)
        print(f"[{datetime.utcnow().isoformat()}] [PATTERN] Starting patterned noise correction: {job_id}")

        # Download input images
        await update_job_progress(job_id, 20)
        temp_dir = tempfile.mkdtemp()
        local_files = []
        
        def download_one(path):
            local_path = os.path.join(temp_dir, os.path.basename(path))
            download_file(request.input_bucket, path, local_path)
            return local_path

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(download_one, path) for path in request.input_paths]
            local_files = [f.result() for f in futures]

        print(f"[PATTERN] Downloaded {len(local_files)} images")
        await update_job_progress(job_id, 40)

        # Process each image
        corrected_files = []
        pattern_info = []
        settings = request.settings
        
        for i, file_path in enumerate(local_files):
            with fits.open(file_path) as hdul:
                image = hdul[0].data.astype(np.float32)
                header = hdul[0].header
            
            # Auto-detect pattern type if method not specified
            if 'method' not in settings or settings['method'] == 'auto':
                pattern_type, confidence, recommendations = detect_pattern_type(image)
                method = recommendations.get('method', 'none')
                if method == 'none':
                    print(f"[PATTERN] No correction needed for {os.path.basename(file_path)}")
                    corrected_image = image
                    pattern_removed = np.zeros_like(image)
                    correction_info = {'method': 'none', 'pattern_type': pattern_type, 'confidence': confidence}
                else:
                    print(f"[PATTERN] Auto-detected {pattern_type} (confidence: {confidence:.2f}) for {os.path.basename(file_path)}")
                    # Apply recommended method with recommended settings
                    if method == 'median_filter':
                        corrected_image, pattern_removed, star_mask = remove_gradients_median(
                            image,
                            filter_size=recommendations.get('filter_size', 64),
                            preserve_stars=recommendations.get('preserve_stars', True)
                        )
                        correction_info = {
                            'method': 'median_filter',
                            'pattern_type': pattern_type,
                            'confidence': confidence,
                            'filter_size': recommendations.get('filter_size', 64),
                            'stars_protected': int(np.sum(star_mask)) if star_mask is not None else 0
                        }
                    elif method == 'fourier_filter':
                        corrected_image, pattern_removed, freq_mask = remove_striping_fourier(
                            image,
                            direction=recommendations.get('direction', 'both'),
                            strength=recommendations.get('strength', 0.7),
                            frequency_cutoff=recommendations.get('frequency_cutoff', 0.1)
                        )
                        correction_info = {
                            'method': 'fourier_filter',
                            'pattern_type': pattern_type,
                            'confidence': confidence,
                            'direction': recommendations.get('direction', 'both'),
                            'strength': recommendations.get('strength', 0.7)
                        }
                    elif method == 'combined':
                        corrected_image, pattern_removed, details = apply_combined_correction(
                            image,
                            gradient_filter_size=recommendations.get('gradient_filter_size', 64),
                            fourier_strength=recommendations.get('fourier_strength', 0.5)
                        )
                        correction_info = {
                            'method': 'combined',
                            'pattern_type': pattern_type,
                            'confidence': confidence,
                            'gradient_filter_size': recommendations.get('gradient_filter_size', 64),
                            'fourier_strength': recommendations.get('fourier_strength', 0.5)
                        }
            else:
                # Use manually specified method
                method = settings['method']
                if method == 'median_filter':
                    corrected_image, pattern_removed, star_mask = remove_gradients_median(
                        image,
                        filter_size=settings.get('filter_size', 64),
                        preserve_stars=settings.get('preserve_stars', True),
                        star_threshold=settings.get('star_threshold')
                    )
                    correction_info = {'method': 'median_filter', 'manual': True}
                elif method == 'fourier_filter':
                    corrected_image, pattern_removed, freq_mask = remove_striping_fourier(
                        image,
                        direction=settings.get('direction', 'both'),
                        strength=settings.get('strength', 0.7),
                        frequency_cutoff=settings.get('frequency_cutoff', 0.1)
                    )
                    correction_info = {'method': 'fourier_filter', 'manual': True}
                elif method == 'polynomial':
                    corrected_image, pattern_removed, model = remove_background_polynomial(
                        image,
                        degree=settings.get('degree', 2),
                        sigma_clip=settings.get('sigma_clip', 3.0)
                    )
                    correction_info = {'method': 'polynomial', 'manual': True}
                elif method == 'combined':
                    corrected_image, pattern_removed, details = apply_combined_correction(
                        image,
                        gradient_filter_size=settings.get('gradient_filter_size', 64),
                        fourier_strength=settings.get('fourier_strength', 0.5),
                        preserve_stars=settings.get('preserve_stars', True),
                        direction=settings.get('direction', 'both')
                    )
                    correction_info = {'method': 'combined', 'manual': True}
                else:
                    print(f"[PATTERN] Unknown method: {method}")
                    corrected_image = image
                    pattern_removed = np.zeros_like(image)
                    correction_info = {'method': 'none', 'error': f'Unknown method: {method}'}

            # Calculate improvement statistics
            original_std = float(np.std(image))
            corrected_std = float(np.std(corrected_image))
            pattern_std = float(np.std(pattern_removed))
            improvement_pct = (original_std - corrected_std) / original_std * 100 if original_std > 0 else 0

            correction_info.update({
                'original_std': original_std,
                'corrected_std': corrected_std,
                'pattern_std': pattern_std,
                'improvement_percent': improvement_pct,
                'filename': os.path.basename(file_path)
            })
            pattern_info.append(correction_info)

            # Save corrected image
            corrected_filename = f"corrected_{os.path.basename(file_path)}"
            corrected_path = os.path.join(temp_dir, corrected_filename)
            fits.PrimaryHDU(corrected_image, header=header).writeto(corrected_path, overwrite=True)
            corrected_files.append(corrected_path)

            print(f"[PATTERN] Processed {os.path.basename(file_path)}: {improvement_pct:.1f}% improvement")

        await update_job_progress(job_id, 80)

        # Upload corrected images
        corrected_storage_paths = []
        for i, corrected_path in enumerate(corrected_files):
            storage_path = f"{request.output_base}/corrected_{os.path.basename(request.input_paths[i])}"
            upload_file(request.output_bucket, storage_path, corrected_path)
            corrected_storage_paths.append(storage_path)

        # Calculate overall statistics
        total_improvement = np.mean([info['improvement_percent'] for info in pattern_info])
        methods_used = list(set([info['method'] for info in pattern_info]))

        # Cleanup temp files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        result = {
            'corrected_paths': corrected_storage_paths,
            'pattern_analysis': pattern_info,
            'overall_improvement_percent': float(total_improvement),
            'methods_used': methods_used,
            'images_processed': len(local_files),
            'project_id': request.project_id,
            'user_id': request.user_id
        }

        await insert_job(job_id, status="success", result=result, progress=100)
        print(f"[{datetime.utcnow().isoformat()}] [PATTERN] Patterned noise correction completed: {job_id}")

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[FAIL] Patterned noise correction failed: job_id={job_id}, error={e}\n{tb}", flush=True)
        await insert_job(job_id, status="failed", error=f"Pattern correction failed: {e}", progress=100)

async def run_calibration_job(job: CalibrationJobRequest, job_id: str):
    try:
        await insert_job(job_id, status="running", progress=0)
        fits_input_paths = [p for p in job.input_paths if p.lower().endswith((".fit", ".fits"))]
        fits_input_paths = fits_input_paths[:10]
        print(f"[{datetime.utcnow().isoformat()}] [BG] FITS files to process: {fits_input_paths}")
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        output_base_with_ts = f"{job.output_base}_{timestamp}"
        with tempfile.TemporaryDirectory() as tmpdir:
            print(f"[{datetime.utcnow().isoformat()}] [BG] Created tempdir: {tmpdir}")
            local_files = []
            local_light_files = []
            light_input_paths = getattr(job, 'light_input_paths', None)
            dark_scaling = job.settings.get('darkScaling', False)
            # --- Parallel file download optimization ---
            from time import time as _time
            download_start = _time()
            def download_one(args):
                bucket, spath, local_path = args
                try:
                    download_file(bucket, spath, local_path)
                    return local_path
                except Exception as e:
                    print(f"[{datetime.utcnow().isoformat()}] [ERROR] Failed to download {spath}: {e}")
                    return None
            download_args = [(job.input_bucket, spath, os.path.join(tmpdir, f"input_{i}.fits")) for i, spath in enumerate(fits_input_paths)]
            with ThreadPoolExecutor(max_workers=8) as executor:
                local_files = list(executor.map(download_one, download_args))
            local_files = [f for f in local_files if f is not None]
            print(f"[{datetime.utcnow().isoformat()}] [OPT] Downloaded {len(local_files)} files in {(_time() - download_start):.2f} seconds.")
            if light_input_paths:
                light_input_paths = light_input_paths[:10]
                for i, spath in enumerate(light_input_paths):
                    job_status = await get_job(job_id)
                    if job_status and job_status.get("status") == "cancelled":
                        print(f"[CANCEL] Job {job_id} cancelled during light file download.")
                        return
                    if not spath.lower().endswith((".fit", ".fits")):
                        continue
                    local_path = os.path.join(tmpdir, f"light_{i}.fits")
                    print(f"[{datetime.utcnow().isoformat()}] [BG] Downloading light {spath} to {local_path}")
                    try:
                        download_file(job.input_bucket, spath, local_path)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[{datetime.utcnow().isoformat()}] [ERROR] Failed to download light {spath}: {e}\n{tb}")
                        continue
                    local_light_files.append(local_path)
            await update_job_progress(job_id, 30)
            # Cancellation check after downloads
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[CANCEL] Job {job_id} cancelled after downloads.")
                return
            # Bias subtraction logic after download
            frame_type = infer_frame_type(local_files)
            # If frame_type is unknown and job.frame_type is set, use it
            if frame_type == 'unknown' and getattr(job, 'frame_type', None):
                frame_type = job.frame_type
            bias_subtraction = job.settings.get('biasSubtraction', False)
            master_bias_path = job.settings.get('masterBiasPath')
            master_bias_local = None
            if frame_type == 'dark' and bias_subtraction:
                print(f"[{datetime.utcnow().isoformat()}] [BG] Bias subtraction enabled.")
                if master_bias_path:
                    print(f"[{datetime.utcnow().isoformat()}] [BG] Using manually selected master bias: {master_bias_path}")
                    master_bias_local = os.path.join(tmpdir, 'master_bias.fits')
                    try:
                        download_file(job.input_bucket, master_bias_path, master_bias_local)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[{datetime.utcnow().isoformat()}] [ERROR] Failed to download master bias: {e}\n{tb}")
                        await insert_job(job_id, status="failed", error=f"Master bias download failed: {e}", progress=0)
                        return
                else:
                    print(f"[{datetime.utcnow().isoformat()}] [BG] Auto-selecting master bias for project {job.project_id}")
                    bias_prefix = f"{job.user_id}/{job.project_id}/master-bias/"
                    from .supabase_io import list_files
                    bias_files = list_files(job.input_bucket, bias_prefix)
                    bias_fits = [f for f in bias_files if f['name'].lower().endswith(('.fit', '.fits'))]
                    if not bias_fits:
                        print(f"[{datetime.utcnow().isoformat()}] [ERROR] No master bias found for project {job.project_id}")
                        await insert_job(job_id, status="failed", error="No master bias found for this project.", progress=0)
                        return
                    selected_bias = sorted(bias_fits, key=lambda f: f['name'], reverse=True)[0]
                    master_bias_path = bias_prefix + selected_bias['name']
                    master_bias_local = os.path.join(tmpdir, 'master_bias.fits')
                    print(f"[{datetime.utcnow().isoformat()}] [BG] Auto-selected master bias: {master_bias_path}")
                    try:
                        download_file(job.input_bucket, master_bias_path, master_bias_local)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[{datetime.utcnow().isoformat()}] [ERROR] Failed to download master bias: {e}\n{tb}")
                        await insert_job(job_id, status="failed", error=f"Master bias download failed: {e}", progress=0)
                        return
                with fits.open(master_bias_local) as hdul:
                    bias_data = hdul[0].data.astype(np.float32)
                bias_corrected_files = []
                for i, dark_path in enumerate(local_files):
                    # Cancellation check inside bias subtraction loop
                    job_status = await get_job(job_id)
                    if job_status and job_status.get("status") == "cancelled":
                        print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled during bias subtraction.")
                        return
                    with fits.open(dark_path) as hdul:
                        dark_data = hdul[0].data.astype(np.float32)
                        if dark_data.shape != bias_data.shape:
                            print(f"[{datetime.utcnow().isoformat()}] [ERROR] Shape mismatch: dark {dark_data.shape} vs bias {bias_data.shape}")
                            await insert_job(job_id, status="failed", error="Master bias and dark frame shape mismatch.", progress=0)
                            return
                        corrected = dark_data - bias_data
                        corrected_path = os.path.join(tmpdir, f"bias_corrected_{i}.fits")
                        fits.PrimaryHDU(corrected, header=hdul[0].header).writeto(corrected_path, overwrite=True)
                        bias_corrected_files.append(corrected_path)
                local_files = bias_corrected_files
            # Cancellation check after bias subtraction
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled after bias subtraction.")
                return
            # --- Temperature/Exposure Matching for Dark Frames ---
            if frame_type == 'dark':
                temp_matching = job.settings.get('tempMatching', False)
                exposure_matching = job.settings.get('exposureMatching', False)
                # Only filter if at least one is enabled and light frames are available
                if (temp_matching or exposure_matching) and local_light_files:
                    # Get reference temp/exptime from first light frame
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
                            print(f"[WARN] Failed to read FITS for temp/exptime matching: {f}: {e}")
                    if filtered_files:
                        print(f"[MATCH] Using {len(filtered_files)} darks after temp/exptime matching (of {len(local_files)})")
                        local_files = filtered_files
                    else:
                        print(f"[WARN] No darks matched temp/exptime criteria; using all {len(local_files)} darks.")
            # --- Frame validation before stacking ---
            print(f"[{datetime.utcnow().isoformat()}] [DEBUG] Validating frames...", flush=True)
            valid_files = []
            rejected_files = []
            for f in local_files:
                # Cancellation check inside validation loop
                job_status = await get_job(job_id)
                if job_status and job_status.get("status") == "cancelled":
                    print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled during validation.")
                    return
                try:
                    with fits.open(f) as hdul:
                        header = hdul[0].header
                        analysis = analyze_fits_headers(header)
                        is_valid = analysis.confidence >= 0.7 and not any('Missing' in w or 'must' in w for w in analysis.warnings)
                        if is_valid:
                            valid_files.append(f)
                        else:
                            rejected_files.append((f, analysis.warnings))
                except Exception as e:
                    print(f"[{datetime.utcnow().isoformat()}] [ERROR] Exception during validation of {f}: {e}", flush=True)
                    traceback.print_exc()
                    rejected_files.append({'file': os.path.basename(f), 'reason': f'Error reading FITS: {e}'})
            if not valid_files:
                print(f"[FAIL] No valid frames for stacking. All frames rejected. job_id={job_id}, frame_type={frame_type}")
                await insert_job(job_id, status="failed", error="No valid frames for stacking. All frames rejected.", progress=100, result={
                    'used': 0,
                    'rejected': len(rejected_files),
                    'rejected_details': rejected_files
                })
                return
            # Cancellation check after validation
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled after validation.")
                return
            # --- Prepare bad pixel map if provided ---
            bad_pixel_map = None
            bpm_path = job.settings.get('badPixelMapPath')
            if bpm_path:
                # Download BPM FITS file to tempdir
                bpm_local_path = os.path.join(tmpdir, 'bad_pixel_map.fits')
                try:
                    download_file(job.input_bucket, bpm_path, bpm_local_path)
                    with fits.open(bpm_local_path) as hdul:
                        bpm_data = hdul[0].data
                        # Consider nonzero as bad pixel
                        bad_pixel_map = (bpm_data != 0)
                    print(f"[LOG] Loaded bad pixel map from {bpm_path}, shape={bad_pixel_map.shape}, bad pixels={np.sum(bad_pixel_map)}", flush=True)
                except Exception as e:
                    print(f"[ERROR] Failed to load bad pixel map: {e}", flush=True)
                    bad_pixel_map = None
            # --- Superdark support ---
            superdark_used = False
            if frame_type == 'dark' and job.settings.get('superdarkPath'):
                superdark_path = job.settings['superdarkPath']
                print(f"[SUPERDARK] Using Superdark: {superdark_path}")
                superdark_local = os.path.join(tmpdir, 'superdark.fits')
                try:
                    download_file(job.input_bucket, superdark_path, superdark_local)
                    with fits.open(superdark_local) as hdul:
                        master = hdul[0].data.astype(np.float32)
                    valid_files = [superdark_local]  # For stats/diagnostics
                    superdark_used = True
                except Exception as e:
                    tb = traceback.format_exc()
                    print(f"[ERROR] Failed to download or load Superdark: {e}\n{tb}")
                    await insert_job(job_id, status="failed", error=f"Superdark download/load failed: {e}", progress=0)
                    return
                print(f"[SUPERDARK] Superdark loaded and will be used as master dark for calibration.")
            # --- Proceed with stacking only valid files ---
            print(f"[{datetime.utcnow().isoformat()}] [BG] {len(valid_files)} valid frames, {len(rejected_files)} rejected.")
            stats = analyze_frames(valid_files)
            method = job.settings.get('stackingMethod', 'median')
            sigma = float(job.settings.get('sigmaThreshold', 3.0))
            cosmetic = job.settings.get('cosmetic', None)
            cosmetic_method = job.settings.get('cosmeticMethod', 'hot_pixel_map')
            cosmetic_threshold = float(job.settings.get('cosmeticThreshold', 0.5))
            la_cosmic_params = None
            if cosmetic_method == 'la_cosmic':
                la_cosmic_params = job.settings.get('laCosmicParams', None)
            rec_method, rec_sigma, reason = recommend_stacking(stats, method, sigma)
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled before stacking.")
                return
            if not superdark_used:
                master = create_master_frame(
                    valid_files,
                    method=method,
                    sigma_clip=sigma if method in ['sigma', 'winsorized'] else None,
                    cosmetic=cosmetic,
                    cosmetic_method=cosmetic_method,
                    cosmetic_threshold=cosmetic_threshold,
                    la_cosmic_params=la_cosmic_params,
                    bad_pixel_map=bad_pixel_map
                )

            # --- Compute diagnostics/stats for master frame ---
            master_stats = {
                'n_frames': len(valid_files),
                'stacking_method': method,
                'sigma_threshold': sigma if method in ['sigma', 'winsorized'] else None,
                'mean': float(np.mean(master)),
                'median': float(np.median(master)),
                'std': float(np.std(master)),
                'min': float(np.min(master)),
                'max': float(np.max(master)),
            }
            # Outlier count: pixels > 5 sigma from mean
            mean = np.mean(master)
            std = np.std(master)
            outlier_count = int(np.sum(np.abs(master - mean) > 5 * std))
            total_pixels = master.size
            outlier_ratio = outlier_count / total_pixels if total_pixels > 0 else 0
            master_stats['outlier_count'] = outlier_count
            master_stats['outlier_ratio'] = outlier_ratio
            # Histogram (list of bin counts)
            hist, bin_edges = np.histogram(master, bins=64)
            master_stats['histogram'] = hist.tolist()
            master_stats['histogram_bins'] = bin_edges.tolist()
            # Add stacking recommendation reason
            master_stats['recommendation'] = reason

            # --- Calibration Scoring Logic (per frame type) ---
            score = 10
            recommendations = []
            ft = (frame_type or '').lower()
            if ft == 'bias':
                # Bias: low std, no negatives, narrow histogram
                if master_stats['std'] > 15:
                    score -= 2
                    recommendations.append(f"High noise in bias (std={master_stats['std']:.1f}): Check for electronic interference or unstable power.")
                if master_stats['min'] < 0:
                    score -= 1
                    recommendations.append(f"Negative pixel values detected (min={master_stats['min']:.1f}): Check for readout issues.")
                if master_stats['n_frames'] < 20:
                    score -= 2
                    recommendations.append(f"Low number of bias frames ({master_stats['n_frames']}): More frames improve master bias quality.")
                if master_stats['max'] > 60000:
                    score -= 1
                    recommendations.append(f"Saturated pixels detected (max={master_stats['max']:.1f}): Avoid overexposure.")
            elif ft == 'dark':
                # Dark: low outlier ratio, low std, no hot pixels
                if outlier_ratio > 0.005:
                    score -= 3
                    recommendations.append(f"Too many hot pixels in dark (outlier ratio {outlier_ratio:.2%}): Try lower temperature or more frames.")
                if master_stats['std'] > 30:
                    score -= 2
                    recommendations.append(f"High noise in dark (std={master_stats['std']:.1f}): Consider more frames or check cooling.")
                if master_stats['min'] < 0:
                    score -= 1
                    recommendations.append(f"Negative pixel values detected (min={master_stats['min']:.1f}): Check for calibration or readout issues.")
                if master_stats['n_frames'] < 15:
                    score -= 2
                    recommendations.append(f"Low number of dark frames ({master_stats['n_frames']}): More frames improve master dark quality.")
            elif ft == 'flat':
                # Flat: even illumination, no clipping, centered histogram
                if master_stats['min'] < 1000:
                    score -= 1
                    recommendations.append(f"Flat frame underexposed (min={master_stats['min']:.1f}): Increase flat exposure.")
                if master_stats['max'] > 60000:
                    score -= 2
                    recommendations.append(f"Flat frame overexposed (max={master_stats['max']:.1f}): Decrease flat exposure.")
                if master_stats['std'] < 100:
                    score -= 1
                    recommendations.append(f"Flat frame has very low variation (std={master_stats['std']:.1f}): Check for even illumination.")
                if master_stats['n_frames'] < 10:
                    score -= 2
                    recommendations.append(f"Low number of flat frames ({master_stats['n_frames']}): More frames improve master flat quality.")
            else:
                # Generic fallback (for unknown types)
                if outlier_ratio > 0.01:
                    score -= 3
                    recommendations.append(f"High outlier ratio ({outlier_ratio:.2%}): Check for dust, hot pixels, or cosmic rays.")
                if master_stats['std'] > 500:
                    score -= 2
                    recommendations.append(f"High noise (std={master_stats['std']:.1f}): Consider more frames or better calibration.")
                if master_stats['min'] < 0:
                    score -= 1
                    recommendations.append(f"Negative pixel values detected (min={master_stats['min']:.1f}): Check calibration frames for issues.")
                if master_stats['max'] > 60000:
                    score -= 1
                    recommendations.append(f"Saturated pixels detected (max={master_stats['max']:.1f}): Avoid overexposure.")
                if master_stats['n_frames'] < 10:
                    score -= 2
                    recommendations.append(f"Low number of frames ({master_stats['n_frames']}): More frames improve calibration quality.")
            # Clamp score
            score = max(0, min(10, score))
            master_stats['score'] = score
            master_stats['recommendations'] = recommendations

            # Cancellation check after stacking
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled after stacking.")
                return
            # --- Dark scaling logic ---
            if frame_type == 'dark' and dark_scaling:
                from .calibration_worker import estimate_dark_scaling_factor
                try:
                    if superdark_used:
                        print(f"[SUPERDARK] Dark scaling will be applied to Superdark master.")
                        darks_for_scaling = [superdark_local]
                    else:
                        print(f"[{datetime.utcnow().isoformat()}] [BG] Calling estimate_dark_scaling_factor with {len(local_files)} darks and {len(local_light_files)} lights...")
                        darks_for_scaling = local_files
                    if job.settings.get('darkScalingAuto', True):
                        await update_job_progress(job_id, 50)
                        scaling_factor = estimate_dark_scaling_factor(darks_for_scaling, local_light_files if local_light_files else None)
                        print(f"[{datetime.utcnow().isoformat()}] [BG] Auto-estimated dark scaling factor: {scaling_factor:.4f}")
                    else:
                        scaling_factor = float(job.settings.get('darkScalingFactor', 1.0))
                        print(f"[{datetime.utcnow().isoformat()}] [BG] Manual dark scaling factor: {scaling_factor:.4f}")
                    master = master * scaling_factor
                    await update_job_progress(job_id, 60)
                except Exception as e:
                    tb = traceback.format_exc()
                    print(f"[{datetime.utcnow().isoformat()}] [ERROR] Exception in dark scaling: {e}\n{tb}")
                    await insert_job(job_id, status="failed", error=f"Dark scaling failed: {e}\n{tb}", progress=40)
                    return
            else:
                await update_job_progress(job_id, 60)
            # Cancellation check before saving results
            job_status = await get_job(job_id)
            if job_status and job_status.get("status") == "cancelled":
                print(f"[{datetime.utcnow().isoformat()}] [CANCEL] Job {job_id} cancelled before saving results.")
                return
            fits_path = os.path.join(tmpdir, 'master.fits')
            png_path = os.path.join(tmpdir, 'master.png')
            print(f"[{datetime.utcnow().isoformat()}] [BG] Running save_master_frame...")
            save_master_frame(master, fits_path)
            print(f"[{datetime.utcnow().isoformat()}] [BG] Running save_master_preview...")
            save_master_preview(master, png_path)
            await update_job_progress(job_id, 75)
            fits_storage_path = output_base_with_ts + '.fits'
            png_storage_path = output_base_with_ts + '.png'
            # --- Upload PNG preview first, notify frontend, then upload FITS in background ---
            print(f"[{datetime.utcnow().isoformat()}] [BG] About to upload PNG to Supabase: {png_storage_path}")
            try:
                preview_url = upload_file(job.output_bucket, png_storage_path, png_path, public=True)
            except Exception as e:
                tb = traceback.format_exc()
                print(f"[{datetime.utcnow().isoformat()}] [ERROR] Failed to upload PNG: {e}\n{tb}")
                await insert_job(job_id, status="failed", error=f"PNG upload failed: {e}", progress=80)
                return
            print(f"[{datetime.utcnow().isoformat()}] [BG] Preview PNG uploaded to: {png_storage_path}")
            print(f"[{datetime.utcnow().isoformat()}] [BG] Preview public URL: {preview_url}")
            await update_job_progress(job_id, 98)
            # --- Mark job as success for the frontend as soon as preview is ready ---
            # Always include project_id, user_id, and frameType in result JSON
            base_result = {
                "projectId": job.project_id,
                "userId": job.user_id,
                "frameType": frame_type,
                "preview_url": preview_url,
                "preview_png_path": png_storage_path
            }
            await insert_job(job_id, status="success", result=base_result, diagnostics=master_stats, warnings=[], error=None, progress=100)
            print(f"[{datetime.utcnow().isoformat()}] [BG] Notified frontend of preview availability.")
            # Now upload the FITS file in the background (does not block user)
            def upload_fits_bg():
                try:
                    print(f"[{datetime.utcnow().isoformat()}] [BG] (background) About to upload FITS to Supabase: {fits_storage_path}")
                    upload_file(job.output_bucket, fits_storage_path, fits_path, public=False)
                    print(f"[{datetime.utcnow().isoformat()}] [BG] (background) FITS file uploaded to Supabase: {fits_storage_path}")
                    # Optionally update job result with fits_path
                    import asyncio
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    fits_result = {
                        **base_result,
                        "fits_path": fits_storage_path
                    }
                    print(f"[LOG] Background thread updating result for job {job_id} (not overwriting diagnostics)", flush=True)
                    loop.run_until_complete(insert_job(job_id, status="success", result=fits_result, diagnostics=None, warnings=[], error=None, progress=100))
                    loop.close()
                except Exception as e:
                    print(f"[{datetime.utcnow().isoformat()}] [ERROR] (background) Failed to upload FITS: {e}")
            import threading
            threading.Thread(target=upload_fits_bg, daemon=True).start()
            print(f"[{datetime.utcnow().isoformat()}] [BG] Calibration job {job_id} completed successfully.")
            # --- Feedback for frontend ---
            # Merge previous result with used/rejected counts
            job_status = await get_job(job_id)
            current_result = json.loads(job_status.get("result") or "{}")
            final_result = {
                **current_result,
                'used': len(valid_files),
                'rejected': len(rejected_files),
                'rejected_details': rejected_files,
                'master_stats': master_stats,
                "projectId": job.project_id,
                "userId": job.user_id,
                "frameType": frame_type
            }
            print(f"[LOG] Final master_stats for job {job_id}: {json.dumps(master_stats)}", flush=True)
            await insert_job(job_id, status="success", progress=100, result=final_result, diagnostics=master_stats)
            print(f"[LOG] Final insert_job called for job {job_id} with diagnostics.", flush=True)
            # --- Per-light Dark Optimization ---
            if frame_type == 'dark' and job.settings.get('darkOptimization', False) and local_light_files:
                print(f"[OPT] Per-light dark optimization enabled. Matching each light to master dark.")
                # Load master dark (already stacked)
                master_dark = master
                optimized_lights = []
                scaling_factors = []
                for light_path in local_light_files:
                    with fits.open(light_path) as hdul:
                        light_data = hdul[0].data.astype(np.float32)
                    # Compute scaling factor (median ratio)
                    median_light = np.median(light_data)
                    median_dark = np.median(master_dark)
                    scaling = median_light / median_dark if median_dark != 0 else 1.0
                    scaling = max(0.5, min(2.0, scaling))
                    scaled_dark = master_dark * scaling
                    optimized = light_data - scaled_dark
                    optimized_lights.append(optimized)
                    scaling_factors.append(scaling)
                print(f"[OPT] Used scaling factors for each light: {scaling_factors}")
                # Stack optimized lights using the selected method
                arr = np.stack(optimized_lights, axis=0)
                if method == 'median':
                    master = np.median(arr, axis=0)
                elif method == 'mean':
                    master = np.mean(arr, axis=0)
                elif method == 'sigma':
                    if sigma is None:
                        sigma = 3.0
                    med = np.median(arr, axis=0)
                    std = np.std(arr, axis=0)
                    mask = np.abs(arr - med) < (sigma * std)
                    master = np.mean(np.where(mask, arr, np.nan), axis=0)
                    master = np.nan_to_num(master)
                else:
                    master = np.median(arr, axis=0)  # fallback
                print(f"[OPT] Per-light dark optimization complete. Stacked {len(optimized_lights)} optimized lights.")
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[FAIL] Calibration job failed: job_id={job_id}, frame_type={getattr(job, 'frame_type', 'unknown')}, error={e}\n{tb}", flush=True)
        await insert_job(job_id, status="failed", error=f"Calibration job failed: {e}", progress=100)
        return

@app.post("/jobs/submit")
async def submit_job(job: CalibrationJobRequest, request: Request, background_tasks: BackgroundTasks):
    try:
        print(f"[{datetime.utcnow().isoformat()}] [API] /jobs/submit called. Raw body: {await request.body()}")
        print(f"[{datetime.utcnow().isoformat()}] [API] Parsed job: {job.dict()}")
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        await insert_job(job_id, status="queued", progress=0)
        print(f"[{datetime.utcnow().isoformat()}] [API] Queued calibration job: {job_id}")
        background_tasks.add_task(run_calibration_job, job, job_id)
        return {"jobId": job_id}
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[{datetime.utcnow().isoformat()}] [API ERROR] Exception in /jobs/submit: {e}\n{tb}")
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})

@app.get("/jobs/status")
async def get_job_status(job_id: str):
    # Check in-memory storage first
    if job_id in job_results:
        job = job_results[job_id]
        return {
            "job_id": job_id,
            "status": job["status"],
            "created_at": job.get("created_at", ""),
            "error": job.get("error"),
            "progress": job.get("progress", 0)
        }
    
    # Fallback to database if available
    try:
        job = await get_job(job_id)
        if job:
            return {
                "job_id": job_id,
                "status": job["status"],
                "created_at": job["created_at"],
                "error": job["error"],
                "progress": job.get("progress", 0)
            }
    except:
        pass  # Database not available
        
    raise HTTPException(status_code=404, detail="Job not found")

@app.get("/jobs/results")
async def get_job_results(job_id: str):
    job = None
    
    # Check in-memory storage first
    if job_id in job_results:
        job = job_results[job_id]
    else:
        # Fallback to database if available
        try:
            job = await get_job(job_id)
        except:
            pass  # Database not available
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] != "success":
        # 5. Add Retry-After header for 202
        from fastapi.responses import Response
        return Response(
            content=json.dumps({"detail": "Job not complete"}),
            status_code=202,
            headers={"Retry-After": "2"},
            media_type="application/json"
        )
    
    # Handle both in-memory (already parsed) and database (stringified) results
    if isinstance(job.get("result"), dict):
        # In-memory storage - already parsed
        results = job["result"]
        diagnostics = job.get("diagnostics", {})
        warnings = job.get("warnings", [])
    else:
        # Database storage - needs parsing
        results = json.loads(job["result"]) if job["result"] else {}
        diagnostics = json.loads(job["diagnostics"]) if job.get("diagnostics") else {}
        warnings = json.loads(job["warnings"]) if job.get("warnings") else []
    
    return {
        "job_id": job_id,
        "result": results,  # Changed from "results" to "result" to match expected format
        "diagnostics": diagnostics,
        "warnings": warnings,
        "error": job.get("error")
    }

@app.get("/jobs/{job_id}/progress")
async def get_job_progress(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    print(f"[{datetime.utcnow().isoformat()}] [API] Progress for {job_id}: {job.get('progress', 0)} status={job['status']}")
    return {"job_id": job_id, "progress": job.get("progress", 0), "status": job["status"]}

def generate_png_preview(fits_path, png_path, downsample_to=512):
    with fits.open(fits_path) as hdul:
        data = hdul[0].data.astype(np.float32)
        # Downsample for preview
        if data.shape[0] > downsample_to or data.shape[1] > downsample_to:
            factor = max(data.shape[0] // downsample_to, data.shape[1] // downsample_to)
            data = data[::factor, ::factor]
        vmin, vmax = np.percentile(data, [0.1, 99.9])
        data = np.clip(data, vmin, vmax)
        # 8. Handle NaNs/infs robustly
        norm = (data - vmin) / (vmax - vmin) * 255
        norm = np.nan_to_num(norm)  # Already handles NaNs/infs
        img = Image.fromarray(norm.astype(np.uint8), mode='L')
        img.save(png_path, format='PNG')

# Example usage after uploading a FITS file to Supabase:
#
# with tempfile.TemporaryDirectory() as tmpdir:
#     local_fits = os.path.join(tmpdir, "file.fits")
#     local_png = os.path.join(tmpdir, "preview.png")
#     # Download the just-uploaded FITS file from Supabase to local_fits
#     download_file("raw-frames", file_path, local_fits)
#     # Generate PNG preview
#     generate_png_preview(local_fits, local_png)
#     # Upload PNG to Supabase at the same path but with .png extension
#     preview_path = file_path.rsplit('.', 1)[0] + '.png'
#     upload_file("raw-frames", preview_path, local_png, public=False)

@app.post("/superdark/create")
async def create_superdark(request: Request):
    data = await request.json()
    user_id = data.get('userId')
    superdark_name = data.get('superdarkName')
    input_paths = data.get('input_paths', [])
    stacking_method = data.get('stackingMethod', 'median')
    sigma = float(data.get('sigma', 3.0))
    project_id = data.get('projectId', None)
    input_bucket = data.get('input_bucket', 'raw-frames')
    output_bucket = data.get('output_bucket', 'superdarks')
    temp_files = data.get('tempFiles', [])  # List of temp files to clean up
    
    # Validate input
    if not user_id or not superdark_name or not input_paths:
        return JSONResponse(status_code=400, content={"error": "Missing required fields."})
    
    # Download all files to tempdir
    import tempfile, os
    from .supabase_io import download_file, upload_file
    from .fits_analysis import analyze_fits_headers
    from .calibration_worker import create_master_frame
    from astropy.io import fits
    import numpy as np
    
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            local_files = []
            metadata_list = []
            for i, spath in enumerate(input_paths):
                local_path = os.path.join(tmpdir, f"input_{i}.fits")
                try:
                    download_file(input_bucket, spath, local_path)
                    local_files.append(local_path)
                    with fits.open(local_path) as hdul:
                        header = hdul[0].header
                        analysis = analyze_fits_headers(header)
                        meta = {
                            'name': os.path.basename(spath),
                            'camera': header.get('INSTRUME'),
                            'size': hdul[0].data.shape,
                            'binning': f"{header.get('XBINNING', 1)}x{header.get('YBINNING', 1)}",
                            'temp': header.get('CCD-TEMP'),
                            'exposure': header.get('EXPTIME'),
                            'gain': header.get('GAIN'),
                        }
                        metadata_list.append(meta)
                except Exception as e:
                    return JSONResponse(status_code=400, content={"error": f"Failed to download or read FITS: {spath}, {e}"})
            
            # Validate metadata: all must match (with tolerance for temp)
            def all_equal(lst):
                return all(x == lst[0] for x in lst)
            
            cameras = [m['camera'] for m in metadata_list]
            sizes = [m['size'] for m in metadata_list]
            binnings = [m['binning'] for m in metadata_list]
            exposures = [m['exposure'] for m in metadata_list]
            gains = [m['gain'] for m in metadata_list]
            temps = [m['temp'] for m in metadata_list if m['temp'] is not None]
            
            if not all_equal(cameras):
                return JSONResponse(status_code=400, content={"error": "All files must be from the same camera."})
            if not all_equal(sizes):
                return JSONResponse(status_code=400, content={"error": "All files must have the same image size."})
            if not all_equal(binnings):
                return JSONResponse(status_code=400, content={"error": "All files must have the same binning."})
            # Exposure time can vary for superdarks; just record the range
            if not all_equal(gains):
                return JSONResponse(status_code=400, content={"error": "All files must have the same gain."})
            if temps and (max(temps) - min(temps) > 1.0):
                return JSONResponse(status_code=400, content={"error": "All files must have similar temperature (±1°C)."})
            
            # Stack files
            master = create_master_frame(
                local_files,
                method=stacking_method,
                sigma_clip=sigma if stacking_method in ['sigma', 'winsorized'] else None,
                cosmetic=None,
                cosmetic_method=None,
                cosmetic_threshold=None,
                la_cosmic_params=None,
                bad_pixel_map=None
            )
            
            # Save Superdark
            from datetime import datetime
            fits_path = os.path.join(tmpdir, 'superdark.fits')
            fits.PrimaryHDU(master).writeto(fits_path, overwrite=True)
            storage_path = f"{user_id}/{project_id}/{superdark_name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.fits"
            
            try:
                upload_file(output_bucket, storage_path, fits_path, public=True)
                
                # Generate and upload preview
                png_path = os.path.join(tmpdir, 'superdark_preview.png')
                generate_png_preview(fits_path, png_path)
                preview_storage_path = storage_path.replace('.fits', '_preview.png')
                upload_file(output_bucket, preview_storage_path, png_path, public=True)
                
            except Exception as e:
                return JSONResponse(status_code=500, content={"error": f"Failed to upload Superdark: {e}"})
        
        # Clean up temporary files after successful superdark creation
        if temp_files:
            logger.info(f"[Superdark] Cleaning up {len(temp_files)} temporary files...")
            cleanup_errors = []
            
            for temp_file in temp_files:
                try:
                    from .supabase_io import delete_file
                    delete_success = delete_file(input_bucket, temp_file)
                    if delete_success:
                        logger.info(f"[Superdark] Successfully deleted temp file: {temp_file}")
                    else:
                        logger.warning(f"[Superdark] Failed to delete temp file: {temp_file}")
                        cleanup_errors.append(temp_file)
                except Exception as e:
                    logger.error(f"[Superdark] Error deleting temp file {temp_file}: {e}")
                    cleanup_errors.append(temp_file)
            
            if cleanup_errors:
                logger.warning(f"[Superdark] Failed to clean up some temp files: {cleanup_errors}")
        
        # Add exposure range to metadata
        exposure_range = [min(exposures), max(exposures)] if exposures else [None, None]
        
        return JSONResponse(
            status_code=200,
            content={
                "superdarkPath": storage_path, 
                "bucket": output_bucket, 
                "metadata": metadata_list, 
                "exposure_range": exposure_range,
                "previewPath": preview_storage_path if 'preview_storage_path' in locals() else None,
                "tempFilesCleanedUp": len(temp_files) if temp_files else 0
            }
        )
        
    except Exception as e:
        logger.error(f"[Superdark] Error creating superdark: {e}")
        
        # Clean up temp files even if superdark creation failed
        if temp_files:
            logger.info(f"[Superdark] Cleaning up {len(temp_files)} temp files due to error...")
            for temp_file in temp_files:
                try:
                    from .supabase_io import delete_file
                    delete_file(input_bucket, temp_file)
                    logger.info(f"[Superdark] Cleaned up temp file after error: {temp_file}")
                except Exception as cleanup_err:
                    logger.error(f"[Superdark] Failed to clean up temp file {temp_file}: {cleanup_err}")
        
        return JSONResponse(
            status_code=500, 
            content={"error": f"Failed to create superdark: {str(e)}"}
        )

@app.post("/analyze-temp-file")
async def analyze_temp_file(request: Request):
    """Analyze a temporary file for metadata validation and compatibility checking."""
    try:
        body = await request.json()
        temp_path = body.get('tempPath')
        user_id = body.get('userId')
        bucket = body.get('bucket', 'raw-frames')
        
        if not temp_path or not user_id:
            raise HTTPException(status_code=400, detail="Missing tempPath or userId")
        
        # Create a local temporary file for analysis
        with tempfile.NamedTemporaryFile(delete=False, suffix='.fits') as temp_file:
            temp_file_path = temp_file.name
        
        try:
            # Download the temp file from Supabase to local temp file
            from .supabase_io import download_file
            download_file(bucket, temp_path, temp_file_path)
            
            # Open and analyze the FITS file
            with fits.open(temp_file_path) as hdul:
                header = hdul[0].header
                
                # Extract metadata
                metadata = extract_metadata(header)
                
                # Determine frame type
                frame_type = get_frame_type_from_header(header)
                
                # Validate required metadata for superdark creation
                validation_results = {
                    "has_required_metadata": True,
                    "missing_fields": [],
                    "warnings": [],
                    "quality_score": 100
                }
                
                # Check for critical metadata fields
                required_fields = {
                    'instrument': metadata.get('instrument'),
                    'binning': metadata.get('binning'),
                    'gain': metadata.get('gain'),
                    'temperature': metadata.get('temperature'),
                    'exposure_time': metadata.get('exposure_time')
                }
                
                for field, value in required_fields.items():
                    if value is None or value == '':
                        validation_results["missing_fields"].append(field)
                        validation_results["has_required_metadata"] = False
                        validation_results["quality_score"] -= 20
                
                # Check for frame type consistency
                if frame_type != 'dark':
                    validation_results["warnings"].append(f"Frame type detected as '{frame_type}', expected 'dark'")
                    validation_results["quality_score"] -= 10
                
                # Check for reasonable temperature range (-50°C to +50°C)
                temp = metadata.get('temperature')
                if temp is not None:
                    if temp < -50 or temp > 50:
                        validation_results["warnings"].append(f"Unusual temperature: {temp}°C (expected -50°C to +50°C)")
                        validation_results["quality_score"] -= 5
                
                # Check for reasonable gain values using camera-aware validation
                gain = metadata.get('gain')
                if gain is not None:
                    camera_name = metadata.get('instrument', '')
                    max_gain = get_camera_max_gain(camera_name)
                    
                    if max_gain > 0:
                        # Camera-specific validation
                        if gain > max_gain:
                            validation_results["warnings"].append(f"Gain ({gain}) exceeds camera maximum ({max_gain})")
                            validation_results["quality_score"] -= 5
                        elif gain < 0.1:
                            validation_results["warnings"].append(f"Gain ({gain}) is unusually low (minimum ~0.1)")
                            validation_results["quality_score"] -= 5
                    else:
                        # Unknown camera - use generous threshold
                        if gain > 1000:
                            validation_results["warnings"].append(f"Gain ({gain}) is unusually high (>1000)")
                            validation_results["quality_score"] -= 5
                        elif gain < 0.1:
                            validation_results["warnings"].append(f"Gain ({gain}) is unusually low (minimum ~0.1)")
                            validation_results["quality_score"] -= 5
                
                # Check for reasonable exposure time (1s to 3600s for darks)
                exp_time = metadata.get('exposure_time')
                if exp_time is not None:
                    if exp_time < 1 or exp_time > 3600:
                        validation_results["warnings"].append(f"Unusual exposure time: {exp_time}s (expected 1s to 3600s)")
                        validation_results["quality_score"] -= 5
                
                # Check image dimensions
                if len(hdul[0].data.shape) != 2:
                    validation_results["warnings"].append("Image is not 2D")
                    validation_results["quality_score"] -= 15
                else:
                    height, width = hdul[0].data.shape
                    if height < 100 or width < 100:
                        validation_results["warnings"].append(f"Very small image: {width}x{height}")
                        validation_results["quality_score"] -= 10
                    elif height > 10000 or width > 10000:
                        validation_results["warnings"].append(f"Very large image: {width}x{height}")
                        validation_results["quality_score"] -= 5
                
                # Get file size from the downloaded temp file
                file_size_mb = round(os.path.getsize(temp_file_path) / 1024 / 1024, 2)
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "type": frame_type,
                        "metadata": metadata,
                        "path": temp_path,
                        "validation": validation_results,
                        "file_size_mb": file_size_mb,
                        "image_dimensions": list(hdul[0].data.shape) if len(hdul[0].data.shape) == 2 else None
                    }
                )
        except Exception as e:
            logger.error(f"Error processing temp file {temp_path}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
        finally:
            # Clean up local temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing temp file: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

@app.post("/analyze-superdark")
async def analyze_superdark(request: Request):
    """Analyze a superdark FITS file and provide quality score."""
    try:
        body = await request.json()
        superdark_path = body.get('superdark_path')
        bucket = body.get('bucket', 'superdarks')
        
        if not superdark_path:
            raise HTTPException(status_code=400, detail="Missing superdark_path")
        
        # Download the superdark file to local temp file
        with tempfile.NamedTemporaryFile(suffix='.fits', delete=False) as temp_file:
            local_temp_path = temp_file.name
            
        try:
            # Download from Supabase storage
            download_file(bucket, superdark_path, local_temp_path)
            
            # Analyze the FITS file
            with fits.open(local_temp_path) as hdul:
                header = hdul[0].header
                data = hdul[0].data
                
                if data is None:
                    return JSONResponse(
                        status_code=400,
                        content={'success': False, 'error': 'No image data found in superdark'}
                    )
                
                # Calculate comprehensive statistics
                mean_val = float(np.mean(data))
                median_val = float(np.median(data))
                std_val = float(np.std(data))
                min_val = float(np.min(data))
                max_val = float(np.max(data))
                
                # Calculate quality metrics
                recommendations = []
                score = 10.0  # Start with perfect score
                
                # 1. Check for proper dark signal level
                if mean_val < 100:
                    recommendations.append("Very low dark signal - excellent thermal performance")
                elif mean_val < 500:
                    recommendations.append("Good dark signal level for calibration")
                elif mean_val < 1000:
                    recommendations.append("Moderate dark signal - consider cooling")
                    score -= 1.0
                else:
                    recommendations.append("High dark signal - improved cooling recommended")
                    score -= 2.0
                
                # 2. Check noise characteristics
                noise_ratio = std_val / mean_val if mean_val > 0 else float('inf')
                if noise_ratio < 0.1:
                    recommendations.append("Excellent noise characteristics")
                elif noise_ratio < 0.2:
                    recommendations.append("Good noise performance")
                elif noise_ratio < 0.4:
                    recommendations.append("Moderate noise levels")
                    score -= 0.5
                else:
                    recommendations.append("High noise levels detected")
                    score -= 1.5
                
                # 3. Check for saturation
                saturation_threshold = 60000  # Conservative threshold
                saturated_pixels = np.sum(data >= saturation_threshold)
                total_pixels = data.size
                saturation_percent = (saturated_pixels / total_pixels) * 100
                
                if saturation_percent == 0:
                    recommendations.append("No saturated pixels - excellent exposure")
                elif saturation_percent < 0.1:
                    recommendations.append("Minimal saturation - good exposure time")
                elif saturation_percent < 1.0:
                    recommendations.append("Some saturation detected - consider shorter exposure")
                    score -= 1.0
                else:
                    recommendations.append("Significant saturation - reduce exposure time")
                    score -= 2.0
                
                # 4. Check for uniformity (standard deviation across the frame)
                # Sample different regions to check for amp glow or gradients
                h, w = data.shape
                regions = [
                    data[h//4:3*h//4, w//4:3*w//4],  # Center
                    data[:h//4, :w//4],               # Top-left
                    data[:h//4, 3*w//4:],             # Top-right
                    data[3*h//4:, :w//4],             # Bottom-left
                    data[3*h//4:, 3*w//4:]            # Bottom-right
                ]
                
                region_means = [np.mean(region) for region in regions]
                uniformity = np.std(region_means) / np.mean(region_means) if np.mean(region_means) > 0 else 0
                
                if uniformity < 0.05:
                    recommendations.append("Excellent frame uniformity")
                elif uniformity < 0.15:
                    recommendations.append("Good frame uniformity")
                elif uniformity < 0.3:
                    recommendations.append("Some non-uniformity detected")
                    score -= 0.5
                else:
                    recommendations.append("Poor uniformity - check for amp glow")
                    score -= 1.5
                
                # 5. Check for hot pixels
                hot_pixel_threshold = mean_val + 5 * std_val
                hot_pixels = np.sum(data > hot_pixel_threshold)
                hot_pixel_percent = (hot_pixels / total_pixels) * 100
                
                if hot_pixel_percent < 0.01:
                    recommendations.append("Very few hot pixels detected")
                elif hot_pixel_percent < 0.1:
                    recommendations.append("Low hot pixel count")
                elif hot_pixel_percent < 0.5:
                    recommendations.append("Moderate hot pixel count")
                    score -= 0.5
                else:
                    recommendations.append("High hot pixel count - consider dark optimization")
                    score -= 1.0
                
                # Ensure score is within bounds
                score = max(0.0, min(10.0, score))
                score = round(score, 1)
                
                # Generate histogram for display
                hist, bins = np.histogram(data.flatten(), bins=100, range=(min_val, max_val))
                
                return {
                    'success': True,
                    'score': score,
                    'recommendations': recommendations,
                    'stats': {
                        'min': min_val,
                        'max': max_val,
                        'mean': mean_val,
                        'median': median_val,
                        'std': std_val
                    },
                    'metrics': {
                        'noise_ratio': round(noise_ratio, 3),
                        'saturation_percent': round(saturation_percent, 3),
                        'uniformity': round(uniformity, 3),
                        'hot_pixel_percent': round(hot_pixel_percent, 3)
                    },
                    'histogram': hist.tolist()
                }
        
        finally:
            # Clean up temp file
            if os.path.exists(local_temp_path):
                os.unlink(local_temp_path)
    
    except Exception as e:
        logger.error(f"Error analyzing superdark {superdark_path}: {e}")
        return JSONResponse(
            status_code=500,
            content={'success': False, 'error': str(e)}
        )

class TrailDetectRequest(BaseModel):
    fits_path: str = None  # Path to FITS file in storage
    sensitivity: float = 0.5
    min_length: int = 30
    mask_output: bool = True
    preview_output: bool = True
    output_dir: str = "output"

@app.post("/trails/detect")
async def trails_detect(
    file: UploadFile = File(None),
    request: TrailDetectRequest = None
):
    """
    Detect satellite/airplane trails in a FITS image. Accepts either a direct file upload or a path to a FITS file.
    """
    try:
        if file is not None:
            # Save uploaded file to temp
            with tempfile.NamedTemporaryFile(delete=False, suffix=".fits") as tmp:
                tmp.write(await file.read())
                fits_path = tmp.name
        elif request and request.fits_path:
            fits_path = request.fits_path
        else:
            raise HTTPException(status_code=400, detail="No FITS file provided.")
        # Run detection
        result = detect_trails(
            fits_path,
            sensitivity=request.sensitivity if request else 0.5,
            min_length=request.min_length if request else 30,
            mask_output=request.mask_output if request else True,
            preview_output=request.preview_output if request else True,
            output_dir=request.output_dir if request else "output"
        )
        # Clean up temp file if uploaded
        if file is not None:
            os.remove(fits_path)
        return result
    except Exception as e:
        logger.error(f"Trail detection error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class OutlierDetectRequest(BaseModel):
    fits_paths: list[str] = None  # Either full paths OR just filenames
    bucket: str = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: str = None
    user_id: str = None 
    frame_type: str = None  # 'bias', 'dark', 'flat'
    sigma_thresh: float = 3.0

@app.post("/outliers/detect")
async def outliers_detect(request: OutlierDetectRequest):
    """
    Detect outlier frames in a stack of FITS files.
    """
    try:
        fits_paths = request.fits_paths
        logger.info(f"Original fits_paths: {fits_paths}")
        
        # If fits_paths are just filenames, construct full bucket paths
        if request.bucket and request.project_id and request.user_id and request.frame_type:
            fits_paths = [f"{request.user_id}/{request.project_id}/{request.frame_type}/{filename}" 
                         for filename in request.fits_paths]
            logger.info(f"Constructed bucket paths: {fits_paths}")
            logger.info(f"Using bucket: {request.bucket}")
        
        # Download files from Supabase and process locally
        local_paths = []
        try:
            if request.bucket:
                # Download files from Supabase bucket with fallback support
                request_info = {
                    'project_id': request.project_id,
                    'user_id': request.user_id,
                    'frame_type': request.frame_type
                }
                for remote_path in fits_paths:
                    local_temp_path = f"/tmp/{os.path.basename(remote_path)}"
                    success = await download_file_with_fallback(request.bucket, remote_path, local_temp_path, request_info)
                    if success:
                        local_paths.append(local_temp_path)
                
                # Run outlier detection on local files
                if local_paths:
                    logger.info(f"Successfully downloaded {len(local_paths)} files, running outlier detection")
                    result = detect_outlier_frames(local_paths, sigma_thresh=request.sigma_thresh)
                    
                    # Replace local paths with original remote paths in results
                    for i, remote_path in enumerate(fits_paths[:len(local_paths)]):
                        # Update good frames
                        for frame in result['good']:
                            if frame['path'] == local_paths[i]:
                                frame['path'] = remote_path
                        # Update outlier frames  
                        for frame in result['outliers']:
                            if frame['path'] == local_paths[i]:
                                frame['path'] = remote_path
                    
                    return result
                else:
                    logger.error(f"No valid files found. Attempted to download {len(fits_paths)} files from bucket {request.bucket}")
                    return JSONResponse(status_code=400, content={
                        "error": f"No valid files found. Attempted paths: {fits_paths[:3]}{'...' if len(fits_paths) > 3 else ''}"
                    })
            else:
                # Direct file path processing (for local testing)
                result = detect_outlier_frames(fits_paths, sigma_thresh=request.sigma_thresh)
                return result
                
        finally:
            # Clean up downloaded temp files
            for local_path in local_paths:
                if os.path.exists(local_path):
                    os.remove(local_path)
                    
    except Exception as e:
        logger.error(f"Outlier detection error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class FrameConsistencyRequest(BaseModel):
    fits_paths: list[str] = None  # Either full paths OR just filenames
    bucket: str = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: str = None
    user_id: str = None 
    frame_type: str = None  # 'bias', 'dark', 'flat'
    consistency_threshold: float = 0.7  # Minimum consistency score (0-1)
    sigma_threshold: float = 2.5  # Sigma threshold for outlier detection
    min_frames: int = 5  # Minimum frames to recommend
    max_frames: Optional[int] = None  # Maximum frames to recommend

@app.post("/frames/consistency")
async def analyze_frames_consistency(request: FrameConsistencyRequest):
    """
    Analyze frame-to-frame consistency in a set of calibration frames.
    Provides detailed consistency metrics and frame selection recommendations.
    """
    try:
        fits_paths = request.fits_paths
        logger.info(f"Original fits_paths: {fits_paths}")
        
        # If fits_paths are just filenames, construct full bucket paths
        if request.bucket and request.project_id and request.user_id and request.frame_type:
            fits_paths = [f"{request.user_id}/{request.project_id}/{request.frame_type}/{filename}" 
                         for filename in request.fits_paths]
            logger.info(f"Constructed bucket paths: {fits_paths}")
            logger.info(f"Using bucket: {request.bucket}")
        
        # Download files from Supabase and process locally
        local_paths = []
        try:
            if request.bucket:
                # Download files from Supabase bucket with fallback support
                request_info = {
                    'project_id': request.project_id,
                    'user_id': request.user_id,
                    'frame_type': request.frame_type
                }
                for remote_path in fits_paths:
                    local_temp_path = f"/tmp/{os.path.basename(remote_path)}"
                    success = await download_file_with_fallback(request.bucket, remote_path, local_temp_path, request_info)
                    if success:
                        local_paths.append(local_temp_path)
                
                # Run consistency analysis on local files
                if len(local_paths) >= 2:
                    logger.info(f"Successfully downloaded {len(local_paths)} files, running consistency analysis")
                    
                    # Run consistency analysis
                    analysis = analyze_frame_consistency(
                        local_paths, 
                        consistency_threshold=request.consistency_threshold,
                        sigma_threshold=request.sigma_threshold
                    )
                    
                    # Get frame selection recommendations
                    selection_advice = suggest_frame_selection(
                        analysis,
                        min_frames=request.min_frames,
                        max_frames=request.max_frames
                    )
                    
                    # Replace local paths with original remote paths in results
                    path_mapping = {local_paths[i]: fits_paths[i] for i in range(len(local_paths))}
                    
                    # Update frame metrics with original paths
                    for metric in analysis.metrics_by_frame:
                        if metric.path in path_mapping:
                            metric.path = path_mapping[metric.path]
                    
                    # Update frame lists with original paths
                    analysis.recommended_frames = [path_mapping.get(p, p) for p in analysis.recommended_frames]
                    analysis.questionable_frames = [path_mapping.get(p, p) for p in analysis.questionable_frames]
                    analysis.rejected_frames = [path_mapping.get(p, p) for p in analysis.rejected_frames]
                    
                    # Update selection advice with original paths
                    selection_advice['selected_frames'] = [path_mapping.get(p, p) for p in selection_advice['selected_frames']]
                    selection_advice['excluded_frames'] = [path_mapping.get(p, p) for p in selection_advice['excluded_frames']]
                    
                    # Convert dataclass to dict for JSON serialization
                    response_data = {
                        'success': True,
                        'n_frames': analysis.n_frames,
                        'overall_consistency': analysis.overall_consistency,
                        'mean_stability': analysis.mean_stability,
                        'std_stability': analysis.std_stability,
                        'temporal_drift': analysis.temporal_drift,
                        'recommended_frames': analysis.recommended_frames,
                        'questionable_frames': analysis.questionable_frames,
                        'rejected_frames': analysis.rejected_frames,
                        'group_statistics': analysis.group_statistics,
                        'metrics_by_frame': [
                            {
                                'path': m.path,
                                'mean_consistency': m.mean_consistency,
                                'std_consistency': m.std_consistency,
                                'histogram_similarity': m.histogram_similarity,
                                'pixel_correlation': m.pixel_correlation,
                                'outlier_deviation': m.outlier_deviation,
                                'consistency_score': m.consistency_score,
                                'warnings': m.warnings
                            }
                            for m in analysis.metrics_by_frame
                        ],
                        'selection_advice': selection_advice
                    }
                    
                    return response_data
                else:
                    logger.error(f"Need at least 2 valid files for consistency analysis. Got {len(local_paths)} files from bucket {request.bucket}")
                    return JSONResponse(status_code=400, content={
                        "error": f"Need at least 2 valid files for consistency analysis. Attempted paths: {fits_paths[:3]}{'...' if len(fits_paths) > 3 else ''}"
                    })
            else:
                # Direct file path processing (for local testing)
                analysis = analyze_frame_consistency(
                    fits_paths, 
                    consistency_threshold=request.consistency_threshold,
                    sigma_threshold=request.sigma_threshold
                )
                
                selection_advice = suggest_frame_selection(
                    analysis,
                    min_frames=request.min_frames,
                    max_frames=request.max_frames
                )
                
                # Convert dataclass to dict for JSON serialization
                response_data = {
                    'success': True,
                    'n_frames': analysis.n_frames,
                    'overall_consistency': analysis.overall_consistency,
                    'mean_stability': analysis.mean_stability,
                    'std_stability': analysis.std_stability,
                    'temporal_drift': analysis.temporal_drift,
                    'recommended_frames': analysis.recommended_frames,
                    'questionable_frames': analysis.questionable_frames,
                    'rejected_frames': analysis.rejected_frames,
                    'group_statistics': analysis.group_statistics,
                    'metrics_by_frame': [
                        {
                            'path': m.path,
                            'mean_consistency': m.mean_consistency,
                            'std_consistency': m.std_consistency,
                            'histogram_similarity': m.histogram_similarity,
                            'pixel_correlation': m.pixel_correlation,
                            'outlier_deviation': m.outlier_deviation,
                            'consistency_score': m.consistency_score,
                            'warnings': m.warnings
                        }
                        for m in analysis.metrics_by_frame
                    ],
                    'selection_advice': selection_advice
                }
                
                return response_data
                
        finally:
            # Clean up downloaded temp files
            for local_path in local_paths:
                if os.path.exists(local_path):
                    os.remove(local_path)
                    
    except Exception as e:
        logger.error(f"Frame consistency analysis error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class CosmicRayDetectionRequest(BaseModel):
    fits_paths: list[str] = None  # Either full paths OR just filenames
    bucket: str = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: str = None
    user_id: str = None 
    frame_type: str = None  # 'bias', 'dark', 'flat', 'light'
    method: str = 'lacosmic'  # 'lacosmic', 'sigma_clip', 'multi', 'auto'
    sigma_clip: float = 4.5  # L.A.Cosmic sigma threshold
    sigma_frac: float = 0.3  # L.A.Cosmic sigma fraction
    objlim: float = 5.0  # L.A.Cosmic object limit
    gain: float = 1.0  # CCD gain
    readnoise: float = 6.5  # CCD readout noise
    satlevel: float = 65535.0  # Saturation level
    niter: int = 4  # Number of iterations
    save_cleaned: bool = True  # Save cleaned images
    save_masks: bool = True  # Save cosmic ray masks
    # Phase 2 enhancements
    auto_tune: bool = True  # Auto-tune parameters per image
    multi_methods: list[str] = ['lacosmic', 'sigma_clip']  # Methods for multi-algorithm
    combine_method: str = 'intersection'  # 'intersection', 'union', 'voting'
    analyze_image_quality: bool = True  # Generate image quality metrics

@app.post("/cosmic-rays/detect")
async def detect_cosmic_rays(request: CosmicRayDetectionRequest, background_tasks: BackgroundTasks):
    """
    Detect and remove cosmic rays from astronomical images.
    
    This endpoint processes light frames (and potentially other frame types) to identify
    and remove cosmic ray hits using the L.A.Cosmic algorithm or simple sigma clipping.
    """
    try:
        logger.info(f"Starting cosmic ray detection for {len(request.fits_paths)} files")
        
        # Validate parameters
        params = {
            'method': request.method,
            'sigma_clip': request.sigma_clip,
            'sigma_frac': request.sigma_frac,
            'objlim': request.objlim,
            'gain': request.gain,
            'readnoise': request.readnoise,
            'satlevel': request.satlevel,
            'niter': request.niter,
            'save_mask': request.save_masks
        }
        validated_params = validate_cosmic_ray_parameters(params)
        
        # Generate job ID
        job_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
        
        # Insert job into database
        await insert_job(job_id, "running", progress=0)
        
        # Start background task
        background_tasks.add_task(run_cosmic_ray_job, request, job_id, validated_params)
        
        return {"job_id": job_id, "status": "started", "message": "Cosmic ray detection job started"}
        
    except Exception as e:
        logger.error(f"Failed to start cosmic ray detection job: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

async def run_cosmic_ray_job(request: CosmicRayDetectionRequest, job_id: str, params: dict):
    """
    Background task to run cosmic ray detection on multiple files.
    """
    try:
        logger.info(f"Running cosmic ray detection job {job_id}")
        
        fits_paths = request.fits_paths
        
        # If fits_paths are just filenames, construct full bucket paths
        if request.bucket and request.project_id and request.user_id and request.frame_type:
            fits_paths = [f"{request.user_id}/{request.project_id}/{request.frame_type}/{filename}" 
                         for filename in request.fits_paths]
        
        # Initialize cosmic ray detector
        detector = CosmicRayDetector(
            sigma_clip=params['sigma_clip'],
            sigma_frac=params['sigma_frac'],
            objlim=params['objlim'],
            gain=params['gain'],
            readnoise=params['readnoise'],
            satlevel=params['satlevel'],
            niter=params['niter']
        )
        
        # Process files
        results = []
        processed_count = 0
        
        # Download and process files
        request_info = {
            'project_id': request.project_id,
            'user_id': request.user_id,
            'frame_type': request.frame_type
        }
        
        for i, remote_path in enumerate(fits_paths):
            try:
                logger.info(f"Processing file {i+1}/{len(fits_paths)}: {remote_path}")
                
                # Download file
                local_temp_path = f"/tmp/{os.path.basename(remote_path)}"
                success = await download_file_with_fallback(request.bucket, remote_path, local_temp_path, request_info)
                
                if not success:
                    logger.warning(f"Failed to download {remote_path}, skipping")
                    continue
                
                # Process file for cosmic rays
                output_path = None
                if request.save_cleaned:
                    output_path = local_temp_path.replace('.fit', '_cleaned.fits').replace('.fits', '_cleaned.fits')
                
                result = detector.process_fits_file(
                    local_temp_path,
                    output_path=output_path,
                    method=params['method'],
                    save_mask=params['save_mask']
                )
                
                # Upload results back to storage if we saved them
                if request.save_cleaned and output_path and os.path.exists(output_path):
                    # Upload cleaned image
                    cleaned_remote_path = remote_path.replace('.fit', '_cleaned.fits').replace('.fits', '_cleaned.fits')
                    upload_file(request.bucket, output_path, cleaned_remote_path)
                    result['cleaned_remote_path'] = cleaned_remote_path
                    os.remove(output_path)  # Clean up local file
                
                if params['save_mask'] and 'mask_path' in result and os.path.exists(result['mask_path']):
                    # Upload cosmic ray mask
                    mask_remote_path = remote_path.replace('.fit', '_crmask.fits').replace('.fits', '_crmask.fits')
                    upload_file(request.bucket, result['mask_path'], mask_remote_path)
                    result['mask_remote_path'] = mask_remote_path
                    os.remove(result['mask_path'])  # Clean up local file
                
                result['original_path'] = remote_path
                results.append(result)
                processed_count += 1
                
                # Clean up downloaded file
                if os.path.exists(local_temp_path):
                    os.remove(local_temp_path)
                
                # Update progress
                progress = int((i + 1) / len(fits_paths) * 100)
                await update_job_progress(job_id, progress)
                
            except Exception as e:
                logger.error(f"Error processing {remote_path}: {e}")
                continue
        
        # Calculate summary statistics
        if results:
            total_cosmic_rays = sum(r['num_cosmic_rays'] for r in results)
            avg_percentage = sum(r['cosmic_ray_percentage'] for r in results) / len(results)
            
            summary = {
                'processed_files': processed_count,
                'total_files': len(fits_paths),
                'total_cosmic_rays_detected': total_cosmic_rays,
                'average_cosmic_ray_percentage': avg_percentage,
                'method': params['method'],
                'parameters': params
            }
        else:
            summary = {
                'processed_files': 0,
                'total_files': len(fits_paths),
                'error': 'No files could be processed'
            }
        
        # Update job with results
        job_result = {
            'summary': summary,
            'file_results': results
        }
        
        await insert_job(job_id, "completed", result=job_result, progress=100)
        logger.info(f"Cosmic ray detection job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Cosmic ray detection job {job_id} failed: {e}")
        await insert_job(job_id, "failed", error=str(e))

@app.post("/cosmic-rays/batch-detect")
async def batch_detect_cosmic_rays(request: CosmicRayDetectionRequest, background_tasks: BackgroundTasks):
    """
    Enhanced batch cosmic ray detection with auto-tuning and multi-algorithm support.
    
    Phase 2 features:
    - Auto-parameter tuning per image
    - Multi-algorithm detection with voting
    - Image quality analysis and recommendations
    - Better performance optimization
    """
    try:
        logger.info(f"Starting enhanced batch cosmic ray detection for {len(request.fits_paths)} files")
        
        # Validate enhanced parameters
        params = {
            'method': request.method,
            'sigma_clip': request.sigma_clip,
            'sigma_frac': request.sigma_frac,
            'objlim': request.objlim,
            'gain': request.gain,
            'readnoise': request.readnoise,
            'satlevel': request.satlevel,
            'niter': request.niter,
            'save_mask': request.save_masks,
            'auto_tune': request.auto_tune,
            'multi_methods': request.multi_methods,
            'combine_method': request.combine_method,
            'analyze_image_quality': request.analyze_image_quality
        }
        validated_params = validate_cosmic_ray_parameters(params)
        
        # Generate job ID
        job_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
        
        # Insert job into database
        await insert_job(job_id, "running", progress=0)
        
        # Start enhanced background task
        background_tasks.add_task(run_enhanced_cosmic_ray_job, request, job_id, validated_params)
        
        return {"job_id": job_id, "status": "started", "message": f"Enhanced batch cosmic ray detection started with {request.method} method"}
        
    except Exception as e:
        logger.error(f"Failed to start enhanced cosmic ray detection job: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/cosmic-rays/recommendations/{job_id}")
async def get_cosmic_ray_recommendations(job_id: str):
    """
    Get parameter recommendations based on image analysis results.
    """
    try:
        job_data = await get_job(job_id)
        
        if not job_data:
            return JSONResponse(status_code=404, content={"error": "Job not found"})
        
        if job_data['status'] != 'completed':
            return JSONResponse(content={
                "job_id": job_id,
                "status": job_data['status'],
                "message": "Analysis not yet complete"
            })
        
        # Extract recommendations from job results
        result = job_data.get('result', {})
        recommendations = result.get('recommendations', {})
        image_analysis = result.get('image_analysis', {})
        
        return JSONResponse(content={
            "job_id": job_id,
            "recommendations": recommendations,
            "image_analysis": image_analysis,
            "summary": result.get('summary', {})
        })
        
    except Exception as e:
        logger.error(f"Failed to get recommendations for job {job_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

async def run_enhanced_cosmic_ray_job(request: CosmicRayDetectionRequest, job_id: str, params: dict):
    """
    Enhanced background task for cosmic ray detection with Phase 2 features.
    """
    try:
        logger.info(f"Running enhanced cosmic ray detection job {job_id}")
        
        fits_paths = request.fits_paths
        
        # If fits_paths are just filenames, construct full bucket paths
        if request.bucket and request.project_id and request.user_id and request.frame_type:
            fits_paths = [f"{request.user_id}/{request.project_id}/{request.frame_type}/{filename}" 
                         for filename in request.fits_paths]
        
        # Initialize cosmic ray detector
        detector = CosmicRayDetector(
            sigma_clip=params['sigma_clip'],
            sigma_frac=params['sigma_frac'],
            objlim=params['objlim'],
            gain=params['gain'],
            readnoise=params['readnoise'],
            satlevel=params['satlevel'],
            niter=params['niter']
        )
        
        # Process files with enhanced features
        results = []
        image_quality_metrics = []
        processed_count = 0
        
        # Download and process files
        request_info = {
            'project_id': request.project_id,
            'user_id': request.user_id,
            'frame_type': request.frame_type
        }
        
        for i, remote_path in enumerate(fits_paths):
            try:
                logger.info(f"Processing file {i+1}/{len(fits_paths)}: {remote_path}")
                
                # Download file
                local_temp_path = f"/tmp/{os.path.basename(remote_path)}"
                success = await download_file_with_fallback(request.bucket, remote_path, local_temp_path, request_info)
                
                if not success:
                    logger.warning(f"Failed to download {remote_path}, skipping")
                    continue
                
                # Load image data for analysis
                with fits.open(local_temp_path) as hdul:
                    data = hdul[0].data.astype(np.float64)
                
                # Phase 2: Image quality analysis
                if params['analyze_image_quality']:
                    quality_metrics = detector.get_image_quality_metrics(data)
                    quality_metrics['file_path'] = remote_path
                    image_quality_metrics.append(quality_metrics)
                
                # Phase 2: Auto-tune parameters if enabled
                original_params = {}
                if params['auto_tune']:
                    original_params = {
                        'sigma_clip': detector.sigma_clip,
                        'objlim': detector.objlim,
                        'niter': detector.niter,
                        'sigma_frac': detector.sigma_frac
                    }
                    
                    tuned_params = detector.auto_tune_parameters(data)
                    for param, value in tuned_params.items():
                        setattr(detector, param, value)
                
                # Process with enhanced methods
                if params['method'] == 'multi':
                    # Multi-algorithm detection
                    cleaned_data, crmask, multi_stats = detector.detect_multi_algorithm(
                        data, 
                        methods=params['multi_methods'],
                        combine_method=params['combine_method']
                    )
                    
                    result = {
                        'method': 'multi',
                        'num_cosmic_rays': int(np.sum(crmask)),
                        'cosmic_ray_percentage': float(np.sum(crmask) / data.size * 100),
                        'image_shape': data.shape,
                        'multi_stats': multi_stats,
                        'parameters': {
                            'methods_used': params['multi_methods'],
                            'combine_method': params['combine_method'],
                            'auto_tuned': params['auto_tune']
                        }
                    }
                    
                elif params['method'] == 'auto':
                    # Automatic method selection based on image characteristics
                    quality = detector.get_image_quality_metrics(data)
                    
                    if quality['snr'] > 50 and quality['star_density'] > 0.01:
                        # High quality image - use L.A.Cosmic
                        cleaned_data, crmask = detector.detect_lacosmic(data)
                        selected_method = 'lacosmic'
                    else:
                        # Lower quality image - use sigma clipping
                        crmask = detector.detect_sigma_clipping(data)
                        cleaned_data = detector.clean_cosmic_rays(data, crmask)
                        selected_method = 'sigma_clip'
                    
                    result = {
                        'method': f'auto-{selected_method}',
                        'num_cosmic_rays': int(np.sum(crmask)),
                        'cosmic_ray_percentage': float(np.sum(crmask) / data.size * 100),
                        'image_shape': data.shape,
                        'auto_selected_method': selected_method,
                        'selection_reasoning': f"SNR: {quality['snr']:.1f}, Star density: {quality['star_density']:.3f}"
                    }
                    
                else:
                    # Standard single-method processing
                    output_path = None
                    if request.save_cleaned:
                        output_path = local_temp_path.replace('.fit', '_cleaned.fits').replace('.fits', '_cleaned.fits')
                    
                    result = detector.process_fits_file(
                        local_temp_path,
                        output_path=output_path,
                        method=params['method'],
                        save_mask=params['save_mask']
                    )
                    
                    # Upload results back to storage if we saved them
                    if request.save_cleaned and output_path and os.path.exists(output_path):
                        # Upload cleaned image
                        cleaned_remote_path = remote_path.replace('.fit', '_cleaned.fits').replace('.fits', '_cleaned.fits')
                        upload_file(request.bucket, output_path, cleaned_remote_path)
                        result['cleaned_remote_path'] = cleaned_remote_path
                        os.remove(output_path)  # Clean up local file
                
                # Add auto-tuning info
                if params['auto_tune']:
                    result['auto_tuned_parameters'] = {
                        'sigma_clip': detector.sigma_clip,
                        'objlim': detector.objlim,
                        'niter': detector.niter,
                        'sigma_frac': detector.sigma_frac
                    }
                    result['original_parameters'] = original_params
                    # Restore original parameters
                    for param, value in original_params.items():
                        setattr(detector, param, value)
                
                result['original_path'] = remote_path
                results.append(result)
                processed_count += 1
                
                # Clean up downloaded file
                if os.path.exists(local_temp_path):
                    os.remove(local_temp_path)
                
                # Update progress
                progress = int((i + 1) / len(fits_paths) * 90)  # Reserve 10% for analysis
                await update_job_progress(job_id, progress)
                
            except Exception as e:
                logger.error(f"Error processing {remote_path}: {e}")
                continue
        
        # Phase 2: Generate recommendations and analysis
        await update_job_progress(job_id, 95)
        recommendations = {}
        
        if results:
            # Analyze cosmic ray statistics
            cosmic_ray_percentages = [r['cosmic_ray_percentage'] for r in results if 'cosmic_ray_percentage' in r]
            
            if cosmic_ray_percentages:
                avg_cr_percentage = np.mean(cosmic_ray_percentages)
                std_cr_percentage = np.std(cosmic_ray_percentages)
                
                # Generate recommendations based on results
                if avg_cr_percentage > 2.0:
                    recommendations['sensitivity'] = {
                        'issue': 'High cosmic ray detection rate',
                        'current_avg': f"{avg_cr_percentage:.2f}%",
                        'recommendation': 'Consider increasing sigma_clip threshold to reduce false positives',
                        'suggested_sigma_clip': min(6.0, params['sigma_clip'] + 0.5)
                    }
                elif avg_cr_percentage < 0.1:
                    recommendations['sensitivity'] = {
                        'issue': 'Very low cosmic ray detection rate',
                        'current_avg': f"{avg_cr_percentage:.2f}%",
                        'recommendation': 'Consider decreasing sigma_clip threshold for more sensitive detection',
                        'suggested_sigma_clip': max(3.0, params['sigma_clip'] - 0.5)
                    }
                else:
                    recommendations['sensitivity'] = {
                        'status': 'Optimal',
                        'current_avg': f"{avg_cr_percentage:.2f}%",
                        'message': 'Cosmic ray detection rate is within expected range'
                    }
                
                # Consistency recommendations
                if std_cr_percentage > 1.0:
                    recommendations['consistency'] = {
                        'issue': 'High variation in cosmic ray detection between frames',
                        'std_deviation': f"{std_cr_percentage:.2f}%",
                        'recommendation': 'Consider enabling auto-tuning or reviewing frame quality'
                    }
                else:
                    recommendations['consistency'] = {
                        'status': 'Good',
                        'std_deviation': f"{std_cr_percentage:.2f}%",
                        'message': 'Consistent detection across frames'
                    }
        
        # Auto-tuning recommendations
        if params['auto_tune']:
            recommendations['auto_tuning'] = {
                'status': 'Enabled',
                'message': 'Parameters were automatically optimized for each image'
            }
        else:
            recommendations['auto_tuning'] = {
                'status': 'Disabled',
                'recommendation': 'Consider enabling auto-tuning for better per-image optimization'
            }
        
        # Calculate final summary statistics
        if results:
            total_cosmic_rays = sum(r.get('num_cosmic_rays', 0) for r in results)
            avg_percentage = sum(r.get('cosmic_ray_percentage', 0) for r in results) / len(results)
            
            summary = {
                'processed_files': processed_count,
                'total_files': len(fits_paths),
                'total_cosmic_rays_detected': total_cosmic_rays,
                'average_cosmic_ray_percentage': avg_percentage,
                'method': params['method'],
                'auto_tuning_enabled': params['auto_tune'],
                'parameters': params
            }
        else:
            summary = {
                'processed_files': 0,
                'total_files': len(fits_paths),
                'error': 'No files could be processed'
            }
        
        # Update job with enhanced results
        job_result = {
            'summary': summary,
            'file_results': results,
            'recommendations': recommendations,
            'image_analysis': {
                'quality_metrics': image_quality_metrics if params['analyze_image_quality'] else []
            }
        }
        
        await insert_job(job_id, "completed", result=job_result, progress=100)
        logger.info(f"Enhanced cosmic ray detection job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Enhanced cosmic ray detection job {job_id} failed: {e}")
        await insert_job(job_id, "failed", error=str(e))

class GradientAnalysisRequest(BaseModel):
    fits_paths: list[str] = None  # Either full paths OR just filenames
    bucket: str = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: str = None
    user_id: str = None 
    frame_type: str = None  # 'dark', 'flat' (auto-detected if None)

@app.post("/gradients/analyze")
async def analyze_gradients(request: GradientAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze gradients in calibration frames for quality assessment.
    
    This endpoint detects and analyzes gradient issues in dark and flat frames
    during the calibration stage, following industry standards where:
    - Detection happens during calibration (this endpoint)
    - Correction happens in post-processing (GraXpert, Siril, etc.)
    """
    try:
        if not request.fits_paths:
            raise HTTPException(status_code=400, detail="No FITS paths provided")
        
        job_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        
        # Start gradient analysis job
        background_tasks.add_task(run_gradient_analysis_job, request, job_id)
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": f"Gradient analysis started for {len(request.fits_paths)} frames",
            "analysis_type": "detection_and_validation"
        }
        
    except Exception as e:
        logger.error(f"Failed to start gradient analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_gradient_analysis_job(request: GradientAnalysisRequest, job_id: str):
    """Run gradient analysis job for multiple calibration frames."""
    db = get_db()
    try:
        await insert_job(job_id, "running")
        await update_job_progress(job_id, 0)
        
        # Download files
        local_files = []
        for fits_path in request.fits_paths:
            local_file = f"tmp_{fits_path.replace('/', '_')}"
            success = await download_file_with_fallback(
                request.bucket, fits_path, local_file,
                {'project_id': request.project_id, 'user_id': request.user_id, 'frame_type': request.frame_type}
            )
            if success:
                local_files.append((local_file, fits_path))
        
        if not local_files:
            raise Exception("Failed to download any files")
        
        await update_job_progress(job_id, 20)
        
        all_results = []
        total_files = len(local_files)
        
        for i, (local_file, original_path) in enumerate(local_files):
            try:
                # Analyze gradients in this frame
                result = analyze_calibration_frame_gradients(local_file, request.frame_type)
                
                # Add file info to result
                result_dict = {
                    "file_path": original_path,
                    "frame_type": result.frame_type,
                    "gradient_score": result.gradient_score,
                    "uniformity_score": result.uniformity_score,
                    "detected_issues": result.detected_issues,
                    "recommendations": result.recommendations,
                    "statistics": result.statistics,
                    "quality_flags": result.quality_flags
                }
                
                all_results.append(result_dict)
                
            except Exception as e:
                logger.warning(f"Failed to analyze {original_path}: {e}")
                all_results.append({
                    "file_path": original_path,
                    "frame_type": request.frame_type or "unknown",
                    "gradient_score": 0.0,
                    "uniformity_score": 0.0,
                    "detected_issues": [f"Analysis failed: {str(e)}"],
                    "recommendations": ["Check file integrity"],
                    "statistics": {},
                    "quality_flags": {}
                })
            
            # Update progress
            progress = 20 + (70 * (i + 1) / total_files)
            await update_job_progress(job_id, int(progress))
        
        # Generate summary statistics
        summary = generate_gradient_summary(all_results)
        
        await update_job_progress(job_id, 90)
        
        # Clean up downloaded files
        for local_file, _ in local_files:
            if os.path.exists(local_file):
                os.remove(local_file)
        
        await update_job_progress(job_id, 100)
        
        # Update job with results
        await db.fetch(
            "UPDATE jobs SET status = $1, result = $2, diagnostics = $3 WHERE id = $4",
            "completed",
            json.dumps({
                "summary": summary,
                "frame_results": all_results,
                "total_frames": len(all_results)
            }),
            json.dumps({
                "frame_type": request.frame_type,
                "analysis_method": "calibration_stage_detection"
            }),
            job_id
        )
        
    except Exception as e:
        logger.error(f"Gradient analysis job {job_id} failed: {e}")
        await db.fetch(
            "UPDATE jobs SET status = $1, error = $2 WHERE id = $3",
            "failed",
            str(e),
            job_id
        )

def generate_gradient_summary(results: list) -> dict:
    """Generate summary statistics from gradient analysis results."""
    if not results:
        return {}
    
    # Calculate overall statistics
    gradient_scores = [r.get('gradient_score', 0) for r in results]
    uniformity_scores = [r.get('uniformity_score', 0) for r in results]
    
    # Count issues
    total_issues = sum(len(r.get('detected_issues', [])) for r in results)
    frames_with_issues = sum(1 for r in results if r.get('detected_issues'))
    
    # Categorize frame quality
    excellent_frames = sum(1 for s in gradient_scores if s >= 8.0)
    good_frames = sum(1 for s in gradient_scores if 6.0 <= s < 8.0)
    poor_frames = sum(1 for s in gradient_scores if s < 6.0)
    
    # Most common issues
    all_issues = []
    for r in results:
        all_issues.extend(r.get('detected_issues', []))
    
    issue_counts = {}
    for issue in all_issues:
        # Group similar issues
        if 'amp glow' in issue.lower():
            issue_counts['Amp Glow'] = issue_counts.get('Amp Glow', 0) + 1
        elif 'light leak' in issue.lower():
            issue_counts['Light Leaks'] = issue_counts.get('Light Leaks', 0) + 1
        elif 'uniformity' in issue.lower():
            issue_counts['Poor Uniformity'] = issue_counts.get('Poor Uniformity', 0) + 1
        elif 'vignetting' in issue.lower():
            issue_counts['Vignetting'] = issue_counts.get('Vignetting', 0) + 1
        else:
            issue_counts['Other'] = issue_counts.get('Other', 0) + 1
    
    return {
        "total_frames": len(results),
        "frames_with_issues": frames_with_issues,
        "average_gradient_score": sum(gradient_scores) / len(gradient_scores) if gradient_scores else 0,
        "average_uniformity_score": sum(uniformity_scores) / len(uniformity_scores) if uniformity_scores else 0,
        "quality_distribution": {
            "excellent": excellent_frames,
            "good": good_frames,
            "poor": poor_frames
        },
        "common_issues": issue_counts,
        "total_issues": total_issues,
        "recommendation": generate_overall_recommendation(gradient_scores, issue_counts)
    }

def generate_overall_recommendation(gradient_scores: list, issue_counts: dict) -> str:
    """Generate overall recommendation based on analysis results."""
    avg_score = sum(gradient_scores) / len(gradient_scores) if gradient_scores else 0
    
    if avg_score >= 8.0:
        return "Excellent calibration frame quality. No major gradient issues detected."
    elif avg_score >= 6.0:
        return "Good calibration frame quality with minor issues. Consider addressing flagged problems."
    elif avg_score >= 4.0:
        if 'Amp Glow' in issue_counts:
            return "Moderate gradient issues detected. Consider improving camera cooling or shorter exposures."
        elif 'Light Leaks' in issue_counts:
            return "Light leaks detected. Check telescope/camera for unwanted light entry points."
        else:
            return "Moderate gradient issues. Review individual frame recommendations."
    else:
        return "Significant gradient issues detected. Consider re-taking calibration frames with improved setup."

class HistogramAnalysisRequest(BaseModel):
    fits_paths: list[str] = None  # Either full paths OR just filenames
    bucket: str = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: str = None
    user_id: str = None 
    frame_type: str = None  # 'bias', 'dark', 'flat' (auto-detected if None)

@app.post("/histograms/analyze")
async def analyze_histograms(request: HistogramAnalysisRequest, background_tasks: BackgroundTasks):
    """
    Comprehensive histogram analysis for calibration frames.
    
    Provides market-leader level histogram quality assessment including:
    - Statistical distribution analysis
    - Clipping and saturation detection
    - Pedestal requirements calculation
    - Frame-specific quality scoring
    - Outlier and anomaly detection
    """
    try:
        # Generate unique job ID
        job_id = f"histogram_analysis_{uuid.uuid4().hex[:8]}"
        
        # Store initial job status
        await insert_job(job_id, status="running", progress=0)
        
        # Start background processing
        background_tasks.add_task(run_histogram_analysis_job, request, job_id)
        
        return {
            "success": True,
            "job_id": job_id,
            "status": "running",
            "message": "Histogram analysis started"
        }
        
    except Exception as e:
        logger.error(f"Error starting histogram analysis: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

async def run_histogram_analysis_job(request: HistogramAnalysisRequest, job_id: str):
    """Background task for running histogram analysis."""
    try:
        from .histogram_analysis import analyze_calibration_frame_histograms
        
        logger.info(f"Starting histogram analysis job {job_id}")
        
        local_files = []
        if request.bucket:
            # Download from Supabase
            logger.info(f"Downloading {len(request.fits_paths)} files from bucket {request.bucket}")
            for fits_path in request.fits_paths:
                local_path = f"/tmp/{job_id}_{os.path.basename(fits_path)}"
                success = await download_file_with_fallback(
                    request.bucket, 
                    fits_path, 
                    local_path,
                    {"project_id": request.project_id, "user_id": request.user_id}
                )
                if success:
                    local_files.append(local_path)
                else:
                    logger.warning(f"Failed to download {fits_path}")
        else:
            # Use local paths directly
            local_files = request.fits_paths
        
        if not local_files:
            logger.error(f"No files available for analysis in job {job_id}")
            # Store results in memory instead of database
            job_results[job_id] = {"status": "failed", "error": "No files to analyze", "progress": 0}
            return
        
        logger.info(f"Analyzing histograms for {len(local_files)} files")
        
        # Run histogram analysis
        analysis_results = analyze_calibration_frame_histograms(local_files, request.frame_type)
        
        # Generate summary for frontend
        summary = generate_histogram_summary(analysis_results)
        
        # Store results in memory instead of database
        result_data = {
            "analysis_results": analysis_results,
            "summary": summary,
            "job_id": job_id
        }
        
        job_results[job_id] = {"status": "success", "result": result_data, "progress": 100}
        logger.info(f"Histogram analysis completed for job {job_id}")
        
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Histogram analysis job {job_id} failed: {e}\n{tb}")
        job_results[job_id] = {"status": "failed", "error": str(e), "progress": 0}
    
    finally:
        # Cleanup downloaded files
        if request.bucket and local_files:
            for local_path in local_files:
                if os.path.exists(local_path):
                    try:
                        os.unlink(local_path)
                    except:
                        pass

def generate_histogram_summary(analysis_results: dict) -> dict:
    """Generate a user-friendly summary of histogram analysis results."""
    frame_results = analysis_results.get('frame_results', [])
    summary = analysis_results.get('summary', {})
    
    if not frame_results:
        return {
            "message": "No frames analyzed",
            "quality_status": "unknown",
            "recommendations": []
        }
    
    avg_score = summary.get('average_score', 0.0)
    total_frames = summary.get('total_frames', 0)
    high_quality = summary.get('high_quality_frames', 0)
    poor_quality = summary.get('poor_quality_frames', 0)
    
    # Determine overall quality status
    if avg_score >= 8.0:
        quality_status = "excellent"
        status_message = f"🟢 Excellent histogram quality ({avg_score:.1f}/10)"
    elif avg_score >= 6.0:
        quality_status = "good"
        status_message = f"🟡 Good histogram quality ({avg_score:.1f}/10)"
    elif avg_score >= 4.0:
        quality_status = "moderate"
        status_message = f"🟠 Moderate histogram quality ({avg_score:.1f}/10)"
    else:
        quality_status = "poor"
        status_message = f"🔴 Poor histogram quality ({avg_score:.1f}/10)"
    
    # Generate actionable recommendations
    recommendations = []
    common_issues = summary.get('common_issues', [])
    
    if 'Clipping detected in histogram' in common_issues:
        recommendations.append("📊 Adjust exposure settings to avoid clipping")
    
    if 'High outlier percentage' in str(common_issues):
        recommendations.append("🔥 Check for hot pixels or cosmic ray contamination")
    
    if 'Pedestal correction required' in str(common_issues):
        recommendations.append("⚡ Apply pedestal correction during calibration")
    
    if 'High noise in bias frame' in str(common_issues):
        recommendations.append("🌡️ Check for electronic interference or cooling issues")
    
    if 'Flat frame underexposed' in str(common_issues):
        recommendations.append("💡 Increase flat field exposure or illumination")
    
    if 'Poor illumination uniformity' in str(common_issues):
        recommendations.append("🔆 Improve flat field illumination setup")
    
    if poor_quality > total_frames * 0.3:
        recommendations.append("🔄 Consider re-acquiring problematic frames")
    
    if not recommendations:
        recommendations.append("✅ Histogram quality is acceptable for calibration")
    
    return {
        "message": status_message,
        "quality_status": quality_status,
        "score": round(avg_score, 1),
        "frame_breakdown": {
            "total": total_frames,
            "high_quality": high_quality,
            "poor_quality": poor_quality,
            "requiring_pedestal": summary.get('frames_requiring_pedestal', 0),
            "with_clipping": summary.get('frames_with_clipping', 0)
        },
        "recommendations": recommendations,
        "overall_recommendation": summary.get('overall_recommendation', '')
    }

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 