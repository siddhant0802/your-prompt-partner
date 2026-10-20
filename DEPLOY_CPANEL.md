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
- Environment variables: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_*, RAZORPAY_*, LOVABLE_API_KEY
  (same names as before). PORT is provided by cPanel automatically.
- No `npm install` needed on the server; the build is self-contained.
- Restart the app after uploading.
