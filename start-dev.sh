#!/bin/bash

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    pkill -f "node.*next" || true
    pkill -f "uvicorn" || true
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Python worker in the background
echo "Starting Python worker..."
cd python-worker
source venv/bin/activate
./run.sh &
PYTHON_PID=$!

# Wait a moment for Python server to start
sleep 2

# Start Next.js development server
echo "Starting Next.js development server..."
cd ..
npm run dev

# If Next.js server exits, cleanup Python worker
cleanup 