import { redirect } from "next/navigation";
import { csrfFormToken } from "@/application/auth/csrf";
import { getSessionToken } from "@/application/auth/identity";

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  if (!await getSessionToken("admin")) redirect("/auth/sign-in");
  return <main className="retail-page auth-page"><section className="auth-card"><p className="eyebrow">VERIFIKASI ADMIN</p><h1>Masukkan kode MFA</h1><p>Gunakan kode enam digit dari aplikasi authenticator atau recovery code.</p>{params.error && <p role="alert">Kode tidak berlaku atau sudah digunakan. Coba kode berikutnya dari aplikasi authenticator.</p>}<form action="/api/auth/mfa" method="post" className="retail-form"><input type="hidden" name="csrf" value={await csrfFormToken()} /><input type="hidden" name="returnTo" value={params.returnTo ?? "/admin"} /><label>Kode<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" /></label><label>Recovery code (opsional)<input name="recoveryCode" autoComplete="off" /></label><button className="button button--primary" type="submit">Verifikasi</button></form></section></main>;
}
