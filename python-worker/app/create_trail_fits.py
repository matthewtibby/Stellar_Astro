import numpy as np
from astropy.io import fits
import cv2

def create_trail_fits(
    out_path="test_trail.fits",
    shape=(256, 256),
    noise_level=20,
    trail_brightness=200,
    trail_thickness=2,
    start=(30, 40),
    end=(220, 200)
):
    # 1. Create background with Gaussian noise
    img = np.random.normal(loc=100, scale=noise_level, size=shape).astype(np.float32)
    # 2. Draw a bright line (trail)
    img = cv2.line(img, start, end, color=trail_brightness, thickness=trail_thickness)
    # 3. Save as FITS
    hdu = fits.PrimaryHDU(img)
    hdu.writeto(out_path, overwrite=True)
    print(f"Created {out_path} with a synthetic trail.")

if __name__ == "__main__":
    create_trail_fits() 