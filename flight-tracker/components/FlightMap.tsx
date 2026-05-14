'use client';
import { useEffect, useRef, useState } from 'react';
import type { FlightState } from '@/lib/types';

interface FlightMapProps {
  flights: FlightState[];
  selectedFlight: FlightState | null;
  onSelect: (f: FlightState | null) => void;
}

export default function FlightMap({ flights, selectedFlight, onSelect }: FlightMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || leafletMapRef.current) return;

    const init = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!, {
        center: [37.0902, -95.7129],
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (e: any) => {
        const target = e.originalEvent.target;
        if (!target.closest('.plane-marker')) {
          onSelect(null);
        }
      });

      leafletMapRef.current = map;
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (!leafletMapRef.current || !mounted) return;

    const init = async () => {
      const L = (await import('leaflet')).default;
      const map = leafletMapRef.current;
      const currentIds = new Set(flights.map(f => f.icao24));

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      // Add/update markers
      flights.forEach(flight => {
        if (!flight.latitude || !flight.longitude) return;

        const isSelected = selectedFlight?.icao24 === flight.icao24;
        const rotation = flight.true_track ?? 0;
        const alt = flight.baro_altitude ?? 0;
        const altKm = alt / 1000;
        const color = altKm > 10 ? '#00ff41' : altKm > 5 ? '#80ff80' : altKm > 1 ? '#ffb300' : '#ff6b00';

        const svgIcon = `
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
               style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 ${isSelected ? 8 : 3}px ${isSelected ? '#ffb300' : color});">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                  fill="${isSelected ? '#ffb300' : color}" opacity="${isSelected ? 1 : 0.9}"/>
          </svg>`;

        const icon = L.divIcon({
          html: `<div class="plane-marker" style="width:18px;height:18px;">${svgIcon}</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          className: '',
        });

        if (markersRef.current.has(flight.icao24)) {
          const marker = markersRef.current.get(flight.icao24);
          marker.setLatLng([flight.latitude, flight.longitude]);
          marker.setIcon(icon);
        } else {
          const marker = L.marker([flight.latitude, flight.longitude], { icon })
            .addTo(map)
            .on('click', (e: any) => {
              L.DomEvent.stopPropagation(e);
              onSelect(flight);
            });
          markersRef.current.set(flight.icao24, marker);
        }
      });
    };

    init();
  }, [flights, selectedFlight, mounted]);

  // Center on selected flight
  useEffect(() => {
    if (!leafletMapRef.current || !selectedFlight?.latitude || !selectedFlight?.longitude) return;
    leafletMapRef.current.panTo([selectedFlight.latitude, selectedFlight.longitude], { animate: true, duration: 0.8 });
  }, [selectedFlight?.icao24]);

  if (!mounted) return (
    <div style={{ flex: 1, background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em' }}>INITIALIZING RADAR...</span>
    </div>
  );

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Corner overlays */}
      <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none', zIndex: 1000, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <div>SECTOR: CONUS</div>
        <div>MODE: SURVEILLANCE</div>
        <div>RANGE: ALL ALT</div>
      </div>
      <div style={{ position: 'absolute', bottom: 30, left: 10, pointerEvents: 'none', zIndex: 1000, display: 'flex', gap: 12, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <span style={{ color: '#00ff41' }}>▲ HIGH ALT</span>
        <span style={{ color: '#80ff80' }}>▲ MED ALT</span>
        <span style={{ color: '#ffb300' }}>▲ LOW ALT</span>
        <span style={{ color: '#ff6b00' }}>▲ GROUND</span>
      </div>
    </div>
  );
}
