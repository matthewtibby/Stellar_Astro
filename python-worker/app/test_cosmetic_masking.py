import numpy as np
from astropy.io import fits
import os
from cosmetic_masking import compute_bad_pixel_mask, compute_bad_column_mask, compute_bad_row_mask, apply_masks

def load_fits_stack(folder, max_files=10):
    files = [f for f in os.listdir(folder) if f.endswith('.fits')]
    stack = []
    for fname in files[:max_files]:
        with fits.open(os.path.join(folder, fname)) as hdul:
            stack.append(hdul[0].data.astype(np.float32))
    return np.stack(stack)

def main():
    # Try to load real darks, else generate synthetic data
    folder = '../sample_data'
    if os.path.exists(folder) and any(f.endswith('.fits') for f in os.listdir(folder)):
        print(f"Loading FITS stack from {folder}...")
        stack = load_fits_stack(folder)
    else:
        print("No FITS files found, generating synthetic data...")
        np.random.seed(42)
        stack = np.random.normal(loc=1000, scale=5, size=(8, 100, 100)).astype(np.float32)
        # Inject some bad pixels/columns/rows
        stack[:, 10, 10] += 1000  # hot pixel
        stack[:, :, 20] += 500    # hot column
        stack[:, 30, :] -= 500    # cold row

    print(f"Stack shape: {stack.shape}")
    
    # Test with default settings
    bad_pixel_mask = compute_bad_pixel_mask(stack)
    bad_col_mask = compute_bad_column_mask(stack)
    bad_row_mask = compute_bad_row_mask(stack)
    
    print(f"[Default] Bad pixels: {np.sum(bad_pixel_mask)}, Bad columns: {np.sum(bad_col_mask)}, Bad rows: {np.sum(bad_row_mask)}")
    
    # Test with more sensitive settings
    sensitive_pixel_mask = compute_bad_pixel_mask(stack, sigma=2, min_bad_fraction=0.2)
    sensitive_col_mask = compute_bad_column_mask(stack, sigma=2)
    sensitive_row_mask = compute_bad_row_mask(stack, sigma=2)

    print(f"[Sensitive] Bad pixels: {np.sum(sensitive_pixel_mask)}, Bad columns: {np.sum(sensitive_col_mask)}, Bad rows: {np.sum(sensitive_row_mask)}")
    
    # Show statistics for the most sensitive results
    total_pixels = stack.shape[1] * stack.shape[2]
    print(f"Total pixels: {total_pixels}")
    print(f"Bad pixel percentage (sensitive): {np.sum(sensitive_pixel_mask) / total_pixels * 100:.3f}%")

    # Apply masks to first image (use sensitive masks for demonstration)
    masked = apply_masks(stack[0], sensitive_pixel_mask, sensitive_col_mask, sensitive_row_mask)
    # Save result for inspection
    fits.writeto('masked_test_output.fits', masked, overwrite=True)
    print("Masked image saved as masked_test_output.fits")

if __name__ == '__main__':
    main() 