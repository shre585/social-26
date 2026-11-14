# ⚡ SOCIAL MEDIA REPURPOSER

> **One upload. Every platform.**  
> Turn any video, lecture recording, podcast audio, PDF/DOCX document, or YouTube link into platform-ready viral clips and structured content for **Instagram Reels**, **YouTube Shorts**, **LinkedIn**, **X (Twitter)**, **Snapchat Spotlight**, and **Facebook Reels**.

---

## 🏛️ Core Architecture

```
┌────────────────────────────────────────────────────────┐
│                        REACT UI                        │
│   (Chunky Neo-Brutalist • Coffee Palette • Fast UX)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                   PYTHON CONTROLLER                    │
│   FastAPI • Pipeline Orchestration • Boundary Snapper  │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼─────────────┐ ┌───────────▼──────────────┐
│         LLM BRAIN         │ │      FFMPEG / WHISPER    │
│  Gemini / Claude / OpenAI │ │  Audio Extract • STT VAD │
│   (Suggests Timestamps)   │ │  Scene Detect • Reframe  │
└───────────────────────────┘ └──────────────────────────┘
```

> **The Golden Rule**:  
> *"LLM = Brain, Python = Controller, FFmpeg = Editor, React = UI"*  
> The LLM only **suggests** timestamps and highlights; the Python backend **validates** them against real Whisper segment boundaries (never cutting mid-sentence), scores them via visual scene changes + speech energy, and FFmpeg renders the pixel-perfect reframed media.

---

## 🚀 Features

- **Multi-Format Input Engine**:
  - **Video** (`.mp4`, `.mov`, `.mkv`, `.webm`, or direct YouTube URL via `yt-dlp`): reframed 9:16/16:9/4:5/1:1 videos, thumbnails, and `.srt` subtitles.
  - **Audio** (`.mp3`, `.wav`, `.m4a`): trimmed audio clips + animated waveform audiogram videos rendered with FFmpeg `showwaves`.
  - **Documents** (`.pdf`, `.docx`) & **Text** (`.txt`, `.md`): conceptual breakdown, carousel slides, markdown blog, X thread, and LinkedIn post.
- **AI-Powered Speech-to-Text**:
  - Local, CPU-friendly `faster-whisper` with Voice Activity Detection (VAD) filter.
  - Generates sub-second accurate segment boundaries.
- **Smart Clip Validation & Ranking Engine**:
  - Boundary snapping: Snaps start/end points to nearest speech segment boundary within 8 seconds so no speaker gets cut mid-word.
  - Energy scoring: Measures words per second to detect high-information density moments.
  - Visual scene boost: Detects FFmpeg scene transitions to favor visually dynamic clips.
  - Overlap deduplication: Prunes redundant clips overlapping >30% of shorter segment.
- **Dynamic FFmpeg Reframing**:
  - **Blurred Background Reframing**: Scales video into blurred 9:16 background with centered sharp foreground overlay.
  - **Center Crop**: Crisp zoomed center crop for portrait screens.
  - Fast seeking with `-ss` before `-i`, H.264 `veryfast`, `crf 23`, AAC audio, `+faststart`.
- **Platform Specs as Single Source of Truth**:
  - **Instagram Reels**: 9:16 (1080x1920), ≤90s, tone-tailored CTA, up to 10 hashtags.
  - **YouTube Shorts**: 9:16 (1080x1920), ≤60s, punchy title with `#Shorts`, 5 hashtags.
  - **YouTube Long Video**: 16:9 (1920x1080), description with auto-generated chapters.
  - **Facebook Reels**: 4:5 (1080x1350), ≤120s, 3 hashtags.
  - **X (Twitter)**: 16:9 (1280x720), strict ≤280 character limit including 2 hashtags.
  - **Snapchat Spotlight**: 9:16 (1080x1920), ≤60s, caption ≤80 chars.
  - **LinkedIn Post**: 1:1 (1080x1080), professional executive tone ending with an engaging question.
- **Multi-Channel Extras Suite**:
  - Complete Markdown Blog article.
  - Viral X Thread (every tweet strictly ≤275 characters).
  - High-impact LinkedIn post.
  - SEO Metadata (Title ≤60 chars, Meta Description ≤155 chars, Search Keywords).
  - YouTube Description Chapter Timestamps.
  - Single-click **"Download Everything (.ZIP)"** packaging all media, subtitles, and text.
