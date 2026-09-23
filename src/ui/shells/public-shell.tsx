import Link from "next/link";
import { PageWidth } from "@/ui/foundations/primitives";

const links = [
  ["Belanja", "/shop"],
  ["Kategori", "/categories"],
  ["Promo", "/promos"],
  ["Bantuan", "/help"],
] as const;

export function DesktopHeader() {
  return (
    <header className="desktop-header">
      <PageWidth className="desktop-header__inner">
        <Link className="brand" href="/" aria-label="Bacshop beranda"><span className="brand__mark">b</span><span>Bacshop</span></Link>
        <nav className="desktop-header__nav" aria-label="Navigasi utama">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <form action="/shop" className="header-search">
          <span aria-hidden="true">⌕</span>
          <label className="visually-hidden" htmlFor="header-query">Cari produk</label>
          <input id="header-query" name="q" placeholder="Cari produk digital..." />
          <button type="submit" aria-label="Cari">↵</button>
        </form>
        <Link className="header-login" href="/reseller-program">Program Reseller</Link>
        <button className="header-login header-login--disabled" type="button" disabled aria-label="Masuk belum tersedia">Masuk</button>
      </PageWidth>
    </header>
  );
}

export function MobileTopBar({ title = "Bacshop" }: { title?: string }) {
  return (
    <header className="mobile-topbar">
      <Link className="brand" href="/" aria-label="Bacshop beranda"><span className="brand__mark">b</span><span>{title}</span></Link>
      <Link className="mobile-topbar__action" href="/help" aria-label="Bantuan">?</Link>
    </header>
  );
}

const guestItems = [
  ["⌂", "Beranda", "/"], ["⌕", "Belanja", "/shop"], ["％", "Promo", "/promos"], ["?", "Bantuan", "/help"],
] as const;

export function BottomNavigation({ active = "" }: { active?: string }) {
  return (
    <nav className="bottom-navigation" aria-label="Navigasi bawah">
      {guestItems.map(([icon, label, href]) => (
        <Link aria-current={active === href ? "page" : undefined} className={active === href ? "bottom-navigation__item is-active" : "bottom-navigation__item"} href={href} key={label}>
          <span className="bottom-navigation__icon" aria-hidden="true">{icon}</span><span>{label}</span>
        </Link>
      ))}
      <button className="bottom-navigation__item" type="button" disabled aria-label="Masuk belum tersedia"><span className="bottom-navigation__icon" aria-hidden="true">↗</span><span>Masuk</span></button>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <PageWidth className="public-footer__inner">
        <div><Link className="brand" href="/"><span className="brand__mark">b</span><span>Bacshop</span></Link><p>Belanja produk digital dengan informasi yang jelas.</p></div>
        <nav aria-label="Tautan footer">
          <Link href="/shop">Belanja</Link><Link href="/categories">Kategori</Link><Link href="/faq">FAQ</Link><Link href="/reseller-program">Program Reseller</Link>
        </nav>
        <small>© {new Date().getFullYear()} Bacshop</small>
      </PageWidth>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <><DesktopHeader /><MobileTopBar /><div className="public-content">{children}</div><PublicFooter /><BottomNavigation /></>;
}
