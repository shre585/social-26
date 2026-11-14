# 🚀 Deployment Guide — Social Media Repurposer

This document covers all deployment targets: Local Production, Docker / Containerized, and Cloud VPS / PaaS.

---

## 1. Live Local Deployment (Currently Running)

The application is deployed and running live on your workstation:

| Component | URL | Port |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://127.0.0.1:5173](http://127.0.0.1:5173) | 5173 |
| **FastAPI Backend** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | 8000 |
| **Interactive API Docs (Swagger)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | 8000 |

### Quick Start / Restart Commands
```powershell
# 1. Start Backend (from repository root)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Start Frontend (from frontend folder)
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 2. Docker & Docker Compose Deployment

The repository includes a multi-container Docker configuration with Nginx and FFmpeg.

### Prerequisites
- Install **Docker Desktop** (or Docker Engine on Linux)
- Ensure virtualization is enabled

### Run with Docker Compose
```bash
# 1. Build and launch all services in detached mode
docker compose up -d --build

# 2. Check service status
docker compose ps

# 3. View logs
docker compose logs -f
```

- **Frontend**: `http://localhost:3000` (Nginx reverse-proxying API requests)
- **Backend API**: `http://localhost:8000`

---

## 3. Cloud Deployment (VPS: Ubuntu / Debian)

For production deployment on AWS EC2, DigitalOcean, Hetzner, or Linode:

### Step 1: Install System Dependencies
```bash
sudo apt update && sudo apt install -y python3 python3-pip ffmpeg git nginx
```

### Step 2: Clone and Configure Environment
```bash
git clone <your-repo-url> /var/www/repurposer
cd /var/www/repurposer
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY
```

### Step 3: Install Python Dependencies & Build Frontend
```bash
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build
```

### Step 4: Systemd Service for FastAPI (`/etc/systemd/system/repurposer.service`)
```ini
[Unit]
Description=Social Media Repurposer Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/repurposer
ExecStart=/usr/local/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now repurposer
```

### Step 5: Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/repurposer/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 1024M;
    }

    location /files/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

---

## 4. Production Checklist

- [x] Gemini AI Brain verified and active (`gemini-3.5-flash`)
- [x] Video reframing (9:16 vertical blur, 16:9, 1:1, 4:5) verified
- [x] Speech boundary snapping & subtitle (.srt) generator verified
- [x] Static media range requests (HTTP 206 seeking) enabled
- [x] Multi-platform package downloader (.ZIP) verified
