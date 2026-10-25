import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Anime } from '@/lib/providers/types';

export default function AnimeCard({ a, isNew }: { a: Anime; isNew?: boolean }) {
  return (
    <Link href={`/anime/${a.slug}`} className="block w-36 shrink-0 md:w-44">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-line">
        {a.posterUrl && <Image src={a.posterUrl} alt={a.title} fill sizes="176px" loading="lazy" className="object-cover" />}
        {isNew && <span className="absolute left-0 top-0 rounded-br-xl bg-accent px-2 py-1 text-xs font-bold text-black">NEW</span>}
        {a.rating && <span className="absolute right-1 top-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs"><Star size={12} className="fill-yellow-400 text-yellow-400" />{a.rating.toFixed(2)}</span>}
        <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2 text-xs font-semibold">
          {a.latestEpisode ? `Eps ${a.latestEpisode}` : a.status === 'upcoming' ? 'Segera' : ''}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{a.title}</p>
      <p className="text-xs text-neutral-400">{a.status === 'ongoing' ? 'Ongoing' : a.status === 'completed' ? 'Completed' : ''}</p>
    </Link>);
}
export function Row({ title, items, isNew, error }: { title: string; items: Anime[] | null; isNew?: boolean; error?: string | null }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {error && <p className="rounded-xl border border-line p-3 text-sm text-red-400">Gagal memuat data: {error}</p>}
      {!error && items && items.length === 0 && <p className="text-sm text-neutral-400">Belum ada data.</p>}
      <div className="flex gap-3 overflow-x-auto pb-2">{items?.map((a) => <AnimeCard key={a.id} a={a} isNew={isNew} />)}</div>
    </section>);
}
