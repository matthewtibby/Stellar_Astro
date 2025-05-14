#!/bin/bash

# Activate virtual environment
source python-worker/venv/bin/activate

# Set environment variables
export PYTHONUNBUFFERED=1
export PYTHONPATH=$PYTHONPATH:$(pwd)/python-worker

# Run the worker with gunicorn for better process management
gunicorn app.main:app \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --keep-alive 30 \
    --log-level info \
    --reload 