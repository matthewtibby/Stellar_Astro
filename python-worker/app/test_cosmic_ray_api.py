"""
Simple API test for cosmic ray detection endpoint.
"""

import requests
import json
import time

def test_cosmic_ray_api():
    """Test the cosmic ray detection API endpoint."""
    
    # API endpoint
    url = "http://localhost:8000/cosmic-rays/detect"
    
    # Test payload with sample data
    payload = {
        "fits_paths": ["test_light_frame.fits"],
        "bucket": "fits-files",
        "project_id": "test-project-id",
        "user_id": "test-user-id",
        "frame_type": "light",
        "method": "lacosmic",
        "sigma_clip": 4.5,
        "gain": 1.0,
        "readnoise": 6.5,
        "save_cleaned": True,
        "save_masks": True
    }
    
    try:
        # Send request
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API test successful!")
            print(f"   Job ID: {result.get('job_id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Message: {result.get('message')}")
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
    print("Testing Cosmic Ray Detection API...")
    test_cosmic_ray_api() 