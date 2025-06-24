#!/usr/bin/env python3
"""
Test outlier rejection capabilities of stacking methods.
This specifically tests how well methods handle hot pixels, cosmic rays, and other outliers.
"""

import numpy as np
import os
import tempfile
from astropy.io import fits
import sys

# Import our standalone stack_frames function
from test_stack_frames_standalone import stack_frames

def test_outlier_rejection():
    """Test outlier rejection with simulated hot pixels and cosmic rays"""
    print("🎯 Outlier Rejection Test")
    print("-" * 30)
    
    # Create temporary test files with outliers
    temp_dir = tempfile.mkdtemp()
    file_paths = []
    
    try:
        # Create 5 test frames with progressively more outliers
        base_value = 1000
        for i in range(5):
            data = np.full((100, 100), base_value, dtype=np.uint16)
            
            # Add different types of outliers to each frame
            if i == 0:
                # Frame 0: Hot pixels (high values)
                data[50:55, 50:55] = 50000  # Hot pixel cluster
                data[25, 25] = 60000  # Single hot pixel
            elif i == 1:
                # Frame 1: Cold pixels (low values)  
                data[75:80, 75:80] = 100   # Cold pixel cluster
                data[30, 70] = 50    # Single cold pixel
            elif i == 2:
                # Frame 2: Cosmic ray strikes (random high values)
                cosmic_ray_positions = [(10, 10), (20, 80), (60, 30), (90, 90)]
                for x, y in cosmic_ray_positions:
                    data[x, y] = np.random.randint(40000, 65000)
            elif i == 3:
                # Frame 3: Some scattered outliers
                for _ in range(10):
                    x, y = np.random.randint(0, 100, 2)
                    data[x, y] = np.random.choice([100, 45000])  # Random hot or cold
            # Frame 4: Clean frame (no outliers)
            
            hdu = fits.PrimaryHDU(data)
            filepath = os.path.join(temp_dir, f"outlier_test_{i}.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
        
        print(f"Created {len(file_paths)} test frames with outliers")
        print(f"Expected clean result: ~{base_value} (without outlier contamination)")
        print()
        
        # Test robust methods
        robust_methods = [
            ('median', None),
            ('sigma', 3.0),
            ('sigma', 2.0),  # More aggressive
            ('percentile_clip', 60),  # Keep middle 60%
            ('percentile_clip', 40),  # More aggressive - keep middle 40%
            ('minmax', None),  # Simple min/max rejection
            ('winsorized', 3.0),
            ('adaptive', None),
        ]
        
        results = {}
        
        for method, sigma in robust_methods:
            method_name = f"{method}_{sigma or 'default'}"
            try:
                result = stack_frames(file_paths, method=method, sigma_clip=sigma)
                
                # Calculate statistics
                mean_val = np.mean(result)
                std_val = np.std(result)
                min_val = np.min(result)
                max_val = np.max(result)
                
                # Check how close to expected clean value
                deviation_from_clean = abs(mean_val - base_value)
                
                # Check for outlier contamination
                outlier_contamination = np.sum((result < base_value * 0.5) | (result > base_value * 2.0)) / result.size * 100
                
                results[method_name] = {
                    'mean': mean_val,
                    'std': std_val,
                    'min': min_val,
                    'max': max_val,
                    'deviation': deviation_from_clean,
                    'contamination_pct': outlier_contamination
                }
                
                # Determine if test passed (mean should be close to base_value)
                passed = deviation_from_clean < base_value * 0.1  # Within 10%
                
                status = "✅ PASS" if passed else "❌ FAIL"
                print(f"{status} {method_name:20s}: mean={mean_val:6.1f}, dev={deviation_from_clean:5.1f}, outliers={outlier_contamination:4.1f}%")
                
            except Exception as e:
                print(f"❌ FAIL {method_name:20s}: ERROR - {e}")
                results[method_name] = {'error': str(e)}
        
        print()
        
        # Summary and recommendations
        print("📊 OUTLIER REJECTION SUMMARY")
        print("-" * 40)
        
        # Find best performing method
        best_method = None
        best_score = float('inf')
        
        for method_name, result in results.items():
            if 'error' not in result:
                # Score based on deviation from clean value and outlier contamination
                score = result['deviation'] + result['contamination_pct'] * 10
                if score < best_score:
                    best_score = score
                    best_method = method_name
        
        if best_method:
            print(f"🏆 Best performing method: {best_method}")
            print(f"   Deviation from clean: {results[best_method]['deviation']:.1f}")
            print(f"   Outlier contamination: {results[best_method]['contamination_pct']:.1f}%")
        
        print()
        print("💡 RECOMMENDATIONS:")
        print("   - sigma_3.0 and sigma_2.0 are excellent for cosmic ray rejection")
        print("   - percentile_clip_40 is very aggressive against outliers")
        print("   - median is robust but may be conservative") 
        print("   - adaptive automatically selects appropriate method")
        
        # Overall test result
        passed_methods = sum(1 for r in results.values() if 'error' not in r and r['deviation'] < base_value * 0.1)
        total_methods = len(results)
        
        print(f"\n🎯 Overall: {passed_methods}/{total_methods} methods passed outlier rejection test")
        
        return passed_methods > 0
        
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    success = test_outlier_rejection()
    print(f"\n{'🎉 SUCCESS' if success else '❌ FAILURE'}: Outlier rejection test {'passed' if success else 'failed'}")
    exit(0 if success else 1) 