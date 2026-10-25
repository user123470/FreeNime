'use client';
import { useState } from 'react';
import { Bell, BellOff, Heart } from 'lucide-react';

export default function SubscribeButtons({ sourceId, initial }: { sourceId: string; initial: { subscribed: boolean; favorite: boolean } }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function toggle(kind: 'subscribe' | 'favorite') {
    setBusy(true); setMsg('');
    const key = kind === 'subscribe' ? 'subscribed' : 'favorite';
    const on = !state[key];
    const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId, kind, on }) });
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (res.ok) setState({ ...state, [key]: on }); else setMsg('Gagal menyimpan, coba lagi.');
    setBusy(false);
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => toggle('subscribe')} className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
        {state.subscribed ? <BellOff size={16} /> : <Bell size={16} />}{state.subscribed ? 'Unsubscribe' : 'Subscribe'}
      </button>
      <button disabled={busy} onClick={() => toggle('favorite')} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm disabled:opacity-60">
        <Heart size={16} className={state.favorite ? 'fill-red-500 text-red-500' : ''} />Favorit
      </button>
      {msg && <p role="alert" className="w-full text-sm text-red-400">{msg}</p>}
    </div>);
}
