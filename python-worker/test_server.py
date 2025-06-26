#!/usr/bin/env python3
import sys
import os
from pathlib import Path

app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))
os.chdir(app_dir)

from main import app
print("✅ Server imports successful! Python Worker is ready to run.")
print("📊 Available endpoints:")
print("  - GET  /health")
print("  - GET  /test") 
print("  - POST /validate-fits")
print("  - POST /jobs/submit")
print("  - POST /cosmic-rays/detect")
print("  - POST /histograms/analyze")
print("  - And many more...")
