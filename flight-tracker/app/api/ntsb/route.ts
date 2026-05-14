import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const params = new URLSearchParams();
  params.set('AviationFlag', 'Aviation');
  params.set('format', 'json');
  params.set('ResultsPerPage', searchParams.get('ResultsPerPage') || '50');
  params.set('StartRow', searchParams.get('StartRow') || '0');

  const airline = searchParams.get('airline');
  if (airline) params.set('Operator', airline);

  const aircraft = searchParams.get('aircraft');
  if (aircraft) params.set('AircraftMakeModel', aircraft);

  const location = searchParams.get('location');
  if (location) params.set('City', location);

  const severity = searchParams.get('severity');
  if (severity && severity !== 'All') params.set('HighestInjury', severity);

  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');
  if (yearFrom) params.set('EventDateFrom', `${yearFrom}-01-01`);
  if (yearTo) params.set('EventDateTo', `${yearTo}-12-31`);

  const query = searchParams.get('query');
  if (query) params.set('FullText', query);

  try {
    const carolUrl = `https://data.ntsb.gov/carol-main-public/api/Query/Main?${params.toString()}`;
    const res = await fetch(carolUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'NTSB unavailable', results: [] }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Fetch failed', results: [] }, { status: 200 });
  }
}
