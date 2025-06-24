import numpy as np
from scipy import ndimage
from scipy.ndimage import median_filter, gaussian_filter
from astropy.modeling import models, fitting
import warnings

def remove_gradients_median(image, filter_size=64, preserve_stars=True, star_threshold=None):
    """
    Remove large-scale gradients using median filtering.
    
    Parameters:
    - image: 2D numpy array
    - filter_size: Size of median filter kernel (larger = removes bigger patterns)
    - preserve_stars: If True, mask bright objects before filtering
    - star_threshold: Threshold for star detection (auto if None)
    """
    image = image.astype(np.float32)
    
    if preserve_stars and star_threshold is None:
        # Auto-detect star threshold
        star_threshold = np.percentile(image, 99.5)
    
    # Create working copy
    work_image = image.copy()
    star_mask = None
    
    if preserve_stars:
        # Mask bright stars/objects
        star_mask = image > star_threshold
        # Fill masked areas with local median for better filtering
        if np.any(star_mask):
            # Dilate star mask slightly to avoid edge effects
            star_mask = ndimage.binary_dilation(star_mask, iterations=3)
            work_image[star_mask] = median_filter(image, size=5)[star_mask]
    
    # Apply median filter to estimate background pattern
    background = median_filter(work_image, size=filter_size)
    
    # Subtract background, preserving original star regions
    corrected = image - background
    
    return corrected, background, star_mask

def remove_striping_fourier(image, direction='both', strength=1.0, frequency_cutoff=0.1):
    """
    Remove periodic striping using Fourier domain filtering.
    
    Parameters:
    - image: 2D numpy array
    - direction: 'horizontal', 'vertical', or 'both'
    - strength: Filter strength (0-1, higher = more aggressive)
    - frequency_cutoff: Frequency threshold for pattern suppression
    """
    image = image.astype(np.float32)
    
    # Take FFT
    fft_image = np.fft.fft2(image)
    fft_shifted = np.fft.fftshift(fft_image)
    
    # Create frequency coordinates
    rows, cols = image.shape
    crow, ccol = rows // 2, cols // 2
    
    # Create filter based on direction
    mask = np.ones((rows, cols), dtype=np.float32)
    
    if direction in ['horizontal', 'both']:
        # Suppress horizontal frequencies (vertical stripes)
        y_freq = np.abs(np.arange(rows) - crow) / (rows / 2)
        for i in range(rows):
            if y_freq[i] < frequency_cutoff:
                suppression = 1 - strength * (1 - y_freq[i] / frequency_cutoff)
                mask[i, :] *= suppression
    
    if direction in ['vertical', 'both']:
        # Suppress vertical frequencies (horizontal stripes)
        x_freq = np.abs(np.arange(cols) - ccol) / (cols / 2)
        for j in range(cols):
            if x_freq[j] < frequency_cutoff:
                suppression = 1 - strength * (1 - x_freq[j] / frequency_cutoff)
                mask[:, j] *= suppression
    
    # Apply filter and inverse FFT
    fft_filtered = fft_shifted * mask
    fft_ishifted = np.fft.ifftshift(fft_filtered)
    corrected = np.real(np.fft.ifft2(fft_ishifted))
    
    # Calculate what was removed
    pattern = image - corrected
    
    return corrected, pattern, mask

def remove_background_polynomial(image, degree=2, sigma_clip=3.0, max_iterations=5):
    """
    Remove smooth background variations using polynomial surface fitting.
    
    Parameters:
    - image: 2D numpy array
    - degree: Polynomial degree (1=linear, 2=quadratic, 3=cubic)
    - sigma_clip: Sigma clipping threshold for outlier rejection
    - max_iterations: Max iterations for sigma clipping
    """
    image = image.astype(np.float32)
    rows, cols = image.shape
    
    # Create coordinate grids
    y, x = np.mgrid[0:rows, 0:cols]
    x_norm = (x - cols/2) / (cols/2)  # Normalize to [-1, 1]
    y_norm = (y - rows/2) / (rows/2)  # Normalize to [-1, 1]
    
    # Flatten for fitting
    x_flat = x_norm.flatten()
    y_flat = y_norm.flatten()
    z_flat = image.flatten()
    
    # Create polynomial model
    if degree == 1:
        model = models.Polynomial2D(degree=1)
    elif degree == 2:
        model = models.Polynomial2D(degree=2)
    else:
        model = models.Polynomial2D(degree=degree)
    
    # Fit with sigma clipping to reject outliers (stars, cosmic rays)
    fitter = fitting.LinearLSQFitter()
    mask = np.ones_like(z_flat, dtype=bool)
    
    for iteration in range(max_iterations):
        # Fit polynomial to non-masked data
        fitted_model = fitter(model, x_flat[mask], y_flat[mask], z_flat[mask])
        
        # Calculate residuals
        predicted = fitted_model(x_flat, y_flat)
        residuals = z_flat - predicted
        
        # Sigma clipping
        std_residual = np.std(residuals[mask])
        new_mask = np.abs(residuals) < sigma_clip * std_residual
        
        # Check convergence
        if np.array_equal(mask, new_mask):
            break
        mask = new_mask
    
    # Generate background surface
    background = fitted_model(x_norm, y_norm)
    corrected = image - background
    
    return corrected, background, fitted_model

