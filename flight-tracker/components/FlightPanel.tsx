'use client';
import type { FlightState } from '@/lib/types';

interface FlightPanelProps {
  flights: FlightState[];
  selectedFlight: FlightState | null;
  onSelect: (f: FlightState | null) => void;
  lastUpdate: Date | null;
}

function metersToFeet(m: number) { return Math.round(m * 3.28084); }
function msToKnots(ms: number) { return Math.round(ms * 1.94384); }
function fpmToLabel(fpm: number | null) {
  if (!fpm) return '━━━';
  if (fpm > 50) return `▲ ${Math.abs(Math.round(fpm * 196.85))} fpm`;
  if (fpm < -50) return `▼ ${Math.abs(Math.round(fpm * 196.85))} fpm`;
  return '━━━ LEVEL';
}

function altColor(alt: number | null) {
  if (!alt) return 'var(--warning-orange)';
  const km = alt / 1000;
  if (km > 10) return 'var(--radar-green)';
  if (km > 5) return '#80ff80';
  if (km > 1) return 'var(--amber)';
  return 'var(--warning-orange)';
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(0,255,65,0.08)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ color: color || 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{value || '---'}</span>
    </div>
  );
}

function trackLabel(deg: number | null) {
  if (deg === null) return '---';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return `${Math.round(deg)}° ${dirs[Math.round(deg / 45) % 8]}`;
}

export default function FlightPanel({ flights, selectedFlight, onSelect, lastUpdate }: FlightPanelProps) {
  if (selectedFlight) {
    const f = selectedFlight;
    const alt = f.baro_altitude ? metersToFeet(f.baro_altitude) : null;
    const spd = f.velocity ? msToKnots(f.velocity) : null;

    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--amber)', letterSpacing: '0.15em', textShadow: '0 0 12px rgba(255,179,0,0.5)' }}>
              {f.callsign || f.icao24.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              ICAO: {f.icao24.toUpperCase()} · {f.origin_country}
            </div>
          </div>
          <button onClick={() => onSelect(null)} style={{
            background: 'transparent', border: '1px solid var(--border-green)', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.1em',
          }}>◄ BACK</button>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            background: f.on_ground ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,65,0.1)',
            border: `1px solid ${f.on_ground ? 'var(--warning-orange)' : 'var(--border-green)'}`,
            color: f.on_ground ? 'var(--warning-orange)' : 'var(--radar-green)',
            fontSize: 9, letterSpacing: '0.15em', padding: '2px 8px', fontFamily: 'var(--font-display)',
          }}>
            {f.on_ground ? 'ON GROUND' : '◈ AIRBORNE'}
          </span>
          {f.squawk && (
            <span style={{
              background: f.squawk === '7700' ? 'rgba(255,45,45,0.2)' : f.squawk === '7600' ? 'rgba(255,107,0,0.15)' : 'rgba(0,212,255,0.1)',
              border: `1px solid ${f.squawk === '7700' ? 'var(--danger-red)' : f.squawk === '7600' ? 'var(--warning-orange)' : 'var(--sky-blue)'}`,
              color: f.squawk === '7700' ? 'var(--danger-red)' : f.squawk === '7600' ? 'var(--warning-orange)' : 'var(--sky-blue)',
              fontSize: 9, letterSpacing: '0.15em', padding: '2px 8px', fontFamily: 'var(--font-display)',
            }}>
              SQK {f.squawk}{f.squawk === '7700' ? ' MAYDAY' : f.squawk === '7600' ? ' NORDO' : ''}
            </span>
          )}
        </div>

        {/* Altitude speedometer */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'ALTITUDE', value: alt ? `${alt.toLocaleString()} ft` : 'GND', color: altColor(f.baro_altitude) },
            { label: 'AIRSPEED', value: spd ? `${spd} kts` : '---', color: 'var(--sky-blue)' },
            { label: 'TRACK', value: trackLabel(f.true_track), color: 'var(--text-primary)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: item.color, fontFamily: 'var(--font-display)', fontSize: 14, textShadow: `0 0 8px ${item.color}` }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Vertical rate */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>VERTICAL RATE</div>
          <div style={{
            color: !f.vertical_rate ? 'var(--text-muted)' : f.vertical_rate > 50 ? 'var(--radar-green)' : f.vertical_rate < -50 ? 'var(--danger-red)' : 'var(--sky-blue)',
            fontFamily: 'var(--font-display)', fontSize: 13
          }}>
            {fpmToLabel(f.vertical_rate)}
          </div>
        </div>

        {/* Details */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>TRACK DATA</div>
          <Row label="CALLSIGN" value={f.callsign || 'N/A'} />
          <Row label="ICAO24" value={f.icao24.toUpperCase()} />
          <Row label="COUNTRY" value={f.origin_country} />
          <Row label="POSITION" value={f.latitude && f.longitude ? `${f.latitude.toFixed(4)}°N ${f.longitude.toFixed(4)}°` : '---'} />
          <Row label="GEO ALT" value={f.geo_altitude ? `${metersToFeet(f.geo_altitude).toLocaleString()} ft` : '---'} />
          <Row label="SPI" value={f.spi ? 'ACTIVE' : 'NORMAL'} color={f.spi ? 'var(--danger-red)' : undefined} />
          <Row label="SRC" value={['ADS-B', 'ASTERIX', 'MLAT', 'FLARM'][f.position_source] || 'UNKNOWN'} />
        </div>

        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
          DATA VIA OPENSKY NETWORK · {lastUpdate ? lastUpdate.toLocaleTimeString() : '---'}
        </div>
      </div>
    );
  }

  // No flight selected — show grid
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.15em' }}>TRAFFIC GRID</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{flights.length} TRACKS · CLICK TO FOCUS</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Grid header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 70px 70px',
          padding: '6px 16px', borderBottom: '1px solid rgba(0,255,65,0.15)',
          fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', position: 'sticky', top: 0,
          background: 'var(--bg-panel)', zIndex: 10,
        }}>
          <span>CALLSIGN</span><span>COUNTRY</span><span style={{textAlign:'right'}}>ALT ft</span><span style={{textAlign:'right'}}>KTS</span>
        </div>
        {flights.slice(0, 200).map((f, i) => {
          const alt = f.baro_altitude ? metersToFeet(f.baro_altitude) : null;
          const spd = f.velocity ? msToKnots(f.velocity) : null;
          return (
            <div key={f.icao24} onClick={() => onSelect(f)}
              style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 70px 70px',
                padding: '5px 16px',
                borderBottom: '1px solid rgba(0,255,65,0.06)',
                cursor: 'pointer',
                fontSize: 11,
                background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)')}
            >
              <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.callsign || f.icao24}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.origin_country}
              </span>
              <span style={{ textAlign: 'right', color: altColor(f.baro_altitude), fontSize: 10 }}>
                {alt ? alt.toLocaleString() : f.on_ground ? 'GND' : '---'}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--sky-blue)', fontSize: 10 }}>
                {spd || '---'}
              </span>
            </div>
          );
        })}
        {flights.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
            AWAITING DATA FROM OPENSKY NETWORK...
          </div>
        )}
      </div>
    </div>
  );
}
