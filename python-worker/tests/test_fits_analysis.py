import pytest
from astropy.io import fits
from app.fits_analysis import analyze_fits_headers, FitsAnalysisResult

def create_test_header(**kwargs):
    """Helper function to create a test FITS header with given keywords."""
    header = fits.Header()
    for key, value in kwargs.items():
        header[key] = value
    return header

def test_light_frame_detection():
    """Test detection of light frames with various header combinations."""
    # Test case 1: Clear light frame with object and filter
    header = create_test_header(
        IMAGETYP='light',
        EXPTIME=60,
        FILTER='R',
        OBJECT='M31'
    )
    result = analyze_fits_headers(header)
    assert result.type == 'light'
    assert result.confidence > 0.8
    assert len(result.warnings) == 0

    # Test case 2: Light frame with only object name
    header = create_test_header(
        IMAGETYP='object',
        EXPTIME=30,
        OBJECT='M42'
    )
    result = analyze_fits_headers(header)
    assert result.type == 'light'
    assert result.confidence > 0.6
    assert any('filter' in w.lower() for w in result.warnings)

def test_dark_frame_detection():
    """Test detection of dark frames."""
    # Test case 1: Clear dark frame
    header = create_test_header(
        IMAGETYP='dark',
        EXPTIME=60
    )
    result = analyze_fits_headers(header)
    assert result.type == 'dark'
    assert result.confidence > 0.8
    assert len(result.warnings) == 0

    # Test case 2: Dark frame with unusual exposure
    header = create_test_header(
        IMAGETYP='dark',
        EXPTIME=0.5
    )
    result = analyze_fits_headers(header)
    assert result.type == 'dark'
    assert result.confidence > 0.6

def test_flat_frame_detection():
    """Test detection of flat frames."""
    # Test case 1: Clear flat frame
    header = create_test_header(
        IMAGETYP='flat',
        EXPTIME=5,
        FILTER='R'
    )
    result = analyze_fits_headers(header)
    assert result.type == 'flat'
    assert result.confidence > 0.8
    assert len(result.warnings) == 0

    # Test case 2: Flat frame with filter in name
    header = create_test_header(
        IMAGETYP='flat field',
        EXPTIME=3,
        FILTER='flat-R'
    )
    result = analyze_fits_headers(header)
    assert result.type == 'flat'
    assert result.confidence > 0.8

def test_bias_frame_detection():
    """Test detection of bias frames."""
    # Test case 1: Clear bias frame
    header = create_test_header(
        IMAGETYP='bias',
        EXPTIME=0
    )
    result = analyze_fits_headers(header)
    assert result.type == 'bias'
    assert result.confidence > 0.8
    assert len(result.warnings) == 0

    # Test case 2: Zero frame
    header = create_test_header(
        IMAGETYP='zero',
        EXPTIME=0
    )
    result = analyze_fits_headers(header)
    assert result.type == 'bias'
    assert result.confidence > 0.8

def test_low_confidence_cases():
    """Test cases that should result in low confidence."""
    # Test case 1: Missing critical headers
    header = create_test_header(
        EXPTIME=30
    )
    result = analyze_fits_headers(header)
    assert result.confidence < 0.6
    assert any('low confidence' in w.lower() for w in result.warnings)

    # Test case 2: Conflicting indicators
    header = create_test_header(
        IMAGETYP='light',
        EXPTIME=0,
        OBJECT='M31'
    )
    result = analyze_fits_headers(header)
    assert result.confidence < 0.7
    assert any('exposure time' in w.lower() for w in result.warnings)

def test_metadata_extraction():
    """Test extraction of metadata from headers."""
    header = create_test_header(
        IMAGETYP='light',
        EXPTIME=60,
        FILTER='R',
        OBJECT='M31',
        INSTRUME='Telescope1',
        TELESCOP='Observatory1',
        GAIN=1.5,
        CCDTEMP=-10,
        XBINNING=2,
        YBINNING=2
    )
    result = analyze_fits_headers(header)
    assert result.metadata['exposure_time'] == 60
    assert result.metadata['filter'] == 'R'
    assert result.metadata['object'] == 'M31'
    assert result.metadata['instrument'] == 'Telescope1'
    assert result.metadata['binning'] == '2x2'
    assert result.metadata['temperature'] == -10
    assert result.metadata['gain'] == 1.5 