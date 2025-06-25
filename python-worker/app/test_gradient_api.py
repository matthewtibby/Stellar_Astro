"""
Simple API test for gradient analysis endpoint.
"""

import requests
import json
import time

def test_gradient_analysis_api():
    """Test the gradient analysis API endpoint."""
    
    # API endpoint
    url = "http://localhost:8000/gradients/analyze"
    
    # Test payload with sample data
    payload = {
        "fits_paths": ["test_dark_frame.fits", "test_flat_frame.fits"],
        "bucket": "fits-files",
        "project_id": "test-project-id",
        "user_id": "test-user-id",
        "frame_type": None  # Auto-detect
    }
    
    try:
        # Send request
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Gradient analysis API test successful!")
            print(f"   Job ID: {result.get('job_id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Message: {result.get('message')}")
            print(f"   Analysis Type: {result.get('analysis_type')}")
            return True
        else:
            print(f"❌ API test failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Could not connect to API (server may not be running)")
        print("   This is expected if the FastAPI server isn't started")
        return None
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Gradient Analysis API...")
    print("\n📋 Industry Standard Clarification:")
    print("   ✅ Calibration Stage: Detection and validation (this API)")
    print("   ✅ Post-Processing: Gradient correction (GraXpert, Siril, etc.)")
    print("   ❌ We do NOT do gradient correction at calibration stage")
    print()
    test_gradient_analysis_api() 