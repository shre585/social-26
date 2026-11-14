import os
import re
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from backend.config import settings
from backend.utils.file_utils import (
    run_subprocess,
    seconds_to_srt_time,
    get_output_dir
)
from backend.services.platform_formatter import PLATFORM_SPECS

def detect_scenes(video_path: Path) -> List[float]:
    """
    Detect video scene cuts using FFmpeg scene filter.
    Returns sorted list of scene change timestamps in seconds, deduplicated within 1s.
    """
    cmd = [
        settings.FFMPEG_BIN,
        "-i", str(video_path),
        "-vf", "fps=2,scale=320:-2,select='gt(scene,0.35)',showinfo",
        "-f", "null",
        "-"
    ]
    code, stdout, stderr = run_subprocess(cmd, timeout=120)
    
    # Parse showinfo output from stderr
    raw_timestamps = []
    # Lines look like: [Parsed_showinfo_2 @ ...] n: ... pts_time:12.34 ...
    matches = re.findall(r"pts_time:([0-9\.]+)", stderr)
    for m in matches:
        try:
            val = float(m)
            raw_timestamps.append(val)
        except ValueError:
            pass

    # Deduplicate within 1.0 second
    deduped = []
    for ts in sorted(raw_timestamps):
        if not deduped or (ts - deduped[-1]) >= 1.0:
            deduped.append(round(ts, 2))

    return deduped

def clamp(val: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, val))

def validate_and_rank(
    raw_topics: List[Dict[str, Any]],
    segments: List[Dict[str, Any]],
    total_duration: float,
    scenes: List[float],
    min_clip_seconds: int = 15,
    max_clip_seconds: int = 60,
    max_clips: int = 5
) -> List[Dict[str, Any]]:
    """
    Validate LLM-suggested timestamps against real transcript segment boundaries,
    calculate energy and visual scene boost, score, remove overlapping clips,
    and rank the best clips.
    """
    if total_duration <= 0:
        total_duration = segments[-1]["end"] if segments else 60.0

    # Collect segment boundary timestamps
    seg_starts = [s["start"] for s in segments]
    seg_ends = [s["end"] for s in segments]

    candidates = []

    for t in raw_topics:
        raw_start = float(t.get("start", 0.0))
        raw_end = float(t.get("end", raw_start + 30.0))

        # 1. Clamp to [0, duration]
        start = clamp(raw_start, 0.0, total_duration)
        end = clamp(raw_end, 0.0, total_duration)

        # 2. Snap start to nearest transcript segment boundary within 8s
        best_start = start
        min_start_diff = 8.0
        for b in seg_starts:
            diff = abs(b - start)
            if diff <= min_start_diff:
                min_start_diff = diff
                best_start = b
        start = best_start

        # 3. Snap end to nearest transcript segment boundary within 8s
        best_end = end
        min_end_diff = 8.0
        for b in seg_ends:
            diff = abs(b - end)
            if diff <= min_end_diff and b > start:
                min_end_diff = diff
                best_end = b
        end = best_end

        # 4. Enforce min/max clip length using segment ends
        cur_dur = end - start
        if cur_dur > max_clip_seconds:
            # Pick the largest segment boundary <= max_clip_seconds
            valid_ends = [b for b in seg_ends if b > start and (b - start) <= max_clip_seconds]
            if valid_ends:
                end = max(valid_ends)
            else:
                end = min(total_duration, round(start + max_clip_seconds, 2))

        cur_dur = end - start
        if cur_dur < min_clip_seconds and (start + min_clip_seconds) <= total_duration:
            # Lengthen using later segment ends
            valid_ends = [b for b in seg_ends if (b - start) >= min_clip_seconds and (b - start) <= max_clip_seconds]
            if valid_ends:
                end = min(valid_ends)
            else:
                end = min(total_duration, round(start + min_clip_seconds, 2))

        dur = round(end - start, 2)
        # Drop < 3s clips
        if dur < 3.0:
            continue

        # 5. Calculate words per second (Energy)
        clip_words = []
        for s in segments:
            if s["end"] >= start and s["start"] <= end:
                clip_words.extend(s["text"].split())
        words_per_sec = len(clip_words) / max(1.0, dur)
        energy = clamp((words_per_sec - 1.2) / 2.0)

        # 6. Scene boost
        # scene_boost = 1.0 if a scene change within 3s of start else min(1, scenes_inside/4) * 0.7
        scenes_inside = sum(1 for sc in scenes if start <= sc <= end)
        has_start_scene = any(abs(sc - start) <= 3.0 for sc in scenes)
        scene_boost = 1.0 if has_start_scene else (min(1.0, scenes_inside / 4.0) * 0.7)

        # 7. Overall ranking score
        # score = 0.65*importance + 0.20*energy + 0.15*scene_boost
        importance = float(t.get("importance", 0.8))
        score = round((0.65 * importance) + (0.20 * energy) + (0.15 * scene_boost), 3)

        candidates.append({
            "topic": t.get("topic", "Key Insight"),
            "start": round(start, 2),
            "end": round(end, 2),
            "duration": dur,
            "importance": importance,
            "energy": round(energy, 2),
            "scene_boost": round(scene_boost, 2),
            "score": score,
            "title": t.get("title", "Key Highlight"),
            "hook": t.get("hook", ""),
            "caption": t.get("caption", ""),
            "hashtags": t.get("hashtags", []),
            "keywords": t.get("keywords", []),
            "key_points": t.get("key_points", [])
        })

    # Sort candidates by score descending
    candidates.sort(key=lambda c: c["score"], reverse=True)

    # 8. Remove overlapping clips (>30% of shorter clip overlap)
    selected = []
    for cand in candidates:
        overlap = False
        for s in selected:
            # Overlap interval: [max(cand.start, s.start), min(cand.end, s.end)]
            overlap_start = max(cand["start"], s["start"])
            overlap_end = min(cand["end"], s["end"])
            if overlap_end > overlap_start:
                overlap_dur = overlap_end - overlap_start
                shorter_dur = min(cand["duration"], s["duration"])
                if overlap_dur > (0.30 * shorter_dur):
                    overlap = True
                    break
        if not overlap:
            selected.append(cand)
        if len(selected) >= max_clips:
            break

    # If nothing passed filter, fallback to first segment
    if not selected and segments:
        first_dur = min(float(max_clip_seconds), total_duration)
        selected.append({
            "topic": "Overview",
            "start": 0.0,
            "end": round(first_dur, 2),
            "duration": round(first_dur, 2),
            "importance": 0.85,
            "energy": 0.5,
            "scene_boost": 0.5,
            "score": 0.75,
            "title": "Highlight Reel",
            "hook": "Here is the key takeaway:",
            "caption": "Essential breakdown of the main concepts.",
            "hashtags": ["#Tech", "#Tutorial"],
            "keywords": ["concepts", "highlight"],
            "key_points": ["Comprehensive overview of the core principles"]
        })

    # Sort selected by chronological start time
    selected.sort(key=lambda c: c["start"])

    # Assign IDs
    for idx, c in enumerate(selected, 1):
        c["id"] = f"clip_{idx}"

    return selected

