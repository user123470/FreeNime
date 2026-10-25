import { safeFetch } from './http';
import type { Anime, Episode, Provider } from './types';

/**
 * ADAPTER TIDAK RESMI (otakudesu).
 * Tidak ada API resmi. Endpoint TIDAK di-hardcode dan belum diverifikasi.
 * Isi OTAKUDESU_API_BASE dengan REST API yang Anda temukan & uji sendiri.
 * Ekspektasi respons (ubah di bawah sesuai struktur nyata):
 *   GET {base}/search?q=...  -> { data: [{ id, title, poster, status, episode }] }
 *   GET {base}/anime/{id}    -> { data: { id, title, poster, synopsis, genres[], episodes: [{ number, title, url }] } }
 * Tanpa env ini adapter nonaktif dan aplikasi memakai AniList/Jikan.
 */
const base = () => process.env.OTAKUDESU_API_BASE?.replace(/\/$/, '');

const map = (r: any): Anime => ({
  id: 'otakudesu:' + r.id, title: String(r.title), alternativeTitles: [], slug: 'otakudesu-' + r.id, synopsis: r.synopsis ?? null,
  posterUrl: r.poster ?? null, bannerUrl: null, genres: r.genres ?? [], year: null, season: null,
  status: /ongoing|airing/i.test(r.status ?? '') ? 'ongoing' : /complete|finish/i.test(r.status ?? '') ? 'completed' : 'unknown',
  rating: null, totalEpisodes: null, latestEpisode: r.episode ? Number(r.episode) : null, nextAiringAt: null, studio: null,
  source: 'otakudesu', sourceId: String(r.id), sourceUrl: r.url ?? null, lastSyncedAt: new Date().toISOString()
});
const get = async (p: string) => (await (await safeFetch(base() + p, { revalidate: 900 })).json()).data;

export const otakudesu: Provider = {
  name: 'otakudesu', enabled: () => !!base(),
  search: async (p) => (await get('/search?q=' + encodeURIComponent(p.query ?? ''))).map(map),
  detail: async (id) => map(await get('/anime/' + id)),
  episodes: async (id): Promise<Episode[]> => ((await get('/anime/' + id)).episodes ?? []).map((e: any) => ({ number: Number(e.number), title: e.title ?? null, sourceUrl: e.url ?? null, airedAt: null }))
  // latest/ongoing/completed/schedule: belum tersedia (tandai tidak didukung sampai endpoint diverifikasi)
};
