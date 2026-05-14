import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lamin = searchParams.get('lamin') || '24.396308';
  const lamax = searchParams.get('lamax') || '49.384358';
  const lomin = searchParams.get('lomin') || '-125.0';
  const lomax = searchParams.get('lomax') || '-66.93457';

  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'OpenSky unavailable', states: [] }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Fetch failed', states: [] }, { status: 200 });
  }
}
