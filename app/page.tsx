import Link from 'next/link';
import { Bell, Search, Settings } from 'lucide-react';
import Image from 'next/image';
import { anilist, withFallback } from '@/lib/providers';
import { currentSeason } from '@/lib/providers/anilist';
import { Row } from '@/components/AnimeCard';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 1800;

export default async function Home() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { season, year } = currentSeason();
  const [latest, ongoing, completed, popular, seasonal] = await Promise.all([
    withFallback((p) => p.latest?.()), withFallback((p) => p.ongoing?.()), withFallback((p) => p.completed?.()),
    withFallback((p) => p.search?.({ sort: 'popularity' })), withFallback((p) => p.search?.({ season, year, sort: 'popularity' }), [anilist])
  ]);

  let profile: { display_name: string | null; avatar_url: string | null } | null = null;
  let unread = 0; let history: any[] = [];
  if (user) {
    [profile, unread, history] = await Promise.all([
      sb.from('profiles').select('display_name,avatar_url').eq('id', user.id).single().then((r) => r.data),
      sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null).then((r) => r.count ?? 0),
      sb.from('watch_history').select('position_seconds,duration_seconds,episode_id,anime(title,poster_url),episodes(number)').order('updated_at', { ascending: false }).limit(10).then((r) => r.data ?? [])
    ]);
  }
  return (
    <>
      <header className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-line">{profile?.avatar_url && <Image src={profile.avatar_url} alt="" fill className="object-cover" />}</div>
        <div className="flex-1"><p className="text-xs text-neutral-400">Halo,</p><p className="font-semibold">{profile?.display_name ?? 'Tamu'}</p></div>
        {!user && <Link href="/login" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black">Masuk</Link>}
        <Link href="/notifications" aria-label="Notifikasi" className="relative p-2"><Bell />{unread > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs">{unread}</span>}</Link>
        <Link href="/search" aria-label="Cari" className="p-2"><Search /></Link>
        <Link href="/settings" aria-label="Pengaturan" className="p-2"><Settings /></Link>
      </header>

      {history.length > 0 && (
        <section className="mt-6"><h2 className="mb-3 text-lg font-bold">Terakhir Ditonton</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {history.map((h) => (
              <Link key={h.episode_id} href={`/watch/${h.episode_id}`} className="w-56 shrink-0">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-line">
                  {h.anime?.poster_url && <Image src={h.anime.poster_url} alt="" fill sizes="224px" className="object-cover" />}
                  <span className="absolute bottom-2 left-2 text-sm font-bold">Eps {h.episodes?.number}</span>
                  <div className="absolute bottom-0 h-1 bg-red-600" style={{ width: `${h.duration_seconds ? (h.position_seconds / h.duration_seconds) * 100 : 0}%` }} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm">{h.anime?.title}</p><p className="text-xs text-accent">Lanjutkan Menonton</p>
              </Link>))}
          </div></section>)}

      <Row title="Anime Terbaru" items={latest.data} error={latest.error} isNew />
      <Row title="Sedang Tayang" items={ongoing.data} error={ongoing.error} />
      <Row title="Sudah Tamat" items={completed.data} error={completed.error} />
      <Row title="Populer" items={popular.data} error={popular.error} />
      <Row title={`Musim ${season.toLowerCase()} ${year}`} items={seasonal.data} error={seasonal.error} />
      <p className="mt-6 text-xs text-neutral-500">Metadata: AniList. Diperbarui {new Date(latest.fetchedAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
    </>);
}
