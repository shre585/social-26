import React from 'react';
import { Check } from 'lucide-react';

export default function PlatformSelector({ platforms, selected, onChange }) {
  const togglePlatform = (id) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        onChange(selected.filter(p => p !== id));
      }
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(platforms.map(p => p.id));
  };

  const selectDefaults = () => {
    onChange(['instagram', 'youtube', 'x', 'linkedin']);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.85rem'
      }}>
        <div>
          <label style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.1rem',
            display: 'block'
          }}>
            Target Social Platforms ({selected.length} selected)
          </label>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Each platform gets custom aspect reframing, tailored copy, and optimized hashtags.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={selectAll}
            className="brutal-btn brutal-btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderWidth: '2px', boxShadow: '2px 2px 0 var(--border)' }}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={selectDefaults}
            className="brutal-btn brutal-btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderWidth: '2px', boxShadow: '2px 2px 0 var(--border)' }}
          >
            Core 4
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '0.85rem'
      }}>
        {platforms.map(p => {
          const isSelected = selected.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              style={{
                border: '2.5px solid var(--border)',
                borderRadius: '14px',
                padding: '0.85rem',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--color-latte)' : 'var(--card-bg)',
                boxShadow: isSelected ? '4px 4px 0 var(--border)' : '2px 2px 0 var(--border)',
                transform: isSelected ? 'translate(-2px, -2px)' : 'none',
                transition: 'all 0.12s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{p.emoji}</span>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--color-caramel)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && <Check size={14} color="#FFFBF3" strokeWidth={3} />}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                  {p.label}
                </h4>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span className="brutal-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--color-foam)' }}>
                    {p.aspect}
                  </span>
                  <span className="brutal-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--color-foam)' }}>
                    &le;{p.max_seconds}s
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
