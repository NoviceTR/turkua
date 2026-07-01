-- TurkUA Supabase bootstrap prerequisites.
-- Run this file before every other migration.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regnamespace('auth') is null
    or to_regclass('auth.users') is null
    or to_regprocedure('auth.uid()') is null
    or to_regprocedure('auth.jwt()') is null
  then
    raise exception
      'Supabase Auth prerequisites are missing. Run these migrations in a Supabase project.';
  end if;

  if to_regnamespace('storage') is null
    or to_regclass('storage.buckets') is null
    or to_regclass('storage.objects') is null
  then
    raise exception
      'Supabase Storage prerequisites are missing. Enable Storage, then rerun this bootstrap.';
  end if;

  if not exists (select 1 from pg_roles where rolname = 'anon')
    or not exists (select 1 from pg_roles where rolname = 'authenticated')
    or not exists (select 1 from pg_roles where rolname = 'service_role')
  then
    raise exception
      'Required Supabase database roles are missing.';
  end if;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;
end
$$;

comment on function public.is_admin() is
  'Returns true when the current Supabase JWT has app_metadata.role=admin.';

comment on function public.set_updated_at() is
  'Shared trigger function that refreshes an updated_at column before update.';
