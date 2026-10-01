import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

function checkStartup(environment: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "bacshop-startup-"));
  try {
    // A fresh directory excludes the developer's local .env files.
    return spawnSync(process.execPath, [resolve("scripts/check-production-config.mjs")], {
      cwd: directory,
      encoding: "utf8",
      timeout: 15000,
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_ENV: "production", ...environment },
    });
  } finally {
    if (!resolve(directory).startsWith(resolve(tmpdir()) + sep)) throw new Error("Unsafe test cleanup path");
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("production startup preflight", () => {
  it("refuses missing configuration without binding a server or logging values", () => {
    const result = checkStartup({ DATABASE_URL: "private-invalid-url" });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("production startup refused: invalid configuration");
    expect(result.stderr).toContain("DATABASE_URL");
    expect(result.stderr).not.toContain("private-invalid-url");
    expect(result.stdout).not.toContain("Ready");
  });

  it("validates deployment boundaries without opening database or provider connections", () => {
    const secret = randomBytes(32).toString("hex");
    const result = checkStartup({
      BACSHOP_RUNTIME: "database",
      APP_ORIGIN: "https://shop.example.com",
      DATABASE_URL: "postgresql://app:integration-only-credential@unreachable.example.com:5432/bacshop",
      SESSION_SECRET: secret,
      MFA_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
      MEDIA_STORAGE: "object",
      OBJECT_STORAGE_PROVIDER: "s3-compatible",
      OBJECT_STORAGE_ENDPOINT: "https://storage.example.com",
      OBJECT_STORAGE_BUCKET: "bacshop-integration",
      OBJECT_STORAGE_PUBLIC_BASE_URL: "https://media.example.com",
      OBJECT_STORAGE_USE_IAM: "true",
      RATE_LIMIT_PROVIDER: "database",
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain(secret);
    expect(result.stderr).not.toContain("ConfigurationError");
  });
});
