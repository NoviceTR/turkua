-- TurkUA CMS phase 2 data model.
-- Run after the 20260629 migrations. Existing frontend tables remain unchanged.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null default 'media',
  object_path text not null,
  public_url text,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique check (setting_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  value jsonb not null default '{}'::jsonb,
  description text not null default '',
  is_public boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null default 'main' check (content_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  eyebrow text not null default '',
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  primary_action_label text not null default '',
  primary_action_url text,
  secondary_action_label text not null default '',
  secondary_action_url text,
  background_media_id uuid references public.media_assets(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_key, locale)
);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  legacy_news_id uuid references public.news(id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  category_code text not null default 'general',
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  published_at timestamptz,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale),
  unique (legacy_news_id, locale)
);

create table if not exists public.tracker_data (
  id uuid primary key default gen_random_uuid(),
  dataset_key text not null default 'current' check (dataset_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  probability_1d numeric(5, 2) not null default 0 check (probability_1d between 0 and 100),
  probability_1m numeric(5, 2) not null default 0 check (probability_1m between 0 and 100),
  probability_1y numeric(5, 2) not null default 0 check (probability_1y between 0 and 100),
  confidence smallint not null default 0 check (confidence between 0 and 5),
  trend_percent numeric(6, 2) not null default 0,
  war_status_key text not null default '',
  negotiation_status_key text not null default '',
  trend_key text not null default '',
  reasoning_key text not null default '',
  developments jsonb not null default '[]'::jsonb check (jsonb_typeof(developments) = 'array'),
  news_items jsonb not null default '[]'::jsonb check (jsonb_typeof(news_items) = 'array'),
  observed_at timestamptz not null default now(),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.section_cards (
  id uuid primary key default gen_random_uuid(),
  section_key text not null check (section_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  card_key text not null check (card_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  badge text not null default '',
  icon_name text not null default '',
  action_label text not null default '',
  action_url text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_key, card_key, locale)
);

create table if not exists public.sponsored_ads (
  id uuid primary key default gen_random_uuid(),
  legacy_ad_id uuid references public.ads(id) on delete set null,
  campaign_key text not null check (campaign_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  slot_code text not null,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  advertiser_name text not null default '',
  title text not null default '',
  body text not null default '',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  target_url text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_key, locale),
  unique (legacy_ad_id, locale),
  check (end_date > start_date)
);

create table if not exists public.contact_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null default 'main' check (setting_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  email text,
  phone text,
  whatsapp text,
  telegram text,
  address text not null default '',
  working_hours text not null default '',
  form_enabled boolean not null default true,
  response_time_text text not null default '',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (setting_key, locale)
);

create index if not exists media_assets_active_order_idx
on public.media_assets (is_active, sort_order);

create index if not exists site_settings_public_order_idx
on public.site_settings (is_public, is_active, sort_order);

create index if not exists hero_content_locale_order_idx
on public.hero_content (locale, is_active, sort_order);

create index if not exists news_items_publication_idx
on public.news_items (locale, status, is_active, is_featured, published_at desc);

create index if not exists tracker_data_current_idx
on public.tracker_data (dataset_key, is_active, observed_at desc);

create index if not exists section_cards_section_order_idx
on public.section_cards (section_key, locale, is_active, sort_order);

create index if not exists sponsored_ads_schedule_idx
on public.sponsored_ads (slot_code, locale, is_active, start_date, end_date);

create index if not exists contact_settings_locale_order_idx
on public.contact_settings (locale, is_active, sort_order);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'media_assets',
    'site_settings',
    'hero_content',
    'news_items',
    'tracker_data',
    'section_cards',
    'sponsored_ads',
    'contact_settings'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I ' ||
      'for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

drop policy if exists "Public reads active media metadata" on public.media_assets;
create policy "Public reads active media metadata" on public.media_assets
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage media metadata" on public.media_assets;
create policy "Admins manage media metadata" on public.media_assets
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads public site settings" on public.site_settings;
create policy "Public reads public site settings" on public.site_settings
for select using ((is_public and is_active) or public.is_admin());
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active hero content" on public.hero_content;
create policy "Public reads active hero content" on public.hero_content
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage hero content" on public.hero_content;
create policy "Admins manage hero content" on public.hero_content
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads published news items" on public.news_items;
create policy "Public reads published news items" on public.news_items
for select using (
  public.is_admin() or (
    is_active
    and status = 'published'
    and published_at is not null
    and published_at <= now()
  )
);
drop policy if exists "Admins manage news items" on public.news_items;
create policy "Admins manage news items" on public.news_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active tracker data" on public.tracker_data;
create policy "Public reads active tracker data" on public.tracker_data
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage tracker data" on public.tracker_data;
create policy "Admins manage tracker data" on public.tracker_data
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active section cards" on public.section_cards;
create policy "Public reads active section cards" on public.section_cards
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage section cards" on public.section_cards;
create policy "Admins manage section cards" on public.section_cards
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads scheduled sponsored ads" on public.sponsored_ads;
create policy "Public reads scheduled sponsored ads" on public.sponsored_ads
for select using (
  public.is_admin() or (
    is_active
    and start_date <= now()
    and end_date > now()
  )
);
drop policy if exists "Admins manage sponsored ads" on public.sponsored_ads;
create policy "Admins manage sponsored ads" on public.sponsored_ads
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active contact settings" on public.contact_settings;
create policy "Public reads active contact settings" on public.contact_settings
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage contact settings" on public.contact_settings;
create policy "Admins manage contact settings" on public.contact_settings
for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.replace_media_asset_references(
  p_old_media_id uuid,
  p_new_media_id uuid,
  p_old_object_path text,
  p_new_object_path text,
  p_new_public_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required';
  end if;

  update public.hero_content
  set background_media_id = p_new_media_id
  where background_media_id = p_old_media_id;

  update public.news_items
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.section_cards
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.sponsored_ads
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.news
  set image_path = p_new_object_path,
      image_url = p_new_public_url
  where image_path = p_old_object_path;

  update public.ads
  set image_path = p_new_object_path,
      image_url = p_new_public_url
  where image_path = p_old_object_path;
end;
$$;

revoke all on function public.replace_media_asset_references(
  uuid, uuid, text, text, text
) from public;
grant execute on function public.replace_media_asset_references(
  uuid, uuid, text, text, text
) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_settings',
    'hero_content',
    'news_items',
    'tracker_data',
    'section_cards',
    'sponsored_ads',
    'contact_settings',
    'media_assets'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
