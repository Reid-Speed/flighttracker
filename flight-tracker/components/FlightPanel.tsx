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
  destination: string | null;
  airline: string | null;
  aircraftType: string | null;
  registration: string | null;
}

const ftm = (m: number) => Math.round(m * 3.28084);
const kts = (ms: number) => Math.round(ms * 1.94384);

function altColor(alt: number | null) {
  if (!alt || alt <= 0) return 'var(--orange)';
  const km = alt / 1000;
  if (km > 10) return 'var(--green)';
  if (km > 5) return '#80ff80';
  if (km > 1) return 'var(--amber)';
  return 'var(--orange)';
}

function heading(deg: number | null) {
  if (deg === null) return '---';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return `${Math.round(deg)}° ${dirs[Math.round(deg/22.5)%16]}`;
}

function vRate(vr: number | null) {
  if (!vr) return { label: '━ LEVEL', color: 'var(--text-dim)' };
  const fpm = Math.round(vr * 196.85);
  if (fpm > 100) return { label: `▲ ${fpm.toLocaleString()} fpm`, color: 'var(--green)' };
  if (fpm < -100) return { label: `▼ ${Math.abs(fpm).toLocaleString()} fpm`, color: 'var(--red)' };
  return { label: '━ LEVEL', color: 'var(--text-dim)' };
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid rgba(0,255,65,0.1)', gap:12 }}>
      <span style={{ color:'var(--text-muted)', fontSize:12, letterSpacing:'0.08em', flexShrink:0, fontFamily:'var(--mono)' }}>{label}</span>
      <span style={{ color: color||'var(--text)', fontSize:13, fontFamily:'var(--mono)', textAlign:'right', fontWeight:500 }}>{value||'---'}</span>
    </div>
  );
}

