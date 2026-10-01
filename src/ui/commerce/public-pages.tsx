import { CsrfInput } from "@/ui/security/csrf-input";
import Link from "next/link";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import type { RetailProductDetails } from "@/application/catalog/get-retail-product-details";
import type { CustomerSession } from "@/infrastructure/auth/auth-provider";
import type { ResellerApplication } from "@/infrastructure/reseller/reseller-application-repository";
import { publicCategories } from "./public-content";
import { CategoryGrid, PriceDisplay, ProductGrid, ProductMedia, PromoCard, SectionHeading, TrustStrip } from "./commerce-ui";
import { PageHeading, PageWidth, PrimaryLink } from "@/ui/foundations/primitives";
import { DisabledAction } from "@/ui/states/commerce-states";

export function HomeSurface({ items }: { items: RetailCatalogItem[] }) {
  return <main>
    <section className="home-hero"><PageWidth className="home-hero__inner"><div className="home-hero__copy"><p className="eyebrow">TOKO PRODUK DIGITAL</p><h1>Semua yang digital,<br /><span>lebih jelas.</span></h1><p className="home-hero__description">Temukan langganan, aplikasi, dan gift card dengan detail yang mudah dipahami sebelum memilih.</p><form action="/shop" className="hero-search" role="search"><span aria-hidden="true">⌕</span><label className="visually-hidden" htmlFor="hero-query">Cari produk digital</label><input id="hero-query" name="q" placeholder="Mau cari apa hari ini?" /><button type="submit" aria-label="Cari produk">→</button></form><div className="hero-assurances"><span><b>✓</b> Harga retail transparan</span><span><b>✓</b> Detail aktivasi tersedia</span></div></div></PageWidth></section>
    <PageWidth className="home-content">
      <section className="home-promo page-section"><PromoCard /></section>
      <section className="home-categories page-section"><SectionHeading title="Jelajahi kategori" href="/categories" /><CategoryGrid categories={publicCategories} /></section>
      <section className="page-section"><SectionHeading title="Pilihan populer" href="/shop" /><ProductGrid items={items.slice(0, 4)} /></section>
      <section className="page-section"><TrustStrip /></section>
      <section className="home-help page-section"><div><p className="eyebrow">PUSAT BANTUAN</p><h2>Ada yang ingin ditanyakan?</h2><p>Temukan jawaban singkat tentang produk dan cara membaca informasinya.</p></div><div className="home-help__links"><Link href="/faq">Baca FAQ <span aria-hidden="true">→</span></Link><Link href="/help">Kunjungi bantuan <span aria-hidden="true">→</span></Link></div></section>
    </PageWidth>
  </main>;
}

export function ShopSurface({ items, query = "" }: { items: RetailCatalogItem[]; query?: string }) {
  return <main className="catalog-page"><PageWidth><PageHeading eyebrow="TOKO BACSHOP" title="Belanja produk digital" description="Bandingkan detail produk, durasi, wilayah, dan harga retail." /><div className="shop-mobile-search"><form action="/shop" role="search"><label className="visually-hidden" htmlFor="shop-mobile-q">Cari produk</label><input id="shop-mobile-q" name="q" defaultValue={query} placeholder="Cari produk digital..." /><button aria-label="Cari" type="submit">⌕</button></form></div><CatalogClient items={items} initialQuery={query} /></PageWidth></main>;
}

import { CatalogExperience as CatalogClient } from "./catalog-experience";

