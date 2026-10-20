// cPanel / Phusion Passenger startup file.
// Passenger loads the startup file with require(); pointing it straight at an
// ES module (server/index.mjs) makes Node's ESM loader touch process.stdin,
// which Passenger has replaced, and crashes with "Error: open EEXIST".
// This CommonJS wrapper avoids that by loading the real server dynamically.
"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
// Passenger provides PORT; listen on all interfaces unless told otherwise.
process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.NITRO_HOST = process.env.NITRO_HOST || process.env.HOST;
if (process.env.PORT) process.env.NITRO_PORT = process.env.NITRO_PORT || process.env.PORT;

const entry = path.join(__dirname, "server", "index.mjs");

import(pathToFileURL(entry).href).catch((err) => {
  console.error("[startup] Failed to start server:", err);
  process.exit(1);
});
