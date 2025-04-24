#!/bin/bash

# Kill any existing processes on ports 3000 and 8001
echo "Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
sleep 2

# Function to handle cleanup on script exit
cleanup() {
    echo "Shutting down servers..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

# Start Python worker
echo "Starting Python worker..."
cd python-worker/app
python3 -m uvicorn main:app --reload --port 8001 --reload-dir . &
PYTHON_PID=$!

# Wait for Python worker to start
sleep 2

# Start Next.js development server
echo "Starting Next.js development server..."
cd ../..
npx next dev -p 3000 &
NEXT_PID=$!

# Wait for both processes
wait $PYTHON_PID $NEXT_PID 