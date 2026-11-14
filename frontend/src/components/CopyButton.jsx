import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text, label = "Copy Text", className = "brutal-btn brutal-btn-secondary", style = {} }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        padding: '0.45rem 0.85rem',
        fontSize: '0.85rem',
        borderWidth: '2px',
        boxShadow: copied ? '1px 1px 0 var(--border)' : '3px 3px 0 var(--border)',
        transform: copied ? 'translate(2px, 2px)' : 'none',
        backgroundColor: copied ? 'var(--color-matcha)' : undefined,
        color: copied ? '#1D110B' : undefined,
        ...style
      }}
      aria-label={label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}
