import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

async function save(fd: FormData) { 'use server';
  const name = z.string().trim().min(2).max(40).safeParse(fd.get('name')); if (!name.success) return;
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) return;
  await sb.from('profiles').update({ display_name: name.data }).eq('id', user.id); revalidatePath('/profile'); }
async function logout() { 'use server'; const sb = await createClient(); await sb.auth.signOut(); redirect('/login'); }

export default async function Profile() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login');
  const { data: p } = await sb.from('profiles').select('display_name,role').eq('id', user.id).single();
  return (
    <div className="space-y-4"><h1 className="text-xl font-bold">Profil</h1>
      <p className="text-sm text-neutral-400">{user.email} · {user.email_confirmed_at ? 'Terverifikasi' : 'Belum terverifikasi'}</p>
      <form action={save} className="flex gap-2"><input name="name" defaultValue={p?.display_name ?? ''} className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm" /><button className="rounded-xl bg-accent px-4 text-sm font-semibold text-black">Simpan</button></form>
      <nav className="flex flex-col gap-2 text-sm"><Link href="/history">Riwayat tontonan</Link><Link href="/collection">Favorit & subscription</Link><Link href="/settings">Pengaturan</Link>{p?.role === 'admin' && <Link href="/admin" className="text-accent">Dashboard admin</Link>}</nav>
      <form action={logout}><button className="text-red-400">Logout</button></form></div>);
}
