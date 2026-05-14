'use client';
import { useState, useCallback } from 'react';
import type { NTSBAccident } from '@/lib/types';

interface HistoryViewProps {
  onIncidentsLoaded: (incidents: NTSBAccident[]) => void;
  scrollerIncident: NTSBAccident | null;
}

type SortKey = 'EventLocalDate' | 'Operator' | 'AircraftMakeModel' | 'HighestInjury' | 'TotalFatalInjuries' | 'AircraftDamage';
type SortDir = 'asc' | 'desc';

const SEV_ORDER: Record<string, number> = { FATAL: 0, SERIOUS: 1, MINOR: 2, NONE: 3, '': 4 };
const DMG_ORDER: Record<string, number> = { DESTROYED: 0, SUBSTANTIAL: 1, MINOR: 2, NONE: 3, '': 4 };

function severityBadge(sev: string | undefined) {
  const s = (sev || '').toUpperCase();
  const [bg, border, color] = s === 'FATAL' ? ['rgba(255,45,45,0.15)', 'var(--danger-red)', 'var(--danger-red)']
    : s === 'SERIOUS' ? ['rgba(255,107,0,0.15)', 'var(--warning-orange)', 'var(--warning-orange)']
    : s === 'MINOR' ? ['rgba(255,179,0,0.1)', 'var(--amber)', 'var(--amber)']
    : ['rgba(0,255,65,0.05)', 'var(--border-green)', 'var(--text-muted)'];
  return <span style={{ background: bg, border: `1px solid ${border}`, color, fontSize: 9, padding: '1px 6px', letterSpacing: '0.1em', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{s || 'N/A'}</span>;
}

function damageBadge(dmg: string | undefined) {
  const d = (dmg || '').toUpperCase();
  const [bg, border, color] = d === 'DESTROYED' ? ['rgba(255,45,45,0.1)', '#ff4444', '#ff6666']
    : d === 'SUBSTANTIAL' ? ['rgba(255,107,0,0.1)', 'var(--warning-orange)', '#ffaa44']
    : d === 'MINOR' ? ['rgba(255,179,0,0.08)', 'var(--amber-dim)', 'var(--amber)']
    : ['rgba(0,255,65,0.04)', 'var(--border-green)', 'var(--text-muted)'];
  return <span style={{ background: bg, border: `1px solid ${border}`, color, fontSize: 9, padding: '1px 6px', letterSpacing: '0.1em' }}>{d || 'N/A'}</span>;
}

function DetailPanel({ incident, onClose }: { incident: NTSBAccident; onClose: () => void }) {
  const ntsbUrl = incident.NtsbNo ? `https://data.ntsb.gov/carol-repgen/api/Aviation/ReportMain/GenerateNewestReport/${incident.EventId}/false` : null;
  const fields = [
    ['NTSB NO.', incident.NtsbNo],
    ['EVENT DATE', incident.EventLocalDate ? new Date(incident.EventLocalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null],
    ['LOCATION', [incident.City, incident.State, incident.Country].filter(Boolean).join(', ')],
    ['OPERATOR', incident.Operator || incident.AirCarrier],
    ['AIRCRAFT', incident.AircraftMakeModel],
    ['REGISTRATION', incident.AircraftRegistration],
    ['FLIGHT PURPOSE', incident.FlightPurpose],
    ['PHASE OF FLIGHT', incident.PhaseOfFlight || incident.BroadPhase],
    ['WEATHER', incident.WeatherCondition],
    ['ENGINE TYPE', incident.EngineType],
    ['NUM ENGINES', incident.NumberOfEngines?.toString()],
    ['DAMAGE', incident.AircraftDamage],
    ['FATAL INJ.', incident.TotalFatalInjuries?.toString()],
    ['SERIOUS INJ.', incident.TotalSeriousInjuries?.toString()],
    ['MINOR INJ.', incident.TotalMinorInjuries?.toString()],
    ['UNINJURED', incident.TotalUninjured?.toString()],
    ['REPORT STATUS', incident.ReportStatus],
  ];

  return (
    <div style={{ flex: '0 0 300px', borderLeft: '1px solid var(--border-green)', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', overflowY: 'auto' }} className="animate-fade-in">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--amber)' }}>INCIDENT DETAIL</div>
        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-green)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ padding: 16, flex: 1 }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {severityBadge(incident.HighestInjury)}
          {damageBadge(incident.AircraftDamage)}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
          {incident.Operator || incident.AirCarrier || 'UNKNOWN'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>
          {incident.AircraftMakeModel} · {[incident.City, incident.State].filter(Boolean).join(', ')}
        </div>
        {fields.map(([label, value]) => value ? (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,255,65,0.06)', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.08em', flexShrink: 0 }}>{label}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 10, textAlign: 'right' }}>{value}</span>
          </div>
        ) : null)}
        {ntsbUrl && (
          <a href={`https://data.ntsb.gov/carol-repgen/api/Aviation/ReportMain/GenerateNewestReport/${incident.EventId}/false`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', marginTop: 16, padding: '8px 12px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid var(--sky-blue)',
              color: 'var(--sky-blue)', fontFamily: 'var(--font-display)', fontSize: 10,
              letterSpacing: '0.15em', textDecoration: 'none', textAlign: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(0,212,255,0.15)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(0,212,255,0.08)'; }}>
            ↗ VIEW NTSB OFFICIAL REPORT
          </a>
        )}
      </div>
    </div>
  );
}

