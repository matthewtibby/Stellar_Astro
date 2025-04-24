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

signal.signal(signal.SIGTERM, handle_sigterm)

# Add a request timeout handler
@app.middleware("http")
async def timeout_middleware(request, call_next):
    try:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={"detail": "Request timeout"}
        )

def get_frame_type_from_header(header: fits.header.Header) -> str:
    """
    Determine the frame type from FITS header keywords.
    Common keywords that indicate frame type:
    - IMAGETYP: Most common keyword for frame type
    - OBSTYPE: Alternative keyword used by some observatories
    - FILTER: Can help determine frame type
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
    
    # If we can't determine the type, return None
    return None

@app.post("/validate-fits")
async def validate_fits_file(
    file: UploadFile = File(...),
    expected_type: Optional[str] = None
) -> JSONResponse:
    """
    Validate a FITS file and determine its frame type.
    If expected_type is provided, verify that the file matches the expected type.
    """
    try:
        # Set a timeout for the entire operation
        async with asyncio.timeout(30):  # 30 second timeout
            # Check file extension
            if not file.filename.lower().endswith(('.fits', '.fit', '.fts', '.raw')):
                return JSONResponse(
                    status_code=400,
                    content={
                        "valid": False,
                        "message": "File must be a FITS file",
                        "actual_type": None,
                        "expected_type": expected_type
                    }
                )
            
            # Create a temporary file to store the upload
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                try:
                    # Read the file content as binary
                    content = await file.read()
                    temp_file.write(content)
                    temp_file.flush()
                    
                    # Open the FITS file
                    with fits.open(temp_file.name) as hdul:
                        # Get the primary header
                        header = hdul[0].header
                        
                        # Determine the frame type
                        actual_type = get_frame_type_from_header(header)
                        
                        if actual_type is None:
                            return JSONResponse(
                                status_code=400,
                                content={
                                    "valid": False,
                                    "message": "Could not determine frame type from FITS header. Please check if the file is a valid FITS file.",
                                    "actual_type": None,
                                    "expected_type": expected_type
                                }
                            )
                        
                        # If expected_type is provided, verify it matches
                        if expected_type and actual_type != expected_type:
                            return JSONResponse(
                                status_code=400,
                                content={
                                    "valid": False,
                                    "message": f"Frame type mismatch. Expected {expected_type}, got {actual_type}",
                                    "actual_type": actual_type,
                                    "expected_type": expected_type
                                }
                            )
                        
                        return JSONResponse(
                            status_code=200,
                            content={
                                "valid": True,
                                "message": "Frame type validated successfully",
                                "actual_type": actual_type,
                                "expected_type": expected_type
                            }
                        )
                        
                except Exception as e:
                    error_message = str(e)
                    if "Not a FITS file" in error_message:
                        return JSONResponse(
                            status_code=400,
                            content={
                                "valid": False,
                                "message": "The file is not a valid FITS file",
                                "actual_type": None,
                                "expected_type": expected_type
                            }
                        )
                    return JSONResponse(
                        status_code=500,
                        content={
                            "valid": False,
                            "message": f"Error processing FITS file: {error_message}",
                            "actual_type": None,
                            "expected_type": expected_type
                        }
                    )
                finally:
                    # Clean up the temporary file
                    try:
                        os.unlink(temp_file.name)
                    except:
                        pass
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={
                "valid": False,
                "message": "Validation request timed out",
                "actual_type": None,
                "expected_type": expected_type
            }
        )

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

if __name__ == "__main__":
    # Force port 8000 and prevent port changes
    os.environ['PORT'] = '8000'  # Override any environment variables
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 