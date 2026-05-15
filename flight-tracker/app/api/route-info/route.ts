import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callsign = searchParams.get('callsign')?.trim().toUpperCase();
  const hex = searchParams.get('hex')?.trim().toLowerCase();

  if (!callsign && !hex) {
    return NextResponse.json({ origin: null, destination: null }, { status: 400 });
  }

  try {
    let aircraft: any = null;

    if (callsign) {
      const res = await fetch(`https://api.airplanes.live/v2/callsign/${callsign}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
      });
      if (res.ok) {
        const d = await res.json();
        aircraft = d?.ac?.[0] || d?.aircraft?.[0] || null;
      }
    }

    if (!aircraft && hex) {
      const res = await fetch(`https://api.airplanes.live/v2/hex/${hex}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
      });
      if (res.ok) {
        const d = await res.json();
        aircraft = d?.ac?.[0] || d?.aircraft?.[0] || null;
      }
    }

    if (!aircraft) return NextResponse.json({ origin: null, destination: null });

    return NextResponse.json({
      origin: aircraft.orig_iata || aircraft.orig_icao || null,
      originName: aircraft.orig_name || null,
      destination: aircraft.dest_iata || aircraft.dest_icao || null,
      destinationName: aircraft.dest_name || null,
      airline: aircraft.ownOp || null,
      aircraftType: aircraft.t || null,
      registration: aircraft.r || null,
      eta: aircraft.eta || null,
    });

  } catch {
    return NextResponse.json({ origin: null, destination: null });
  }
}
