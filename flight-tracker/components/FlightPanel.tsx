'use client';
import { useEffect, useState } from 'react';
import type { FlightState } from '@/lib/types';

interface FlightPanelProps {
  flights: FlightState[];
  selectedFlight: FlightState | null;
  onSelect: (f: FlightState | null) => void;
  lastUpdate: Date | null;
}

interface RouteInfo {
  origin: string | null;
  originName: string | null;
  destination: string | null;
  destinationName: string | null;
  airline: string | null;
  aircraftType: string | null;
  registration: string | null;
  eta: string | null;
}

function metersToFeet(m: number) { return Math.round(m * 3.28084); }
function msToKnots(ms: number) { return Math.round(ms * 1.94384); }

function fpmToLabel(vr: number | null) {
  if (!vr) return '━━━ LEVEL';
  const fpm = Math.round(vr * 196.85);
  if (fpm > 50) return `▲ ${Math.abs(fpm).toLocaleString()} fpm`;
  if (fpm < -50) return `▼ ${Math.abs(fpm).toLocaleString()} fpm`;
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

function trackLabel(deg: number | null) {
  if (deg === null) return '---';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return `${Math.round(deg)}° ${dirs[Math.round(deg / 22.5) % 16]}`;
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(0,255,65,0.08)', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.1em', flexShrink: 0 }}>{label}</span>
      <span style={{ color: color || 'var(--text-primary)', fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{value || '---'}</span>
    </div>
  );
}

function RouteDisplay({ route, loading }: { route: RouteInfo | null; loading: boolean }) {
  if (loading) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12, textAlign: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.1em' }}>QUERYING ROUTE DATA...</span>
    </div>
  );

  const hasRoute = route?.origin || route?.destination;
  if (!hasRoute) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12, textAlign: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>ROUTE DATA UNAVAILABLE</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12 }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 10, fontFamily: 'var(--font-display)' }}>FLIGHT ROUTE</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Origin */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--sky-blue)', letterSpacing: '0.1em', textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
            {route?.origin || '???'}
          </div>
          {route?.originName && (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, maxWidth: 90, margin: '2px auto 0' }}>
              {route.originName.substring(0, 20)}
            </div>
          )}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>ORIGIN</div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontSize: 18, color: 'var(--radar-green)', opacity: 0.6 }}>✈</div>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, var(--sky-blue), var(--radar-green))' }} />
        </div>

        {/* Destination */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--radar-green)', letterSpacing: '0.1em', textShadow: '0 0 10px rgba(0,255,65,0.3)' }}>
            {route?.destination || '???'}
          </div>
          {route?.destinationName && (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, maxWidth: 90, margin: '2px auto 0' }}>
              {route.destinationName.substring(0, 20)}
            </div>
          )}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>DESTINATION</div>
        </div>
      </div>
      {route?.eta && (
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10, color: 'var(--amber)' }}>
          ETA: {route.eta}
        </div>
      )}
    </div>
  );
}

