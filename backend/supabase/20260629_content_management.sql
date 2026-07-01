-- TürkUA news, advertising and media management.
-- Run after the i18n migrations.

create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]+$'),
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.news_category_localizations (
  category_id uuid not null references public.news_categories(id) on delete cascade,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  name text not null,
  primary key (category_id, locale)
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id uuid not null references public.news_categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_path text,
  image_url text,
  source_url text,
  published_at timestamptz,
  is_featured boolean not null default false,
  is_live boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_localizations (
  news_id uuid not null references public.news(id) on delete cascade,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  primary key (news_id, locale)
);

create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9_-]+$'),
  slot_type text not null check (slot_type in ('banner', 'sidebar', 'popup', 'sponsor', 'leaderboard')),
  name text not null,
  width integer,
  height integer,
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ad_slots(id) on delete restrict,
  name text not null,
  headline text not null default '',
  image_path text,
  image_url text,
  target_url text,
  alt_text text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.ad_daily_stats (
  ad_id uuid not null references public.ads(id) on delete cascade,
  stat_date date not null default current_date,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  primary key (ad_id, stat_date)
);

create index if not exists news_publication_idx on public.news (status, published_at desc);
create index if not exists news_category_idx on public.news (category_id);
create index if not exists ads_schedule_idx on public.ads (is_active, starts_at, ends_at);
create index if not exists ad_daily_stats_date_idx on public.ad_daily_stats (stat_date desc);

drop trigger if exists set_news_updated_at on public.news;
create trigger set_news_updated_at before update on public.news
for each row execute function public.set_updated_at();

drop trigger if exists set_ads_updated_at on public.ads;
create trigger set_ads_updated_at before update on public.ads
for each row execute function public.set_updated_at();

alter table public.news_categories enable row level security;
alter table public.news_category_localizations enable row level security;
alter table public.news enable row level security;
alter table public.news_localizations enable row level security;
alter table public.ad_slots enable row level security;
alter table public.ads enable row level security;
alter table public.ad_daily_stats enable row level security;

drop policy if exists "Public reads enabled news categories" on public.news_categories;
create policy "Public reads enabled news categories" on public.news_categories
for select using (enabled or public.is_admin());

drop policy if exists "Public reads category localizations" on public.news_category_localizations;
create policy "Public reads category localizations" on public.news_category_localizations
for select using (
  public.is_admin() or exists (
    select 1 from public.news_categories category
    where category.id = category_id and category.enabled
  )
);

drop policy if exists "Public reads published news" on public.news;
create policy "Public reads published news" on public.news
for select using (
  public.is_admin() or (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  )
);

drop policy if exists "Public reads published news localizations" on public.news_localizations;
create policy "Public reads published news localizations" on public.news_localizations
for select using (
  public.is_admin() or exists (
    select 1 from public.news item
    where item.id = news_id
      and item.status = 'published'
      and item.published_at is not null
      and item.published_at <= now()
  )
);

drop policy if exists "Admins manage news categories" on public.news_categories;
create policy "Admins manage news categories" on public.news_categories
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage category localizations" on public.news_category_localizations;
create policy "Admins manage category localizations" on public.news_category_localizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage news" on public.news;
create policy "Admins manage news" on public.news
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage news localizations" on public.news_localizations;
create policy "Admins manage news localizations" on public.news_localizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads enabled ad slots" on public.ad_slots;
create policy "Public reads enabled ad slots" on public.ad_slots
for select using (enabled or public.is_admin());

drop policy if exists "Public reads scheduled ads" on public.ads;
create policy "Public reads scheduled ads" on public.ads
for select using (
  public.is_admin() or (
    is_active
    and starts_at <= now()
    and ends_at > now()
  )
);

drop policy if exists "Admins manage ad slots" on public.ad_slots;
create policy "Admins manage ad slots" on public.ad_slots
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage ads" on public.ads;
create policy "Admins manage ads" on public.ads
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read ad statistics" on public.ad_daily_stats;
create policy "Admins read ad statistics" on public.ad_daily_stats
for select using (public.is_admin());

