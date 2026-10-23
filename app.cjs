
"use strict";

const { Readable } = require("node:stream");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

// Avoid Passenger's stdin socket conflict during Node.js ESM initialization.
const safeStdin = new Readable({ read() {} });

Object.defineProperty(process, "stdin", {
  configurable: true,
  enumerable: true,
  get: () => safeStdin,
});

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.NITRO_HOST = process.env.NITRO_HOST || process.env.HOST;

if (process.env.PORT) {
  process.env.NITRO_PORT = process.env.NITRO_PORT || process.env.PORT;
}

const entry = path.join(__dirname, "server", "index.mjs");

import(pathToFileURL(entry).href).catch((err) => {
  console.error("[startup] Failed to start server:", err);
  process.exit(1);
});
