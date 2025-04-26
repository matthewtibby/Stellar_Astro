#!/bin/bash

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down servers..."
    pkill -f "node.*next" || true
    # Ensure ports are cleared
    lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Clear any existing processes and ports
cleanup

# Start Next.js development server
echo "Starting Next.js development server..."
PORT=3000 npx next dev 