def generate_clip_srt(
    clip_start: float,
    clip_end: float,
    segments: List[Dict[str, Any]],
    output_srt_path: Path
) -> str:
    """Generate localized SubRip SRT file with timestamps offset relative to clip start."""
    lines = []
    idx = 1
    clip_dur = clip_end - clip_start

    for seg in segments:
        if seg["end"] > clip_start and seg["start"] < clip_end:
            local_start = max(0.0, seg["start"] - clip_start)
            local_end = min(clip_dur, seg["end"] - clip_start)
            if local_end > local_start:
                lines.append(f"{idx}")
                lines.append(f"{seconds_to_srt_time(local_start)} --> {seconds_to_srt_time(local_end)}")
                lines.append(seg["text"])
                lines.append("")
                idx += 1

    srt_content = "\n".join(lines)
    output_srt_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    return srt_content

def render_thumbnail(
    source_media: Path,
    timestamp: float,
    output_thumb_path: Path,
    width: int = 1080,
    height: int = 1920
) -> bool:
    """Extract a crisp preview thumbnail using FFmpeg."""
    output_thumb_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-ss", f"{timestamp:.2f}",
        "-i", str(source_media),
        "-vframes", "1",
        "-q:v", "2",
        str(output_thumb_path)
    ]
    code, _, _ = run_subprocess(cmd, timeout=30)
    return code == 0 and output_thumb_path.exists()

