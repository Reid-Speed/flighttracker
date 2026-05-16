'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import FlightPanel from './FlightPanel';
import type { FlightState } from '@/lib/types';
import { parseFlightStates } from '@/lib/types';

const FlightMap = dynamic(() => import('./FlightMap'), { ssr: false });

interface LiveViewProps {
  onFlightCountChange: (n: number) => void;
}

export default function LiveView({ onFlightCountChange }: LiveViewProps) {
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [selected, setSelected] = useState<FlightState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [status, setStatus] = useState<'loading'|'live'|'error'>('loading');
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch('/api/flights');
      const data = await res.json();
      if (data.states && Array.isArray(data.states)) {
        const parsed = parseFlightStates(data.states);
        setFlights(parsed);
        onFlightCountChange(parsed.length);
        setLastUpdate(new Date());
        setStatus('live');
        if (selectedRef.current) {
          const updated = parsed.find(f => f.icao24 === selectedRef.current!.icao24);
          if (updated) setSelected(updated);
        }
      } else {
        setStatus('error');
      }
    } catch { setStatus('error'); }
  }, [onFlightCountChange]);

  useEffect(() => {
    fetchFlights();
    const id = setInterval(fetchFlights, 15000);
    return () => clearInterval(id);
  }, [fetchFlights]);

  // Mobile: stack vertically (map top, panel bottom)
  // Desktop: side-by-side (map 2/3, panel 1/3)
  return (
    <div style={{
      flex:1, display:'flex',
      flexDirection:'column',
      overflow:'hidden',
    }}>
      <style>{`
        @media (min-width: 769px) {
          .live-layout { flex-direction: row !important; }
          .map-pane { flex: 2 !important; height: 100% !important; min-height: unset !important; }
          .panel-pane { flex: 1 !important; max-width: 380px !important; min-width: 280px !important; height: 100% !important; max-height: unset !important; }
        }
      `}</style>
      <div className="live-layout" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Map */}
        <div className="map-pane" style={{ position:'relative', minHeight:300, height:'55vw', maxHeight:'calc(100vh - 56px - 34px - 280px)' }}>
          <FlightMap flights={flights} selectedFlight={selected} onSelect={setSelected}/>
          {/* Status strip */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:26,
            background:'rgba(0,0,0,0.88)', borderTop:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:16, padding:'0 12px',
            fontSize:11, fontFamily:'var(--mono)', zIndex:1000,
          }}>
            <span style={{ color: status==='live'?'var(--green)':status==='error'?'var(--red)':'var(--amber)' }}>
              {status==='live'?'◈ LIVE':status==='error'?'⚠ INTERRUPTED':'○ CONNECTING'}
            </span>
            <span style={{ color:'var(--text-muted)' }}>AIRPLANES.LIVE · 15s</span>
            {lastUpdate && <span style={{ color:'var(--text-muted)' }}>{lastUpdate.toLocaleTimeString()}</span>}
          </div>
        </div>

        {/* Panel */}
        <div className="panel-pane" style={{
          borderTop:'2px solid var(--border)',
          background:'var(--bg-deep)',
          display:'flex', flexDirection:'column',
          overflow:'hidden',
          maxHeight: 420,
        }}>
          <FlightPanel flights={flights} selectedFlight={selected} onSelect={setSelected} lastUpdate={lastUpdate}/>
        </div>
      </div>
    </div>
  );
}
