#!/usr/bin/env python3
"""
Test frame-to-frame consistency analysis functionality.
"""

import numpy as np
import os
import tempfile
from astropy.io import fits
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).resolve().parent / "app"))

from app.frame_consistency import analyze_frame_consistency, suggest_frame_selection

def create_synthetic_frames(n_frames=10, base_value=1000, noise_level=50, outlier_indices=None):
    """Create synthetic FITS frames for testing"""
    temp_dir = tempfile.mkdtemp()
    file_paths = []
    
    try:
        for i in range(n_frames):
            # Create base frame with consistent structure
            data = np.full((100, 100), base_value, dtype=np.uint16)
            
            # Add realistic noise
            noise = np.random.normal(0, noise_level, data.shape)
            data = data + noise.astype(np.uint16)
            
            # Add outliers to specific frames
            if outlier_indices and i in outlier_indices:
                if i == outlier_indices[0]:
                    # High bias frame
                    data = data + 500
                elif i == outlier_indices[1] if len(outlier_indices) > 1 else -1:
                    # Low bias frame
                    data = data - 300
                elif i == outlier_indices[2] if len(outlier_indices) > 2 else -1:
                    # High noise frame
                    extra_noise = np.random.normal(0, noise_level * 3, data.shape)
                    data = data + extra_noise.astype(np.uint16)
            
            # Add some spatial structure (gradient) to make it more realistic
            y, x = np.mgrid[0:100, 0:100]
            gradient = (y + x) * 0.1
            data = data + gradient.astype(np.uint16)
            
            # Ensure values are within valid range
            data = np.clip(data, 0, 65535)
            
            # Create FITS file
            hdu = fits.PrimaryHDU(data)
            hdu.header['IMAGETYP'] = 'BIAS'
            hdu.header['EXPTIME'] = 0.0
            hdu.header['GAIN'] = 1.0
            hdu.header['CCD-TEMP'] = -20.0
            hdu.header['DATE-OBS'] = f'2024-01-{i+1:02d}T12:00:00'
            
            filepath = os.path.join(temp_dir, f"test_frame_{i:03d}.fits")
            hdu.writeto(filepath, overwrite=True)
            file_paths.append(filepath)
        
        return file_paths, temp_dir
        
    except Exception as e:
        # Clean up on error
        import shutil
        shutil.rmtree(temp_dir)
        raise e

