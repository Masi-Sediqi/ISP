-- Afghan Power / Supabase runtime performance fix
-- Safe to run more than once.

create index if not exists app_records_active_collection_updated_idx
on public.app_records (collection_name, updated_at)
where deleted_at is null;

analyze public.app_records;
