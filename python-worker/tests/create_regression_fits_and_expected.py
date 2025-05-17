import os
import json
from astropy.io import fits

def make_fits(path, headers):
    hdu = fits.PrimaryHDU()
    for k, v in headers.items():
        hdu.header[k] = v
    hdu.writeto(path, overwrite=True)

base_dir = os.path.dirname(__file__)
input_dir = os.path.join(base_dir, 'golden_data', 'input')
expected_dir = os.path.join(base_dir, 'golden_data', 'expected')
os.makedirs(input_dir, exist_ok=True)
os.makedirs(expected_dir, exist_ok=True)

# 1. Normal light frame
make_fits(os.path.join(input_dir, 'test_light.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 60, 'FILTER': 'R', 'OBJECT': 'M31', 'GAIN': 1.5, 'CCD-TEMP': -10, 'FOCALLEN': 800
})
with open(os.path.join(expected_dir, 'test_light.json'), 'w') as f:
    json.dump({'type': 'light'}, f)

# 2. Normal dark frame
make_fits(os.path.join(input_dir, 'test_dark.fits'), {
    'IMAGETYP': 'dark', 'EXPTIME': 60, 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_dark.json'), 'w') as f:
    json.dump({'type': 'dark'}, f)

# 3. Normal flat frame
make_fits(os.path.join(input_dir, 'test_flat.fits'), {
    'IMAGETYP': 'flat', 'EXPTIME': 5, 'FILTER': 'R', 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_flat.json'), 'w') as f:
    json.dump({'type': 'flat'}, f)

# 4. Normal bias frame
make_fits(os.path.join(input_dir, 'test_bias.fits'), {
    'IMAGETYP': 'bias', 'EXPTIME': 0, 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_bias.json'), 'w') as f:
    json.dump({'type': 'bias'}, f)

# 5. Light frame with zero exposure (edge case)
make_fits(os.path.join(input_dir, 'test_light_zero_exp.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 0, 'FILTER': 'R', 'OBJECT': 'M31', 'GAIN': 1.5, 'CCD-TEMP': -10, 'FOCALLEN': 800
})
with open(os.path.join(expected_dir, 'test_light_zero_exp.json'), 'w') as f:
    json.dump({'type': 'bias', 'warnings': ['Exposure time is zero or negative for light frame']}, f)

# 6. Flat frame missing filter (edge case)
make_fits(os.path.join(input_dir, 'test_flat_missing_filter.fits'), {
    'IMAGETYP': 'flat', 'EXPTIME': 5, 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_flat_missing_filter.json'), 'w') as f:
    json.dump({'type': 'flat', 'warnings': ['Missing filter: Filter used - Color Camera: None (OSC only), UV/IR Cut, Light Pollution, Duo-Band Ha/OIII (6nm/7nm), Duo-Band Ha/OIII (12nm), Tri-Band Ha/OIII/SII (6nm/7nm), UV/IR Cut + Duo-Band, UV/IR Cut + Light Pollution | Mono: LRGB Set, Narrowband Set Ha/OIII/SII, Ha (3nm), Ha (6nm/7nm), OIII (3nm), OIII (6nm/7nm), SII (3nm), SII (6nm/7nm)']}, f)

# 7. Light frame with unusual filter name (edge case)
make_fits(os.path.join(input_dir, 'test_light_unusual_filter.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 60, 'FILTER': 'SuperMegaFilterX', 'OBJECT': 'M31', 'GAIN': 1.5, 'CCD-TEMP': -10, 'FOCALLEN': 800
})
with open(os.path.join(expected_dir, 'test_light_unusual_filter.json'), 'w') as f:
    json.dump({'type': 'light'}, f)

# Advanced/complex cases
# 8. Flat frame with bandwidth mismatch
make_fits(os.path.join(input_dir, 'test_flat_bandwidth_mismatch.fits'), {
    'IMAGETYP': 'flat', 'EXPTIME': 5, 'FILTER': 'R (10nm)', 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_flat_bandwidth_mismatch.json'), 'w') as f:
    json.dump({'type': 'flat', 'warnings': ['Ensure flat frame filter exactly matches light frame filter (including bandwidth)']}, f)

# 9. Light frame missing OBJECT
make_fits(os.path.join(input_dir, 'test_light_missing_object.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 60, 'FILTER': 'R', 'GAIN': 1.5, 'CCD-TEMP': -10, 'FOCALLEN': 800
})
with open(os.path.join(expected_dir, 'test_light_missing_object.json'), 'w') as f:
    json.dump({'type': 'light', 'warnings': ['Missing object: Name of the target object']}, f)

# 10. Dark frame with high gain
make_fits(os.path.join(input_dir, 'test_dark_high_gain.fits'), {
    'IMAGETYP': 'dark', 'EXPTIME': 60, 'GAIN': 200, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_dark_high_gain.json'), 'w') as f:
    json.dump({'type': 'dark', 'warnings': ['Gain is unusually high']}, f)

# 11. Light frame with extreme CCD-TEMP
make_fits(os.path.join(input_dir, 'test_light_unusual_temp.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 60, 'FILTER': 'R', 'OBJECT': 'M31', 'GAIN': 1.5, 'CCD-TEMP': 100, 'FOCALLEN': 800
})
with open(os.path.join(expected_dir, 'test_light_unusual_temp.json'), 'w') as f:
    json.dump({'type': 'light', 'warnings': ['Unusual CCD temperature: 100°C']}, f)

# 12. Flat frame with unmatched manufacturer (simulate by using a filter name with a known manufacturer, but not matching light)
make_fits(os.path.join(input_dir, 'test_flat_unmatched_manufacturer.fits'), {
    'IMAGETYP': 'flat', 'EXPTIME': 5, 'FILTER': 'Optolong R', 'GAIN': 1.5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_flat_unmatched_manufacturer.json'), 'w') as f:
    json.dump({'type': 'flat', 'warnings': ['Ensure flat frame filter exactly matches light frame filter (including bandwidth)']}, f)

# 13. Light frame with unknown camera
make_fits(os.path.join(input_dir, 'test_light_unknown_camera.fits'), {
    'IMAGETYP': 'light', 'EXPTIME': 60, 'FILTER': 'R', 'OBJECT': 'M31', 'GAIN': 1.5, 'CCD-TEMP': -10, 'FOCALLEN': 800, 'INSTRUME': 'UnknownCamX1000'
})
with open(os.path.join(expected_dir, 'test_light_unknown_camera.json'), 'w') as f:
    json.dump({'type': 'light', 'warnings': ['Color camera detected but no filter information found']}, f)

# 14. Bias frame with negative gain
make_fits(os.path.join(input_dir, 'test_bias_negative_gain.fits'), {
    'IMAGETYP': 'bias', 'EXPTIME': 0, 'GAIN': -5, 'CCD-TEMP': -10
})
with open(os.path.join(expected_dir, 'test_bias_negative_gain.json'), 'w') as f:
    json.dump({'type': 'bias', 'warnings': ['Gain is zero or negative']}, f)

print('Generated advanced regression FITS files and expected JSONs.') 