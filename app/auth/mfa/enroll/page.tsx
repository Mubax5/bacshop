import { redirect } from "next/navigation";
import { csrfFormToken } from "@/application/auth/csrf";
import { getIdentityService, getSessionToken, usesDatabaseIdentity } from "@/application/auth/identity";

export default async function MfaEnrollPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  const token = await getSessionToken("admin");
  if (!token || !usesDatabaseIdentity()) redirect("/auth/sign-in");
  const enrollment = await getIdentityService().beginMfaEnrollment(token);
  if (!enrollment) redirect(`/auth/mfa?returnTo=${encodeURIComponent(params.returnTo ?? "/admin")}`);
  return <main className="retail-page auth-page"><section className="auth-card"><p className="eyebrow">AKTIFKAN MFA</p><h1>Amankan akun admin</h1><p>Tambahkan URI ini ke aplikasi authenticator: <code>{enrollment.uri}</code></p><p>Secret: <code>{enrollment.secret}</code></p>{params.error && <p role="alert">Kode verifikasi tidak berlaku. Periksa waktu perangkat dan coba kode berikutnya.</p>}<form action="/api/auth/mfa/enroll" method="post" className="retail-form"><input type="hidden" name="csrf" value={await csrfFormToken()} /><input type="hidden" name="returnTo" value={params.returnTo ?? "/admin"} /><label>Kode verifikasi<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></label><button className="button button--primary" type="submit">Aktifkan MFA</button></form></section></main>;
}
