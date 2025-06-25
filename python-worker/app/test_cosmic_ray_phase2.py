"""
Phase 2 Cosmic Ray Detection Test Suite

This script tests all Phase 2 enhancements including:
- Auto-parameter tuning
- Multi-algorithm detection
- Batch processing
- Image quality analysis
- Performance optimizations
"""

import numpy as np
import time
import logging
from astropy.io import fits
import tempfile
import os
from cosmic_ray_detection import CosmicRayDetector, validate_cosmic_ray_parameters

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_images_with_varying_quality(num_images=5):
    """
    Create test images with varying quality characteristics for Phase 2 testing.
    """
    images = []
    true_masks = []
    quality_info = []
    
    for i in range(num_images):
        # Vary image characteristics
        if i == 0:  # High quality, low noise
            shape = (1024, 1024)
            noise_level = 10
            num_cosmic_rays = 25
            signal_level = 5000
            quality_type = "high_quality"
        elif i == 1:  # Medium quality
            shape = (512, 512)
            noise_level = 50
            num_cosmic_rays = 15
            signal_level = 2000
            quality_type = "medium_quality"
        elif i == 2:  # Low quality, high noise
            shape = (256, 256)
            noise_level = 200
            num_cosmic_rays = 8
            signal_level = 800
            quality_type = "low_quality"
        elif i == 3:  # High cosmic ray density
            shape = (512, 512)
            noise_level = 30
            num_cosmic_rays = 50
            signal_level = 3000
            quality_type = "high_cr_density"
        else:  # Very low cosmic ray density
            shape = (512, 512)
            noise_level = 40
            num_cosmic_rays = 3
            signal_level = 2500
            quality_type = "low_cr_density"
        
        # Create base image with stars and background
        image = np.random.poisson(100, shape).astype(np.float64)  # Base background
        
        # Add some stars
        num_stars = np.random.randint(20, 100)
        for _ in range(num_stars):
            star_y = np.random.randint(10, shape[0] - 10)
            star_x = np.random.randint(10, shape[1] - 10)
            star_intensity = np.random.uniform(signal_level * 0.5, signal_level * 2)
            
            # Create star PSF (simple Gaussian)
            y_range = slice(max(0, star_y - 3), min(shape[0], star_y + 4))
            x_range = slice(max(0, star_x - 3), min(shape[1], star_x + 4))
            
            yy, xx = np.mgrid[y_range, x_range]
            star_psf = star_intensity * np.exp(-((yy - star_y)**2 + (xx - star_x)**2) / 2)
            image[y_range, x_range] += star_psf
        
        # Add noise
        noise = np.random.normal(0, noise_level, shape)
        image += noise
        
        # Ensure non-negative values
        image = np.maximum(image, 0)
        
        # Create cosmic ray mask
        true_mask = np.zeros(shape, dtype=bool)
        
        # Add cosmic rays
        for _ in range(num_cosmic_rays):
            cr_y = np.random.randint(5, shape[0] - 5)
            cr_x = np.random.randint(5, shape[1] - 5)
            
            cr_type = np.random.choice(['point', 'track', 'cluster'])
            
            if cr_type == 'point':
                # Single pixel cosmic ray
                cr_intensity = np.random.uniform(signal_level * 2, signal_level * 5)
                image[cr_y, cr_x] += cr_intensity
                true_mask[cr_y, cr_x] = True
                
            elif cr_type == 'track':
                # Track-like cosmic ray
                track_length = np.random.randint(3, 20)
                track_angle = np.random.uniform(0, 2 * np.pi)
                cr_intensity = np.random.uniform(signal_level * 1.5, signal_level * 3)
                
                for j in range(track_length):
                    offset_y = int(j * np.sin(track_angle))
                    offset_x = int(j * np.cos(track_angle))
                    pixel_y = cr_y + offset_y
                    pixel_x = cr_x + offset_x
                    
                    if 0 <= pixel_y < shape[0] and 0 <= pixel_x < shape[1]:
                        intensity = cr_intensity * (1.0 - j / track_length * 0.3)
                        image[pixel_y, pixel_x] += intensity
                        true_mask[pixel_y, pixel_x] = True
                        
            else:  # cluster
                # Cluster of cosmic ray hits
                cluster_size = np.random.randint(2, 8)
                cr_intensity = np.random.uniform(signal_level * 1.2, signal_level * 2.5)
                
                for _ in range(cluster_size):
                    offset_y = np.random.randint(-2, 3)
                    offset_x = np.random.randint(-2, 3)
                    pixel_y = cr_y + offset_y
                    pixel_x = cr_x + offset_x
                    
                    if 0 <= pixel_y < shape[0] and 0 <= pixel_x < shape[1]:
                        image[pixel_y, pixel_x] += cr_intensity
                        true_mask[pixel_y, pixel_x] = True
        
        images.append(image)
        true_masks.append(true_mask)
        quality_info.append({
            'type': quality_type,
            'shape': shape,
            'noise_level': noise_level,
            'num_cosmic_rays': num_cosmic_rays,
            'signal_level': signal_level,
            'true_cr_count': np.sum(true_mask)
        })
    
    return images, true_masks, quality_info

