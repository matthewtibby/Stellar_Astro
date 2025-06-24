import json
import time
import requests

def test_patterned_noise_api():
    base_url = "http://localhost:8000"
    
    # Test request payload
    payload = {
        "input_bucket": "test-bucket",
        "input_paths": [
            "sample_data/light_frame_full.fits",
            "sample_data/flat_frame.fits",
            "sample_data/dark_frame.fits"
        ],
        "output_bucket": "test-bucket",
        "output_base": "test_output/corrected",
        "project_id": "test-project",
        "user_id": "test-user",
        "settings": {
            "method": "auto"  # Let the system auto-detect pattern type
        }
    }
    
    print("Testing patterned noise correction API endpoint...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # Submit job
    try:
        response = requests.post(f"{base_url}/patterned-noise/correct", json=payload)
        print(f"Submit response status: {response.status_code}")
        print(f"Submit response: {response.json()}")
        
        if response.status_code == 200:
            job_data = response.json()
            job_id = job_data.get("jobId")
            
            if job_id:
                print(f"Job submitted successfully: {job_id}")
                
                # Poll for job status
                for i in range(15):  # Poll up to 15 times (pattern correction can take longer)
                    time.sleep(3)
                    status_response = requests.get(f"{base_url}/jobs/status?job_id={job_id}")
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        print(f"Job status: {status_data.get('status')} - Progress: {status_data.get('progress', 0)}%")
                        
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
                    
                    # Show summary of pattern analysis
                    if 'result' in results_data and 'pattern_analysis' in results_data['result']:
                        print("\n=== Pattern Analysis Summary ===")
                        for analysis in results_data['result']['pattern_analysis']:
                            filename = analysis.get('filename', 'unknown')
                            method = analysis.get('method', 'none')
                            improvement = analysis.get('improvement_percent', 0)
                            pattern_type = analysis.get('pattern_type', 'unknown')
                            confidence = analysis.get('confidence', 0)
                            
                            print(f"{filename:20} | {method:15} | {pattern_type:10} | {confidence:.2f} conf | {improvement:5.1f}% improvement")
                        
                        overall = results_data['result'].get('overall_improvement_percent', 0)
                        methods = results_data['result'].get('methods_used', [])
                        print(f"\nOverall improvement: {overall:.1f}%")
                        print(f"Methods used: {', '.join(methods)}")
                    
                else:
                    print(f"Error getting results: {results_response.status_code}")
            else:
                print("No job ID returned")
        else:
            print(f"Error submitting job: {response.text}")
            
    except Exception as e:
        print(f"Exception during API test: {e}")

def test_manual_methods():
    """Test with manually specified correction methods."""
    base_url = "http://localhost:8000"
    
    test_cases = [
        {
            "name": "Median Filter (Manual)",
            "settings": {
                "method": "median_filter",
                "filter_size": 32,
                "preserve_stars": True
            }
        },
        {
            "name": "Fourier Filter (Manual)",
            "settings": {
                "method": "fourier_filter",
                "direction": "both",
                "strength": 0.8,
                "frequency_cutoff": 0.05
            }
        },
        {
            "name": "Combined Correction (Manual)",
            "settings": {
                "method": "combined",
                "gradient_filter_size": 64,
                "fourier_strength": 0.6
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n=== Testing {test_case['name']} ===")
        
        payload = {
            "input_bucket": "test-bucket",
            "input_paths": ["sample_data/light_frame_full.fits"],
            "output_bucket": "test-bucket", 
            "output_base": f"test_output/{test_case['name'].lower().replace(' ', '_')}",
            "project_id": "test-project",
            "user_id": "test-user",
            "settings": test_case['settings']
        }
        
        try:
            response = requests.post(f"{base_url}/patterned-noise/correct", json=payload)
            if response.status_code == 200:
                job_data = response.json()
                print(f"Job submitted: {job_data.get('jobId')}")
                # Note: Not polling for results in this quick test
            else:
                print(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    print("Testing Patterned Noise Correction API")
    print("=" * 50)
    
    # Test auto-detection mode
    test_patterned_noise_api()
    
    # Test manual methods (quick submission only)
    test_manual_methods() 