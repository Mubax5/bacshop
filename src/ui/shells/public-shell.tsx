import Link from "next/link";
import { PageWidth } from "@/ui/foundations/primitives";

const links = [
  ["Belanja", "/shop"],
  ["Kategori", "/categories"],
  ["Promo", "/promos"],
  ["Bantuan", "/help"],
] as const;

export function DesktopHeader({ state = "guest" }: { state?: "guest" | "customer" }) {
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
        {state === "guest" ? <Link className="header-login" href="/reseller-program">Program Reseller</Link> : <Link className="header-login" href="/account/orders">Pesanan</Link>}
        <Link className="header-login header-account-link" href={state === "customer" ? "/account" : "/auth/sign-in"}>{state === "customer" ? "Akun" : "Masuk"}</Link>
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

const customerItems = [
  ["⌂", "Beranda", "/"], ["⌕", "Belanja", "/shop"], ["％", "Promo", "/promos"], ["▤", "Pesanan", "/account/orders"], ["◉", "Akun", "/account"],
] as const;

export function BottomNavigation({ active = "", state = "guest" }: { active?: string; state?: "guest" | "customer" }) {
  const items = state === "customer" ? customerItems : guestItems;
  return (
    <nav className="bottom-navigation" aria-label="Navigasi bawah">
      {items.map(([icon, label, href]) => (
        <Link aria-current={active === href ? "page" : undefined} className={active === href ? "bottom-navigation__item is-active" : "bottom-navigation__item"} href={href} key={label}>
          <span className="bottom-navigation__icon" aria-hidden="true">{icon}</span><span>{label}</span>
        </Link>
      ))}
      {state === "guest" && <Link className="bottom-navigation__item" href="/auth/sign-in"><span className="bottom-navigation__icon" aria-hidden="true">↗</span><span>Masuk</span></Link>}
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

export function PublicShell({ children, state = "guest" }: { children: React.ReactNode; state?: "guest" | "customer" }) {
  return <><DesktopHeader state={state} /><MobileTopBar /><div className="public-content">{children}</div><PublicFooter /><BottomNavigation state={state} /></>;
}
