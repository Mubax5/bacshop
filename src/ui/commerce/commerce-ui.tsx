import Link from "next/link";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import { PageWidth } from "@/ui/foundations/primitives";
import { categoryForSku, formatRetailPrice, slugForProduct, type PublicCategory } from "./public-content";

export function SearchField({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
  return (
    <form action="/shop" className={compact ? "search-field search-field--compact" : "search-field"} role="search">
      <span className="search-field__icon" aria-hidden="true">⌕</span>
      <label className="visually-hidden" htmlFor={compact ? "mobile-search" : "catalog-search"}>Cari produk</label>
      <input id={compact ? "mobile-search" : "catalog-search"} name="q" defaultValue={defaultValue} placeholder="Cari langganan, aplikasi, gift card..." />
      <button className="search-field__submit" type="submit">Cari</button>
    </form>
  );
}

export function PriceDisplay({ price }: { price: number }) {
  return <span className="price-display">{formatRetailPrice(price)}</span>;
}

export function ProductMedia({ item }: { item: Pick<RetailCatalogItem, "productName" | "sku"> }) {
  const monogram = item.productName.split(/[\s-]+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className={`product-media product-media--${item.sku.toLowerCase().split("-")[0]}`} role="img" aria-label={`Ilustrasi ${item.productName}`}><span>{monogram}</span><i aria-hidden="true">{item.sku.startsWith("GAME") ? "✦" : ""}</i></div>;
}

export function ProductCard({ item, variant = "desktop" }: { item: RetailCatalogItem; variant?: "desktop" | "mobile" }) {
  const category = categoryForSku(item.sku);
  const href = `/products/${slugForProduct(item)}`;
  const availabilityLabel = item.availability === "available" ? "Tersedia" : item.availability === "out-of-stock" ? "Stok habis" : "Segera tersedia";
  const unavailable = item.availability !== "available";
  return (
    <article className={`product-card product-card--${variant}`}>
      <Link className="product-card__media-link" href={href} aria-label={`Lihat ${item.productName}`}><ProductMedia item={item} /></Link>
      <div className="product-card__body">
        <div className="product-card__meta"><span>{category?.name ?? "Produk Digital"}</span><span className={unavailable ? "stock-status stock-status--unavailable" : "stock-status"}>{availabilityLabel}</span></div>
        <h3><Link href={href}>{item.productName}</Link></h3>
        <p className="product-card__detail">{item.duration}<span aria-hidden="true"> · </span>{item.region}</p>
        <div className="product-card__bottom"><PriceDisplay price={item.retailPrice} /><span className="product-card__activation">Digital</span></div>
        <Link className="product-card__action" href={href}>{unavailable ? "Lihat detail" : "Lihat produk"}<span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

export function ProductGrid({ items, variant = "desktop" }: { items: RetailCatalogItem[]; variant?: "desktop" | "mobile" }) {
  return <div className={`product-grid product-grid--${variant}`}>{items.map((item) => <ProductCard item={item} key={item.sku} variant={variant} />)}</div>;
}

export function CategoryCard({ category }: { category: PublicCategory }) {
  return <Link className="category-card" href={`/categories/${category.slug}`}><span className="category-card__symbol" aria-hidden="true">{category.symbol}</span><span className="category-card__copy"><strong>{category.name}</strong><small>{category.description}</small></span><span className="category-card__arrow" aria-hidden="true">→</span></Link>;
}

export function CategoryGrid({ categories }: { categories: readonly PublicCategory[] }) {
  return <div className="category-grid">{categories.map((category) => <CategoryCard category={category} key={category.slug} />)}</div>;
}

export function PromoCard() {
  return <section className="promo-card" aria-label="Pilihan Bacshop"><div className="promo-card__copy"><span className="promo-card__kicker">PILIHAN BACSHOP</span><h2>Langganan digital, lebih mudah dipahami.</h2><p>Lihat durasi, wilayah, aktivasi, dan harga sebelum memilih.</p><Link className="button button--light" href="/shop">Jelajahi produk <span aria-hidden="true">→</span></Link></div></section>;
}

export function SectionHeading({ title, href, linkLabel = "Lihat semua" }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="section-heading"><h2>{title}</h2>{href && <Link href={href}>{linkLabel}<span aria-hidden="true"> →</span></Link>}</div>;
}

export function TrustStrip() {
  const details = [
    ["01", "Harga jelas", "Harga retail ditampilkan sebelum memilih."],
    ["02", "Info aktivasi", "Ketentuan produk bisa dibaca sejak awal."],
    ["03", "Bantuan tersedia", "Temukan panduan dan jawaban di pusat bantuan."],
  ];
  return <section className="trust-strip" aria-labelledby="trust-title"><div className="trust-strip__intro"><p className="eyebrow">BELANJA DENGAN TENANG</p><h2 id="trust-title">Informasi jelas di setiap langkah.</h2></div><div className="trust-strip__items">{details.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>;
}

export function ProductSummary({ items }: { items: RetailCatalogItem[] }) {
  return <section className="home-products page-section"><SectionHeading title="Pilihan populer" href="/shop" /><ProductGrid items={items.slice(0, 4)} /></section>;
}

export function CommercePageFrame({ children }: { children: React.ReactNode }) {
  return <main><PageWidth>{children}</PageWidth></main>;
}
