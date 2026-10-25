import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function act(fd: FormData) { 'use server';
  const sb = await createClient(); const op = String(fd.get('op')); const id = String(fd.get('id') ?? '');
  if (op === 'read') await sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (op === 'readall') await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (op === 'del') await sb.from('notifications').delete().eq('id', id);
  revalidatePath('/notifications'); }

export default async function Notifications() {
  const sb = await createClient();
  const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  return (
    <div><div className="flex justify-between"><h1 className="text-xl font-bold">Notifikasi</h1>
      <form action={act}><input type="hidden" name="op" value="readall" /><button className="text-sm text-accent">Tandai semua dibaca</button></form></div>
      {!data?.length && <p className="mt-6 text-neutral-400">Belum ada notifikasi. Subscribe anime untuk mendapat kabar episode baru.</p>}
      {data?.map((n) => (<div key={n.id} className={`mt-3 rounded-xl border p-3 ${n.read_at ? 'border-line' : 'border-accent'}`}>
        <Link href={n.link ?? '#'}><p className="font-medium">{n.title}</p><p className="text-sm text-neutral-400">{n.body}</p></Link>
        <div className="mt-2 flex gap-4 text-xs">
          {!n.read_at && <form action={act}><input type="hidden" name="op" value="read" /><input type="hidden" name="id" value={n.id} /><button className="text-accent">Tandai dibaca</button></form>}
          <form action={act}><input type="hidden" name="op" value="del" /><input type="hidden" name="id" value={n.id} /><button className="text-red-400">Hapus</button></form></div></div>))}
    </div>);
}
