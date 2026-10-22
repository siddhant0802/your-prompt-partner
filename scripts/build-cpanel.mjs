// Cross-platform (Windows/macOS/Linux) build for cPanel Node.js hosting.
// Builds with Nitro's node-server preset and copies the CommonJS startup file.
//
// Preflight checks the Supabase (backend) configuration BEFORE building, because
// VITE_* values are baked into the client bundle at build time. A wrong URL or a
// URL/key pair from two different backends produces "Invalid API key" (401) on
// /rest/v1/* in production and can only be fixed by rebuilding.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { lookup } from "node:dns/promises";

const checkOnly = process.argv.includes("--check-only");

let failed = false;

function check(label, ok, message) {
  if (ok) {
    console.log(`  OK   ${label}`);
  } else {
    failed = true;
    console.error(`  FAIL ${label}: ${message}`);
  }
}

async function preflight() {
  console.log("Preflight: backend configuration");

  const serverUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serverKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const viteUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const viteKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  check("SUPABASE_URL is set", !!serverUrl, "missing — server-side requests have nowhere to go");
  check("SUPABASE_PUBLISHABLE_KEY is set", !!serverKey, "missing — every server-side data request returns 401");
  check("VITE_SUPABASE_URL is set", !!viteUrl, "missing — the browser bundle gets no backend address");
  check("VITE_SUPABASE_PUBLISHABLE_KEY is set", !!viteKey, "missing — the browser bundle gets no key and every request returns 401");

  if (serverUrl && viteUrl && serverUrl !== viteUrl) {
    // client.ts falls back to the server URL only when the keys match; a URL
    // mismatch with equal keys is the classic mixed-project setup.
    const keysMatch = serverKey && viteKey && serverKey === viteKey;
    check(
      "server and browser use the same backend URL",
      keysMatch,
      `SUPABASE_URL (${serverUrl}) and VITE_SUPABASE_URL (${viteUrl}) differ. The browser only falls back to the server URL when the keys are identical; with different keys the site talks to two different backends.`,
    );
  }

  if (serverKey && viteKey && serverKey !== viteKey) {
    check("server and browser use the same publishable key", false, "the two keys differ — one of them belongs to a different backend and that side will return 'Invalid API key'");
  }

  // The browser bundle calls VITE_SUPABASE_URL directly, so that host must exist.
  if (viteUrl) {
    try {
      const host = new URL(viteUrl).hostname;
      await lookup(host);
      console.log(`  OK   backend address resolves: ${host}`);
    } catch {
      failed = true;
      const host = new URL(viteUrl).hostname;
      console.error(
        `  FAIL backend address does not exist: ${host}\n` +
        `       DNS cannot resolve it. The project is deleted, paused, not yet created, or the URL has a typo.\n` +
        `       Building with this address guarantees "Invalid API key" / network errors in production.`,
      );
    }
  }

  if (failed) {
    console.error("\nBuild stopped: fix the configuration above, then run the build again.");
    console.error("Both URL and key must come from the SAME backend project.");
    process.exit(1);
  }
  console.log("Preflight passed.\n");
}

await preflight();
if (checkOnly) process.exit(0);

const env = { ...process.env, NITRO_PRESET: "node-server" };
const result = spawnSync("npx", ["vite", "build"], { stdio: "inherit", env, shell: true });
if (result.status !== 0) process.exit(result.status ?? 1);

if (!existsSync(".output/server/index.mjs")) {
  console.error("Build finished but .output/server/index.mjs is missing.");
  process.exit(1);
}
copyFileSync("app.cjs", ".output/app.cjs");
console.log("\ncPanel build ready in .output/ — startup file: app.cjs");
