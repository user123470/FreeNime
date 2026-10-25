import type { Anime } from './types';

export const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(season|s)\s*(\d+)\b/g, 's$2').trim();
export const slugify = (t: string) => normTitle(t).replace(/\s+/g, '-');

/** Deduplikasi: kunci utama = judul ternormalisasi + tahun (jika ada). Data pertama menang, field kosong diisi dari duplikat. */
export function dedupe(list: Anime[]): Anime[] {
  const map = new Map<string, Anime>();
  for (const a of list) {
    const keys = [a.title, ...a.alternativeTitles].map((t) => `${normTitle(t)}|${a.year ?? ''}`);
    const hit = keys.map((k) => map.get(k)).find(Boolean);
    if (!hit) { keys.forEach((k) => map.set(k, a)); continue; }
    hit.synopsis ??= a.synopsis; hit.posterUrl ??= a.posterUrl; hit.bannerUrl ??= a.bannerUrl;
    hit.rating ??= a.rating; hit.totalEpisodes ??= a.totalEpisodes;
    hit.alternativeTitles = [...new Set([...hit.alternativeTitles, ...a.alternativeTitles])];
  }
  return [...new Set(map.values())];
}
