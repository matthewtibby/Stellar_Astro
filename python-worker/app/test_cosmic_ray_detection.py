"""
Test script for cosmic ray detection functionality.

This script tests the cosmic ray detection module with sample data
and validates the implementation works correctly.
"""

import numpy as np
from astropy.io import fits
import os
import tempfile
import logging
from cosmic_ray_detection import CosmicRayDetector, detect_cosmic_rays_simple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_synthetic_image_with_cosmic_rays(shape=(512, 512), num_cosmic_rays=20):
    """
    Create a synthetic astronomical image with simulated cosmic rays.
    
    Parameters:
    -----------
    shape : tuple
        Image dimensions
    num_cosmic_rays : int
        Number of cosmic rays to inject
        
    Returns:
    --------
    image : np.ndarray
        Synthetic image with cosmic rays
    true_crmask : np.ndarray
        True cosmic ray mask for validation
    """
    # Create base image with realistic astronomical background
    image = np.random.poisson(100, shape).astype(np.float64)  # Poisson noise background
    
    # Add some realistic structure (stars)
    y_coords, x_coords = np.mgrid[0:shape[0], 0:shape[1]]
    
    # Add a few bright stars
    for _ in range(5):
        star_y = np.random.randint(50, shape[0] - 50)
        star_x = np.random.randint(50, shape[1] - 50)
        star_brightness = np.random.uniform(1000, 5000)
        star_sigma = np.random.uniform(1.5, 3.0)
        
        star = star_brightness * np.exp(-((x_coords - star_x)**2 + (y_coords - star_y)**2) / (2 * star_sigma**2))
        image += star
    
    # Create true cosmic ray mask
    true_crmask = np.zeros(shape, dtype=bool)
    
    # Add cosmic rays
    for _ in range(num_cosmic_rays):
        # Random position
        cr_y = np.random.randint(10, shape[0] - 10)
        cr_x = np.random.randint(10, shape[1] - 10)
        
        # Random cosmic ray type
        cr_type = np.random.choice(['point', 'track'])
        
        if cr_type == 'point':
            # Single pixel cosmic ray
            cr_intensity = np.random.uniform(500, 2000)
            image[cr_y, cr_x] += cr_intensity
            true_crmask[cr_y, cr_x] = True
            
        else:
            # Track-like cosmic ray
            track_length = np.random.randint(3, 15)
            track_angle = np.random.uniform(0, 2 * np.pi)
            cr_intensity = np.random.uniform(300, 1500)
            
            # Create track
            for i in range(track_length):
                offset_y = int(i * np.sin(track_angle))
                offset_x = int(i * np.cos(track_angle))
                pixel_y = cr_y + offset_y
                pixel_x = cr_x + offset_x
                
                if 0 <= pixel_y < shape[0] and 0 <= pixel_x < shape[1]:
                    # Decrease intensity along track
                    intensity = cr_intensity * (1.0 - i / track_length * 0.5)
                    image[pixel_y, pixel_x] += intensity
                    true_crmask[pixel_y, pixel_x] = True
    
    return image, true_crmask

def test_lacosmic_detection():
    """Test L.A.Cosmic cosmic ray detection."""
    logger.info("Testing L.A.Cosmic detection...")
    
    # Create synthetic image
    image, true_crmask = create_synthetic_image_with_cosmic_rays(num_cosmic_rays=15)
    true_cr_count = np.sum(true_crmask)
    
    logger.info(f"Created synthetic image with {true_cr_count} true cosmic ray pixels")
    
    # Initialize detector
    detector = CosmicRayDetector(
        sigma_clip=4.5,
        gain=1.0,
        readnoise=6.5,
        niter=4
    )
    
    # Detect cosmic rays
    cleaned_image, detected_crmask = detector.detect_lacosmic(image)
    detected_cr_count = np.sum(detected_crmask)
    
    logger.info(f"L.A.Cosmic detected {detected_cr_count} cosmic ray pixels")
    
    # Calculate detection metrics
    true_positives = np.sum(true_crmask & detected_crmask)
    false_positives = np.sum(~true_crmask & detected_crmask)
    false_negatives = np.sum(true_crmask & ~detected_crmask)
    
    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
    f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    logger.info(f"Detection metrics:")
    logger.info(f"  True positives: {true_positives}")
    logger.info(f"  False positives: {false_positives}")
    logger.info(f"  False negatives: {false_negatives}")
    logger.info(f"  Precision: {precision:.3f}")
    logger.info(f"  Recall: {recall:.3f}")
    logger.info(f"  F1 Score: {f1_score:.3f}")
    
    return {
        'method': 'lacosmic',
        'true_cr_count': true_cr_count,
        'detected_cr_count': detected_cr_count,
        'true_positives': true_positives,
        'false_positives': false_positives,
        'false_negatives': false_negatives,
        'precision': precision,
        'recall': recall,
        'f1_score': f1_score
    }

