import { safeFetch } from './http';
import { slugify } from './normalize';
import type { Anime, AnimeStatus, Provider, SearchParams } from './types';

const URL_ = 'https://graphql.anilist.co';
const FIELDS = `id title{romaji english native} synonyms description(asHtml:false) coverImage{extraLarge large} bannerImage genres seasonYear season status averageScore episodes nextAiringEpisode{episode airingAt} studios(isMain:true){nodes{name}} siteUrl`;

type Media = any;
const st = (s: string): AnimeStatus => s === 'RELEASING' ? 'ongoing' : s === 'FINISHED' ? 'completed' : s === 'NOT_YET_RELEASED' ? 'upcoming' : 'unknown';

export function mapMedia(m: Media): Anime {
  const title = m.title.english || m.title.romaji;
  const next = m.nextAiringEpisode;
  return {
    id: `anilist:${m.id}`, title, alternativeTitles: [m.title.romaji, m.title.native, ...(m.synonyms ?? [])].filter((t: string) => t && t !== title),
    slug: String(m.id), synopsis: m.description?.replace(/<[^>]+>/g, '') ?? null,
    posterUrl: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null, bannerUrl: m.bannerImage ?? null,
    genres: m.genres ?? [], year: m.seasonYear ?? null, season: m.season?.toLowerCase() ?? null, status: st(m.status),
    rating: m.averageScore ? m.averageScore / 10 : null, totalEpisodes: m.episodes ?? null,
    latestEpisode: next ? next.episode - 1 : m.episodes ?? null,
    nextAiringAt: next ? new Date(next.airingAt * 1000).toISOString() : null,
    studio: m.studios?.nodes?.[0]?.name ?? null, source: 'anilist', sourceId: String(m.id), sourceUrl: m.siteUrl ?? null,
    lastSyncedAt: new Date().toISOString()
  };
}

async function gql(query: string, variables: Record<string, unknown>, revalidate = 1800) {
  const res = await safeFetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), revalidate });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? 'AniList error');
  return json.data;
}
const page = async (args: string, vars: Record<string, unknown>, p = 1, perPage = 20) => {
  const d = await gql(`query($page:Int,$perPage:Int,$search:String,$status:MediaStatus,$sort:[MediaSort],$season:MediaSeason,$seasonYear:Int,$genre:String){Page(page:$page,perPage:$perPage){media(type:ANIME,isAdult:false,${args}){${FIELDS}}}}`, { page: p, perPage, ...vars });
  return (d.Page.media as Media[]).map(mapMedia);
};

export const currentSeason = () => {
  const d = new Date(); const m = d.getUTCMonth();
  return { season: ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(m / 3)], year: d.getUTCFullYear() };
};

export const anilist: Provider = {
  name: 'anilist', enabled: () => true,
  search: (p: SearchParams) => {
    const sort = p.sort === 'rating' ? 'SCORE_DESC' : p.sort === 'updated' ? 'UPDATED_AT_DESC' : 'POPULARITY_DESC';
    const status = p.status === 'ongoing' ? 'RELEASING' : p.status === 'completed' ? 'FINISHED' : undefined;
    return page('search:$search,status:$status,sort:$sort,season:$season,seasonYear:$seasonYear,genre:$genre',
      { search: p.query || undefined, status, sort: [sort], season: p.season?.toUpperCase(), seasonYear: p.year, genre: p.genre }, p.page);
  },
  detail: async (id) => { const d = await gql(`query($id:Int){Media(id:$id,type:ANIME){${FIELDS}}}`, { id: Number(id) }); return d.Media ? mapMedia(d.Media) : null; },
  ongoing: (p) => page('status:RELEASING,sort:POPULARITY_DESC', {}, p),
  completed: (p) => page('status:FINISHED,sort:POPULARITY_DESC', {}, p),
  latest: (p) => page('status:RELEASING,sort:UPDATED_AT_DESC', {}, p),
  schedule: async () => {
    const from = Math.floor(Date.now() / 1000), to = from + 7 * 86400;
    const d = await gql(`query($from:Int,$to:Int){Page(perPage:50){airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){episode airingAt media{${FIELDS}}}}}`, { from, to }, 900);
    return d.Page.airingSchedules.map((s: any) => ({ ...mapMedia({ ...s.media, nextAiringEpisode: { episode: s.episode, airingAt: s.airingAt } }) }));
  }
};
export const slugFor = slugify;
