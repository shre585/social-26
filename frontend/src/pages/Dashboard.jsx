import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder, Trash2, ExternalLink, Download, Plus, Clock, FileVideo, FileAudio, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId, filename) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"? This will remove all generated clips and assets.`)) {
      try {
        await api.deleteJob(jobId);
        setJobs(jobs.filter(j => j.job_id !== jobId));
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const totalClips = jobs.reduce((acc, j) => acc + (j.clip_count || 0), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Project Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Manage past repurposing pipelines, download archives, and view results.
          </p>
        </div>

        <Link to="/" className="brutal-btn" style={{ padding: '0.75rem 1.4rem' }}>
          <Plus size={18} />
          <span>New Repurpose</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2.5rem'
      }}>
        <div className="brutal-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
            Total Repurposed
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
            {jobs.length}
          </div>
        </div>

        <div className="brutal-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
            Completed Jobs
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-matcha)', marginTop: '4px' }}>
            {completedJobs.length}
          </div>
        </div>

        <div className="brutal-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
            Highlight Clips Cut
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-caramel)', marginTop: '4px' }}>
            {totalClips}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-blush)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: '3px 3px 0 var(--border)'
        }}>
          <p style={{ color: '#B8473F', fontWeight: 700 }}>{error}</p>
        </div>
      )}

      {/* Project Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Loading projects...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="brutal-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'var(--color-latte)',
            border: '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Folder size={28} color="var(--color-espresso)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No projects yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Upload your first video, podcast audio, or document to see your repurposed assets here.
          </p>
          <Link to="/" className="brutal-btn">Create Your First Project</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map((job) => {
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isProcessing = job.status === 'processing';

            return (
              <div
                key={job.job_id}
                className="brutal-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    border: '2px solid var(--border)',
                    backgroundColor: 'var(--color-latte)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '2px 2px 0 var(--border)'
                  }}>
                    {job.kind === 'video' && <FileVideo size={22} />}
                    {job.kind === 'audio' && <FileAudio size={22} />}
                    {(job.kind === 'document' || job.kind === 'text') && <FileText size={22} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        {job.filename}
                      </h3>
                      <span
                        className="brutal-badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.45rem',
                          backgroundColor: isCompleted ? 'var(--color-matcha)' : isFailed ? 'var(--color-berry)' : 'var(--color-latte)',
                          color: isFailed ? '#FFFBF3' : 'var(--color-espresso)'
                        }}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recent'}</span>
                      <span>•</span>
                      <span>{job.clip_count || 0} clips generated</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/results/${job.job_id}`)}
                    className="brutal-btn"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    <ExternalLink size={14} />
                    <span>Open Results</span>
                  </button>

                  {isCompleted && (
                    <a
                      href={api.getDownloadAllUrl(job.job_id)}
                      download={`repurposed_${job.job_id}.zip`}
                      className="brutal-btn brutal-btn-matcha"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none' }}
                      title="Download ZIP archive"
                    >
                      <Download size={14} />
                      <span>ZIP</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(job.job_id, job.filename)}
                    className="brutal-btn brutal-btn-secondary"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', color: 'var(--color-berry)' }}
                    title="Delete project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
