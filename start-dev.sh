#!/bin/bash

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    # Use more specific process identification and wait for graceful shutdown
    pkill -f "next dev" || true
    pkill -f "uvicorn app.main:app" || true
    sleep 2
    # Only force kill if processes are still running
    if pgrep -f "next dev" > /dev/null; then
        pkill -9 -f "next dev" || true
    fi
    if pgrep -f "uvicorn app.main:app" > /dev/null; then
        pkill -9 -f "uvicorn app.main:app" || true
    fi
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Clear any existing processes and ports
echo "Cleaning up existing processes..."
pkill -f "next dev" || true
pkill -f "uvicorn app.main:app" || true
sleep 2
if pgrep -f "next dev" > /dev/null; then
    pkill -9 -f "next dev" || true
fi
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    pkill -9 -f "uvicorn app.main:app" || true
fi

# Start Next.js development server
echo "Starting Next.js development server..."
PORT=3000 npx next dev &

# Start Python worker server
echo "Starting Python worker server..."
cd python-worker
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)
# Run uvicorn in the background and capture its PID
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
UVICORN_PID=$!

# Wait for both servers to start
sleep 5

# Check if servers are running
if ! pgrep -f "next dev" > /dev/null; then
    echo "Error: Next.js server failed to start"
    cleanup
    exit 1
fi

if ! pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "Error: Python worker server failed to start"
    cleanup
    exit 1
fi

echo "Servers started successfully"
echo "Next.js running on http://localhost:3000"
echo "Python worker running on http://localhost:8000"

# Wait for all background processes
wait 