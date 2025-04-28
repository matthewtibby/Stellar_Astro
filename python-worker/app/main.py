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
import asyncpg
import json

app = FastAPI()

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

# Handle graceful shutdown
@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down gracefully...")
    # Add any cleanup code here

# Prevent immediate shutdown on SIGTERM
def handle_sigterm(signum, frame):
    print("Received SIGTERM, waiting for requests to complete...")
    # Let the server handle the shutdown gracefully
    sys.exit(0)

# Prevent immediate shutdown on SIGINT
def handle_sigint(signum, frame):
    print("Received SIGINT, waiting for requests to complete...")
    # Let the server handle the shutdown gracefully
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
signal.signal(signal.SIGINT, handle_sigint)

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
    Determine the frame type from FITS header metadata.
    Uses a combination of keywords and metadata to make an educated guess.
    """
    # Extract relevant metadata
    imagetyp = str(header.get('IMAGETYP', '')).strip().lower()
    obstype = str(header.get('OBSTYPE', '')).strip().lower()
    exptime = float(header.get('EXPTIME', 0))
    filter_name = str(header.get('FILTER', '')).strip().lower()
    object_name = str(header.get('OBJECT', '')).strip().lower()
    
    # Check for explicit type indicators
    if 'light' in imagetyp or 'object' in imagetyp or 'light' in obstype or 'object' in obstype:
        return 'light'
    elif 'dark' in imagetyp or 'dark' in obstype:
        return 'dark'
    elif 'flat' in imagetyp or 'flat' in obstype:
        return 'flat'
    elif 'bias' in imagetyp or 'zero' in imagetyp or 'bias' in obstype or 'zero' in obstype:
        return 'bias'
    
    # Use metadata to make an educated guess
    if exptime == 0 or exptime < 0.1:  # Very short or zero exposure
        return 'bias'
    elif exptime > 0.1 and not filter_name:  # No filter, longer exposure
        return 'dark'
    elif filter_name and 0.1 < exptime < 10:  # Has filter, moderate exposure
        return 'flat'
    elif object_name and exptime > 0.1:  # Has object name and exposure
        return 'light'
    
    # Default to light if we can't determine
    return 'light'

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
    expected_type: Optional[str] = None,
    project_id: str = Form(...),
    user_id: str = Form(...)
) -> JSONResponse:
    try:
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
                
                # Check for potential issues
                warnings = []
                
                # Validate exposure time
                if metadata['exposure_time'] is not None:
                    if actual_type == 'bias' and metadata['exposure_time'] > 0.1:
                        warnings.append("Bias frame has unusually long exposure time")
                    elif actual_type == 'flat' and metadata['exposure_time'] > 10:
                        warnings.append("Flat frame exposure time seems unusually long")
                    elif actual_type == 'light' and metadata['exposure_time'] < 0.1:
                        warnings.append("Light frame has unusually short exposure time")
                
                # Validate filter presence
                if actual_type == 'light' and not metadata['filter']:
                    warnings.append("Light frame missing filter information")
                if actual_type == 'flat' and not metadata['filter']:
                    warnings.append("Flat frame missing filter information")
                if actual_type == 'dark' and metadata['filter']:
                    warnings.append("Dark frame has filter information, which is unusual")
                
                # Validate temperature
                if metadata['temperature'] is not None:
                    if abs(metadata['temperature'] - header.get('SET-TEMP', 0)) > 5:
                        warnings.append("CCD temperature differs significantly from set temperature")
                
                # You must determine file_path, project_id, and user_id from your context or request
                await save_fits_metadata(temp_file_path, project_id, user_id, metadata)
                
                return JSONResponse(
                    status_code=200,
                    content={
                        "valid": True,
                        "message": "FITS file is valid",
                        "actual_type": actual_type,
                        "expected_type": expected_type,
                        "metadata": metadata,
                        "warnings": warnings
                    }
                )
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={
                    "valid": False,
                    "message": f"Invalid FITS file: {str(e)}",
                    "actual_type": None,
                    "expected_type": expected_type,
                    "metadata": None,
                    "warnings": []
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
                "actual_type": None,
                "expected_type": expected_type,
                "metadata": None,
                "warnings": []
            }
        )

@app.get("/list-files")
async def list_files(project_id: str, user_id: str):
    """List all files for a given project and user with their metadata."""
    try:
        conn = await asyncpg.connect(DATABASE_URL)
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
            
            # Extract the file type from metadata
            file_type = get_frame_type_from_header(fits.Header(metadata))
            
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

DATABASE_URL = os.environ.get("SUPABASE_DB_URL")  # Set this in your environment

async def save_fits_metadata(file_path, project_id, user_id, metadata):
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute(
        """
        insert into fits_metadata (file_path, project_id, user_id, metadata)
        values ($1, $2, $3, $4)
        on conflict (file_path) do update set metadata = $4
        """,
        file_path, project_id, user_id, json.dumps(metadata)
    )
    await conn.close()

async def get_fits_metadata(file_path):
    conn = await asyncpg.connect(DATABASE_URL)
    row = await conn.fetchrow("select metadata from fits_metadata where file_path = $1", file_path)
    await conn.close()
    return row['metadata'] if row else None

# Example usage after validation:
# await save_fits_metadata(file_path, project_id, user_id, metadata)

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 