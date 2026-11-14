import React from 'react';

export default function Loader({ text = "Processing..." }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 1rem'
    }} role="status" aria-live="polite">
      <div className="equalizer-loader" aria-hidden="true">
        <div className="equalizer-bar" />
        <div className="equalizer-bar" />
        <div className="equalizer-bar" />
        <div className="equalizer-bar" />
        <div className="equalizer-bar" />
      </div>
      {text && (
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text)'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}
