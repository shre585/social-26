import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Moon, Sun, LayoutDashboard, Home as HomeIcon } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <nav style={{
      borderBottom: 'var(--border-width) solid var(--border)',
      background: 'var(--card-bg)',
      padding: '0.85rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            background: 'var(--color-caramel)',
            color: '#FFFBF3',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0 var(--border)'
          }}>
            <Zap size={22} fill="#FFFBF3" />
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.03em'
          }}>
            repurposer
          </span>
          <span className="brutal-badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
            v1.0
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to="/"
            className={`brutal-btn brutal-btn-secondary ${location.pathname === '/' ? 'active' : ''}`}
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.88rem',
              borderWidth: '2px',
              boxShadow: '3px 3px 0 var(--border)'
            }}
          >
            <HomeIcon size={16} />
            <span>Create</span>
          </Link>

          <Link
            to="/dashboard"
            className="brutal-btn brutal-btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.88rem',
              borderWidth: '2px',
              boxShadow: '3px 3px 0 var(--border)'
            }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="brutal-btn brutal-btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.88rem',
              borderWidth: '2px',
              boxShadow: '3px 3px 0 var(--border)',
              cursor: 'pointer'
            }}
            aria-label="Toggle color theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </nav>
  );
}
