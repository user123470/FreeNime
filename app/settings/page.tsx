import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

async function save(fd: FormData) { 'use server';
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) return;
  const b = (k: string) => fd.get(k) === 'on';
  await sb.from('notification_preferences').update({ enabled: b('enabled'), new_anime: b('new_anime'), new_episode: b('new_episode'), subscribed: b('subscribed') }).eq('user_id', user.id);
  const mode = z.enum(['default', 'solid', 'gradient', 'image']).catch('default').parse(fd.get('bg_mode'));
  const value = z.string().max(300).regex(/^(#[0-9a-fA-F]{6}|https:\/\/[^\s]+|linear-gradient\([^;]*\))?$/).catch('').parse(fd.get('bg_value') ?? '');
  await sb.from('user_preferences').update({ bg_mode: mode, bg_value: value || null, overlay: z.coerce.number().min(0).max(1).catch(0.6).parse(fd.get('overlay')), blur: z.coerce.number().int().min(0).max(20).catch(0).parse(fd.get('blur')) }).eq('user_id', user.id);
  revalidatePath('/settings'); }

export default async function Settings() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser();
  const [{ data: n }, { data: u }] = await Promise.all([sb.from('notification_preferences').select('*').eq('user_id', user!.id).single(), sb.from('user_preferences').select('*').eq('user_id', user!.id).single()]);
  const Chk = ({ name, label, on }: { name: string; label: string; on?: boolean }) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={on} />{label}</label>;
  const f = 'rounded-xl border border-line bg-card px-3 py-2 text-sm w-full';
  return (
    <form action={save} className="space-y-4"><h1 className="text-xl font-bold">Pengaturan</h1>
      <h2 className="font-semibold">Notifikasi</h2>
      <Chk name="enabled" label="Aktifkan notifikasi" on={n?.enabled} /><Chk name="new_anime" label="Anime baru" on={n?.new_anime} /><Chk name="new_episode" label="Episode baru" on={n?.new_episode} /><Chk name="subscribed" label="Anime yang di-subscribe" on={n?.subscribed} />
      <h2 className="font-semibold">Background</h2>
      <select name="bg_mode" defaultValue={u?.bg_mode} className={f}><option value="default">Default</option><option value="solid">Warna solid</option><option value="gradient">Gradient</option><option value="image">Gambar (URL https)</option></select>
      <input name="bg_value" defaultValue={u?.bg_value ?? ''} placeholder="#101820 / linear-gradient(...) / https://..." className={f} />
      <label className="block text-sm">Gelap overlay<input type="range" name="overlay" min="0" max="1" step="0.05" defaultValue={u?.overlay} className="w-full" /></label>
      <label className="block text-sm">Blur<input type="range" name="blur" min="0" max="20" defaultValue={u?.blur} className="w-full" /></label>
      <button className="rounded-xl bg-accent px-5 py-2 font-semibold text-black">Simpan</button></form>);
}
