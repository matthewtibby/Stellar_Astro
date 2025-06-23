# 🧪 Stellar Astro Stacking Methods Test Suite

This directory contains comprehensive tests for all stacking methods implemented in the Stellar Astro calibration system.

## 🚀 Quick Start

To run all tests:
```bash
python3 run_all_tests.py
```

## 📝 Test Files

### `run_all_tests.py` - Master Test Runner
- Executes all available tests
- Provides comprehensive summary report
- Best option for validation

### `test_stack_frames_standalone.py` - Core Method Validation  
- Tests basic functionality of all stacking methods
- Verifies mathematical correctness
- Quick smoke test (7 methods tested)

### `test_outlier_rejection.py` - Robustness Testing
- Tests outlier rejection capabilities
- Simulates hot pixels, cosmic rays, cold pixels
- Validates robust methods handle contaminated data

### `test_stacking_methods.py` - Comprehensive Test Suite
- Full validation with edge cases
- Performance testing
- Memory usage verification
- Advanced statistical validation

### Legacy Files
- `quick_test.py` - Early version (may have import issues)
- `run_tests.sh` - Shell script version

## ✅ Validated Stacking Methods

All these methods have been tested and validated:

| Method | Type | Use Case |
|--------|------|----------|
| **Mean** | Simple | Clean frames, maximum SNR |
| **Median** | Robust | General purpose, hot pixel rejection |
| **Kappa-Sigma Clipping** | Robust | Statistical outlier rejection |
| **Percentile Clipping** | Robust | Small datasets, predictable rejection |
| **Winsorized Sigma Clipping** | Robust | Limits extreme values |
| **Entropy-Weighted Averaging** | Advanced | Information-based weighting |
| **Adaptive Stacking** | Smart | Automatic method selection |

## 🎯 Test Results

When all tests pass, you should see:
- ✅ All 7 core methods working correctly
- ✅ Outlier rejection functioning properly  
- ✅ Mathematical accuracy validated
- ✅ Edge cases handled appropriately

## 🔧 Running Individual Tests

```bash
# Test just the core methods
python3 test_stack_frames_standalone.py

# Test outlier rejection only
python3 test_outlier_rejection.py

# Comprehensive testing (if available)
python3 test_stacking_methods.py
```

## 📊 What The Tests Validate

### Core Functionality
- Method execution without errors
- Correct output shapes and data types
- No NaN or infinite values in results
- Expected mathematical behavior

### Outlier Rejection
- Hot pixel removal (values >> background)
- Cold pixel handling (values << background)  
- Cosmic ray rejection (random high spikes)
- Multiple outlier types in same dataset

### Edge Cases
- Single frame inputs
- Identical frames
- High outlier contamination
- Different frame sizes/types

## 🚨 If Tests Fail

1. Check that all required packages are installed:
   ```bash
   pip install astropy numpy ccdproc
   ```

2. Verify you're in the correct virtual environment

3. Check for import path issues with the main calibration worker

4. Review error messages in the test output for specific failures

## 🎛️ Customizing Tests

You can modify the test parameters in each file:
- Frame sizes (currently 50x50 and 100x100)
- Number of test frames (3-5 frames)
- Outlier contamination levels
- Sigma thresholds and percentile ranges

## 📈 Adding New Methods

When implementing new stacking methods:

1. Add the method to `stack_frames()` in `calibration_worker.py`
2. Add test cases to `test_stack_frames_standalone.py`
3. Update the UI in `CalibrationScaffoldUI.tsx`
4. Add tooltips and documentation
5. Run tests to validate implementation

## 🔍 Performance Notes

The tests use small image sizes (50x50, 100x100) for speed. In production:
- Typical calibration frames are 1000x1000 to 6000x4000 pixels
- Processing time scales with image size and number of frames
- Memory usage can be significant for large frame stacks

---

**Last Updated:** Created during comprehensive stacking method validation
**Test Coverage:** All 7 implemented stacking methods validated
**Status:** All tests passing ✅ 