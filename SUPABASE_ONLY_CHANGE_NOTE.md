# Supabase-only conversion

Changed the application from Local-first (IndexedDB + sync queue) to Supabase-only persistence.

Key changes:
- Removed IndexedDB collection reads/writes.
- Removed offline sync queue behavior.
- `useJsonCollection` now loads and saves directly against Supabase.
- `useLocalCollection` keeps its old name for compatibility but now uses Supabase only.
- Employee activity records are written directly to Supabase.
- Recycle Bin is Supabase-only and restore writes directly back to the source collection.
- Backup/Restore now treats Supabase as the central/only business-data source.
- Offline saves fail safely and rollback the optimistic UI update.
- Existing legacy IndexedDB is not automatically deleted to avoid destroying any old unsynced records; the new application does not access it.
