'use client';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export interface Source { id: string; provider: string; url: string; format: 'mp4' | 'hls' | 'iframe'; quality: string | null; subtitle_url: string | null }

export default function Player({ episodeId, sources, startAt }: { episodeId: string; sources: Source[]; startAt: number }) {
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState('');
  const ref = useRef<HTMLVideoElement>(null);
  const src = sources[idx];

  useEffect(() => {
    setError('');
    const v = ref.current;
    if (!src || src.format === 'iframe' || !v) return;
    let hls: Hls | null = null;
    const onMeta = () => { if (startAt > 5) v.currentTime = startAt; };
    v.addEventListener('loadedmetadata', onMeta);
    if (src.format === 'hls' && Hls.isSupported()) {
      hls = new Hls(); hls.loadSource(src.url); hls.attachMedia(v);
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setError('Sumber video gagal dimuat. Coba server lain.'); });
    } else v.src = src.url;
    const save = () => { if (!v.duration) return;
      fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ episodeId, position: Math.floor(v.currentTime), duration: Math.floor(v.duration) }) }).catch(() => {}); };
    const timer = setInterval(() => { if (!v.paused) save(); }, 15000);
    v.addEventListener('pause', save);
    return () => { clearInterval(timer); v.removeEventListener('pause', save); v.removeEventListener('loadedmetadata', onMeta); hls?.destroy(); };
  }, [src, episodeId, startAt]);

  if (!sources.length) return <div className="grid aspect-video place-items-center rounded-xl border border-line p-4 text-center text-sm text-neutral-400">Belum ada sumber video untuk episode ini.</div>;
  return (
    <div>
      {src.format === 'iframe'
        ? <iframe src={src.url} className="aspect-video w-full rounded-xl" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation" />
        : <video ref={ref} controls playsInline className="aspect-video w-full rounded-xl bg-black" onError={() => setError('Sumber video gagal dimuat. Coba server lain.')}>
            {src.subtitle_url && <track kind="subtitles" src={src.subtitle_url} default />}
          </video>}
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {sources.map((s, i) => <button key={s.id} onClick={() => setIdx(i)} className={`rounded-full px-3 py-1 text-xs ${i === idx ? 'bg-accent text-black' : 'border border-line'}`}>{s.provider} {s.quality ?? ''}</button>)}
      </div>
    </div>);
}
