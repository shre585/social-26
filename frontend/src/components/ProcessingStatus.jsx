import React from 'react';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';
import Loader from './Loader';

const STAGES = [
  { id: 'extract', label: 'Audio & Media Extraction' },
  { id: 'transcribe', label: 'Speech-to-Text (Whisper)' },
  { id: 'analyze', label: 'LLM Topic & Hook Analysis' },
  { id: 'scenes', label: 'FFmpeg Scene Cut Detection' },
  { id: 'clips', label: 'Boundary Snapping & Ranking' },
  { id: 'rendering', label: 'Multi-Platform Video Reframing' },
  { id: 'content', label: 'Generating Posts, Threads & Blog' },
  { id: 'finalize', label: 'Packaging Assets' }
];

export default function ProcessingStatus({ statusData, onRetry }) {
  const { stage, progress, message, status, error } = statusData;

  const currentStageIndex = STAGES.findIndex(s => s.id === stage);

  return (
    <div className="brutal-card" style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          {status === 'failed' ? 'Processing Interrupted' : 'Repurposing Your Content'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {message || 'Our multi-stage AI & FFmpeg engine is crafting platform-ready content...'}
        </p>
      </div>

      {/* Main Progress Bar */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {status !== 'failed' && <Loader text="" />}
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
              Overall Progress
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-caramel)' }}>
            {progress}%
          </span>
        </div>

        <div style={{
          height: '20px',
          background: 'var(--color-latte)',
          border: '2.5px solid var(--border)',
          borderRadius: '9999px',
          overflow: 'hidden',
          boxShadow: '3px 3px 0 var(--border)'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(5, progress))}%`,
            backgroundColor: status === 'failed' ? 'var(--color-berry)' : 'var(--color-caramel)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Error state */}
      {status === 'failed' && (
        <div style={{
          background: 'var(--color-blush)',
          border: '2.5px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: '4px 4px 0 var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={24} color="#B8473F" />
            <h4 style={{ fontSize: '1.1rem', color: '#B8473F' }}>Pipeline Error</h4>
          </div>
          <p style={{ fontSize: '0.95rem', color: '#1D110B', marginBottom: '1rem', wordBreak: 'break-word' }}>
            {error || message || 'An unexpected error occurred during processing.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="brutal-btn"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          )}
        </div>
      )}

      {/* Step by step checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.85rem'
      }}>
        {STAGES.map((s, idx) => {
          const isDone = currentStageIndex > idx || progress === 100;
          const isCurrent = currentStageIndex === idx && progress < 100 && status !== 'failed';

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: '2px solid var(--border)',
                borderRadius: '10px',
                background: isDone ? 'var(--color-foam)' : isCurrent ? 'var(--color-latte)' : 'var(--card-bg)',
                boxShadow: isCurrent ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)',
                opacity: isDone || isCurrent ? 1 : 0.6
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid var(--border)',
                background: isDone ? 'var(--color-matcha)' : isCurrent ? 'var(--color-caramel)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFBF3',
                fontSize: '0.75rem',
                fontWeight: 800
              }}>
                {isDone ? <Check size={14} color="#1D110B" strokeWidth={3} /> : idx + 1}
              </div>

              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.88rem',
                fontWeight: isCurrent ? 800 : 600,
                color: 'var(--text)'
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
