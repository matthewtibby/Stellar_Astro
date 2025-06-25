"""
Test script for histogram analysis API endpoint.
"""

import requests
import json
import time

def test_histogram_analysis_api():
    """Test the histogram analysis API endpoint."""
    
    # API endpoint
    url = "http://localhost:8000/histograms/analyze"
    
    # Test payload with sample data
    payload = {
        "fits_paths": ["test_bias_frame.fits", "test_dark_frame.fits", "test_flat_frame.fits"],
        "bucket": "fits-files",
        "project_id": "test-project-id",
        "user_id": "test-user-id",
        "frame_type": "bias"  # Can be None for auto-detection
    }
    
    try:
        # Send request
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Histogram analysis API test successful!")
            print(f"   Job ID: {result.get('job_id')}")
            print(f"   Status: {result.get('status')}")
            print(f"   Message: {result.get('message')}")
            
            # Poll for completion (in real usage, frontend would do this)
            job_id = result.get('job_id')
            if job_id:
                print(f"\n📊 Polling for job completion...")
                for i in range(30):  # Wait up to 30 seconds
                    time.sleep(1)
                    status_response = requests.get(f"http://localhost:8000/jobs/status?job_id={job_id}")
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        print(f"   Progress: {status_data.get('progress', 0)}%")
                        
                        if status_data.get('status') == 'success':
                            print(f"✅ Histogram analysis completed!")
                            
                            # Get results
                            results_response = requests.get(f"http://localhost:8000/jobs/results?job_id={job_id}")
                            if results_response.status_code == 200:
                                results_data = results_response.json()
                                print_histogram_results(results_data)
                            break
                        elif status_data.get('status') == 'failed':
                            print(f"❌ Histogram analysis failed: {status_data.get('error')}")
                            break
                else:
                    print(f"⏰ Timeout waiting for job completion")
            
            return True
        else:
            print(f"❌ Histogram analysis API test failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Could not connect to API (server may not be running)")
        print("   This is expected if the FastAPI server isn't started")
        return None
    except Exception as e:
        print(f"❌ Histogram analysis API test error: {e}")
        return False

def print_histogram_results(results_data):
    """Print formatted histogram analysis results."""
    print(f"\n📊 Histogram Analysis Results:")
    print(f"=" * 50)
    
    result = results_data.get('result', {})
    analysis_results = result.get('analysis_results', {})
    summary = result.get('summary', {})
    
    # Print summary
    print(f"\n📋 Summary:")
    print(f"   Message: {summary.get('message', 'N/A')}")
    print(f"   Quality Status: {summary.get('quality_status', 'N/A')}")
    print(f"   Overall Score: {summary.get('score', 0)}/10")
    
    frame_breakdown = summary.get('frame_breakdown', {})
    print(f"   Total Frames: {frame_breakdown.get('total', 0)}")
    print(f"   High Quality: {frame_breakdown.get('high_quality', 0)}")
    print(f"   Poor Quality: {frame_breakdown.get('poor_quality', 0)}")
    print(f"   Need Pedestal: {frame_breakdown.get('requiring_pedestal', 0)}")
    print(f"   With Clipping: {frame_breakdown.get('with_clipping', 0)}")
    
    # Print recommendations
    recommendations = summary.get('recommendations', [])
    if recommendations:
        print(f"\n💡 Key Recommendations:")
        for i, rec in enumerate(recommendations[:5], 1):
            print(f"   {i}. {rec}")
    
    # Print frame results summary
    frame_results = analysis_results.get('frame_results', [])
    if frame_results:
        print(f"\n📁 Individual Frame Results:")
        for frame in frame_results[:3]:  # Show first 3 frames
            frame_path = frame.get('frame_path', 'Unknown')
            frame_type = frame.get('frame_type', 'Unknown')
            score = frame.get('histogram_score', 0)
            distribution = frame.get('distribution_type', 'Unknown')
            
            print(f"   📄 {frame_path.split('/')[-1]}")
            print(f"      Type: {frame_type} | Score: {score:.1f}/10 | Distribution: {distribution}")
            
            issues = frame.get('issues_detected', [])
            if issues:
                print(f"      Issues: {', '.join(issues[:2])}")
            
            if frame.get('requires_pedestal', False):
                pedestal = frame.get('recommended_pedestal', 0)
                print(f"      ⚡ Pedestal needed: {pedestal:.0f} DN")
    
    print(f"\n" + "=" * 50)

def test_local_histogram_analysis():
    """Test histogram analysis with local files (if available)."""
    try:
        from histogram_analysis import analyze_calibration_frame_histograms
        
        # Test with sample files (adjust paths as needed)
        test_files = [
            "sample_data/bias_frame.fits",
            "sample_data/dark_frame.fits", 
            "sample_data/flat_frame.fits"
        ]
        
        print(f"🧪 Testing local histogram analysis...")
        results = analyze_calibration_frame_histograms(test_files)
        
        print(f"✅ Local analysis completed!")
        print(f"   Total frames: {results['summary']['total_frames']}")
        print(f"   Average score: {results['summary']['average_score']:.1f}")
        print(f"   Recommendation: {results['summary']['overall_recommendation']}")
        
        return True
        
    except ImportError:
        print("⚠️  histogram_analysis module not available for local testing")
        return False
    except Exception as e:
        print(f"❌ Local histogram analysis test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Histogram Analysis Functionality...")
    print("=" * 60)
    
    # Test API endpoint
    print("\n1. Testing API Endpoint:")
    api_result = test_histogram_analysis_api()
    
    # Test local analysis
    print("\n2. Testing Local Analysis:")
    local_result = test_local_histogram_analysis()
    
    print(f"\n📊 Test Summary:")
    print(f"   API Test: {'✅ Passed' if api_result else '❌ Failed' if api_result is False else '⚠️ Skipped'}")
    print(f"   Local Test: {'✅ Passed' if local_result else '❌ Failed'}") 