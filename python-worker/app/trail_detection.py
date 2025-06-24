import numpy as np
from astropy.io import fits
import cv2
from skimage.filters import median
from skimage.morphology import disk
from skimage.transform import probabilistic_hough_line
from skimage import img_as_ubyte
import matplotlib.pyplot as plt
import os


def detect_trails(
    fits_path,
    sensitivity=0.5,
    min_length=30,
    mask_output=True,
    preview_output=True,
    output_dir="output",
    canny_sigma=2.0,
    canny_low=50,
    canny_high=150,
    hough_threshold=10,
    line_gap=3,
    line_length=30,
):
    """
    Detects linear trails (satellite/airplane) in a FITS image.
    Args:
        fits_path (str): Path to FITS file.
        sensitivity (float): 0-1, lower is more sensitive.
        min_length (int): Minimum length of trail in pixels.
        mask_output (bool): Whether to save a FITS mask.
        preview_output (bool): Whether to save a PNG preview.
        output_dir (str): Where to save outputs.
        canny_sigma (float): Gaussian sigma for Canny.
        canny_low (int): Canny low threshold.
        canny_high (int): Canny high threshold.
        hough_threshold (int): Minimum number of votes for Hough.
        line_gap (int): Max gap between line segments.
        line_length (int): Minimum accepted length of detected lines.
    Returns:
        dict: Info about detected trails, mask path, preview path.
    """
    os.makedirs(output_dir, exist_ok=True)
    # 1. Read FITS
    with fits.open(fits_path) as hdul:
        data = hdul[0].data.astype(np.float32)
    # 2. Normalize and median filter
    norm = (data - np.percentile(data, 5)) / (np.percentile(data, 99) - np.percentile(data, 5))
    norm = np.clip(norm, 0, 1)
    med = median(norm, disk(3))
    # 3. Subtract background
    bg = median(med, disk(20))
    sub = med - bg
    sub = np.clip(sub, 0, 1)
    # 4. Canny edge detection
    edges = cv2.Canny(img_as_ubyte(sub),
                      int(canny_low * (1-sensitivity)),
                      int(canny_high * (1-sensitivity)),
                      apertureSize=3, L2gradient=True)
    # 5. Probabilistic Hough Transform
    lines = probabilistic_hough_line(
        edges,
        threshold=hough_threshold,
        line_length=max(min_length, line_length),
        line_gap=line_gap
    )
    # 6. Filter lines by length
    filtered = []
    for (p0, p1) in lines:
        length = np.hypot(p1[0]-p0[0], p1[1]-p0[1])
        if length >= min_length:
            filtered.append((p0, p1, length))
    # 7. Generate mask
    mask = np.zeros_like(data, dtype=np.uint8)
    for (p0, p1, _) in filtered:
        cv2.line(mask, tuple(p0), tuple(p1), color=1, thickness=2)
    mask_path = None
    if mask_output:
        mask_hdu = fits.PrimaryHDU(mask.astype(np.uint8))
        mask_path = os.path.join(output_dir, os.path.basename(fits_path).replace('.fits', '_trailmask.fits'))
        mask_hdu.writeto(mask_path, overwrite=True)
    # 8. Generate preview
    preview_path = None
    if preview_output:
        fig, ax = plt.subplots(figsize=(8,8))
        ax.imshow(norm, cmap='gray', origin='lower')
        for (p0, p1, _) in filtered:
            ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color='red', linewidth=2)
        ax.set_title('Detected Trails')
        ax.axis('off')
        preview_path = os.path.join(output_dir, os.path.basename(fits_path).replace('.fits', '_trailpreview.png'))
        plt.savefig(preview_path, bbox_inches='tight', pad_inches=0)
        plt.close(fig)
    # 9. Prepare output
    trails = [
        {
            'start': p0,
            'end': p1,
            'length': float(length),
            'angle': float(np.degrees(np.arctan2(p1[1]-p0[1], p1[0]-p0[0])))
        }
        for (p0, p1, length) in filtered
    ]
    return {
        'num_trails': len(trails),
        'trails': trails,
        'mask_path': mask_path,
        'preview_path': preview_path
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Detect satellite/airplane trails in FITS images.")
    parser.add_argument("fits_path", help="Path to FITS file")
    parser.add_argument("--sensitivity", type=float, default=0.5)
    parser.add_argument("--min_length", type=int, default=30)
    parser.add_argument("--output_dir", type=str, default="output")
    args = parser.parse_args()
    result = detect_trails(args.fits_path, sensitivity=args.sensitivity, min_length=args.min_length, output_dir=args.output_dir)
    print(result) 