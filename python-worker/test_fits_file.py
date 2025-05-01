import sys
import os
from astropy.io import fits

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.fits_analysis import analyze_fits_headers

def analyze_fits_file(file_path: str):
    """Analyze a FITS file and print the results."""
    try:
        # Open the FITS file
        with fits.open(file_path) as hdul:
            # Get the primary header
            header = hdul[0].header
            
            # Analyze the headers
            result = analyze_fits_headers(header)
            
            # Print results
            print("\n=== FITS File Analysis Results ===")
            print(f"File: {file_path}")
            
            if result.camera_info:
                print(f"\nDetected Camera: {result.camera_info.name}")
                print(f"Camera Type: {'Color' if result.camera_info.is_color else 'Mono'}")
            
            print(f"\nDetected Type: {result.type} (confidence: {result.confidence:.1%})")
            
            if result.inferred_values:
                print("\nInferred Values:")
                for field, source in result.inferred_values.items():
                    print(f"  • {field}: {source}")
            
            if result.warnings:
                print("\nWarnings:")
                for warning in result.warnings:
                    print(f"  ⚠️ {warning}")
            
            if result.suggestions:
                print("\nSuggestions:")
                for suggestion in result.suggestions:
                    print(f"  💡 {suggestion}")
            
            print("\nMetadata Status:")
            if result.missing_metadata:
                print("  Missing Required Fields:")
                for field in result.missing_metadata:
                    description = result.required_metadata.get(field, "")
                    print(f"    • {field}: {description}")
            else:
                print("  ✅ All required metadata present")
            
            print("\nPresent Metadata:")
            for key, value in result.metadata.items():
                if value is not None:  # Only print non-None values
                    print(f"  {key}: {value}")
    
    except Exception as e:
        print(f"Error analyzing file: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_fits_file.py <path_to_fits_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    analyze_fits_file(file_path) 