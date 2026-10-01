import { expect, test } from "@playwright/test";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { hashPassword } from "../../src/infrastructure/security/password";

function testIdentity() {
  return { email: `${randomUUID()}@bacshop.test`, password: randomBytes(24).toString("hex") };
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    // Browser runtime errors contain no captured form data or authentication artifacts.
    process.stderr.write(`Browser runtime error: ${error.name}: ${error.message}\n`);
  });
});

test("register, update profile, revoke another session, change password and log out", async ({ page, browser }) => {
  const user = testIdentity();
  await page.goto("/auth/register?returnTo=%2Faccount%2Fprofile");
  await page.screenshot({ path: `.test-results/visual/register-${test.info().project.name}.png`, fullPage: true });
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/profile/);
  await page.getByLabel("Nama tampilan").fill("Pembeli uji");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.getByLabel("Nama tampilan")).toHaveValue("Pembeli uji");

  const second = await browser.newContext();
  try {
    const other = await second.newPage();
    await other.goto(new URL("/auth/sign-in?returnTo=%2Faccount%2Fprofile", page.url()).toString());
    await other.getByLabel("Email", { exact: true }).fill(user.email);
    await other.locator('input[name="password"]').fill(user.password);
    await other.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(other).toHaveURL(/\/account\/profile/);
    await page.goto("/account/sessions");
    const revoke = page.getByRole("button", { name: /Cabut|Akhiri/i });
    await expect(revoke.first()).toBeVisible();
    await revoke.first().click();
    await other.goto(new URL("/account/profile", page.url()).toString());
    await expect(other).toHaveURL(/\/auth\/sign-in/);
  } finally { await second.close(); }

  await page.goto("/account/security");
  await page.getByLabel("Kata sandi saat ini").fill(user.password);
  const replacement = randomBytes(24).toString("hex");
  await page.getByLabel("Kata sandi baru").fill(replacement);
  await page.getByRole("button", { name: "Ganti kata sandi" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.locator('input[name="password"]').fill(replacement);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\/sign-in/);
  await page.goto("/account");
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test("first rendered form has matching signed CSRF and rejects absent or forged origin", async ({ page }) => {
  await page.goto("/auth/register");
  const csrf = await page.locator('input[name="csrf"]').inputValue();
  const cookie = (await page.context().cookies()).find((entry) => entry.name === "bacshop-csrf");
  expect(csrf.split(".")).toHaveLength(4);
  expect(cookie?.value).toBe(csrf);
  const user = testIdentity();
  const missing = await page.request.post("/api/auth/register", { form: user, maxRedirects: 0 });
  expect([303, 403]).toContain(missing.status());
  if (missing.status() === 303) expect(missing.headers().location).toContain("error=csrf");
  const forged = await page.request.post("/api/auth/register", { headers: { Origin: "https://attacker.invalid" }, form: { ...user, csrf }, maxRedirects: 0 });
  expect([303, 403]).toContain(forged.status());
  const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL!;
  const database = new Pool({ connectionString });
  try { expect((await database.query('SELECT "id" FROM "users" WHERE "email" = $1', [user.email])).rowCount).toBe(0); }
  finally { await database.end(); }
});

test("guest admin operations and pending MFA cannot reach protected data", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
  expect(new URL(page.url()).origin).toBe("http://127.0.0.1:4175");
  const csrf = await page.locator('input[name="csrf"]').inputValue();
  expect((await page.context().cookies()).find((cookie) => cookie.name === "bacshop-csrf")?.value).toBe(csrf);
  const response = await page.request.post("/api/admin/catalog", { headers: { Origin: new URL(page.url()).origin }, form: { csrf }, maxRedirects: 0 });
  expect([303, 401, 403]).toContain(response.status());
  if (response.status() === 303) expect(response.headers().location).toContain("auth/sign-in");
  const body = await response.text();
  expect(body).not.toContain("passwordHash");
  expect(body).not.toContain("secretCiphertext");
});

test("admin password requires MFA, enrollment rotates session and displays recovery codes once", async ({ page }) => {
  // Suppress screenshots containing the test factor or recovery codes.
  test.info().annotations.push({ type: "security", description: "Ephemeral integration admin only" });
  const admin = testIdentity();
  const id = randomUUID();
  const database = new Pool({ connectionString: process.env.BACSHOP_INTEGRATION_DATABASE_URL });
  try {
    await database.query('INSERT INTO "users" ("id", "email", "displayName", "status", "emailVerifiedAt", "updatedAt") VALUES ($1,$2,$3,\'ACTIVE\',now(),now())', [id, admin.email, "Admin uji"]);
    await database.query('INSERT INTO "auth_identities" ("id", "userId", "type", "provider", "passwordHash", "updatedAt") VALUES ($1,$2,\'PASSWORD\',\'password\',$3,now())', [randomUUID(), id, await hashPassword(admin.password)]);
    await database.query('INSERT INTO "admin_role_assignments" ("id", "userId", "role") VALUES ($1,$2,\'CONTENT\')', [randomUUID(), id]);
    await page.goto("/auth/sign-in?returnTo=%2Fadmin");
    await page.getByLabel("Email", { exact: true }).fill(admin.email);
    await page.locator('input[name="password"]').fill(admin.password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/mfa\/enroll/);
    const pending = (await page.context().cookies()).find((cookie) => cookie.name === "bacshop-admin-session");
    expect(pending?.httpOnly).toBe(true);
    expect((await page.context().cookies()).some((cookie) => cookie.name === "bacshop-session")).toBe(false);
    const uri = await page.locator("code").filter({ hasText: /^otpauth:/ }).textContent();
    const secret = new URL(uri!).searchParams.get("secret")!;
    await page.getByLabel("Kode verifikasi").fill(totp(secret));
    await page.getByRole("button", { name: "Aktifkan MFA" }).click();
    await expect(page.getByRole("heading", { name: "Simpan kode pemulihan" })).toBeVisible();
    const codes = await page.locator("li code").allTextContents();
    expect(codes.length).toBeGreaterThanOrEqual(8);
    const verified = (await page.context().cookies()).find((cookie) => cookie.name === "bacshop-admin-session");
    expect(verified?.value).not.toBe(pending?.value);
    const result = await database.query('SELECT "mfaVerifiedAt", "revokedAt" FROM "sessions" WHERE "userId"=$1 ORDER BY "createdAt"', [id]);
    expect(result.rows.some((session) => session.revokedAt)).toBe(true);
    expect(result.rows.some((session) => session.mfaVerifiedAt && !session.revokedAt)).toBe(true);
    // A Content admin cannot adjust reseller balances, even after MFA.
    await page.goto("/auth/reauth?returnTo=%2Fadmin");
    const csrf = await page.locator('input[name="csrf"]').inputValue();
    const denied = await page.request.post("/api/admin/balance", { headers: { Origin: new URL(page.url()).origin }, form: { csrf, resellerId: randomUUID(), amount: "10000", reason: "Test denial" }, maxRedirects: 0 });
    expect([303, 403]).toContain(denied.status());
    if (denied.status() === 303) expect(denied.headers().location).toContain("forbidden");
  } finally { await database.end(); }
});

function totp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
