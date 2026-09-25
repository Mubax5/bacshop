"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="async-state async-state--error"><h1>Halaman belum siap</h1><p>Terjadi kendala saat memuat data. Coba lagi atau kembali ke store.</p><div><button className="button button--primary" onClick={() => reset()}>Coba lagi</button><Link className="button button--secondary" href="/">Kembali ke Store</Link></div></main>;
}
