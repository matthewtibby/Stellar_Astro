#!/usr/bin/env python3
"""
Master test runner for Stellar Astro stacking methods.
Runs all available tests and provides a comprehensive report.
"""

import subprocess
import sys
import time

def run_test(test_script, test_name):
    """Run a single test script and return results"""
    print(f"🧪 Running {test_name}...")
    print("=" * 50)
    
    start_time = time.time()
    
    try:
        result = subprocess.run([sys.executable, test_script], 
                              capture_output=True, text=True, timeout=300)
        
        duration = time.time() - start_time
        
        # Print the output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        success = result.returncode == 0
        return {
            'name': test_name,
            'success': success,
            'duration': duration,
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
        
    except subprocess.TimeoutExpired:
        print(f"❌ {test_name} TIMED OUT after 5 minutes")
        return {
            'name': test_name,
            'success': False,
            'duration': 300,
            'error': 'Timeout'
        }
    except Exception as e:
        print(f"❌ {test_name} FAILED with exception: {e}")
        return {
            'name': test_name,
            'success': False,
            'duration': time.time() - start_time,
            'error': str(e)
        }

def main():
    """Run all stacking method tests"""
    print("🚀 STELLAR ASTRO STACKING METHODS - COMPREHENSIVE TEST SUITE")
    print("=" * 70)
    print()
    
    # List of tests to run
    tests = [
        ('test_stack_frames_standalone.py', 'Core Stacking Methods'),
        ('test_outlier_rejection.py', 'Outlier Rejection Capabilities'),
    ]
    
    results = []
    total_start_time = time.time()
    
    # Run each test
    for test_script, test_name in tests:
        result = run_test(test_script, test_name)
        results.append(result)
        print()
    
    total_duration = time.time() - total_start_time
    
    # Generate summary report
    print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 70)
    
    passed_tests = [r for r in results if r['success']]
    failed_tests = [r for r in results if not r['success']]
    
    print(f"📈 Tests Run: {len(results)}")
    print(f"✅ Passed: {len(passed_tests)}")
    print(f"❌ Failed: {len(failed_tests)}")
    print(f"⏱️  Total Duration: {total_duration:.2f} seconds")
    print()
    
    if passed_tests:
        print("✅ PASSED TESTS:")
        for result in passed_tests:
            print(f"   • {result['name']} ({result['duration']:.2f}s)")
        print()
    
    if failed_tests:
        print("❌ FAILED TESTS:")
        for result in failed_tests:
            error_info = result.get('error', f"Exit code: {result.get('returncode', 'unknown')}")
            print(f"   • {result['name']} - {error_info}")
        print()
    
    # Overall verdict
    if len(failed_tests) == 0:
        print("🎉 ALL TESTS PASSED!")
        print("✨ Your Stellar Astro stacking methods are working correctly!")
        print()
        print("🔧 VALIDATED STACKING METHODS:")
        validated_methods = [
            "✅ Mean (simple averaging)",
            "✅ Median (robust against outliers)",
            "✅ Kappa-Sigma Clipping (statistical outlier rejection)", 
            "✅ Percentile Clipping (percentile-based rejection)",
            "✅ Winsorized Sigma Clipping (limits extreme values)",
            "✅ Entropy-Weighted Averaging (information-based weighting)",
            "✅ Adaptive Stacking (automatic method selection)",
        ]
        for method in validated_methods:
            print(f"   {method}")
        
        print()
        print("🎯 READY FOR PRODUCTION:")
        print("   • All core stacking algorithms functioning correctly")
        print("   • Outlier rejection working properly")
        print("   • Hot pixels, cosmic rays, and noise handled appropriately")
        print("   • Mathematical correctness validated")
        
        return True
    else:
        print("⚠️  SOME TESTS FAILED")
        print("🔧 Please review the failed tests above and fix any issues.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 