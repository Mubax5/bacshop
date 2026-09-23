import Link from "next/link";
import type { ResellerCatalogItem } from "@/domain/catalog/types";
import type { ResellerCustomer, ResellerOrder, WalletLedgerEntry } from "@/domain/reseller/types";
import { formatRetailPrice } from "@/ui/commerce/public-content";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";

const destinations = [
  ["Ringkasan", "/reseller"], ["Beli produk", "/reseller/buy"], ["Pesanan", "/reseller/orders"],
  ["Pelanggan", "/reseller/customers"], ["Saldo", "/reseller/balance"], ["Harga reseller", "/reseller/prices"],
] as const;

export function ResellerAppShell({ children, current }: { children: React.ReactNode; current: string }) {
  return <main className="reseller-page"><PageWidth><div className="reseller-context-banner"><div><span className="reseller-context-label">KONTEKS AKTIF</span><strong>Reseller Center</strong><span>Harga reseller dan alat operasional khusus akun yang disetujui.</span></div><Link className="button button--secondary reseller-retail-link" href="/shop">Kembali ke Retail Store</Link></div>
    <div className="reseller-layout"><aside className="reseller-sidebar"><p>RUANG KERJA</p><nav aria-label="Navigasi Reseller Center">{destinations.map(([label, href]) => <Link aria-current={current === href ? "page" : undefined} className={current === href ? "is-active" : ""} href={href} key={href}>{label}</Link>)}</nav></aside><section className="reseller-main">{children}</section></div>
  </PageWidth></main>;
}

export function ResellerDashboardSurface({ balance, orders, customers }: { balance: number; orders: ResellerOrder[]; customers: ResellerCustomer[] }) {
  return <><PageHeading eyebrow="RESELLER CENTER · GOLD" title="Ringkasan bisnis" description="Pantau saldo pembelian, pesanan, dan masa aktif pelanggan dari satu tempat." />
    <div className="reseller-stat-grid"><article><span>Saldo tersedia</span><strong>{formatRetailPrice(balance)}</strong><Link href="/reseller/balance">Lihat saldo</Link></article><article><span>Total pesanan</span><strong>{orders.length}</strong><Link href="/reseller/orders">Lihat pesanan</Link></article><article><span>Pelanggan tercatat</span><strong>{customers.length}</strong><Link href="/reseller/customers">Kelola pelanggan</Link></article></div>
    <section className="reseller-panel"><header><div><p className="eyebrow">TINDAKAN CEPAT</p><h2>Mulai transaksi reseller</h2></div><Link className="button button--primary" href="/reseller/buy">Beli produk</Link></header><p>Produk dibeli menggunakan harga sesuai tier, sementara toko retail akunmu tetap menggunakan harga retail.</p></section>
    <section className="reseller-panel"><header><div><p className="eyebrow">PERLU DITINDAKLANJUTI</p><h2>Masa aktif pelanggan</h2></div><Link href="/reseller/customers">Semua pelanggan</Link></header>{customers.filter((customer) => customer.status !== "active").length ? <div className="reseller-record-list">{customers.filter((customer) => customer.status !== "active").map((customer) => <article key={customer.id}><div><strong>{customer.name}</strong><span>{customer.productName}</span></div><span className={`reseller-status reseller-status--${customer.status}`}>{customer.status === "expiring" ? "Segera berakhir" : "Kedaluwarsa"}</span><time dateTime={customer.expiresAt}>{customer.expiresAt}</time></article>)}</div> : <ResellerEmpty title="Belum ada masa aktif yang perlu ditindaklanjuti" />}</section>
  </>;
}

export function ResellerCatalogSurface({ items, buy = false, customers = [] }: { items: ResellerCatalogItem[]; buy?: boolean; customers?: ResellerCustomer[] }) {
  return <><PageHeading eyebrow={buy ? "KATALOG RESELLER" : "DAFTAR HARGA"} title={buy ? "Beli produk" : "Harga reseller"} description={buy ? "Pilih produk untuk dibeli bagi pelangganmu. Harga dihitung menurut tier akun." : "Harga khusus tier akunmu; hanya terlihat di Reseller Center."} />
    {items.length === 0 ? <ResellerEmpty title="Belum ada produk tersedia" /> : <div className="reseller-product-list">{items.map((item) => <article className="reseller-product" key={item.sku}><div className="reseller-product__identity"><span className="reseller-product__mark">{item.productName.slice(0, 1)}</span><div><h2>{item.productName}</h2><span>{item.sku}</span></div></div><div className="reseller-product__price"><span>Harga Kamu</span><strong>{formatRetailPrice(item.resellerPrice)}</strong>{!buy && <small>Retail {formatRetailPrice(item.retailReferencePrice)}</small>}</div>{buy && (customers.length ? <form action="/api/reseller/buy" method="post" className="reseller-buy-form"><input type="hidden" name="sku" value={item.sku} /><input type="hidden" name="clientTotal" value={item.resellerPrice} /><input type="hidden" name="idempotencyKey" value={`buy-${item.sku}-${Date.now()}`} /><label>Pelanggan tujuan<select name="targetCustomerId" required defaultValue=""><option value="" disabled>Pilih pelanggan</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.id}</option>)}</select></label><button className="button button--primary" type="submit">Beli untuk pelanggan</button></form> : <ResellerEmpty title="Tambahkan data pelanggan sebelum membeli" actionHref="/reseller/customers" actionLabel="Lihat pelanggan" />)}</article>)}</div>}
  </>;
}

