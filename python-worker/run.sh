#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server with PORT environment variable or default to 8000
uvicorn app.main:app --reload --host 0.0.0.0 --port ${PORT:-8000} 