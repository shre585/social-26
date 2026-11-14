import os
import sys
import re
import subprocess
import json
from pathlib import Path

# Force UTF-8 stdout
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import settings
from backend.services.platform_formatter import PLATFORM_SPECS, compose_post, normalize_hashtags
from backend.services.clip_generator import (
    detect_scenes,
    validate_and_rank,
    render_video_clip_for_platform,
    render_thumbnail,
    generate_clip_srt,
    render_audio_clip_and_audiogram
)
from backend.services.transcription import probe_media
from backend.services.content_generator import build_carousel_slides, generate_extras, build_fallback_extras

def log_test(name, passed, detail=""):
    mark = "✅ PASS" if passed else "❌ FAIL"
    print(f"[{mark}] {name} {detail}")

def test_forbidden_words():
    """Grep frontend and backend for forbidden coffee words."""
    forbidden = ["brew", "brewing", "coffee bean", "coffee cup", "espresso shot", "barista"]
    ui_files = list((PROJECT_ROOT / "frontend" / "src").rglob("*.jsx"))
    found = []

    for f in ui_files:
        content = f.read_text(encoding="utf-8").lower()
        for word in forbidden:
            if word in content:
                found.append(f"{f.name}: found '{word}'")

    passed = len(found) == 0
    log_test("No forbidden coffee theme words in UI copy", passed, f"({len(found)} violations)")
    return passed

def test_platform_specs():
    """Verify platform specs single source of truth."""
    required_platforms = ["instagram", "youtube", "youtube_long", "facebook", "x", "snapchat", "linkedin"]
    all_present = all(p in PLATFORM_SPECS for p in required_platforms)
    
    # Test normalization & padding
    tags = normalize_hashtags(["python", "CODING", "ai"], "instagram")
    tags_valid = len(tags) >= 5 and tags[0] == "#Python"
    
    # Test X strict character limit <= 280
    x_post = compose_post("x", "Python Masterclass: Why Modular Design Wins", "This is an in-depth breakdown of asynchronous Python workflows and architectural patterns for engineering projects.", ["#Python", "#Dev"])
    x_valid = len(x_post["text"]) <= 280
    
    # Test LinkedIn ending with question
    li_post = compose_post("linkedin", "Modular Architecture in 2026", "A deep dive into decoupled processing.", ["#Tech"])
    li_valid = "?" in li_post["text"]

    passed = all_present and tags_valid and x_valid and li_valid
    log_test("Platform specs and compose validation", passed)
    return passed

