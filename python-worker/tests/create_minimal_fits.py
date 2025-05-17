from astropy.io import fits
import os

output_dir = os.path.join(os.path.dirname(__file__), 'golden_data', 'input')
os.makedirs(output_dir, exist_ok=True)

hdu = fits.PrimaryHDU()
hdr = hdu.header
hdr['IMAGETYP'] = 'light'
hdr['EXPTIME'] = 60
hdr['FILTER'] = 'R'
hdr['OBJECT'] = 'M31'
hdr['GAIN'] = 1.5
hdr['CCD-TEMP'] = -10
hdr['FOCALLEN'] = 800

hdu.writeto(os.path.join(output_dir, 'test_light.fits'), overwrite=True)
print(f"Created test_light.fits in {output_dir}") 