def test_sigma_clipping_detection():
    """Test sigma clipping cosmic ray detection."""
    logger.info("Testing sigma clipping detection...")
    
    # Create synthetic image
    image, true_crmask = create_synthetic_image_with_cosmic_rays(num_cosmic_rays=15)
    true_cr_count = np.sum(true_crmask)
    
    # Initialize detector
    detector = CosmicRayDetector()
    
    # Detect cosmic rays
    detected_crmask = detector.detect_sigma_clipping(image, sigma_threshold=5.0)
    detected_cr_count = np.sum(detected_crmask)
    
    logger.info(f"Sigma clipping detected {detected_cr_count} cosmic ray pixels")
    
    # Calculate detection metrics
    true_positives = np.sum(true_crmask & detected_crmask)
    false_positives = np.sum(~true_crmask & detected_crmask)
    false_negatives = np.sum(true_crmask & ~detected_crmask)
    
    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
    f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    
    logger.info(f"Detection metrics:")
    logger.info(f"  True positives: {true_positives}")
    logger.info(f"  False positives: {false_positives}")
    logger.info(f"  False negatives: {false_negatives}")
    logger.info(f"  Precision: {precision:.3f}")
    logger.info(f"  Recall: {recall:.3f}")
    logger.info(f"  F1 Score: {f1_score:.3f}")
    
    return {
        'method': 'sigma_clipping',
        'true_cr_count': true_cr_count,
        'detected_cr_count': detected_cr_count,
        'true_positives': true_positives,
        'false_positives': false_positives,
        'false_negatives': false_negatives,
        'precision': precision,
        'recall': recall,
        'f1_score': f1_score
    }

def test_fits_file_processing():
    """Test FITS file processing."""
    logger.info("Testing FITS file processing...")
    
    # Create synthetic image
    image, true_crmask = create_synthetic_image_with_cosmic_rays(num_cosmic_rays=20)
    
    # Create temporary FITS file
    with tempfile.NamedTemporaryFile(suffix='.fits', delete=False) as tmp_file:
        fits_path = tmp_file.name
        
    try:
        # Create FITS file with header
        hdu = fits.PrimaryHDU(image.astype(np.uint16))
        hdu.header['GAIN'] = 1.0
        hdu.header['RDNOISE'] = 6.5
        hdu.header['SATURATE'] = 65535
        hdu.header['EXPTIME'] = 300
        hdu.header['IMAGETYP'] = 'Light Frame'
        hdu.writeto(fits_path, overwrite=True)
        
        # Process file
        detector = CosmicRayDetector()
        
        with tempfile.NamedTemporaryFile(suffix='_cleaned.fits', delete=False) as out_file:
            output_path = out_file.name
            
        try:
            result = detector.process_fits_file(
                fits_path,
                output_path=output_path,
                method='lacosmic',
                save_mask=True
            )
            
            logger.info(f"FITS processing results:")
            logger.info(f"  Method: {result['method']}")
            logger.info(f"  Cosmic rays detected: {result['num_cosmic_rays']}")
            logger.info(f"  Cosmic ray percentage: {result['cosmic_ray_percentage']:.3f}%")
            logger.info(f"  Image shape: {result['image_shape']}")
            
            # Verify output files exist
            if os.path.exists(output_path):
                logger.info(f"  Cleaned FITS file created: {output_path}")
                # Verify we can read it
                with fits.open(output_path) as hdul:
                    cleaned_data = hdul[0].data
                    logger.info(f"  Cleaned image shape: {cleaned_data.shape}")
                    logger.info(f"  CRMETHOD header: {hdul[0].header.get('CRMETHOD', 'Not found')}")
            
            mask_path = output_path.replace('.fits', '_crmask.fits')
            if os.path.exists(mask_path):
                logger.info(f"  Cosmic ray mask created: {mask_path}")
                result['mask_path'] = mask_path
            
            return result
            
        finally:
            # Clean up output files
            if os.path.exists(output_path):
                os.remove(output_path)
            mask_path = output_path.replace('.fits', '_crmask.fits')
            if os.path.exists(mask_path):
                os.remove(mask_path)
                
    finally:
        # Clean up input file
        if os.path.exists(fits_path):
            os.remove(fits_path)

def test_simple_function():
    """Test the simple cosmic ray detection function."""
    logger.info("Testing simple cosmic ray detection function...")
    
    # Create synthetic image
    image, true_crmask = create_synthetic_image_with_cosmic_rays(num_cosmic_rays=10)
    
    # Use simple function
    cleaned_image, detected_crmask = detect_cosmic_rays_simple(
        image,
        sigma_threshold=4.5,
        gain=1.0,
        readnoise=6.5
    )
    
    detected_cr_count = np.sum(detected_crmask)
    logger.info(f"Simple function detected {detected_cr_count} cosmic ray pixels")
    
    return {
        'method': 'simple_lacosmic',
        'detected_cr_count': detected_cr_count
    }

def run_all_tests():
    """Run all cosmic ray detection tests."""
    logger.info("Starting cosmic ray detection tests...")
    
    results = []
    
    try:
        # Test L.A.Cosmic detection
        lacosmic_result = test_lacosmic_detection()
        results.append(lacosmic_result)
        
        # Test sigma clipping detection
        sigma_result = test_sigma_clipping_detection()
        results.append(sigma_result)
        
        # Test FITS file processing
        fits_result = test_fits_file_processing()
        results.append(fits_result)
        
        # Test simple function
        simple_result = test_simple_function()
        results.append(simple_result)
        
        logger.info("All tests completed successfully!")
        
        # Print summary
        logger.info("\n=== TEST SUMMARY ===")
        for result in results:
            if 'f1_score' in result:
                logger.info(f"{result['method']}: F1={result['f1_score']:.3f}, "
                           f"Precision={result['precision']:.3f}, Recall={result['recall']:.3f}")
            else:
                logger.info(f"{result['method']}: Detected {result.get('detected_cr_count', 'N/A')} cosmic rays")
        
        return results
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    run_all_tests() 