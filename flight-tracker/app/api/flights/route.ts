import { NextRequest, NextResponse } from 'next/server';

// ADS-B Exchange free API - works from serverless environments
// Docs: https://www.adsbexchange.com/data/
const ADSB_BASE = 'https://opendata.adsb.fi/api/v2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lamin = parseFloat(searchParams.get('lamin') || '24.396308');
  const lamax = parseFloat(searchParams.get('lamax') || '49.384358');
  const lomin = parseFloat(searchParams.get('lomin') || '-125.0');
  const lomax = parseFloat(searchParams.get('lomax') || '-66.93457');

  // adsb.fi is a free, open ADS-B aggregator - no auth required, CORS-friendly
  // lat/lon center + radius approach, so compute center
  const lat = (lamin + lamax) / 2;
  const lon = (lomin + lomax) / 2;
  // Use bounding box endpoint
  const url = `${ADSB_BASE}/lat/${lat.toFixed(2)}/lon/${lon.toFixed(2)}/dist/1500`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlightTracker/1.0',
      },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      console.error('adsb.fi error:', res.status, await res.text());
      return NextResponse.json({ error: `adsb.fi returned ${res.status}`, states: [] }, { status: 200 });
    }

    const data = await res.json();
    
    // adsb.fi returns { ac: [...], msg, now, total, ctime, ptime }
    // Convert to OpenSky-compatible format for our frontend
    const states = (data.ac || [])
      .filter((a: any) => a.lat && a.lon)
      .map((a: any) => [
        a.hex || '',                          // 0: icao24
        (a.flight || a.r || '').trim(),       // 1: callsign
        a.ownOp || a.r || 'Unknown',          // 2: origin_country (use registration/operator)
        a.seen_pos || null,                   // 3: time_position
        a.seen || 0,                          // 4: last_contact
        a.lon,                                // 5: longitude
        a.lat,                                // 6: latitude
        a.alt_baro !== 'ground' ? (typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : null) : 0, // 7: baro_altitude (ft→m)
        a.alt_baro === 'ground' || a.gs < 30, // 8: on_ground
        a.gs ? a.gs * 0.514444 : null,        // 9: velocity (knots→m/s)
        a.track || null,                      // 10: true_track
        a.baro_rate ? a.baro_rate * 0.00508 : null, // 11: vertical_rate (fpm→m/s)
        null,                                 // 12: sensors
        a.alt_geom ? a.alt_geom * 0.3048 : null, // 13: geo_altitude
        a.squawk || null,                     // 14: squawk
        false,                                // 15: spi
        0,                                    // 16: position_source
        // Extra fields we can use in the UI
        a.t || a.desc || null,                // 17: aircraft type/description
        a.r || null,                          // 18: registration
        a.ownOp || null,                      // 19: operator
        a.dbFlags || null,                    // 20: flags
      ]);

    return NextResponse.json({ 
      time: data.now,
      states,
      source: 'adsb.fi',
      total: data.total || states.length,
    });

  } catch (e: any) {
    console.error('Flight fetch error:', e.message);
    return NextResponse.json({ error: e.message, states: [] }, { status: 200 });
  }
}