export default function HistoryView({ onIncidentsLoaded, scrollerIncident }: HistoryViewProps) {
  const [results, setResults] = useState<NTSBAccident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<NTSBAccident | null>(scrollerIncident);
  const [sortKey, setSortKey] = useState<SortKey>('EventLocalDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Form state
  const [airline, setAirline] = useState('');
  const [aircraft, setAircraft] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('All');
  const [yearFrom, setYearFrom] = useState('2010');
  const [yearTo, setYearTo] = useState('2024');

  const PAGE_SIZE = 50;

  const search = useCallback(async (pageNum = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        ResultsPerPage: String(PAGE_SIZE),
        StartRow: String(pageNum * PAGE_SIZE),
        ...(airline && { airline }),
        ...(aircraft && { aircraft }),
        ...(location && { location }),
        ...(severity !== 'All' && { severity }),
        ...(yearFrom && { yearFrom }),
        ...(yearTo && { yearTo }),
      });
      const res = await fetch(`/api/ntsb?${params}`);
      const data = await res.json();

      // CAROL API returns { count, results } or variations
      const accidents: NTSBAccident[] = data.results || data.accidents || data.data || [];
      const count = data.count || data.total || accidents.length;

      setResults(accidents);
      setTotalCount(count);
      setPage(pageNum);
      if (pageNum === 0) onIncidentsLoaded(accidents);
    } catch {
      setError('Failed to reach NTSB CAROL API');
    } finally {
      setLoading(false);
    }
  }, [airline, aircraft, location, severity, yearFrom, yearTo, onIncidentsLoaded]);

  const sorted = [...results].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'EventLocalDate') {
      return mul * (new Date(a.EventLocalDate || 0).getTime() - new Date(b.EventLocalDate || 0).getTime());
    }
    if (sortKey === 'TotalFatalInjuries') {
      return mul * ((a.TotalFatalInjuries || 0) - (b.TotalFatalInjuries || 0));
    }
    if (sortKey === 'HighestInjury') {
      return mul * ((SEV_ORDER[a.HighestInjury || ''] ?? 4) - (SEV_ORDER[b.HighestInjury || ''] ?? 4));
    }
    if (sortKey === 'AircraftDamage') {
      return mul * ((DMG_ORDER[a.AircraftDamage || ''] ?? 4) - (DMG_ORDER[b.AircraftDamage || ''] ?? 4));
    }
    const av = String(a[sortKey] || '');
    const bv = String(b[sortKey] || '');
    return mul * av.localeCompare(bv);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const ColHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => toggleSort(k)} style={{ padding: '8px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', color: sortKey === k ? 'var(--radar-green)' : 'var(--text-muted)', fontSize: 9, letterSpacing: '0.12em', borderBottom: '1px solid var(--border-green)', fontWeight: 'normal', background: 'var(--bg-panel)', position: 'sticky', top: 0, zIndex: 5 }}>
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
    </th>
  );

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column' }}>
      {/* Search bar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-green)', background: 'var(--bg-deep)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 10 }}>
          ◉ NTSB CAROL DATABASE QUERY · 1982–PRESENT · ~90,000 RECORDS
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'AIRLINE/OPERATOR', val: airline, set: setAirline, ph: 'e.g. United, Delta...' },
            { label: 'AIRCRAFT MAKE/MODEL', val: aircraft, set: setAircraft, ph: 'e.g. Boeing 737...' },
            { label: 'CITY/STATE', val: location, set: setLocation, ph: 'e.g. Los Angeles...' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                onKeyDown={e => e.key === 'Enter' && search(0)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', color: 'var(--radar-green)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 10px', outline: 'none', width: 180 }} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SEVERITY</label>
            <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', color: 'var(--radar-green)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 10px', outline: 'none', cursor: 'pointer' }}>
              {['All', 'FATAL', 'SERIOUS', 'MINOR', 'NONE'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'YEAR FROM', val: yearFrom, set: setYearFrom },
              { label: 'YEAR TO', val: yearTo, set: setYearTo },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{f.label}</label>
                <input type="number" min="1982" max="2025" value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-green)', color: 'var(--radar-green)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 10px', outline: 'none', width: 80 }} />
              </div>
            ))}
          </div>
          <button onClick={() => search(0)} disabled={loading} style={{
            background: loading ? 'var(--bg-card)' : 'rgba(0,255,65,0.1)', border: '1px solid var(--radar-green)',
            color: 'var(--radar-green)', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.15em',
            padding: '7px 20px', cursor: loading ? 'wait' : 'pointer', alignSelf: 'flex-end',
            boxShadow: loading ? 'none' : '0 0 10px rgba(0,255,65,0.15)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'QUERYING...' : '◈ SEARCH CAROL'}
          </button>
        </div>
        {error && <div style={{ color: 'var(--danger-red)', fontSize: 10, marginTop: 8 }}>⚠ {error}</div>}
        {totalCount > 0 && <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 6 }}>{totalCount.toLocaleString()} RECORDS FOUND · SHOWING {results.length} · PAGE {page + 1}</div>}
      </div>

      {/* Table + Detail */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {results.length === 0 && !loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 8, letterSpacing: '0.2em' }}>CAROL DATABASE READY</div>
              <div>Enter search criteria and click SEARCH CAROL to query the NTSB accident database</div>
              <div style={{ marginTop: 16, fontSize: 10, opacity: 0.6 }}>Searches 90,000+ aviation accidents from 1982 to present</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <ColHeader k="EventLocalDate" label="DATE" />
                  <ColHeader k="Operator" label="OPERATOR" />
                  <ColHeader k="AircraftMakeModel" label="AIRCRAFT" />
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-green)', background: 'var(--bg-panel)', position: 'sticky', top: 0, zIndex: 5, fontWeight: 'normal' }}>LOCATION</th>
                  <ColHeader k="HighestInjury" label="SEVERITY" />
                  <ColHeader k="TotalFatalInjuries" label="FATALS" />
                  <ColHeader k="AircraftDamage" label="DAMAGE" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((inc, i) => {
                  const isSelected = selected?.EventId === inc.EventId;
                  const date = inc.EventLocalDate ? new Date(inc.EventLocalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                  const loc = [inc.City, inc.State].filter(Boolean).join(', ') || inc.Country || '---';
                  return (
                    <tr key={inc.EventId || i} onClick={() => setSelected(isSelected ? null : inc)}
                      style={{
                        background: isSelected ? 'rgba(255,179,0,0.08)' : i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)',
                        cursor: 'pointer', borderBottom: '1px solid rgba(0,255,65,0.06)',
                        borderLeft: isSelected ? '2px solid var(--amber)' : '2px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.02)'; }}
                    >
                      <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{date}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.Operator || inc.AirCarrier || '---'}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.AircraftMakeModel || '---'}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc}</td>
                      <td style={{ padding: '6px 10px' }}>{severityBadge(inc.HighestInjury)}</td>
                      <td style={{ padding: '6px 10px', color: inc.TotalFatalInjuries ? 'var(--danger-red)' : 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
                        {inc.TotalFatalInjuries || '0'}
                      </td>
                      <td style={{ padding: '6px 10px' }}>{damageBadge(inc.AircraftDamage)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div style={{ padding: '12px 20px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid var(--border-green)' }}>
              <button disabled={page === 0 || loading} onClick={() => search(page - 1)} style={{ background: 'transparent', border: '1px solid var(--border-green)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px', cursor: 'pointer' }}>◄ PREV</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, alignSelf: 'center' }}>PAGE {page + 1} / {Math.ceil(totalCount / PAGE_SIZE)}</span>
              <button disabled={(page + 1) * PAGE_SIZE >= totalCount || loading} onClick={() => search(page + 1)} style={{ background: 'transparent', border: '1px solid var(--border-green)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px', cursor: 'pointer' }}>NEXT ►</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && <DetailPanel incident={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
