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
import astroscrappy
import time

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
    method: 'mean', 'median', 'sigma', 'winsorized', 'linear_fit', 'minmax', 'adaptive', 'superbias', 'entropy_weighted', 'percentile_clip'
    sigma_clip: threshold for sigma clipping (if used)
    'superbias': PCA-based bias modeling (PixInsight-style)
    'entropy_weighted': Entropy-weighted averaging for optimal signal preservation
    'percentile_clip': Percentile-based outlier rejection (ideal for small datasets)
    """
    print(f"[LOG] stack_frames START: {len(file_list)} files, method={method}, sigma_clip={sigma_clip}", flush=True)
    t0 = time.time()
    if method in ['mean', 'median', 'sigma']:
        ccd_list = load_ccd_list(file_list)
        print(f"[LOG] Loaded CCD list for stacking. Length: {len(ccd_list)}", flush=True)
        comb = Combiner(ccd_list)
        if method == 'mean':
            print(f"[LOG] Performing mean combine", flush=True)
            return comb.average_combine().data
        elif method == 'median':
            print(f"[LOG] Performing median combine", flush=True)
            return comb.median_combine().data
        elif method == 'sigma':
            if sigma_clip is None:
                sigma_clip = 3.0
            print(f"[LOG] Performing sigma clipping with threshold {sigma_clip}", flush=True)
            comb.sigma_clipping(low_thresh=sigma_clip, high_thresh=sigma_clip)
            return comb.average_combine().data
    # numpy-based methods
    data = load_numpy_list(file_list)
    print(f"[LOG] Loaded numpy list for stacking. Shape: {[d.shape for d in data]}", flush=True)
    arr = np.stack(data, axis=0)
    print(f"[LOG] Stacked numpy array shape: {arr.shape}", flush=True)
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
        # Analyze frames and select the best stacking method and parameters
        print(f"[adaptive] Analyzing frames for adaptive stacking...", flush=True)
        stats = analyze_frames(file_list)
        rec_method, rec_sigma, reason = recommend_stacking(stats, user_method='median')
        print(f"[adaptive] Selected method: {rec_method}, sigma: {rec_sigma}, reason: {reason}", flush=True)
        # Call stack_frames recursively with the recommended method and sigma
        result = stack_frames(file_list, method=rec_method, sigma_clip=rec_sigma)
        print(f"[adaptive] Adaptive stacking complete using method '{rec_method}'", flush=True)
        return result
    elif method == 'entropy_weighted':
        # Entropy-Weighted Averaging
        print(f"[entropy_weighted] Starting entropy-weighted stacking...", flush=True)
        arr = arr.astype(np.float64)
        n_frames, height, width = arr.shape
        
        # Compute entropy for each pixel across all frames
        print(f"[entropy_weighted] Computing entropy weights for {n_frames} frames...", flush=True)
        
        # For each pixel position, calculate entropy across frames
        # Entropy = -sum(p * log2(p)) where p is the probability of each value
        # We'll use normalized histograms to estimate probabilities
        weights = np.zeros((n_frames, height, width), dtype=np.float64)
        
        # Process in chunks to manage memory
        chunk_size = 1000  # Process 1000 pixels at a time
        total_pixels = height * width
        
        for start_idx in range(0, total_pixels, chunk_size):
            end_idx = min(start_idx + chunk_size, total_pixels)
            
            # Convert to flat indices
            pixel_indices = np.unravel_index(range(start_idx, end_idx), (height, width))
            pixel_values = arr[:, pixel_indices[0], pixel_indices[1]]  # Shape: (n_frames, n_pixels_in_chunk)
            
            # For each pixel across frames, compute entropy-based weights
            for i, (y, x) in enumerate(zip(pixel_indices[0], pixel_indices[1])):
                pixel_series = arr[:, y, x]
                
                # Compute entropy using histogram approach
                # Use fewer bins for noisy data to avoid overestimating entropy
                bins = min(16, len(np.unique(pixel_series)))
                if bins < 2:
                    # All values are the same, equal weights
                    weights[:, y, x] = 1.0
                else:
                    hist, _ = np.histogram(pixel_series, bins=bins)
                    # Normalize to get probabilities
                    hist = hist.astype(np.float64)
                    hist = hist / hist.sum()
                    # Remove zeros to avoid log(0)
                    hist = hist[hist > 0]
                    # Calculate entropy
                    entropy = -np.sum(hist * np.log2(hist))
                    
                    # Convert entropy to weights
                    # Lower entropy (more consistent) = higher weight
                    # Higher entropy (more random) = lower weight
                    max_entropy = np.log2(bins)  # Maximum possible entropy for this number of bins
                    
                    # Normalize entropy to [0, 1] and invert so low entropy = high weight
                    normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
                    consistency_score = 1.0 - normalized_entropy
                    
                    # Apply weights based on how close each frame's value is to the median
                    median_val = np.median(pixel_series)
                    deviations = np.abs(pixel_series - median_val)
                    max_dev = np.max(deviations) if np.max(deviations) > 0 else 1.0
                    frame_weights = 1.0 - (deviations / max_dev)
                    
                    # Combine consistency score with frame-specific weights
                    weights[:, y, x] = frame_weights * consistency_score
        
        # Ensure weights are positive and normalized per pixel
        weights = np.maximum(weights, 0.001)  # Minimum weight to avoid division by zero
        weight_sums = np.sum(weights, axis=0)
        weight_sums[weight_sums == 0] = 1.0  # Avoid division by zero
        
        # Compute weighted average
        print(f"[entropy_weighted] Computing weighted average...", flush=True)
        weighted_sum = np.sum(arr * weights, axis=0)
        result = weighted_sum / weight_sums
        
        print(f"[entropy_weighted] Entropy-weighted stacking complete", flush=True)
        print(f"[entropy_weighted] Weight stats: min={np.min(weights):.4f}, max={np.max(weights):.4f}, mean={np.mean(weights):.4f}", flush=True)
        return result
    elif method == 'superbias':
        try:
            from sklearn.decomposition import PCA
        except ImportError:
            raise ImportError("scikit-learn is required for superbias/PCA modeling. Please install it with 'pip install scikit-learn'.")
        n_frames, height, width = arr.shape
        print(f"[superbias] Input array shape: {arr.shape}, dtype: {arr.dtype}", flush=True)
        arr_flat = arr.reshape(n_frames, -1)
        print(f"[superbias] Flattened array shape: {arr_flat.shape}", flush=True)
        n_components = min(8, n_frames)  # Use up to 8 principal components or n_frames
        print(f"[superbias] Performing PCA with n_components={n_components}", flush=True)
        t_pca = time.time()
        pca = PCA(n_components=n_components)
        pca.fit(arr_flat)
        print(f"[superbias] PCA fit complete in {time.time() - t_pca:.2f}s", flush=True)
        superbias_flat = pca.mean_
        superbias = superbias_flat.reshape(height, width)
        print(f"[superbias] Output shape: {superbias.shape}, dtype: {superbias.dtype}", flush=True)
        print(f"[superbias] PCA explained variance ratio: {pca.explained_variance_ratio_}", flush=True)
        print(f"[LOG] stack_frames END (superbias): elapsed {time.time() - t0:.2f}s", flush=True)
        return superbias
    elif method == 'percentile_clip':
        # Percentile clipping: reject pixels outside specified percentile range
        if sigma_clip is None:
            # Default: keep middle 60% (reject bottom 20% and top 20%)
            low_percentile = 20.0
            high_percentile = 80.0
        else:
            # Use sigma_clip as percentile range around median
            # e.g., sigma_clip=30 means keep middle 70% (reject bottom 15% and top 15%)
            low_percentile = (100.0 - sigma_clip) / 2.0
            high_percentile = 100.0 - low_percentile
        
        print(f"[percentile_clip] Using percentile range: {low_percentile}%-{high_percentile}%", flush=True)
        
        n_frames, height, width = arr.shape
        result = np.zeros((height, width), dtype=np.float64)
        
        # For each pixel position, sort values and apply percentile clipping
        for y in range(height):
            for x in range(width):
                pixel_values = arr[:, y, x]
                
                # Calculate percentile thresholds
                p_low = np.percentile(pixel_values, low_percentile)
                p_high = np.percentile(pixel_values, high_percentile)
                
                # Keep only values within percentile range
                valid_mask = (pixel_values >= p_low) & (pixel_values <= p_high)
                valid_values = pixel_values[valid_mask]
                
                # Average the remaining values
                if len(valid_values) > 0:
                    result[y, x] = np.mean(valid_values)
                else:
                    # Fallback to median if all values rejected (shouldn't happen normally)
                    result[y, x] = np.median(pixel_values)
        
        print(f"[percentile_clip] Percentile clipping complete", flush=True)
        return result
    else:
        raise ValueError(f"Unknown stacking method: {method}")
    print(f"[LOG] stack_frames END: method={method}, elapsed {time.time() - t0:.2f}s", flush=True)

# --- Cosmetic Correction (Stub) ---
def cosmetic_correction(data: np.ndarray, method: str = 'hot_pixel_map', threshold: float = 5.0, la_cosmic_params: dict = None, bad_pixel_map: np.ndarray = None) -> np.ndarray:
    """
    Remove hot/cold pixels or cosmetic defects.
    method: 'hot_pixel_map', 'la_cosmic', etc.
    threshold: N-sigma for hot/cold pixel detection (default 5.0)
    la_cosmic_params: dict of extra params for astroscrappy
    bad_pixel_map: boolean numpy array (True=bad pixel)
    """
    # Apply BPM first if provided
    if bad_pixel_map is not None:
        mask = bad_pixel_map.astype(bool)
        if np.any(mask):
            padded = np.pad(data, 1, mode='reflect')
            corrected = data.copy()
            idxs = np.argwhere(mask)
            for y, x in idxs:
                neighborhood = padded[y:y+3, x:x+3]
                corrected[y, x] = np.median(neighborhood)
            data = corrected
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
    elif method == 'la_cosmic':
        # Use astroscrappy to remove cosmic rays
        # threshold is mapped to sigclip
        params = la_cosmic_params or {}
        sigclip = params.get('sigclip', threshold)
        readnoise = params.get('readnoise', 6.5)
        gain = params.get('gain', 1.0)
        satlevel = params.get('satlevel', 65535)
        niter = params.get('niter', 4)
        mask, cleaned = astroscrappy.detect_cosmics(
            data,
            sigclip=sigclip,
            readnoise=readnoise,
            gain=gain,
            satlevel=satlevel,
            niter=niter
        )
        return cleaned
    return data

# --- Main Calibration Worker Entrypoint ---
def create_master_frame(file_list: List[str], method: str = 'median', sigma_clip: Optional[float] = None, cosmetic: bool = False, cosmetic_method: str = 'hot_pixel_map', cosmetic_threshold: float = 0.5, la_cosmic_params: dict = None, bad_pixel_map: np.ndarray = None, **kwargs) -> np.ndarray:
    print(f"[LOG] Entered create_master_frame with {len(file_list)} files, method={method}, sigma_clip={sigma_clip}, cosmetic={cosmetic}, cosmetic_method={cosmetic_method}", flush=True)
    print(f"[LOG] File list: {file_list}", flush=True)
    stacked = stack_frames(file_list, method, sigma_clip)
    print(f"[LOG] Finished stacking frames. Shape: {stacked.shape}, dtype: {stacked.dtype}", flush=True)
    if cosmetic:
        print(f"[LOG] Starting cosmetic correction: method={cosmetic_method}, threshold={cosmetic_threshold}", flush=True)
        stacked = cosmetic_correction(stacked, cosmetic_method, cosmetic_threshold, la_cosmic_params, bad_pixel_map)
        print(f"[LOG] Finished cosmetic correction.", flush=True)
    print(f"[LOG] Returning master frame. Stats: min={np.min(stacked)}, max={np.max(stacked)}, mean={np.mean(stacked):.2f}, median={np.median(stacked):.2f}, std={np.std(stacked):.2f}", flush=True)
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

def estimate_dark_scaling_factor(dark_file_list: List[str], light_file_list: Optional[List[str]] = None) -> float:
    """
    Estimate a scaling factor for dark frames.
    If light frames are provided, use the ratio of median(light) / median(dark) as the scaling factor.
    If not, return 1.0.
    """
    if not light_file_list or len(light_file_list) == 0:
        return 1.0
    # Load and stack all darks and lights
    dark_data = load_numpy_list(dark_file_list)
    light_data = load_numpy_list(light_file_list)
    # Use median of all pixels as a robust background estimator
    median_dark = float(np.median(np.stack(dark_data)))
    median_light = float(np.median(np.stack(light_data)))
    if median_dark == 0:
        return 1.0
    scaling_factor = median_light / median_dark
    # Clamp scaling factor to a reasonable range (0.5 to 2.0)
    scaling_factor = max(0.5, min(2.0, scaling_factor))
    return scaling_factor

def main():
    parser = argparse.ArgumentParser(description="Calibration Worker CLI: Create master calibration frames from FITS files (Supabase Storage).")
    parser.add_argument('--input-bucket', required=True, help='Supabase bucket for input files')
    parser.add_argument('--input-paths', nargs='+', required=True, help='Supabase storage paths for input FITS files')
    parser.add_argument('--output-bucket', required=True, help='Supabase bucket for output files')
    parser.add_argument('--output-base', required=True, help='Base path (no extension) for output files in Supabase')
    parser.add_argument('--method', choices=['mean', 'median', 'sigma', 'winsorized', 'linear_fit', 'minmax', 'adaptive', 'superbias', 'entropy_weighted', 'percentile_clip'], default='median', help='Stacking method')
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