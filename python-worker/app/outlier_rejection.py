import numpy as np
from astropy.io import fits
import os

def compute_frame_stats(fits_path):
    with fits.open(fits_path) as hdul:
        data = hdul[0].data.astype(np.float32)
    stats = {
        'path': fits_path,
        'mean': float(np.mean(data)),
        'median': float(np.median(data)),
        'std': float(np.std(data)),
        'min': float(np.min(data)),
        'max': float(np.max(data)),
    }
    return stats

def detect_outlier_frames(fits_paths, sigma_thresh=3.0):
    """
    Detect outlier frames in a stack based on mean and std deviation.
    Args:
        fits_paths (list): List of FITS file paths.
        sigma_thresh (float): Sigma threshold for outlier rejection.
    Returns:
        dict: {'good': [stats...], 'outliers': [stats...], 'criteria': {...}}
    """
    stats_list = [compute_frame_stats(p) for p in fits_paths]
    means = np.array([s['mean'] for s in stats_list])
    stds = np.array([s['std'] for s in stats_list])
    med_mean = np.median(means)
    std_mean = np.std(means)
    med_std = np.median(stds)
    std_std = np.std(stds)
    good, outliers = [], []
    for s in stats_list:
        mean_outlier = abs(s['mean'] - med_mean) > sigma_thresh * std_mean
        std_outlier = abs(s['std'] - med_std) > sigma_thresh * std_std
        reasons = []
        if mean_outlier:
            reasons.append(f"mean {s['mean']:.2f} is >{sigma_thresh}σ from median {med_mean:.2f}")
        if std_outlier:
            reasons.append(f"std {s['std']:.2f} is >{sigma_thresh}σ from median {med_std:.2f}")
        if reasons:
            s['outlier'] = True
            s['reasons'] = reasons
            outliers.append(s)
        else:
            s['outlier'] = False
            s['reasons'] = []
            good.append(s)
    return {
        'good': good,
        'outliers': outliers,
        'criteria': {
            'median_mean': float(med_mean),
            'std_mean': float(std_mean),
            'median_std': float(med_std),
            'std_std': float(std_std),
            'sigma_thresh': sigma_thresh
        }
    }

if __name__ == "__main__":
    import glob
    import argparse
    parser = argparse.ArgumentParser(description="Detect outlier frames in a stack of FITS files.")
    parser.add_argument("fits_glob", help="Glob pattern for FITS files (e.g. '../sample_data/*.fits')")
    parser.add_argument("--sigma", type=float, default=3.0)
    args = parser.parse_args()
    files = glob.glob(args.fits_glob)
    result = detect_outlier_frames(files, sigma_thresh=args.sigma)
    print(f"Good frames: {len(result['good'])}")
    print(f"Outliers: {len(result['outliers'])}")
    for o in result['outliers']:
        print(f"Outlier: {o['path']} | Reasons: {o['reasons']}") 