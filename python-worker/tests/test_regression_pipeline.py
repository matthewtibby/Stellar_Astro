import os
import pytest
import json
from astropy.io import fits
from app.fits_analysis import analyze_fits_headers

# Directory paths for golden data
INPUT_DIR = os.path.join(os.path.dirname(__file__), 'golden_data', 'input')
EXPECTED_DIR = os.path.join(os.path.dirname(__file__), 'golden_data', 'expected')


def test_calibration_pipeline_regression():
    """
    Regression test for the calibration pipeline using golden datasets.
    Loads each FITS file in INPUT_DIR, runs analysis, and compares to expected results in EXPECTED_DIR.
    """
    input_files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.fits')]
    assert input_files, "No input FITS files found for regression test."

    for fits_file in input_files:
        input_path = os.path.join(INPUT_DIR, fits_file)
        expected_json = fits_file.replace('.fits', '.json')
        expected_path = os.path.join(EXPECTED_DIR, expected_json)
        assert os.path.exists(expected_path), f"Expected result file missing: {expected_json}"

        # Load expected results
        with open(expected_path, 'r') as f:
            expected = json.load(f)

        # Analyze FITS file
        with fits.open(input_path) as hdul:
            header = hdul[0].header
            result = analyze_fits_headers(header)

        # Compare detected type
        assert result.type == expected['type'], f"{fits_file}: Detected type {result.type}, expected {expected['type']}"
        # Compare key metadata fields (optional, can expand as needed)
        for key, exp_val in expected.get('metadata', {}).items():
            actual_val = result.metadata.get(key)
            assert actual_val == exp_val, f"{fits_file}: Metadata field '{key}' = {actual_val}, expected {exp_val}"
        # Check warnings if present
        if 'warnings' in expected:
            for warn in expected['warnings']:
                assert any(warn in w for w in result.warnings), f"{fits_file}: Expected warning '{warn}' not found in {result.warnings}" 