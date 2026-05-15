import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.airplanes.live/v2';

export async function GET(request: NextRequest) {
  const tiles = [
    { lat: 40.0, lon: -115.0 },
    { lat: 40.0, lon: -90.0 },
    { lat: 40.0, lon: -75.0 },
    { lat: 28.0, lon: -95.0 },
  ];

  try {
    const results = await Promise.allSettled(
      tiles.map(({ lat, lon }) =>
        fetch(`${BASE}/point/${lat}/${lon}/250`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
          next: { revalidate: 15 },
        }).then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      )
    );

    const seen = new Set<string>();
    const merged: any[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const ac = result.value?.ac || result.value?.aircraft || [];
        for (const a of ac) {
          const key = a.hex || a.icao24;
          if (key && !seen.has(key)) {
            seen.add(key);
            merged.push(a);
          }
        }
      }
    }

    const states = merged
      .filter(a => a.lat && a.lon)
      .map(a => [
        (a.hex || '').replace('~', ''),
        (a.flight || a.r || '').trim(),
        a.ownOp || a.r || 'Unknown',
        a.seen_pos || null,
        a.seen || 0,
        a.lon,
        a.lat,
        a.alt_baro !== 'ground' && typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : 0,
        a.alt_baro === 'ground' || (a.gs != null && a.gs < 30),
        a.gs ? a.gs * 0.514444 : null,
        a.track ?? null,
        a.baro_rate ? a.baro_rate * 0.00508 : null,
        null,
        a.alt_geom ? a.alt_geom * 0.3048 : null,
        a.squawk || null,
        false,
        0,
        a.t || null,          // 17: aircraft ICAO type code (e.g. B738)
        a.r || null,          // 18: registration
        a.ownOp || null,      // 19: operator
        a.dep || a.orig || null,  // 20: departure airport IATA/ICAO
        a.arr || a.dest || null,  // 21: arrival airport IATA/ICAO
        a.flight_iata || a.flight || null, // 22: flight number IATA
      ]);

    return NextResponse.json({
      time: Date.now() / 1000,
      states,
      source: 'airplanes.live',
      total: states.length,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message, states: [] }, { status: 200 });
  }
}
