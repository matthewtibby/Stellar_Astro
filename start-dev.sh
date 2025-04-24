#!/bin/bash

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    pkill -f "node.*next" || true
    pkill -f "uvicorn" || true
    # Ensure ports are cleared
    lsof -ti:8000,8001,3000,3001 | xargs kill -9 2>/dev/null || true
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Clear any existing processes and ports
cleanup

# Start Python worker in the background
echo "Starting Python worker..."
cd python-worker
source venv/bin/activate
# Force port 8000 and prevent port changes
PORT=8000 python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
PYTHON_PID=$!

# Wait a moment for Python server to start
sleep 2

# Start Next.js development server
echo "Starting Next.js development server..."
cd ..
PORT=3000 npx next dev

# If Next.js server exits, cleanup Python worker
cleanup 