#!/bin/bash

# Stellar Astro Stacking Methods Test Runner
# Run this script to validate all stacking methods are working correctly

echo "🧪 STELLAR ASTRO STACKING METHODS TEST RUNNER"
echo "=============================================="
echo

# Check if we're in the right directory
if [ ! -f "test_stacking_methods.py" ]; then
    echo "❌ Error: test_stacking_methods.py not found"
    echo "Please run this script from the python-worker directory"
    exit 1
fi

# Check if the calibration worker exists
if [ ! -f "app/calibration_worker.py" ]; then
    echo "❌ Error: app/calibration_worker.py not found"
    echo "Please make sure you're in the correct directory structure"
    exit 1
fi

# Check Python dependencies
echo "Checking dependencies..."
python3 -c "import numpy, astropy.io, tempfile" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Missing required Python packages (numpy, astropy)"
    echo "Please install dependencies: pip install numpy astropy"
    exit 1
fi

echo "✅ Dependencies OK"
echo

# Run the test suite
echo "🚀 Running stacking methods test suite..."
echo

python3 test_stacking_methods.py

# Capture exit code
exit_code=$?

echo
if [ $exit_code -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "Your stacking methods are working correctly."
else
    echo "❌ SOME TESTS FAILED!"
    echo "Please check the output above for details."
fi

echo
echo "Test complete. Exit code: $exit_code"
exit $exit_code 