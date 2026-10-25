import { anilist } from './anilist';
import { jikan } from './jikan';
import { samehadaku } from './samehadaku';
import { otakudesu } from './otakudesu';
import { dedupe } from './normalize';
import type { Anime, ApiResult, Provider } from './types';

export const providers: Provider[] = [anilist, jikan, samehadaku, otakudesu];

/** Coba provider berurutan sampai ada yang berhasil (fallback). */
export async function withFallback<T>(fn: (p: Provider) => Promise<T> | undefined, order = providers): Promise<ApiResult<T>> {
  const errors: string[] = [];
  for (const p of order.filter((p) => p.enabled())) {
    try { const r = fn(p); if (!r) continue; return { data: await r, error: null, fetchedAt: new Date().toISOString() }; }
    catch (e) { errors.push(`${p.name}: ${(e as Error).message}`); }
  }
  return { data: null, error: errors.join('; ') || 'Tidak ada provider yang mendukung', fetchedAt: new Date().toISOString() };
}

export async function searchAll(params: Parameters<NonNullable<Provider['search']>>[0]): Promise<Anime[]> {
  const res = await Promise.allSettled(providers.filter((p) => p.enabled() && p.search).map((p) => p.search!(params)));
  return dedupe(res.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])));
}
export { anilist };
