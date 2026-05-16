import { NextRequest, NextResponse } from 'next/server';

// Try multiple free sources for route info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callsign = searchParams.get('callsign')?.trim().toUpperCase().replace(/\s/g, '');
  const hex = searchParams.get('hex')?.trim().toLowerCase();

  if (!callsign && !hex) {
    return NextResponse.json({ origin: null, destination: null }, { status: 400 });
  }

  try {
    // airplanes.live returns full aircraft object with route fields when available
    const urls = [];
    if (callsign) urls.push(`https://api.airplanes.live/v2/callsign/${callsign}`);
    if (hex) urls.push(`https://api.airplanes.live/v2/hex/${hex}`);

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) continue;
        const d = await res.json();
        const ac = d?.ac?.[0] || d?.aircraft?.[0];
        if (!ac) continue;

        // airplanes.live uses these fields for route
        const origin = ac.orig_iata || ac.orig_icao || ac.departure_iata || null;
        const destination = ac.dest_iata || ac.dest_icao || ac.arrival_iata || null;

        // Even without route, return aircraft info
        return NextResponse.json({
          origin,
          originName: ac.orig_name || null,
          destination,
          destinationName: ac.dest_name || null,
          airline: ac.ownOp || null,
          aircraftType: ac.t || null,
          registration: ac.r || null,
          flightNumber: (ac.flight || '').trim() || null,
          dbFlags: ac.dbFlags || 0,
        });
      } catch {
        continue;
      }
    }

    return NextResponse.json({ origin: null, destination: null, error: 'not found' });
  } catch (e: any) {
    return NextResponse.json({ origin: null, destination: null, error: e.message });
  }
}
