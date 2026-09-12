# Afghan Power Office - VPS Deployment

This build no longer uses Supabase or Vercel for application data. Business records are stored in PostgreSQL on the VPS through the local `/api` backend.

Production stack:
- Nginx: static React build + reverse proxy
- Node.js/Express API on 127.0.0.1:5050
- PostgreSQL database `afghanpower`
- PM2 process manager

The old Supabase data is intentionally NOT imported in this step. Import/migration should be done separately after the new VPS deployment is confirmed healthy.
