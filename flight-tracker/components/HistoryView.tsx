'use client';
import { useState, useCallback, useEffect } from 'react';
import type { NTSBAccident } from '@/lib/types';

interface HistoryViewProps {
  onIncidentsLoaded: (i: NTSBAccident[]) => void;
  scrollerIncident: NTSBAccident | null;
}

type SortKey = 'EventLocalDate'|'Operator'|'AircraftMakeModel'|'HighestInjury'|'TotalFatalInjuries'|'AircraftDamage';
const SEV: Record<string,number> = { FATAL:0, SERIOUS:1, MINOR:2, NONE:3, '':4 };
const DMG: Record<string,number> = { DESTROYED:0, SUBSTANTIAL:1, MINOR:2, NONE:3, '':4 };

const SEV_STYLE: Record<string,[string,string,string]> = {
  FATAL: ['rgba(255,61,61,0.18)','var(--red)','var(--red)'],
  SERIOUS: ['rgba(255,122,0,0.18)','var(--orange)','var(--orange)'],
  MINOR: ['rgba(255,193,7,0.12)','var(--amber)','var(--amber)'],
  NONE: ['rgba(0,255,65,0.06)','var(--border)','var(--text-muted)'],
};
const DMG_STYLE: Record<string,[string,string,string]> = {
  DESTROYED: ['rgba(255,61,61,0.12)','#ff5555','#ff7777'],
  SUBSTANTIAL: ['rgba(255,122,0,0.12)','var(--orange)','#ffaa55'],
  MINOR: ['rgba(255,193,7,0.1)','var(--amber-dim)','var(--amber)'],
  NONE: ['rgba(0,255,65,0.04)','var(--border)','var(--text-muted)'],
};

function Badge({ text, styles }: { text: string; styles?: [string,string,string] }) {
  const [bg,bdr,clr] = styles || ['rgba(0,255,65,0.05)','var(--border)','var(--text-muted)'];
  return <span style={{ background:bg, border:`1.5px solid ${bdr}`, color:clr, fontSize:11, padding:'3px 8px', letterSpacing:'0.1em', fontFamily:'var(--display)', fontWeight:600, borderRadius:2, whiteSpace:'nowrap' }}>{text||'N/A'}</span>;
}

function SevBadge({ v }: { v?: string }) {
  const u = (v||'').toUpperCase();
  return <Badge text={u||'N/A'} styles={SEV_STYLE[u]}/>;
}
function DmgBadge({ v }: { v?: string }) {
  const u = (v||'').toUpperCase().replace('SUBSTANTIAL','SUBST.');
  const key = (v||'').toUpperCase();
  return <Badge text={u||'N/A'} styles={DMG_STYLE[key]}/>;
}