create or replace function public.record_ad_event(p_ad_id uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('impression', 'click') then
    raise exception 'Unsupported advertising event';
  end if;

  if not exists (
    select 1 from public.ads
    where id = p_ad_id
      and is_active
      and starts_at <= now()
      and ends_at > now()
  ) then
    return;
  end if;

  update public.ads
  set impressions = impressions + case when p_event = 'impression' then 1 else 0 end,
      clicks = clicks + case when p_event = 'click' then 1 else 0 end
  where id = p_ad_id;

  insert into public.ad_daily_stats (ad_id, stat_date, impressions, clicks)
  values (
    p_ad_id,
    current_date,
    case when p_event = 'impression' then 1 else 0 end,
    case when p_event = 'click' then 1 else 0 end
  )
  on conflict (ad_id, stat_date) do update
  set impressions = public.ad_daily_stats.impressions + excluded.impressions,
      clicks = public.ad_daily_stats.clicks + excluded.clicks;
end;
$$;

revoke all on function public.record_ad_event(uuid, text) from public;
grant execute on function public.record_ad_event(uuid, text) to anon, authenticated;

insert into public.news_categories (code, sort_order) values
  ('general', 10),
  ('military', 20),
  ('diplomatic', 30),
  ('economic', 40),
  ('humanitarian', 50),
  ('education', 60),
  ('visa', 70),
  ('trade', 80)
on conflict (code) do update set sort_order = excluded.sort_order;

insert into public.news_category_localizations (category_id, locale, name)
select category.id, seed.locale, seed.name
from public.news_categories category
join (values
  ('general', 'tr', 'Gündem'), ('general', 'ua', 'Новини'),
  ('military', 'tr', 'Askeri'), ('military', 'ua', 'Військове'),
  ('diplomatic', 'tr', 'Diplomasi'), ('diplomatic', 'ua', 'Дипломатія'),
  ('economic', 'tr', 'Ekonomi'), ('economic', 'ua', 'Економіка'),
  ('humanitarian', 'tr', 'İnsani'), ('humanitarian', 'ua', 'Гуманітарне'),
  ('education', 'tr', 'Eğitim'), ('education', 'ua', 'Освіта'),
  ('visa', 'tr', 'Vize'), ('visa', 'ua', 'Віза'),
  ('trade', 'tr', 'Ticaret'), ('trade', 'ua', 'Торгівля')
) as seed(code, locale, name) on seed.code = category.code
on conflict (category_id, locale) do update set name = excluded.name;

insert into public.ad_slots (code, slot_type, name, width, height, sort_order) values
  ('top', 'leaderboard', 'Üst LeaderBoard', 728, 90, 10),
  ('midLeft', 'banner', 'Orta Sol Banner', 300, 250, 20),
  ('midRight', 'banner', 'Orta Sağ Banner', 300, 250, 30),
  ('sidebar', 'sidebar', 'Sabit Sidebar', 300, 600, 40),
  ('popup', 'popup', 'Popup', 600, 500, 50),
  ('sponsor1', 'sponsor', 'Sponsor Alanı 1', 360, 180, 60),
  ('sponsor2', 'sponsor', 'Sponsor Alanı 2', 360, 180, 70),
  ('sponsor3', 'sponsor', 'Sponsor Alanı 3', 360, 180, 80)
on conflict (code) do update set
  slot_type = excluded.slot_type,
  name = excluded.name,
  width = excluded.width,
  height = excluded.height,
  sort_order = excluded.sort_order;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('ads', 'ads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media" on storage.objects
for insert to authenticated with check (
  bucket_id in ('media', 'ads') and public.is_admin()
);

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media" on storage.objects
for update to authenticated using (
  bucket_id in ('media', 'ads') and public.is_admin()
) with check (
  bucket_id in ('media', 'ads') and public.is_admin()
);

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media" on storage.objects
for delete to authenticated using (
  bucket_id in ('media', 'ads') and public.is_admin()
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'news'
  ) then
    alter publication supabase_realtime add table public.news;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'news_localizations'
  ) then
    alter publication supabase_realtime add table public.news_localizations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;
end
$$;
