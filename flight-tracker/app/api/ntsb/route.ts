import { NextRequest, NextResponse } from 'next/server';

// Community PostgREST API backed by NTSB data - no auth required
const BASE = 'http://aviationaccident.info:3000/accidents';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  params.set('order', 'eventdate.desc.nullslast');
  params.set('limit', searchParams.get('limit') || '50');
  params.set('offset', searchParams.get('offset') || '0');

  const airline = searchParams.get('airline');
  if (airline) params.set('aircarrier', `ilike.*${airline}*`);

  const aircraft = searchParams.get('aircraft');
  if (aircraft) {
    // aircraft maps to make+model — search both via full text
    params.set('make', `ilike.*${aircraft}*`);
  }

  const location = searchParams.get('location');
  if (location) params.set('location', `ilike.*${location}*`);

  const severity = searchParams.get('severity');
  if (severity && severity !== 'All') {
    if (severity === 'FATAL') params.set('injuryseverity', 'eq.Fatal');
    else params.set('injuryseverity', 'eq.Non-Fatal');
  }

  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');
  if (yearFrom) params.set('eventdate', `gte.${yearFrom}-01-01`);
  if (yearTo) {
    // PostgREST can only have one condition per field via params — use range header instead
    // We'll filter client-side for yearTo if yearFrom is also set
  }

  try {
    const url = `${BASE}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlightTracker/1.0',
        'Range-Unit': 'items',
        'Prefer': 'count=exact',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('NTSB API error:', res.status, text);
      return NextResponse.json({ error: `API returned ${res.status}`, results: [], count: 0 }, { status: 200 });
    }

    const raw: any[] = await res.json();

    // Normalize to our NTSBAccident shape
    // Filter yearTo client-side
    const yt = yearTo ? parseInt(yearTo) : null;
    const data = raw
      .filter(a => !yt || !a.eventdate || new Date(a.eventdate).getFullYear() <= yt)
      .map(a => ({
        EventId: a.eventid,
        NtsbNo: a.accidentnumber,
        EventLocalDate: a.eventdate,
        City: a.location?.split(',')[0]?.trim(),
        State: a.location?.split(',')[1]?.trim(),
        Country: a.country,
        Operator: a.aircarrier,
        AircraftMakeModel: [a.make, a.model].filter(Boolean).join(' '),
        AircraftRegistration: a.registrationnumber,
        HighestInjury: a.injuryseverity === 'Fatal' ? 'FATAL'
          : a.totalfatalinjuries > 0 ? 'FATAL'
          : a.totalseriousinjuries > 0 ? 'SERIOUS'
          : a.totalminorinjuries > 0 ? 'MINOR'
          : 'NONE',
        TotalFatalInjuries: a.totalfatalinjuries || 0,
        TotalSeriousInjuries: a.totalseriousinjuries || 0,
        TotalMinorInjuries: a.totalminorinjuries || 0,
        TotalUninjured: a.totaluninjured || 0,
        AircraftDamage: a.aircraftdamage?.toUpperCase(),
        FlightPurpose: a.purposeofflight,
        PhaseOfFlight: a.broadphaseofflight,
        WeatherCondition: a.weathercondition,
        BroadPhase: a.broadphaseofflight,
        ReportStatus: a.reportstatus,
        EngineType: a.enginetype,
        NumberOfEngines: a.numberofengines,
        AirCarrier: a.aircarrier,
        AircraftCategory: a.aircraftcategory,
        InvestigationType: a.investigationtype,
        FARDescription: a.fardescription,
        AirportCode: a.airportcode,
        AirportName: a.airportname,
      }));

    // Content-Range gives total: "0-49/12345"
    const contentRange = res.headers.get('Content-Range') || '';
    const total = parseInt(contentRange.split('/')[1]) || data.length;

    return NextResponse.json({ results: data, count: total });
  } catch (e: any) {
    console.error('NTSB fetch error:', e.message);
    return NextResponse.json({ error: e.message, results: [], count: 0 }, { status: 200 });
  }
}
