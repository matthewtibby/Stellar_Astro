#!/usr/bin/env python3
"""
Quick validation test for stacking methods.
This runs a fast check to ensure core methods are working.
"""

import numpy as np
import os
import tempfile
import sys
from astropy.io import fits

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
            ('percentile_clip', 60)
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
                
                print(f"✅ {method}: PASS")
                passed += 1
                
            except Exception as e:
                print(f"❌ {method}: FAIL - {e}")
                failed += 1
        
        print(f"\nResults: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 Quick test PASSED! Core stacking methods are working.")
            return True
        else:
            print("⚠️  Some methods failed. Run full test suite for details.")
            return False
            
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    success = quick_test()
    sys.exit(0 if success else 1) 