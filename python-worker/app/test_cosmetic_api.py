import json
import time
import requests

def test_cosmetic_masking_api():
    base_url = "http://localhost:8000"
    
    # Test request payload
    payload = {
        "input_bucket": "test-bucket",
        "input_paths": [
            "sample_data/dark_frame.fits",
            "sample_data/bias_frame.fits",
            "sample_data/flat_frame.fits"
        ],
        "output_bucket": "test-bucket",
        "output_base": "test_output/masks",
        "project_id": "test-project",
        "user_id": "test-user",
        "settings": {
            "sigma": 3,
            "min_bad_fraction": 0.3
        }
    }
    
    # Note: This is a mock test since we don't have real Supabase buckets set up
    # In production, this would use actual file paths in cloud storage
    
    print("Testing cosmetic masking API endpoint...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # Submit job
    try:
        response = requests.post(f"{base_url}/cosmetic-masks/generate", json=payload)
        print(f"Submit response status: {response.status_code}")
        print(f"Submit response: {response.json()}")
        
        if response.status_code == 200:
            job_data = response.json()
            job_id = job_data.get("jobId")
            
            if job_id:
                print(f"Job submitted successfully: {job_id}")
                
                # Poll for job status
                for i in range(10):  # Poll up to 10 times
                    time.sleep(2)
                    status_response = requests.get(f"{base_url}/jobs/status?job_id={job_id}")
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        print(f"Job status: {status_data}")
                        
                        if status_data.get("status") in ["success", "failed"]:
                            break
                    else:
                        print(f"Error getting job status: {status_response.status_code}")
                        break
                
                # Get final results
                results_response = requests.get(f"{base_url}/jobs/results?job_id={job_id}")
                if results_response.status_code == 200:
                    results_data = results_response.json()
                    print(f"Final results: {json.dumps(results_data, indent=2)}")
                else:
                    print(f"Error getting results: {results_response.status_code}")
            else:
                print("No job ID returned")
        else:
            print(f"Error submitting job: {response.text}")
            
    except Exception as e:
        print(f"Exception during API test: {e}")

if __name__ == "__main__":
    test_cosmetic_masking_api() 