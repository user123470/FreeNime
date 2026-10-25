create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) between 2 and 40),
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create table anime (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  alt_titles text[] not null default '{}',
  synopsis text, poster_url text, banner_url text,
  genres text[] not null default '{}',
  year int, season text, status text check (status in ('ongoing','completed','upcoming','unknown')) default 'unknown',
  rating numeric(4,2), total_episodes int, latest_episode int, next_airing_at timestamptz,
  source text not null, source_id text not null, source_url text,
  last_synced_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (source, source_id)
);
create index on anime (status); create index on anime (updated_at desc); create index on anime using gin (genres);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  anime_id uuid not null references anime on delete cascade,
  number numeric not null, title text, aired_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (anime_id, number)
);

create table video_sources (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes on delete cascade,
  provider text not null, url text not null check (url ~* '^https://'),
  format text not null check (format in ('mp4','hls','iframe')),
  quality text, language text, subtitle_url text,
  priority int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on video_sources (episode_id, priority);

create table watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  anime_id uuid not null references anime on delete cascade,
  episode_id uuid not null references episodes on delete cascade,
  position_seconds int not null default 0, duration_seconds int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, anime_id)
);
create index on watch_history (user_id, updated_at desc);

create table favorites (
  user_id uuid not null references auth.users on delete cascade,
  anime_id uuid not null references anime on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, anime_id)
);
create table anime_subscriptions (
  user_id uuid not null references auth.users on delete cascade,
  anime_id uuid not null references anime on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('new_anime','new_episode','subscribed_update','schedule_change')),
  title text not null, body text, link text,
  dedupe_key text not null, read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index on notifications (user_id, read_at, created_at desc);

create table notification_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  enabled boolean not null default true, new_anime boolean not null default true,
  new_episode boolean not null default true, subscribed boolean not null default true,
  browser_push boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  bg_mode text not null default 'default' check (bg_mode in ('default','solid','gradient','image')),
  bg_value text, overlay numeric not null default 0.6 check (overlay between 0 and 1),
  blur int not null default 0 check (blur between 0 and 20),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table provider_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null, ok boolean not null, message text, items int default 0,
  created_at timestamptz not null default now()
);

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['profiles','anime','episodes','video_sources','watch_history','favorites','anime_subscriptions','notifications','notification_preferences','user_preferences'] loop
    execute format('create trigger trg_%1$s_upd before update on %1$s for each row execute function set_updated_at()', t);
  end loop; end $$;

-- new user bootstrap
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into notification_preferences (user_id) values (new.id);
  insert into user_preferences (user_id) values (new.id);
  return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table anime enable row level security;
alter table episodes enable row level security;
alter table video_sources enable row level security;
alter table watch_history enable row level security;
alter table favorites enable row level security;
alter table anime_subscriptions enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table user_preferences enable row level security;
alter table provider_sync_logs enable row level security;

-- role tidak bisa diubah user: hanya kolom tertentu yang boleh di-update
revoke update on profiles from authenticated;
grant update (display_name, avatar_url) on profiles to authenticated;
create policy profiles_read on profiles for select using (auth.uid() = id or is_admin());
create policy profiles_update on profiles for update using (auth.uid() = id);

create policy anime_read on anime for select using (true);
create policy anime_admin on anime for all using (is_admin()) with check (is_admin());
create policy episodes_read on episodes for select using (true);
create policy episodes_admin on episodes for all using (is_admin()) with check (is_admin());
create policy sources_read on video_sources for select using (active);
create policy sources_admin on video_sources for all using (is_admin()) with check (is_admin());

create policy own_history on watch_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_fav on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_sub on anime_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_notif_read on notifications for select using (auth.uid() = user_id);
create policy own_notif_upd on notifications for update using (auth.uid() = user_id);
create policy own_notif_del on notifications for delete using (auth.uid() = user_id);
create policy own_nprefs on notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_uprefs on user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy logs_admin on provider_sync_logs for select using (is_admin());

-- Storage bucket untuk avatar/background (path: <user_id>/<file>)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-media','user-media', true, 2097152, array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy media_read on storage.objects for select using (bucket_id = 'user-media');
create policy media_write on storage.objects for insert with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete on storage.objects for delete using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
-- Jadikan admin: update profiles set role='admin' where id='<uuid>'; (jalankan manual di SQL editor)
