import numpy as np
from astropy.io import fits
import os
import matplotlib.pyplot as plt
from patterned_noise_removal import (
    remove_gradients_median, remove_striping_fourier, remove_background_polynomial,
    detect_pattern_type, apply_combined_correction
)

def create_synthetic_test_images():
    """Create synthetic images with known patterns for testing."""
    size = 200
    base_image = np.random.normal(1000, 10, (size, size)).astype(np.float32)
    
    # Add some "stars"
    star_positions = [(50, 50), (150, 100), (75, 175)]
    for y, x in star_positions:
        base_image[y-3:y+4, x-3:x+4] += 2000
    
    # Test image 1: Gradient pattern
    y, x = np.mgrid[0:size, 0:size]
    gradient = 0.5 * x + 0.3 * y  # Linear gradient
    gradient_image = base_image + gradient
    
    # Test image 2: Horizontal striping
    striping = 20 * np.sin(2 * np.pi * y / 10)  # Horizontal stripes every 10 pixels
    striping_image = base_image + striping.astype(np.float32)
    
    # Test image 3: Vertical striping
    v_striping = 15 * np.sin(2 * np.pi * x / 8)  # Vertical stripes every 8 pixels
    v_striping_image = base_image + v_striping.astype(np.float32)
    
    # Test image 4: Mixed patterns
    mixed_image = base_image + gradient * 0.5 + striping * 0.5
    
    return {
        'clean': base_image,
        'gradient': gradient_image,
        'h_striping': striping_image,
        'v_striping': v_striping_image,
        'mixed': mixed_image
    }

def test_gradient_removal():
    """Test median filter gradient removal."""
    print("\n=== Testing Gradient Removal ===")
    
    test_images = create_synthetic_test_images()
    gradient_image = test_images['gradient']
    clean_image = test_images['clean']
    
    # Test gradient removal
    corrected, background, star_mask = remove_gradients_median(
        gradient_image, filter_size=32, preserve_stars=True
    )
    
    # Calculate effectiveness
    original_std = np.std(gradient_image)
    corrected_std = np.std(corrected)
    improvement = (original_std - corrected_std) / original_std * 100
    
    print(f"Original std: {original_std:.2f}")
    print(f"Corrected std: {corrected_std:.2f}")
    print(f"Improvement: {improvement:.1f}%")
    print(f"Stars protected: {np.sum(star_mask) if star_mask is not None else 0} pixels")
    
    # Save test result
    fits.writeto('test_gradient_corrected.fits', corrected, overwrite=True)
    fits.writeto('test_gradient_background.fits', background, overwrite=True)
    
    return corrected, background

def test_striping_removal():
    """Test Fourier domain striping removal."""
    print("\n=== Testing Striping Removal ===")
    
    test_images = create_synthetic_test_images()
    
    # Test horizontal striping removal
    h_striping_image = test_images['h_striping']
    h_corrected, h_pattern, h_mask = remove_striping_fourier(
        h_striping_image, direction='horizontal', strength=0.8
    )
    
    # Test vertical striping removal
    v_striping_image = test_images['v_striping']
    v_corrected, v_pattern, v_mask = remove_striping_fourier(
        v_striping_image, direction='vertical', strength=0.8
    )
    
    # Calculate effectiveness
    h_improvement = (np.std(h_striping_image) - np.std(h_corrected)) / np.std(h_striping_image) * 100
    v_improvement = (np.std(v_striping_image) - np.std(v_corrected)) / np.std(v_striping_image) * 100
    
    print(f"Horizontal striping removal improvement: {h_improvement:.1f}%")
    print(f"Vertical striping removal improvement: {v_improvement:.1f}%")
    print(f"Horizontal pattern strength: {np.std(h_pattern):.2f}")
    print(f"Vertical pattern strength: {np.std(v_pattern):.2f}")
    
    # Save test results
    fits.writeto('test_h_striping_corrected.fits', h_corrected, overwrite=True)
    fits.writeto('test_v_striping_corrected.fits', v_corrected, overwrite=True)
    
    return h_corrected, v_corrected

