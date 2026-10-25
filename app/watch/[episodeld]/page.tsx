import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import Player from '@/components/Player';

export default async function Watch({ params }: { params: Promise<{ episodeId: string }> }) {
  const { episodeId } = await params;
  if (!z.string().uuid().safeParse(episodeId).success) notFound();
  const sb = await createClient();
  const { data: ep } = await sb.from('episodes').select('id,number,anime_id,anime(title,slug)').eq('id', episodeId).single();
  if (!ep) notFound();
  const [{ data: sources }, { data: siblings }, { data: { user } }] = await Promise.all([
    sb.from('video_sources').select('id,provider,url,format,quality,subtitle_url').eq('episode_id', episodeId).eq('active', true).order('priority'),
    sb.from('episodes').select('id,number').eq('anime_id', ep.anime_id).order('number'),
    sb.auth.getUser()]);
  let startAt = 0;
  if (user) {
    const { data: h } = await sb.from('watch_history').select('episode_id,position_seconds').eq('anime_id', ep.anime_id).maybeSingle();
    if (h?.episode_id === episodeId) startAt = h.position_seconds;
    await sb.from('watch_history').upsert({ user_id: user.id, anime_id: ep.anime_id, episode_id: episodeId, position_seconds: startAt }, { onConflict: 'user_id,anime_id' });
  }
  const list = siblings ?? []; const i = list.findIndex((e) => e.id === episodeId);
  const anime = ep.anime as unknown as { title: string; slug: string };
  return (
    <div>
      <Link href={`/anime/${anime.slug}`} className="text-sm text-accent">← {anime.title}</Link>
      <h1 className="mb-3 mt-1 text-lg font-bold">Episode {ep.number}</h1>
      <Player episodeId={episodeId} sources={(sources ?? []) as any} startAt={startAt} />
      <div className="mt-4 flex justify-between text-sm">
        {list[i - 1] ? <Link className="rounded-full border border-line px-4 py-2" href={`/watch/${list[i - 1].id}`}>Sebelumnya</Link> : <span />}
        {list[i + 1] && <Link className="rounded-full bg-accent px-4 py-2 font-semibold text-black" href={`/watch/${list[i + 1].id}`}>Selanjutnya</Link>}
      </div>
    </div>);
}
