import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles, Sliders, AlertTriangle } from 'lucide-react';
import HeroArt from '../components/HeroArt';
import UploadBox from '../components/UploadBox';
import FilePreview from '../components/FilePreview';
import PlatformSelector from '../components/PlatformSelector';
import { api } from '../services/api';

const DEFAULT_PLATFORMS = [
  { id: "instagram", label: "Instagram Reels", emoji: "📸", aspect: "9:16", max_seconds: 90 },
  { id: "youtube", label: "YouTube Shorts", emoji: "▶️", aspect: "9:16", max_seconds: 60 },
  { id: "youtube_long", label: "YouTube Video", emoji: "📺", aspect: "16:9", max_seconds: 3600 },
  { id: "facebook", label: "Facebook Reels", emoji: "👥", aspect: "4:5", max_seconds: 120 },
  { id: "x", label: "X (Twitter)", emoji: "🐦", aspect: "16:9", max_seconds: 140 },
  { id: "snapchat", label: "Snapchat Spotlight", emoji: "👻", aspect: "9:16", max_seconds: 60 },
  { id: "linkedin", label: "LinkedIn Post", emoji: "💼", aspect: "1:1", max_seconds: 120 }
];

export default function Home() {
  const navigate = useNavigate();

  const [platformsList, setPlatformsList] = useState(DEFAULT_PLATFORMS);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'youtube', 'x', 'linkedin']);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiProvider, setAiProvider] = useState('mock');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedJob, setUploadedJob] = useState(null);
  const [uploadedRawFile, setUploadedRawFile] = useState(null);

  // Configuration Options
  const [purpose, setPurpose] = useState('general'); // 'general' | 'educational'
  const [tone, setTone] = useState('educational');
  const [language, setLanguage] = useState('english');
  const [maxClips, setMaxClips] = useState(5);
  const [minClipSeconds, setMinClipSeconds] = useState(15);
  const [maxClipSeconds, setMaxClipSeconds] = useState(60);
  const [reframeMode, setReframeMode] = useState('blur');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const data = await api.getPlatforms();
        if (data.platforms && data.platforms.length > 0) {
          setPlatformsList(data.platforms);
        }
        setAiEnabled(data.ai_enabled);
        setAiProvider(data.provider);
      } catch (err) {
        console.warn("Could not load platforms from backend, using defaults:", err);
      }
    }
    loadPlatforms();
  }, []);

  const handleUploadSuccess = (jobResponse, rawFile) => {
    setUploadedJob(jobResponse);
    setUploadedRawFile(rawFile);
  };

  const handleStartRepurpose = async () => {
    if (!uploadedJob || !uploadedJob.job_id) return;

    setIsSubmitting(true);
    try {
      await api.startProcessing({
        job_id: uploadedJob.job_id,
        platforms: selectedPlatforms,
        purpose,
        tone,
        language,
        max_clips: Number(maxClips),
        min_clip_seconds: Number(minClipSeconds),
        max_clip_seconds: Number(maxClipSeconds),
        reframe: reframeMode
      });
      navigate(`/results/${uploadedJob.job_id}`);
    } catch (err) {
      setIsSubmitting(false);
      alert(`Could not start processing: ${err.message}`);
    }
  };

  const isMedia = uploadedJob?.kind === 'video' || uploadedJob?.kind === 'audio';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Hero Section */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center',
        marginBottom: '2.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)' }}>
              AI Content Engine
            </span>
            {!aiEnabled && (
              <span className="brutal-badge" style={{ backgroundColor: 'var(--color-cream)', textTransform: 'none' }}>
                <AlertTriangle size={12} color="var(--color-caramel)" /> Heuristic Mode
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.05, marginBottom: '1rem' }}>
            One upload.<br />
            <span style={{ color: 'var(--color-caramel)' }}>Every platform.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '520px' }}>
            Upload a lecture, podcast, or document. Our AI finds the most valuable concepts, snaps to exact sentence boundaries, and reframes viral clips for Instagram, YouTube, X, and LinkedIn.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#upload-section" className="brutal-btn" style={{ fontSize: '1.05rem', padding: '0.85rem 1.6rem' }}>
              <Zap size={18} fill="#FFFBF3" />
              <span>Get Started Now</span>
            </a>
            <button
              onClick={() => navigate('/dashboard')}
              className="brutal-btn brutal-btn-secondary"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.4rem' }}
            >
              Past Projects
            </button>
          </div>
        </div>

        <div>
          <HeroArt />
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="marquee-container" aria-hidden="true">
        <div className="marquee-content">
          ⚡ ONE UPLOAD • 6 PLATFORMS • AUTO-SNAPPED TIMESTAMPS • VIRAL CAPTIONS • FFMPEG REFRAMING • INSTAGRAM REELS • YOUTUBE SHORTS • LINKEDIN • X (TWITTER) • SNAPCHAT • FACEBOOK • NO MID-SENTENCE CUTS •&nbsp;
        </div>
        <div className="marquee-content">
          ⚡ ONE UPLOAD • 6 PLATFORMS • AUTO-SNAPPED TIMESTAMPS • VIRAL CAPTIONS • FFMPEG REFRAMING • INSTAGRAM REELS • YOUTUBE SHORTS • LINKEDIN • X (TWITTER) • SNAPCHAT • FACEBOOK • NO MID-SENTENCE CUTS •&nbsp;
        </div>
      </div>

      {/* Upload & Configuration Section */}
      <section id="upload-section" style={{ marginTop: '2.5rem' }}>
        {!uploadedJob ? (
          <UploadBox
            onUploadSuccess={handleUploadSuccess}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
          />
        ) : (
          <div>
            <FilePreview
              fileData={uploadedJob}
              rawFile={uploadedRawFile}
              onClear={() => {
                setUploadedJob(null);
                setUploadedRawFile(null);
              }}
            />

            {/* Platform Selector */}
            <PlatformSelector
              platforms={platformsList}
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />

            {/* Pipeline Configuration Options */}
            <div className="brutal-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={20} color="var(--color-caramel)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Pipeline Customization</h3>
                </div>

                {/* Purpose Switcher: General Purpose vs Educational Purpose */}
                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--color-latte)', padding: '4px', borderRadius: '10px', border: '2px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPurpose('general');
                      if (tone === 'educational') setTone('professional');
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: purpose === 'general' ? 'var(--color-caramel)' : 'transparent',
                      color: purpose === 'general' ? '#FFFBF3' : 'var(--text)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🌐 General Purpose
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPurpose('educational');
                      setTone('educational');
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: purpose === 'educational' ? 'var(--color-caramel)' : 'transparent',
                      color: purpose === 'educational' ? '#FFFBF3' : 'var(--text)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🎓 Educational Purpose
                  </button>
                </div>
              </div>

              {/* Purpose Mode Explainer Pill */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: purpose === 'educational' ? 'rgba(159, 184, 138, 0.2)' : 'rgba(201, 139, 91, 0.15)',
                border: '1.5px dashed var(--border)',
                fontSize: '0.85rem',
                color: 'var(--text)'
              }}>
                {purpose === 'educational' ? (
                  <span>
                    <strong>🎓 Educational Mode Active:</strong> Generates conceptual study breakdowns, interactive review quiz, lecture chapters, key student takeaways, and step-by-step tutorial captions.
                  </span>
                ) : (
                  <span>
                    <strong>🌐 General Purpose Mode Active:</strong> Generates high-retention viral hook matrices, email newsletter edition, multi-platform threads, and compelling social storytelling.
                  </span>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                {/* Tone */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Content Tone:
                  </label>
                  <select
                    className="brutal-input"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="educational">Educational (Tutorial / Clear)</option>
                    <option value="genz">Gen-Z (High Energy / Trendy)</option>
                    <option value="professional">Professional (Executive / Tech)</option>
                    <option value="funny">Entertaining / Humorous</option>
                    <option value="storytelling">Storytelling / Narrative</option>
                    <option value="inspirational">Inspirational / Thought Leadership</option>
                  </select>
                </div>

                {/* Caption Language */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Caption Language:
                  </label>
                  <select
                    className="brutal-input"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish (Colloquial)</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>

                {/* Max Clips Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Max Clips to Cut:</label>
                    <span style={{ fontWeight: 800, color: 'var(--color-caramel)' }}>{maxClips} clips</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxClips}
                    onChange={(e) => setMaxClips(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-caramel)', height: '6px' }}
                  />
                </div>

                {/* Clip Duration Range (Media only) */}
                {isMedia && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Target Clip Length:</label>
                      <span style={{ fontWeight: 800, color: 'var(--color-caramel)' }}>
                        {minClipSeconds}s - {maxClipSeconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      step="5"
                      value={maxClipSeconds}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMaxClipSeconds(val);
                        if (val <= minClipSeconds) setMinClipSeconds(Math.max(10, val - 10));
                      }}
                      style={{ width: '100%', accentColor: 'var(--color-caramel)', height: '6px' }}
                    />
                  </div>
                )}

                {/* Reframe Mode (Media only) */}
                {isMedia && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                      Video Reframing Style:
                    </label>
                    <select
                      className="brutal-input"
                      value={reframeMode}
                      onChange={(e) => setReframeMode(e.target.value)}
                    >
                      <option value="blur">Blurred Background (Preserves whole screen)</option>
                      <option value="crop">Center Crop (Full screen zoom)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Notice if in Heuristic Mode */}
            {!aiEnabled && (
              <div style={{
                background: 'var(--card-bg)',
                color: 'var(--text)',
                border: 'var(--border-width) solid var(--border)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                boxShadow: 'var(--shadow-offset)'
              }}>
                <Sparkles size={20} color="var(--color-caramel)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text)' }}>Intelligent Heuristic Mode:</strong> Running with tech keyword density scoring & sentence boundary snapping.
                </span>
              </div>
            )}

            {/* Big Repurpose It CTA */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={handleStartRepurpose}
                disabled={isSubmitting || selectedPlatforms.length === 0}
                className="brutal-btn"
                style={{
                  fontSize: '1.3rem',
                  padding: '1rem 2.8rem',
                  boxShadow: '6px 6px 0 var(--border)'
                }}
              >
                <Zap size={24} fill="#FFFBF3" />
                <span>{isSubmitting ? 'Starting Pipeline...' : 'Repurpose It Now'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: '5rem',
        paddingTop: '2rem',
        borderTop: '2px solid var(--border)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.95rem'
      }}>
        <p className="handwritten" style={{ fontSize: '1.4rem', color: 'var(--color-caramel)' }}>
          Made for creators who&apos;d rather teach than edit.
        </p>
      </footer>
    </div>
  );
}
