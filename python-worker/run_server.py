#!/usr/bin/env python3
"""
Stellar Astro Python Worker Server
Startup script with proper module path handling
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

# Now import and run the server
if __name__ == "__main__":
    import uvicorn
    
    # Change to app directory for proper module resolution
    os.chdir(app_dir)
    
    # Import the FastAPI app
    from main import app
    
    print("�� Starting Stellar Astro Python Worker Server...")
    print("📁 Working directory:", os.getcwd())
    print("🐍 Python path includes:", sys.path[0])
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
