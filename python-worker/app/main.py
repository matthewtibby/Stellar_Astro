from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from astropy.io import fits
import uvicorn
from typing import Dict, Optional
import tempfile
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
) -> Dict:
    """
    Validate a FITS file and determine its frame type.
    If expected_type is provided, verify that the file matches the expected type.
    """
    if not file.filename.lower().endswith(('.fits', '.fit', '.fts')):
        raise HTTPException(status_code=400, detail="File must be a FITS file")
    
    # Create a temporary file to store the upload
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file.flush()
        
        try:
            # Open the FITS file
            with fits.open(temp_file.name) as hdul:
                # Get the primary header
                header = hdul[0].header
                
                # Determine the frame type
                actual_type = get_frame_type_from_header(header)
                
                if actual_type is None:
                    return {
                        "valid": False,
                        "message": "Could not determine frame type from FITS header",
                        "actual_type": None,
                        "expected_type": expected_type
                    }
                
                # If expected_type is provided, verify it matches
                if expected_type and actual_type != expected_type:
                    return {
                        "valid": False,
                        "message": f"Frame type mismatch. Expected {expected_type}, got {actual_type}",
                        "actual_type": actual_type,
                        "expected_type": expected_type
                    }
                
                return {
                    "valid": True,
                    "message": "Frame type validated successfully",
                    "actual_type": actual_type,
                    "expected_type": expected_type
                }
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing FITS file: {str(e)}")
        finally:
            # Clean up the temporary file
            os.unlink(temp_file.name)

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 