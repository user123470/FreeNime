import './globals.css';
import type { Metadata, Viewport } from 'next';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = { title: 'AnimeHub', description: 'Katalog & streaming anime' };
export const viewport: Viewport = { themeColor: '#0b0d10', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body><main className="mx-auto max-w-5xl px-4 pt-4">{children}</main><BottomNav /></body></html>);
}
