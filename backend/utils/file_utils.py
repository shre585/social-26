import json
import os
import re
import secrets
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

try:
    from fastapi import HTTPException
except ImportError:
    class HTTPException(Exception):  # type: ignore
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

from backend.config import settings

JOB_ID_REGEX = re.compile(r"^[a-f0-9]{12}$")

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm"}
AUDIO_EXTS = {".mp3", ".wav", ".m4a"}
DOCUMENT_EXTS = {".pdf", ".docx"}
TEXT_EXTS = {".txt", ".md"}

def generate_job_id() -> str:
    """Generate a unique 12-character hex job ID."""
    return secrets.token_hex(6)

def validate_job_id_str(job_id: str) -> str:
    """Validate 12-hex job ID."""
    if not job_id or not JOB_ID_REGEX.match(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format. Must be 12 hex characters.")
    return job_id

def get_job_dir(job_id: str) -> Path:
    job_id = validate_job_id_str(job_id)
    path = settings.UPLOAD_DIR / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_output_dir(job_id: str) -> Path:
    job_id = validate_job_id_str(job_id)
    path = settings.OUTPUT_DIR / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path

def get_kind_from_filename(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext in VIDEO_EXTS:
        return "video"
    if ext in AUDIO_EXTS:
        return "audio"
    if ext in DOCUMENT_EXTS:
        return "document"
    if ext in TEXT_EXTS:
        return "text"
    raise HTTPException(status_code=415, detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(VIDEO_EXTS | AUDIO_EXTS | DOCUMENT_EXTS | TEXT_EXTS))}")

def save_job(job_id: str, data: Dict[str, Any]) -> None:
    """Save job state atomically with tmp file + rename to prevent race conditions."""
    job_dir = get_job_dir(job_id)
    job_file = job_dir / "job.json"
    tmp_file = job_dir / "job.json.tmp"

    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Atomic replace
    if tmp_file.exists():
        tmp_file.replace(job_file)

def load_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Load job record from disk."""
    job_dir = get_job_dir(job_id)
    job_file = job_dir / "job.json"
    if not job_file.exists():
        return None
    try:
        with open(job_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def safe_join(base_dir: Path, untrusted_path: str) -> Optional[Path]:
    """Prevent directory traversal attacks."""
    try:
        # Normalize paths
        base = base_dir.resolve()
        # Remove leading slashes and drive letters
        cleaned = re.sub(r"^[/\\]+", "", untrusted_path).replace("\\", "/")
        target = (base / cleaned).resolve()
        # Ensure target is within base
        if base in target.parents or target == base:
            return target
        return None
    except Exception:
        return None

def run_subprocess(cmd: list, timeout: int = 600) -> Tuple[int, str, str]:
    """Execute command safely via subprocess without shell=True."""
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
            shell=False
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -1, "", f"Command timed out after {timeout} seconds"
    except Exception as e:
        return -1, "", str(e)

def seconds_to_srt_time(seconds: float) -> str:
    """Format seconds float to HH:MM:SS,mmm for SubRip SRT files."""
    millis = int(round(seconds * 1000))
    hours = millis // 3600000
    millis %= 3600000
    minutes = millis // 60000
    millis %= 60000
    secs = millis // 1000
    millis %= 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def seconds_to_display_time(seconds: float) -> str:
    """Format seconds float to MM:SS or H:MM:SS."""
    secs = int(round(seconds))
    hours = secs // 3600
    secs %= 3600
    minutes = secs // 60
    secs %= 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
