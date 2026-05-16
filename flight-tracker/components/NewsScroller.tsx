'use client';
import { useRef, useEffect } from 'react';
import type { NTSBAccident } from '@/lib/types';

interface NewsScrollerProps {
  incidents: NTSBAccident[];
  loading: boolean;
  onSelect: (i: NTSBAccident) => void;
}

export default function NewsScroller({ incidents, loading, onSelect }: NewsScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation|null>(null);
  const items = incidents.slice(0, 20);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length === 0) return;
    animRef.current?.cancel();
    const anim = el.animate(
      [{ transform:'translateX(0)' }, { transform:'translateX(-50%)' }],
      { duration: Math.max(items.length * 7000, 40000), iterations: Infinity, easing:'linear' }
    );
    animRef.current = anim;
    return () => anim.cancel();
  }, [items.length]);

  const sevColor = (s?: string) => {
    const u = (s||'').toUpperCase();
    return u==='FATAL'?'var(--red)':u==='SERIOUS'?'var(--orange)':u==='MINOR'?'var(--amber)':'var(--text-muted)';
  };

  return (
    <div style={{ height:32, background:'rgba(0,0,0,0.85)', borderBottom:'1.5px solid var(--border)', display:'flex', alignItems:'center', overflow:'hidden', flexShrink:0 }}>
      {/* Label */}
      <div style={{ flexShrink:0, padding:'0 12px', borderRight:'1px solid var(--border)', height:'100%', display:'flex', alignItems:'center', gap:6, minWidth:100, background:'rgba(255,61,61,0.07)' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)', boxShadow:'0 0 6px var(--red)' }} className="blink"/>
        <span style={{ fontFamily:'var(--display)', fontSize:10, letterSpacing:'0.18em', color:'var(--red)', fontWeight:600 }}>INCIDENTS</span>
      </div>
      {/* Ticker */}
      <div style={{ overflow:'hidden', flex:1, height:'100%', display:'flex', alignItems:'center', cursor:'default' }}>
        {loading ? (
          <span style={{ color:'var(--text-muted)', fontSize:12, paddingLeft:16 }}>LOADING INCIDENT FEED...</span>
        ) : items.length === 0 ? (
          <span style={{ color:'var(--text-muted)', fontSize:12, paddingLeft:16 }}>RUN A SEARCH IN INCIDENT HISTORY VIEW TO POPULATE FEED</span>
        ) : (
          <div ref={trackRef} style={{ display:'inline-flex', alignItems:'center', whiteSpace:'nowrap' }}>
            {[...items, ...items].map((inc, i) => {
              const date = inc.EventLocalDate ? new Date(inc.EventLocalDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
              return (
                <span key={i} onClick={() => onSelect(inc)} style={{ display:'inline-flex', alignItems:'center', gap:7, marginRight:36, cursor:'pointer', padding:'2px 0' }}>
                  <span style={{ color:sevColor(inc.HighestInjury), fontSize:10, fontFamily:'var(--display)', letterSpacing:'0.12em', fontWeight:700 }}>
                    [{inc.HighestInjury||'UNK'}]
                  </span>
                  <span style={{ color:'var(--amber)', fontSize:12, fontWeight:600 }}>{date}</span>
                  <span style={{ color:'var(--text)', fontSize:12 }}>
                    {(inc.Operator||inc.AirCarrier||'?').substring(0,28)} — {[inc.City,inc.State].filter(Boolean).join(', ').substring(0,22)||inc.Country||'?'}
                  </span>
                  {inc.AircraftMakeModel && <span style={{ color:'var(--text-muted)', fontSize:11 }}>· {inc.AircraftMakeModel.substring(0,18)}</span>}
                  <span style={{ color:'var(--border)', margin:'0 6px' }}>◆</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
