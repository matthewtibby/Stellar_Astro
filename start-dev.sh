#!/bin/bash

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    # Kill all Python processes that might be using port 8000
    pkill -f "uvicorn" || true
    pkill -f "python" || true
    # Kill Next.js process
    pkill -f "next dev" || true
    sleep 2
    # Force kill any remaining processes
    pkill -9 -f "uvicorn" || true
    pkill -9 -f "python" || true
    pkill -9 -f "next dev" || true
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Function to check if a port is in use
is_port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process using a port
kill_port_process() {
    local port=$1
    local pids=$(lsof -ti :$port)
    if [ ! -z "$pids" ]; then
        echo "Killing processes using port $port: $pids"
        for pid in $pids; do
            kill $pid || true
            sleep 1
            if ps -p $pid > /dev/null; then
                kill -9 $pid || true
            fi
        done
    fi
}

# Clear any existing processes and ports
echo "Cleaning up existing processes..."
kill_port_process 3000
kill_port_process 8000
sleep 2

# Verify ports are available
if is_port_in_use 8000; then
    echo "Error: Port 8000 is still in use after cleanup. Please check for other running processes."
    exit 1
fi

# Start Python worker server first
echo "Starting Python worker server..."
cd python-worker
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start uvicorn and wait for it to be ready
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
UVICORN_PID=$!

# Wait for Python server to start
echo "Waiting for Python worker to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "Python worker is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Python worker failed to start"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start Next.js development server
echo "Starting Next.js development server..."
cd ..
PORT=3000 npx next dev &
NEXT_PID=$!

# Wait for Next.js to start
echo "Waiting for Next.js to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "Next.js is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Next.js server failed to start"
        cleanup
        exit 1
    fi
    sleep 1
done

echo "Servers started successfully"
echo "Next.js running on http://localhost:3000"
echo "Python worker running on http://localhost:8000"

# Wait for all background processes
wait 