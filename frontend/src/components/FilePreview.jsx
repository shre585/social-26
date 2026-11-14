import React, { useMemo } from 'react';
import { FileVideo, FileAudio, FileText, CheckCircle2, X } from 'lucide-react';

export default function FilePreview({ fileData, rawFile, onClear }) {
  const { filename, kind, size_mb } = fileData;

  const objectUrl = useMemo(() => {
    if (rawFile) {
      try {
        return URL.createObjectURL(rawFile);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [rawFile]);

  return (
    <div className="brutal-card" style={{
      padding: '1.25rem',
      marginBottom: '2rem',
      backgroundColor: 'var(--color-foam)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '2px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 size={20} color="var(--color-matcha)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem' }}>
            Source Content Loaded
          </span>
          <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)' }}>
            {kind.toUpperCase()}
          </span>
        </div>

        <button
          onClick={onClear}
          className="brutal-btn brutal-btn-secondary"
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.8rem',
            borderWidth: '2px',
            boxShadow: '2px 2px 0 var(--border)'
          }}
          title="Remove file"
        >
          <X size={14} />
          <span>Change</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Interactive Media Preview */}
        {kind === 'video' && objectUrl && (
          <div style={{
            maxWidth: '300px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '2px solid var(--border)',
            boxShadow: '3px 3px 0 var(--border)',
            background: '#000'
          }}>
            <video
              src={objectUrl}
              controls
              style={{ width: '100%', maxHeight: '170px', display: 'block' }}
            />
          </div>
        )}

        {kind === 'audio' && objectUrl && (
          <div style={{ flex: '1', minWidth: '260px' }}>
            <audio
              src={objectUrl}
              controls
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </div>
        )}

        {/* Metadata Details */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem', wordBreak: 'break-all' }}>
            {filename}
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            File Size: <strong>{size_mb} MB</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {kind === 'video' && '🎥 Full video with auto-extracted audio, Whisper timestamps, and scene detection.'}
            {kind === 'audio' && '🎙️ Audio will be transcribed, sliced into clips, and rendered with custom waveforms.'}
            {kind === 'document' && '📄 Text will be extracted, synthesized into key concepts, carousels, and articles.'}
            {kind === 'text' && '📝 Content will be analyzed into social summaries, threads, and carousels.'}
          </p>
        </div>
      </div>
    </div>
  );
}
