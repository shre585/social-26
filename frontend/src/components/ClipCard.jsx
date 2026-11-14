import React, { useState } from 'react';
import { Play, Flame, Clock, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import ResultCard from './ResultCard';
import CopyButton from './CopyButton';

export default function ClipCard({ clip, jobId, kind = 'video', onUpdateContent }) {
  const { id, topic, title, hook, importance, score, start, end, duration, keywords, key_points, platforms, carousel, thumbnail, srt } = clip;

  // Selected tab: first platform key or 'carousel'
  const platformKeys = Object.keys(platforms || {});
  const [activeTab, setActiveTab] = useState(platformKeys[0] || 'carousel');
  const [currentSlide, setCurrentSlide] = useState(0);

  const activePlatformData = platforms ? platforms[activeTab] : null;
  const activeMedia = activePlatformData ? activePlatformData.media : null;

  const scorePercentage = Math.round((score || importance || 0.8) * 100);

  // Aspect ratio styling
  const aspect = activePlatformData?.aspect || '9:16';
  let aspectRatioClass = '9/16';
  let maxWidth = '260px';
  if (aspect === '16:9') {
    aspectRatioClass = '16/9';
    maxWidth = '380px';
  } else if (aspect === '1:1') {
    aspectRatioClass = '1/1';
    maxWidth = '300px';
  } else if (aspect === '4:5') {
    aspectRatioClass = '4/5';
    maxWidth = '270px';
  }

  return (
    <div className="brutal-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
      {/* Top Bar: Topic, Timestamps, Score */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        paddingBottom: '1rem',
        borderBottom: '2.5px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)' }}>
              {id.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {topic}
            </span>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{title}</h3>
          {hook && (
            <p className="handwritten" style={{ color: 'var(--color-caramel)', marginTop: '0.2rem' }}>
              &ldquo;{hook}&rdquo;
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span className="brutal-badge brutal-badge-time">
            <Clock size={13} /> {start.toFixed(1)}s - {end.toFixed(1)}s ({duration.toFixed(0)}s)
          </span>

          <span
            className="brutal-badge brutal-badge-berry"
            style={{
              fontSize: '0.85rem',
              padding: '0.3rem 0.75rem'
            }}
          >
            <Flame size={14} fill="#FFFBF3" /> {scorePercentage}% SCORE
          </span>
        </div>
      </div>

      {/* Keywords Chips */}
      {keywords && keywords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
          {keywords.map((kw, idx) => (
            <span
              key={idx}
              className="brutal-badge brutal-badge-chip"
              style={{
                fontSize: '0.78rem',
                textTransform: 'none'
              }}
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.75rem'
      }}>
        {platformKeys.map(pid => {
          const p = platforms[pid];
          const isSelected = activeTab === pid;
          return (
            <button
              key={pid}
              onClick={() => setActiveTab(pid)}
              className={`brutal-btn ${isSelected ? '' : 'brutal-btn-secondary'}`}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.85rem',
                boxShadow: isSelected ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)'
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.label.split(' ')[0]}</span>
            </button>
          );
        })}

        {carousel && carousel.length > 0 && (
          <button
            onClick={() => setActiveTab('carousel')}
            className={`brutal-btn ${activeTab === 'carousel' ? '' : 'brutal-btn-secondary'}`}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.85rem',
              boxShadow: activeTab === 'carousel' ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)'
            }}
          >
            <span>📑</span>
            <span>Carousel Cards ({carousel.length})</span>
          </button>
        )}
      </div>

      {/* Tab Content: Platform Media & ResultCard */}
      {activeTab !== 'carousel' && activePlatformData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeMedia?.url ? 'minmax(250px, auto) 1fr' : '1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Video / Media Player */}
          {activeMedia && activeMedia.url && (
            <div style={{
              maxWidth: maxWidth,
              margin: '0 auto',
              width: '100%'
            }}>
              <div style={{
                border: '2.5px solid var(--border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '4px 4px 0 var(--border)',
                background: '#000',
                position: 'relative'
              }}>
                <video
                  src={activeMedia.url}
                  poster={thumbnail || undefined}
                  controls
                  playsInline
                  style={{
                    width: '100%',
                    aspectRatio: aspectRatioClass,
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '0.4rem',
                padding: '0 4px'
              }}>
                <span>Reframed {activeMedia.width}x{activeMedia.height}</span>
                <span>{activeMedia.trimmed ? '⚠️ Trimmed to platform max' : `${activeMedia.duration.toFixed(0)}s`}</span>
              </div>
            </div>
          )}

          {/* Composed Copy and Formatter */}
          <ResultCard
            jobId={jobId}
            clipId={id}
            platformId={activeTab}
            platformData={activePlatformData}
            srtUrl={srt}
            onUpdate={onUpdateContent}
          />
        </div>
      )}

      {/* Tab Content: Carousel Cards */}
      {activeTab === 'carousel' && carousel && (
        <div style={{
          background: 'var(--card-bg)',
          border: '2.5px solid var(--border)',
          borderRadius: '14px',
          padding: '1.5rem',
          boxShadow: '4px 4px 0 var(--border)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem' }}>
              Slide {currentSlide + 1} of {carousel.length}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <CopyButton text={carousel.join('\n\n---\n\n')} label="Copy All Slides" />
            </div>
          </div>

          {/* Current Slide Display */}
          <div style={{
            background: 'var(--color-latte)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '2rem',
            minHeight: '200px',
            boxShadow: '3px 3px 0 var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontSize: '1.05rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-espresso)',
              lineHeight: 1.4
            }}>
              {carousel[currentSlide]}
            </div>
          </div>

          {/* Slide Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
              disabled={currentSlide === 0}
              className="brutal-btn brutal-btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              {carousel.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    backgroundColor: currentSlide === idx ? 'var(--color-caramel)' : 'var(--color-cream)',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide(prev => Math.min(carousel.length - 1, prev + 1))}
              disabled={currentSlide === carousel.length - 1}
              className="brutal-btn"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
