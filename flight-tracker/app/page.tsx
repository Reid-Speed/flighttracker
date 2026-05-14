'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import NewsScroller from '@/components/NewsScroller';
import type { NTSBAccident } from '@/lib/types';

const LiveView = dynamic(() => import('@/components/LiveView'), { ssr: false });
const HistoryView = dynamic(() => import('@/components/HistoryView'), { ssr: false });

export default function Home() {
  const [activeView, setActiveView] = useState<'live' | 'history'>('live');
  const [flightCount, setFlightCount] = useState(0);
  const [recentIncidents, setRecentIncidents] = useState<NTSBAccident[]>([]);
  const [scrollerIncident, setScrollerIncident] = useState<NTSBAccident | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  const handleIncidentsLoaded = useCallback((incidents: NTSBAccident[]) => {
    setRecentIncidents(incidents);
  }, []);

  const handleScrollerSelect = useCallback((inc: NTSBAccident) => {
    setScrollerIncident(inc);
    setActiveView('history');
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-black)', overflow: 'hidden' }}>
      <Header activeView={activeView} onViewChange={setActiveView} flightCount={flightCount} />
      <NewsScroller incidents={recentIncidents} loading={newsLoading} onSelect={handleScrollerSelect} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeView === 'live' ? (
          <LiveView onFlightCountChange={setFlightCount} />
        ) : (
          <HistoryView onIncidentsLoaded={handleIncidentsLoaded} scrollerIncident={scrollerIncident} />
        )}
      </div>
    </div>
  );
}
