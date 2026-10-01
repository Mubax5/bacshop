import { redirect } from "next/navigation";
import { csrfFormToken } from "@/application/auth/csrf";
import { getSessionToken } from "@/application/auth/identity";

export default async function ReauthPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  const params = await searchParams;
  if (!await getSessionToken("admin")) redirect("/auth/sign-in");
  return <main className="retail-page auth-page"><section className="auth-card"><p className="eyebrow">KONFIRMASI KEAMANAN</p><h1>Konfirmasi sebelum melanjutkan</h1><p>Masukkan kata sandi dan kode MFA untuk tindakan admin berisiko tinggi.</p>{params.error && <p role="alert">Konfirmasi gagal. Periksa kata sandi dan gunakan kode MFA yang belum dipakai.</p>}<form action="/api/auth/reauth" method="post" className="retail-form"><input type="hidden" name="csrf" value={await csrfFormToken()} /><input type="hidden" name="returnTo" value={params.returnTo ?? "/admin"} /><label>Kata sandi<input name="password" type="password" autoComplete="current-password" required /></label><label>Kode MFA atau recovery code<input name="code" autoComplete="one-time-code" required /></label><button className="button button--primary" type="submit">Konfirmasi</button></form></section></main>;
}
