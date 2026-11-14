from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field, field_validator
import re

JOB_ID_REGEX = re.compile(r"^[a-f0-9]{12}$")

def validate_job_id(v: str) -> str:
    if not isinstance(v, str) or not JOB_ID_REGEX.match(v):
        raise ValueError("Invalid job_id: must be exactly 12 lowercase hexadecimal characters.")
    return v

class JobIdModel(BaseModel):
    job_id: str = Field(..., pattern=r"^[a-f0-9]{12}$")

class UploadResponse(BaseModel):
    job_id: str
    filename: str
    kind: Literal["video", "audio", "document", "text"]
    size_mb: float
    message: str

class UploadUrlRequest(BaseModel):
    url: str

class ProcessRequest(BaseModel):
    job_id: str
    platforms: List[str] = Field(default_factory=lambda: ["instagram", "youtube", "facebook", "x", "snapchat", "linkedin"])
    purpose: Literal["general", "educational"] = "general"
    tone: Literal["educational", "genz", "professional", "funny", "storytelling", "inspirational"] = "educational"
    language: Literal["english", "hinglish", "hindi"] = "english"
    max_clips: int = Field(default=5, ge=1, le=15)
    min_clip_seconds: int = Field(default=15, ge=3, le=180)
    max_clip_seconds: int = Field(default=60, ge=10, le=300)
    reframe: Literal["blur", "crop"] = "blur"

    @field_validator("job_id")
    @classmethod
    def check_job_id(cls, v: str) -> str:
        return validate_job_id(v)

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str

class ClipPlatformContent(BaseModel):
    title: str
    caption: str
    hashtags: List[str]
    description: Optional[str] = None
    text: str  # Composed text ready to copy-paste
    char_limit: Optional[int] = None

class ClipPlatformMedia(BaseModel):
    url: str
    download: str
    type: str
    width: int
    height: int
    duration: float
    trimmed: bool = False
    error: Optional[str] = None

class ClipPlatformData(BaseModel):
    label: str
    emoji: str
    aspect: str
    best_time: str
    tip: str
    content: ClipPlatformContent
    media: Optional[ClipPlatformMedia] = None

class ClipResult(BaseModel):
    id: str
    topic: str
    title: str
    hook: str
    keywords: List[str] = Field(default_factory=list)
    key_points: List[str] = Field(default_factory=list)
    importance: float = 0.8
    score: float = 0.8
    start: float
    end: float
    duration: float
    carousel: List[str] = Field(default_factory=list)
    thumbnail: Optional[str] = None
    srt: Optional[str] = None
    audio: Optional[str] = None
    platforms: Dict[str, ClipPlatformData] = Field(default_factory=dict)

class SeoData(BaseModel):
    title: str
    meta_description: str
    keywords: List[str] = Field(default_factory=list)

class ExtrasData(BaseModel):
    blog: str = ""
    x_thread: List[str] = Field(default_factory=list)
    linkedin_post: str = ""
    seo: SeoData = Field(default_factory=lambda: SeoData(title="", meta_description="", keywords=[]))
    youtube_chapters: List[str] = Field(default_factory=list)
    study_quiz: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    key_takeaways: Optional[List[str]] = Field(default_factory=list)
    viral_hook_matrix: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    newsletter_edition: Optional[str] = ""

class UpdateClipContentRequest(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None

class JobRecord(BaseModel):
    job_id: str
    kind: Literal["video", "audio", "document", "text"]
    filename: str
    filepath: str
    source_url: Optional[str] = None
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    stage: str = "uploaded"
    progress: int = 0
    message: str = "Ready to process"
    error: Optional[str] = None
    warning: Optional[str] = None
    ai_provider: str = "mock"
    created_at: str
    updated_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    transcript: List[TranscriptSegment] = Field(default_factory=list)
    scenes: List[float] = Field(default_factory=list)
    summary: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    clips: List[ClipResult] = Field(default_factory=list)
    extras: Optional[ExtrasData] = None

class PlatformSpec(BaseModel):
    id: str
    label: str
    emoji: str
    aspect: str
    width: int
    height: int
    max_seconds: int
    caption_limit: Optional[int] = None
    title_limit: Optional[int] = None
    post_limit: Optional[int] = None
    hashtag_limit: int
    best_times: List[str]
    tip: str

class PlatformsResponse(BaseModel):
    platforms: List[PlatformSpec]
    ai_enabled: bool
    provider: str