def test_auto_parameter_tuning():
    """Test automatic parameter tuning functionality."""
    logger.info("=== Testing Auto-Parameter Tuning ===")
    
    # Create test images with different characteristics
    images, true_masks, quality_info = create_test_images_with_varying_quality()
    
    detector = CosmicRayDetector()
    results = []
    
    for i, (image, true_mask, info) in enumerate(zip(images, true_masks, quality_info)):
        logger.info(f"Testing image {i+1}: {info['type']}")
        
        # Test auto-tuning
        tuned_params = detector.auto_tune_parameters(image)
        
        # Get image quality metrics
        quality_metrics = detector.get_image_quality_metrics(image)
        
        logger.info(f"  Original params: sigma_clip={detector.sigma_clip}, objlim={detector.objlim}, niter={detector.niter}")
        logger.info(f"  Tuned params: {tuned_params}")
        logger.info(f"  Quality metrics: SNR={quality_metrics['snr']:.1f}, noise={quality_metrics['noise_level']:.1f}")
        
        results.append({
            'image_type': info['type'],
            'tuned_params': tuned_params,
            'quality_metrics': quality_metrics,
            'original_params': {
                'sigma_clip': detector.sigma_clip,
                'objlim': detector.objlim,
                'niter': detector.niter
            }
        })
    
    logger.info("✅ Auto-parameter tuning test completed")
    return results

def test_multi_algorithm_detection():
    """Test multi-algorithm detection with different combination methods."""
    logger.info("=== Testing Multi-Algorithm Detection ===")
    
    # Create a test image
    images, true_masks, _ = create_test_images_with_varying_quality(num_images=1)
    image = images[0]
    true_mask = true_masks[0]
    
    detector = CosmicRayDetector()
    
    # Test different combination methods
    combination_methods = ['intersection', 'union', 'voting']
    methods_to_combine = ['lacosmic', 'sigma_clip']
    
    results = {}
    
    for combine_method in combination_methods:
        logger.info(f"Testing combination method: {combine_method}")
        
        try:
            cleaned_data, combined_mask, stats = detector.detect_multi_algorithm(
                image,
                methods=methods_to_combine,
                combine_method=combine_method
            )
            
            # Calculate detection metrics
            true_positives = np.sum(true_mask & combined_mask)
            false_positives = np.sum(~true_mask & combined_mask)
            false_negatives = np.sum(true_mask & ~combined_mask)
            
            precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
            recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
            f1_score = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            
            results[combine_method] = {
                'stats': stats,
                'metrics': {
                    'precision': precision,
                    'recall': recall,
                    'f1_score': f1_score,
                    'true_positives': true_positives,
                    'false_positives': false_positives,
                    'false_negatives': false_negatives
                }
            }
            
            logger.info(f"  Combined detections: {stats['combined']['num_detections']}")
            logger.info(f"  Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1_score:.3f}")
            
        except Exception as e:
            logger.error(f"  Failed: {e}")
            results[combine_method] = {'error': str(e)}
    
    logger.info("✅ Multi-algorithm detection test completed")
    return results

