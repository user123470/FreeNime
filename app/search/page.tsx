import { searchAll } from '@/lib/providers';
import AnimeCard from '@/components/AnimeCard';
import type { AnimeStatus } from '@/lib/providers/types';

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = await searchParams;
  const status = (['ongoing', 'completed'].includes(q.status) ? q.status : undefined) as AnimeStatus | undefined;
  const sort = (['popularity', 'rating', 'updated'].includes(q.sort) ? q.sort : 'popularity') as 'popularity' | 'rating' | 'updated';
  const results = q.q || q.genre || q.year ? await searchAll({ query: q.q?.slice(0, 100), genre: q.genre, year: q.year ? Number(q.year) || undefined : undefined, season: q.season, status, sort }) : [];
  const f = 'rounded-xl border border-line bg-card px-3 py-2 text-sm';
  return (
    <div>
      <form className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <input name="q" defaultValue={q.q} placeholder="Cari anime…" className={`${f} col-span-2`} />
        <input name="genre" defaultValue={q.genre} placeholder="Genre" className={f} />
        <input name="year" defaultValue={q.year} placeholder="Tahun" inputMode="numeric" className={f} />
        <select name="status" defaultValue={q.status ?? ''} className={f}><option value="">Semua</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
        <select name="sort" defaultValue={sort} className={f}><option value="popularity">Populer</option><option value="rating">Rating</option><option value="updated">Terbaru</option></select>
        <button className="col-span-2 rounded-xl bg-accent py-2 font-semibold text-black md:col-span-6">Cari</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3">{results.map((a) => <AnimeCard key={a.id} a={a} />)}</div>
      {(q.q || q.genre) && results.length === 0 && <p className="mt-6 text-neutral-400">Tidak ada hasil.</p>}
    </div>);
}
