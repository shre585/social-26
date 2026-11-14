import React, { useState } from 'react';
import { Download, FileText, Check, Save, Clock, Lightbulb } from 'lucide-react';
import CopyButton from './CopyButton';
import { api } from '../services/api';

export default function ResultCard({ jobId, clipId, platformId, platformData, srtUrl, onUpdate }) {
  const { label, emoji, aspect, best_time, tip, content, media } = platformData;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(content.title || '');
  const [caption, setCaption] = useState(content.caption || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const charLimit = content.char_limit || 2200;
  const currentChars = (isEditing ? caption : content.text).length;
  const isOverLimit = currentChars > charLimit;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateClipContent(jobId, clipId, platformId, {
        title,
        caption
      });
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onUpdate && res.content) {
        onUpdate(clipId, platformId, res.content);
      }
    } catch (err) {
      setIsSaving(false);
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <div style={{
      border: '2.5px solid var(--border)',
      borderRadius: '14px',
      padding: '1.25rem',
      background: 'var(--card-bg)',
      boxShadow: '4px 4px 0 var(--border)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '2px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{label}</h4>
          <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)', fontSize: '0.7rem' }}>
            {aspect}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {best_time && (
            <span className="brutal-badge brutal-badge-chip" style={{ textTransform: 'none' }}>
              <Clock size={12} /> {best_time}
            </span>
          )}
          <span
            className={`brutal-badge ${isOverLimit ? 'brutal-badge-berry' : 'brutal-badge-chip'}`}
            style={{ textTransform: 'none' }}
          >
            {currentChars} / {charLimit} chars
          </span>
        </div>
      </div>

      {/* Tip Banner */}
      {tip && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text)',
          background: 'var(--card-bg)',
          border: '2px solid var(--border)',
          borderRadius: '10px',
          padding: '0.6rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '2px 2px 0 var(--border)'
        }}>
          <Lightbulb size={16} color="var(--color-caramel)" style={{ flexShrink: 0 }} />
          <span><strong>Platform Tip:</strong> {tip}</span>
        </div>
      )}

      {/* Content Form or View */}
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Title / Hook:
            </label>
            <input
              type="text"
              className="brutal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Caption Body:
            </label>
            <textarea
              className="brutal-input"
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="brutal-btn"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save & Recompose'}</span>
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="brutal-btn brutal-btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.88rem',
            whiteSpace: 'pre-wrap',
            maxHeight: '220px',
            overflowY: 'auto',
            color: 'var(--text)'
          }}>
            {content.text}
          </div>
        </div>
      )}

      {/* Hashtag Pills */}
      {content.hashtags && content.hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
          {content.hashtags.map((tag, i) => (
            <span
              key={i}
              className="brutal-badge brutal-badge-chip"
              style={{ fontSize: '0.78rem', textTransform: 'none' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.65rem',
        alignItems: 'center',
        paddingTop: '0.75rem',
        borderTop: '2px solid var(--border)'
      }}>
        <CopyButton text={content.text} label="Copy Composed Text" />

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="brutal-btn brutal-btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderWidth: '2px' }}
          >
            Edit Caption
          </button>
        )}

        {media && media.download && (
          <a
            href={media.download}
            download
            className="brutal-btn brutal-btn-matcha"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            <Download size={14} />
            <span>Download {label.split(' ')[0]}</span>
          </a>
        )}

        {srtUrl && (
          <a
            href={srtUrl}
            download={`captions_${clipId}.srt`}
            className="brutal-btn brutal-btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            <FileText size={14} />
            <span>.SRT</span>
          </a>
        )}

        {saveSuccess && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-matcha)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}