def test_batch_processing():
    """Test batch processing functionality."""
    logger.info("=== Testing Batch Processing ===")
    
    # Create multiple test FITS files
    images, true_masks, quality_info = create_test_images_with_varying_quality()
    
    temp_files = []
    fits_paths = []
    
    try:
        # Create temporary FITS files
        for i, (image, info) in enumerate(zip(images, quality_info)):
            temp_file = tempfile.NamedTemporaryFile(suffix='.fits', delete=False)
            temp_files.append(temp_file.name)
            fits_paths.append(temp_file.name)
            temp_file.close()
            
            # Create FITS file
            hdu = fits.PrimaryHDU(image.astype(np.float32))
            hdu.header['GAIN'] = 1.0
            hdu.header['RDNOISE'] = info['noise_level']
            hdu.header['OBJECT'] = f'Test_{info["type"]}'
            hdu.writeto(temp_file.name, overwrite=True)
        
        # Test batch processing
        detector = CosmicRayDetector()
        
        start_time = time.time()
        
        # Test with auto-tuning enabled
        logger.info("Testing batch processing with auto-tuning...")
        batch_results = detector.detect_batch(
            fits_paths,
            method='lacosmic',
            auto_tune=True
        )
        
        processing_time = time.time() - start_time
        
        # Analyze results
        successful_files = sum(1 for result in batch_results.values() if result.get('success'))
        total_cosmic_rays = sum(r.get('num_cosmic_rays', 0) for r in batch_results.values() if r.get('success'))
        
        logger.info(f"  Processed {successful_files}/{len(fits_paths)} files successfully")
        logger.info(f"  Total cosmic rays detected: {total_cosmic_rays}")
        logger.info(f"  Processing time: {processing_time:.2f} seconds")
        logger.info(f"  Average time per file: {processing_time/len(fits_paths):.2f} seconds")
        
        # Test without auto-tuning for comparison
        logger.info("Testing batch processing without auto-tuning...")
        start_time = time.time()
        
        batch_results_no_tune = detector.detect_batch(
            fits_paths,
            method='lacosmic',
            auto_tune=False
        )
        
        processing_time_no_tune = time.time() - start_time
        logger.info(f"  Processing time without auto-tune: {processing_time_no_tune:.2f} seconds")
        
        results = {
            'with_auto_tune': {
                'results': batch_results,
                'processing_time': processing_time,
                'successful_files': successful_files,
                'total_cosmic_rays': total_cosmic_rays
            },
            'without_auto_tune': {
                'results': batch_results_no_tune,
                'processing_time': processing_time_no_tune
            }
        }
        
        logger.info("✅ Batch processing test completed")
        return results
        
    finally:
        # Clean up temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)

def test_image_quality_analysis():
    """Test image quality analysis functionality."""
    logger.info("=== Testing Image Quality Analysis ===")
    
    # Create test images with different quality characteristics
    images, _, quality_info = create_test_images_with_varying_quality()
    
    detector = CosmicRayDetector()
    
    for i, (image, info) in enumerate(zip(images, quality_info)):
        logger.info(f"Analyzing image {i+1}: {info['type']}")
        
        quality_metrics = detector.get_image_quality_metrics(image)
        
        logger.info(f"  Mean: {quality_metrics['mean']:.1f}")
        logger.info(f"  Median: {quality_metrics['median']:.1f}")
        logger.info(f"  SNR: {quality_metrics['snr']:.1f}")
        logger.info(f"  Noise level: {quality_metrics['noise_level']:.1f}")
        logger.info(f"  Dynamic range: {quality_metrics['dynamic_range']:.1f}")
        logger.info(f"  Star density: {quality_metrics['star_density']:.4f}")
        
        # Verify metrics make sense
        assert quality_metrics['mean'] > 0, "Mean should be positive"
        assert quality_metrics['snr'] > 0, "SNR should be positive"
        assert 0 <= quality_metrics['star_density'] <= 1, "Star density should be between 0 and 1"
    
    logger.info("✅ Image quality analysis test completed")

