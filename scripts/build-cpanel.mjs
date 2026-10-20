// Cross-platform (Windows/macOS/Linux) build for cPanel Node.js hosting.
// Builds with Nitro's node-server preset and copies the CommonJS startup file.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const env = { ...process.env, NITRO_PRESET: "node-server" };
const result = spawnSync("npx", ["vite", "build"], { stdio: "inherit", env, shell: true });
if (result.status !== 0) process.exit(result.status ?? 1);

if (!existsSync(".output/server/index.mjs")) {
  console.error("Build finished but .output/server/index.mjs is missing.");
  process.exit(1);
}
copyFileSync("app.cjs", ".output/app.cjs");
console.log("\ncPanel build ready in .output/ — startup file: app.cjs");