export function ResellerOrdersSurface({ orders }: { orders: ResellerOrder[] }) {
  return <><PageHeading eyebrow="RIWAYAT TRANSAKSI" title="Pesanan reseller" description="Pesanan di ruang kerja reseller beserta total harga beli dan pelanggan tujuan." />{orders.length ? <div className="reseller-record-list">{orders.map((order) => <article key={order.id}><div><strong>{order.lines.map((line) => line.productName).join(", ")}</strong><span>Untuk {order.targetCustomerId} · {order.id}</span></div><span className="reseller-status reseller-status--active">{order.status === "processing" ? "Diproses" : order.status === "fulfilled" ? "Selesai" : "Bermasalah"}</span><strong>{formatRetailPrice(order.total)}</strong></article>)}</div> : <ResellerEmpty title="Belum ada pesanan reseller" actionHref="/reseller/buy" actionLabel="Pilih produk" />}</>;
}

export function ResellerCustomersSurface({ customers }: { customers: ResellerCustomer[] }) {
  return <><PageHeading eyebrow="PELANGGAN RESELLER" title="Pelanggan" description="Catatan pelanggan yang hanya dapat diakses oleh reseller pemiliknya." />{customers.length ? <div className="reseller-record-list">{customers.map((customer) => <article key={customer.id}><div><strong>{customer.name}</strong><span>{customer.contact} · {customer.productName}</span></div><span className={`reseller-status reseller-status--${customer.status}`}>{customer.status === "active" ? "Aktif" : customer.status === "expiring" ? "Segera berakhir" : "Kedaluwarsa"}</span><time dateTime={customer.expiresAt}>Berakhir {customer.expiresAt}</time></article>)}</div> : <ResellerEmpty title="Belum ada data pelanggan" />}</>;
}

export function ResellerBalanceSurface({ balance, entries, notice = "" }: { balance: number; entries: WalletLedgerEntry[]; notice?: string }) {
  return <><PageHeading eyebrow="SALDO PEMBELIAN" title="Saldo reseller" description="Saldo digunakan untuk pembelian produk. Setiap perubahan tercatat sebagai entri ledger." />{notice && <p className="reseller-notice" role="status">{notice}</p>}<section className="reseller-balance-card"><div><span>Saldo tersedia</span><strong>{formatRetailPrice(balance)}</strong><small>Saldo pembelian · bukan saldo pencairan</small></div><form action="/api/reseller/balance/top-up" method="post"><label>Nominal top-up<input name="amount" type="number" min="10000" max="10000000" step="1000" defaultValue="50000" required /></label><input type="hidden" name="requestId" value={`topup-${Date.now()}`} /><button className="button button--primary" type="submit">Ajukan top-up</button></form></section><section className="reseller-panel"><header><div><p className="eyebrow">RIWAYAT</p><h2>Ledger saldo</h2></div></header>{entries.length ? <div className="reseller-record-list">{entries.map((entry) => <article key={entry.id}><div><strong>{entry.kind === "top-up" ? "Top-up" : entry.kind === "purchase" ? "Pembelian" : entry.kind === "refund" ? "Refund" : "Kredit"}</strong><span>{entry.reference}</span></div><span className={`reseller-ledger-amount ${entry.direction}`}>{entry.direction === "credit" ? "+" : "−"}{formatRetailPrice(entry.amount)}</span><time dateTime={entry.createdAt}>{entry.createdAt === new Date(0).toISOString() ? "Development" : entry.createdAt}</time></article>)}</div> : <ResellerEmpty title="Belum ada transaksi saldo" />}</section></>;
}

export function ResellerEmpty({ title, actionHref, actionLabel }: { title: string; actionHref?: string; actionLabel?: string }) {
  return <section className="reseller-empty"><h2>{title}</h2><p>Informasi akan muncul di sini setelah ada aktivitas pada akun reseller.</p>{actionHref && actionLabel && <Link className="button button--secondary" href={actionHref}>{actionLabel}</Link>}</section>;
}

export function ResellerStatusPage({ status }: { status: string }) {
  return <main className="reseller-status-page"><PageWidth><section className="reseller-empty"><p className="eyebrow">AKSES RESELLER</p><h1>Akses Reseller Center belum tersedia</h1><p>Status program reseller: <strong>{status}</strong>. Retail Store tetap dapat digunakan dengan harga retail.</p><Link className="button button--primary" href="/shop">Buka Retail Store</Link></section></PageWidth></main>;
}