export default function FlightPanel({ flights, selectedFlight, onSelect, lastUpdate }: FlightPanelProps) {
  const [route, setRoute] = useState<RouteInfo|null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!selectedFlight) { setRoute(null); return; }
    setRoute(null);
    setRouteLoading(true);
    const p = new URLSearchParams();
    if (selectedFlight.callsign) p.set('callsign', selectedFlight.callsign);
    if (selectedFlight.icao24) p.set('hex', selectedFlight.icao24);
    fetch(`/api/route-info?${p}`)
      .then(r => r.json()).then(d => setRoute(d)).catch(() => setRoute(null))
      .finally(() => setRouteLoading(false));
  }, [selectedFlight?.icao24]);

  // ── SELECTED FLIGHT DETAIL ──
  if (selectedFlight) {
    const f = selectedFlight;
    const alt = f.baro_altitude ? ftm(f.baro_altitude) : null;
    const spd = f.velocity ? kts(f.velocity) : null;
    const vr = vRate(f.vertical_rate);
    const hasRoute = route?.origin || route?.destination;

    return (
      <div style={{ width:'100%', height:'100%', overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }} className="fade-in">

        {/* Back + title */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
          <div>
            <div style={{ fontFamily:'var(--display)', fontSize:22, color:'var(--amber)', letterSpacing:'0.12em', textShadow:'0 0 14px rgba(255,193,7,0.5)', fontWeight:700, lineHeight:1.1 }}>
              {f.callsign || f.icao24.toUpperCase()}
            </div>
            {f.registration && (
              <div style={{ fontSize:13, color:'var(--blue)', letterSpacing:'0.1em', marginTop:3 }}>{f.registration}</div>
            )}
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2, letterSpacing:'0.07em' }}>
              {f.operator || f.origin_country} · {f.icao24.toUpperCase()}
            </div>
          </div>
          <button onClick={() => onSelect(null)} style={{
            background:'transparent', border:'1.5px solid var(--border)', color:'var(--text-dim)',
            fontFamily:'var(--mono)', fontSize:13, padding:'6px 12px', cursor:'pointer',
            letterSpacing:'0.08em', flexShrink:0, borderRadius:2,
          }}>◄ BACK</button>
        </div>

        {/* Status badges */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{
            background: f.on_ground ? 'rgba(255,122,0,0.18)' : 'rgba(0,255,65,0.1)',
            border:`1.5px solid ${f.on_ground ? 'var(--orange)' : 'var(--green)'}`,
            color: f.on_ground ? 'var(--orange)' : 'var(--green)',
            fontSize:11, letterSpacing:'0.12em', padding:'4px 10px', fontFamily:'var(--display)', borderRadius:2, fontWeight:600,
          }}>
            {f.on_ground ? '▪ ON GROUND' : '◈ AIRBORNE'}
          </span>
          {f.aircraft_type && (
            <span style={{ background:'rgba(0,212,255,0.1)', border:'1.5px solid rgba(0,212,255,0.35)', color:'var(--blue)', fontSize:11, letterSpacing:'0.1em', padding:'4px 10px', fontFamily:'var(--display)', borderRadius:2 }}>
              {f.aircraft_type}
            </span>
          )}
          {f.squawk && (
            <span style={{
              background: f.squawk==='7700' ? 'rgba(255,61,61,0.2)' : 'rgba(0,212,255,0.08)',
              border:`1.5px solid ${f.squawk==='7700' ? 'var(--red)' : f.squawk==='7600' ? 'var(--orange)' : 'rgba(0,212,255,0.3)'}`,
              color: f.squawk==='7700' ? 'var(--red)' : f.squawk==='7600' ? 'var(--orange)' : 'var(--text-muted)',
              fontSize:11, padding:'4px 10px', fontFamily:'var(--display)', borderRadius:2, letterSpacing:'0.1em',
            }}>
              SQK {f.squawk}{f.squawk==='7700' ? ' ⚠ MAYDAY' : f.squawk==='7600' ? ' NORDO' : ''}
            </span>
          )}
        </div>

        {/* Route */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', padding:14, borderRadius:2 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.15em', marginBottom:12, fontFamily:'var(--display)', fontWeight:600 }}>FLIGHT ROUTE</div>
          {routeLoading ? (
            <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, padding:'8px 0' }}>QUERYING ROUTE...</div>
          ) : hasRoute ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
              <div style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontFamily:'var(--display)', fontSize:26, color:'var(--blue)', letterSpacing:'0.08em', textShadow:'0 0 12px rgba(0,212,255,0.4)', fontWeight:700 }}>
                  {route?.origin || '???'}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, letterSpacing:'0.08em' }}>ORIGIN</div>
              </div>
              <div style={{ textAlign:'center', padding:'0 4px' }}>
                <div style={{ fontSize:20, color:'var(--green)', opacity:0.7 }}>✈</div>
                <div style={{ width:36, height:1.5, background:'linear-gradient(90deg,var(--blue),var(--green))', margin:'4px auto 0' }}/>
              </div>
              <div style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontFamily:'var(--display)', fontSize:26, color:'var(--green)', letterSpacing:'0.08em', textShadow:'0 0 12px rgba(0,255,65,0.3)', fontWeight:700 }}>
                  {route?.destination || '???'}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, letterSpacing:'0.08em' }}>DESTINATION</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:13, padding:'8px 0' }}>
              ROUTE BROADCAST NOT AVAILABLE
              <div style={{ fontSize:11, marginTop:4, opacity:0.6 }}>Most GA & cargo flights don't broadcast route</div>
            </div>
          )}
        </div>

        {/* Instruments */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', padding:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            { label:'ALTITUDE', value: alt ? `${alt.toLocaleString()}` : f.on_ground ? 'GND' : '---', unit: alt ? 'ft' : '', color: altColor(f.baro_altitude) },
            { label:'AIRSPEED', value: spd ? `${spd}` : '---', unit: spd ? 'kts' : '', color:'var(--blue)' },
            { label:'HEADING', value: heading(f.true_track), unit:'', color:'var(--text)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign:'center' }}>
              <div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:'0.12em', marginBottom:5, fontFamily:'var(--mono)' }}>{item.label}</div>
              <div style={{ color:item.color, fontFamily:'var(--display)', fontSize:17, fontWeight:700, textShadow:`0 0 8px ${item.color}`, lineHeight:1.1 }}>{item.value}</div>
              {item.unit && <div style={{ color:item.color, fontSize:10, opacity:0.7, marginTop:2 }}>{item.unit}</div>}
            </div>
          ))}
        </div>

        {/* Vertical rate */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', padding:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ color:'var(--text-muted)', fontSize:11, letterSpacing:'0.12em', fontFamily:'var(--mono)' }}>VERTICAL RATE</span>
          <span style={{ color:vr.color, fontFamily:'var(--display)', fontSize:15, fontWeight:600 }}>{vr.label}</span>
        </div>

        {/* Data rows */}
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border)', padding:'4px 14px 8px' }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.15em', padding:'10px 0 6px', fontFamily:'var(--display)', fontWeight:600 }}>TRANSPONDER DATA</div>
          {f.registration && <DataRow label="REG" value={f.registration}/>}
          {f.operator && <DataRow label="OPERATOR" value={f.operator}/>}
          {f.aircraft_type && <DataRow label="TYPE" value={f.aircraft_type}/>}
          <DataRow label="ICAO24" value={f.icao24.toUpperCase()}/>
          <DataRow label="COUNTRY" value={f.origin_country}/>
          {f.latitude && f.longitude && <DataRow label="POSITION" value={`${f.latitude.toFixed(3)}°N  ${f.longitude.toFixed(3)}°`}/>}
          {f.geo_altitude && <DataRow label="GEO ALT" value={`${ftm(f.geo_altitude).toLocaleString()} ft`}/>}
          <DataRow label="SPI" value={f.spi ? 'ACTIVE' : 'NORMAL'} color={f.spi ? 'var(--red)' : undefined}/>
        </div>

        <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', letterSpacing:'0.08em', paddingBottom:4 }}>
          AIRPLANES.LIVE · {lastUpdate?.toLocaleTimeString()||'--'}
        </div>
      </div>
    );
  }

  // ── TRAFFIC GRID ──
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1.5px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontFamily:'var(--display)', fontSize:12, letterSpacing:'0.15em', fontWeight:600 }}>TRAFFIC GRID</span>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{flights.length} TRACKS · TAP TO FOCUS</span>
      </div>
      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 72px 58px', padding:'7px 16px', borderBottom:'1px solid rgba(0,255,65,0.18)', fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', fontFamily:'var(--mono)', position:'sticky', top:0, background:'var(--bg-panel)', zIndex:10, flexShrink:0 }}>
        <span>CALLSIGN</span><span>OPERATOR</span><span style={{ textAlign:'right' }}>ALT ft</span><span style={{ textAlign:'right' }}>KTS</span>
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {flights.slice(0,300).map((f,i) => {
          const alt = f.baro_altitude ? ftm(f.baro_altitude) : null;
          const spd = f.velocity ? kts(f.velocity) : null;
          return (
            <div key={f.icao24} onClick={() => onSelect(f)} style={{
              display:'grid', gridTemplateColumns:'90px 1fr 72px 58px',
              padding:'8px 16px', borderBottom:'1px solid rgba(0,255,65,0.07)',
              cursor:'pointer', background: i%2===0 ? 'transparent' : 'rgba(0,255,65,0.025)',
              transition:'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background='var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background=i%2===0?'transparent':'rgba(0,255,65,0.025)')}
            >
              <span style={{ color:'var(--amber)', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>
                {f.callsign||f.icao24}
              </span>
              <span style={{ color:'var(--text-dim)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {f.operator||f.origin_country}
              </span>
              <span style={{ textAlign:'right', color:altColor(f.baro_altitude), fontSize:12, fontWeight:500 }}>
                {alt ? alt.toLocaleString() : f.on_ground?'GND':'---'}
              </span>
              <span style={{ textAlign:'right', color:'var(--blue)', fontSize:12 }}>
                {spd||'---'}
              </span>
            </div>
          );
        })}
        {flights.length===0 && (
          <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>AWAITING TRACK DATA...</div>
        )}
      </div>
    </div>
  );
}
