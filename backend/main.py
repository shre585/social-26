import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.routes import upload, process, results
from backend.routes.settings import router as settings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("repurposer")

app = FastAPI(
    title="Social Media Repurposer API",
    description="Turn any lecture, video, audio, or document into platform-ready viral content.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files mount for generated video/audio/subtitles (supports HTTP 206 Range seeking)
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(settings.OUTPUT_DIR)), name="files")

# Include Routers
app.include_router(upload.router)
app.include_router(process.router)
app.include_router(results.router)
app.include_router(settings_router)

@app.get("/")
async def root():
    return {
        "app": "Social Media Repurposer",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
