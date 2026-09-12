# Query resilience fix

This update hardens the Supabase-only runtime without changing databases.

- GET requests retry up to 5 times with exponential backoff + jitter.
- Every GET has a 15-second per-attempt timeout.
- Collections are fetched in pages of 250 rows, preventing one large JSON/base64 response from blocking the whole load.
- `useJsonCollection` exposes its load error and keeps the last in-memory data instead of clearing the UI.
- Accounts and employees auto-retry in the background after a failed initial load.
- The signed-in account can temporarily use the already-stored session identity while Accounts is reconnecting. This is only session metadata, not business data.
- A failed page is isolated by a page-level React error boundary. Header/sidebar remain available and the page can be retried.
- IndexedDB is not used.

Important: localStorage is used only for session identity/theme/language as before, not business collections.
