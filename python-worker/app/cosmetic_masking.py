import numpy as np

def compute_bad_pixel_mask(dark_stack, sigma=5, min_bad_fraction=0.5):
    """
    Returns a 2D mask of bad pixels.
    - dark_stack: shape (N, H, W)
    - sigma: threshold in stddevs
    - min_bad_fraction: fraction of frames a pixel must be bad in to be flagged
    """
    median = np.median(dark_stack, axis=0)
    std = np.std(dark_stack, axis=0)
    bad = np.abs(dark_stack - median) > sigma * std
    bad_fraction = np.mean(bad, axis=0)
    return (bad_fraction >= min_bad_fraction).astype(np.uint8)

def compute_bad_column_mask(dark_stack, sigma=5):
    """
    Returns a 1D mask of bad columns.
    - dark_stack: shape (N, H, W)
    """
    col_means = np.mean(dark_stack, axis=(0,1))
    mean = np.mean(col_means)
    std = np.std(col_means)
    bad_cols = np.abs(col_means - mean) > sigma * std
    return bad_cols.astype(np.uint8)

def compute_bad_row_mask(dark_stack, sigma=5):
    """
    Returns a 1D mask of bad rows.
    - dark_stack: shape (N, H, W)
    """
    row_means = np.mean(dark_stack, axis=(0,2))
    mean = np.mean(row_means)
    std = np.std(row_means)
    bad_rows = np.abs(row_means - mean) > sigma * std
    return bad_rows.astype(np.uint8)

def apply_masks(image, bad_pixel_mask, bad_col_mask, bad_row_mask, fill_value=np.nan):
    """
    Applies the masks to an image, setting bad pixels/columns/rows to fill_value.
    """
    masked = image.copy()
    masked[bad_pixel_mask == 1] = fill_value
    for col, is_bad in enumerate(bad_col_mask):
        if is_bad:
            masked[:, col] = fill_value
    for row, is_bad in enumerate(bad_row_mask):
        if is_bad:
            masked[row, :] = fill_value
    return masked 