function DetailPanel({ incident, onClose }: { incident: NTSBAccident; onClose: () => void }) {
  const reportUrl = incident.NtsbNo
    ? `https://data.ntsb.gov/carol-repgen/api/Aviation/ReportMain/GenerateNewestReport/${incident.EventId}/false`
    : null;

  const fields: [string, string|number|undefined][] = [
    ['NTSB NO.', incident.NtsbNo],
    ['DATE', incident.EventLocalDate ? new Date(incident.EventLocalDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : undefined],
    ['LOCATION', [incident.City, incident.State, incident.Country].filter(Boolean).join(', ')],
    ['OPERATOR', incident.Operator || incident.AirCarrier],
    ['AIRCRAFT', incident.AircraftMakeModel],
    ['REGISTRATION', incident.AircraftRegistration],
    ['FLIGHT PURPOSE', incident.FlightPurpose],
    ['PHASE', incident.PhaseOfFlight || incident.BroadPhase],
    ['WEATHER', incident.WeatherCondition],
    ['ENGINE TYPE', incident.EngineType],
    ['ENGINES', incident.NumberOfEngines?.toString()],
    ['DAMAGE', incident.AircraftDamage],
    ['FATAL INJ', incident.TotalFatalInjuries?.toString()],
    ['SERIOUS INJ', incident.TotalSeriousInjuries?.toString()],
    ['MINOR INJ', incident.TotalMinorInjuries?.toString()],
    ['UNINJURED', incident.TotalUninjured?.toString()],
    ['STATUS', incident.ReportStatus],
  ];

  return (
    <div style={{ width:'100%', borderTop:'2px solid var(--border)', background:'var(--bg-deep)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`@media(min-width:769px){.detail-panel{width:300px!important;border-top:none!important;border-left:2px solid var(--border)!important;height:100%!important;}}`}</style>
      <div className="detail-panel" style={{ display:'flex', flexDirection:'column', overflowY:'auto', flex:1 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--display)', fontSize:12, letterSpacing:'0.15em', color:'var(--amber)', fontWeight:600 }}>INCIDENT DETAIL</span>
          <button onClick={onClose} style={{ background:'transparent', border:'1.5px solid var(--border)', color:'var(--text-muted)', fontFamily:'var(--mono)', fontSize:14, padding:'4px 10px', cursor:'pointer', borderRadius:2 }}>✕</button>
        </div>
        <div style={{ padding:16, overflowY:'auto', flex:1 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            <SevBadge v={incident.HighestInjury}/>
            <DmgBadge v={incident.AircraftDamage}/>
          </div>
          <div style={{ fontFamily:'var(--display)', fontSize:15, color:'var(--text)', marginBottom:4, fontWeight:700, letterSpacing:'0.05em' }}>
            {incident.Operator || incident.AirCarrier || 'UNKNOWN'}
          </div>
          <div style={{ fontSize:13, color:'var(--text-dim)', marginBottom:16 }}>
            {incident.AircraftMakeModel} · {[incident.City,incident.State].filter(Boolean).join(', ')||incident.Country}
          </div>
          {fields.map(([label, val]) => val !== undefined && val !== '' && val !== '0' ? (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(0,255,65,0.08)', gap:12 }}>
              <span style={{ color:'var(--text-muted)', fontSize:11, letterSpacing:'0.08em', flexShrink:0, fontFamily:'var(--mono)' }}>{label}</span>
              <span style={{ color:'var(--text)', fontSize:12, textAlign:'right', fontFamily:'var(--mono)', fontWeight:500 }}>{val}</span>
            </div>
          ) : null)}
          {reportUrl && (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer" style={{
              display:'block', marginTop:16, padding:'10px 14px',
              background:'rgba(0,212,255,0.1)', border:'1.5px solid var(--blue)',
              color:'var(--blue)', fontFamily:'var(--display)', fontSize:12,
              letterSpacing:'0.12em', textDecoration:'none', textAlign:'center',
              borderRadius:2, fontWeight:600,
            }}>
              ↗ NTSB OFFICIAL REPORT
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryView({ onIncidentsLoaded, scrollerIncident }: HistoryViewProps) {
  const [results, setResults] = useState<NTSBAccident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState<NTSBAccident|null>(scrollerIncident);
  const [sort, setSort] = useState<SortKey>('EventLocalDate');
  const [dir, setDir] = useState<'asc'|'desc'>('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [airline, setAirline] = useState('');
  const [aircraft, setAircraft] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('All');
  const [yearFrom, setYearFrom] = useState('2010');
  const [yearTo, setYearTo] = useState('2025');

  const PAGE = 50;

  const search = useCallback(async (pageNum = 0) => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({
        limit: String(PAGE), offset: String(pageNum*PAGE),
        ...(airline&&{airline}), ...(aircraft&&{aircraft}),
        ...(location&&{location}), ...(severity!=='All'&&{severity}),
        ...(yearFrom&&{yearFrom}), ...(yearTo&&{yearTo}),
      });
      const res = await fetch(`/api/ntsb?${p}`);
      const data = await res.json();
      const accidents: NTSBAccident[] = data.results || data.accidents || data.data || [];
      setResults(accidents);
      setTotalCount(data.count || accidents.length);
      setPage(pageNum);
      setFallback(!!data.fallback);
      if (pageNum===0) onIncidentsLoaded(accidents);
    } catch { setError('Failed to reach NTSB database'); }
    finally { setLoading(false); }
  }, [airline, aircraft, location, severity, yearFrom, yearTo, onIncidentsLoaded]);

  // Auto-load on mount
  useEffect(() => { search(0); }, []);

  const sorted = [...results].sort((a,b) => {
    const m = dir==='asc'?1:-1;
    if (sort==='EventLocalDate') return m*(new Date(a.EventLocalDate||0).getTime()-new Date(b.EventLocalDate||0).getTime());
    if (sort==='TotalFatalInjuries') return m*((a.TotalFatalInjuries||0)-(b.TotalFatalInjuries||0));
    if (sort==='HighestInjury') return m*((SEV[a.HighestInjury||'']??4)-(SEV[b.HighestInjury||'']??4));
    if (sort==='AircraftDamage') return m*((DMG[a.AircraftDamage||'']??4)-(DMG[b.AircraftDamage||'']??4));
    return m*String(a[sort]||'').localeCompare(String(b[sort]||''));
  });

  const toggleSort = (k: SortKey) => { if (sort===k) setDir(d=>d==='asc'?'desc':'asc'); else { setSort(k); setDir('desc'); } };
  const TH = ({ k, label, right }: { k:SortKey; label:string; right?:boolean }) => (
    <th onClick={() => toggleSort(k)} style={{
      padding:'9px 10px', textAlign: right?'right':'left', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
      color: sort===k?'var(--green)':'var(--text-muted)', fontSize:11, letterSpacing:'0.1em',
      borderBottom:'2px solid var(--border)', fontWeight: sort===k?700:400, background:'var(--bg-panel)',
      position:'sticky', top:0, zIndex:5,
    }}>
      {label} {sort===k?(dir==='asc'?'▲':'▼'):''}
    </th>
  );

  const inputStyle: React.CSSProperties = {
    background:'var(--bg-card)', border:'1.5px solid var(--border)', color:'var(--text)',
    fontFamily:'var(--mono)', fontSize:13, padding:'7px 10px', outline:'none',
    width:'100%', borderRadius:2, minWidth:0,
  };

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden', flexDirection:'column' }}>
      <style>{`
        @media(min-width:769px){
          .history-body{flex-direction:row!important;}
          .results-pane{overflow:hidden!important;}
          .detail-panel{width:300px!important;border-top:none!important;border-left:2px solid var(--border)!important;height:100%!important;}
        }
        @media(max-width:768px){
          .filter-grid{grid-template-columns:1fr 1fr!important;}
        }
        input:focus,select:focus{border-color:var(--green)!important;box-shadow:0 0 0 2px rgba(0,255,65,0.15)!important;}
        select option{background:#010a01;color:var(--text);}
      `}</style>

      {/* Search panel */}
      <div style={{ padding:'14px 16px', borderBottom:'2px solid var(--border)', background:'var(--bg-deep)', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--display)', fontSize:11, letterSpacing:'0.2em', color:'var(--text-muted)', marginBottom:12, fontWeight:600 }}>
          ◉ NTSB AVIATION ACCIDENT DATABASE · 1982–PRESENT
          {fallback && <span style={{ color:'var(--amber)', marginLeft:12 }}>⚠ SHOWING SAMPLE DATA · LIVE DB UNREACHABLE</span>}
        </div>
        <div className="filter-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            { label:'AIRLINE / OPERATOR', val:airline, set:setAirline, ph:'e.g. United, Delta…' },
            { label:'AIRCRAFT MAKE/MODEL', val:aircraft, set:setAircraft, ph:'e.g. Boeing 737…' },
            { label:'CITY / STATE', val:location, set:setLocation, ph:'e.g. Los Angeles…' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:5, fontFamily:'var(--mono)' }}>{f.label}</div>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                onKeyDown={e => e.key==='Enter' && search(0)} style={inputStyle}/>
            </div>
          ))}
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:5, fontFamily:'var(--mono)' }}>SEVERITY</div>
            <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
              {['All','FATAL','SERIOUS','MINOR','NONE'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[{ label:'YEAR FROM', val:yearFrom, set:setYearFrom }, { label:'YEAR TO', val:yearTo, set:setYearTo }].map(f => (
              <div key={f.label}>
                <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:5, fontFamily:'var(--mono)' }}>{f.label}</div>
                <input type="number" min="1982" max="2025" value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button onClick={() => search(0)} disabled={loading} style={{
              width:'100%', background: loading?'var(--bg-card)':'rgba(0,255,65,0.12)',
              border:'1.5px solid var(--green)', color:'var(--green)',
              fontFamily:'var(--display)', fontSize:12, letterSpacing:'0.15em',
              padding:'9px 14px', cursor: loading?'wait':'pointer',
              boxShadow: loading?'none':'0 0 12px rgba(0,255,65,0.18)',
              borderRadius:2, fontWeight:700, transition:'all 0.2s',
            }}>
              {loading ? 'QUERYING…' : '◈ SEARCH'}
            </button>
          </div>
        </div>
        {error && <div style={{ color:'var(--red)', fontSize:12, marginTop:10 }}>⚠ {error}</div>}
        {totalCount > 0 && (
          <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:8 }}>
            {totalCount.toLocaleString()} RECORDS · PAGE {page+1} OF {Math.ceil(totalCount/PAGE)}
          </div>
        )}
      </div>

      {/* Results + Detail */}
      <div className="history-body" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        {/* Table */}
        <div className="results-pane" style={{ flex:1, overflowY:'auto', minWidth:0 }}>
          {results.length === 0 && !loading ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
              <div style={{ fontFamily:'var(--display)', fontSize:18, marginBottom:10, letterSpacing:'0.15em', fontWeight:700 }}>DATABASE READY</div>
              <div style={{ fontSize:14 }}>Adjust filters and press SEARCH to query</div>
              <div style={{ fontSize:12, marginTop:8, opacity:0.6 }}>90,000+ aviation accidents from 1982 to present</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  <TH k="EventLocalDate" label="DATE"/>
                  <TH k="Operator" label="OPERATOR"/>
                  <TH k="AircraftMakeModel" label="AIRCRAFT"/>
                  <th style={{ padding:'9px 10px', fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', borderBottom:'2px solid var(--border)', background:'var(--bg-panel)', position:'sticky', top:0, zIndex:5, fontWeight:400 }}>LOCATION</th>
                  <TH k="HighestInjury" label="SEVERITY"/>
                  <TH k="TotalFatalInjuries" label="FATAL" right/>
                  <TH k="AircraftDamage" label="DAMAGE"/>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inc, i) => {
                  const isSel = selected?.EventId===inc.EventId;
                  const date = inc.EventLocalDate ? new Date(inc.EventLocalDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : 'N/A';
                  const loc = [inc.City,inc.State].filter(Boolean).join(', ')||inc.Country||'---';
                  return (
                    <tr key={inc.EventId||i} onClick={() => setSelected(isSel?null:inc)} style={{
                      background: isSel?'rgba(255,193,7,0.08)':i%2===0?'transparent':'rgba(0,255,65,0.025)',
                      cursor:'pointer', borderBottom:'1px solid rgba(0,255,65,0.07)',
                      borderLeft:`3px solid ${isSel?'var(--amber)':'transparent'}`,
                      transition:'background 0.15s',
                    }}
                      onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='var(--bg-hover)'; }}
                      onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background=i%2===0?'transparent':'rgba(0,255,65,0.025)'; }}
                    >
                      <td style={{ padding:'8px 10px', color:'var(--text-dim)', whiteSpace:'nowrap', fontWeight:500 }}>{date}</td>
                      <td style={{ padding:'8px 10px', color:'var(--text)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{inc.Operator||inc.AirCarrier||'---'}</td>
                      <td style={{ padding:'8px 10px', color:'var(--text-dim)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.AircraftMakeModel||'---'}</td>
                      <td style={{ padding:'8px 10px', color:'var(--text-muted)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{loc}</td>
                      <td style={{ padding:'8px 10px' }}><SevBadge v={inc.HighestInjury}/></td>
                      <td style={{ padding:'8px 10px', textAlign:'right', color:inc.TotalFatalInjuries?'var(--red)':'var(--text-muted)', fontFamily:'var(--display)', fontWeight:700, fontSize:14 }}>
                        {inc.TotalFatalInjuries||'0'}
                      </td>
                      <td style={{ padding:'8px 10px' }}><DmgBadge v={inc.AircraftDamage}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {totalCount > PAGE && (
            <div style={{ padding:'14px 20px', display:'flex', gap:10, justifyContent:'center', borderTop:'1px solid var(--border)' }}>
              <button disabled={page===0||loading} onClick={() => search(page-1)} style={{ background:'transparent', border:'1.5px solid var(--border)', color:'var(--text-dim)', fontFamily:'var(--mono)', fontSize:13, padding:'6px 14px', cursor:'pointer', borderRadius:2 }}>◄ PREV</button>
              <span style={{ color:'var(--text-muted)', fontSize:13, alignSelf:'center' }}>{page+1} / {Math.ceil(totalCount/PAGE)}</span>
              <button disabled={(page+1)*PAGE>=totalCount||loading} onClick={() => search(page+1)} style={{ background:'transparent', border:'1.5px solid var(--border)', color:'var(--text-dim)', fontFamily:'var(--mono)', fontSize:13, padding:'6px 14px', cursor:'pointer', borderRadius:2 }}>NEXT ►</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && <DetailPanel incident={selected} onClose={() => setSelected(null)}/>}
      </div>
    </div>
  );
}
