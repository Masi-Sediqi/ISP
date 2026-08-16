# Chat + Vercel fix

This version removes the employee chat dependency on the missing local `transport-backend` / Socket.IO server.

## What changed
- `npm run dev` starts Vite directly, so the web project can run even when `transport-backend` is not included.
- Employee messages are stored in the existing Supabase `app_records` table under collection `chatMessages`.
- Online presence is stored in `app_records` under collection `chatPresence`.
- Messages refresh about every 1.5 seconds.
- Online/typing status refreshes about every 2 seconds.
- Each active employee sends a heartbeat about every 8 seconds and is treated as offline after about 22 seconds without a heartbeat.
- Seen status is synced to Supabase.

## Requirements
The existing `supabase/schema.sql` must already have been executed and these Vercel environment variables must exist:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No additional SQL is required for this chat fix because it uses the existing `app_records` table.

## Local test
Run:

```bash
npm install
npm run dev
```

Then open two different browser profiles/incognito windows, sign in as two different accounts and test Messages.
