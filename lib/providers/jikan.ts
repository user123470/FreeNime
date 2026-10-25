import { safeFetch } from './http';
import type { Anime, Provider } from './types';

const map = (j: any): Anime => ({
  id: `jikan:${j.mal_id}`, title: j.title_english || j.title, alternativeTitles: [j.title, j.title_japanese].filter(Boolean),
  slug: `mal-${j.mal_id}`, synopsis: j.synopsis ?? null, posterUrl: j.images?.webp?.large_image_url ?? null, bannerUrl: null,
  genres: (j.genres ?? []).map((g: any) => g.name), year: j.year ?? null, season: j.season ?? null,
  status: j.status === 'Currently Airing' ? 'ongoing' : j.status === 'Finished Airing' ? 'completed' : 'unknown',
  rating: j.score ?? null, totalEpisodes: j.episodes ?? null, latestEpisode: null, nextAiringAt: null,
  studio: j.studios?.[0]?.name ?? null, source: 'jikan', sourceId: String(j.mal_id), sourceUrl: j.url ?? null, lastSyncedAt: new Date().toISOString()
});
const get = async (path: string) => (await (await safeFetch(`https://api.jikan.moe/v4${path}`, { revalidate: 3600 })).json()).data;

// Jikan dibatasi ~3 req/detik; semua panggilan di-cache 1 jam.
export const jikan: Provider = {
  name: 'jikan', enabled: () => true,
  search: async (p) => (await get(`/anime?q=${encodeURIComponent(p.query ?? '')}&page=${p.page ?? 1}&sfw=true`)).map(map),
  detail: async (id) => map(await get(`/anime/${id}/full`)),
  ongoing: async (p) => (await get(`/seasons/now?page=${p ?? 1}`)).map(map),
  schedule: async () => (await get('/schedules?filter=' + ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()])).map(map)
};
