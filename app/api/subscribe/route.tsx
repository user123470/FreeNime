import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { anilist } from '@/lib/providers';

const Body = z.object({ sourceId: z.string().regex(/^\d+$/), kind: z.enum(['subscribe', 'favorite']), on: z.boolean() });

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { sourceId, kind, on } = parsed.data;

  const svc = createServiceClient();
  let { data: row } = await svc.from('anime').select('id').eq('source', 'anilist').eq('source_id', sourceId).maybeSingle();
  if (!row) {
    const a = await anilist.detail!(sourceId).catch(() => null);
    if (!a) return NextResponse.json({ error: 'anime not found' }, { status: 404 });
    const ins = await svc.from('anime').upsert({ slug: a.slug, title: a.title, alt_titles: a.alternativeTitles, synopsis: a.synopsis, poster_url: a.posterUrl, banner_url: a.bannerUrl,
      genres: a.genres, year: a.year, season: a.season, status: a.status, rating: a.rating, total_episodes: a.totalEpisodes, latest_episode: a.latestEpisode,
      next_airing_at: a.nextAiringAt, source: 'anilist', source_id: sourceId, source_url: a.sourceUrl, last_synced_at: a.lastSyncedAt }, { onConflict: 'source,source_id' }).select('id').single();
    if (ins.error) return NextResponse.json({ error: 'db' }, { status: 500 });
    row = ins.data;
  }
  const table = kind === 'subscribe' ? 'anime_subscriptions' : 'favorites';
  const r = on ? await sb.from(table).upsert({ user_id: user.id, anime_id: row.id }) : await sb.from(table).delete().eq('user_id', user.id).eq('anime_id', row.id);
  return r.error ? NextResponse.json({ error: 'db' }, { status: 500 }) : NextResponse.json({ ok: true });
}
