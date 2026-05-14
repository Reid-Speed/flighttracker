'use client';
import { useState, useEffect } from 'react';

interface HeaderProps {
  activeView: 'live' | 'history';
  onViewChange: (v: 'live' | 'history') => void;
  flightCount: number;
}

export default function Header({ activeView, onViewChange, flightCount }: HeaderProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toUTCString().slice(17, 25));
      setDate(now.toUTCString().slice(5, 16).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      background: 'linear-gradient(180deg, #000 0%, var(--bg-deep) 100%)',
      borderBottom: '1px solid var(--border-green)',
      padding: '0 20px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 32, height: 32 }}>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none" stroke="var(--radar-green)" strokeWidth="1" opacity="0.4"/>
            <circle cx="16" cy="16" r="9" fill="none" stroke="var(--radar-green)" strokeWidth="0.5" opacity="0.3"/>
            <circle cx="16" cy="16" r="4" fill="none" stroke="var(--radar-green)" strokeWidth="0.5" opacity="0.3"/>
            <line x1="16" y1="2" x2="16" y2="30" stroke="var(--radar-green)" strokeWidth="0.5" opacity="0.2"/>
            <line x1="2" y1="16" x2="30" y2="16" stroke="var(--radar-green)" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="16" cy="16" r="2" fill="var(--radar-green)" opacity="0.8"/>
            {/* Sweep line */}
            <line x1="16" y1="16" x2="28" y2="6" stroke="var(--radar-green)" strokeWidth="1.5" opacity="0.9"
              style={{ transformOrigin: '16px 16px', animation: 'radar-sweep 4s linear infinite' }}/>
          </svg>
          <style>{`@keyframes radar-sweep { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--radar-green)', fontWeight: 700 }}>
            FLIGHTTRACKER
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            ATC SURVEILLANCE CONSOLE v2.4
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {(['live', 'history'] as const).map(v => (
          <button key={v} onClick={() => onViewChange(v)} style={{
            background: activeView === v ? 'rgba(0,255,65,0.1)' : 'transparent',
            border: `1px solid ${activeView === v ? 'var(--radar-green)' : 'var(--border-green)'}`,
            color: activeView === v ? 'var(--radar-green)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.15em',
            padding: '6px 16px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            boxShadow: activeView === v ? '0 0 12px rgba(0,255,65,0.2), inset 0 0 8px rgba(0,255,65,0.05)' : 'none',
          }}>
            {v === 'live' ? '◈ LIVE TRAFFIC' : '◉ INCIDENT HISTORY'}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.1em' }}>TRACKS ACTIVE</div>
          <div style={{ color: 'var(--radar-green)', fontFamily: 'var(--font-display)', fontSize: 13 }}>{flightCount.toLocaleString()}</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-green)' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.1em' }}>UTC</div>
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)', fontSize: 13 }}>{time}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{date}</div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--radar-green)', boxShadow: '0 0 8px var(--radar-green)', animation: 'blink 1.5s ease infinite' }} />
      </div>
    </header>
  );
}
