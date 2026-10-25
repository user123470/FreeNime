'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Clock, Library, User } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', Icon: Home }, { href: '/schedule', label: 'Jadwal', Icon: CalendarDays },
  { href: '/history', label: 'Riwayat', Icon: Clock }, { href: '/collection', label: 'Koleksi', Icon: Library },
  { href: '/profile', label: 'Profil', Icon: User }
];
export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed z-40 bottom-0 inset-x-0 md:inset-y-0 md:right-auto md:w-56 border-t md:border-t-0 md:border-r border-line bg-card/95 flex md:flex-col md:gap-1 md:p-3 justify-around md:justify-start">
      {items.map(({ href, label, Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:rounded-xl text-xs md:text-sm ${active ? 'text-accent md:bg-line' : 'text-neutral-400'}`}>
            <Icon size={22} />{label}
          </Link>);
      })}
    </nav>);
}
