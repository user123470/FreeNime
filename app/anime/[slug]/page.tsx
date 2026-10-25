import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { anilist } from '@/lib/providers';
import { createClient } from '@/lib/supabase/server';
import SubscribeButtons from '@/components/SubscribeButtons';

export const revalidate = 1800;

export default async function AnimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^\d+$/.test(slug)) notFound();
  const a = await anilist.detail!(slug).catch(() => null);
  if (!a) notFound();
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: row } = await sb.from('anime').select('id').eq('source', 'anilist').eq('source_id', slug).maybeSingle();
  let initial = { subscribed: false, favorite: false }; let episodes: { id: string; number: number }[] = [];
  if (row) {
    episodes = (await sb.from('episodes').select('id,number').eq('anime_id', row.id).order('number')).data ?? [];
    if (user) {
      const [s, f] = await Promise.all([
        sb.from('anime_subscriptions').select('anime_id').eq('anime_id', row.id).maybeSingle(),
        sb.from('favorites').select('anime_id').eq('anime_id', row.id).maybeSingle()]);
      initial = { subscribed: !!s.data, favorite: !!f.data };
    }
  }
  return (
    <article>
      {a.bannerUrl && <div className="relative -mx-4 h-40 md:h-64"><Image src={a.bannerUrl} alt="" fill priority className="object-cover opacity-60" /></div>}
      <div className="mt-4 flex gap-4">
        <div className="relative h-48 w-32 shrink-0 overflow-hidden rounded-xl bg-line">{a.posterUrl && <Image src={a.posterUrl} alt={a.title} fill sizes="128px" className="object-cover" />}</div>
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold">{a.title}</h1>
          <p className="text-xs text-neutral-400">{a.alternativeTitles.slice(0, 3).join(' · ')}</p>
          <p className="text-sm">{[a.year, a.season, a.status, a.rating && `★ ${a.rating.toFixed(1)}`, a.studio, a.totalEpisodes && `${a.totalEpisodes} eps`].filter(Boolean).join(' • ')}</p>
          <p className="text-xs text-neutral-300">{a.genres.join(', ')}</p>
          {a.nextAiringAt && <p className="text-xs text-accent">Episode berikutnya: {new Date(a.nextAiringAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB (jadwal AniList)</p>}
        </div>
      </div>
      <div className="mt-4"><SubscribeButtons sourceId={slug} initial={initial} /></div>
      <p className="mt-4 whitespace-pre-line text-sm text-neutral-300">{a.synopsis}</p>
      <h2 className="mb-2 mt-6 text-lg font-bold">Episode</h2>
      {episodes.length === 0
        ? <p className="rounded-xl border border-line p-3 text-sm text-neutral-400">Belum ada episode di katalog. Tambahkan lewat dashboard admin atau aktifkan provider episode.</p>
        : <div className="grid grid-cols-4 gap-2 md:grid-cols-8">{episodes.map((e) => <Link key={e.id} href={`/watch/${e.id}`} className="rounded-lg border border-line py-2 text-center text-sm hover:border-accent">{e.number}</Link>)}</div>}
    </article>);
}
