import pytest
import sys

if __name__ == "__main__":
    # Run all tests in the tests/ directory
    exit_code = pytest.main(["tests/"])
    sys.exit(exit_code) 