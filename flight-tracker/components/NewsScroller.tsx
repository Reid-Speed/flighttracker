'use client';
import { useEffect, useRef, useState } from 'react';
import type { NTSBAccident } from '@/lib/types';

interface NewsScrollerProps {
  incidents: NTSBAccident[];
  loading: boolean;
  onSelect: (incident: NTSBAccident) => void;
}

export default function NewsScroller({ incidents, loading, onSelect }: NewsScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const animRef = useRef<Animation | null>(null);

  const items = incidents.slice(0, 20);

  useEffect(() => {
    if (!scrollRef.current || items.length === 0) return;
    const el = scrollRef.current;
    if (animRef.current) animRef.current.cancel();
    if (!paused) {
      const anim = el.animate(
        [{ transform: 'translateX(0%)' }, { transform: 'translateX(-50%)' }],
        { duration: items.length * 6000, iterations: Infinity, easing: 'linear' }
      );
      animRef.current = anim;
    }
    return () => animRef.current?.cancel();
  }, [items.length, paused]);

  const formatItem = (inc: NTSBAccident, idx: number) => {
    const date = inc.EventLocalDate ? new Date(inc.EventLocalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const severity = inc.HighestInjury || 'UNK';
    const sevColor = severity === 'FATAL' ? 'var(--danger-red)' : severity === 'SERIOUS' ? 'var(--warning-orange)' : severity === 'MINOR' ? 'var(--amber)' : 'var(--text-muted)';
    const operator = inc.Operator || inc.AirCarrier || 'UNKNOWN OPERATOR';
    const location = [inc.City, inc.State].filter(Boolean).join(', ') || inc.Country || 'UNKNOWN LOC';

    return (
      <span key={`${idx}-${inc.EventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginRight: 40, whiteSpace: 'nowrap' }}
        onClick={() => { setPaused(true); onSelect(inc); setTimeout(() => setPaused(false), 3000); }}>
        <span style={{ color: sevColor, fontSize: 9, fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}>[{severity}]</span>
        <span style={{ color: 'var(--amber)', fontSize: 10 }}>{date}</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 10 }}>{operator.substring(0, 30)} — {location}</span>
        {inc.AircraftMakeModel && <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>· {inc.AircraftMakeModel.substring(0, 20)}</span>}
        <span style={{ color: 'var(--border-green)', margin: '0 8px' }}>◆</span>
      </span>
    );
  };

  return (
    <div style={{
      height: 34,
      background: 'rgba(0,0,0,0.8)',
      borderBottom: '1px solid var(--border-green)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{
        flexShrink: 0,
        padding: '0 12px',
        borderRight: '1px solid var(--border-green)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(0,255,65,0.05)',
        minWidth: 120,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger-red)', boxShadow: '0 0 6px var(--danger-red)', animation: 'blink 1s step-end infinite' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--danger-red)' }}>INCIDENTS</span>
      </div>

      {/* Scrolling content */}
      <div style={{ overflow: 'hidden', flex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
        {loading ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 10, paddingLeft: 16 }}>LOADING NTSB FEED...</span>
        ) : items.length === 0 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 10, paddingLeft: 16 }}>NO RECENT INCIDENTS LOADED · RUN A SEARCH IN HISTORY VIEW</span>
        ) : (
          <div ref={scrollRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {[...items, ...items].map((inc, i) => formatItem(inc, i))}
          </div>
        )}
      </div>
    </div>
  );
}
