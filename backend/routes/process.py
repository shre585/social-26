from fastapi import APIRouter, BackgroundTasks, HTTPException
from backend.models.schemas import ProcessRequest
from backend.utils.file_utils import validate_job_id_str, load_job, save_job
from backend.services.pipeline import run_pipeline

router = APIRouter(prefix="/api", tags=["process"])

@router.post("/process")
async def trigger_process(req: ProcessRequest, background_tasks: BackgroundTasks):
    """Trigger the multi-stage AI repurposing pipeline in the background."""
    job_id = validate_job_id_str(req.job_id)
    job = load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.get("status") == "processing":
        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Job is already being processed."
        }

    job["status"] = "processing"
    job["stage"] = "queued"
    job["progress"] = 5
    job["message"] = "Processing queued..."
    save_job(job_id, job)

    background_tasks.add_task(
        run_pipeline,
        job_id=job_id,
        platforms=req.platforms,
        purpose=getattr(req, "purpose", "general"),
        tone=req.tone,
        language=req.language,
        max_clips=req.max_clips,
        min_clip_seconds=req.min_clip_seconds,
        max_clip_seconds=req.max_clip_seconds,
        reframe=req.reframe
    )

    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Pipeline initiated successfully."
    }

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Poll pipeline progress, stage, and state."""
    job_id = validate_job_id_str(job_id)
    job = load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_id": job["job_id"],
        "status": job.get("status", "pending"),
        "stage": job.get("stage", "uploaded"),
        "progress": job.get("progress", 0),
        "message": job.get("message", ""),
        "warning": job.get("warning"),
        "error": job.get("error")
    }
