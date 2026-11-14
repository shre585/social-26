import os
from pathlib import Path
from typing import List, Literal

# Base paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(PROJECT_ROOT / ".env")
except ImportError:
    # Read .env manually if python-dotenv is not installed
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k and k not in os.environ:
                        os.environ[k] = v

class Settings:
    # Storage
    _up_env = os.getenv("UPLOAD_DIR", "uploads")
    UPLOAD_DIR: Path = Path(_up_env).resolve() if Path(_up_env).is_absolute() else (PROJECT_ROOT / _up_env).resolve()

    _out_env = os.getenv("OUTPUT_DIR", "outputs")
    OUTPUT_DIR: Path = Path(_out_env).resolve() if Path(_out_env).is_absolute() else (PROJECT_ROOT / _out_env).resolve()

    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "1024"))
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))

    # Binaries
    FFMPEG_BIN: str = os.getenv("FFMPEG_BIN", "ffmpeg")
    FFPROBE_BIN: str = os.getenv("FFPROBE_BIN", "ffprobe")

    # Speech to text
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
    WHISPER_COMPUTE: str = os.getenv("WHISPER_COMPUTE", "int8")

    # LLM API keys & models
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022").strip()

    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,*",
        ).split(",")
        if origin.strip()
    ]

    def __init__(self):
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    @property
    def active_llm_provider(self) -> Literal["gemini", "openai", "anthropic", "mock"]:
        explicit = os.getenv("LLM_PROVIDER", "").strip().lower()
        if explicit in {"gemini", "openai", "anthropic", "mock"}:
            if explicit == "gemini" and self.GEMINI_API_KEY:
                return "gemini"
            if explicit == "openai" and self.OPENAI_API_KEY:
                return "openai"
            if explicit == "anthropic" and self.ANTHROPIC_API_KEY:
                return "anthropic"
            if explicit == "mock":
                return "mock"
        
        # Auto-detect first available key
        if self.GEMINI_API_KEY:
            return "gemini"
        if self.OPENAI_API_KEY:
            return "openai"
        if self.ANTHROPIC_API_KEY:
            return "anthropic"
        return "mock"

    @property
    def is_ai_enabled(self) -> bool:
        return self.active_llm_provider != "mock"

settings = Settings()
