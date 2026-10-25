import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { anilist } from '@/lib/providers';

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const svc = createServiceClient();
  try {
    const list = await anilist.ongoing!(1);
    let notified = 0;
    for (const a of list) {
      const { data: old } = await svc.from('anime').select('id,latest_episode').eq('source', 'anilist').eq('source_id', a.sourceId).maybeSingle();
      const { data: row, error } = await svc.from('anime').upsert({ slug: a.slug, title: a.title, alt_titles: a.alternativeTitles, synopsis: a.synopsis, poster_url: a.posterUrl, banner_url: a.bannerUrl,
        genres: a.genres, year: a.year, season: a.season, status: a.status, rating: a.rating, total_episodes: a.totalEpisodes, latest_episode: a.latestEpisode,
        next_airing_at: a.nextAiringAt, source: 'anilist', source_id: a.sourceId, source_url: a.sourceUrl, last_synced_at: a.lastSyncedAt }, { onConflict: 'source,source_id' }).select('id').single();
      if (error || !row) continue;
      const isNewEpisode = old && a.latestEpisode && (old.latest_episode ?? 0) < a.latestEpisode;
      if (isNewEpisode) {
        const { data: subs } = await svc.from('anime_subscriptions').select('user_id').eq('anime_id', row.id);
        const { data: prefs } = await svc.from('notification_preferences').select('user_id,enabled,new_episode,subscribed').in('user_id', (subs ?? []).map((s) => s.user_id));
        const allowed = (prefs ?? []).filter((p) => p.enabled && p.new_episode && p.subscribed);
        if (allowed.length) {
          const { count } = await svc.from('notifications').upsert(allowed.map((p) => ({ user_id: p.user_id, type: 'new_episode', title: `${a.title} Episode ${a.latestEpisode}`, body: 'Episode baru terdeteksi.', link: `/anime/${a.slug}`, dedupe_key: `ep:${a.sourceId}:${a.latestEpisode}` })), { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true, count: 'exact' });
          notified += count ?? 0;
        }
      }
    }
    await svc.from('provider_sync_logs').insert({ provider: 'anilist', ok: true, items: list.length, message: `notif: ${notified}` });
    return NextResponse.json({ ok: true, items: list.length, notified });
  } catch (e) {
    await svc.from('provider_sync_logs').insert({ provider: 'anilist', ok: false, message: (e as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false }, { status: 502 });
  }
                                                                   }
