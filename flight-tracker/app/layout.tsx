import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FLIGHTTRACKER // ATC CONSOLE',
  description: 'Live flight tracking and NTSB incident database',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
