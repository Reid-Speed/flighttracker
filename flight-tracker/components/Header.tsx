'use client';
import { useState, useEffect } from 'react';

interface HeaderProps {
  activeView: 'live' | 'history';
  onViewChange: (v: 'live' | 'history') => void;
  flightCount: number;
}

export default function Header({ activeView, onViewChange, flightCount }: HeaderProps) {
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      background: 'linear-gradient(180deg,#000 0%,var(--bg-deep) 100%)',
      borderBottom: '2px solid var(--border)',
      padding: '0 16px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 100,
      gap: 12,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <svg viewBox="0 0 28 28" width="28" height="28" style={{ flexShrink: 0 }}>
          <circle cx="14" cy="14" r="12" fill="none" stroke="var(--green)" strokeWidth="1" opacity="0.35"/>
          <circle cx="14" cy="14" r="7" fill="none" stroke="var(--green)" strokeWidth="0.5" opacity="0.25"/>
          <line x1="14" y1="2" x2="14" y2="26" stroke="var(--green)" strokeWidth="0.5" opacity="0.2"/>
          <line x1="2" y1="14" x2="26" y2="14" stroke="var(--green)" strokeWidth="0.5" opacity="0.2"/>
          <circle cx="14" cy="14" r="2" fill="var(--green)" opacity="0.9"/>
          <line x1="14" y1="14" x2="24" y2="5" stroke="var(--green)" strokeWidth="1.5" opacity="0.85"
            style={{ transformOrigin:'14px 14px', animation:'radar-sweep 4s linear infinite' }}/>
        </svg>
        <div>
          <div style={{ fontFamily:'var(--display)', fontSize:13, letterSpacing:'0.2em', color:'var(--green)', fontWeight:700, lineHeight:1 }}>
            FLIGHTTRACKER
          </div>
          <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.12em', lineHeight:1.4 }}>
            ATC CONSOLE
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display:'flex', gap:6, flexShrink:0 }}>
        {(['live','history'] as const).map(v => (
          <button key={v} onClick={() => onViewChange(v)} style={{
            background: activeView===v ? 'rgba(0,255,65,0.12)' : 'transparent',
            border: `1.5px solid ${activeView===v ? 'var(--green)' : 'var(--border)'}`,
            color: activeView===v ? 'var(--green)' : 'var(--text-muted)',
            fontFamily:'var(--display)', fontSize:10, letterSpacing:'0.12em',
            padding:'7px 14px', cursor:'pointer', textTransform:'uppercase',
            boxShadow: activeView===v ? '0 0 12px rgba(0,255,65,0.2)' : 'none',
            transition:'all 0.2s', whiteSpace:'nowrap',
          }}>
            {v==='live' ? '◈ LIVE' : '◉ INCIDENTS'}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
        <div style={{ textAlign:'right', display: 'flex', flexDirection:'column', gap:1 }}>
          <div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:'0.1em' }}>TRACKS</div>
          <div style={{ color:'var(--green)', fontFamily:'var(--display)', fontSize:15, fontWeight:600 }}>{flightCount.toLocaleString()}</div>
        </div>
        <div style={{ width:1, height:28, background:'var(--border)' }}/>
        <div style={{ textAlign:'right' }}>
          <div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:'0.1em' }}>UTC</div>
          <div style={{ color:'var(--amber)', fontFamily:'var(--display)', fontSize:14, fontWeight:600 }}>{time}</div>
        </div>
        <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 8px var(--green)' }} className="blink"/>
      </div>
    </header>
  );
}
