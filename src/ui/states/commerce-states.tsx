import Link from "next/link";

export function EmptyState({ title = "Belum ada produk yang cocok", description = "Coba kata kunci lain atau hapus filter untuk melihat lebih banyak pilihan.", onReset }: { title?: string; description?: string; onReset?: () => void }) {
  return <section className="empty-state" aria-labelledby="empty-title"><span className="empty-state__symbol" aria-hidden="true">⌕</span><h2 id="empty-title">{title}</h2><p>{description}</p><div className="empty-state__actions">{onReset && <button className="button button--primary" onClick={onReset} type="button">Hapus pencarian &amp; filter</button>}<Link className={onReset ? "button button--secondary" : "button button--primary"} href="/shop">Ubah pencarian</Link><Link className="button button--secondary" href="/categories">Jelajahi kategori</Link></div></section>;
}

export function SkeletonCards() {
  return <div className="product-grid product-grid--desktop" aria-label="Memuat produk" aria-busy="true">{[0, 1, 2, 3].map((key) => <div className="skeleton-card" key={key}><span /><i /><b /><small /></div>)}</div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <section className="state-card" role="alert"><h2>Produk belum dapat dimuat</h2><p>Periksa koneksi lalu coba lagi.</p>{onRetry ? <button className="button button--secondary" onClick={onRetry} type="button">Coba lagi</button> : <Link className="button button--secondary" href="/shop">Kembali ke Belanja</Link>}</section>;
}

export function DisabledAction({ children }: { children: React.ReactNode }) {
  return <button className="button button--disabled" type="button" disabled>{children}</button>;
}
