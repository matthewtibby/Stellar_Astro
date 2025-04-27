from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from astropy.io import fits
import uvicorn
from typing import Optional
import tempfile
import os
import asyncio
import signal
import time
import sys

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
    Determine the frame type from FITS header keywords.
    Common keywords that indicate frame type:
    - IMAGETYP: Most common keyword for frame type
    - OBSTYPE: Alternative keyword used by some observatories
    - FILTER: Can help determine frame type
    - EXPTIME: Exposure time can help distinguish between types
    - OBJECT: Object name can provide context
    """
    # Try IMAGETYP first (most common)
    if 'IMAGETYP' in header:
        imagetyp = str(header['IMAGETYP']).strip().lower()
        if 'light' in imagetyp or 'object' in imagetyp:
            return 'light'
        elif 'dark' in imagetyp:
            return 'dark'
        elif 'flat' in imagetyp:
            return 'flat'
        elif 'bias' in imagetyp or 'zero' in imagetyp:
            return 'bias'
    
    # Try OBSTYPE as fallback
    if 'OBSTYPE' in header:
        obstype = str(header['OBSTYPE']).strip().lower()
        if 'light' in obstype or 'object' in obstype:
            return 'light'
        elif 'dark' in obstype:
            return 'dark'
        elif 'flat' in obstype:
            return 'flat'
        elif 'bias' in obstype or 'zero' in obstype:
            return 'bias'
    
    # Use EXPTIME and FILTER as additional hints
    exptime = header.get('EXPTIME', 0)
    filter_name = str(header.get('FILTER', '')).strip().lower()
    
    # Dark frames typically have longer exposure times and no filter
    if exptime > 0 and not filter_name:
        return 'dark'
    
    # Flat frames typically have filters and moderate exposure times
    if filter_name and 0 < exptime < 10:
        return 'flat'
    
    # If we can't determine the type, return None
    return None

def extract_metadata(header: fits.header.Header) -> dict:
    """Extract relevant metadata from FITS header."""
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
        'observation_type': header.get('OBSTYPE')
    }

@app.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Python worker is running"}

@app.post("/validate-fits")
async def validate_fits_file(
    file: UploadFile = File(...),
    expected_type: Optional[str] = None
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
                
                # Determine the actual frame type
                actual_type = get_frame_type_from_header(header)
                
                # Extract metadata
                metadata = extract_metadata(header)
                
                # Validate against expected type if provided
                if expected_type and actual_type and expected_type.lower() != actual_type.lower():
                    return JSONResponse(
                        status_code=200,  # Changed to 200 to allow client-side handling
                        content={
                            "valid": False,
                            "message": f"Frame type mismatch. Expected {expected_type}, got {actual_type}",
                            "actual_type": actual_type,
                            "expected_type": expected_type,
                            "metadata": metadata,
                            "warnings": [
                                f"File appears to be a {actual_type} frame but was uploaded as {expected_type}",
                                "Consider re-uploading in the correct category"
                            ]
                        }
                    )
                
                # Check for potential issues
                warnings = []
                if actual_type == 'light' and not metadata['filter']:
                    warnings.append("Light frame missing filter information")
                if actual_type == 'flat' and metadata['exposure_time'] > 10:
                    warnings.append("Flat frame exposure time seems unusually long")
                if actual_type == 'dark' and metadata['filter']:
                    warnings.append("Dark frame has filter information, which is unusual")
                
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

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 