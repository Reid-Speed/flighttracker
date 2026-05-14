import { NextRequest, NextResponse } from 'next/server';

// airplanes.live - free, no auth, no feeder required, ADSBex v2 compatible
const BASE = 'https://api.airplanes.live/v2';

export async function GET(request: NextRequest) {
  // Tile CONUS with 4 overlapping circles of 250nm each
  const tiles = [
    { lat: 40.0, lon: -115.0 }, // West
    { lat: 40.0, lon: -90.0 },  // Central
    { lat: 40.0, lon: -75.0 },  // East
    { lat: 28.0, lon: -95.0 },  // South
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

    // Merge, deduplicate by hex
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

    // Convert to OpenSky-compatible state vector array
    const states = merged
      .filter(a => a.lat && a.lon)
      .map(a => [
        (a.hex || '').replace('~', ''),                         // 0: icao24
        (a.flight || a.r || '').trim(),                         // 1: callsign
        a.ownOp || a.r || a.desc || 'Unknown',                  // 2: origin_country/operator
        a.seen_pos || null,                                      // 3: time_position
        a.seen || 0,                                             // 4: last_contact
        a.lon,                                                   // 5: longitude
        a.lat,                                                   // 6: latitude
        a.alt_baro !== 'ground' && typeof a.alt_baro === 'number'
          ? a.alt_baro * 0.3048 : 0,                            // 7: baro_altitude ft→m
        a.alt_baro === 'ground' || (a.gs != null && a.gs < 30), // 8: on_ground
        a.gs ? a.gs * 0.514444 : null,                          // 9: velocity knots→m/s
        a.track ?? null,                                         // 10: true_track
        a.baro_rate ? a.baro_rate * 0.00508 : null,             // 11: vertical_rate fpm→m/s
        null,                                                    // 12: sensors
        a.alt_geom ? a.alt_geom * 0.3048 : null,               // 13: geo_altitude
        a.squawk || null,                                        // 14: squawk
        false,                                                   // 15: spi
        0,                                                       // 16: position_source
        a.t || null,                                             // 17: aircraft type
        a.r || null,                                             // 18: registration
        a.ownOp || null,                                         // 19: operator
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
