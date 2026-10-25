import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function remove(fd: FormData) { 'use server';
  const sb = await createClient(); const id = String(fd.get('id') ?? '');
  if (id === 'all') await sb.from('watch_history').delete().not('id', 'is', null); else await sb.from('watch_history').delete().eq('id', id);
  revalidatePath('/history'); }

export default async function History() {
  const sb = await createClient();
  const { data } = await sb.from('watch_history').select('id,episode_id,position_seconds,duration_seconds,updated_at,anime(title),episodes(number)').order('updated_at', { ascending: false });
  return (
    <div><div className="flex items-center justify-between"><h1 className="text-xl font-bold">Riwayat</h1>
      {!!data?.length && <form action={remove}><input type="hidden" name="id" value="all" /><button className="text-sm text-red-400">Hapus semua</button></form>}</div>
      {!data?.length && <p className="mt-6 text-neutral-400">Belum ada riwayat tontonan.</p>}
      {data?.map((h: any) => (<div key={h.id} className="mt-3 rounded-xl border border-line p-3">
        <p className="font-medium">{h.anime?.title}</p><p className="text-xs text-neutral-400">Eps {h.episodes?.number} · {new Date(h.updated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</p>
        <div className="my-2 h-1 rounded bg-line"><div className="h-1 rounded bg-accent" style={{ width: `${h.duration_seconds ? (h.position_seconds / h.duration_seconds) * 100 : 0}%` }} /></div>
        <div className="flex justify-between text-sm"><Link href={`/watch/${h.episode_id}`} className="text-accent">Lanjutkan</Link>
          <form action={remove}><input type="hidden" name="id" value={h.id} /><button className="text-red-400">Hapus</button></form></div></div>))}
    </div>);
}
