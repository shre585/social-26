import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, AlertTriangle, Clock, Layers, Film, Share2, ChevronDown, ChevronUp, ArrowLeft, Sparkles } from 'lucide-react';
import ProcessingStatus from '../components/ProcessingStatus';
import ClipCard from '../components/ClipCard';
import ExtrasPanel from '../components/ExtrasPanel';
import CopyButton from '../components/CopyButton';
import { api } from '../services/api';

export default function Results() {
  const { jobId } = useParams();

  const [statusData, setStatusData] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Poll status every 1.5 seconds until completed or failed
  useEffect(() => {
    let intervalId = null;
    let isMounted = true;

    async function checkStatus() {
      try {
        const s = await api.getStatus(jobId);
        if (!isMounted) return;
        setStatusData(s);

        if (s.status === 'completed') {
          clearInterval(intervalId);
          // Load full results
          const fullJob = await api.getResults(jobId);
          if (isMounted) {
            setJobResult(fullJob);
            setLoading(false);
          }
        } else if (s.status === 'failed') {
          clearInterval(intervalId);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
          clearInterval(intervalId);
        }
      }
    }

    checkStatus();
    intervalId = setInterval(checkStatus, 1500);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId]);

  const handleUpdateClipContent = (clipId, platformId, newContent) => {
    if (!jobResult) return;
    const updatedClips = jobResult.clips.map(c => {
      if (c.id === clipId && c.platforms && c.platforms[platformId]) {
        return {
          ...c,
          platforms: {
            ...c.platforms,
            [platformId]: {
              ...c.platforms[platformId],
              content: newContent
            }
          }
        };
      }
      return c;
    });
    setJobResult({ ...jobResult, clips: updatedClips });
  };

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div className="brutal-card" style={{ padding: '2rem', background: 'var(--color-blush)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#B8473F' }}>Unable to load results</h2>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/" className="brutal-btn">Return to Upload</Link>
        </div>
      </div>
    );
  }

  // Still processing
  if (!jobResult || statusData?.status === 'processing' || statusData?.status === 'pending') {
    return (
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <ProcessingStatus
          statusData={statusData || { stage: 'init', progress: 5, message: 'Connecting...', status: 'processing' }}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const { filename, kind, summary, warning, keywords, metadata, clips, extras, transcript } = jobResult;
  const durationSec = metadata?.duration || 0;
  const platformCount = clips && clips[0] ? Object.keys(clips[0].platforms || {}).length : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link to="/" className="brutal-btn brutal-btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} />
          <span>New Repurpose</span>
        </Link>

        <a
          href={api.getDownloadAllUrl(jobId)}
          download={`repurposed_${jobId}.zip`}
          className="brutal-btn brutal-btn-matcha"
          style={{ textDecoration: 'none', padding: '0.65rem 1.4rem' }}
        >
          <Download size={18} />
          <span>Download Everything (.ZIP)</span>
        </a>
      </div>

      {/* Main Title & Summary */}
      <div className="brutal-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span className="brutal-badge" style={{ backgroundColor: 'var(--color-caramel)', color: '#FFFBF3' }}>
            Ready for Publishing
          </span>
          <span className="brutal-badge" style={{ backgroundColor: 'var(--color-foam)' }}>
            JOB ID: {jobId}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom: '0.65rem', wordBreak: 'break-all' }}>
          {filename}
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          {summary || 'Content synthesized and repurposed into tailored multi-channel assets.'}
        </p>

        {/* Global Keyword Tags */}
        {keywords && keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {keywords.map((kw, i) => (
              <span key={i} className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)', textTransform: 'none' }}>
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Heuristic / AI Status Banner */}
      {warning && (
        <div style={{
          background: 'var(--card-bg)',
          color: 'var(--text)',
          border: 'var(--border-width) solid var(--border)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: 'var(--shadow-offset)'
        }}>
          <Sparkles size={20} color="var(--color-caramel)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              {warning.toLowerCase().includes('not configured') || warning.toLowerCase().includes('heuristic')
                ? 'Intelligent Heuristic Topic Extractor'
                : 'AI Engine Notice'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
              {warning}
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div className="brutal-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <Clock size={20} color="var(--color-caramel)" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {durationSec > 0 ? `${Math.floor(durationSec / 60)}m ${Math.floor(durationSec % 60)}s` : 'N/A'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Source Duration
          </span>
        </div>

        <div className="brutal-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <Film size={20} color="var(--color-caramel)" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {clips ? clips.length : 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Cut Highlight Clips
          </span>
        </div>

        <div className="brutal-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <Share2 size={20} color="var(--color-caramel)" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {platformCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Platforms Formatted
          </span>
        </div>

        <div className="brutal-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <Layers size={20} color="var(--color-caramel)" style={{ margin: '0 auto 0.25rem' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {transcript ? transcript.length : 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Speech Segments
          </span>
        </div>
      </div>

      {/* Highlight Clips */}
      <section style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1.25rem' }}>
          Platform-Ready Highlight Clips
        </h2>
        {clips && clips.length > 0 ? (
          clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              jobId={jobId}
              kind={kind}
              onUpdateContent={handleUpdateClipContent}
            />
          ))
        ) : (
          <div className="brutal-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No video clips required for this input mode.</p>
          </div>
        )}
      </section>

      {/* Extras Panel (Blog, X Thread, LinkedIn, SEO, Chapters) */}
      <section style={{ marginBottom: '3.5rem' }}>
        <ExtrasPanel extras={extras} />
      </section>

      {/* Collapsible Full Transcript Section */}
      {transcript && transcript.length > 0 && (
        <section className="brutal-card" style={{ padding: '1.5rem' }}>
          <div
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Full Timestamped Transcript ({transcript.length} segments)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Speech transcribed with faster-whisper and VAD sentence splitting.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CopyButton
                text={transcript.map(s => `[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`).join('\n')}
                label="Copy Transcript"
              />
              <button
                className="brutal-btn brutal-btn-secondary"
                style={{ padding: '0.4rem', border: '2px solid var(--border)' }}
                aria-label="Toggle transcript"
              >
                {showTranscript ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {showTranscript && (
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '2px solid var(--border)',
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {transcript.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-foam)',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--color-caramel)',
                    whiteSpace: 'nowrap'
                  }}>
                    {s.start.toFixed(1)}s - {s.end.toFixed(1)}s
                  </span>
                  <span style={{ color: 'var(--text)' }}>
                    {s.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
