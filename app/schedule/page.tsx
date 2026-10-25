import { withFallback } from '@/lib/providers';
import Link from 'next/link';

export const revalidate = 900;
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export default async function Schedule() {
  const r = await withFallback((p) => p.schedule?.());
  const byDay = new Map<number, typeof r.data>();
  r.data?.forEach((a) => { if (!a.nextAiringAt) return;
    const d = new Date(new Date(a.nextAiringAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay();
    byDay.set(d, [...(byDay.get(d) ?? []), a]); });
  return (
    <div><h1 className="text-xl font-bold">Jadwal Rilis</h1><p className="text-xs text-neutral-400">Zona waktu Asia/Jakarta. Sumber: AniList (jadwal resmi penayangan).</p>
      {r.error && <p className="mt-3 text-red-400">Gagal memuat: {r.error}</p>}
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <section key={d} className="mt-5"><h2 className="font-semibold text-accent">{days[d]}</h2>
          {(byDay.get(d) ?? []).length === 0 ? <p className="text-sm text-neutral-500">Jadwal belum diketahui</p> :
            byDay.get(d)!.map((a) => <Link key={a.id} href={`/anime/${a.slug}`} className="flex justify-between border-b border-line py-2 text-sm"><span className="line-clamp-1">{a.title} · Eps {a.latestEpisode! + 1}</span>
              <span className="text-neutral-400">{new Date(a.nextAiringAt!).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })}</span></Link>)}
        </section>))}
    </div>);
}
