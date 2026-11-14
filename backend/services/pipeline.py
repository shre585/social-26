import asyncio
import datetime
import traceback
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.utils.file_utils import (
    load_job,
    save_job,
    get_job_dir,
    get_output_dir
)
from backend.services.transcription import (
    probe_media,
    extract_audio,
    transcribe_audio
)
from backend.services.pdf_processor import extract_pdf_text, extract_docx_text, document_to_segments
from backend.services.text_processor import extract_raw_text, text_to_segments
from backend.services.llm_analysis import analyze_transcript
from backend.services.clip_generator import (
    detect_scenes,
    validate_and_rank,
    generate_clip_srt,
    render_thumbnail,
    render_video_clip_for_platform,
    render_audio_clip_and_audiogram
)
from backend.services.platform_formatter import (
    PLATFORM_SPECS,
    compose_post
)
from backend.services.content_generator import (
    build_carousel_slides,
    generate_extras
)

job_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_JOBS)

def update_job_progress(job_id: str, stage: str, progress: int, message: str, **kwargs):
    """Update job state on disk atomically."""
    job = load_job(job_id)
    if not job:
        return
    job["stage"] = stage
    job["progress"] = progress
    job["message"] = message
    job["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    for k, v in kwargs.items():
        job[k] = v
    save_job(job_id, job)

async def run_pipeline(
    job_id: str,
    platforms: List[str],
    purpose: str = "general",
    tone: str = "educational",
    language: str = "english",
    max_clips: int = 5,
    min_clip_seconds: int = 15,
    max_clip_seconds: int = 60,
    reframe: str = "blur"
):
    """Main orchestration pipeline executed in background."""
    async with job_semaphore:
        try:
            job = load_job(job_id)
            if not job:
                return

            update_job_progress(job_id, "initializing", 5, "Initializing processing pipeline...", status="processing")

            kind = job.get("kind", "video")
            file_path = Path(job.get("filepath", ""))
            job_out_dir = get_output_dir(job_id)
            job_out_dir.mkdir(parents=True, exist_ok=True)

            segments: List[Dict[str, Any]] = []
            detected_lang = language
            total_duration = 0.0
            scenes: List[float] = []
            video_meta = {}

            # STEP 1: EXTRACT / READ
            if kind in {"video", "audio"}:
                update_job_progress(job_id, "extract", 15, "Inspecting media and extracting clean audio...")
                video_meta = probe_media(file_path)
                total_duration = video_meta.get("duration", 0.0)
                wav_path = job_out_dir / "audio_extracted.wav"
                
                # Extract 16kHz mono WAV for Whisper
                if not extract_audio(file_path, wav_path):
                    # If ffmpeg extraction failed, try using input directly if already wav/audio
                    wav_path = file_path

                # STEP 2: TRANSCRIBE
                update_job_progress(job_id, "transcribe", 30, "Transcribing speech to text with timestamps...")
                segments, detected_lang = transcribe_audio(wav_path)
                if not segments:
                    raise Exception("Audio transcription yielded no speech segments.")

            elif kind == "document":
                update_job_progress(job_id, "extract", 20, "Extracting text structure from document...")
                ext = file_path.suffix.lower()
                if ext == ".pdf":
                    doc_text = extract_pdf_text(file_path)
                else:
                    doc_text = extract_docx_text(file_path)
                
                update_job_progress(job_id, "transcribe", 35, "Parsing document concepts and paragraphs...")
                segments = document_to_segments(doc_text)
                total_duration = segments[-1]["end"] if segments else 60.0

            elif kind == "text":
                update_job_progress(job_id, "extract", 20, "Reading plaintext content...")
                doc_text = extract_raw_text(file_path)
                update_job_progress(job_id, "transcribe", 35, "Parsing text key sections...")
                segments = text_to_segments(doc_text)
                total_duration = segments[-1]["end"] if segments else 60.0

            # STEP 3: ANALYZE TRANSCRIPT VIA LLM / HEURISTICS
            update_job_progress(job_id, "analyze", 45, f"Analyzing key topics and hooks ({purpose.upper()} mode) using {settings.active_llm_provider.upper()}...")
            analysis, warning = await analyze_transcript(
                segments=segments,
                purpose=purpose,
                tone=tone,
                language=language,
                min_clip_seconds=min_clip_seconds,
                max_clip_seconds=max_clip_seconds,
                max_clips=max_clips
            )
            raw_topics = analysis.get("topics", [])
            summary = analysis.get("summary", "Automated content breakdown.")
            keywords = analysis.get("keywords", ["Tech", "Tutorial"])

            # STEP 4: DETECT SCENES (Video only)
            if kind == "video":
                update_job_progress(job_id, "scenes", 60, "Detecting visual scene boundaries with FFmpeg...")
                scenes = detect_scenes(file_path)

            # STEP 5: VALIDATE & RANK CLIPS
            update_job_progress(job_id, "clips", 70, "Validating boundaries & ranking highest-impact clips...")
            validated_clips = validate_and_rank(
                raw_topics=raw_topics,
                segments=segments,
                total_duration=total_duration,
                scenes=scenes,
                min_clip_seconds=min_clip_seconds,
                max_clip_seconds=max_clip_seconds,
                max_clips=max_clips
            )

            # STEP 6: RENDER CLIPS & MEDIA PER PLATFORM
            update_job_progress(job_id, "rendering", 80, "Rendering platform-tailored media (video/audio/subtitles)...")
            final_clips = []

            for clip_idx, c in enumerate(validated_clips, 1):
                cid = c["id"]
                clip_folder = job_out_dir / cid
                clip_folder.mkdir(parents=True, exist_ok=True)

                # Subtitles SRT
                srt_path = clip_folder / "captions.srt"
                generate_clip_srt(c["start"], c["end"], segments, srt_path)
                srt_url = f"/files/{job_id}/{cid}/captions.srt"

                # Thumbnail
                thumb_path = clip_folder / "thumbnail.jpg"
                thumb_time = min(total_duration, c["start"] + 1.5)
                thumb_ok = render_thumbnail(file_path, thumb_time, thumb_path)
                thumb_url = f"/files/{job_id}/{cid}/thumbnail.jpg" if thumb_ok else None

                # Carousel slides
                slides = build_carousel_slides(
                    title=c["title"],
                    hook=c["hook"],
                    key_points=c["key_points"],
                    keywords=c["keywords"]
                )

                # Audio-only mp3 clip
                audio_clip_url = None
                if kind == "audio":
                    mp3_path = clip_folder / "clip.mp3"
                    audio_clip_url = f"/files/{job_id}/{cid}/clip.mp3"

                # Platforms media and content map
                platforms_map = {}
                for pid in platforms:
                    spec = PLATFORM_SPECS.get(pid, PLATFORM_SPECS["instagram"])
                    
                    # Generate platform copy
                    content_dict = compose_post(
                        platform_id=pid,
                        title=c["title"],
                        caption=c["caption"],
                        hashtags=c["hashtags"],
                        tone=tone
                    )

                    media_info = None

                    # If Video mode: render video clip
                    if kind == "video":
                        out_vid_name = f"clip_{pid}.mp4"
                        out_vid_path = clip_folder / out_vid_name
                        success, err, is_trimmed = render_video_clip_for_platform(
                            input_video=file_path,
                            start=c["start"],
                            end=c["end"],
                            platform_id=pid,
                            output_path=out_vid_path,
                            reframe_mode=reframe,
                            source_width=video_meta.get("width", 1920),
                            source_height=video_meta.get("height", 1080)
                        )
                        if success:
                            media_info = {
                                "url": f"/files/{job_id}/{cid}/{out_vid_name}",
                                "download": f"/api/download/{job_id}/{cid}/{out_vid_name}",
                                "type": "video/mp4",
                                "width": spec["width"],
                                "height": spec["height"],
                                "duration": min(c["duration"], float(spec["max_seconds"])),
                                "trimmed": is_trimmed,
                                "error": None
                            }
                        else:
                            media_info = {
                                "url": "",
                                "download": "",
                                "type": "video/mp4",
                                "width": spec["width"],
                                "height": spec["height"],
                                "duration": c["duration"],
                                "trimmed": False,
                                "error": err
                            }

                    # If Audio mode: render audiogram waveform video
                    elif kind == "audio":
                        out_vid_name = f"audiogram_{pid}.mp4"
                        out_vid_path = clip_folder / out_vid_name
                        mp3_clip_path = clip_folder / "clip.mp3"
                        success, err = render_audio_clip_and_audiogram(
                            input_audio=file_path,
                            start=c["start"],
                            end=c["end"],
                            platform_id=pid,
                            output_mp3_path=mp3_clip_path,
                            output_video_path=out_vid_path
                        )
                        if success:
                            media_info = {
                                "url": f"/files/{job_id}/{cid}/{out_vid_name}",
                                "download": f"/api/download/{job_id}/{cid}/{out_vid_name}",
                                "type": "video/mp4",
                                "width": spec["width"],
                                "height": spec["height"],
                                "duration": c["duration"],
                                "trimmed": False,
                                "error": None
                            }
                        else:
                            media_info = {
                                "url": "",
                                "download": "",
                                "type": "video/mp4",
                                "width": spec["width"],
                                "height": spec["height"],
                                "duration": c["duration"],
                                "trimmed": False,
                                "error": err
                            }

                    platforms_map[pid] = {
                        "label": spec["label"],
                        "emoji": spec["emoji"],
                        "aspect": spec["aspect"],
                        "best_time": spec["best_times"][0] if spec["best_times"] else "Daily",
                        "tip": spec["tip"],
                        "content": content_dict,
                        "media": media_info
                    }

                final_clips.append({
                    "id": cid,
                    "topic": c["topic"],
                    "title": c["title"],
                    "hook": c["hook"],
                    "keywords": c["keywords"],
                    "hashtags": c.get("hashtags", []),
                    "key_points": c["key_points"],
                    "importance": c["importance"],
                    "score": c["score"],
                    "start": c["start"],
                    "end": c["end"],
                    "duration": c["duration"],
                    "carousel": slides,
                    "thumbnail": thumb_url,
                    "srt": srt_url,
                    "audio": audio_clip_url,
                    "platforms": platforms_map
                })

            # STEP 7: GENERATE EXTRAS (BLOG, THREAD, LINKEDIN, SEO, CHAPTERS, QUIZ, HOOKS)
            update_job_progress(job_id, "content", 92, "Generating multi-channel extras & standout learning assets...")
            extras = await generate_extras(
                summary=summary,
                keywords=keywords,
                clips=final_clips,
                total_duration=total_duration,
                purpose=purpose,
                tone=tone
            )

            # STEP 8: FINALIZE
            update_job_progress(
                job_id,
                stage="finalize",
                progress=100,
                message="All platform assets ready!",
                status="completed",
                warning=warning,
                ai_provider=settings.active_llm_provider,
                summary=summary,
                keywords=keywords,
                transcript=segments,
                scenes=scenes,
                clips=final_clips,
                extras=extras,
                metadata={
                    "duration": total_duration,
                    "width": video_meta.get("width", 1920),
                    "height": video_meta.get("height", 1080),
                    "has_video": video_meta.get("has_video", kind == "video"),
                    "has_audio": video_meta.get("has_audio", True),
                    "language": detected_lang
                }
            )

        except Exception as e:
            err_msg = str(e)
            traceback.print_exc()
            update_job_progress(
                job_id,
                stage="failed",
                progress=100,
                message=f"Pipeline error: {err_msg}",
                status="failed",
                error=err_msg
            )
