export type AnimeStatus = 'ongoing' | 'completed' | 'upcoming' | 'unknown';
export type SourceName = 'anilist' | 'jikan' | 'samehadaku' | 'otakudesu';

export interface Anime {
  id: string; title: string; alternativeTitles: string[]; slug: string; synopsis: string | null;
  posterUrl: string | null; bannerUrl: string | null; genres: string[]; year: number | null; season: string | null;
  status: AnimeStatus; rating: number | null; totalEpisodes: number | null; latestEpisode: number | null;
  nextAiringAt: string | null; studio: string | null;
  source: SourceName; sourceId: string; sourceUrl: string | null; lastSyncedAt: string;
}
export interface Episode { number: number; title: string | null; sourceUrl: string | null; airedAt: string | null }

export interface SearchParams { query?: string; genre?: string; year?: number; season?: string; status?: AnimeStatus; sort?: 'popularity' | 'rating' | 'updated'; page?: number }

/** Fitur opsional: provider hanya mengimplementasikan yang didukung. Yang tidak ada = undefined (ditandai tidak tersedia). */
export interface Provider {
  name: SourceName;
  enabled: () => boolean;
  search?: (p: SearchParams) => Promise<Anime[]>;
  detail?: (sourceId: string) => Promise<Anime | null>;
  episodes?: (sourceId: string) => Promise<Episode[]>;
  latest?: (page?: number) => Promise<Anime[]>;
  ongoing?: (page?: number) => Promise<Anime[]>;
  completed?: (page?: number) => Promise<Anime[]>;
  schedule?: () => Promise<Anime[]>;
}
export interface ApiResult<T> { data: T | null; error: string | null; fetchedAt: string }
