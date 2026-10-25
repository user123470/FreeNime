import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { providers } from '@/lib/providers';

export default async function Admin() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login');
  const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin') redirect('/');  // cek role di server, bukan dari klien
  const [a, e, logs] = await Promise.all([sb.from('anime').select('id', { count: 'exact', head: true }), sb.from('episodes').select('id', { count: 'exact', head: true }), sb.from('provider_sync_logs').select('*').order('created_at', { ascending: false }).limit(20)]);
  return (
    <div><h1 className="text-xl font-bold">Admin</h1>
      <p className="mt-2 text-sm">Anime: {a.count} · Episode: {e.count}</p>
      <h2 className="mt-4 font-semibold">Provider</h2>
      {providers.map((pr) => <p key={pr.name} className="text-sm">{pr.name}: {pr.enabled() ? 'aktif' : 'nonaktif (env belum diisi)'}</p>)}
      <h2 className="mt-4 font-semibold">Log sinkronisasi</h2>
      {logs.data?.map((l) => <p key={l.id} className={`text-xs ${l.ok ? '' : 'text-red-400'}`}>{new Date(l.created_at).toLocaleString('id-ID')} · {l.provider} · {l.ok ? 'OK' : 'GAGAL'} · {l.message}</p>)}
      <p className="mt-4 text-sm text-neutral-400">Manajemen episode & sumber video: gunakan tabel episodes / video_sources via Supabase Table Editor (policy admin sudah aktif). UI CRUD belum dibuat.</p></div>);
    }
        
