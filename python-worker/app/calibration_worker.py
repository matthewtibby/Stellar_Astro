"""
calibration_worker.py

Calibration Worker: Core logic for Master Bias, Dark, and Flat frame creation.
- Implements stacking (mean, median, sigma-clipping, winsorized, linear fit)
- Cosmetic correction (hot/cold pixel removal)
- Extensible for advanced options (custom rejection, etc)
- Leverages astropy, ccdproc, numpy, and open source best practices

References:
- PixInsight: https://pixinsight.com/doc/docs/BatchPreprocessing/BatchPreprocessing.html
- Astro Pixel Processor: https://www.astropixelprocessor.com/manual/
- Siril: https://siril.org/processing/
- Open source: https://github.com/avilqu/astro-pipelines, https://github.com/ricsonc/aptools
"""

import numpy as np
from astropy.io import fits
from ccdproc import Combiner
from typing import List, Optional, Dict
import argparse
import os
import warnings
from astropy.nddata import CCDData
import astropy.units as u
import matplotlib.pyplot as plt
import tempfile
from .supabase_io import download_file, upload_file, get_public_url, list_files

# --- Stacking Methods ---
def load_ccd_list(file_list):
    """Load FITS files as CCDData objects (for ccdproc Combiner)."""
    return [CCDData.read(f, unit="adu") for f in file_list]

def load_numpy_list(file_list):
    """Load FITS files as numpy arrays (for custom stacking)."""
    return [fits.getdata(f) for f in file_list]

def stack_frames(file_list: List[str], method: str = 'median', sigma_clip: Optional[float] = None) -> np.ndarray:
    """
    Stack FITS files using the specified method.
    method: 'mean', 'median', 'sigma', 'winsorized', 'linear_fit', 'minmax', 'adaptive'
    sigma_clip: threshold for sigma clipping (if used)
    """
    if method in ['mean', 'median', 'sigma']:
        ccd_list = load_ccd_list(file_list)
        comb = Combiner(ccd_list)
        if method == 'mean':
            return comb.average_combine().data
        elif method == 'median':
            return comb.median_combine().data
        elif method == 'sigma':
            if sigma_clip is None:
                sigma_clip = 3.0
            comb.sigma_clipping(low_thresh=sigma_clip, high_thresh=sigma_clip)
            return comb.average_combine().data
    # numpy-based methods
    data = load_numpy_list(file_list)
    arr = np.stack(data, axis=0)
    if method == 'winsorized':
        if sigma_clip is None:
            sigma_clip = 3.0
        med = np.median(arr, axis=0)
        std = np.std(arr, axis=0)
        lower = med - sigma_clip * std
        upper = med + sigma_clip * std
        arr_winsor = np.clip(arr, lower, upper)
        return np.mean(arr_winsor, axis=0)
    elif method == 'minmax':
        if arr.shape[0] <= 2:
            print("[WARN] Not enough frames for minmax rejection, falling back to mean.")
            return np.mean(arr, axis=0)
        arr_sorted = np.sort(arr, axis=0)
        arr_trimmed = arr_sorted[1:-1, ...]
        return np.mean(arr_trimmed, axis=0)
    elif method == 'linear_fit':
        if sigma_clip is None:
            sigma_clip = 3.0
        n_frames = arr.shape[0]
        x = np.arange(n_frames)
        arr_flat = arr.reshape(n_frames, -1)
        fit = np.polyfit(x, arr_flat, 1)
        fit_vals = np.outer(x, fit[0]) + fit[1]
        residuals = arr_flat - fit_vals
        std = np.std(residuals, axis=0)
        mask = np.abs(residuals) < (sigma_clip * std)
        result = np.zeros(arr_flat.shape[1])
        for i in range(arr_flat.shape[1]):
            valid = arr_flat[mask[:, i], i]
            if valid.size > 0:
                result[i] = np.mean(valid)
            else:
                result[i] = np.mean(arr_flat[:, i])
        return result.reshape(arr.shape[1:])
    elif method == 'adaptive':
        # Layman's explanation:
        # Adaptive stacking gives more weight to frames that are more consistent (less noisy) at each pixel.
        # If the variance is very small, the weight can become huge, so we set a minimum variance to avoid this.
        # This keeps the output on the same scale as the input and prevents weirdly low results.
        arr = arr.astype(np.float64)
        var = np.var(arr, axis=0)
        var = np.maximum(var, 1.0)  # Floor variance to avoid division by zero or tiny numbers
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            weights = 1.0 / var
        weights_sum = np.sum(weights, axis=0)
        weights_sum[weights_sum == 0] = 1.0
        weighted = np.sum(arr * weights, axis=0) / weights_sum
        # Debug: print some stats
        print(f"[adaptive] var: min={np.min(var)}, max={np.max(var)}, mean={np.mean(var):.2f}")
        print(f"[adaptive] weights: min={np.min(weights)}, max={np.max(weights)}, mean={np.mean(weights):.2e}")
        return weighted
    else:
        raise ValueError(f"Unknown stacking method: {method}")

