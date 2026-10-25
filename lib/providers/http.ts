// fetch dengan timeout, retry terbatas, penanganan 429, dan cache Next.
export async function safeFetch(url: string, init: RequestInit & { revalidate?: number; retries?: number; timeoutMs?: number } = {}): Promise<Response> {
  const { revalidate = 1800, retries = 2, timeoutMs = 8000, ...rest } = init;
  let last: unknown;
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, signal: ctrl.signal, next: { revalidate } });
      if (res.status === 429) {
        const wait = Number(res.headers.get('retry-after') ?? 1) * 1000;
        await new Promise((r) => setTimeout(r, Math.min(wait, 4000)));
        last = new Error('rate limited'); continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) { last = e; if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1))); }
    finally { clearTimeout(t); }
  }
  console.error('[provider] gagal', url, last);
  throw last instanceof Error ? last : new Error('fetch failed');
}