def generate_test_media(test_dir: Path) -> Path:
    """Generate a realistic test lecture video using FFmpeg with color slide changes and tone audio."""
    test_dir.mkdir(parents=True, exist_ok=True)
    video_path = test_dir / "test_lecture.mp4"
    if video_path.exists():
        return video_path

    # Create a 25-second synthetic video with scene changes at 0s, 8s, 16s
    # Using FFmpeg color + drawtext + sine audio tone
    cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-f", "lavfi",
        "-i", "testsrc=size=1920x1080:rate=25:duration=24",
        "-f", "lavfi",
        "-i", "sine=frequency=440:duration=24",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        str(video_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return video_path

def test_ffmpeg_rendering(test_dir: Path):
    """Test video generation and verify exact output dimensions with ffprobe."""
    video_path = generate_test_media(test_dir)
    if not video_path.exists():
        log_test("Generate test video", False, "FFmpeg failed to create test video")
        return False

    # 1. Test probe
    meta = probe_media(video_path)
    probe_ok = meta["width"] == 1920 and meta["height"] == 1080 and meta["duration"] > 0
    log_test("ffprobe video metadata", probe_ok, f"{meta['width']}x{meta['height']}, dur: {meta['duration']}s")

    # 2. Test validate_and_rank
    fake_segments = [
        {"start": 0.0, "end": 6.0, "text": "Welcome to the Python lecture today we talk about data structures."},
        {"start": 6.0, "end": 14.0, "text": "Variables in Python store dynamic objects with clean syntax and strong typing."},
        {"start": 14.0, "end": 22.0, "text": "When reframing video for social platforms FFmpeg enables high performance background blur."}
    ]
    raw_topics = [
        {"topic": "Variables & Types", "start": 4.5, "end": 15.0, "importance": 0.95, "title": "Python Variables", "hook": "Stop writing bad Python", "caption": "Clean variable patterns"}
    ]
    ranked = validate_and_rank(raw_topics, fake_segments, 24.0, [8.0, 16.0], min_clip_seconds=5, max_clip_seconds=20)
    rank_ok = len(ranked) > 0 and ranked[0]["start"] in [0.0, 6.0]  # snapped to boundary!
    log_test("Boundary snapping and clip ranking", rank_ok, f"Snapped start: {ranked[0]['start']}s, dur: {ranked[0]['duration']}s")

    # 3. Test platform renders & verify dimensions
    platform_tests = [
        ("instagram", 1080, 1920, "blur"),
        ("youtube_long", 1920, 1080, "blur"),
        ("x", 1280, 720, "blur"),
        ("linkedin", 1080, 1080, "blur"),
        ("facebook", 1080, 1350, "crop")
    ]

    all_rendered = True
    for pid, expected_w, expected_h, rmode in platform_tests:
        out_clip = test_dir / f"clip_{pid}.mp4"
        success, err, _ = render_video_clip_for_platform(
            video_path,
            start=ranked[0]["start"],
            end=ranked[0]["end"],
            platform_id=pid,
            output_path=out_clip,
            reframe_mode=rmode,
            source_width=1920,
            source_height=1080
        )
        if not success:
            log_test(f"Render {pid}", False, err)
            all_rendered = False
            continue

        probe_clip = probe_media(out_clip)
        dim_ok = probe_clip["width"] == expected_w and probe_clip["height"] == expected_h
        log_test(f"Render {pid} ({rmode})", dim_ok, f"Expected {expected_w}x{expected_h}, got {probe_clip['width']}x{probe_clip['height']}")
        if not dim_ok:
            all_rendered = False

    # 4. Test Thumbnail & SRT
    thumb_path = test_dir / "thumb.jpg"
    thumb_ok = render_thumbnail(video_path, 2.0, thumb_path)
    log_test("Render thumbnail", thumb_ok and thumb_path.exists())

    srt_path = test_dir / "captions.srt"
    srt_text = generate_clip_srt(ranked[0]["start"], ranked[0]["end"], fake_segments, srt_path)
    srt_ok = "-->" in srt_text and srt_path.exists()
    log_test("Generate .SRT subtitles", srt_ok)

    # 5. Test Audiogram waveform
    audio_wav = test_dir / "test_audio.wav"
    cmd_audio = [
        settings.FFMPEG_BIN, "-y", "-i", str(video_path), "-vn", "-ac", "1", "-ar", "16000", str(audio_wav)
    ]
    subprocess.run(cmd_audio, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    out_mp3 = test_dir / "clip.mp3"
    out_audiogram = test_dir / "audiogram.mp4"
    audio_ok, _ = render_audio_clip_and_audiogram(audio_wav, 0.0, 10.0, "instagram", out_mp3, out_audiogram)
    log_test("Render audio clip & waveform audiogram", audio_ok and out_mp3.exists() and out_audiogram.exists())

    return all_rendered

def run_all_tests():
    print("==================================================")
    print("⚡ RUNNING SOCIAL MEDIA REPURPOSER TEST SUITE")
    print("==================================================")
    t1 = test_forbidden_words()
    t2 = test_platform_specs()

    test_dir = PROJECT_ROOT / "outputs" / "test_suite_run"
    t3 = test_ffmpeg_rendering(test_dir)

    print("==================================================")
    overall = t1 and t2 and t3
    if overall:
        print("🎉 ALL CORE TESTS PASSED SUCCESSFULLY!")
    else:
        print("⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE.")
    print("==================================================")
    return overall

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