def render_video_clip_for_platform(
    input_video: Path,
    start: float,
    end: float,
    platform_id: str,
    output_path: Path,
    reframe_mode: str = "blur",
    source_width: int = 1920,
    source_height: int = 1080
) -> Tuple[bool, Optional[str], bool]:
    """
    Render video clip with FFmpeg:
    - -ss before -i for fast, accurate seeking
    - libx264 veryfast crf23 yuv420p, aac audio, +faststart
    - Reframe 'blur': blurred scaled background + centered foreground overlay
    - Reframe 'crop': scale increase + crop
    - Trim to platform max seconds if duration exceeds platform limit
    Returns (success, error_message, is_trimmed).
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    spec = PLATFORM_SPECS.get(platform_id, PLATFORM_SPECS["instagram"])
    target_w = spec["width"]
    target_h = spec["height"]
    max_seconds = spec["max_seconds"]

    req_duration = end - start
    is_trimmed = False
    if req_duration > max_seconds:
        render_duration = float(max_seconds)
        is_trimmed = True
    else:
        render_duration = req_duration

    # Aspect ratios
    src_aspect = source_width / max(1, source_height)
    target_aspect = target_w / max(1, target_h)
    aspect_diff = abs(src_aspect - target_aspect)

    # Filter graph construction
    if aspect_diff < 0.05:
        # Source aspect already matches target aspect (e.g. 16:9 to 16:9)
        filter_str = f"scale={target_w}:{target_h}"
    elif reframe_mode == "crop":
        # Scale increase then crop center
        filter_str = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h}"
    else:
        # Blur background + centered sharp foreground
        filter_str = (
            f"[0:v]split=2[bg_in][fg_in];"
            f"[bg_in]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,crop={target_w}:{target_h},boxblur=20:5[bg];"
            f"[fg_in]scale={target_w}:-2:force_original_aspect_ratio=decrease[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]"
        )

    cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-ss", f"{start:.3f}",
        "-t", f"{render_duration:.3f}",
        "-i", str(input_video),
    ]

    if "split=2" in filter_str:
        cmd.extend(["-filter_complex", filter_str, "-map", "[outv]", "-map", "0:a?"])
    else:
        cmd.extend(["-vf", filter_str, "-map", "0:v", "-map", "0:a?"])

    cmd.extend([
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path)
    ])

    code, stdout, stderr = run_subprocess(cmd, timeout=300)
    if code != 0 or not output_path.exists():
        return False, f"FFmpeg render error: {stderr[:300]}", is_trimmed

    return True, None, is_trimmed

def render_audio_clip_and_audiogram(
    input_audio: Path,
    start: float,
    end: float,
    platform_id: str,
    output_mp3_path: Path,
    output_video_path: Path
) -> Tuple[bool, Optional[str]]:
    """
    Render audio mode clips:
    1. Trimmed mp3 clip
    2. Animated waveform video (FFmpeg showwaves) tailored to platform dimensions
    """
    output_mp3_path.parent.mkdir(parents=True, exist_ok=True)
    output_video_path.parent.mkdir(parents=True, exist_ok=True)
    spec = PLATFORM_SPECS.get(platform_id, PLATFORM_SPECS["instagram"])
    target_w = spec["width"]
    target_h = spec["height"]
    duration = end - start

    # 1. MP3 clip
    mp3_cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-ss", f"{start:.3f}",
        "-t", f"{duration:.3f}",
        "-i", str(input_audio),
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        str(output_mp3_path)
    ]
    run_subprocess(mp3_cmd, timeout=60)

    # 2. Waveform video with brand mocha/caramel color scheme
    # Using showwaves with mocha background and caramel waves
    wave_filter = (
        f"color=c=0x2A1810:s={target_w}x{target_h}:d={duration:.2f}[bg];"
        f"[0:a]showwaves=s={target_w}x300:mode=line:colors=0xC98B5B[wave];"
        f"[bg][wave]overlay=0:(H-h)/2[outv]"
    )
    video_cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-ss", f"{start:.3f}",
        "-t", f"{duration:.3f}",
        "-i", str(input_audio),
        "-filter_complex", wave_filter,
        "-map", "[outv]",
        "-map", "0:a",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_video_path)
    ]
    code, _, stderr = run_subprocess(video_cmd, timeout=180)
    if code != 0 or not output_video_path.exists():
        return False, f"Audiogram render error: {stderr[:200]}"

    return True, None
