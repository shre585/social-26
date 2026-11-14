import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, AlertCircle, FileVideo, FileAudio, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function UploadBox({ onUploadSuccess, isUploading, setIsUploading, uploadProgress, setUploadProgress }) {
  const [tab, setTab] = useState('file'); // 'file' or 'url'
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });
      setIsUploading(false);
      onUploadSuccess(response, file);
    } catch (err) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Upload failed');
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(30);

    try {
      const response = await api.uploadUrl(urlInput.trim());
      setIsUploading(false);
      onUploadSuccess(response, null);
    } catch (err) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Failed to import video from URL');
    }
  };

  return (
    <div className="brutal-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => { setTab('file'); setErrorMessage(''); }}
          className={`brutal-btn ${tab === 'file' ? '' : 'brutal-btn-secondary'}`}
          style={{
            padding: '0.5rem 1.1rem',
            fontSize: '0.9rem',
            boxShadow: tab === 'file' ? '4px 4px 0 var(--border)' : '2px 2px 0 var(--border)'
          }}
        >
          <Upload size={16} />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => { setTab('url'); setErrorMessage(''); }}
          className={`brutal-btn ${tab === 'url' ? '' : 'brutal-btn-secondary'}`}
          style={{
            padding: '0.5rem 1.1rem',
            fontSize: '0.9rem',
            boxShadow: tab === 'url' ? '4px 4px 0 var(--border)' : '2px 2px 0 var(--border)'
          }}
        >
          <LinkIcon size={16} />
          <span>Paste YouTube Link</span>
        </button>
      </div>

      {errorMessage && (
        <div style={{
          background: 'var(--color-blush)',
          border: '2px solid var(--border)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#1D110B',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '3px 3px 0 var(--border)'
        }}>
          <AlertCircle size={18} color="#B8473F" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem' }}>
              {tab === 'file' ? 'Uploading to server...' : 'Downloading video with yt-dlp...'}
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-caramel)' }}>
              {uploadProgress}%
            </span>
          </div>
          <div style={{
            height: '14px',
            background: 'var(--color-cream)',
            border: '2px solid var(--border)',
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: '2px 2px 0 var(--border)'
          }}>
            <div style={{
              height: '100%',
              width: `${uploadProgress}%`,
              backgroundColor: 'var(--color-caramel)',
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      )}

      {/* File Upload Tab */}
      {tab === 'file' && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2.5px dashed var(--border)',
            borderRadius: '14px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? 'var(--color-latte)' : 'transparent',
            transition: 'background-color 0.15s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".mp4,.mov,.mkv,.webm,.mp3,.wav,.m4a,.pdf,.docx,.txt,.md"
            style={{ display: 'none' }}
          />

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--color-caramel)',
            border: '2px solid var(--border)',
            boxShadow: '4px 4px 0 var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#FFFBF3'
          }}>
            <Upload size={30} />
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            Drag and drop your file here, or <span style={{ color: 'var(--color-caramel)', textDecoration: 'underline' }}>browse</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Lecture video, podcast audio, syllabus PDF, Word doc, or markdown notes (up to 1,024 MB)
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            <span className="brutal-badge"><FileVideo size={13} /> MP4, MOV, MKV, WEBM</span>
            <span className="brutal-badge"><FileAudio size={13} /> MP3, WAV, M4A</span>
            <span className="brutal-badge"><FileText size={13} /> PDF, DOCX, TXT, MD</span>
          </div>
        </div>
      )}

      {/* YouTube / URL Tab */}
      {tab === 'url' && (
        <form onSubmit={handleUrlSubmit} style={{ padding: '1rem 0' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.95rem',
            marginBottom: '0.5rem'
          }}>
            YouTube or Direct Video/Audio URL:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            <input
              type="url"
              className="brutal-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isUploading}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ⚡ Auto-fetches up to 720p with yt-dlp
              </span>
              <button
                type="submit"
                className="brutal-btn"
                disabled={isUploading || !urlInput.trim()}
                style={{ padding: '0.65rem 1.4rem' }}
              >
                <LinkIcon size={16} />
                <span>Import URL</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
