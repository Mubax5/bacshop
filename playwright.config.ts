import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";

// Only a disposable integration database may be used by browser tests.
let connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connectionString && !process.env.CI) {
  try { connectionString = parse(readFileSync(".local-db/test.env")).DATABASE_URL; } catch { /* Missing configuration is rejected below. */ }
}
if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) {
  throw new Error("Set BACSHOP_INTEGRATION_DATABASE_URL to an isolated database ending in _integration");
}
process.env.BACSHOP_INTEGRATION_DATABASE_URL = connectionString;
process.env.SESSION_SECRET ??= randomBytes(32).toString("hex");
process.env.MFA_ENCRYPTION_KEY ??= randomBytes(32).toString("hex");
const port = 4175;
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./test/e2e",
  globalSetup: "./test/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: ".test-results/e2e",
  use: { baseURL: origin, trace: "off", screenshot: "off" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
    // Compile the default landing route before browser navigation tests begin.
    // Readiness is checked separately by globalSetup against the actual database.
    url: origin,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "development", BACSHOP_RUNTIME: "database", DATABASE_URL: connectionString,
      SESSION_SECRET: process.env.SESSION_SECRET, MFA_ENCRYPTION_KEY: process.env.MFA_ENCRYPTION_KEY,
      APP_ORIGIN: origin, TRUSTED_ORIGINS: origin, EMAIL_ENABLED: "false", EMAIL_REQUIRED: "false",
      MIDTRANS_ENABLED: "false", RATE_LIMIT_PROVIDER: "database", MEDIA_STORAGE: "local",
      TRUST_PROXY: "false",
    },
  },
});
