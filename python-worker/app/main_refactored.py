"""
Refactored main.py - EXAMPLE of what the final structure would look like
This demonstrates how main.py would be simplified after full router extraction
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[2]))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routers
from .routers import health, calibration, analysis, cosmic_rays, frames, files, superdark
from .services import calibration_service, cosmic_ray_service, analysis_service, file_service, superdark_service
from .db import init_db

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await init_db()
    except Exception as e:
        print(f"Database initialization failed: {e}. Using in-memory storage.")
    yield
    # Shutdown
    print("Shutting down gracefully...")

# Create FastAPI app
app = FastAPI(
    title="Stellar Astro Calibration API",
    description="Refactored API for astrophotography calibration processing",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(health.router)           # /health, /test
app.include_router(calibration.router)      # /jobs/*
app.include_router(analysis.router)         # /histograms/*, /gradients/*
app.include_router(cosmic_rays.router)      # /cosmic-rays/*
app.include_router(frames.router)           # /outliers/*, /consistency/*, /trails/*
app.include_router(files.router)            # /list-files, /preview-fits, /validate-fits
app.include_router(superdark.router)        # /superdark/*

@app.get("/")
async def root():
    return {
        "message": "Stellar Astro Calibration API - Refactored",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "jobs": "/jobs",
            "analysis": "/histograms, /gradients", 
            "cosmic_rays": "/cosmic-rays",
            "frames": "/outliers, /consistency, /trails",
            "files": "/list-files, /preview-fits, /validate-fits",
            "superdark": "/superdark"
        }
    }

# The main.py file is now ~80 lines instead of 3,147 lines!
# Each router handles its own specific domain
# Service layer handles business logic
# Models are centralized and reusable 