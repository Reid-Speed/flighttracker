'use client';
import { useEffect, useState, useCallback } from 'react';
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
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');

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
        // Update selected if still in data
        if (selected) {
          const updated = parsed.find(f => f.icao24 === selected.icao24);
          if (updated) setSelected(updated);
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, [onFlightCountChange, selected?.icao24]);

  useEffect(() => {
    fetchFlights();
    const id = setInterval(fetchFlights, 15000);
    return () => clearInterval(id);
  }, [fetchFlights]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Map — 2/3 */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <FlightMap flights={flights} selectedFlight={selected} onSelect={setSelected} />
        {/* Status bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
          background: 'rgba(0,0,0,0.85)', borderTop: '1px solid var(--border-green)',
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px',
          fontSize: 9, fontFamily: 'var(--font-mono)', zIndex: 1000,
        }}>
          <span style={{ color: status === 'live' ? 'var(--radar-green)' : status === 'error' ? 'var(--danger-red)' : 'var(--amber)' }}>
            {status === 'live' ? '◈ LIVE' : status === 'error' ? '⚠ FEED INTERRUPTED' : '○ CONNECTING...'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>SRC: OPENSKY NETWORK</span>
          <span style={{ color: 'var(--text-muted)' }}>REFRESH: 15s</span>
          {lastUpdate && <span style={{ color: 'var(--text-muted)' }}>LAST: {lastUpdate.toLocaleTimeString()}</span>}
          {status === 'error' && <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>OpenSky may rate-limit unauthenticated requests. Data may be partial.</span>}
        </div>
      </div>

      {/* Panel — 1/3 */}
      <div style={{
        flex: 1,
        borderLeft: '1px solid var(--border-green)',
        background: 'var(--bg-deep)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: 380,
        minWidth: 280,
      }}>
        <FlightPanel
          flights={flights}
          selectedFlight={selected}
          onSelect={setSelected}
          lastUpdate={lastUpdate}
        />
      </div>
    </div>
  );
}
