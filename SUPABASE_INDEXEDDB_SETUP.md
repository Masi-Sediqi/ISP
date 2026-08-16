# IndexedDB + Supabase Setup

## 1. Create the Supabase table
Open your Supabase project, go to **SQL Editor**, paste the contents of:

`supabase/schema.sql`

Run it once.

## 2. Add environment variables locally
Create a `.env` file in the project root based on `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Use the public/anon key only. Never put the Supabase service-role key in Vite or Vercel frontend variables.

## 3. Add the same variables to Vercel
In Vercel > Project > Settings > Environment Variables add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then redeploy.

## 4. How the new storage works
- Every collection is saved to browser IndexedDB first.
- If the device is offline, writes remain successful locally and a sync operation is queued.
- When internet returns, queued changes are pushed to Supabase.
- Remote changes are pulled periodically (8 seconds) and merged with unsynced local changes.
- Existing `isp-local-collection:*` localStorage collections are migrated automatically into IndexedDB on first load.
- Each central record stores `actor_id`, `owner_id`, `updated_at`, and `deleted_at` metadata.

## 5. Important production-security note
The included SQL policies are intentionally Phase 1 policies so the current local-login system can sync immediately with the Supabase anon key.

Before placing sensitive real production data in the system, the next phase should migrate login to **Supabase Auth** and replace the temporary anon RLS policies with employee/admin policies. The service-role key must never be exposed in React/Vite.
