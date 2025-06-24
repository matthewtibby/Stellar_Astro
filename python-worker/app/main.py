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
from pydantic import BaseModel
import traceback
import uuid
from datetime import datetime
import glob
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter

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
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job["status"],
        "created_at": job["created_at"],
        "error": job["error"],
        "progress": job.get("progress", 0)
    }

@app.get("/jobs/results")
async def get_job_results(job_id: str):
    job = await get_job(job_id)
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
    # Parse the stringified JSON fields
    results = json.loads(job["result"]) if job["result"] else {}
    diagnostics = json.loads(job["diagnostics"]) if job.get("diagnostics") else {}
    warnings = json.loads(job["warnings"]) if job.get("warnings") else []
    return {
        "job_id": job_id,
        "results": results,
        "diagnostics": diagnostics,
        "warnings": warnings,
        "error": job["error"]
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

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 