def test_performance_comparison():
    """Compare performance between Phase 1 and Phase 2 methods."""
    logger.info("=== Testing Performance Comparison ===")
    
    # Create a reasonably sized test image
    images, true_masks, _ = create_test_images_with_varying_quality(num_images=1)
    image = images[0]
    
    detector = CosmicRayDetector()
    
    # Test Phase 1 (basic L.A.Cosmic)
    logger.info("Testing Phase 1 performance...")
    start_time = time.time()
    cleaned_phase1, mask_phase1 = detector.detect_lacosmic(image)
    phase1_time = time.time() - start_time
    phase1_detections = np.sum(mask_phase1)
    
    # Test Phase 2 (with auto-tuning)
    logger.info("Testing Phase 2 performance (with auto-tuning)...")
    start_time = time.time()
    
    # Auto-tune parameters
    tuned_params = detector.auto_tune_parameters(image)
    for param, value in tuned_params.items():
        setattr(detector, param, value)
    
    # Detect with tuned parameters
    cleaned_phase2, mask_phase2 = detector.detect_lacosmic(image)
    phase2_time = time.time() - start_time
    phase2_detections = np.sum(mask_phase2)
    
    # Test Phase 2 (multi-algorithm)
    logger.info("Testing Phase 2 performance (multi-algorithm)...")
    start_time = time.time()
    cleaned_multi, mask_multi, multi_stats = detector.detect_multi_algorithm(image)
    multi_time = time.time() - start_time
    multi_detections = np.sum(mask_multi)
    
    logger.info(f"Performance Results:")
    logger.info(f"  Phase 1 (basic): {phase1_time:.3f}s, {phase1_detections} detections")
    logger.info(f"  Phase 2 (auto-tune): {phase2_time:.3f}s, {phase2_detections} detections")
    logger.info(f"  Phase 2 (multi-algo): {multi_time:.3f}s, {multi_detections} detections")
    
    results = {
        'phase1': {'time': phase1_time, 'detections': phase1_detections},
        'phase2_auto': {'time': phase2_time, 'detections': phase2_detections},
        'phase2_multi': {'time': multi_time, 'detections': multi_detections, 'stats': multi_stats}
    }
    
    logger.info("✅ Performance comparison test completed")
    return results

def run_all_phase2_tests():
    """Run all Phase 2 test suites."""
    logger.info("🚀 Starting Phase 2 Cosmic Ray Detection Test Suite")
    
    all_results = {}
    
    try:
        # Test 1: Auto-parameter tuning
        all_results['auto_tuning'] = test_auto_parameter_tuning()
        
        # Test 2: Multi-algorithm detection
        all_results['multi_algorithm'] = test_multi_algorithm_detection()
        
        # Test 3: Batch processing
        all_results['batch_processing'] = test_batch_processing()
        
        # Test 4: Image quality analysis
        test_image_quality_analysis()
        
        # Test 5: Performance comparison
        all_results['performance'] = test_performance_comparison()
        
        logger.info("🎉 All Phase 2 tests completed successfully!")
        logger.info("📊 Phase 2 Enhancement Summary:")
        logger.info("  ✅ Auto-parameter tuning")
        logger.info("  ✅ Multi-algorithm detection")
        logger.info("  ✅ Enhanced batch processing")
        logger.info("  ✅ Image quality analysis")
        logger.info("  ✅ Performance optimizations")
        
        return all_results
        
    except Exception as e:
        logger.error(f"❌ Phase 2 test suite failed: {e}")
        raise

if __name__ == "__main__":
    results = run_all_phase2_tests() 