export default function FlightPanel({ flights, selectedFlight, onSelect, lastUpdate }: FlightPanelProps) {
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!selectedFlight) { setRoute(null); return; }
    setRoute(null);
    setRouteLoading(true);
    const callsign = selectedFlight.callsign;
    const hex = selectedFlight.icao24;
    const params = new URLSearchParams();
    if (callsign) params.set('callsign', callsign);
    if (hex) params.set('hex', hex);
    fetch(`/api/route-info?${params}`)
      .then(r => r.json())
      .then(d => setRoute(d))
      .catch(() => setRoute(null))
      .finally(() => setRouteLoading(false));
  }, [selectedFlight?.icao24]);

  if (selectedFlight) {
    const f = selectedFlight;
    const alt = f.baro_altitude ? metersToFeet(f.baro_altitude) : null;
    const spd = f.velocity ? msToKnots(f.velocity) : null;

    return (
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--amber)', letterSpacing: '0.15em', textShadow: '0 0 12px rgba(255,179,0,0.5)' }}>
              {f.callsign || f.icao24.toUpperCase()}
            </div>
            {f.registration && f.registration !== f.callsign && (
              <div style={{ fontSize: 10, color: 'var(--sky-blue)', letterSpacing: '0.1em' }}>{f.registration}</div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {f.operator || f.origin_country} · ICAO {f.icao24.toUpperCase()}
            </div>
          </div>
          <button onClick={() => onSelect(null)} style={{
            background: 'transparent', border: '1px solid var(--border-green)', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0,
          }}>◄ BACK</button>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            background: f.on_ground ? 'rgba(255,107,0,0.15)' : 'rgba(0,255,65,0.1)',
            border: `1px solid ${f.on_ground ? 'var(--warning-orange)' : 'var(--border-green)'}`,
            color: f.on_ground ? 'var(--warning-orange)' : 'var(--radar-green)',
            fontSize: 9, letterSpacing: '0.15em', padding: '2px 8px', fontFamily: 'var(--font-display)',
          }}>
            {f.on_ground ? 'ON GROUND' : '◈ AIRBORNE'}
          </span>
          {f.aircraft_type && (
            <span style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--sky-blue)', fontSize: 9, letterSpacing: '0.1em', padding: '2px 8px', fontFamily: 'var(--font-display)' }}>
              {f.aircraft_type}
            </span>
          )}
          {f.squawk && (
            <span style={{
              background: f.squawk === '7700' ? 'rgba(255,45,45,0.2)' : f.squawk === '7600' ? 'rgba(255,107,0,0.15)' : 'rgba(0,212,255,0.06)',
              border: `1px solid ${f.squawk === '7700' ? 'var(--danger-red)' : f.squawk === '7600' ? 'var(--warning-orange)' : 'rgba(0,212,255,0.25)'}`,
              color: f.squawk === '7700' ? 'var(--danger-red)' : f.squawk === '7600' ? 'var(--warning-orange)' : 'var(--text-muted)',
              fontSize: 9, letterSpacing: '0.12em', padding: '2px 8px', fontFamily: 'var(--font-display)',
            }}>
              SQK {f.squawk}{f.squawk === '7700' ? ' ⚠ MAYDAY' : f.squawk === '7600' ? ' NORDO' : ''}
            </span>
          )}
        </div>

        {/* Route display */}
        <RouteDisplay route={route} loading={routeLoading} />

        {/* Flight instruments */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'ALTITUDE', value: alt ? `${alt.toLocaleString()} ft` : f.on_ground ? 'GROUND' : '---', color: altColor(f.baro_altitude) },
            { label: 'AIRSPEED', value: spd ? `${spd} kts` : '---', color: 'var(--sky-blue)' },
            { label: 'TRACK', value: trackLabel(f.true_track), color: 'var(--text-primary)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: item.color, fontFamily: 'var(--font-display)', fontSize: 13, textShadow: `0 0 8px ${item.color}` }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Vertical rate */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 10 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>VERTICAL RATE</div>
          <div style={{
            color: !f.vertical_rate ? 'var(--text-muted)'
              : (f.vertical_rate * 196.85) > 50 ? 'var(--radar-green)'
              : (f.vertical_rate * 196.85) < -50 ? 'var(--danger-red)'
              : 'var(--sky-blue)',
            fontFamily: 'var(--font-display)', fontSize: 13,
          }}>
            {fpmToLabel(f.vertical_rate)}
          </div>
        </div>

        {/* Details */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', padding: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>TRACK DATA</div>
          {f.registration && <Row label="REGISTRATION" value={f.registration} />}
          {f.operator && <Row label="OPERATOR" value={f.operator} />}
          {f.aircraft_type && <Row label="AIRCRAFT TYPE" value={f.aircraft_type} />}
          <Row label="CALLSIGN" value={f.callsign || 'N/A'} />
          <Row label="ICAO24" value={f.icao24.toUpperCase()} />
          <Row label="COUNTRY" value={f.origin_country} />
          <Row label="POSITION" value={f.latitude && f.longitude ? `${f.latitude.toFixed(4)}°N ${f.longitude.toFixed(4)}°` : '---'} />
          {f.geo_altitude && <Row label="GEO ALT" value={`${metersToFeet(f.geo_altitude).toLocaleString()} ft`} />}
          <Row label="SPI" value={f.spi ? 'ACTIVE' : 'NORMAL'} color={f.spi ? 'var(--danger-red)' : undefined} />
        </div>

        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
          AIRPLANES.LIVE · {lastUpdate ? lastUpdate.toLocaleTimeString() : '---'}
        </div>
      </div>
    );
  }

  // No flight selected — traffic grid
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.15em' }}>TRAFFIC GRID</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{flights.length} TRACKS</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 68px 56px',
          padding: '6px 16px', borderBottom: '1px solid rgba(0,255,65,0.15)',
          fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em',
          position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 10,
        }}>
          <span>CALLSIGN</span><span>OPERATOR</span><span style={{ textAlign: 'right' }}>ALT ft</span><span style={{ textAlign: 'right' }}>KTS</span>
        </div>
        {flights.slice(0, 300).map((f, i) => {
          const alt = f.baro_altitude ? metersToFeet(f.baro_altitude) : null;
          const spd = f.velocity ? msToKnots(f.velocity) : null;
          return (
            <div key={f.icao24} onClick={() => onSelect(f)} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 68px 56px',
              padding: '5px 16px', borderBottom: '1px solid rgba(0,255,65,0.06)',
              cursor: 'pointer', fontSize: 11,
              background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)')}
            >
              <span style={{ color: 'var(--amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.callsign || f.icao24}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.operator || f.origin_country}
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
            AWAITING TRACK DATA...
          </div>
        )}
      </div>
    </div>
  );
}
