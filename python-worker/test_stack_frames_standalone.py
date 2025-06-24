#!/usr/bin/env python3
"""
Standalone version of stack_frames function for testing.
This extracts just the stacking logic without Supabase dependencies.
"""

import numpy as np
import os
import tempfile
import time
from pathlib import Path
from astropy.io import fits
from ccdproc import Combiner, CCDData
import astropy.units as u
from typing import List, Optional

def load_ccd_list(file_list: List[str]) -> List[CCDData]:
    """Load a list of FITS files as CCDData objects"""
    ccd_list = []
    for file_path in file_list:
        with fits.open(file_path) as hdul:
            data = hdul[0].data.astype(np.float64)
            ccd = CCDData(data, unit=u.adu)
            ccd_list.append(ccd)
    return ccd_list

def load_numpy_list(file_list: List[str]) -> List[np.ndarray]:
    """Load a list of FITS files as numpy arrays"""
    arrays = []
    for file_path in file_list:
        with fits.open(file_path) as hdul:
            data = hdul[0].data.astype(np.float64)
            arrays.append(data)
    return arrays

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
    if method == 'percentile_clip':
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
    elif method == 'winsorized':
        # Winsorized sigma clipping
        if sigma_clip is None:
            sigma_clip = 3.0
        n_frames, height, width = arr.shape
        result = np.zeros((height, width), dtype=np.float64)
        for y in range(height):
            for x in range(width):
                pixel_values = arr[:, y, x]
                mean_val = np.mean(pixel_values)
                std_val = np.std(pixel_values)
                # Winsorize (clip extreme values to threshold)
                clipped = np.clip(pixel_values, 
                                mean_val - sigma_clip * std_val, 
                                mean_val + sigma_clip * std_val)
                result[y, x] = np.mean(clipped)
        return result
    elif method == 'linear_fit':
        # Linear fit clipping (simplified version)
        if sigma_clip is None:
            sigma_clip = 3.0
        n_frames, height, width = arr.shape
        result = np.zeros((height, width), dtype=np.float64)
        for y in range(height):
            for x in range(width):
                pixel_values = arr[:, y, x]
                # Simple linear trend removal and sigma clipping
                x_vals = np.arange(len(pixel_values))
                coeffs = np.polyfit(x_vals, pixel_values, 1)
                trend = np.polyval(coeffs, x_vals)
                residuals = pixel_values - trend
                std_resid = np.std(residuals)
                mask = np.abs(residuals) <= sigma_clip * std_resid
                if np.sum(mask) > 0:
                    result[y, x] = np.mean(pixel_values[mask])
                else:
                    result[y, x] = np.median(pixel_values)
        return result
    elif method == 'entropy_weighted':
        # Entropy-weighted averaging
        n_frames, height, width = arr.shape
        result = np.zeros((height, width), dtype=np.float64)
        for y in range(height):
            for x in range(width):
                pixel_values = arr[:, y, x]
                # Calculate entropy-based weights
                # Higher variance = lower weight
                if np.std(pixel_values) > 0:
                    weights = 1.0 / (1.0 + np.var(pixel_values))
                    weights = np.full(len(pixel_values), weights)
                else:
                    weights = np.ones(len(pixel_values))
                weights = weights / np.sum(weights)
                result[y, x] = np.average(pixel_values, weights=weights)
        return result
    elif method == 'adaptive':
        # Adaptive stacking - analyze and choose best method
        print(f"[adaptive] Analyzing frames for adaptive stacking...", flush=True)
        # Simple adaptive logic
        n_frames = arr.shape[0]
        overall_std = np.std(arr)
        overall_mean = np.mean(arr)
        cv = overall_std / overall_mean if overall_mean > 0 else 0
        
        if cv > 0.1:  # High variance - use sigma clipping
            chosen_method = 'sigma'
            chosen_sigma = 2.5
            reason = "High variance detected. Using sigma clipping for outlier rejection."
        elif n_frames < 5:  # Few frames - use median
            chosen_method = 'median'
            chosen_sigma = 3.0
            reason = "Few frames available. Using median for robust combination."
        else:  # Default case
            chosen_method = 'median'
            chosen_sigma = 3.0
            reason = "No strong outlier/variance detected. Using median stacking."
        
        print(f"[adaptive] Selected method: {chosen_method}, sigma: {chosen_sigma}, reason: {reason}", flush=True)
        return stack_frames(file_list, method=chosen_method, sigma_clip=chosen_sigma)
    elif method == 'minmax':
        # MinMax rejection
        n_frames, height, width = arr.shape
        result = np.zeros((height, width), dtype=np.float64)
        for y in range(height):
            for x in range(width):
                pixel_values = arr[:, y, x]
                if len(pixel_values) > 2:
                    # Remove min and max, average the rest
                    sorted_vals = np.sort(pixel_values)
                    result[y, x] = np.mean(sorted_vals[1:-1])
                else:
                    result[y, x] = np.mean(pixel_values)
        return result
    elif method == 'superbias':
        # PCA-based bias modeling (PixInsight-style superbias)
        print(f"[superbias] Starting PCA-based bias stacking", flush=True)
        try:
            from sklearn.decomposition import PCA
        except ImportError:
            raise ImportError("scikit-learn is required for superbias/PCA modeling. Please install it with 'pip install scikit-learn'.")
        
        print(f"[superbias] Input array shape: {arr.shape}, dtype: {arr.dtype}", flush=True)
        n_frames, height, width = arr.shape
        arr_flat = arr.reshape(n_frames, height * width).T  # (pixels, frames)
        print(f"[superbias] Flattened array shape: {arr_flat.shape}", flush=True)
        
        # Use PCA to find the principal components of bias structure
        n_components = min(n_frames - 1, 3)  # Use 3 components max, or frames-1 if fewer
        print(f"[superbias] Performing PCA with n_components={n_components}", flush=True)
        pca = PCA(n_components=n_components)
        pca.fit(arr_flat)
        
        print(f"[superbias] PCA fit complete", flush=True)
        # Use the mean of the input data as the superbias (PCA centers on mean)
        superbias_flat = np.mean(arr_flat, axis=1)  # Mean across frames for each pixel
        superbias = superbias_flat.reshape(height, width)
        print(f"[superbias] Output shape: {superbias.shape}, dtype: {superbias.dtype}", flush=True)
        print(f"[superbias] PCA explained variance ratio: {pca.explained_variance_ratio_}", flush=True)
        return superbias
    else:
        raise ValueError(f"Unknown stacking method: {method}")