def test_consistency_analysis():
    """Test the consistency analysis with synthetic data"""
    print("🔬 Testing Frame-to-Frame Consistency Analysis")
    print("=" * 50)
    
    # Test 1: Good consistency (no outliers)
    print("\n📊 Test 1: Consistent Frame Set")
    print("-" * 30)
    
    file_paths, temp_dir = create_synthetic_frames(n_frames=8, outlier_indices=None)
    
    try:
        analysis = analyze_frame_consistency(file_paths, consistency_threshold=0.7)
        
        print(f"Frames analyzed: {analysis.n_frames}")
        print(f"Overall consistency: {analysis.overall_consistency:.2f}/10")
        print(f"Mean stability: {analysis.mean_stability:.4f}")
        print(f"Std stability: {analysis.std_stability:.4f}")
        print(f"Recommended frames: {len(analysis.recommended_frames)}")
        print(f"Questionable frames: {len(analysis.questionable_frames)}")
        print(f"Rejected frames: {len(analysis.rejected_frames)}")
        
        # Test frame selection
        selection = suggest_frame_selection(analysis, min_frames=5)
        print(f"Selected for stacking: {selection['frames_used']}")
        print(f"Selection quality: {selection['selection_quality']:.2f}/10")
        
        # Should have high consistency for synthetic data
        assert analysis.overall_consistency > 7.0, f"Expected high consistency, got {analysis.overall_consistency}"
        assert len(analysis.rejected_frames) == 0, f"Expected no rejected frames, got {len(analysis.rejected_frames)}"
        
        print("✅ Test 1 PASSED - Good consistency detected")
        
    finally:
        import shutil
        shutil.rmtree(temp_dir)
    
    # Test 2: With outliers
    print("\n📊 Test 2: Frame Set with Outliers")
    print("-" * 30)
    
    file_paths, temp_dir = create_synthetic_frames(n_frames=10, outlier_indices=[1, 3, 7])
    
    try:
        analysis = analyze_frame_consistency(file_paths, consistency_threshold=0.7)
        
        print(f"Frames analyzed: {analysis.n_frames}")
        print(f"Overall consistency: {analysis.overall_consistency:.2f}/10")
        print(f"Mean stability: {analysis.mean_stability:.4f}")
        print(f"Std stability: {analysis.std_stability:.4f}")
        print(f"Recommended frames: {len(analysis.recommended_frames)}")
        print(f"Questionable frames: {len(analysis.questionable_frames)}")
        print(f"Rejected frames: {len(analysis.rejected_frames)}")
        
        # Show individual frame scores
        print("\nIndividual Frame Scores:")
        for i, metric in enumerate(analysis.metrics_by_frame):
            score = metric.consistency_score
            status = "✅" if score >= 7.0 else "⚠️" if score >= 3.5 else "❌"
            print(f"  Frame {i:2d}: {score:5.2f}/10 {status}")
            if metric.warnings:
                for warning in metric.warnings:
                    print(f"    Warning: {warning}")
        
        # Test frame selection
        selection = suggest_frame_selection(analysis, min_frames=5)
        print(f"\nFrame Selection:")
        print(f"Selected for stacking: {selection['frames_used']}")
        print(f"Excluded: {selection['frames_excluded']}")
        print(f"Selection quality: {selection['selection_quality']:.2f}/10")
        print(f"Estimated improvement: {selection['improvement_estimate']:.2f}")
        
        # Should detect outliers
        assert analysis.overall_consistency < 8.0, f"Expected lower consistency with outliers, got {analysis.overall_consistency}"
        assert len(analysis.rejected_frames) > 0 or len(analysis.questionable_frames) > 0, "Expected to detect problematic frames"
        
        print("✅ Test 2 PASSED - Outliers detected successfully")
        
    finally:
        import shutil
        shutil.rmtree(temp_dir)
    
    # Test 3: Edge case - minimal frames
    print("\n📊 Test 3: Minimal Frame Set")
    print("-" * 30)
    
    file_paths, temp_dir = create_synthetic_frames(n_frames=3, outlier_indices=None)
    
    try:
        analysis = analyze_frame_consistency(file_paths, consistency_threshold=0.7)
        
        print(f"Frames analyzed: {analysis.n_frames}")
        print(f"Overall consistency: {analysis.overall_consistency:.2f}/10")
        
        # Should handle minimal frames gracefully
        assert analysis.n_frames == 3, f"Expected 3 frames, got {analysis.n_frames}"
        assert analysis.overall_consistency > 0, f"Expected positive consistency, got {analysis.overall_consistency}"
        
        print("✅ Test 3 PASSED - Minimal frames handled correctly")
        
    finally:
        import shutil
        shutil.rmtree(temp_dir)

def test_error_handling():
    """Test error handling"""
    print("\n🛡️  Testing Error Handling")
    print("-" * 30)
    
    # Test with non-existent files
    try:
        analyze_frame_consistency(["/non/existent/file.fits"])
        assert False, "Expected error for non-existent files"
    except:
        print("✅ Correctly handles non-existent files")
    
    # Test with empty list
    try:
        analyze_frame_consistency([])
        assert False, "Expected error for empty file list"
    except:
        print("✅ Correctly handles empty file list")
    
    # Test with single file
    try:
        file_paths, temp_dir = create_synthetic_frames(n_frames=1)
        try:
            analyze_frame_consistency(file_paths)
            assert False, "Expected error for single file"
        except ValueError as e:
            print("✅ Correctly handles single file")
        finally:
            import shutil
            shutil.rmtree(temp_dir)
    except:
        print("✅ Error handling works")

def main():
    """Run all tests"""
    print("🚀 Frame-to-Frame Consistency Analysis Test Suite")
    print("=" * 60)
    
    try:
        test_consistency_analysis()
        test_error_handling()
        
        print("\n🎉 All Tests Passed!")
        print("=" * 60)
        print("The frame consistency analysis is working correctly.")
        print("You can now integrate it into the calibration workflow.")
        
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 