# --- Cosmetic Correction (Stub) ---
def cosmetic_correction(data: np.ndarray, method: str = 'hot_pixel_map', threshold: float = 5.0) -> np.ndarray:
    """
    Remove hot/cold pixels or cosmetic defects.
    method: 'hot_pixel_map', 'la_cosmic', etc.
    threshold: N-sigma for hot/cold pixel detection (default 5.0)
    """
    if method == 'hot_pixel_map':
        # Compute mean and std of the image
        mean = np.mean(data)
        std = np.std(data)
        # Identify hot/cold pixels
        hot_mask = data > (mean + threshold * std)
        cold_mask = data < (mean - threshold * std)
        mask = hot_mask | cold_mask
        if not np.any(mask):
            return data  # No correction needed
        # Pad data for edge pixels
        padded = np.pad(data, 1, mode='reflect')
        corrected = data.copy()
        # Replace each bad pixel with median of 3x3 neighborhood
        idxs = np.argwhere(mask)
        for y, x in idxs:
            neighborhood = padded[y:y+3, x:x+3]
            corrected[y, x] = np.median(neighborhood)
        return corrected
    # TODO: Implement other methods (e.g., la_cosmic)
    return data

# --- Main Calibration Worker Entrypoint ---
def create_master_frame(file_list: List[str], method: str = 'median', sigma_clip: Optional[float] = None, cosmetic: bool = False, cosmetic_method: str = 'hot_pixel_map', cosmetic_threshold: float = 0.5) -> np.ndarray:
    stacked = stack_frames(file_list, method, sigma_clip)
    if cosmetic:
        stacked = cosmetic_correction(stacked, cosmetic_method, cosmetic_threshold)
    return stacked

# --- Save Master Frame ---
def save_master_frame(data: np.ndarray, out_path: str, header: Optional[Dict] = None):
    hdu = fits.PrimaryHDU(data, header=fits.Header(header) if header else None)
    hdu.writeto(out_path, overwrite=True)

def analyze_frames(file_list):
    """Analyze frames for variance, outliers, and count."""
    data = load_numpy_list(file_list)
    arr = np.stack(data, axis=0).astype(np.float64)
    n_frames = arr.shape[0]
    mean = np.mean(arr, axis=0)
    std = np.std(arr, axis=0)
    # Outlier detection: count pixels > 5 sigma from mean in any frame
    outlier_count = 0
    for i in range(n_frames):
        outlier_count += np.sum(np.abs(arr[i] - mean) > 5 * std)
    total_pixels = np.prod(arr.shape[1:]) * n_frames
    outlier_ratio = outlier_count / total_pixels
    global_var = np.var(arr)
    return {
        'n_frames': n_frames,
        'global_var': global_var,
        'outlier_ratio': outlier_ratio,
        'mean': np.mean(arr),
        'std': np.mean(std),
    }

def recommend_stacking(stats, user_method, user_sigma=None):
    """Recommend stacking method and sigma threshold based on stats and user choice."""
    n = stats['n_frames']
    outlier_ratio = stats['outlier_ratio']
    var = stats['global_var']
    # Defaults
    rec_method = user_method
    rec_sigma = user_sigma if user_sigma is not None else 3.0
    reason = None
    # Logic
    if outlier_ratio > 0.001:
        if n < 10:
            rec_method = 'median'
            reason = f"High outlier ratio ({outlier_ratio:.2%}) and few frames. Median is robust."
        else:
            rec_method = 'sigma'
            rec_sigma = 2.5
            reason = f"High outlier ratio ({outlier_ratio:.2%}). Sigma-clipping (2.5) is robust."
    elif var < 10:
        rec_method = 'mean'
        reason = f"Very low variance ({var:.2f}). Mean is efficient."
    elif n < 5:
        rec_method = 'median'
        reason = f"Few frames ({n}). Median is safest."
    else:
        rec_method = user_method
        reason = f"No strong outlier/variance detected. Your choice is reasonable."
    return rec_method, rec_sigma, reason

def infer_frame_type(file_list):
    """Infer frame type from file paths (bias, dark, flat, light)."""
    for f in file_list:
        fname = f.lower()
        if 'bias' in fname:
            return 'bias'
        elif 'dark' in fname:
            return 'dark'
        elif 'flat' in fname:
            return 'flat'
        elif 'light' in fname:
            return 'light'
    return 'unknown'

def save_master_preview(data: np.ndarray, out_path: str):
    """
    Save a PNG preview of the master frame using matplotlib.
    The preview is stretched for display (1st-99th percentile).
    """
    vmin, vmax = np.percentile(data, [1, 99])
    plt.imsave(out_path, np.clip((data - vmin) / (vmax - vmin), 0, 1), cmap='gray')

