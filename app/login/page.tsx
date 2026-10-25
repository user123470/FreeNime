'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const sb = createClient();
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'reset'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [cooldown, setCooldown] = useState(0);
  const redirectTo = typeof window !== 'undefined' ? `${location.origin}/auth/callback` : undefined;

  const startCooldown = () => { setCooldown(60); const t = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000); };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      if (mode === 'login') { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; location.href = '/'; }
      else if (mode === 'register') {
        if (password.length < 8) throw new Error('Password minimal 8 karakter.');
        const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } }); if (error) throw error;
        setMode('otp'); startCooldown(); setMsg('Kode verifikasi dikirim ke email Anda.');
      } else if (mode === 'otp') { const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'signup' }); if (error) throw new Error('Kode salah atau kedaluwarsa.'); location.href = '/'; }
      else { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo }); if (error) throw error; setMsg('Link reset password dikirim.'); }
    } catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  }
  async function resend() { const { error } = await sb.auth.resend({ type: 'signup', email }); setMsg(error ? error.message : 'Kode dikirim ulang.'); if (!error) startCooldown(); }
  const input = 'w-full rounded-xl border border-line bg-card px-4 py-3 text-sm';
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">{mode === 'register' ? 'Daftar' : mode === 'otp' ? 'Verifikasi Email' : mode === 'reset' ? 'Reset Password' : 'Masuk'}</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {(mode === 'login' || mode === 'register') && <input className={input} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        {mode === 'otp' && <input className={input} inputMode="numeric" required placeholder="Kode OTP" value={code} onChange={(e) => setCode(e.target.value)} />}
        <button disabled={busy} className="w-full rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-60">{busy ? 'Memproses…' : 'Lanjut'}</button>
      </form>
      {mode === 'otp' && <button disabled={cooldown > 0} onClick={resend} className="text-sm text-accent disabled:text-neutral-500">{cooldown ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}</button>}
      {msg && <p role="alert" className="text-sm text-yellow-300">{msg}</p>}
      {(mode === 'login' || mode === 'register') && <button onClick={() => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })} className="w-full rounded-xl border border-line py-3 text-sm">Lanjut dengan Google</button>}
      <div className="flex justify-between text-sm text-neutral-400">
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}</button>
        <button onClick={() => setMode('reset')}>Lupa password</button>
      </div>
    </div>);
}
