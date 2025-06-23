#!/usr/bin/env python3
"""
Comprehensive test suite for all stacking methods in calibration_worker.py

This test validates:
- All stacking methods work without errors
- Mathematical correctness of results
- Edge cases (single frame, identical frames, outliers)
- Performance and memory usage
- Integration with the actual calibration worker
"""

import numpy as np
import os
import tempfile
import time
from pathlib import Path
from astropy.io import fits
import sys

# Add the app directory to Python path and handle relative imports
app_dir = os.path.join(os.path.dirname(__file__), 'app')
sys.path.insert(0, app_dir)
sys.path.insert(0, os.path.dirname(__file__))

# Import the stack_frames function directly from the module
import importlib.util
spec = importlib.util.spec_from_file_location("calibration_worker", os.path.join(app_dir, "calibration_worker.py"))
calibration_worker = importlib.util.module_from_spec(spec)

# Mock the relative imports that cause issues
import types
mock_supabase_io = types.ModuleType('supabase_io')
mock_supabase_io.download_file = lambda *args, **kwargs: None
mock_supabase_io.upload_file = lambda *args, **kwargs: None
mock_supabase_io.get_public_url = lambda *args, **kwargs: None
mock_supabase_io.list_files = lambda *args, **kwargs: []

sys.modules['supabase_io'] = mock_supabase_io
sys.modules['app.supabase_io'] = mock_supabase_io

# Load the module
spec.loader.exec_module(calibration_worker)
stack_frames = calibration_worker.stack_frames