def main():
    parser = argparse.ArgumentParser(description="Calibration Worker CLI: Create master calibration frames from FITS files (Supabase Storage).")
    parser.add_argument('--input-bucket', required=True, help='Supabase bucket for input files')
    parser.add_argument('--input-paths', nargs='+', required=True, help='Supabase storage paths for input FITS files')
    parser.add_argument('--output-bucket', required=True, help='Supabase bucket for output files')
    parser.add_argument('--output-base', required=True, help='Base path (no extension) for output files in Supabase')
    parser.add_argument('--method', choices=['mean', 'median', 'sigma', 'winsorized', 'linear_fit', 'minmax', 'adaptive'], default='median', help='Stacking method')
    parser.add_argument('--sigma', type=float, default=3.0, help='Sigma threshold for sigma clipping (if used)')
    parser.add_argument('--cosmetic', action='store_true', help='Enable cosmetic correction')
    parser.add_argument('--cosmetic-method', choices=['hot_pixel_map', 'la_cosmic'], default='hot_pixel_map', help='Cosmetic correction method')
    parser.add_argument('--cosmetic-threshold', type=float, default=0.5, help='Cosmetic correction threshold')
    parser.add_argument('--auto', action='store_true', help='Automatically accept recommended stacking method/threshold')
    args = parser.parse_args()

    print(f"Downloading input files from Supabase bucket '{args.input_bucket}'...")
    with tempfile.TemporaryDirectory() as tmpdir:
        local_files = []
        for i, spath in enumerate(args.input_paths):
            local_path = os.path.join(tmpdir, f"input_{i}.fits")
            prefix = os.path.dirname(spath)
            available_files = [f['name'] for f in list_files(args.input_bucket, prefix)]
            if os.path.basename(spath) not in available_files:
                print(f"[ERROR] File {spath} not found in bucket {args.input_bucket} with prefix {prefix}. Available: {available_files}")
                raise FileNotFoundError(f"File {spath} not found in Supabase Storage. Available: {available_files}")
            download_file(args.input_bucket, spath, local_path)
            local_files.append(local_path)
        print(f"Downloaded {len(local_files)} files.")

        print(f"Stacking method: {args.method}")
        if args.method in ['sigma', 'winsorized']:
            print(f"Sigma threshold: {args.sigma}")
        if args.cosmetic:
            print(f"Cosmetic correction: {args.cosmetic_method} (threshold={args.cosmetic_threshold})")

        # --- Frame analysis and recommendation for all frame types ---
        frame_type = infer_frame_type(args.input_paths)
        print(f"\n[Frame Type Detected] {frame_type.upper()}")
        stats = analyze_frames(local_files)
        rec_method, rec_sigma, reason = recommend_stacking(stats, args.method, args.sigma)
        print(f"[Analysis] {stats}")
        print(f"[Recommendation] {reason}")
        if (rec_method != args.method) or (rec_method == 'sigma' and rec_sigma != args.sigma):
            if args.auto:
                print(f"[Auto] Using recommended method: {rec_method} (sigma={rec_sigma})")
                args.method = rec_method
                args.sigma = rec_sigma
            else:
                resp = input(f"You chose {args.method} (sigma={args.sigma}). Recommend {rec_method} (sigma={rec_sigma}). Proceed with your choice? [y/N]: ")
                if resp.strip().lower() not in ['y', 'yes']:
                    print(f"Using recommended method: {rec_method} (sigma={rec_sigma})")
                    args.method = rec_method
                    args.sigma = rec_sigma

        master = create_master_frame(
            local_files,
            method=args.method,
            sigma_clip=args.sigma if args.method in ['sigma', 'winsorized'] else None,
            cosmetic=args.cosmetic,
            cosmetic_method=args.cosmetic_method,
            cosmetic_threshold=args.cosmetic_threshold
        )
        # Save output FITS and PNG preview locally
        fits_path = os.path.join(tmpdir, 'master.fits')
        png_path = os.path.join(tmpdir, 'master.png')
        save_master_frame(master, fits_path)
        save_master_preview(master, png_path)
        # Upload to Supabase
        fits_storage_path = args.output_base + '.fits'
        png_storage_path = args.output_base + '.png'
        upload_file(args.output_bucket, fits_storage_path, fits_path, public=False)
        preview_url = upload_file(args.output_bucket, png_storage_path, png_path, public=True)
        print(f"Master FITS uploaded to: {fits_storage_path}")
        print(f"Preview PNG uploaded to: {png_storage_path}")
        print(f"Preview public URL: {preview_url}")
        print(f"Stats: min={np.min(master)}, max={np.max(master)}, mean={np.mean(master):.2f}, median={np.median(master):.2f}, std={np.std(master):.2f}")

if __name__ == "__main__":
    main() 