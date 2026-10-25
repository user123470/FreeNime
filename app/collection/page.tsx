import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export default async function Collection() {
  const sb = await createClient();
  const [fav, sub] = await Promise.all([
    sb.from('favorites').select('anime(slug,title,poster_url,status,latest_episode,next_airing_at)'),
    sb.from('anime_subscriptions').select('anime(slug,title,poster_url,status,latest_episode,next_airing_at)')]);
  const Grid = ({ title, rows }: { title: string; rows: any[] | null }) => (
    <section className="mt-5"><h2 className="mb-2 font-bold">{title}</h2>
      {!rows?.length ? <p className="text-sm text-neutral-400">Kosong.</p> : <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {rows.map(({ anime: a }) => (<Link key={a.slug} href={`/anime/${a.slug}`}><div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-line">{a.poster_url && <Image src={a.poster_url} alt="" fill sizes="150px" className="object-cover" />}</div>
          <p className="mt-1 line-clamp-2 text-xs">{a.title}</p><p className="text-[11px] text-neutral-400">{a.status}{a.latest_episode ? ` · Eps ${a.latest_episode}` : ''}</p></Link>))}</div>}
    </section>);
  return (<div><h1 className="text-xl font-bold">Koleksi</h1><Grid title="Disubscribe" rows={sub.data} /><Grid title="Favorit" rows={fav.data} /></div>);
}
