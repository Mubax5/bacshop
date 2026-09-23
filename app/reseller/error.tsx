"use client";

export default function ResellerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="reseller-page"><section className="reseller-empty"><h1>Reseller Center belum dapat dimuat</h1><p>Data tidak berhasil dimuat. Coba lagi sebentar lagi.</p><button className="button button--primary" onClick={() => reset()}>Coba lagi</button></section></main>;
}