- **Resilient AI Pipeline**:
  - Works with **Google Gemini**, **OpenAI**, or **Anthropic Claude**.
  - **Intelligent Heuristic Fallback**: If no API key is provided or the LLM times out, the app automatically switches to tech-term density analysis and sentence clustering without failing!

---

## 🎨 Design System

- **Color Palette**: Coffee-derived hex codes (*Espresso* `#2A1810`, *Mocha* `#5A3A2A`, *Caramel* `#C98B5B`, *Latte* `#E8D2B0`, *Cream* `#FFF4E2`, *Foam* `#FFFBF3`, *Blush* `#F4B9A0`, *Matcha* `#9FB88A`, *Berry* `#B8473F`).
- **Styling**: Chunky Neo-brutalist (2.5px dark borders, hard 6px 6px offset drop shadows, pill badges, dotted grid background, tactile press-down buttons).
- **Dark Mode**: High contrast dark theme (`#1D110B` background, `#2B1A12` cards, `#FBEFD9` text) with persistent `localStorage` toggle.
- **Typography**: Bricolage Grotesque (headings), DM Sans (body), Caveat (handwritten accents).

---

## 🛠️ Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- FFmpeg and FFprobe installed on your system PATH (`ffmpeg -version`)

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create your `.env` in the root folder:
```bash
cp .env.example .env
```
*(Optionally add your `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`. If left empty, intelligent heuristic mode is used automatically).*

Start the FastAPI backend:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Docker Deployment

Run both frontend (Nginx reverse proxy) and backend (FastAPI + FFmpeg) with Docker Compose:

```bash
docker-compose up --build
```

- Web App: [http://localhost:3000](http://localhost:3000)
- API Direct: [http://localhost:8000](http://localhost:8000)

---

## 🌐 Split Hosting (Vercel / Netlify + Render / Railway)

### Frontend (Vercel / Netlify)
1. Push `frontend/` to your Git repository.
2. In Vercel or Netlify settings, set:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend.railway.app`

### Backend (Render / Railway)
1. Deploy `backend/` using Dockerfile.
2. Set environment variables:
   - `CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173`
   - `GEMINI_API_KEY=your_key_here` (optional)
   - `WHISPER_MODEL=base`
3. Add a persistent volume mounted to `/data/uploads` and `/data/outputs`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, STT model info, active LLM provider |
| `GET` | `/api/platforms` | Platform dimensions, aspect ratios, limits, tips |
| `POST` | `/api/upload` | Multipart file streaming upload with size validation |
| `POST` | `/api/upload-url` | Download video from YouTube/URL via `yt-dlp` |
| `POST` | `/api/process` | Initiate multi-stage background repurposing pipeline |
| `GET` | `/api/status/{job_id}` | Real-time stage, progress %, and message polling |
| `GET` | `/api/results/{job_id}` | Full results, clips, timestamps, and generated copy |
| `GET` | `/api/jobs` | List past repurposing jobs and clip counts |
| `DELETE` | `/api/results/{job_id}` | Delete job files and metadata |
| `PUT` | `/api/results/{job_id}/clips/{clip_id}/{platform}` | Edit caption/title and recompose copy server-side |
| `GET` | `/api/download/{job_id}/{path}` | Safe download of specific media artifact |
| `GET` | `/api/download-all/{job_id}` | Download complete `.zip` archive with all assets |
| `GET` | `/files/{job_id}/*` | Static media streaming with HTTP 206 range seeking |

---

## 🗺️ Roadmap & Production Enhancements

- [ ] **Cloud Object Storage**: S3 / Azure Blob Storage adapter replacing local disk.
- [ ] **Relational Database**: PostgreSQL + Prisma / SQLAlchemy for multi-tenant accounts.
- [ ] **Burned-in Animated Subtitles**: Word-level karaoke highlights via FFmpeg `drawtext` / `libass`.
- [ ] **Face-Tracking Smart Crop**: OpenCV or MediaPipe face detection to keep speaker centered during 9:16 crop.
- [ ] **Automated Multi-Platform Publishing**: Direct OAuth posting to YouTube Shorts, Instagram Graph API, and LinkedIn.
- [ ] **Distributed Task Queue**: Celery / Redis / Temporal worker pool for heavy video workloads.
- [ ] **OCR for Scanned Documents**: Tesseract / Document AI integration for non-searchable PDFs.

---

## 📄 License

MIT License. Built for final-year engineering capstone and creators worldwide.
