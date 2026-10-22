# Deploying to cPanel (Node.js App / Passenger)

Cause of `Error: open EEXIST ... process.getStdin`: Passenger loads the startup
file with `require()`. Pointing it at the ES module `server/index.mjs` makes Node's
ESM loader read `process.stdin`, which Passenger replaced -> crash -> HTTP 500.
Fix: start through the CommonJS wrapper `app.cjs`, which imports the server.

Also: the default build targets Cloudflare Workers. For cPanel you must build
with the Node preset.

## Build (on your own computer, not inside Lovable)
```
npm install
npm run build:cpanel
```
Upload the contents of `.output/` (app.cjs, server/, public/, nitro.json) into
`theprojectwork_app`.

## cPanel settings
- Application root: `theprojectwork_app`
- Startup file: **`app.cjs`** (not `server/index.mjs`)
- Mode: Production, Node 22
- No `npm install` needed on the server; the build is self-contained.
- Restart the app after uploading.

## Backend environment variables (set BEFORE building)

`VITE_*` values are baked into the browser bundle at build time — setting them
in cPanel after building has no effect on the browser. All four values must come
from the SAME backend project; a URL from one project with a key from another
produces `401 Invalid API key` on `/rest/v1/projects` and `/rest/v1/categories`.

| Variable | Purpose | Set in |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Backend address the browser calls | your shell/build machine |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key the browser sends | your shell/build machine |
| `SUPABASE_URL` | Backend address for server-side code | shell + cPanel |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key for server-side code | shell + cPanel |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-only key (never in the browser) | shell + cPanel |
| `RAZORPAY_*`, `LOVABLE_API_KEY` | Payments / AI keys, server-only | shell + cPanel |

`PORT` is provided by cPanel automatically.

Before building, `npm run build:cpanel` runs a preflight that fails early when a
required variable is missing, the server and browser point at different backends,
or the backend address does not resolve in DNS (e.g. a deleted, paused, or
typo'd project URL — a common cause of `Invalid API key`). Test the preflight
alone with `node scripts/build-cpanel.mjs --check-only`.