def test_polynomial_background():
    """Test polynomial background subtraction."""
    print("\n=== Testing Polynomial Background Subtraction ===")
    
    test_images = create_synthetic_test_images()
    gradient_image = test_images['gradient']
    
    # Test polynomial fitting
    corrected, background, model = remove_background_polynomial(
        gradient_image, degree=2, sigma_clip=3.0
    )
    
    # Calculate effectiveness
    improvement = (np.std(gradient_image) - np.std(corrected)) / np.std(gradient_image) * 100
    
    print(f"Polynomial background removal improvement: {improvement:.1f}%")
    print(f"Background RMS: {np.std(background):.2f}")
    print(f"Model parameters: {model.parameters}")
    
    # Save test result
    fits.writeto('test_poly_corrected.fits', corrected, overwrite=True)
    fits.writeto('test_poly_background.fits', background, overwrite=True)
    
    return corrected, background

def test_pattern_detection():
    """Test automatic pattern detection."""
    print("\n=== Testing Pattern Detection ===")
    
    test_images = create_synthetic_test_images()
    
    for name, image in test_images.items():
        pattern_type, confidence, recommendations = detect_pattern_type(image)
        print(f"{name:12} -> {pattern_type:10} (confidence: {confidence:.2f}) -> {recommendations.get('method', 'N/A')}")

def test_combined_correction():
    """Test combined gradient and striping correction."""
    print("\n=== Testing Combined Correction ===")
    
    test_images = create_synthetic_test_images()
    mixed_image = test_images['mixed']
    
    corrected, total_pattern, details = apply_combined_correction(
        mixed_image, gradient_filter_size=32, fourier_strength=0.6
    )
    
    improvement = (np.std(mixed_image) - np.std(corrected)) / np.std(mixed_image) * 100
    
    print(f"Combined correction improvement: {improvement:.1f}%")
    print(f"Background pattern RMS: {np.std(details['background']):.2f}")
    print(f"Striping pattern RMS: {np.std(details['striping']):.2f}")
    print(f"Total pattern RMS: {np.std(total_pattern):.2f}")
    
    # Save test results
    fits.writeto('test_combined_corrected.fits', corrected, overwrite=True)
    fits.writeto('test_combined_pattern.fits', total_pattern, overwrite=True)
    
    return corrected, total_pattern

def test_real_fits_data():
    """Test on real FITS data if available."""
    print("\n=== Testing Real FITS Data ===")
    
    folder = '../sample_data'
    if os.path.exists(folder):
        fits_files = [f for f in os.listdir(folder) if f.endswith('.fits')]
        if fits_files:
            test_file = os.path.join(folder, fits_files[0])
            print(f"Testing with: {fits_files[0]}")
            
            with fits.open(test_file) as hdul:
                image = hdul[0].data.astype(np.float32)
            
            # Auto-detect pattern type
            pattern_type, confidence, recommendations = detect_pattern_type(image)
            print(f"Detected pattern: {pattern_type} (confidence: {confidence:.2f})")
            print(f"Recommendations: {recommendations}")
            
            # Apply recommended correction
            if recommendations.get('method') == 'median_filter':
                corrected, background, star_mask = remove_gradients_median(
                    image, 
                    filter_size=recommendations.get('filter_size', 64),
                    preserve_stars=recommendations.get('preserve_stars', True)
                )
                print(f"Applied median filter, removed background with RMS: {np.std(background):.2f}")
            elif recommendations.get('method') == 'fourier_filter':
                corrected, pattern, mask = remove_striping_fourier(
                    image,
                    direction=recommendations.get('direction', 'both'),
                    strength=recommendations.get('strength', 0.7)
                )
                print(f"Applied Fourier filter, removed pattern with RMS: {np.std(pattern):.2f}")
            elif recommendations.get('method') == 'combined':
                corrected, total_pattern, details = apply_combined_correction(image)
                print(f"Applied combined correction, removed pattern with RMS: {np.std(total_pattern):.2f}")
            else:
                print("No correction recommended")
                return
            
            # Save result
            fits.writeto('test_real_corrected.fits', corrected, overwrite=True)
            
            return corrected
        else:
            print("No FITS files found in sample_data")
    else:
        print("Sample data folder not found")

def main():
    """Run all tests."""
    print("Testing Patterned Noise Removal Module")
    print("=" * 40)
    
    # Test individual functions
    test_gradient_removal()
    test_striping_removal()
    test_polynomial_background()
    test_pattern_detection()
    test_combined_correction()
    test_real_fits_data()
    
    print("\n=== Test Summary ===")
    print("Generated test files:")
    test_files = [f for f in os.listdir('.') if f.startswith('test_') and f.endswith('.fits')]
    for f in sorted(test_files):
        print(f"  - {f}")

if __name__ == '__main__':
    main() 