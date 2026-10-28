"""
backend/run.py
Convenient runner script for the Brandguard AI FastAPI backend.

Usage:
    cd backend
    .\\venv\\Scripts\\Activate.ps1
    python run.py
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # On Render and cloud hosts, bind to 0.0.0.0; in local development, default to 127.0.0.1
    host = os.getenv("HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    reload = os.getenv("APP_ENV", "development").lower() == "development" and not os.getenv("PORT")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
    )
