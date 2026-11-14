import io
import os
import shutil
import zipfile
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from backend.config import settings
from backend.models.schemas import (
    JobRecord,
    PlatformsResponse,
    PlatformSpec,
    UpdateClipContentRequest
)
from backend.utils.file_utils import (
    validate_job_id_str,
    load_job,
    save_job,
    get_job_dir,
    get_output_dir,
    safe_join
)
from backend.services.platform_formatter import (
    PLATFORM_SPECS,
    compose_post
)

router = APIRouter(prefix="/api", tags=["results"])

@router.get("/health")
async def health_check():
    """Health endpoint returning service status, whisper config, and LLM provider."""
    return {
        "status": "ok",
        "llm_provider": settings.active_llm_provider,
        "ai_enabled": settings.is_ai_enabled,
        "whisper_model": settings.WHISPER_MODEL,
        "ffmpeg": settings.FFMPEG_BIN
    }

@router.get("/platforms", response_model=PlatformsResponse)
async def get_platforms():
    """Return all platform configurations (single source of truth) plus AI status."""
    specs = [
        PlatformSpec(
            id=v["id"],
            label=v["label"],
            emoji=v["emoji"],
            aspect=v["aspect"],
            width=v["width"],
            height=v["height"],
            max_seconds=v["max_seconds"],
            caption_limit=v.get("caption_limit"),
            title_limit=v.get("title_limit"),
            post_limit=v.get("post_limit"),
            hashtag_limit=v["hashtag_limit"],
            best_times=v["best_times"],
            tip=v["tip"]
        )
        for v in PLATFORM_SPECS.values()
    ]
    return PlatformsResponse(
        platforms=specs,
        ai_enabled=settings.is_ai_enabled,
        provider=settings.active_llm_provider
    )

@router.get("/jobs")
async def list_jobs():
    """List all created jobs with metadata, sorted by creation date."""
    jobs = []
    if settings.UPLOAD_DIR.exists():
        for job_dir in settings.UPLOAD_DIR.iterdir():
            if job_dir.is_dir() and (job_dir / "job.json").exists():
                try:
                    job = load_job(job_dir.name)
                    if job:
                        jobs.append({
                            "job_id": job.get("job_id"),
                            "filename": job.get("filename"),
                            "kind": job.get("kind"),
                            "status": job.get("status"),
                            "stage": job.get("stage"),
                            "progress": job.get("progress"),
                            "message": job.get("message"),
                            "created_at": job.get("created_at"),
                            "updated_at": job.get("updated_at"),
                            "clip_count": len(job.get("clips", []))
                        })
                except Exception:
                    continue

    jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)
    return {"jobs": jobs}

@router.get("/results/{job_id}", response_model=JobRecord)
async def get_job_results(job_id: str):
    """Retrieve full job results including clips, transcript, and generated copy."""
    job_id = validate_job_id_str(job_id)
    job = load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job

@router.delete("/results/{job_id}")
async def delete_job(job_id: str):
    """Delete all files and metadata associated with a job."""
    job_id = validate_job_id_str(job_id)
    upload_dir = settings.UPLOAD_DIR / job_id
    output_dir = settings.OUTPUT_DIR / job_id

    if upload_dir.exists():
        shutil.rmtree(upload_dir, ignore_errors=True)
    if output_dir.exists():
        shutil.rmtree(output_dir, ignore_errors=True)

    return {"message": f"Job {job_id} deleted successfully."}

@router.put("/results/{job_id}/clips/{clip_id}/{platform_id}")
async def update_clip_content(
    job_id: str,
    clip_id: str,
    platform_id: str,
    req: UpdateClipContentRequest
):
    """
    Update edited title, caption, or hashtags in the UI.
    Rebuilds platform copy server-side to enforce platform rules.
    """
    job_id = validate_job_id_str(job_id)
    job = load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    clips = job.get("clips", [])
    target_clip = next((c for c in clips if c.get("id") == clip_id), None)
    if not target_clip:
        raise HTTPException(status_code=404, detail=f"Clip {clip_id} not found.")

    platforms_map = target_clip.get("platforms", {})
    if platform_id not in platforms_map:
        raise HTTPException(status_code=404, detail=f"Platform {platform_id} not found on this clip.")

    current_data = platforms_map[platform_id]
    current_content = current_data.get("content", {})

    new_title = req.title if req.title is not None else current_content.get("title", "")
    new_caption = req.caption if req.caption is not None else current_content.get("caption", "")
    new_tags = req.hashtags if req.hashtags is not None else current_content.get("hashtags", [])

    # Rebuild composed copy
    recomposed = compose_post(
        platform_id=platform_id,
        title=new_title,
        caption=new_caption,
        hashtags=new_tags
    )

    current_data["content"] = recomposed
    save_job(job_id, job)

    return {"message": "Content updated successfully", "content": recomposed}

@router.get("/download/{job_id}/{file_path:path}")
async def download_file(job_id: str, file_path: str):
    """Securely download a specific artifact preventing directory traversal."""
    job_id = validate_job_id_str(job_id)
    out_dir = get_output_dir(job_id)
    safe_target = safe_join(out_dir, file_path)

    if not safe_target or not safe_target.is_file():
        # Check upload dir as fallback
        up_dir = get_job_dir(job_id)
        safe_target = safe_join(up_dir, file_path)

    if not safe_target or not safe_target.is_file():
        raise HTTPException(status_code=404, detail="Requested file not found.")

    return FileResponse(
        path=str(safe_target),
        filename=safe_target.name,
        media_type="application/octet-stream"
    )

@router.get("/download-all/{job_id}")
async def download_all_zip(job_id: str):
    """Package all clips, posts, blog, thread, and subtitles into a single ZIP archive."""
    job_id = validate_job_id_str(job_id)
    job = load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    out_dir = get_output_dir(job_id)
    zip_path = out_dir / f"repurposed_{job_id}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Include all generated files in output folder
        for file in out_dir.rglob("*"):
            if file.is_file() and file.name != zip_path.name:
                rel_path = file.relative_to(out_dir)
                zf.write(file, arcname=f"media/{rel_path}")

        # Add Blog markdown
        extras = job.get("extras", {})
        if extras:
            blog_md = extras.get("blog", "")
            if blog_md:
                zf.writestr("posts/blog_post.md", blog_md)

            # X Thread
            x_thread = extras.get("x_thread", [])
            if x_thread:
                zf.writestr("posts/x_twitter_thread.txt", "\n\n---\n\n".join(x_thread))

            # LinkedIn Post
            linkedin_post = extras.get("linkedin_post", "")
            if linkedin_post:
                zf.writestr("posts/linkedin_post.txt", linkedin_post)

            # YouTube chapters
            chapters = extras.get("youtube_chapters", [])
            if chapters:
                zf.writestr("posts/youtube_chapters.txt", "\n".join(chapters))

        # Add all clip platform captions as text files
        for clip in job.get("clips", []):
            cid = clip.get("id", "clip")
            for pid, pdata in clip.get("platforms", {}).items():
                content = pdata.get("content", {})
                post_text = content.get("text", "")
                zf.writestr(f"posts/{cid}_{pid}.txt", post_text)

        # Full transcript
        transcript_segs = job.get("transcript", [])
        if transcript_segs:
            t_text = "\n".join(f"[{s.get('start', 0):.2f} - {s.get('end', 0):.2f}] {s.get('text', '')}" for s in transcript_segs)
            zf.writestr("transcript.txt", t_text)

    return FileResponse(
        path=str(zip_path),
        filename=f"repurposed_{job_id}.zip",
        media_type="application/zip"
    )
