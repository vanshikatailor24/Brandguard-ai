"""
backend/run.py
Convenient runner script for the Brandguard AI FastAPI backend.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
