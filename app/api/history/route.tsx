import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Body = z.object({ episodeId: z.string().uuid(), position: z.number().int().min(0), duration: z.number().int().min(0) });
export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { data: ep } = await sb.from('episodes').select('anime_id').eq('id', p.data.episodeId).single();
  if (!ep) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { error } = await sb.from('watch_history').upsert({ user_id: user.id, anime_id: ep.anime_id, episode_id: p.data.episodeId, position_seconds: p.data.position, duration_seconds: p.data.duration }, { onConflict: 'user_id,anime_id' });
  return error ? NextResponse.json({ error: 'db' }, { status: 500 }) : NextResponse.json({ ok: true });
}
