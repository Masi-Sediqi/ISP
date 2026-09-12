# Supabase-Only Storage

This project now uses Supabase as the only persistence layer for business collections.

## Required Vercel / local environment variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

The existing `supabase/schema.sql` must already be applied.

## Storage behavior

- Business collections are loaded directly from `app_records` in Supabase.
- Create, edit and delete operations are written directly to Supabase.
- There is no IndexedDB read, write, queue or offline cache in the application code.
- If the internet is unavailable, a save is rejected and the UI rolls back the optimistic change.
- Other browsers/devices receive changes through periodic Supabase refreshes.
- Recycle Bin records are also stored in Supabase.
- Backup/Restore uses the central Supabase rows only for business data.

Browser `localStorage` is still used for non-business client preferences/session values such as language, theme and the current signed-in session. It is not used as the persistence layer for normal business collections.

## Legacy IndexedDB

Older versions of the app may have created a browser database named `afghan-power-local`.
The new code never opens or uses it. It is intentionally not deleted automatically so that any old unsynced data is not destroyed without review.
