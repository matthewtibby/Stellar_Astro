from astropy.io import fits
import numpy as np
import os

def create_fits_file(filename, headers, data_shape=(100, 100)):
    """Create a FITS file with given headers and random data."""
    # Create random data
    data = np.random.normal(size=data_shape)
    
    # Create HDU
    hdu = fits.PrimaryHDU(data)
    
    # Add headers
    for key, value in headers.items():
        hdu.header[key] = value
    
    # Save file
    hdu.writeto(f'sample_data/{filename}', overwrite=True)
    print(f"Created: {filename}")

# Create sample files
if __name__ == "__main__":
    # Light frame (with full headers)
    create_fits_file(
        "light_frame_full.fits",
        {
            'IMAGETYP': 'LIGHT',
            'EXPTIME': 300.0,
            'FILTER': 'R',
            'OBJECT': 'M31',
            'DATE-OBS': '2024-04-30T20:00:00',
            'INSTRUME': 'Sample Camera',
            'TELESCOP': 'Sample Telescope',
            'GAIN': 1.5,
            'CCD-TEMP': -10.0,
            'XBINNING': 1,
            'YBINNING': 1
        }
    )

    # Light frame (minimal headers)
    create_fits_file(
        "light_frame_minimal.fits",
        {
            'IMAGETYP': 'LIGHT',
            'EXPTIME': 180.0,
            'OBJECT': 'M51'
        }
    )

    # Dark frame
    create_fits_file(
        "dark_frame.fits",
        {
            'IMAGETYP': 'DARK',
            'EXPTIME': 300.0,
            'DATE-OBS': '2024-04-30T20:30:00',
            'INSTRUME': 'Sample Camera',
            'CCD-TEMP': -10.0
        }
    )

    # Flat frame
    create_fits_file(
        "flat_frame.fits",
        {
            'IMAGETYP': 'FLAT',
            'EXPTIME': 3.0,
            'FILTER': 'R',
            'DATE-OBS': '2024-04-30T19:00:00',
            'INSTRUME': 'Sample Camera'
        }
    )

    # Bias frame
    create_fits_file(
        "bias_frame.fits",
        {
            'IMAGETYP': 'BIAS',
            'EXPTIME': 0.0,
            'DATE-OBS': '2024-04-30T19:30:00',
            'INSTRUME': 'Sample Camera',
            'CCD-TEMP': -10.0
        }
    )

    # Ambiguous frame (missing type)
    create_fits_file(
        "ambiguous_frame.fits",
        {
            'EXPTIME': 1.0,
            'DATE-OBS': '2024-04-30T21:00:00',
            'INSTRUME': 'Sample Camera'
        }
    )

    print("\nAll sample FITS files created in sample_data directory") 