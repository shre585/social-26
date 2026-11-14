import React from 'react';
import { Play } from 'lucide-react';

export default function HeroArt() {
  return (
    <div className="hero-art-container" aria-hidden="true">
      {/* Long Source Video Card */}
      <div className="hero-main-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#B8473F', border: '1.5px solid #2A1810' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C98B5B', border: '1.5px solid #2A1810' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9FB88A', border: '1.5px solid #2A1810' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', fontWeight: 700, color: '#5A3A2A' }}>
            lecture_recording.mp4
          </span>
        </div>

        {/* Video Canvas Dummy Area */}
        <div style={{
          background: '#2A1810',
          height: '92px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle grid pattern inside monitor */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(201, 139, 91, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(201, 139, 91, 0.2) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }} />

          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#C98B5B',
            border: '2px solid #FFFBF3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            boxShadow: '2px 2px 0 #000'
          }}>
            <Play size={18} fill="#FFFBF3" color="#FFFBF3" style={{ marginLeft: '2px' }} />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: '#FFFBF3',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontWeight: 700
          }}>
            1:02:35
          </div>
        </div>

        {/* Timeline Markers */}
        <div style={{ marginTop: '10px' }}>
          <div style={{
            height: '8px',
            background: '#E8D2B0',
            borderRadius: '4px',
            border: '1.5px solid #2A1810',
            position: 'relative'
          }}>
            {/* Cut Highlights */}
            <div style={{ position: 'absolute', left: '15%', width: '18%', height: '100%', background: '#B8473F' }} />
            <div style={{ position: 'absolute', left: '42%', width: '14%', height: '100%', background: '#C98B5B' }} />
            <div style={{ position: 'absolute', left: '68%', width: '22%', height: '100%', background: '#9FB88A' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#5A3A2A', marginTop: '2px', fontWeight: 600 }}>
            <span>00:00</span>
            <span>30:00</span>
            <span>1:02:35</span>
          </div>
        </div>
      </div>

      {/* Fan-out Vertical Platform Clip Cards */}
      <div className="hero-sub-card hero-card-post">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem' }}>🐦</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1D110B' }}>16:9</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1D110B', lineHeight: 1.2 }}>
          Architectural deep-dive in 280 chars 🧵
        </div>
        <div style={{ height: '4px', width: '60%', background: '#2A1810', borderRadius: '2px' }} />
      </div>

      <div className="hero-sub-card hero-card-short">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem' }}>▶️</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2A1810' }}>9:16</span>
        </div>
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#2A1810',
            color: '#FFFBF3',
            margin: '0 auto 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={12} fill="#FFFBF3" />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2A1810' }}>Short #1</span>
        </div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#5A3A2A' }}>0:45 • 60fps</div>
      </div>

      <div className="hero-sub-card hero-card-reel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem' }}>📸</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2A1810' }}>9:16</span>
        </div>
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#2A1810',
            color: '#FFFBF3',
            margin: '0 auto 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={12} fill="#FFFBF3" />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2A1810' }}>Reel Cut</span>
        </div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#5A3A2A' }}>0:30 • 1080p</div>
      </div>

      {/* Chunky Stickers placed non-overlapping */}
      <div className="hero-sticker sticker-python">
        #Python
      </div>

      <div className="hero-sticker sticker-scissors">
        ✂️ FFmpeg
      </div>

      <div className="hero-sticker sticker-score">
        🔥 94 SCORE
      </div>
    </div>
  );
}
