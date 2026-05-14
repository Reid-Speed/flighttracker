import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  try {
    const url = `https://data.ntsb.gov/carol-main-public/api/Query/Main?AviationFlag=Aviation&EventId=${id}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'FlightTracker/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'NTSB detail unavailable' }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 200 });
  }
}
