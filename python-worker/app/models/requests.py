from pydantic import BaseModel
from typing import Optional, List

class CalibrationJobRequest(BaseModel):
    input_bucket: str
    input_paths: List[str]
    output_bucket: str
    output_base: str
    settings: dict = {}
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[dict] = None
    test_name: Optional[str] = None
    frame_type: Optional[str] = None

class CancelJobRequest(BaseModel):
    jobId: str

class CosmeticMaskRequest(BaseModel):
    input_bucket: str
    input_paths: List[str]  # List of dark frame paths for mask generation
    output_bucket: str
    output_base: str  # Base path for mask output
    project_id: str
    user_id: str
    settings: dict = {}  # sigma, min_bad_fraction, etc.

class PatternedNoiseRequest(BaseModel):
    input_bucket: str
    input_paths: List[str]  # List of image paths to correct
    output_bucket: str
    output_base: str  # Base path for corrected images
    project_id: str
    user_id: str
    settings: dict = {}  # method, filter_size, strength, etc.

class TrailDetectRequest(BaseModel):
    fits_path: Optional[str] = None  # Path to FITS file in storage
    sensitivity: float = 0.5
    min_length: int = 30
    mask_output: bool = True
    preview_output: bool = True
    output_dir: str = "output"

class OutlierDetectRequest(BaseModel):
    fits_paths: Optional[List[str]] = None  # Either full paths OR just filenames
    bucket: Optional[str] = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: Optional[str] = None
    user_id: Optional[str] = None 
    frame_type: Optional[str] = None  # 'bias', 'dark', 'flat'
    sigma_thresh: float = 3.0

class FrameConsistencyRequest(BaseModel):
    fits_paths: Optional[List[str]] = None  # Either full paths OR just filenames
    bucket: Optional[str] = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: Optional[str] = None
    user_id: Optional[str] = None 
    frame_type: Optional[str] = None  # 'bias', 'dark', 'flat'
    consistency_threshold: float = 0.7  # Minimum consistency score (0-1)
    sigma_threshold: float = 2.5  # Sigma threshold for outlier detection
    min_frames: int = 5  # Minimum frames to recommend
    max_frames: Optional[int] = None  # Maximum frames to recommend

class CosmicRayDetectionRequest(BaseModel):
    fits_paths: Optional[List[str]] = None  # Either full paths OR just filenames
    bucket: Optional[str] = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: Optional[str] = None
    user_id: Optional[str] = None 
    frame_type: Optional[str] = None  # 'bias', 'dark', 'flat', 'light'
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
    multi_methods: List[str] = ['lacosmic', 'sigma_clip']  # Methods for multi-algorithm
    combine_method: str = 'intersection'  # 'intersection', 'union', 'voting'
    analyze_image_quality: bool = True  # Generate image quality metrics

class GradientAnalysisRequest(BaseModel):
    fits_paths: Optional[List[str]] = None  # Either full paths OR just filenames
    bucket: Optional[str] = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: Optional[str] = None
    user_id: Optional[str] = None 
    frame_type: Optional[str] = None  # 'dark', 'flat' (auto-detected if None)

class HistogramAnalysisRequest(BaseModel):
    fits_paths: Optional[List[str]] = None  # Either full paths OR just filenames
    bucket: Optional[str] = None  # Supabase bucket name (e.g. 'fits-files')
    project_id: Optional[str] = None
    user_id: Optional[str] = None 
    frame_type: Optional[str] = None  # 'bias', 'dark', 'flat' (auto-detected if None) 