export function ProductDetailSurface({ product }: { product: RetailProductDetails }) {
  const method = product.activationMethod === "account-invitation" ? "Undangan ke akun" : product.activationMethod === "activation-code" ? "Kode aktivasi" : "Gift card digital";
  const availabilityLabel = product.availability === "available" ? "Tersedia" : product.availability === "out-of-stock" ? "Stok habis" : "Segera tersedia";
  const purchaseLabel = product.availability === "available" ? "Tambah ke Keranjang" : availabilityLabel;
  const purchaseAction = product.availability === "available"
    ? <form action="/api/cart/items" method="post"><CsrfInput /><input type="hidden" name="sku" value={product.sku} /><input type="hidden" name="quantity" value="1" /><button className="button button--primary" type="submit">Tambah ke Keranjang</button></form>
    : <DisabledAction>{purchaseLabel}</DisabledAction>;
  const receivedSummary = product.activationMethod === "gift-card"
    ? `Gift card digital senilai ${product.duration} untuk wilayah ${product.region}.`
    : `Akses ${product.productName} selama ${product.duration}, sesuai metode aktivasi dan wilayah yang tertera.`;
  return <main className="product-detail-page"><PageWidth><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Beranda</Link><span aria-hidden="true">/</span><Link href="/shop">Belanja</Link><span aria-hidden="true">/</span><span aria-current="page">{product.productName}</span></nav><div className="product-detail"><div className="product-detail__visual"><ProductMedia item={product} /><span className="product-detail__visual-caption">PRODUK DIGITAL · {product.region.toUpperCase()}</span></div><div className="product-detail__info"><p className="eyebrow">{product.sku.split("-")[0]}</p><h1>{product.productName}</h1><p className="product-detail__intro">Informasi produk dan ketentuan aktivasi ditampilkan sebelum pembelian.</p><div className="product-detail__price"><span>Harga retail</span><PriceDisplay price={product.retailPrice} /></div><section className="variant-selector"><h2>Varian & durasi</h2><span className="variant-chip" aria-current="true">{product.duration}</span></section><section className="fulfillment-facts" aria-label="Informasi pemenuhan"><div><span>Aktivasi</span><strong>{method}</strong></div><div><span>Wilayah</span><strong>{product.region}</strong></div><div><span>Estimasi proses</span><strong>{product.sla}</strong></div></section><section className="product-requirements"><h2>Persyaratan</h2><ul>{product.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></section><div className="product-support"><div><span>Garansi</span><strong>{product.warranty}</strong></div><div><span>Dukungan</span><strong>{product.support}</strong></div></div><section className="what-you-get"><h2>Yang Kamu Dapat</h2><p>{receivedSummary}</p></section><div className="desktop-purchase">{purchaseAction}<p><span className={product.availability === "available" ? "stock-status" : "stock-status stock-status--unavailable"} role="status">{availabilityLabel}</span></p></div><Link className="product-help-link" href="/help">Butuh bantuan memahami produk? <span aria-hidden="true">→</span></Link></div></div><div className="sticky-purchase"><div><small>Harga retail</small><PriceDisplay price={product.retailPrice} /></div>{purchaseAction}</div></PageWidth></main>;
}

export function CategoriesSurface({ items }: { items: RetailCatalogItem[] }) {
  const counts = new Map(publicCategories.map((category) => [category.slug, items.filter((item) => category.skus.includes(item.sku)).length]));
  return <main className="info-page"><PageWidth><PageHeading eyebrow="TEMUKAN PRODUK" title="Kategori" description="Jelajahi produk digital berdasarkan kebutuhanmu." /><CategoryGrid categories={publicCategories} /><div className="category-counts">{publicCategories.map((category) => <Link href={`/categories/${category.slug}`} key={category.slug}><span>{category.name}</span><small>{counts.get(category.slug)} produk <span aria-hidden="true">→</span></small></Link>)}</div></PageWidth></main>;
}

export function CategorySurface({ categoryName, items }: { categoryName: string; items: RetailCatalogItem[] }) {
  return <main className="catalog-page"><PageWidth><div className="breadcrumbs"><Link href="/categories">Kategori</Link><span aria-hidden="true">/</span><span>{categoryName}</span></div><PageHeading eyebrow="KATEGORI" title={categoryName} description={`Pilihan produk ${categoryName.toLocaleLowerCase("id-ID")} dengan informasi retail yang jelas.`} /><CatalogClient items={items} categoryName={categoryName} /><div className="category-back"><PrimaryLink href="/categories">Lihat kategori lain</PrimaryLink></div></PageWidth></main>;
}

export function PromosSurface() {
  return <main className="info-page"><PageWidth><PageHeading eyebrow="PILIHAN BACSHOP" title="Promo & pilihan" description="Lihat katalog retail dan pilih produk yang sesuai kebutuhanmu." /><section className="promo-info"><span className="promo-card__kicker">KATALOG RETAIL</span><h2>Harga dan detail produk, terbuka untuk dilihat.</h2><p>Halaman ini belum menampilkan potongan harga atau periode promo tertentu. Jelajahi produk untuk melihat harga retail dan ketentuannya.</p><PrimaryLink href="/shop">Jelajahi katalog</PrimaryLink></section><SectionHeading title="Kategori pilihan" /><CategoryGrid categories={publicCategories.slice(0, 4)} /></PageWidth></main>;
}

const faqItems = [
  ["Bagaimana cara memilih produk?", "Buka halaman produk untuk melihat durasi, wilayah, metode aktivasi, persyaratan, harga retail, dan informasi dukungan."],
  ["Apa arti metode aktivasi?", "Setiap produk menjelaskan apakah akses menggunakan undangan akun, kode aktivasi, atau gift card digital."],
  ["Apa yang dimaksud SLA?", "SLA pada halaman produk adalah estimasi proses yang tercantum untuk produk tersebut."],
  ["Apakah harga yang tampil adalah harga retail?", "Ya. Katalog publik menampilkan harga retail Bacshop."],
  ["Bagaimana dengan Program Reseller?", "Informasi umum program tersedia di halaman Program Reseller. Harga reseller tidak ditampilkan di katalog publik."],
];

export function FaqSurface() {
  return <main className="info-page"><PageWidth><PageHeading eyebrow="JAWABAN SINGKAT" title="Pertanyaan umum" description="Informasi dasar untuk membantu memahami katalog produk Bacshop." /><div className="faq-list">{faqItems.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}</div><p className="info-followup">Masih ada pertanyaan? <Link href="/help">Lihat pusat bantuan <span aria-hidden="true">→</span></Link></p></PageWidth></main>;
}

export function HelpSurface() {
  return <main className="info-page"><PageWidth><PageHeading eyebrow="BACSHOP SUPPORT" title="Pusat bantuan" description="Panduan untuk menelusuri informasi produk publik." /><div className="help-grid"><article><span>01</span><h2>Informasi produk</h2><p>Detail durasi, wilayah, aktivasi, persyaratan, garansi, dan dukungan ada pada halaman setiap produk.</p><Link href="/shop">Cari produk <span aria-hidden="true">→</span></Link></article><article><span>02</span><h2>Jawaban umum</h2><p>Temukan penjelasan singkat mengenai katalog dan informasi harga retail.</p><Link href="/faq">Baca FAQ <span aria-hidden="true">→</span></Link></article><article><span>03</span><h2>Informasi reseller</h2><p>Pelajari gambaran umum program tanpa membuka data harga khusus reseller.</p><Link href="/reseller-program">Program Reseller <span aria-hidden="true">→</span></Link></article></div><section className="help-note"><h2>Belum menemukan jawaban?</h2><p>Informasi kontak dukungan belum tersedia di halaman publik ini. Periksa kembali detail produk dan FAQ.</p></section></PageWidth></main>;
}

export function ResellerProgramSurface({ session, application, error = "" }: { session?: Pick<CustomerSession, "userId" | "displayName" | "role">; application?: ResellerApplication; error?: string }) {
  const approved = session?.role === "reseller-approved" || application?.status === "approved";
  return <main className="info-page"><PageWidth><PageHeading eyebrow="PROGRAM BACSHOP" title="Program Reseller" description="Informasi umum untuk calon mitra yang ingin mengenal program reseller Bacshop." /><section className="reseller-intro"><div><span className="eyebrow">KEMITRAAN</span><h2>Program dengan akses yang terpisah dan jelas.</h2><p>Informasi program disediakan untuk membantu memahami ruang lingkup kemitraan. Status pengajuan disimpan di akunmu dan ditinjau oleh tim Bacshop.</p></div><div className="reseller-intro__mark" aria-hidden="true">b<span>MITRA BACSHOP</span></div></section><div className="reseller-steps"><article><span>01</span><h3>Kenali program</h3><p>Baca informasi publik dan pahami ruang lingkup kemitraan.</p></article><article><span>02</span><h3>Ajukan & tunggu review</h3><p>Lengkapi data singkat usaha agar tim dapat meninjau pengajuan.</p></article><article><span>03</span><h3>Akses sesuai konteks</h3><p>Harga reseller hanya tersedia pada Pusat Reseller setelah akses disetujui.</p></article></div>{error && <p className="retail-error" role="alert">Lengkapi semua data pengajuan lalu coba lagi.</p>}{approved ? <section className="promo-info"><h2>Akunmu sudah disetujui</h2><p>Masuk ke Reseller Center untuk melihat harga tier dan alat operasional.</p><PrimaryLink href="/reseller">Buka Reseller Center</PrimaryLink></section> : application?.status === "pending" ? <section className="promo-info"><h2>Pengajuan sedang ditinjau</h2><p>Pengajuan atas nama {application.fullName} sudah tercatat. Status ini juga tersedia di halaman akun.</p><PrimaryLink href="/account">Lihat akun</PrimaryLink></section> : session ? <section className="promo-info"><h2>Mulai pengajuan reseller</h2><p>Isi data singkat berikut. Tidak ada harga reseller yang ditampilkan sebelum persetujuan.</p><form action="/api/reseller/apply" method="post" className="retail-form"><CsrfInput /><label>Nama lengkap<input name="fullName" autoComplete="name" defaultValue={session.displayName} required /></label><label>Nama usaha<input name="businessName" autoComplete="organization" required /></label><label>Nomor WhatsApp atau kontak<input name="contact" autoComplete="tel" required /></label><button className="button button--primary" type="submit">Ajukan untuk ditinjau</button></form></section> : <section className="promo-info"><h2>Sudah siap menjadi mitra?</h2><p>Masuk atau daftar dulu agar status pengajuan dapat tersimpan di akunmu.</p><PrimaryLink href="/auth/sign-in?returnTo=/reseller-program">Masuk untuk mengajukan</PrimaryLink></section>}<p className="reseller-disclosure">Halaman publik ini tidak memuat daftar harga reseller, komisi, biaya, atau janji pendapatan.</p><PrimaryLink href="/faq">Baca pertanyaan umum</PrimaryLink></PageWidth></main>;
}