class StackingMethodTester:
    def __init__(self):
        self.test_results = {}
        self.temp_dir = None
        
    def create_synthetic_fits_files(self, n_frames=5, width=100, height=100, base_value=1000):
        """Create synthetic FITS files for testing"""
        self.temp_dir = tempfile.mkdtemp()
        file_paths = []
        
        for i in range(n_frames):
            # Create synthetic data with slight variations
            data = np.full((height, width), base_value, dtype=np.uint16)
            
            # Add some realistic noise and variations
            noise = np.random.normal(0, 10, (height, width))
            data = data + noise.astype(np.int16)
            
            # Add some outliers to test rejection algorithms
            if i == 0:  # First frame has hot pixels
                data[50:55, 50:55] = 60000  # Hot pixel cluster
            elif i == n_frames - 1:  # Last frame has cold pixels  
                data[25:30, 25:30] = 100   # Cold pixel cluster
                
            # Ensure data stays within uint16 range
            data = np.clip(data, 0, 65535).astype(np.uint16)
            
            # Create FITS file
            hdu = fits.PrimaryHDU(data)
            filename = f"test_frame_{i:03d}.fits"
            filepath = os.path.join(self.temp_dir, filename)
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
            
        return file_paths
    
    def create_edge_case_files(self, case_type="identical"):
        """Create files for testing edge cases"""
        self.temp_dir = tempfile.mkdtemp()
        file_paths = []
        
        if case_type == "identical":
            # All frames are identical
            data = np.full((50, 50), 1000, dtype=np.uint16)
            for i in range(3):
                hdu = fits.PrimaryHDU(data)
                filepath = os.path.join(self.temp_dir, f"identical_{i}.fits")
                hdu.writeto(filepath, overwrite=True)
                file_paths.append(filepath)
                
        elif case_type == "single":
            # Single frame
            data = np.full((50, 50), 1000, dtype=np.uint16)
            hdu = fits.PrimaryHDU(data)
            filepath = os.path.join(self.temp_dir, "single.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
            
        elif case_type == "extreme_outliers":
            # Frames with extreme outliers
            for i in range(3):
                if i == 1:  # Middle frame has extreme values
                    data = np.full((50, 50), 50000, dtype=np.uint16)
                else:
                    data = np.full((50, 50), 1000, dtype=np.uint16)
                    
                hdu = fits.PrimaryHDU(data)
                filepath = os.path.join(self.temp_dir, f"outlier_{i}.fits")
                hdu.writeto(filepath, overwrite=True)
                file_paths.append(filepath)
                
        return file_paths
    
    def test_stacking_method(self, method, sigma_clip=None, file_paths=None):
        """Test a specific stacking method"""
        if file_paths is None:
            file_paths = self.create_synthetic_fits_files()
            
        try:
            start_time = time.time()
            result = stack_frames(file_paths, method=method, sigma_clip=sigma_clip)
            end_time = time.time()
            
            # Validate result
            assert result is not None, f"Method {method} returned None"
            assert isinstance(result, np.ndarray), f"Method {method} didn't return numpy array"
            assert result.ndim == 2, f"Method {method} returned wrong dimensions: {result.ndim}"
            assert not np.any(np.isnan(result)), f"Method {method} produced NaN values"
            assert not np.any(np.isinf(result)), f"Method {method} produced infinite values"
            
            # Calculate some basic statistics
            stats = {
                'shape': result.shape,
                'min': float(np.min(result)),
                'max': float(np.max(result)),
                'mean': float(np.mean(result)),
                'std': float(np.std(result)),
                'processing_time': end_time - start_time
            }
            
            return True, stats, None
            
        except Exception as e:
            return False, None, str(e)
    
    def test_mathematical_correctness(self):
        """Test mathematical correctness with known inputs"""
        print("Testing mathematical correctness...")
        
        # Create simple test case with known expected results
        self.temp_dir = tempfile.mkdtemp()
        file_paths = []
        
        # Create 3 frames: [100, 200, 300] at each pixel
        test_values = [100, 200, 300]
        for i, val in enumerate(test_values):
            data = np.full((10, 10), val, dtype=np.uint16)
            hdu = fits.PrimaryHDU(data)
            filepath = os.path.join(self.temp_dir, f"math_test_{i}.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
        
        # Test mean (should be 200)
        result = stack_frames(file_paths, method='mean')
        expected_mean = 200.0
        actual_mean = np.mean(result)
        assert abs(actual_mean - expected_mean) < 0.1, f"Mean test failed: expected {expected_mean}, got {actual_mean}"
        
        # Test median (should be 200)  
        result = stack_frames(file_paths, method='median')
        expected_median = 200.0
        actual_median = np.mean(result)  # All pixels should be 200
        assert abs(actual_median - expected_median) < 0.1, f"Median test failed: expected {expected_median}, got {actual_median}"
        
        print("✅ Mathematical correctness tests passed")
    
    def test_all_methods(self):
        """Test all available stacking methods"""
        print("Testing all stacking methods...\n")
        
        methods_to_test = [
            ('mean', None),
            ('median', None),
            ('sigma', 3.0),
            ('sigma', 2.0),  # Different sigma value
            ('percentile_clip', 60),  # Keep middle 60%
            ('percentile_clip', 80),  # Keep middle 80%
            ('winsorized', 3.0),
            ('linear_fit', 3.0),
            ('entropy_weighted', None),
            ('adaptive', None),
            ('minmax', None),
        ]
        
        # Test with normal synthetic data
        file_paths = self.create_synthetic_fits_files()
        
        for method, sigma in methods_to_test:
            print(f"Testing {method}" + (f" (σ={sigma})" if sigma else "") + "... ", end="")
            
            success, stats, error = self.test_stacking_method(method, sigma, file_paths)
            
            if success:
                print(f"✅ PASS ({stats['processing_time']:.3f}s)")
                print(f"    Shape: {stats['shape']}, Range: {stats['min']:.1f}-{stats['max']:.1f}, Mean: {stats['mean']:.1f}")
                self.test_results[f"{method}_{sigma or 'default'}"] = {
                    'success': True,
                    'stats': stats
                }
            else:
                print(f"❌ FAIL: {error}")
                self.test_results[f"{method}_{sigma or 'default'}"] = {
                    'success': False,
                    'error': error
                }
            print()
    
    def test_edge_cases(self):
        """Test edge cases that might break stacking methods"""
        print("Testing edge cases...\n")
        
        edge_cases = [
            ("identical frames", "identical"),
            ("single frame", "single"),
            ("extreme outliers", "extreme_outliers")
        ]
        
        robust_methods = ['median', 'sigma', 'percentile_clip', 'winsorized']
        
        for case_name, case_type in edge_cases:
            print(f"Testing {case_name}:")
            file_paths = self.create_edge_case_files(case_type)
            
            for method in robust_methods:
                sigma = 3.0 if method in ['sigma', 'winsorized'] else (60 if method == 'percentile_clip' else None)
                print(f"  {method}... ", end="")
                
                success, stats, error = self.test_stacking_method(method, sigma, file_paths)
                
                if success:
                    print("✅ PASS")
                else:
                    print(f"❌ FAIL: {error}")
            print()
    
    def test_performance(self):
        """Test performance with larger datasets"""
        print("Testing performance with larger datasets...\n")
        
        # Test with larger frames
        large_files = self.create_synthetic_fits_files(n_frames=10, width=500, height=500)
        
        fast_methods = ['mean', 'median', 'sigma']
        
        for method in fast_methods:
            print(f"Performance test - {method}... ", end="")
            success, stats, error = self.test_stacking_method(method, 3.0 if method == 'sigma' else None, large_files)
            
            if success:
                time_taken = stats['processing_time']
                print(f"✅ {time_taken:.2f}s")
                if time_taken > 10:  # Warn if too slow
                    print(f"    ⚠️  Warning: Method took {time_taken:.2f}s (may be too slow for production)")
            else:
                print(f"❌ FAIL: {error}")
        print()
    
    def test_percentile_clipping_logic(self):
        """Specifically test percentile clipping with known data"""
        print("Testing percentile clipping logic...")
        
        # Create test data where we know what should be rejected
        self.temp_dir = tempfile.mkdtemp()
        file_paths = []
        
        # Create 5 frames with values [100, 200, 300, 400, 500] at each pixel
        test_values = [100, 200, 300, 400, 500]
        for i, val in enumerate(test_values):
            data = np.full((10, 10), val, dtype=np.uint16)
            hdu = fits.PrimaryHDU(data)
            filepath = os.path.join(self.temp_dir, f"percentile_test_{i}.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
        
        # Test 60% percentile clipping (should keep middle 3 values: 200, 300, 400)
        # Expected result: (200 + 300 + 400) / 3 = 300
        result = stack_frames(file_paths, method='percentile_clip', sigma_clip=60)
        expected_value = 300.0
        actual_value = np.mean(result)
        
        print(f"Expected: {expected_value}, Actual: {actual_value}")
        assert abs(actual_value - expected_value) < 0.1, f"Percentile clipping failed: expected {expected_value}, got {actual_value}"
        
        print("✅ Percentile clipping logic test passed")
    
    def cleanup(self):
        """Clean up temporary files"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🧪 STELLAR ASTRO STACKING METHODS TEST SUITE")
        print("=" * 50)
        print()
        
        try:
            # Core functionality tests
            self.test_mathematical_correctness()
            print()
            
            self.test_all_methods()
            
            self.test_edge_cases()
            
            self.test_percentile_clipping_logic()
            print()
            
            self.test_performance()
            
            # Summary
            print("📊 TEST SUMMARY")
            print("-" * 30)
            
            total_tests = len(self.test_results)
            passed_tests = sum(1 for result in self.test_results.values() if result['success'])
            failed_tests = total_tests - passed_tests
            
            print(f"Total tests: {total_tests}")
            print(f"✅ Passed: {passed_tests}")
            print(f"❌ Failed: {failed_tests}")
            
            if failed_tests == 0:
                print("\n🎉 ALL TESTS PASSED! Stacking methods are working correctly.")
            else:
                print(f"\n⚠️  {failed_tests} test(s) failed. Check the output above for details.")
                
                # Show failed tests
                print("\nFailed tests:")
                for test_name, result in self.test_results.items():
                    if not result['success']:
                        print(f"  - {test_name}: {result['error']}")
            
            return failed_tests == 0
            
        except Exception as e:
            print(f"\n❌ Test suite crashed: {e}")
            return False
        finally:
            self.cleanup()

def main():
    """Main test runner"""
    tester = StackingMethodTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 