-- TürkUA contact, application, spam protection and rate limiting.
-- Run after the i18n and content-management migrations.

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('contact', 'advertising', 'shop')),
  locale text not null default 'tr',
  name text not null,
  email text,
  phone text,
  subject text not null default '',
  message text not null default '',
  details jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'closed', 'spam')),
  attachment_path text,
  attachment_name text,
  telegram_notified boolean not null default false,
  telegram_error text,
  internal_notes text not null default '',
  ip_hash text not null,
  dedupe_hash text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_rate_limits (
  key_hash text not null,
  form_type text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key_hash, form_type)
);

create index if not exists submissions_status_date_idx
on public.submissions (status, created_at desc);

create index if not exists submissions_type_date_idx
on public.submissions (form_type, created_at desc);

create index if not exists submissions_dedupe_idx
on public.submissions (dedupe_hash, created_at desc);

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;
alter table public.submission_rate_limits enable row level security;

drop policy if exists "Admins manage submissions" on public.submissions;
create policy "Admins manage submissions" on public.submissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins inspect submission rate limits" on public.submission_rate_limits;
create policy "Admins inspect submission rate limits" on public.submission_rate_limits
for select using (public.is_admin());

create or replace function public.create_public_submission(
  p_form_type text,
  p_locale text,
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text,
  p_details jsonb,
  p_ip_hash text,
  p_dedupe_hash text,
  p_user_agent text,
  p_rate_limit integer
)
returns table (submission_id uuid, accepted boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  created_id uuid;
begin
  if p_form_type not in ('contact', 'advertising', 'shop') then
    return query select null::uuid, false, 'invalid_form';
    return;
  end if;

  if random() < 0.02 then
    delete from public.submission_rate_limits
    where updated_at < now() - interval '7 days';
  end if;

  insert into public.submission_rate_limits (
    key_hash, form_type, window_started_at, request_count, updated_at
  ) values (
    p_ip_hash, p_form_type, now(), 1, now()
  )
  on conflict (key_hash, form_type) do update set
    request_count = case
      when public.submission_rate_limits.window_started_at <= now() - interval '1 hour' then 1
      else public.submission_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.submission_rate_limits.window_started_at <= now() - interval '1 hour' then now()
      else public.submission_rate_limits.window_started_at
    end,
    updated_at = now()
  returning request_count into current_count;

  if current_count > greatest(1, least(p_rate_limit, 20)) then
    return query select null::uuid, false, 'rate_limited';
    return;
  end if;

  if exists (
    select 1 from public.submissions
    where dedupe_hash = p_dedupe_hash
      and created_at > now() - interval '15 minutes'
  ) then
    return query select null::uuid, false, 'duplicate';
    return;
  end if;

  insert into public.submissions (
    form_type, locale, name, email, phone, subject, message, details,
    ip_hash, dedupe_hash, user_agent
  ) values (
    p_form_type,
    left(coalesce(nullif(p_locale, ''), 'tr'), 10),
    left(trim(p_name), 120),
    nullif(left(trim(coalesce(p_email, '')), 180), ''),
    nullif(left(trim(coalesce(p_phone, '')), 80), ''),
    left(trim(coalesce(p_subject, '')), 180),
    left(trim(coalesce(p_message, '')), 5000),
    coalesce(p_details, '{}'::jsonb),
    p_ip_hash,
    p_dedupe_hash,
    left(coalesce(p_user_agent, ''), 500)
  )
  returning id into created_id;

  return query select created_id, true, 'accepted';
end;
$$;

revoke all on function public.create_public_submission(
  text, text, text, text, text, text, text, jsonb, text, text, text, integer
) from public;

grant execute on function public.create_public_submission(
  text, text, text, text, text, text, text, jsonb, text, text, text, integer
) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read submission files" on storage.objects;
create policy "Admins read submission files" on storage.objects
for select to authenticated using (
  bucket_id = 'submissions' and public.is_admin()
);

drop policy if exists "Admins delete submission files" on storage.objects;
create policy "Admins delete submission files" on storage.objects
for delete to authenticated using (
  bucket_id = 'submissions' and public.is_admin()
);

insert into public.translations (content_key, locale, section, content_type, status, value) values
  ('submission.success', 'tr', 'contact', 'text', 'published', 'Başvurunuz alındı. En kısa sürede dönüş yapacağız.'),
  ('submission.success', 'ua', 'contact', 'text', 'published', 'Вашу заявку отримано. Ми зв''яжемося з вами найближчим часом.'),
  ('submission.rateLimited', 'tr', 'contact', 'text', 'published', 'Çok kısa sürede fazla başvuru yapıldı. Lütfen daha sonra tekrar deneyin.'),
  ('submission.rateLimited', 'ua', 'contact', 'text', 'published', 'Забагато заявок за короткий час. Спробуйте пізніше.'),
  ('submission.duplicate', 'tr', 'contact', 'text', 'published', 'Bu başvuru kısa süre önce alındı.'),
  ('submission.duplicate', 'ua', 'contact', 'text', 'published', 'Цю заявку вже було отримано нещодавно.'),
  ('submission.error', 'tr', 'contact', 'text', 'published', 'Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin.'),
  ('submission.error', 'ua', 'contact', 'text', 'published', 'Не вдалося надіслати заявку. Спробуйте пізніше.')
on conflict (content_key, locale) do update set
  value = excluded.value,
  status = excluded.status,
  updated_at = now();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end
$$;
