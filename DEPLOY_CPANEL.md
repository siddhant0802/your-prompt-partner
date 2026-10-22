# Deploying to cPanel (Node.js App / Passenger)

Cause of `Error: open EEXIST ... process.getStdin`: Passenger loads the startup
file with `require()`. Pointing it at the ES module `server/index.mjs` makes Node's
ESM loader read `process.stdin`, which Passenger replaced -> crash -> HTTP 500.
Fix: start through the CommonJS wrapper `app.cjs`, which imports the server.

Also: the default build targets Cloudflare Workers. For cPanel you must build
with the Node preset. (`scripts/build-cpanel.mjs` handles that.)

## 1. Prepare your own backend project (once)

This source deploys against **your own Supabase project**, not the Lovable
managed one. Do these once, in order:

1. **Database schema** — open your project's SQL Editor and run the whole of
   `supabase/migrations/0001_initial_schema.sql` (included in this package).
   It creates every table, index, trigger, function, permission rule and the
   two storage buckets the app uses, and seeds the five course categories.
2. **Auth settings** (Dashboard → Authentication):
   - Providers: enable **Email** (confirm-email ON matches the app's flows) and
     **Google** (needs a Google OAuth client; set the redirect back to your
     project callback).
   - URL Configuration: Site URL = your site (e.g. `https://your-domain.com`)
     and add `<site>/login` + `<site>/reset-password` to the redirect list.
3. **Collect credentials** for the env file below: Project URL and the
   **publishable (anon) key** for the browser, plus the **service_role key**
   (server only — never in the browser bundle).

## 2. Configure the environment

Copy `.env.example` to `.env` and fill in the real values (placeholders only in
the template — never commit `.env`):

| Variable | Purpose | Set in |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Backend address the browser calls | your shell/build machine |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key the browser sends | your shell/build machine |
| `SUPABASE_URL` | Backend address for server-side code | shell + cPanel |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key for server-side code | shell + cPanel |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-only key (never in the browser) | shell + cPanel |
| `RAZORPAY_*`, `LOVABLE_API_KEY` | Payments / AI keys, server-only | shell + cPanel |

`VITE_*` values are baked into the browser bundle at build time — setting them
in cPanel after building has no effect on the browser. All backend values must
come from the SAME project; a URL from one project with a key from another
produces `401 Invalid API key` on `/rest/v1/projects` and `/rest/v1/categories`.

## 3. Build (on your own computer, not inside Lovable)

```
npm install
npm run build:cpanel
```

The build runs a preflight that fails early when a required variable is
missing, the server and browser point at different backends, or the backend
address does not resolve in DNS. Test the preflight alone with
`node scripts/build-cpanel.mjs --check-only`.

Upload the contents of `.output/` (app.cjs, server/, public/, nitro.json) into
`theprojectwork_app`.

## 4. cPanel settings

- Application root: `theprojectwork_app`
- Startup file: **`app.cjs`** (not `server/index.mjs`)
- Mode: Production, Node 22 or 24 (the startup wrapper is plain CommonJS +
  dynamic `import()` — compatible with both; no testing has shown a problem on
  Node 24)
- No `npm install` needed on the server; the build is self-contained.
- Restart the app after uploading.

`PORT` is provided by cPanel automatically.

## 5. First admin account

Sign up once through the site, then in the SQL Editor give that account the
admin role:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

Admin rights come only from this database role — every admin page is enforced
by row-level security, not by hiding buttons.

## Notes

- Google sign-in works two ways: on the Lovable-managed backend it goes through
  Lovable's broker; on your own project the app calls your project's Google
  provider directly, so the Google provider must be enabled there (step 1.2).
- Razorpay: keep test keys until you deliberately switch to live (the server
  blocks live keys unless `RAZORPAY_ALLOW_LIVE=true`), and point the webhook at
  `https://your-domain.com/api/public/razorpay-webhook`.
- Nothing here touches the live Lovable-hosted site; this package is for
  deploying to your own infrastructure.
