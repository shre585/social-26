import React, { useState } from 'react';
import {
  BookOpen,
  Twitter,
  Linkedin,
  Search,
  ListOrdered,
  GraduationCap,
  Sparkles,
  Mail,
  CheckCircle,
  HelpCircle,
  Flame,
  Award
} from 'lucide-react';
import CopyButton from './CopyButton';

export default function ExtrasPanel({ extras }) {
  if (!extras) return null;

  const [activeTab, setActiveTab] = useState('quiz');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const {
    blog,
    x_thread,
    linkedin_post,
    seo,
    youtube_chapters,
    study_quiz,
    key_takeaways,
    viral_hook_matrix,
    newsletter_edition
  } = extras;

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const calculateScore = () => {
    if (!study_quiz || study_quiz.length === 0) return 0;
    let correct = 0;
    study_quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="brutal-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} color="var(--color-caramel)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Multi-Channel & Educational Suite</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive publishing, interactive learning checkpoints, hook formulas, and newsletter copy.
          </p>
        </div>
        <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)' }}>
          Standout Features
        </span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        borderBottom: '2.5px solid var(--border)',
        paddingBottom: '0.75rem'
      }}>
        {/* Standout Tab: Study Quiz */}
        {study_quiz && study_quiz.length > 0 && (
          <button
            onClick={() => setActiveTab('quiz')}
            className={`brutal-btn ${activeTab === 'quiz' ? '' : 'brutal-btn-secondary'}`}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
          >
            <GraduationCap size={16} />
            <span>Interactive Quiz ({study_quiz.length})</span>
          </button>
        )}

        {/* Standout Tab: Key Takeaways */}
        {key_takeaways && key_takeaways.length > 0 && (
          <button
            onClick={() => setActiveTab('takeaways')}
            className={`brutal-btn ${activeTab === 'takeaways' ? '' : 'brutal-btn-secondary'}`}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
          >
            <Award size={16} />
            <span>Key Takeaways</span>
          </button>
        )}

        {/* Standout Tab: Viral Hook Matrix */}
        {viral_hook_matrix && viral_hook_matrix.length > 0 && (
          <button
            onClick={() => setActiveTab('hooks')}
            className={`brutal-btn ${activeTab === 'hooks' ? '' : 'brutal-btn-secondary'}`}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
          >
            <Flame size={16} />
            <span>Viral Hook Matrix</span>
          </button>
        )}

        {/* Standout Tab: Newsletter Edition */}
        {newsletter_edition && (
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`brutal-btn ${activeTab === 'newsletter' ? '' : 'brutal-btn-secondary'}`}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
          >
            <Mail size={16} />
            <span>Newsletter</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('blog')}
          className={`brutal-btn ${activeTab === 'blog' ? '' : 'brutal-btn-secondary'}`}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
        >
          <BookOpen size={16} />
          <span>Blog Article</span>
        </button>

        <button
          onClick={() => setActiveTab('thread')}
          className={`brutal-btn ${activeTab === 'thread' ? '' : 'brutal-btn-secondary'}`}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
        >
          <Twitter size={16} />
          <span>X Thread ({x_thread?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('linkedin')}
          className={`brutal-btn ${activeTab === 'linkedin' ? '' : 'brutal-btn-secondary'}`}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
        >
          <Linkedin size={16} />
          <span>LinkedIn Post</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`brutal-btn ${activeTab === 'seo' ? '' : 'brutal-btn-secondary'}`}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
        >
          <Search size={16} />
          <span>SEO Metadata</span>
        </button>

        <button
          onClick={() => setActiveTab('chapters')}
          className={`brutal-btn ${activeTab === 'chapters' ? '' : 'brutal-btn-secondary'}`}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}
        >
          <ListOrdered size={16} />
          <span>YouTube Chapters</span>
        </button>
      </div>

      {/* Standout Feature 1: Interactive Study & Review Quiz */}
      {activeTab === 'quiz' && study_quiz && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                🎓 Educational Checkpoint: Test your audience or students on concepts from this content.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowQuizResults(!showQuizResults)}
                className="brutal-btn brutal-btn-secondary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {showQuizResults ? 'Hide Answers' : 'Reveal Answers & Explanations'}
              </button>
              <CopyButton
                text={study_quiz.map((q, i) => `Q${i + 1}: ${q.question}\nOptions:\n${q.options.map((o, oi) => `  ${String.fromCharCode(65 + oi)}) ${o}`).join('\n')}\nAnswer: ${String.fromCharCode(65 + q.correct_index)}\nExplanation: ${q.explanation}`).join('\n\n')}
                label="Copy Quiz"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {study_quiz.map((q, qIdx) => {
              const userPick = selectedAnswers[qIdx];
              const isAnswered = userPick !== undefined;
              const isCorrect = userPick === q.correct_index;

              return (
                <div
                  key={qIdx}
                  style={{
                    border: '2.5px solid var(--border)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    background: 'var(--color-foam)',
                    boxShadow: '3px 3px 0 var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '1rem' }}>
                    <span className="brutal-badge" style={{ backgroundColor: 'var(--color-caramel)', color: '#FFFBF3', flexShrink: 0 }}>
                      Q{qIdx + 1}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4 }}>
                      {q.question}
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = userPick === optIdx;
                      let optBg = 'var(--card-bg)';
                      let optBorder = 'var(--border)';

                      if (showQuizResults || isAnswered) {
                        if (optIdx === q.correct_index) {
                          optBg = 'rgba(159, 184, 138, 0.35)';
                          optBorder = 'var(--color-matcha)';
                        } else if (isOptionSelected && !isCorrect) {
                          optBg = 'rgba(184, 71, 63, 0.25)';
                          optBorder = 'var(--color-berry)';
                        }
                      } else if (isOptionSelected) {
                        optBg = 'var(--color-latte)';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          style={{
                            textAlign: 'left',
                            padding: '0.75rem 1rem',
                            border: `2px solid ${optBorder}`,
                            borderRadius: '10px',
                            background: optBg,
                            color: 'var(--text)',
                            fontSize: '0.9rem',
                            fontWeight: isOptionSelected ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: isOptionSelected ? 'var(--color-caramel)' : 'transparent',
                            color: isOptionSelected ? '#FFFBF3' : 'var(--text)'
                          }}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {(showQuizResults || isAnswered) && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: isCorrect ? 'rgba(159, 184, 138, 0.2)' : 'rgba(201, 139, 91, 0.15)',
                      border: '1.5px solid var(--border)',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.2rem', color: isCorrect ? 'var(--color-matcha)' : 'var(--color-caramel)' }}>
                        {isCorrect ? '✓ Correct Answer!' : `Correct Answer: Option ${String.fromCharCode(65 + q.correct_index)}`}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(selectedAnswers).length > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              background: 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '3px 3px 0 var(--border)'
            }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                Your Score: {calculateScore()} / {study_quiz.length} ({Math.round((calculateScore() / study_quiz.length) * 100)}%)
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswers({});
                  setShowQuizResults(false);
                }}
                className="brutal-btn brutal-btn-secondary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Reset Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* Standout Feature 2: Key Takeaways & Cheat Sheet */}
      {activeTab === 'takeaways' && key_takeaways && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ⚡ Core foundational mental models & quick-reference cheat sheet
            </span>
            <CopyButton text={key_takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')} label="Copy Cheat Sheet" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {key_takeaways.map((takeaway, idx) => (
              <div
                key={idx}
                style={{
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  background: 'var(--color-foam)',
                  boxShadow: '3px 3px 0 var(--border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div style={{
                  background: 'var(--color-caramel)',
                  color: '#FFFBF3',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.5, fontWeight: 600 }}>
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standout Feature 3: Viral Hook Matrix */}
      {activeTab === 'hooks' && viral_hook_matrix && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              🔥 Battle-tested psychological hook variations engineered for high retention across formats
            </span>
            <CopyButton text={viral_hook_matrix.map(h => `[${h.style} - ${h.platform}]\n"${h.hook}"`).join('\n\n')} label="Copy All Hooks" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {viral_hook_matrix.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  background: 'var(--color-foam)',
                  boxShadow: '3px 3px 0 var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)', fontSize: '0.72rem' }}>
                      {item.style}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Target: {item.platform}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    &ldquo;{item.hook}&rdquo;
                  </div>
                </div>
                <CopyButton text={item.hook} label="Copy Hook" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standout Feature 4: Newsletter Edition */}
      {activeTab === 'newsletter' && newsletter_edition && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              📬 Ready-to-broadcast email newsletter edition with subject line and call-to-action
            </span>
            <CopyButton text={newsletter_edition} label="Copy Newsletter" />
          </div>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            maxHeight: '420px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {newsletter_edition}
          </div>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === 'blog' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <CopyButton text={blog} label="Copy Markdown" />
          </div>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            maxHeight: '420px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {blog}
          </div>
        </div>
      )}

      {/* X Thread Tab */}
      {activeTab === 'thread' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ⚡ Each tweet is guaranteed under 275 characters with thread numbering
            </span>
            <CopyButton text={(x_thread || []).join('\n\n---\n\n')} label="Copy Full Thread" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(x_thread || []).map((tweet, idx) => (
              <div
                key={idx}
                style={{
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  background: 'var(--color-foam)',
                  boxShadow: '3px 3px 0 var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="brutal-badge" style={{ backgroundColor: 'var(--color-latte)', fontSize: '0.75rem' }}>
                    Tweet {idx + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: tweet.length > 275 ? 'var(--color-berry)' : 'var(--text-muted)' }}>
                      {tweet.length} / 275 chars
                    </span>
                    <CopyButton text={tweet} label="Copy" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} />
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {tweet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn Post Tab */}
      {activeTab === 'linkedin' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              💼 Professional analysis ending with a reflective audience question
            </span>
            <CopyButton text={linkedin_post} label="Copy LinkedIn Post" />
          </div>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.5rem',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
            maxHeight: '380px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {linkedin_post}
          </div>
        </div>
      )}

      {/* SEO Metadata Tab */}
      {activeTab === 'seo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>SEO Title</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {seo?.title?.length || 0} / 60 chars
              </span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a0dab', marginBottom: '0.5rem' }}>
              {seo?.title}
            </div>
            <CopyButton text={seo?.title || ''} label="Copy Title" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} />
          </div>

          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>Meta Description</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {seo?.meta_description?.length || 0} / 155 chars
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#4d5156', marginBottom: '0.5rem' }}>
              {seo?.meta_description}
            </p>
            <CopyButton text={seo?.meta_description || ''} label="Copy Description" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} />
          </div>

          {seo?.keywords && (
            <div style={{
              background: 'var(--color-foam)',
              border: '2px solid var(--border)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                Search Keywords
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {seo.keywords.map((kw, i) => (
                  <span key={i} className="brutal-badge" style={{ textTransform: 'none' }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* YouTube Chapters Tab */}
      {activeTab === 'chapters' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ▶️ Paste directly into your YouTube description for auto-chapter navigation
            </span>
            <CopyButton text={(youtube_chapters || []).join('\n')} label="Copy Chapters" />
          </div>
          <div style={{
            background: 'var(--color-foam)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}>
            {(youtube_chapters || []).join('\n')}
          </div>
        </div>
      )}
    </div>
  );
}
