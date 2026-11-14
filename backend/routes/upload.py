import datetime
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.config import settings
from backend.models.schemas import UploadResponse, UploadUrlRequest
from backend.utils.file_utils import (
    generate_job_id,
    get_job_dir,
    save_job,
    get_kind_from_filename
)

router = APIRouter(prefix="/api", tags=["upload"])

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Stream uploaded file directly to disk with size and extension validation."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    kind = get_kind_from_filename(file.filename)
    job_id = generate_job_id()
    job_dir = get_job_dir(job_id)

    # Sanitize filename
    safe_name = Path(file.filename).name.replace(" ", "_")
    target_path = job_dir / safe_name

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    total_bytes = 0

    try:
        with open(target_path, "wb") as out_f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunk
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    out_f.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum upload limit of {settings.MAX_UPLOAD_MB}MB."
                    )
                out_f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream upload to disk: {str(e)}")

    size_mb = round(total_bytes / (1024 * 1024), 2)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    job_data = {
        "job_id": job_id,
        "kind": kind,
        "filename": safe_name,
        "filepath": str(target_path),
        "source_url": None,
        "status": "pending",
        "stage": "uploaded",
        "progress": 0,
        "message": "File uploaded successfully. Choose settings and click Repurpose.",
        "error": None,
        "warning": None,
        "ai_provider": settings.active_llm_provider,
        "created_at": now_iso,
        "updated_at": now_iso,
        "metadata": {"size_mb": size_mb},
        "transcript": [],
        "scenes": [],
        "summary": None,
        "keywords": [],
        "clips": [],
        "extras": None
    }
    save_job(job_id, job_data)

    return UploadResponse(
        job_id=job_id,
        filename=safe_name,
        kind=kind,
        size_mb=size_mb,
        message="Upload complete"
    )

@router.post("/upload-url", response_model=UploadResponse)
async def upload_from_url(req: UploadUrlRequest):
    """Download video or audio from YouTube or public URL via yt-dlp."""
    url = req.url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Invalid URL scheme. Must start with http:// or https://")

    job_id = generate_job_id()
    job_dir = get_job_dir(job_id)

    try:
        import yt_dlp
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="yt-dlp is not installed. Please install it or upload files directly."
        )

    out_template = str(job_dir / "%(title).50s.%(ext)s")

    ydl_opts = {
        "format": "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
        "outtmpl": out_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": settings.MAX_UPLOAD_MB * 1024 * 1024
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded_filename = ydl.prepare_filename(info)
            target_path = Path(downloaded_filename)
            # In case extension changed during post-processing
            if not target_path.exists():
                matching = list(job_dir.glob("*.*"))
                if matching:
                    target_path = matching[0]

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download video from URL: {str(e)}")

    if not target_path.exists():
        raise HTTPException(status_code=500, detail="Downloaded media file not found on disk.")

    size_mb = round(target_path.stat().st_size / (1024 * 1024), 2)
    kind = get_kind_from_filename(target_path.name)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    job_data = {
        "job_id": job_id,
        "kind": kind,
        "filename": target_path.name,
        "filepath": str(target_path),
        "source_url": url,
        "status": "pending",
        "stage": "uploaded",
        "progress": 0,
        "message": "URL media imported successfully.",
        "error": None,
        "warning": None,
        "ai_provider": settings.active_llm_provider,
        "created_at": now_iso,
        "updated_at": now_iso,
        "metadata": {"size_mb": size_mb, "source_url": url},
        "transcript": [],
        "scenes": [],
        "summary": None,
        "keywords": [],
        "clips": [],
        "extras": None
    }
    save_job(job_id, job_data)

    return UploadResponse(
        job_id=job_id,
        filename=target_path.name,
        kind=kind,
        size_mb=size_mb,
        message="URL downloaded successfully"
    )
