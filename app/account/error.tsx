"use client";
export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="async-state async-state--error"><h1>Akun belum siap</h1><p>Data akun belum dapat dimuat. Coba lagi untuk memulihkan sesi.</p><button className="button button--primary" onClick={() => reset()}>Coba lagi</button></main>; }
