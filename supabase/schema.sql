-- Run this once in Supabase > SQL Editor.
create table if not exists public.app_records (
  collection_name text not null,
  record_id text not null,
  record_data jsonb not null default '{}'::jsonb,
  actor_id text,
  owner_id text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (collection_name, record_id)
);

create index if not exists app_records_collection_idx
  on public.app_records (collection_name, updated_at);

create index if not exists app_records_owner_idx
  on public.app_records (owner_id);

alter table public.app_records enable row level security;

-- Phase 1 policy: lets the current app sync using the public anon key.
-- IMPORTANT: replace these policies with Supabase Auth based policies in the
-- authentication phase before storing sensitive production data.
drop policy if exists "app_records_anon_read" on public.app_records;
create policy "app_records_anon_read"
  on public.app_records for select
  to anon
  using (true);

drop policy if exists "app_records_anon_insert" on public.app_records;
create policy "app_records_anon_insert"
  on public.app_records for insert
  to anon
  with check (true);

drop policy if exists "app_records_anon_update" on public.app_records;
create policy "app_records_anon_update"
  on public.app_records for update
  to anon
  using (true)
  with check (true);