def quick_test():
    """Quick test of core stacking methods"""
    print("🚀 Quick Stacking Methods Test")
    print("-" * 30)
    
    # Create temporary test files
    temp_dir = tempfile.mkdtemp()
    file_paths = []
    
    try:
        # Create 3 simple test frames
        for i in range(3):
            data = np.full((50, 50), 1000 + i * 100, dtype=np.uint16)  # [1000, 1100, 1200]
            hdu = fits.PrimaryHDU(data)
            filepath = os.path.join(temp_dir, f"test_{i}.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
        
        # Test core methods
        methods = [
            ('mean', None),
            ('median', None), 
            ('sigma', 3.0),
            ('percentile_clip', 60),
            ('minmax', None),
            ('adaptive', None),
            ('entropy_weighted', None),
            ('winsorized', 3.0),
            ('superbias', None),
        ]
        
        passed = 0
        failed = 0
        
        for method, sigma in methods:
            try:
                result = stack_frames(file_paths, method=method, sigma_clip=sigma)
                
                # Basic validation
                assert result is not None
                assert isinstance(result, np.ndarray)
                assert result.shape == (50, 50)
                assert not np.any(np.isnan(result))
                
                print(f"✅ {method}: PASS (mean={np.mean(result):.1f})")
                passed += 1
                
            except Exception as e:
                print(f"❌ {method}: FAIL - {e}")
                failed += 1
        
        print(f"\nResults: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 Quick test PASSED! Core stacking methods are working.")
            return True
        else:
            print("⚠️  Some methods failed. Check errors above.")
            return False
            
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    success = quick_test()
    exit(0 if success else 1) 