#!/bin/bash

# AgroSynapse Start Script - Robust Version

echo "🚀 Initializing AgroSynapse Platform..."

# 1. Cleanup existing processes
echo "🧹 Checking for existing processes on ports 8000 and 3000..."
LSOF_8000=$(lsof -t -i:8000)
if [ ! -z "$LSOF_8000" ]; then
    echo "Stopping existing backend (PID: $LSOF_8000)..."
    kill -9 $LSOF_8000
fi

LSOF_3000=$(lsof -t -i:3000)
if [ ! -z "$LSOF_3000" ]; then
    echo "Stopping existing frontend (PID: $LSOF_3000)..."
    kill -9 $LSOF_3000
fi

# 2. Start Backend
echo "🐍 Starting Backend (FastAPI)..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "⚠️ Warning: venv not found. Attempting to use global python."
fi

# Ensure directories exist
mkdir -p uploads results sample_data

# Start uvicorn in background
uvicorn main:app --port 8000 &
BACKEND_PID=$!

# 3. Start Frontend
echo "⚛️ Starting Frontend (React/Vite)..."
cd ../frontend
# Start vite in background
npm run dev -- --port 3000 &
FRONTEND_PID=$!

echo "------------------------------------------------"
echo "✅ Systems are launching!"
echo "📡 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop all servers."

# Handle termination
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Stopping servers...'; exit" INT
wait
