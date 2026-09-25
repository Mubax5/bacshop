import Link from "next/link";
import { PageWidth } from "@/ui/foundations/primitives";

const destinations = [
  ["Ringkasan", "/admin"], ["Produk & SKU", "/admin/products"], ["Harga", "/admin/pricing"], ["Pesanan", "/admin/orders"],
  ["Reseller", "/admin/resellers"], ["Saldo", "/admin/balance"], ["Promosi & CMS", "/admin/promotions"], ["Support", "/admin/support"], ["Audit", "/admin/audit"],
] as const;

export function AdminShell({ children, current }: { children?: React.ReactNode; current: string }) {
  return <main className="admin-page"><PageWidth><div className="admin-context-banner"><div><span className="admin-context-label">OPERASIONAL INTERNAL</span><strong>Admin Center</strong><span>Perubahan sensitif memerlukan izin dan alasan yang tercatat.</span></div><Link className="button button--secondary" href="/">Kembali ke Store</Link></div><div className="admin-layout"><aside className="admin-sidebar"><p>WORKSPACE</p><nav aria-label="Navigasi Admin Center">{destinations.map(([label, href]) => <Link aria-current={current === href ? "page" : undefined} className={current === href ? "is-active" : ""} href={href} key={href}>{label}</Link>)}</nav></aside><section className="admin-main">{children}</section></div></PageWidth></main>;
}