def detect_pattern_type(image, sample_size=None):
    """
    Automatically detect the dominant type of patterned noise.
    
    Returns:
    - pattern_type: 'gradient', 'striping', 'mixed', or 'minimal'
    - confidence: 0-1 confidence score
    - recommendations: Dict of suggested parameters
    """
    if sample_size:
        # Sample a subset for faster analysis
        step = max(1, min(image.shape) // sample_size)
        sample = image[::step, ::step]
    else:
        sample = image
    
    # Analyze gradient strength (corner-to-corner variation)
    corners = [
        sample[0, 0], sample[0, -1], 
        sample[-1, 0], sample[-1, -1]
    ]
    gradient_strength = np.std(corners) / np.mean(sample)
    
    # Analyze striping (FFT power in low frequencies)
    fft_sample = np.fft.fft2(sample)
    fft_power = np.abs(np.fft.fftshift(fft_sample))
    rows, cols = fft_power.shape
    
    # Check for horizontal striping (vertical frequency peaks)
    h_center = rows // 2
    v_profile = np.mean(fft_power[h_center-2:h_center+3, :], axis=0)
    h_striping = np.std(v_profile[:cols//10]) / np.mean(v_profile)
    
    # Check for vertical striping (horizontal frequency peaks)
    v_center = cols // 2
    h_profile = np.mean(fft_power[:, v_center-2:v_center+3], axis=1)
    v_striping = np.std(h_profile[:rows//10]) / np.mean(h_profile)
    
    # Classify pattern type
    recommendations = {}
    
    if gradient_strength > 0.1:
        pattern_type = 'gradient'
        confidence = min(1.0, gradient_strength * 5)
        recommendations = {
            'method': 'median_filter',
            'filter_size': 64,
            'preserve_stars': True
        }
    elif max(h_striping, v_striping) > 0.05:
        pattern_type = 'striping'
        confidence = min(1.0, max(h_striping, v_striping) * 10)
        if h_striping > v_striping:
            direction = 'horizontal'
        else:
            direction = 'vertical'
        recommendations = {
            'method': 'fourier_filter',
            'direction': direction,
            'strength': 0.7,
            'frequency_cutoff': 0.1
        }
    elif gradient_strength > 0.05 or max(h_striping, v_striping) > 0.02:
        pattern_type = 'mixed'
        confidence = 0.6
        recommendations = {
            'method': 'combined',
            'gradient_filter_size': 64,
            'fourier_strength': 0.5
        }
    else:
        pattern_type = 'minimal'
        confidence = 0.8
        recommendations = {
            'method': 'none',
            'message': 'No significant patterned noise detected'
        }
    
    return pattern_type, confidence, recommendations

def apply_combined_correction(image, gradient_filter_size=64, fourier_strength=0.5, 
                            preserve_stars=True, direction='both'):
    """
    Apply both gradient removal and striping correction.
    """
    # First remove gradients
    corrected, background, star_mask = remove_gradients_median(
        image, filter_size=gradient_filter_size, preserve_stars=preserve_stars
    )
    
    # Then remove striping
    final_corrected, striping_pattern, freq_mask = remove_striping_fourier(
        corrected, direction=direction, strength=fourier_strength
    )
    
    # Combine patterns for reporting
    total_pattern = background + striping_pattern
    
    return final_corrected, total_pattern, {
        'background': background,
        'striping': striping_pattern,
        'star_mask': star_mask,
        'freq_mask': freq_mask
    } 