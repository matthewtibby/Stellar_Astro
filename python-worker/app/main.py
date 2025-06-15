import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[2]))
import logging
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
from .calibration_worker import create_master_frame, save_master_frame, save_master_preview, analyze_frames, recommend_stacking, infer_frame_type
from .supabase_io import download_file, upload_file
from pydantic import BaseModel
import traceback
import uuid
from datetime import datetime

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

# --- JOB STATUS/RESULTS DB HELPERS ---
async def insert_job(job_id, status, error=None, result=None, diagnostics=None, warnings=None, progress=None):
    conn = await get_db()
    try:
        await conn.execute(
            """
            insert into jobs (job_id, status, error, result, diagnostics, warnings, progress)
            values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7)
            on conflict (job_id) do update set
                status = excluded.status,
                error = excluded.error,
                result = excluded.result,
                diagnostics = excluded.diagnostics,
                warnings = excluded.warnings,
                progress = excluded.progress
            """,
            job_id, status, error,
            json.dumps(result) if result is not None else None,
            json.dumps(diagnostics) if diagnostics is not None else None,
            json.dumps(warnings) if warnings is not None else None,
            progress
        )
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
    await insert_job(job_id, status=None, progress=progress)

async def run_calibration_job(job: CalibrationJobRequest, job_id: str):
    try:
        print(f"[BG] Starting calibration job: {job.dict()} (job_id={job_id})")
        await insert_job(job_id, status="running", progress=0)
        fits_input_paths = [p for p in job.input_paths if p.lower().endswith((".fit", ".fits"))]
        # Limit number of dark frames for testing
        fits_input_paths = fits_input_paths[:10]
        print(f"[BG] FITS files to process: {fits_input_paths}")
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        output_base_with_ts = f"{job.output_base}_{timestamp}"
        with tempfile.TemporaryDirectory() as tmpdir:
            print(f"[BG] Created tempdir: {tmpdir}")
            local_files = []
            local_light_files = []
            light_input_paths = getattr(job, 'light_input_paths', None)
            # --- Progress logic depends on settings ---
            dark_scaling = job.settings.get('darkScaling', False)
            if dark_scaling:
                # Fine-grained progress for dark scaling jobs
                total_files = len(fits_input_paths) + (len(light_input_paths) if light_input_paths else 0)
                downloaded = 0
                for i, spath in enumerate(fits_input_paths):
                    local_path = os.path.join(tmpdir, f"input_{i}.fits")
                    print(f"[BG] Downloading {spath} to {local_path}")
                    try:
                        download_file(job.input_bucket, spath, local_path)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[ERROR] Failed to download {spath}: {e}\n{tb}")
                        await insert_job(job_id, status="error", error=f"Download failed: {e}", progress=0)
                        return
                    local_files.append(local_path)
                    downloaded += 1
                    pct = int(5 + 25 * downloaded / max(1, total_files))  # 5–30% for all downloads
                    await update_job_progress(job_id, pct)
                if light_input_paths:
                    light_input_paths = light_input_paths[:10]
                    for i, spath in enumerate(light_input_paths):
                        if not spath.lower().endswith((".fit", ".fits")):
                            continue
                        local_path = os.path.join(tmpdir, f"light_{i}.fits")
                        print(f"[BG] Downloading light {spath} to {local_path}")
                        try:
                            download_file(job.input_bucket, spath, local_path)
                        except Exception as e:
                            tb = traceback.format_exc()
                            print(f"[ERROR] Failed to download light {spath}: {e}\n{tb}")
                            continue
                        local_light_files.append(local_path)
                        downloaded += 1
                        pct = int(5 + 25 * downloaded / max(1, total_files))
                        await update_job_progress(job_id, pct)
                await update_job_progress(job_id, 30)
            else:
                # Default logic for other algorithms/settings
                for i, spath in enumerate(fits_input_paths):
                    local_path = os.path.join(tmpdir, f"input_{i}.fits")
                    print(f"[BG] Downloading {spath} to {local_path}")
                    try:
                        download_file(job.input_bucket, spath, local_path)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[ERROR] Failed to download {spath}: {e}\n{tb}")
                        await insert_job(job_id, status="error", error=f"Download failed: {e}", progress=0)
                        return
                    local_files.append(local_path)
                print(f"[BG] Downloaded {len(local_files)} files.")
                if light_input_paths:
                    light_input_paths = light_input_paths[:10]
                    for i, spath in enumerate(light_input_paths):
                        if not spath.lower().endswith((".fit", ".fits")):
                            continue
                        local_path = os.path.join(tmpdir, f"light_{i}.fits")
                        print(f"[BG] Downloading light {spath} to {local_path}")
                        try:
                            download_file(job.input_bucket, spath, local_path)
                        except Exception as e:
                            tb = traceback.format_exc()
                            print(f"[ERROR] Failed to download light {spath}: {e}\n{tb}")
                            continue
                        local_light_files.append(local_path)
                await update_job_progress(job_id, 30)
            try:
                method = job.settings.get('stackingMethod', 'median')
                sigma = float(job.settings.get('sigmaThreshold', 3.0))
                cosmetic = job.settings.get('cosmeticCorrection', False)
                cosmetic_method = job.settings.get('cosmeticMethod', 'hot_pixel_map')
                cosmetic_threshold = float(job.settings.get('cosmeticThreshold', 0.5))
                print(f"[BG] Dark scaling: enabled={dark_scaling}, auto={job.settings.get('darkScalingAuto', True)}, factor={job.settings.get('darkScalingFactor', 1.0)}")
                print(f"[BG] Starting calibration: method={method}, sigma={sigma}, cosmetic={cosmetic}, cosmetic_method={cosmetic_method}, cosmetic_threshold={cosmetic_threshold}")
                frame_type = infer_frame_type(local_files)
                print(f"[BG] Frame type: {frame_type}")
                print(f"[BG] Running analyze_frames...")
                stats = analyze_frames(local_files)
                print(f"[BG] Frame analysis: {stats}")
                await update_job_progress(job_id, 40)
                rec_method, rec_sigma, reason = recommend_stacking(stats, method, sigma)
                print(f"[BG] Recommendation: {reason}")
                print(f"[BG] Running create_master_frame...")
                master = create_master_frame(
                    local_files,
                    method=method,
                    sigma_clip=sigma if method in ['sigma', 'winsorized'] else None,
                    cosmetic=cosmetic,
                    cosmetic_method=cosmetic_method,
                    cosmetic_threshold=cosmetic_threshold
                )
                # --- Dark scaling logic ---
                if frame_type == 'dark' and dark_scaling:
                    from .calibration_worker import estimate_dark_scaling_factor
                    try:
                        print(f"[BG] Calling estimate_dark_scaling_factor with {len(local_files)} darks and {len(local_light_files)} lights...")
                        if job.settings.get('darkScalingAuto', True):
                            await update_job_progress(job_id, 50)
                            scaling_factor = estimate_dark_scaling_factor(local_files, local_light_files if local_light_files else None)
                            print(f"[BG] Auto-estimated dark scaling factor: {scaling_factor:.4f}")
                        else:
                            scaling_factor = float(job.settings.get('darkScalingFactor', 1.0))
                            print(f"[BG] Manual dark scaling factor: {scaling_factor:.4f}")
                        master = master * scaling_factor
                        await update_job_progress(job_id, 60)
                    except Exception as e:
                        tb = traceback.format_exc()
                        print(f"[ERROR] Exception in dark scaling: {e}\n{tb}")
                        await insert_job(job_id, status="error", error=f"Dark scaling failed: {e}\n{tb}", progress=40)
                        return
                else:
                    await update_job_progress(job_id, 60)
                fits_path = os.path.join(tmpdir, 'master.fits')
                png_path = os.path.join(tmpdir, 'master.png')
                print(f"[BG] Running save_master_frame...")
                save_master_frame(master, fits_path)
                print(f"[BG] Running save_master_preview...")
                save_master_preview(master, png_path)
                await update_job_progress(job_id, 75)
                fits_storage_path = output_base_with_ts + '.fits'
                png_storage_path = output_base_with_ts + '.png'
                print(f"[BG] About to upload FITS to Supabase: {fits_storage_path}")
                try:
                    upload_file(job.output_bucket, fits_storage_path, fits_path, public=False)
                except Exception as e:
                    tb = traceback.format_exc()
                    print(f"[ERROR] Failed to upload FITS: {e}\n{tb}")
                    await insert_job(job_id, status="error", error=f"FITS upload failed: {e}", progress=75)
                    return
                print(f"[BG] FITS file uploaded to Supabase: {fits_storage_path}")
                print(f"[BG] About to upload PNG to Supabase: {png_storage_path}")
                try:
                    preview_url = upload_file(job.output_bucket, png_storage_path, png_path, public=True)
                except Exception as e:
                    tb = traceback.format_exc()
                    print(f"[ERROR] Failed to upload PNG: {e}\n{tb}")
                    await insert_job(job_id, status="error", error=f"PNG upload failed: {e}", progress=80)
                    return
                print(f"[BG] Preview PNG uploaded to: {png_storage_path}")
                print(f"[BG] Preview public URL: {preview_url}")
                await update_job_progress(job_id, 95)
                await insert_job(job_id, status="complete", result={"preview_url": preview_url, "fits_path": fits_storage_path, "preview_png_path": png_storage_path}, diagnostics=stats, warnings=[], error=None, progress=100)
                print(f"[BG] Calibration job {job_id} completed successfully.")
            except Exception as e:
                tb = traceback.format_exc()
                print(f"[ERROR] Calibration failed: {e}\n{tb}")
                await insert_job(job_id, status="error", error=f"Calibration failed: {e}\n{tb}", progress=0)
                return
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[FATAL ERROR] Unexpected error in run_calibration_job: {e}\n{tb}")
        await insert_job(job_id, status="error", error=f"Fatal error: {e}\n{tb}", progress=0)

@app.post("/jobs/submit")
async def submit_job(job: CalibrationJobRequest, request: Request, background_tasks: BackgroundTasks):
    try:
        print(f"[API] /jobs/submit called. Raw body: {await request.body()}")
        print(f"[API] Parsed job: {job.dict()}")
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        await insert_job(job_id, status="queued", progress=0)
        print(f"[API] Queued calibration job: {job_id}")
        background_tasks.add_task(run_calibration_job, job, job_id)
        return {"jobId": job_id}
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[API ERROR] Exception in /jobs/submit: {e}\n{tb}")
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
    if job["status"] != "complete":
        raise HTTPException(status_code=202, detail="Job not complete")
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
    print(f"[API] Progress for {job_id}: {job.get('progress', 0)} status={job['status']}")
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
        norm = (data - vmin) / (vmax - vmin) * 255
        norm = np.nan_to_num(norm)
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

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 