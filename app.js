(() => {
  'use strict';

  const CART_KEY = 'bacshop-public-cart-v1';
  let CATEGORIES = [
    { slug: 'ai', name: 'AI & Produktivitas' },
    { slug: 'streaming', name: 'Streaming' },
    { slug: 'desain', name: 'Desain' },
    { slug: 'musik', name: 'Musik' },
    { slug: 'office', name: 'Office' },
    { slug: 'editing', name: 'Editing' },
    { slug: 'voucher', name: 'Voucher' },
  ];

  // All products and prices in this frontend are illustrative examples.
  let PRODUCTS = [
    {
      id: 'ai-studio-plus', slug: 'ai-studio-plus', name: 'AI Studio Plus', category: 'ai',
      price: 89000, duration: '1 bulan', fulfillment: 'Aktivasi digital',
      art: '#fff0e5', artInk: '#b64a23',
      description: 'Akses contoh paket produktivitas AI untuk membantu riset, menulis, dan merangkum pekerjaan.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Indonesia', 'Akun': 'Gunakan akun pribadi', 'Aktivasi': 'Panduan dikirim setelah pesanan diproses', 'Estimasi proses': 'Contoh estimasi: hingga 30 menit', 'Garansi & bantuan': 'Lihat detail kebijakan sebelum transaksi' },
    },
    {
      id: 'stream-screen', slug: 'stream-screen', name: 'Stream Screen Premium', category: 'streaming',
      price: 59000, duration: '1 bulan', fulfillment: 'Kode digital',
      art: '#eeeaff', artInk: '#5941a6',
      description: 'Contoh paket hiburan digital untuk menonton film dan serial di perangkat pilihan.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Indonesia', 'Akun': 'Akun pribadi, detail mengikuti varian', 'Aktivasi': 'Kode digital dan petunjuk penggunaan', 'Estimasi proses': 'Contoh estimasi: otomatis setelah konfirmasi', 'Garansi & bantuan': 'Syarat bantuan mengikuti varian produk' },
    },
    {
      id: 'design-kit-pro', slug: 'design-kit-pro', name: 'Design Kit Pro', category: 'desain',
      price: 72000, duration: '1 bulan', fulfillment: 'Aktivasi digital',
      art: '#fff0e6', artInk: '#c34d25',
      description: 'Contoh akses perangkat desain untuk membuat presentasi, konten sosial, dan aset visual.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Global, sesuai ketentuan layanan', 'Akun': 'Akun pribadi', 'Aktivasi': 'Aktivasi digital dengan panduan', 'Estimasi proses': 'Contoh estimasi: hingga 1 jam', 'Garansi & bantuan': 'Detail kebijakan perlu dikonfirmasi sebelum jual' },
    },
    {
      id: 'sound-wave', slug: 'sound-wave', name: 'Sound Wave Premium', category: 'musik',
      price: 49000, duration: '1 bulan', fulfillment: 'Kode digital',
      art: '#e8f2ff', artInk: '#1769b8',
      description: 'Contoh langganan audio digital dengan akses katalog musik dan fitur mendengarkan.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Indonesia', 'Akun': 'Akun pribadi', 'Aktivasi': 'Kode digital dikirim pada detail pesanan', 'Estimasi proses': 'Contoh estimasi: hingga 30 menit', 'Garansi & bantuan': 'Lihat detail kebijakan sebelum transaksi' },
    },
    {
      id: 'office-cloud', slug: 'office-cloud', name: 'Office Cloud Personal', category: 'office',
      price: 99000, duration: '1 bulan', fulfillment: 'Lisensi digital',
      art: '#eaf3ff', artInk: '#2567b5',
      description: 'Contoh lisensi produktivitas personal untuk kebutuhan dokumen dan penyimpanan cloud.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Mengikuti ketersediaan layanan', 'Akun': 'Akun pribadi', 'Aktivasi': 'Lisensi dan panduan aktivasi', 'Estimasi proses': 'Contoh estimasi: hingga 1 jam', 'Garansi & bantuan': 'Syarat lisensi perlu diperiksa sebelum digunakan' },
    },
    {
      id: 'cut-studio', slug: 'cut-studio', name: 'Cut Studio Creator', category: 'editing',
      price: 65000, duration: '1 bulan', fulfillment: 'Aktivasi digital',
      art: '#ffedf2', artInk: '#b83e64',
      description: 'Contoh fitur editing premium untuk menyusun video pendek dan konten kreator.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Indonesia', 'Akun': 'Akun pribadi', 'Aktivasi': 'Aktivasi digital dengan panduan', 'Estimasi proses': 'Contoh estimasi: hingga 1 jam', 'Garansi & bantuan': 'Detail kebijakan perlu dikonfirmasi sebelum jual' },
    },
    {
      id: 'voucher-play', slug: 'voucher-play', name: 'Voucher Play Digital', category: 'voucher',
      price: 50000, duration: 'Nominal Rp50.000', fulfillment: 'Kode digital',
      art: '#eff9ed', artInk: '#41833d',
      description: 'Contoh voucher digital untuk menambah saldo pada layanan yang sesuai.',
      terms: { 'Durasi': 'Mengikuti masa berlaku kode', 'Wilayah': 'Periksa wilayah penukaran sebelum membeli', 'Akun': 'Akun layanan tujuan diperlukan', 'Aktivasi': 'Kode ditukar secara mandiri', 'Estimasi proses': 'Contoh estimasi: kode dikirim setelah diproses', 'Garansi & bantuan': 'Kode yang telah digunakan tidak dapat dipakai ulang' },
    },
    {
      id: 'learn-focus', slug: 'learn-focus', name: 'Learn Focus Membership', category: 'ai',
      price: 79000, duration: '1 bulan', fulfillment: 'Aktivasi digital',
      art: '#eef7f5', artInk: '#34786d',
      description: 'Contoh membership belajar digital untuk membangun rutinitas belajar yang konsisten.',
      terms: { 'Durasi': '1 bulan sejak aktivasi', 'Wilayah': 'Indonesia', 'Akun': 'Akun pribadi', 'Aktivasi': 'Aktivasi digital dengan panduan', 'Estimasi proses': 'Contoh estimasi: hingga 1 jam', 'Garansi & bantuan': 'Lihat detail kebijakan sebelum transaksi' },
    },
  ];

  const app = document.querySelector('#app');
  let STOREFRONT = { categories: CATEGORIES, banners: [], promotions: [], resellerPlan: { price: 149000, terms: '' }, payment: { qrisImage: '', instructions: '' } };
  let currentUser = null;
  let toastTimer;
  let carouselTimer;
  let cart = readCart();
  let previewContext = null;

  const rupiah = (value) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(value);

  function feather(name, className = '') {
    return `<svg class="feather-icon ${className}" aria-hidden="true" focusable="false"><use href="./assets/feather.svg#${name}"></use></svg>`;
  }

  function avatarMark(user) {
    const content = user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml(user.name.slice(0, 1).toLocaleUpperCase('id-ID'));
    return `<span class="avatar-mark">${content}</span>`;
  }

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(CART_KEY);
        return [];
      }
      const valid = parsed.map((item) => {
        const product = PRODUCTS.find((entry) => entry.id === item?.id);
        const quantity = Number(item?.quantity);
        return product && !(product.orderMode === 'preorder' && !product.preOrderConfirmed) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
          ? { id: product.id, quantity }
          : null;
      }).filter(Boolean);
      if (JSON.stringify(valid) !== JSON.stringify(parsed)) localStorage.setItem(CART_KEY, JSON.stringify(valid));
      return valid;
    } catch {
      try { localStorage.removeItem(CART_KEY); } catch { /* Storage may be unavailable. */ }
      return [];
    }
  }

  function writeCart(items) {
    cart = items;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      showToast('Keranjang hanya tersimpan selama halaman ini terbuka.');
    }
    updateCartCounts();
  }

  function cartQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartCounts() {
    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = String(cartQuantity());
      element.hidden = cartQuantity() === 0;
    });
  }

  function addToCart(id, quantity = 1) {
    const product = PRODUCTS.find((entry) => entry.id === id);
    if (!product) return;
    if (product.orderMode === 'preorder' && !product.preOrderConfirmed) {
      showToast('Hubungi admin dan tunggu konfirmasi stok sebelum memesan.');
      return;
    }
    const existing = cart.find((item) => item.id === id);
    const next = existing
      ? cart.map((item) => item.id === id ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item)
      : [...cart, { id, quantity: Math.max(1, Math.min(99, quantity)) }];
    writeCart(next);
    showToast(`${product.name} ditambahkan ke keranjang`);
  }

  function updateQuantity(id, amount) {
    const next = cart.map((item) => item.id === id
      ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + amount)) }
      : item);
    writeCart(next);
    render();
  }

  function removeFromCart(id) {
    const product = PRODUCTS.find((entry) => entry.id === id);
    writeCart(cart.filter((item) => item.id !== id));
    showToast(`${product?.name || 'Produk'} dihapus dari keranjang`);
    render();
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function safeDecode(value = '') {
    try { return decodeURIComponent(value); } catch { return ''; }
  }

  function getRoute() {
    const raw = window.location.hash.slice(1) || '/';
    const [path, queryString = ''] = raw.split('?');
    return { path: path.startsWith('/') ? path : `/${path}`, params: new URLSearchParams(queryString) };
  }

  function headerSearch(id, value = '') {
    return `<div class="search-wrap">
      <form class="search-form" role="search" data-search-form="${id}">
        <label class="visually-hidden" for="search-${id}">Cari produk digital atau kategori</label>
        ${feather('search','search-icon')}
        <input id="search-${id}" name="q" type="search" value="${escapeHtml(value)}" placeholder="Cari produk digital" autocomplete="off" aria-controls="suggestions-${id}" aria-expanded="false" />
        <span class="search-key" aria-hidden="true"><kbd>↵</kbd></span>
      </form>
      <div class="search-suggestions" id="suggestions-${id}" role="group" aria-label="Saran pencarian"></div>
    </div>`;
  }

  function activeNav(path, label) {
    const active = label === 'Beranda' ? path === '/' :
      label === 'Belanja' ? path.startsWith('/kategori') || path.startsWith('/produk') :
        label === 'Promo' ? path === '/promo' : label === 'Pesanan' ? path.startsWith('/pesanan') : path === '/masuk' || path === '/daftar' || path.startsWith('/akun');
    return active ? ' aria-current="page"' : '';
  }

  function shell(content, path) {
    const { params } = getRoute();
    const query = params.get('q') || '';
    const count = cartQuantity();
    const detailSlug = path.startsWith('/produk/') ? path.split('/')[2] : '';
    const detailProduct = PRODUCTS.find((product) => product.slug === safeDecode(detailSlug));
    const accountHref = currentUser ? '#/akun' : '#/masuk';
    const accountControl = currentUser
      ? `<a class="account-link" href="#/akun">${avatarMark(currentUser)}<span class="account-link-copy"><strong>${escapeHtml(currentUser.name)}</strong><small>${currentUser.isReseller ? 'Reseller' : 'Akun'}</small></span></a>`
      : `<div class="auth-actions"><a class="button button-small" href="#/masuk">Masuk</a><a class="button button-primary button-small" href="#/daftar">Daftar</a></div>`;
    return `<header class="site-header">
      <div class="header-main">
        <a class="brand" href="#/" aria-label="Bacshop beranda">Bacshop</a>
        ${headerSearch('desktop', query)}
        <div class="header-actions">
          <a class="header-link" href="#/program-reseller">Program reseller</a>
          <a class="icon-button" href="#/keranjang" aria-label="Keranjang belanja">${feather('shopping-cart')}<span class="cart-count" data-cart-count ${count ? '' : 'hidden'}>${count}</span></a>
          ${accountControl}
        </div>
      </div>
      <div class="mobile-top">
        <a class="brand" href="#/" aria-label="Bacshop beranda">Bacshop</a>
        <div class="mobile-tools"><a class="icon-button" href="#/keranjang" aria-label="Keranjang belanja">${feather('shopping-cart')}<span class="cart-count" data-cart-count ${count ? '' : 'hidden'}>${count}</span></a><a class="mobile-account-link" href="${accountHref}" aria-label="${currentUser ? `Akun ${escapeHtml(currentUser.name)}` : 'Masuk atau daftar'}">${currentUser ? avatarMark(currentUser) : feather('user')}</a></div>
      </div>
      <div class="mobile-search-row">${headerSearch('mobile', query)}</div>
    </header>
    <main class="page-container" id="main" tabindex="-1">${content}</main>
    ${detailProduct ? `<div class="mobile-purchase"><div><small>${detailProduct.priceContext === 'reseller' ? 'Harga reseller' : 'Harga retail'}</small><strong>${rupiah(detailProduct.price)}</strong></div>${detailProduct.orderMode === 'preorder' && !detailProduct.preOrderConfirmed ? `<span class="button button-disabled" aria-disabled="true">Stok dikonfirmasi sebelum pesan</span>` : `<button class="button button-primary" type="button" data-add-to-cart="${detailProduct.id}">Tambah ke keranjang</button>`}</div>` : ''}
    <footer class="site-footer"><div class="footer-inner">
      <div class="footer-brand-col"><a class="brand footer-brand" href="#/">Bacshop</a><p class="footer-summary">Periksa detail produk dan ketentuan sebelum membeli.</p></div>
      <div class="footer-col"><h3>Belanja</h3><a href="#/kategori/semua">Semua produk</a><a href="#/kategori/ai">AI & produktivitas</a><a href="#/kategori/streaming">Streaming</a><a href="#/promo">Promo</a></div>
      <div class="footer-col"><h3>Bacshop</h3><a href="#/program-reseller">Program reseller</a><a href="#/faq">FAQ</a><a href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Bantuan · Telegram @Mubacs</a></div>
      <div class="footer-col"><h3>Akun</h3><a href="#/akun">Profil</a><a href="#/pesanan">Pesanan</a><a href="#/keranjang">Keranjang</a><a href="#/masuk">Masuk</a></div>
    </div><div class="footer-bottom"><span>© Bacshop</span><span>Periksa detail produk dan ketentuan sebelum membayar.</span></div></footer>
    <nav class="mobile-bottom" aria-label="Navigasi mobile">
      <a class="mobile-nav-link" href="#/"${activeNav(path, 'Beranda')}>${feather('home')}<span>Beranda</span></a>
      <a class="mobile-nav-link" href="#/kategori/semua"${activeNav(path, 'Belanja')}>${feather('grid')}<span>Belanja</span></a>
      <a class="mobile-nav-link" href="#/promo"${activeNav(path, 'Promo')}>${feather('tag')}<span>Promo</span></a>
      <a class="mobile-nav-link" href="${currentUser ? '#/akun' : '#/masuk'}"${activeNav(path, 'Akun')}>
        ${currentUser ? avatarMark(currentUser) : feather('user')}<span>${currentUser ? 'Akun' : 'Masuk'}</span></a>
    </nav>`;
  }

  function authShell(content) {
    return `<div class="auth-shell"><header class="auth-header"><a class="auth-logo" href="#/" aria-label="Bacshop beranda">Bacshop</a></header><main class="auth-main" id="main" tabindex="-1">${content}</main></div>`;
  }

  function productArt(product, detail = false) {
    return product.image
      ? `<div class="${detail ? 'detail-art' : 'product-art'} product-media" role="img" aria-label="${escapeHtml(product.name)}" style="background-image:url('${escapeHtml(product.image)}')"></div>`
      : `<div class="${detail ? 'detail-art' : 'product-art'} image-placeholder" role="img" aria-label="Gambar ${escapeHtml(product.name)} belum tersedia"></div>`;
  }

  function productCard(product) {
    const category = CATEGORIES.find((entry) => entry.slug === product.category);
    const needsStockConfirmation = product.orderMode === 'preorder' && !product.preOrderConfirmed;
    return `<article class="product-card">
      <a class="product-card-link" href="#/produk/${encodeURIComponent(product.slug)}" aria-label="Lihat ${escapeHtml(product.name)}">
      ${productArt(product)}
        <div class="product-info"><span class="product-category">${escapeHtml(category?.name || 'Produk digital')}</span>
          <h3 class="product-title">${escapeHtml(product.name)}</h3><strong class="product-price">${rupiah(product.price)}</strong>
          ${product.orderMode === 'preorder' ? `<span class="availability-label">${needsStockConfirmation ? 'Pre-order · cek stok' : 'Stok dikonfirmasi'}</span>` : ''}
          <span class="product-price-note">Harga ${product.priceContext === 'reseller' ? 'reseller' : 'retail'}</span>
          <div class="product-card-footer"><span class="fulfillment"><span class="fulfillment-dot"></span>${escapeHtml(product.fulfillment)}</span></div>
        </div>
      </a>
      <div class="product-card-actions"><a class="button button-primary product-detail-button" href="#/produk/${encodeURIComponent(product.slug)}">Detail</a>${needsStockConfirmation ? `<button class="button cart-icon-button" type="button" disabled aria-label="Stok ${escapeHtml(product.name)} belum dikonfirmasi">${feather('shopping-cart')}</button>` : `<button class="button cart-icon-button" type="button" data-add-to-cart="${product.id}" aria-label="Tambah ${escapeHtml(product.name)} ke keranjang">${feather('shopping-cart')}</button>`}</div>
    </article>`;
  }

  function categoryLinks() {
    return CATEGORIES.map((category) => `<a class="category-item" href="#/kategori/${category.slug}" aria-label="Kategori ${escapeHtml(category.name)}">${category.image ? `<img class="category-photo" src="${escapeHtml(category.image)}" alt="" loading="lazy" />` : `<span class="category-placeholder" aria-hidden="true"></span>`}<span>${escapeHtml(category.name)}</span></a>`).join('');
  }

  function sectionHead(title, subtitle, link = '') {
    return `<div class="section-head"><div><h2 class="section-title">${title}</h2>${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}</div>${link}</div>`;
  }

  function renderHome() {
    const popular = PRODUCTS.slice(0, 5).map(productCard).join('');
    const recent = PRODUCTS.slice(3, 8).map(productCard).join('');
    const banners = (STOREFRONT.banners || []).filter((banner) => banner.active).slice(0, 10);
    const activeBanners = banners.length ? banners : [{ title: 'Produk digital, tanpa bingung.', description: 'Bandingkan durasi, cara aktivasi, dan ketentuan sebelum memilih.', image: '', href: '#/kategori/semua' }];
    const slides = activeBanners.map((banner, index) => `<div class="hero-slide ${index === 0 ? 'is-active' : 'hero-slide-image'}" data-hero-slide role="group" aria-roledescription="slide" aria-label="${index + 1} dari ${activeBanners.length}" ${index ? 'aria-hidden="true" inert' : ''}>
      ${index === 0 || banner.title || banner.description ? `<div class="hero-copy"><h1>${escapeHtml(banner.title || 'Pilihan Bacshop')}</h1>${banner.description ? `<p>${escapeHtml(banner.description)}</p>` : ''}<a class="button button-primary" href="${escapeHtml(banner.href || '#/kategori/semua')}">Jelajahi produk ${feather('arrow-right')}</a></div>` : ''}
      ${banner.image ? `<div class="hero-image-placeholder hero-uploaded-image" role="img" aria-label="${escapeHtml(banner.title || 'Banner toko')}" style="background-image:url('${escapeHtml(banner.image)}')"></div>` : `<div class="${index ? 'hero-secondary-placeholder' : 'hero-image-placeholder'} hero-fallback-image" role="img" aria-label="Banner ${index + 1}"></div>`}
    </div>`).join('');
    const dots = activeBanners.map((_, index) => `<button type="button" data-hero-to="${index}" aria-label="Banner ${index + 1}" aria-pressed="${index === 0}"></button>`).join('');
    const promos = (STOREFRONT.promotions || []).filter((promo) => promo.active).slice(0, 4);
    const promoStrip = promos.length ? `<section class="section home-promo-section">${sectionHead('Promo','Pilihan yang sedang tersedia.',`<a class="text-link" href="#/promo">Lihat semua ${feather('arrow-right')}</a>`)}<div class="home-promo-grid">${promos.map((promo) => `<a class="home-promo-card" href="${escapeHtml(promo.href)}">${promo.image ? `<img src="${escapeHtml(promo.image)}" alt="" loading="lazy" />` : ''}<span><strong>${escapeHtml(promo.title)}</strong><span>${escapeHtml(promo.description)}</span></span></a>`).join('')}</div></section>` : '';
    return `<section class="hero-carousel" data-hero-carousel role="region" aria-label="Pilihan Bacshop" aria-roledescription="carousel" tabindex="0">
      ${slides}
      ${activeBanners.length > 1 ? `<button class="hero-control hero-previous" type="button" data-hero-prev aria-label="Banner sebelumnya">${feather('chevron-left')}</button><button class="hero-control hero-next" type="button" data-hero-next aria-label="Banner berikutnya">${feather('chevron-right')}</button><div class="hero-dots" role="group" aria-label="Pilih banner">${dots}</div>` : ''}
    </section>
    <section class="section">${sectionHead('Kategori','')}<div class="category-grid">${categoryLinks()}</div></section>
    ${promoStrip}
    <section class="section" id="produk-populer">${sectionHead('Pilihan produk','',`<a class="text-link" href="#/kategori/semua">Lihat semua ${feather('arrow-right')}</a>`)}<div class="product-grid">${popular}</div></section>
    <section class="section">${sectionHead('Produk digital lainnya','',`<a class="text-link" href="#/kategori/ai">Jelajahi ${feather('arrow-right')}</a>`)}<div class="product-grid">${recent}</div></section>
    <nav class="plain-links" aria-label="Informasi Bacshop"><a class="plain-link" href="#/program-reseller"><span><strong>Program reseller</strong><span>Mulai dari pembelian bulk atau paket satu kali.</span></span>${feather('arrow-right')}</a><a class="plain-link" href="#/faq"><span><strong>Pertanyaan dan bantuan</strong><span>Jawaban tentang produk, pembayaran, dan pesanan.</span></span>${feather('arrow-right')}</a></nav>`;
  }

  function getQueryUrl(category, query, sort, min = '', max = '') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (min !== '' && Number(min) > 0) params.set('min', String(min));
    if (max !== '' && Number(max) > 0) params.set('max', String(max));
    const suffix = params.toString();
    return `#/kategori/${encodeURIComponent(category)}${suffix ? `?${suffix}` : ''}`;
  }

  function searchProducts(query, category = 'semua', sort = 'relevance', min = 0, max = Number.MAX_SAFE_INTEGER) {
    const term = query.trim().toLocaleLowerCase('id-ID');
    let products = PRODUCTS.filter((product) => {
      const categoryName = CATEGORIES.find((item) => item.slug === product.category)?.name || '';
      const matchesCategory = category === 'semua' || product.category === category;
      const matchesQuery = !term || `${product.name} ${categoryName} ${product.description} ${product.fulfillment}`.toLocaleLowerCase('id-ID').includes(term);
      return matchesCategory && matchesQuery && Number(product.price) >= min && Number(product.price) <= max;
    });
    if (sort === 'price-low') products = [...products].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') products = [...products].sort((a, b) => b.price - a.price);
    if (sort === 'best-selling') products = [...products].sort((a, b) => b.sold - a.sold);
    if (sort === 'newest') products = [...products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (sort === 'name') products = [...products].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return products;
  }

  function advancedFilterButton(params) {
    const active = ['min', 'max'].filter((key) => params.has(key) && Number(params.get(key)) > 0).length
      + (params.get('sort') && params.get('sort') !== 'relevance' ? 1 : 0);
    return `<button class="button filter-trigger" type="button" data-open-filter>${feather('filter')}<span>Filter</span>${active ? `<span class="filter-count">${active}</span>` : ''}</button>`;
  }

  function advancedFilterDialog(category, params) {
    const ceiling = Math.max(50000, Math.ceil(Math.max(...PRODUCTS.map((product) => Number(product.price) || 0)) / 50000) * 50000);
    const min = Math.max(0, Number(params.get('min')) || 0);
    const max = Math.min(ceiling, Number(params.get('max')) || ceiling);
    const sort = params.get('sort') || 'relevance';
    return `<dialog class="filter-dialog" data-filter-dialog aria-labelledby="filter-heading"><form class="filter-dialog-form" data-filter-form>
      <header class="filter-dialog-head"><h2 id="filter-heading">Filter & urutkan</h2><button class="icon-button" type="button" data-close-filter aria-label="Tutup filter">${feather('x')}</button></header>
      <div class="filter-dialog-body">
        <fieldset class="price-filter"><legend>Rentang harga</legend><div class="price-inputs"><label>Minimal<input id="min-price" name="min" type="number" min="0" max="${ceiling}" step="5000" value="${min}" inputmode="numeric" /></label><label>Maksimal<input id="max-price" name="max" type="number" min="0" max="${ceiling}" step="5000" value="${max === ceiling && !params.has('max') ? '' : max}" placeholder="Tanpa batas" inputmode="numeric" /></label></div>
          <div class="range-inputs"><label class="visually-hidden" for="min-range">Harga minimum</label><input id="min-range" type="range" min="0" max="${ceiling}" step="5000" value="${min}" data-range-for="min-price" /><label class="visually-hidden" for="max-range">Harga maksimum</label><input id="max-range" type="range" min="0" max="${ceiling}" step="5000" value="${max}" data-range-for="max-price" /></div>
          <div class="range-limits"><span>Rp0</span><span>Sampai ${rupiah(ceiling)}</span></div>
        </fieldset>
        <label class="sort-filter">Urutkan<select name="sort"><option value="relevance" ${sort === 'relevance' ? 'selected' : ''}>Paling relevan</option><option value="price-low" ${sort === 'price-low' ? 'selected' : ''}>Harga termurah</option><option value="price-high" ${sort === 'price-high' ? 'selected' : ''}>Harga termahal</option><option value="newest" ${sort === 'newest' ? 'selected' : ''}>Terbaru</option></select></label>
      </div>
      <footer class="filter-dialog-actions"><button class="button" type="button" data-reset-filter>Reset</button><button class="button button-primary" type="submit">Tampilkan produk</button></footer>
    </form></dialog>`;
  }

  function renderCatalog(category, params) {
    const query = params.get('q') || '';
    const sort = params.get('sort') || 'relevance';
    const min = Math.max(0, Number(params.get('min')) || 0);
    const max = Math.max(0, Number(params.get('max')) || Number.MAX_SAFE_INTEGER);
    const validCategory = CATEGORIES.some((item) => item.slug === category) ? category : 'semua';
    const heading = validCategory === 'semua' ? 'Produk' : CATEGORIES.find((item) => item.slug === validCategory)?.name || 'Produk';
    const products = searchProducts(query, validCategory, sort, min, max);
    const categoriesSidebar = `<aside class="filter-panel"><h2>Kategori</h2>${[['semua','Produk'], ...CATEGORIES.map((item) => [item.slug,item.name])].map(([slug, name]) => `<a class="filter-option ${validCategory === slug ? 'active' : ''}" href="${getQueryUrl(slug, query, sort, min, params.get('max') || '')}"><span>${escapeHtml(name)}</span><span aria-hidden="true">›</span></a>`).join('')}</aside>`;
    const mobileCategories = `<nav class="catalog-category-chips" aria-label="Pilih kategori">${[['semua','Produk'], ...CATEGORIES.map((item) => [item.slug,item.name])].map(([slug,name]) => `<a class="category-chip ${validCategory === slug ? 'active' : ''}" href="${getQueryUrl(slug, query, sort, min, params.get('max') || '')}" ${validCategory === slug ? 'aria-current="page"' : ''}>${escapeHtml(name)}</a>`).join('')}</nav>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>${escapeHtml(heading)}</span></nav>
      <section class="page-panel catalog-page"><div class="page-heading"><h1>${escapeHtml(heading)}</h1><p>${query ? `Hasil pencarian untuk “${escapeHtml(query)}”.` : 'Pilih produk dan periksa ketentuan sebelum melanjutkan.'}</p></div>
        <div class="catalog-layout">${categoriesSidebar}<div class="catalog-main">${mobileCategories}<div class="product-toolbar">${advancedFilterButton(params)}<span class="filter-summary">${sort === 'relevance' ? 'Urutan relevan' : escapeHtml(({ 'price-low':'Harga termurah', 'price-high':'Harga termahal', newest:'Terbaru' })[sort] || 'Urutan relevan')}</span></div>
          <div class="catalog-topline"><p>${products.length} produk</p>${query || params.has('min') || params.has('max') || params.has('sort') ? `<a class="text-link" href="${getQueryUrl(validCategory, query, 'relevance')}">Hapus filter</a>` : ''}</div>
          ${products.length ? `<div class="product-grid">${products.map(productCard).join('')}</div>` : `<div class="empty-state"><h3>Belum ada produk yang cocok</h3><p>Ubah rentang harga atau urutan untuk melihat pilihan lainnya.</p><button class="button button-primary button-small" type="button" data-clear-filter>Hapus filter</button></div>`}
        </div></div></section>${advancedFilterDialog(validCategory, params)}`;
  }

  function renderDetail(slug) {
    const product = PRODUCTS.find((item) => item.slug === safeDecode(slug || ''));
    if (!product) return null;
    const needsStockConfirmation = product.orderMode === 'preorder' && !product.preOrderConfirmed;
    const purchaseAction = needsStockConfirmation
      ? `<button class="button button-disabled" type="button" disabled>Stok dikonfirmasi sebelum pesan</button>`
      : `<button class="button button-primary" type="button" data-add-to-cart="${product.id}">Tambah ke keranjang</button>`;
    const category = CATEGORIES.find((item) => item.slug === product.category) || { name: 'Produk digital' };
    const terms = Object.entries(product.terms || {}).map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');
    const bulkNote = product.bulkUnlockQuantity ? `<p class="bulk-unlock-note">Beli ${product.bulkUnlockQuantity} unit dalam satu pesanan yang lunas untuk membuka harga reseller produk ini secara permanen.</p>` : '';
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/kategori/${product.category}">${escapeHtml(category.name)}</a><span aria-hidden="true">›</span><span>${escapeHtml(product.name)}</span></nav>
      <section class="page-panel"><div class="detail-layout"><div>${productArt(product, true)}</div><div class="detail-summary"><span class="product-category">${escapeHtml(category.name)}</span><h1>${escapeHtml(product.name)}</h1><div class="detail-meta"><span class="meta-pill">${escapeHtml(product.duration)}</span><span class="meta-pill">${escapeHtml(product.fulfillment)}</span>${product.orderMode === 'preorder' ? `<span class="meta-pill">${needsStockConfirmation ? 'Pre-order · menunggu konfirmasi stok' : 'Stok dikonfirmasi admin'}</span>` : ''}</div>
        <div class="detail-price-box"><small>Harga ${product.priceContext === 'reseller' ? 'reseller' : 'retail'}</small><strong class="detail-price">${rupiah(product.price)}</strong></div>${bulkNote}
        <div class="detail-actions">${purchaseAction}<a class="button" href="#/keranjang">Lihat keranjang</a></div>
        <ul class="term-list" aria-label="Informasi produk">${terms}</ul><p class="detail-description">${escapeHtml(product.description)}</p></div></div></section>
      <section class="section">${sectionHead('Pilihan lainnya','Jelajahi produk lain dari toko.') }<div class="product-grid">${PRODUCTS.filter((item) => item.id !== product.id).slice(0, 5).map(productCard).join('')}</div></section>`;
  }

  function notFound() {
    return `<main class="not-found-page"><h1>Halaman tidak ditemukan</h1><p>Alamat yang kamu buka tidak tersedia.</p><a class="button button-primary" href="#/">Ke beranda</a></main>`;
  }

  function renderCartPage() {
    const availableCart = cart.filter((item) => {
      const product = PRODUCTS.find((entry) => entry.id === item.id);
      return product && !(product.orderMode === 'preorder' && !product.preOrderConfirmed);
    });
    if (availableCart.length !== cart.length) writeCart(availableCart);
    const rows = availableCart.map((item) => ({ ...item, product: PRODUCTS.find((product) => product.id === item.id) })).filter((item) => item.product);
    const total = rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (!rows.length) return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Keranjang</span></nav><section class="page-panel"><div class="page-heading"><h1>Keranjangmu</h1><p>Produk yang kamu pilih akan tersimpan di browser ini.</p></div><div class="empty-state"><h3>Keranjang masih kosong</h3><p>Jelajahi katalog dan tambahkan produk yang kamu butuhkan.</p><a class="button button-primary button-small" href="#/kategori/semua">Jelajahi produk</a></div></section>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Keranjang</span></nav><section class="page-panel"><div class="page-heading"><h1>Keranjangmu</h1><p>Periksa jumlah dan harga setiap produk sebelum membuat pesanan.</p></div><div class="cart-layout"><div class="cart-list">${rows.map(({ product, quantity }) => `<article class="cart-row"><div class="cart-thumb ${product.image ? 'product-media' : 'image-placeholder'}" ${product.image ? `style="background-image:url('${escapeHtml(product.image)}')"` : ''} role="img" aria-label="Gambar ${escapeHtml(product.name)}"></div><div><h2><a href="#/produk/${product.slug}">${escapeHtml(product.name)}</a></h2><span class="cart-meta">${escapeHtml(product.duration)} · ${escapeHtml(product.fulfillment)}</span><strong class="cart-price">${rupiah(product.price)}</strong><div class="cart-controls"><button class="qty-button" type="button" data-quantity="${product.id}" data-delta="-1" aria-label="Kurangi jumlah ${escapeHtml(product.name)}">Kurangi</button><span class="qty-value">${quantity}</span><button class="qty-button" type="button" data-quantity="${product.id}" data-delta="1" aria-label="Tambah jumlah ${escapeHtml(product.name)}">Tambah</button><button class="remove-button" type="button" data-remove="${product.id}">Hapus</button></div></div><div class="cart-side"><strong class="cart-price">${rupiah(product.price * quantity)}</strong></div></article>`).join('')}</div><aside class="summary-card"><h2>Ringkasan belanja</h2><div class="summary-line"><span>Subtotal (${cartQuantity()} item)</span><span>${rupiah(total)}</span></div><div class="summary-total"><span>Total</span><span>${rupiah(total)}</span></div><a class="button button-primary" href="#/checkout">Lanjut ke pembayaran</a><p class="summary-note">Pembayaran QRIS diverifikasi admin setelah transaksi dicocokkan.</p></aside></div></section>`;
  }

  function renderInfoPage(path) {
    if (path === '/program-reseller') {
      const price = Number(STOREFRONT.resellerPlan?.price) || 149000;
      return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Program reseller</span></nav>
        <section class="page-panel reseller-program-page"><div class="page-heading"><h1>Harga reseller</h1><p>Belanja seperti biasa. Pembelian bulk membuka harga khusus pada produk yang dibeli; paket reseller membuka harga khusus di seluruh katalog.</p></div>
          ${currentUser?.resellerPlan ? `<div class="account-status-card"><strong>Akses reseller aktif</strong><p>Harga reseller berlaku di seluruh katalog dan akses paket ini tidak kedaluwarsa.</p><a class="button button-primary" href="#/kategori/semua">Lihat produk</a></div>` : `<div class="reseller-plan-card"><span>Paket reseller</span><strong>${rupiah(price)}</strong><p>${escapeHtml(STOREFRONT.resellerPlan?.terms || 'Sekali bayar. Harga reseller terbuka permanen di seluruh katalog setelah pembayaran diverifikasi.')}</p>${currentUser ? `<button class="button button-primary" type="button" data-buy-reseller-plan>Beli paket reseller</button>` : `<a class="button button-primary" href="#/masuk?next=%2Fprogram-reseller">Masuk untuk membeli</a>`}</div>`}
          <div class="reseller-how"><h2>Akses per produk</h2><p>Setelah pesanan bulk lunas dan diverifikasi, harga reseller produk tersebut terbuka permanen. Minimum pembelian tertera di halaman produk.</p></div><a class="text-link" href="#/faq">Baca FAQ</a>
        </section>`;
    }
    if (path === '/promo') {
      const promos = (STOREFRONT.promotions || []).filter((promo) => promo.active);
      return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Promo</span></nav><section class="page-panel"><div class="page-heading"><h1>Promo</h1><p>Penawaran dan informasi terbaru dari Bacshop.</p></div>${promos.length ? `<div class="promo-page-grid">${promos.map((promo) => `<a class="promo-page-card" href="${escapeHtml(promo.href)}">${promo.image ? `<img src="${escapeHtml(promo.image)}" alt="" loading="lazy" />` : ''}<div><h2>${escapeHtml(promo.title)}</h2><p>${escapeHtml(promo.description)}</p></div></a>`).join('')}</div>` : `<div class="empty-state"><h3>Belum ada promo aktif</h3><p>Kunjungi lagi nanti untuk melihat penawaran terbaru.</p></div>`}</section>`;
    }
    const pages = {
      '/bantuan': { title: 'Pusat bantuan', intro: 'Periksa detail produk atau buka pertanyaan umum.', rows: [['Aktivasi','Cara dan estimasi proses dicantumkan pada setiap produk.'],['Pesanan','Status pembayaran dan pemenuhan ditampilkan terpisah pada detail pesanan.'],['FAQ','Buka FAQ untuk jawaban ringkas.']] },
    };
    const page = pages[path];
    if (!page) return null;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>${escapeHtml(page.title)}</span></nav><section class="page-panel"><div class="page-heading"><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></div><dl class="info-rows">${page.rows.map(([title,description]) => `<div><dt>${escapeHtml(title)}</dt><dd>${escapeHtml(description)}</dd></div>`).join('')}</dl>${path === '/program-reseller' ? `<a class="button button-primary" href="#/masuk">Masuk untuk mulai</a>` : path === '/bantuan' ? `<a class="text-link" href="#/faq">Buka FAQ ${feather('arrow-right')}</a>` : ''}</section>`;
  }

  function renderFaq() {
    const items = [
      ['Apa yang saya dapat setelah membeli produk digital?', 'Produk dapat berupa akses, kode, atau lisensi. Jenis yang berlaku untuk suatu produk dijelaskan pada bagian aktivasi dan ketentuannya.'],
      ['Berapa lama proses aktivasi?', 'Estimasi proses dapat berbeda pada setiap produk. Periksa informasi proses pada halaman detail produk sebelum melanjutkan.'],
      ['Apakah saya perlu akun layanan tertentu?', 'Beberapa produk memerlukan akun pribadi atau akun tujuan. Persyaratan dicantumkan pada detail masing-masing produk.'],
      ['Bagaimana saya mendapat harga reseller?', 'Pembelian bulk membuka harga reseller secara permanen pada produk yang dibeli. Paket satu kali mulai Rp149.000 membuka harga reseller di seluruh katalog setelah pembayaran diverifikasi.'],
      ['Kapan pesanan dianggap lunas?', 'Admin mencocokkan transaksi pada DANA Bisnis. Status pesanan berubah menjadi lunas setelah pembayaran terverifikasi.'],
    ];
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>FAQ</span></nav><section class="page-panel"><div class="page-heading"><h1>Pertanyaan yang sering diajukan</h1><p>Informasi singkat tentang produk, pembayaran, dan pesanan.</p></div><div class="faq-list">${items.map(([question,answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('')}</div><aside class="faq-support"><div><strong>Masih butuh bantuan?</strong><span>Hubungi admin di Telegram @Mubacs.</span></div><a class="button button-primary" href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Hubungi admin</a></aside></section>`;
  }

  function renderAuthPage(path, params) {
    const register = path === '/daftar';
    const next = params.get('next') || '';
    const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/admin') ? next : '';
    const title = register ? 'Buat akun Bacshop' : 'Masuk ke Bacshop';
    return `<section class="auth-page"><div class="auth-card"><div class="auth-heading"><h1>${title}</h1><p>${register ? 'Simpan pesanan dan akses harga reseller dari akunmu.' : 'Masuk untuk melihat akun dan pesananmu.'}</p></div><form class="customer-auth-form" data-customer-auth="${register ? 'register' : 'login'}"><input type="hidden" name="next" value="${escapeHtml(safeNext)}" />${register ? `<label>Nama lengkap<input name="name" type="text" autocomplete="name" minlength="2" maxlength="80" required /></label>` : ''}<label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Kata sandi<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="10" required /></label><p class="form-message" data-auth-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">${register ? 'Buat akun' : 'Masuk'}</button></form><p class="auth-switch">${register ? 'Sudah punya akun?' : 'Belum punya akun?'} <a href="#/${register ? 'masuk' : 'daftar'}${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}">${register ? 'Masuk' : 'Daftar'}</a></p><a class="auth-back-link" href="#/">Kembali ke toko</a></div></section>`;
  }

  function renderAccountPage() {
    if (!currentUser) return `<section class="page-panel"><div class="empty-state"><h1>Masuk untuk membuka akun</h1><p>Profil, pesanan, dan harga reseller tersedia setelah kamu masuk.</p><a class="button button-primary" href="#/masuk?next=%2Fakun">Masuk</a></div></section>`;
    const avatar = currentUser.avatarUrl ? `<img src="${escapeHtml(currentUser.avatarUrl)}" alt="Foto profil ${escapeHtml(currentUser.name)}" />` : `<span>${escapeHtml(currentUser.name.slice(0, 1).toLocaleUpperCase('id-ID'))}</span>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Akun</span></nav><section class="page-panel account-page"><div class="page-heading"><h1>Akun</h1><p>Kelola informasi akun dan lihat aktivitas belanjamu.</p></div><div class="account-grid"><section class="account-profile-card"><div class="account-profile-head"><div class="avatar-large">${avatar}</div><div><h2>${escapeHtml(currentUser.name)}</h2><p>${escapeHtml(currentUser.email)}</p>${currentUser.isReseller ? '<span class="status-pill status-success">Reseller</span>' : '<span class="status-pill">Buyer</span>'}</div></div><form class="profile-form" data-profile-form><label>Nama lengkap<input name="name" value="${escapeHtml(currentUser.name)}" minlength="2" maxlength="80" required /></label><label>Foto profil<input type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload /><small>PNG, JPEG, atau WebP · maks. 5 MB</small></label><p class="form-message" data-profile-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan profil</button></form></section><nav class="account-menu-card" aria-label="Menu akun"><a href="#/pesanan"><span>Pesanan</span>${feather('arrow-right')}</a><a href="#/program-reseller"><span>${currentUser.isReseller ? 'Harga reseller' : 'Program reseller'}</span>${feather('arrow-right')}</a><button type="button" data-user-logout>Keluar dari akun</button></nav></div></section>`;
  }

  function orderStatusText(order) {
    if (order.paymentStatus === 'refunded') return 'Dana dikembalikan';
    if (order.paymentStatus === 'paid' && order.fulfillmentStatus === 'fulfilled') return 'Selesai';
    if (order.paymentStatus === 'paid') return 'Pembayaran terverifikasi';
    return 'Menunggu pembayaran';
  }

  function renderOrdersPage(orders) {
    const entries = orders.map((order) => `<a class="order-card" href="#/pesanan/${encodeURIComponent(order.id)}"><span class="order-card-top"><strong>${escapeHtml(order.id)}</strong><span class="status-pill ${order.paymentStatus === 'paid' ? 'status-success' : order.paymentStatus === 'refunded' ? 'status-danger' : 'status-warning'}">${orderStatusText(order)}</span></span><span class="order-card-items">${order.kind === 'reseller-plan' ? 'Paket reseller' : order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join(', ')}</span><span class="order-card-bottom"><span>${new Date(order.createdAt).toLocaleString('id-ID')}</span><strong>${rupiah(order.total)}</strong></span></a>`).join('');
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Pesanan</span></nav><section class="page-panel orders-page"><div class="page-heading"><h1>Pesanan</h1><p>Pantau pembayaran dan pemenuhan secara terpisah.</p></div>${entries ? `<div class="orders-list">${entries}</div>` : `<div class="empty-state"><h2>Belum ada pesanan</h2><p>Pesanan yang kamu buat akan tercatat di sini.</p><a class="button button-primary" href="#/kategori/semua">Mulai belanja</a></div>`}</section>`;
  }

  function renderOrderDetailPage(order) {
    const isPlan = order.kind === 'reseller-plan';
    const details = isPlan ? '<li><span>Akses</span><strong>Harga reseller seluruh katalog · permanen</strong></li>' : order.items.map((item) => `<li><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${rupiah(item.lineTotal)}</strong></li>`).join('');
    const qr = order.paymentStatus === 'pending' && order.qrisImage ? `<div class="qris-frame"><img src="${escapeHtml(order.qrisImage)}" alt="QRIS Bacshop" /></div>` : '';
    const paymentMessage = order.paymentStatus === 'pending' ? `<p class="payment-pending-copy">${escapeHtml(order.paymentInstructions || 'Pindai QRIS lalu masukkan jumlah yang tertera. Admin akan mencocokkan pembayaran di DANA Bisnis.')}</p>` : order.paymentStatus === 'paid' ? '<p class="payment-success-copy">Pembayaran sudah dicocokkan oleh admin.</p>' : '<p class="payment-failed-copy">Pembayaran pesanan ini sudah dikembalikan.</p>';
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/pesanan">Pesanan</a><span aria-hidden="true">›</span><span>${escapeHtml(order.id)}</span></nav><section class="page-panel order-detail-page"><div class="order-detail-heading"><div><span class="product-category">${escapeHtml(order.id)}</span><h1>${order.kind === 'reseller-plan' ? 'Paket reseller' : 'Detail pesanan'}</h1><p>${new Date(order.createdAt).toLocaleString('id-ID')}</p></div><span class="status-pill ${order.paymentStatus === 'paid' ? 'status-success' : order.paymentStatus === 'refunded' ? 'status-danger' : 'status-warning'}">${orderStatusText(order)}</span></div><div class="order-detail-grid"><div><section class="order-detail-card"><h2>Rincian</h2><ul class="term-list">${details}</ul><div class="summary-total"><span>Total</span><strong>${rupiah(order.total)}</strong></div></section><section class="order-detail-card"><h2>Status pemenuhan</h2><p>${escapeHtml(order.fulfillmentStatus || 'not_started') === 'fulfilled' ? 'Produk sudah dipenuhi.' : 'Pemenuhan produk diproses terpisah dari status pembayaran.'}</p></section></div><aside class="order-payment-card"><h2>${order.paymentStatus === 'pending' ? 'Bayar dengan QRIS' : 'Status pembayaran'}</h2>${qr}${paymentMessage}<strong class="payment-amount">${rupiah(order.total)}</strong>${order.paymentStatus === 'pending' && !order.qrisImage ? '<p class="summary-note">QRIS belum tersedia. Hubungi admin sebelum melakukan pembayaran.</p>' : ''}${order.paymentStatus === 'pending' ? '<button class="button" type="button" data-refresh-order>Perbarui status</button>' : ''}${isPlan ? `<details class="order-terms"><summary>Syarat paket reseller</summary><p>${escapeHtml(order.resellerTerms || '')}</p></details>` : ''}</aside></div><a class="text-link" href="#/pesanan">Kembali ke pesanan</a></section>`;
  }

  function renderCheckoutPage() {
    const items = cart.map((item) => ({ ...item, product: PRODUCTS.find((product) => product.id === item.id) })).filter((item) => item.product);
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (!items.length) return `<section class="page-panel"><div class="empty-state"><h1>Keranjang masih kosong</h1><p>Pilih produk dari katalog sebelum melanjutkan.</p><a class="button button-primary" href="#/kategori/semua">Lihat katalog</a></div></section>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/keranjang">Keranjang</a><span aria-hidden="true">›</span><span>Pembayaran</span></nav><section class="page-panel checkout-page"><div class="page-heading"><h1>Ringkasan pesanan</h1><p>Setelah pesanan dibuat, QRIS dan petunjuk pembayaran akan tampil.</p></div><div class="checkout-layout"><div class="checkout-items">${items.map((item) => `<div class="checkout-item"><span>${escapeHtml(item.product.name)} × ${item.quantity}</span><strong>${rupiah(item.product.price * item.quantity)}</strong></div>`).join('')}</div><aside class="summary-card"><h2>Total pembayaran</h2><div class="summary-total"><span>Total</span><strong>${rupiah(total)}</strong></div><button class="button button-primary" type="button" data-create-order>Buat pesanan</button><p class="summary-note">Pembayaran QRIS akan dicocokkan admin sebelum pesanan diproses.</p></aside></div></section>`;
  }

  function safeReturnPath(value, fallback = '/') {
    return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/admin') ? value : fallback;
  }

  async function renderCustomerRoute(path, params) {
    if (path === '/masuk' || path === '/daftar') return renderAuthPage(path, params);
    if (path === '/akun' || path === '/akun/profil') return renderAccountPage();
    if (path === '/pesanan') {
      if (!currentUser) { window.location.hash = `#/masuk?next=${encodeURIComponent('/pesanan')}`; return ''; }
      const result = await requestApi('/api/orders');
      return renderOrdersPage(result.orders);
    }
    if (path.startsWith('/pesanan/')) {
      if (!currentUser) { window.location.hash = `#/masuk?next=${encodeURIComponent(path)}`; return ''; }
      const result = await requestApi(`/api/orders/${encodeURIComponent(path.slice('/pesanan/'.length))}`);
      return renderOrderDetailPage(result.order);
    }
    if (path === '/checkout') {
      if (!currentUser) { window.location.hash = `#/masuk?next=${encodeURIComponent('/checkout')}`; return ''; }
      return renderCheckoutPage();
    }
    return null;
  }

  function renderNotice(path) {
    return null;
  }

  async function requestApi(url, { method = 'GET', body } = {}) {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Permintaan belum berhasil.');
    return payload;
  }

  async function filePayload(file) {
    if (!file) throw new Error('Pilih gambar terlebih dahulu.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 5 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return { mimeType: file.type, data: btoa(binary) };
  }

  function bindCustomerEvents() {
    app.querySelectorAll('[data-customer-auth]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('[data-auth-message]');
      const fields = Object.fromEntries(new FormData(form).entries());
      const next = safeReturnPath(fields.next || '/', '/');
      delete fields.next;
      try {
        const result = await requestApi(`/api/auth/${form.dataset.customerAuth}`, { method: 'POST', body: fields });
        currentUser = result.user;
        await loadCatalog();
        window.location.hash = `#${next}`;
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    }));

    app.querySelector('[data-profile-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = form.querySelector('[data-profile-message]');
      const fields = new FormData(form);
      try {
        const result = await requestApi('/api/auth/profile', { method: 'PUT', body: { name: fields.get('name'), avatarUrl: currentUser?.avatarUrl || '' } });
        currentUser = result.user;
        message.textContent = 'Profil tersimpan.';
        message.classList.remove('is-error');
        await render();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    });

    app.querySelector('[data-avatar-upload]')?.addEventListener('change', async (event) => {
      const input = event.currentTarget;
      const message = app.querySelector('[data-profile-message]');
      try {
        const payload = await filePayload(input.files?.[0]);
        const result = await requestApi('/api/auth/avatar', { method: 'POST', body: payload });
        currentUser = result.user;
        await render();
        showToast('Foto profil tersimpan.');
      } catch (error) {
        if (message) { message.textContent = error.message; message.classList.add('is-error'); }
      }
    });

    app.querySelector('[data-user-logout]')?.addEventListener('click', async () => {
      try {
        await requestApi('/api/auth/logout', { method: 'POST', body: {} });
        currentUser = null;
        await loadCatalog();
        window.location.hash = '#/';
      } catch (error) { showToast(error.message); }
    });

    app.querySelector('[data-create-order]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const result = await requestApi('/api/orders', { method: 'POST', body: { items: cart } });
        writeCart([]);
        window.location.hash = `#/pesanan/${encodeURIComponent(result.order.id)}`;
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });

    app.querySelector('[data-buy-reseller-plan]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const result = await requestApi('/api/orders', { method: 'POST', body: { kind: 'reseller-plan' } });
        window.location.hash = `#/pesanan/${encodeURIComponent(result.order.id)}`;
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });

    app.querySelector('[data-refresh-order]')?.addEventListener('click', () => { void render(); });
  }

  function adminAuthPage(setupRequired) {
    const title = setupRequired ? 'Siapkan akun admin' : 'Masuk admin';
    const formFields = setupRequired
      ? `<label>Kode setup<input name="code" type="password" autocomplete="off" required /></label><label>Email admin<input name="email" type="email" autocomplete="email" required /></label><label>Kata sandi baru<input name="password" type="password" autocomplete="new-password" minlength="12" required /><small>Minimal 12 karakter. Kata sandi disimpan sebagai hash di komputer ini.</small></label>`
      : `<label>Email admin<input name="email" type="email" autocomplete="username" required /></label><label>Kata sandi<input name="password" type="password" autocomplete="current-password" required /></label>`;
    return `<div class="admin-page"><header class="admin-auth-head"><a class="brand" href="#/">Bacshop</a><span>Admin</span></header><main class="admin-auth-card"><h1>${title}</h1><p>${setupRequired ? 'Masukkan kode sekali pakai yang dicetak server lokal, lalu buat kredensial admin.' : 'Katalog dan status stok hanya dapat diubah setelah masuk.'}</p><form class="admin-auth-form" data-admin-auth="${setupRequired ? 'setup' : 'login'}">${formFields}<p class="admin-form-message" data-admin-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">${setupRequired ? 'Buat akun admin' : 'Masuk'}</button></form><a class="admin-back-link" href="#/">Kembali ke toko</a></main></div>`;
  }

  function imageUploadField(label, value = '') {
    return `<label class="admin-wide">${label}<div class="admin-image-upload"><input data-image-target type="url" value="${escapeHtml(value)}" placeholder="Belum ada gambar" readonly /><input type="file" accept="image/png,image/jpeg,image/webp" data-image-upload /><small>PNG, JPEG, atau WebP · maksimal 5 MB</small></div></label>`;
  }

  function productFields(product, isNew = false) {
    const categoryOptions = CATEGORIES.map((category) => `<option value="${escapeHtml(category.slug)}" ${product.category === category.slug ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('');
    const termsText = Object.entries(product.terms || {}).map(([label,value]) => `${label}: ${value}`).join('\n');
    return `<form class="admin-product-form" data-product-form="${isNew ? '' : escapeHtml(product.id)}" ${isNew ? 'data-product-create' : ''}>
      <div class="admin-fields">${isNew ? '<label>ID produk<input name="id" pattern="[a-z0-9-]+" required maxlength="64" /></label>' : ''}
        <label>Nama produk<input name="name" value="${escapeHtml(product.name || '')}" required maxlength="180" /></label>
        <label>Slug URL<input name="slug" value="${escapeHtml(product.slug || '')}" required maxlength="180" /></label>
        <label>Kategori<select name="category" required>${categoryOptions}</select></label>
        <label>Harga retail (Rp)<input name="price" type="number" min="1" step="1000" value="${Number(product.price) || ''}" required /></label>
        <label>Harga reseller (Rp)<input name="resellerPrice" type="number" min="1" step="1000" value="${product.resellerPrice ?? ''}" /><small>Kosongkan bila produk belum memiliki harga reseller.</small></label>
        <label>Minimum bulk<input name="bulkMinimum" type="number" min="2" max="999" step="1" value="${product.bulkMinimum ?? ''}" /><small>Harga khusus terbuka permanen setelah pesanan lunas.</small></label>
        <label>Durasi<input name="duration" value="${escapeHtml(product.duration || '')}" required maxlength="180" /></label>
        <label>Cara pemenuhan<input name="fulfillment" value="${escapeHtml(product.fulfillment || '')}" required maxlength="180" /></label>
        <label>Tanggal produk<input name="createdAt" type="date" value="${escapeHtml(product.createdAt || new Date().toISOString().slice(0, 10))}" required /></label>
        <label>Status pesanan<select name="orderMode"><option value="ready" ${product.orderMode === 'ready' ? 'selected' : ''}>Bisa dipesan</option><option value="preorder" ${product.orderMode === 'preorder' ? 'selected' : ''}>Pre-order</option></select></label>
        <label class="admin-wide">Deskripsi<textarea name="description" rows="3" maxlength="2400" required>${escapeHtml(product.description || '')}</textarea></label>
        <label class="admin-wide">Ketentuan produk<textarea name="terms" rows="5" spellcheck="false">${escapeHtml(termsText)}</textarea><small>Satu ketentuan per baris, format: Nama: keterangan.</small></label>
        ${imageUploadField('Gambar produk', product.image || '')}
        <label class="admin-confirm-stock"><input name="preOrderConfirmed" type="checkbox" ${product.preOrderConfirmed ? 'checked' : ''} /><span><strong>Stok pre-order sudah dikonfirmasi</strong><small>Pemesanan dibuka setelah stok dipastikan.</small></span></label>
      </div><p class="admin-form-message" data-admin-message role="status" aria-live="polite"></p><div class="admin-form-actions"><button class="button button-primary" type="submit">${isNew ? 'Tambah produk' : 'Simpan perubahan'}</button>${isNew ? '' : `<button class="button button-danger" type="button" data-delete-product="${escapeHtml(product.id)}">Hapus produk</button>`}</div>
    </form>`;
  }

  function productEditor(product) {
    const statusLabel = product.orderMode === 'preorder' ? (product.preOrderConfirmed ? 'Pre-order · stok siap' : 'Pre-order · menunggu stok') : 'Bisa dipesan';
    return `<details class="admin-product-editor"><summary><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(statusLabel)} · ${rupiah(product.price)}</small></span><span class="admin-edit-label">Edit</span></summary>${productFields(product)}</details>`;
  }

  function cmsRow(kind, item, index) {
    const category = kind === 'category';
    const label = category ? 'Kategori' : kind === 'banner' ? 'Banner' : 'Promo';
    return `<fieldset class="admin-cms-row" data-cms-row="${kind}"><legend>${label} ${index + 1}</legend><input type="hidden" data-field="id" value="${escapeHtml(item.id || item.slug || `${kind}-${index + 1}`)}" />
      ${category ? `<label>Nama kategori<input data-field="name" value="${escapeHtml(item.name || '')}" required maxlength="80" /></label><label>Slug<input data-field="slug" value="${escapeHtml(item.slug || '')}" pattern="[a-z0-9-]+" required /></label>${imageUploadField('Gambar kategori', item.image || '')}` : `<label>Judul<input data-field="title" value="${escapeHtml(item.title || '')}" maxlength="120" /></label><label>Tujuan (contoh: #/kategori/semua)<input data-field="href" value="${escapeHtml(item.href || '#/kategori/semua')}" required /></label><label class="admin-wide">Keterangan<textarea data-field="description" rows="2" maxlength="300">${escapeHtml(item.description || '')}</textarea></label>${imageUploadField(`Gambar ${label.toLocaleLowerCase('id-ID')}`, item.image || '')}<label class="cms-active-field"><input type="checkbox" data-field="active" ${item.active ? 'checked' : ''} /><span>Tampilkan di toko</span></label>`}
      <button class="button button-small button-danger" type="button" data-remove-cms-row>Hapus ${label.toLocaleLowerCase('id-ID')}</button></fieldset>`;
  }

  function renderAdminCms(storefront) {
    return `<form class="admin-cms-form" data-storefront-form><section class="admin-section"><div class="admin-section-heading"><h2>Kategori</h2><button class="button button-small" type="button" data-add-cms-row="category">Tambah kategori</button></div><div class="admin-cms-grid" data-cms-list="category">${storefront.categories.map((item, index) => cmsRow('category', item, index)).join('')}</div></section>
      <section class="admin-section"><div class="admin-section-heading"><h2>Banner Beranda</h2><button class="button button-small" type="button" data-add-cms-row="banner">Tambah banner</button></div><div class="admin-cms-grid" data-cms-list="banner">${storefront.banners.map((item, index) => cmsRow('banner', item, index)).join('')}</div></section>
      <section class="admin-section"><div class="admin-section-heading"><h2>Promo</h2><button class="button button-small" type="button" data-add-cms-row="promotion">Tambah promo</button></div><div class="admin-cms-grid" data-cms-list="promotion">${storefront.promotions.map((item, index) => cmsRow('promotion', item, index)).join('')}</div></section>
      <section class="admin-section"><div class="admin-section-heading"><h2>Paket reseller</h2></div><div class="admin-fields"><label>Harga paket (Rp)<input name="resellerPlanPrice" type="number" min="149000" step="1000" value="${Number(storefront.resellerPlan.price)}" required /></label><label class="admin-wide">Syarat dan ketentuan<textarea name="resellerPlanTerms" rows="4" maxlength="5000" required>${escapeHtml(storefront.resellerPlan.terms)}</textarea></label></div></section>
      <section class="admin-section" data-payment-settings><div class="admin-section-heading"><h2>Pembayaran QRIS statis</h2></div><div class="admin-fields">${imageUploadField('Gambar QRIS DANA Bisnis', storefront.payment.qrisImage || '')}<label class="admin-wide">Petunjuk pembayaran<textarea name="paymentInstructions" rows="3" maxlength="1000" required>${escapeHtml(storefront.payment.instructions)}</textarea></label></div></section>
      <p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan konten</button></form>`;
  }

  function adminTabs(path) {
    return `<nav class="admin-tabs" aria-label="Menu admin"><a href="#/admin" ${path === '/admin' ? 'aria-current="page"' : ''}>Ringkasan</a><a href="#/admin/produk" ${path === '/admin/produk' ? 'aria-current="page"' : ''}>Produk</a><a href="#/admin/konten" ${path === '/admin/konten' ? 'aria-current="page"' : ''}>Konten toko</a><a href="#/admin/pesanan" ${path === '/admin/pesanan' ? 'aria-current="page"' : ''}>Pesanan</a></nav>`;
  }

  function adminOrderCard(order) {
    return `<article class="admin-order-card"><div class="admin-order-head"><div><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.customer?.name || 'Akun tidak tersedia')} · ${escapeHtml(order.customer?.email || '')}</span></div><strong>${rupiah(order.total)}</strong></div><p>${order.kind === 'reseller-plan' ? 'Paket reseller' : order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join(', ')}</p><div class="admin-order-status"><span class="status-pill">Pembayaran: ${escapeHtml(order.paymentStatus)}</span><span class="status-pill">Pemenuhan: ${escapeHtml(order.fulfillmentStatus)}</span></div>${order.paymentStatus === 'pending' ? `<form class="admin-verify-form" data-confirm-payment="${escapeHtml(order.id)}"><label>Referensi transaksi DANA<input name="transactionReference" minlength="3" maxlength="120" required placeholder="Cocokkan dengan transaksi DANA Bisnis" /></label><button class="button button-primary" type="submit">Konfirmasi pembayaran</button></form>` : order.paymentVerification ? `<p class="admin-verified-note">Diverifikasi ${new Date(order.paymentVerification.verifiedAt).toLocaleString('id-ID')} · ${escapeHtml(order.paymentVerification.transactionReference)}</p>` : ''}${order.paymentStatus === 'paid' ? `<form class="admin-fulfillment-form" data-update-fulfillment="${escapeHtml(order.id)}"><label>Status pemenuhan<select name="status"><option value="not_started" ${order.fulfillmentStatus === 'not_started' ? 'selected' : ''}>Belum dimulai</option><option value="processing" ${order.fulfillmentStatus === 'processing' ? 'selected' : ''}>Diproses</option><option value="needs_customer_input" ${order.fulfillmentStatus === 'needs_customer_input' ? 'selected' : ''}>Menunggu data pelanggan</option><option value="fulfilled" ${order.fulfillmentStatus === 'fulfilled' ? 'selected' : ''}>Selesai</option></select></label><label>Catatan pemenuhan<input name="note" maxlength="1000" value="${escapeHtml(order.fulfillmentNote || '')}" /></label><button class="button button-small" type="submit">Simpan status</button></form>` : ''}</article>`;
  }

  async function renderAdminPage(path) {
    const session = await requestApi('/api/admin/session');
    if (!session.authenticated) return adminAuthPage(session.setupRequired);
    const [productResult, storefront, orderResult] = await Promise.all([
      requestApi('/api/admin/products'), requestApi('/api/admin/storefront'), requestApi('/api/admin/orders'),
    ]);
    let content;
    if (path === '/admin/produk') content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Produk</h1><p>Atur detail, harga, stok, dan akses reseller per produk.</p></div><span>${productResult.products.length} produk</span></div><details class="admin-product-editor admin-create-product"><summary><span><strong>Tambah produk</strong><small>Buat produk baru di katalog.</small></span><span class="admin-edit-label">Tambah</span></summary>${productFields({ category: CATEGORIES[0]?.slug, orderMode: 'ready', preOrderConfirmed: true, terms: {} }, true)}</details><div class="admin-product-list">${productResult.products.map(productEditor).join('') || '<p class="admin-empty">Belum ada produk. Tambahkan produk pertama.</p>'}</div></section>`;
    else if (path === '/admin/konten') content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Konten toko</h1><p>Kelola kategori, banner, promo, gambar QRIS, dan paket reseller.</p></div></div>${renderAdminCms(storefront)}</section>`;
    else if (path === '/admin/pesanan') content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Pesanan</h1><p>Verifikasi pembayaran QRIS dan perbarui pemenuhan secara terpisah.</p></div><span>${orderResult.orders.length} pesanan</span></div><div class="admin-order-list">${orderResult.orders.map(adminOrderCard).join('') || '<p class="admin-empty">Belum ada pesanan masuk.</p>'}</div></section>`;
    else {
      const pending = orderResult.orders.filter((order) => order.paymentStatus === 'pending').length;
      const paid = orderResult.orders.filter((order) => order.paymentStatus === 'paid').length;
      content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Ringkasan toko</h1><p>Kelola katalog, konten, dan pesanan Bacshop.</p></div></div><div class="admin-metrics"><a href="#/admin/produk"><span>Produk</span><strong>${productResult.products.length}</strong></a><a href="#/admin/pesanan"><span>Menunggu pembayaran</span><strong>${pending}</strong></a><a href="#/admin/pesanan"><span>Pembayaran terverifikasi</span><strong>${paid}</strong></a></div><div class="admin-shortcuts"><a class="button button-primary" href="#/admin/produk">Kelola produk</a><a class="button" href="#/admin/konten">Atur konten toko</a><a class="button" href="#/admin/pesanan">Periksa pesanan</a></div>${pending ? `<h2>Menunggu verifikasi</h2><div class="admin-order-list">${orderResult.orders.filter((order) => order.paymentStatus === 'pending').slice(0, 5).map(adminOrderCard).join('')}</div>` : ''}</section>`;
    }
    return `<div class="admin-page"><header class="admin-app-head"><a class="brand" href="#/">Bacshop</a><span>Admin</span><div><span>${escapeHtml(session.email)}</span><button class="button button-small" type="button" data-admin-logout>Keluar</button></div></header><main class="admin-products">${adminTabs(path)}${content}</main></div>`;
  }

  function termsFromTextarea(value) {
    return Object.fromEntries(value.split('\n').map((line) => {
      const separator = line.indexOf(':');
      return separator < 0 ? null : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }).filter((pair) => pair && pair[0]));
  }

  function readCmsRows(form, kind) {
    return [...form.querySelectorAll(`[data-cms-row="${kind}"]`)].map((row) => {
      const value = (field) => row.querySelector(`[data-field="${field}"]`);
      if (kind === 'category') return { id: value('id').value, slug: value('slug').value.trim(), name: value('name').value.trim(), image: row.querySelector('[data-image-target]').value };
      return { id: value('id').value, title: value('title').value.trim(), description: value('description').value.trim(), href: value('href').value.trim(), image: row.querySelector('[data-image-target]').value, active: value('active').checked };
    });
  }

  function bindAdminEvents() {
    app.querySelectorAll('[data-admin-auth]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('[data-admin-message]');
      const fields = new FormData(form);
      const body = Object.fromEntries(fields.entries());
      try {
        await requestApi(`/api/admin/${form.dataset.adminAuth}`, { method: 'POST', body });
        await render();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    }));
    app.querySelector('[data-admin-logout]')?.addEventListener('click', async () => {
      try { await requestApi('/api/admin/logout', { method: 'POST', body: {} }); await render(); }
      catch (error) { showToast(error.message); }
    });
    app.querySelectorAll('[data-image-upload]').forEach((input) => input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const message = input.closest('form')?.querySelector('[data-admin-message], [data-cms-message]');
      try {
        const result = await requestApi('/api/admin/uploads', { method: 'POST', body: await filePayload(file) });
        input.closest('.admin-image-upload')?.querySelector('[data-image-target]')?.setAttribute('value', result.imageUrl);
        const target = input.closest('.admin-image-upload')?.querySelector('[data-image-target]');
        if (target) target.value = result.imageUrl;
        if (message) { message.textContent = 'Gambar sudah diunggah. Simpan formulir untuk menerapkan perubahan.'; message.classList.remove('is-error'); }
      } catch (error) {
        if (message) { message.textContent = error.message; message.classList.add('is-error'); }
      }
    }));

    app.querySelectorAll('[data-product-form]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('[data-admin-message]');
      const fields = new FormData(form);
      const product = Object.fromEntries(fields.entries());
      const isCreate = form.hasAttribute('data-product-create');
      product.id = isCreate ? fields.get('id') : form.dataset.productForm;
      product.price = Number(product.price);
      product.sold = Number(product.sold) || 0;
      product.rating = 0;
      product.resellerPrice = product.resellerPrice === '' ? null : Number(product.resellerPrice);
      product.bulkMinimum = product.resellerPrice === null ? null : Number(product.bulkMinimum);
      product.image = form.querySelector('[data-image-target]')?.value || '';
      product.preOrderConfirmed = fields.has('preOrderConfirmed');
      if (product.orderMode === 'ready') product.preOrderConfirmed = true;
      product.terms = termsFromTextarea(product.terms || '');
      try {
        const result = await requestApi(isCreate ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.id)}`, { method: isCreate ? 'POST' : 'PUT', body: { product } });
        PRODUCTS = isCreate ? [...PRODUCTS, result.product] : PRODUCTS.map((item) => item.id === result.product.id ? result.product : item);
        if (result.product.orderMode === 'preorder' && !result.product.preOrderConfirmed) writeCart(cart.filter((item) => item.id !== result.product.id));
        message.textContent = isCreate ? 'Produk berhasil ditambahkan.' : 'Perubahan tersimpan.';
        message.classList.remove('is-error');
        if (isCreate) await render();
        else {
          form.closest('.admin-product-editor').querySelector('summary strong').textContent = result.product.name;
          form.closest('.admin-product-editor').querySelector('summary small').textContent = `${result.product.orderMode === 'preorder' ? (result.product.preOrderConfirmed ? 'Pre-order · stok siap' : 'Pre-order · menunggu stok') : 'Bisa dipesan'} · ${rupiah(result.product.price)}`;
        }
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    }));

    app.querySelectorAll('[data-delete-product]').forEach((button) => button.addEventListener('click', async () => {
      const id = button.dataset.deleteProduct;
      if (!window.confirm('Hapus produk ini dari katalog?')) return;
      try { await requestApi(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE', body: {} }); await render(); }
      catch (error) { const message = button.closest('form')?.querySelector('[data-admin-message]'); if (message) { message.textContent = error.message; message.classList.add('is-error'); } }
    }));

    app.querySelectorAll('[data-add-cms-row]').forEach((button) => button.addEventListener('click', () => {
      const kind = button.dataset.addCmsRow;
      const list = app.querySelector(`[data-cms-list="${kind}"]`);
      const item = kind === 'category' ? { id: '', slug: '', name: '', image: '' } : { id: '', title: '', description: '', href: '#/kategori/semua', image: '', active: true };
      if (list) list.insertAdjacentHTML('beforeend', cmsRow(kind, item, list.children.length));
      const row = list?.lastElementChild;
      row?.querySelector('[data-remove-cms-row]')?.addEventListener('click', () => row.remove());
      row?.querySelector('[data-image-upload]')?.addEventListener('change', async (event) => {
        const input = event.currentTarget;
        try {
          const result = await requestApi('/api/admin/uploads', { method: 'POST', body: await filePayload(input.files?.[0]) });
          const target = input.closest('.admin-image-upload')?.querySelector('[data-image-target]');
          if (target) target.value = result.imageUrl;
        } catch (error) { showToast(error.message); }
      });
    }));
    app.querySelectorAll('[data-remove-cms-row]').forEach((button) => button.addEventListener('click', () => button.closest('[data-cms-row]')?.remove()));

    app.querySelector('[data-storefront-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = form.querySelector('[data-cms-message]');
      const fields = new FormData(form);
      const storefront = {
        ...STOREFRONT,
        categories: readCmsRows(form, 'category'),
        banners: readCmsRows(form, 'banner'),
        promotions: readCmsRows(form, 'promotion'),
        resellerPlan: { price: Number(fields.get('resellerPlanPrice')), terms: fields.get('resellerPlanTerms') },
        payment: { qrisImage: form.querySelector('[data-payment-settings] [data-image-target]')?.value || '', instructions: fields.get('paymentInstructions') },
      };
      try {
        STOREFRONT = await requestApi('/api/admin/storefront', { method: 'PUT', body: { storefront } });
        CATEGORIES = STOREFRONT.categories;
        message.textContent = 'Konten toko tersimpan.';
        message.classList.remove('is-error');
      } catch (error) { message.textContent = error.message; message.classList.add('is-error'); }
    });

    app.querySelectorAll('[data-confirm-payment]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fields = new FormData(form);
      try {
        await requestApi(`/api/admin/orders/${encodeURIComponent(form.dataset.confirmPayment)}/confirm-payment`, { method: 'POST', body: { transactionReference: fields.get('transactionReference') } });
        await render();
      } catch (error) { showToast(error.message); }
    }));
    app.querySelectorAll('[data-update-fulfillment]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fields = new FormData(form);
      try {
        await requestApi(`/api/admin/orders/${encodeURIComponent(form.dataset.updateFulfillment)}/fulfillment`, { method: 'POST', body: { status: fields.get('status'), note: fields.get('note') } });
        await render();
      } catch (error) { showToast(error.message); }
    }));
  }

  const SAMPLE_ORDERS = [
    { id: 'BC-260923-0012', name: 'AI Studio Plus', date: '23 Sep 2026', status: 'Menunggu aktivasi', statusTone: 'warning', detail: 'Panduan aktivasi tersedia setelah pesanan diproses.' },
    { id: 'BC-260914-0008', name: 'Stream Screen Premium', date: '14 Sep 2026', status: 'Selesai', statusTone: 'success', detail: 'Contoh pesanan selesai. Kode dan petunjuk aktivasi ada di detail pesanan.' },
    { id: 'BC-260909-0003', name: 'Design Kit Pro', date: '09 Sep 2026', status: 'Membutuhkan data tambahan', statusTone: 'danger', detail: 'Periksa kembali email akun yang akan menerima undangan aktivasi.' },
  ];
  const SAMPLE_ENTITLEMENTS = [
    { name: 'Stream Screen Premium', expires: '14 Okt 2026', state: 'Aktif', tone: 'success' },
    { name: 'Design Kit Pro', expires: '02 Okt 2026', state: 'Segera berakhir', tone: 'warning' },
  ];
  const RESELLER_PRICE_EXAMPLES = { 'ai-studio-plus': 75000, 'stream-screen': 49000, 'design-kit-pro': 60000, 'sound-wave': 41000, 'office-cloud': 84000, 'cut-studio': 55000, 'voucher-play': 47000, 'learn-focus': 66000 };
  const SAMPLE_RESELLER_ORDERS = [
    { id: 'RS-260923-004', customer: 'Nabila', item: 'AI Studio Plus', date: '23 Sep 2026', status: 'Diproses', tone: 'warning' },
    { id: 'RS-260920-002', customer: 'Raka', item: 'Design Kit Pro', date: '20 Sep 2026', status: 'Selesai', tone: 'success' },
  ];
  const SAMPLE_RESELLER_CUSTOMERS = [
    { name: 'Nabila Putri', product: 'AI Studio Plus', expires: '23 Okt 2026', status: 'Aktif', tone: 'success' },
    { name: 'Raka Pratama', product: 'Design Kit Pro', expires: '02 Okt 2026', status: 'Segera berakhir', tone: 'warning' },
    { name: 'Dimas A.', product: 'Sound Wave Premium', expires: '18 Sep 2026', status: 'Perlu tindak lanjut', tone: 'danger' },
  ];
  const ADMIN_PAGES = {
    '/preview/admin/catalog': { title: 'Katalog & harga retail', columns: ['Produk', 'Kategori', 'Harga retail contoh', 'Status'], rows: PRODUCTS.map((product) => [product.name, CATEGORIES.find((item) => item.slug === product.category)?.name || '', rupiah(product.price), 'Contoh']) },
    '/preview/admin/orders': { title: 'Pesanan', columns: ['ID pesanan', 'Pelanggan', 'Produk', 'Status'], rows: [['BC-260923-0012', 'Nabila', 'AI Studio Plus', 'Menunggu aktivasi'], ['BC-260914-0008', 'Raka', 'Stream Screen Premium', 'Selesai']] },
    '/preview/admin/resellers': { title: 'Program reseller', columns: ['Reseller', 'Status demo', 'Pengajuan', 'Tindakan'], rows: [['Demo Reseller A', 'Menunggu review', '24 Sep 2026', 'Periksa'], ['Demo Reseller B', 'Aktif', '18 Sep 2026', 'Lihat']] },
    '/preview/admin/promotions': { title: 'Promo & konten', columns: ['Nama', 'Periode', 'Status', 'Tindakan'], rows: [['Promo contoh digital', 'Belum ditentukan', 'Draft', 'Preview'], ['Informasi reseller', 'Tanpa periode', 'Draft', 'Preview']] },
    '/preview/admin/support': { title: 'Antrean bantuan', columns: ['Tiket contoh', 'Pelanggan', 'Topik', 'Status'], rows: [['TCK-1002', 'Nabila', 'Panduan aktivasi', 'Menunggu'], ['TCK-0998', 'Raka', 'Status pesanan', 'Diproses']] },
    '/preview/admin/audit': { title: 'Log audit contoh', columns: ['Waktu contoh', 'Pelaku demo', 'Perubahan', 'Referensi'], rows: [['24 Sep 2026 09:15', 'Admin Demo', 'Perubahan katalog contoh', 'SKU-001'], ['23 Sep 2026 16:40', 'Admin Demo', 'Status reseller contoh', 'RSL-002']] },
  };

  function roleNavigation(role, path) {
    const nav = role === 'customer'
      ? [['/preview/customer','Dashboard'],['/preview/customer/store','Belanja'],['/preview/customer/orders','Pesanan'],['/preview/customer/entitlements','Langganan'],['/preview/customer/support','Bantuan'],['/preview/customer/reseller','Program reseller'],['/preview/customer/account','Akun']]
      : role === 'reseller'
        ? [['/preview/reseller','Dashboard'],['/preview/reseller/buy','Beli'],['/preview/reseller/orders','Pesanan'],['/preview/reseller/customers','Pelanggan'],['/preview/reseller/balance','Akun & saldo']]
        : [['/preview/admin','Ringkasan'],['/preview/admin/catalog','Katalog'],['/preview/admin/orders','Pesanan'],['/preview/admin/resellers','Reseller'],['/preview/admin/promotions','Promo'],['/preview/admin/support','Support'],['/preview/admin/audit','Audit']];
    return nav.map(([href,label]) => `<a class="role-nav-link ${path === href ? 'active' : ''}" href="#${href}"${path === href ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  }

  function roleTitle(role) { return role === 'customer' ? 'Preview pelanggan' : role === 'reseller' ? 'Preview Reseller Center' : 'Preview Admin Center'; }

  function roleMobileIcon(label) {
    const iconByLabel = { Beranda: 'home', Dashboard: 'home', Ringkasan: 'home', Belanja: 'grid', Katalog: 'grid', Beli: 'shopping-cart', Pesanan: 'shopping-cart', Promo: 'tag', Pelanggan: 'user', Akun: 'user', Support: 'help-circle' };
    return feather(iconByLabel[label] || 'grid', 'role-mobile-icon');
  }

  function roleShell(role, path, content) {
    const mobileNav = role === 'customer'
      ? [['/preview/customer','Beranda'],['/preview/customer/store','Belanja'],['/preview/customer/promotions','Promo'],['/preview/customer/orders','Pesanan'],['/preview/customer/account','Akun']]
      : role === 'reseller'
        ? [['/preview/reseller','Dashboard'],['/preview/reseller/buy','Beli'],['/preview/reseller/orders','Pesanan'],['/preview/reseller/customers','Pelanggan'],['/preview/reseller/balance','Akun']]
        : [['/preview/admin','Ringkasan'],['/preview/admin/catalog','Katalog'],['/preview/admin/orders','Pesanan'],['/preview/admin/support','Support']];
    const mobileClass = role === 'admin' ? ' role-mobile-admin' : '';
    return `<div class="role-app role-${role}"><div class="role-preview-banner"><span>Preview · data contoh</span><a href="#/">Kembali ke toko</a></div><header class="role-topbar"><a class="brand" href="#/preview/${role}">Bacshop</a><div class="role-context">${roleTitle(role)}</div><a class="role-exit" href="#/" data-exit-preview>Keluar</a></header><div class="role-layout"><aside class="role-sidebar"><nav aria-label="Navigasi ${roleTitle(role)}">${roleNavigation(role,path)}</nav></aside><main class="role-main" id="main" tabindex="-1">${content}</main></div><nav class="role-mobile-nav${mobileClass}" aria-label="Navigasi ${roleTitle(role)}">${mobileNav.map(([href,label]) => `<a href="#${href}" ${(path === href || (href !== `/preview/${role}` && path.startsWith(`${href}/`))) ? 'aria-current="page"' : ''}>${roleMobileIcon(label)}<span class="role-mobile-label">${label}</span></a>`).join('')}</nav></div>`;
  }

  function rolePageHead(eyebrow, title, description, action = '') {
    return `<div class="role-page-head"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action}</div>`;
  }

  function statusTag(label, tone = 'neutral') { return `<span class="status-tag tone-${tone}">${escapeHtml(label)}</span>`; }

  function renderCustomer(path) {
    if (path === '/preview/customer') {
      return `${rolePageHead('AKUN PELANGGAN · DATA CONTOH','Halo, Naya','Ringkasan pesanan, akses produk digital, dan bantuan. Semua informasi di halaman ini adalah contoh.', '<a class="button button-primary button-small" href="#/preview/customer/orders">Lihat pesanan</a>')}
        <div class="metric-grid customer-metrics"><article class="metric-card"><small>Pesanan contoh</small><strong>3</strong><span>Aktif, selesai, dan perlu data</span></article><article class="metric-card"><small>Langganan aktif</small><strong>2</strong><span>Contoh akses produk digital</span></article><article class="metric-card"><small>Segera berakhir</small><strong>1</strong><span>Periksa tanggal perpanjangan</span></article></div>
        <section class="role-section"><div class="role-section-head"><div><h2>Pesanan terbaru</h2><p>Detail status pembayaran dan pemenuhan dipisahkan.</p></div><a href="#/preview/customer/orders" class="text-link">Semua pesanan →</a></div>${customerOrderRows(SAMPLE_ORDERS)}</section>
        <section class="role-section"><div class="role-section-head"><div><h2>Program reseller</h2><p>Status pengajuan contoh, terpisah dari belanja retail.</p></div><a href="#/preview/customer/reseller" class="text-link">Lihat status →</a></div><div class="role-info-note">Pengajuan reseller · Menunggu review · data ilustrasi</div></section>
        <section class="role-section"><div class="role-section-head"><div><h2>Akses produk</h2><p>Contoh langganan dan tanggal berakhir.</p></div><a href="#/preview/customer/entitlements" class="text-link">Lihat akses →</a></div>${entitlementRows(SAMPLE_ENTITLEMENTS.slice(0,1))}</section>`;
    }
    if (path === '/preview/customer/store') {
      const items = PRODUCTS.slice(0,4).map((product) => `<article class="role-store-card"><div class="role-product-placeholder" role="img" aria-label="Placeholder gambar produk ${escapeHtml(product.name)}"></div><div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.duration)} · ${escapeHtml(product.fulfillment)}</span><b>${rupiah(product.price)}</b><span>Harga retail contoh</span></div><button class="button button-small" type="button" data-preview-action="Keranjang belum terhubung">Pilih</button></article>`).join('');
      return `${rolePageHead('TOKO RETAIL · PREVIEW PELANGGAN','Belanja produk digital','Harga tetap retail pada toko pelanggan. Harga reseller hanya tersedia setelah akses disetujui dan konteks Reseller Center dipilih.')}
        <div class="role-info-note">Ini katalog ilustrasi. Menambahkan produk ke keranjang atau membuat pesanan belum terhubung.</div><div class="role-store-grid">${items}</div>`;
    }
    if (path === '/preview/customer/promotions') return `${rolePageHead('','Promo','Belum ada promo yang tersedia.')}
      <div class="role-empty"><p>Promo akan ditampilkan setelah periode dan ketentuannya ditetapkan.</p><a class="text-link" href="#/preview/customer/store">Lihat katalog ${feather('arrow-right')}</a></div>`;
    if (path === '/preview/customer/account') return `${rolePageHead('AKUN PELANGGAN · PREVIEW','Akun Naya','Identitas dan preferensi pada halaman ini adalah contoh. Form profil belum menyimpan perubahan.')}
      <div class="role-columns"><section class="role-panel"><h2>Profil contoh</h2><div class="role-profile-fields"><div><small>Nama</small><strong>Naya Demo</strong></div><div><small>Email</small><strong>naya@example.test</strong></div><div><small>Status akun</small><strong>Pelanggan</strong></div></div><button class="button button-small" type="button" data-preview-action="Perubahan profil tidak disimpan">Ubah profil</button></section><section class="role-panel"><h2>Program reseller</h2><p class="role-muted">Status pengajuan contoh: menunggu review. Harga retail tetap berlaku.</p><a class="button button-small" href="#/preview/customer/reseller">Lihat status pengajuan</a></section></div>`;
    if (path === '/preview/customer/orders' || path.startsWith('/preview/customer/orders/')) {
      const selected = path.split('/')[4];
      if (selected) {
        const order = SAMPLE_ORDERS.find((item) => item.id.toLowerCase() === selected.toLowerCase());
        if (!order) return roleEmpty('Pesanan tidak ditemukan','Pilih pesanan dari daftar contoh.','/preview/customer/orders');
        const recovery = order.status === 'Membutuhkan data tambahan' ? `<div class="role-info-note">${escapeHtml(order.detail)} Form pembaruan hanya simulasi dan tidak mengirim data.</div><button class="button button-primary button-small" type="button" data-preview-action="Pembaruan data pesanan tidak disimpan">Periksa data pesanan</button>` : '';
        const renew = order.status === 'Selesai' ? '<a class="button button-primary button-small" href="#/produk/stream-screen">Beli lagi</a>' : '';
        return `${rolePageHead('PESANAN CONTOH',order.id,'Status pembayaran dan status pemenuhan adalah dua informasi yang berbeda.','<a class="button button-small" href="#/preview/customer/orders">Kembali ke pesanan</a>')}<div class="role-columns"><section class="role-panel"><h2>${escapeHtml(order.name)}</h2><p class="role-muted">Dibuat ${escapeHtml(order.date)} · total harga contoh ${rupiah(PRODUCTS.find((product) => product.name === order.name)?.price || 0)}</p><div class="order-timeline"><div class="timeline-step done"><span></span><div><strong>Pesanan dibuat</strong><small>${escapeHtml(order.date)}</small></div></div><div class="timeline-step ${order.statusTone === 'success' ? 'done' : 'current'}"><span></span><div><strong>${escapeHtml(order.status)}</strong><small>${escapeHtml(order.detail)}</small></div></div></div>${recovery}${renew}</section><aside class="role-panel"><h2>Butuh bantuan?</h2><p class="role-muted">Hubungi bantuan dengan referensi pesanan ini. Fitur kontak belum terhubung.</p><a class="button button-primary button-small" href="#/preview/customer/support">Buka bantuan</a></aside></div>`;
      }
      return `${rolePageHead('AKUN PELANGGAN','Pesanan saya','Lihat status pembayaran, pemenuhan, dan petunjuk aktivasi dari pesanan contoh.')}${customerOrderRows(SAMPLE_ORDERS)}`;
    }
    if (path === '/preview/customer/reseller') return `${rolePageHead('AKUN PELANGGAN','Program reseller','Pengajuan tidak mengubah harga retail. Harga khusus hanya tampil pada Reseller Center setelah akses reseller disetujui dan dibuka secara terpisah.')}
      <div class="role-columns"><section class="role-panel"><h2>Menunggu review</h2><p class="role-muted">Status contoh. Akses harga dan alat reseller belum tersedia untuk status ini.</p><button class="button button-primary button-small" type="button" data-preview-action="Pengajuan tidak disimpan">Simulasikan pengajuan</button></section><section class="role-panel"><h2>Status program</h2><div class="role-status-list"><div><strong>Belum mengajukan</strong>${statusTag('Belum diajukan')}</div><div><strong>Menunggu review</strong>${statusTag('Menunggu review','warning')}</div><div><strong>Disetujui</strong>${statusTag('Disetujui','success')}</div><div><strong>Ditolak</strong>${statusTag('Ditolak','danger')}</div><div><strong>Ditangguhkan</strong>${statusTag('Ditangguhkan','danger')}</div></div><a class="button button-small" href="#/program-reseller">Program reseller</a></section></div>`;
    if (path === '/preview/customer/entitlements') return `${rolePageHead('AKUN PELANGGAN','Langganan & akses','Contoh akses yang terhubung ke pesanan selesai. Perpanjangan memerlukan konfirmasi sebelum pembayaran.')}${entitlementRows(SAMPLE_ENTITLEMENTS)}<div class="role-info-note">Tanggal dan status pada halaman ini hanyalah data contoh untuk preview.</div>`;
    if (path === '/preview/customer/support') return `${rolePageHead('AKUN PELANGGAN','Bantuan pesanan','Pilih pesanan atau baca panduan aktivasi. Alur dukungan belum mengirim pesan.')}
      <div class="role-columns"><section class="role-panel"><h2>Pilih pesanan</h2>${SAMPLE_ORDERS.map((order) => `<a class="support-order-link" href="#/preview/customer/orders/${order.id.toLowerCase()}"><span><strong>${escapeHtml(order.name)}</strong><small>${escapeHtml(order.id)} · ${escapeHtml(order.status)}</small></span><span aria-hidden="true">→</span></a>`).join('')}</section><section class="role-panel"><h2>Panduan singkat</h2><details><summary>Di mana petunjuk aktivasi?</summary><p>Petunjuk aktivasi contoh tersedia di detail pesanan yang sudah diproses.</p></details><details><summary>Apa arti status diproses?</summary><p>Pembayaran dan pemenuhan produk adalah status berbeda. Status ini perlu ditampilkan secara terpisah.</p></details><a class="button button-small" href="#/faq">Buka FAQ publik</a></section></div>`;
    return roleEmpty('Halaman akun tidak tersedia','Kembali ke dashboard pelanggan.','/preview/customer');
  }

  function customerOrderRows(orders) {
    return `<div class="role-list">${orders.map((order) => `<a class="role-list-row" href="#/preview/customer/orders/${order.id.toLowerCase()}"><span class="role-list-main"><strong>${escapeHtml(order.name)}</strong><span>${escapeHtml(order.id)} · ${escapeHtml(order.date)}</span></span><span class="role-list-status">${statusTag(order.status,order.statusTone)}</span></a>`).join('')}</div>`;
  }

  function entitlementRows(items) {
    return `<div class="role-list">${items.map((item) => `<div class="role-list-row"><span class="role-list-main"><strong>${escapeHtml(item.name)}</strong><span>Akses sampai ${escapeHtml(item.expires)}</span></span><span class="role-list-status">${statusTag(item.state,item.tone)}</span></div>`).join('')}</div>`;
  }

  function renderReseller(path) {
    if (path === '/preview/reseller') return `${rolePageHead('RESELLER CENTER · DATA CONTOH','Dashboard reseller','Pantau pesanan dan masa aktif pelanggan. Seluruh saldo, harga, dan data pada layar ini hanya contoh.','<a class="button button-primary button-small" href="#/preview/reseller/buy">Beli untuk pelanggan</a>')}
      <div class="metric-grid"><article class="metric-card"><small>Pelanggan contoh</small><strong>12</strong><span>Data ilustrasi</span></article><article class="metric-card"><small>Pesanan bulan ini</small><strong>8</strong><span>Data ilustrasi</span></article><article class="metric-card metric-attention"><small>Perlu tindak lanjut</small><strong>2</strong><span>Contoh akses segera berakhir</span></article><article class="metric-card metric-balance"><small>Saldo demo</small><strong>${rupiah(1200000)}</strong><span>Saldo bukan uang sungguhan</span></article></div>
      <div class="role-columns role-section"><section class="role-panel"><div class="role-section-head"><div><h2>Masa aktif pelanggan</h2><p>Contoh pengingat untuk tindak lanjut.</p></div><a class="text-link" href="#/preview/reseller/customers">Semua pelanggan →</a></div>${resellerCustomerRows(SAMPLE_RESELLER_CUSTOMERS.slice(0,2))}</section><section class="role-panel"><div class="role-section-head"><div><h2>Pesanan terbaru</h2><p>Status contoh pemenuhan.</p></div><a class="text-link" href="#/preview/reseller/orders">Semua pesanan →</a></div>${resellerOrderRows(SAMPLE_RESELLER_ORDERS.slice(0,2))}</section></div>`;
    if (path === '/preview/reseller/buy') {
      const rows = PRODUCTS.slice(0,6).map((product) => {
        const resellerPrice = RESELLER_PRICE_EXAMPLES[product.id];
        return `<article class="reseller-product"><div class="role-product-placeholder" role="img" aria-label="Placeholder gambar produk ${escapeHtml(product.name)}"></div><div class="reseller-product-main"><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.duration)} · ${escapeHtml(product.fulfillment)}</span><span>Retail contoh ${rupiah(product.price)}</span></div><div class="reseller-price"><span>Reseller contoh</span><strong>${rupiah(resellerPrice)}</strong><span>Selisih ${rupiah(product.price-resellerPrice)}</span></div><button class="button button-primary button-small" type="button" data-preview-action="Pembuatan pesanan belum terhubung">Pilih</button></article>`;
      }).join('');
      return `${rolePageHead('RESELLER CENTER','Beli produk','Harga berikut adalah angka ilustrasi, bukan harga program sebenarnya. Pilih pelanggan sebelum menyiapkan pesanan.')}
        <form class="role-panel reseller-order-form" data-preview-form><label for="reseller-customer">Pelanggan tujuan</label><input id="reseller-customer" name="customer" placeholder="Nama atau nomor pelanggan (contoh)" required /><label for="reseller-note">Catatan (opsional)</label><input id="reseller-note" name="note" placeholder="Contoh: langganan bulanan" /><p class="role-info-note">Jangan masukkan data pelanggan asli. Form ini hanya demonstrasi dan tidak disimpan.</p>${rows}</form>`;
    }
    if (path === '/preview/reseller/orders') return `${rolePageHead('RESELLER CENTER','Pesanan reseller','Contoh pesanan pelanggan dengan status pemenuhan yang berbeda.')}${resellerOrderRows(SAMPLE_RESELLER_ORDERS)}`;
    if (path === '/preview/reseller/customers') return `${rolePageHead('RESELLER CENTER','Pelanggan','Daftar ilustrasi untuk memantau produk dan masa aktif. Data pelanggan nyata belum tersedia.')}${resellerCustomerRows(SAMPLE_RESELLER_CUSTOMERS)}`;
    if (path === '/preview/reseller/balance') return `${rolePageHead('RESELLER CENTER','Saldo & aktivitas','Saldo demo menggunakan contoh data. Isi ulang dan mutasi uang belum tersedia.')}
      <div class="balance-hero"><div><span>Saldo contoh</span><strong>${rupiah(1200000)}</strong></div><button class="button" type="button" data-preview-action="Isi ulang belum terhubung">Isi saldo</button></div><section class="role-section"><div class="role-section-head"><h2>Riwayat saldo</h2></div><div class="role-list"><div class="role-list-row"><span class="role-list-main"><strong>Kredit contoh</strong><span>22 Sep 2026 · Penyesuaian</span></span><strong class="ledger-credit">+ ${rupiah(500000)}</strong></div><div class="role-list-row"><span class="role-list-main"><strong>Debit contoh</strong><span>20 Sep 2026 · Pesanan RS-260920-002</span></span><strong class="ledger-debit">− ${rupiah(60000)}</strong></div></div></section>`;
    return roleEmpty('Status reseller contoh','Pengajuan dan persetujuan belum terhubung.','/program-reseller');
  }

  function resellerOrderRows(rows) {
    return `<div class="role-list">${rows.map((order) => `<div class="role-list-row"><span class="role-list-main"><strong>${escapeHtml(order.item)}</strong><span>${escapeHtml(order.id)} · ${escapeHtml(order.customer)} · ${escapeHtml(order.date)}</span></span><span class="role-list-status">${statusTag(order.status,order.tone)}</span></div>`).join('')}</div>`;
  }

  function resellerCustomerRows(rows) {
    return `<div class="role-list">${rows.map((customer) => `<div class="role-list-row"><span class="role-list-main"><strong>${escapeHtml(customer.name)}</strong><span>${escapeHtml(customer.product)} · sampai ${escapeHtml(customer.expires)}</span></span><span class="role-list-status">${statusTag(customer.status,customer.tone)}</span><a class="text-link" href="#/preview/reseller/buy">Beli lagi ${feather('arrow-right')}</a></div>`).join('')}</div>`;
  }

  function adminTable(page) {
    if (!page.rows.length) return roleEmpty('Belum ada data contoh','Coba ubah pencarian atau filter.');
    const headings = page.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join('');
    const rows = page.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}<td><button class="button button-small" type="button" data-preview-action="Tindakan operasional tidak disimpan dalam preview">Lihat</button></td></tr>`).join('');
    return `<div class="table-wrap"><table><thead><tr>${headings}<th scope="col">Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderAdmin(path) {
    if (path === '/preview/admin') return `${rolePageHead('ADMIN CENTER · DATA CONTOH','Ringkasan operasional','Daftar dan antrean berikut hanya ilustrasi. Tidak ada perubahan operasional yang akan tersimpan.')}
      <div class="metric-grid"><article class="metric-card"><small>Pesanan contoh</small><strong>2</strong><span>Contoh data periode ini</span></article><article class="metric-card metric-attention"><small>Perlu ditinjau</small><strong>3</strong><span>Contoh antrean</span></article><article class="metric-card"><small>SKU katalog</small><strong>8</strong><span>Data katalog contoh</span></article><article class="metric-card"><small>Audit contoh</small><strong>2</strong><span>Riwayat ilustrasi</span></article></div>
      <section class="role-section"><div class="role-section-head"><div><h2>Antrean yang perlu perhatian</h2><p>Contoh status pembayaran dan pemenuhan.</p></div><a class="text-link" href="#/preview/admin/orders">Semua pesanan →</a></div>${adminTable({columns:['ID pesanan','Pelanggan','Produk','Status'],rows:ADMIN_PAGES['/preview/admin/orders'].rows.slice(0,1)})}</section>
      <section class="role-section"><div class="role-section-head"><div><h2>Program reseller</h2><p>Persetujuan reseller contoh memerlukan tindakan admin pada sistem sebenarnya.</p></div><a class="text-link" href="#/preview/admin/resellers">Lihat antrean →</a></div>${adminTable(ADMIN_PAGES['/preview/admin/resellers'])}</section>`;
    const page = ADMIN_PAGES[path];
    if (!page) return roleEmpty('Halaman admin tidak tersedia','Kembali ke ringkasan Admin Center.','/preview/admin');
    return `${rolePageHead('ADMIN CENTER',page.title,'Data di tabel ini hanya contoh. Filter hanya bekerja pada tampilan saat ini; aksi belum menyimpan perubahan.')}
      <div class="table-toolbar"><label class="search-form role-table-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Cari di tabel ini…" aria-label="Cari di tabel ini" data-table-search /></label><button class="button button-primary button-small" type="button" data-preview-action="Pembuatan data belum terhubung">Tambah data</button></div>${adminTable(page)}`;
  }

  function roleEmpty(title, message, href = '') {
    return `<div class="role-empty"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${href ? `<a class="button button-primary button-small" href="#${href}">Kembali</a>` : ''}</div>`;
  }

  function renderPreviewRoute(path) {
    const context = path.split('/')[2];
    if (!['customer','reseller'].includes(context)) return null;
    if (previewContext !== context) {
      return `<div class="preview-lock"><div class="preview-lock-card"><h1>Pilih tampilan preview dari halaman Masuk</h1><p>Setiap preview memakai navigasi peran yang terpisah.</p><a class="button button-primary" href="#/masuk">Pilih tampilan</a><a class="button" href="#/">Kembali ke toko</a></div></div>`;
    }
    const content = context === 'customer' ? renderCustomer(path) : context === 'reseller' ? renderReseller(path) : renderAdmin(path);
    return roleShell(context,path,content);
  }

  function bindPreviewEvents() {
    app.querySelectorAll('[data-preview-form]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      showToast('Preview saja · tidak ada pesanan yang dibuat.');
    }));
    app.querySelectorAll('[data-table-search]').forEach((input) => input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('id-ID');
      input.closest('.role-main')?.querySelectorAll('tbody tr').forEach((row) => { row.hidden = !row.textContent.toLocaleLowerCase('id-ID').includes(term); });
    }));
    app.querySelectorAll('[data-preview-action]').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.previewAction} · mode preview`)));
  }

  function routeContent() {
    const { path, params } = getRoute();
    if (path.startsWith('/preview/')) return null;
    if (path === '/') return renderHome();
    if (path === '/kategori' || path.startsWith('/kategori/')) return renderCatalog(decodeURIComponent(path.split('/')[2] || 'semua'), params);
    if (path.startsWith('/produk/')) return renderDetail(path.split('/')[2]);
    if (path === '/keranjang') return renderCartPage();
    if (path === '/faq') return renderFaq();
    return renderInfoPage(path) || renderNotice(path);
  }

  function bindHeroCarousel() {
    window.clearInterval(carouselTimer);
    const carousel = app.querySelector('[data-hero-carousel]');
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll('[data-hero-slide]')];
    const dots = [...carousel.querySelectorAll('[data-hero-to]')];
    let activeIndex = 0;
    let paused = false;
    let pointerStart = null;
    const show = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, itemIndex) => {
        const active = itemIndex === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      dots.forEach((dot, itemIndex) => dot.setAttribute('aria-pressed', String(itemIndex === activeIndex)));
    };
    carousel.querySelector('[data-hero-prev]')?.addEventListener('click', () => show(activeIndex - 1));
    carousel.querySelector('[data-hero-next]')?.addEventListener('click', () => show(activeIndex + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.heroTo))));
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(activeIndex + 1); }
    });
    carousel.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' && !event.target.closest('button')) pointerStart = event.clientX;
    });
    carousel.addEventListener('pointerup', (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 42) show(activeIndex + (distance < 0 ? 1 : -1));
    });
    carousel.addEventListener('pointercancel', () => { pointerStart = null; });
    carousel.addEventListener('mouseenter', () => { paused = true; });
    carousel.addEventListener('mouseleave', () => { paused = false; });
    carousel.addEventListener('focusin', () => { paused = true; });
    carousel.addEventListener('focusout', (event) => { paused = carousel.contains(event.relatedTarget); });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      carouselTimer = window.setInterval(() => {
        if (!paused && !document.hidden) show(activeIndex + 1);
      }, 6500);
    }
  }

  async function render() {
    const { path } = getRoute();
    if (path === '/preview/admin' || path.startsWith('/preview/admin/')) {
      window.location.hash = '#/admin';
      return;
    }
    document.body.classList.remove('is-not-found', 'admin-mode', 'auth-mode');
    if (path === '/admin' || path.startsWith('/admin/')) {
      window.clearInterval(carouselTimer);
      document.body.classList.remove('role-mode', 'has-sticky-purchase');
      document.body.classList.add('admin-mode');
      app.innerHTML = '<main class="admin-loading">Memuat area admin…</main>';
      try {
        const page = await renderAdminPage(path);
        if (getRoute().path === path) app.innerHTML = page;
      } catch {
        if (getRoute().path === path) app.innerHTML = '<main class="admin-service-error"><h1>Server Bacshop belum berjalan</h1><p>Jalankan server lokal untuk membuka admin dan menyimpan produk.</p><a class="button button-primary" href="#/">Kembali ke toko</a></main>';
      }
      if (getRoute().path === path) bindAdminEvents();
      return;
    }
    if (path.startsWith('/preview/')) {
      document.body.classList.remove('role-mode', 'has-sticky-purchase');
      document.body.classList.add('is-not-found');
      app.innerHTML = notFound();
      return;
    }
    document.body.classList.remove('role-mode');
    document.body.classList.toggle('has-sticky-purchase', path.startsWith('/produk/'));
    let content = await renderCustomerRoute(path, getRoute().params);
    if (content === null) content = routeContent();
    if (content === null) {
      document.body.classList.add('is-not-found');
      app.innerHTML = notFound();
      return;
    }
    const authRoute = path === '/masuk' || path === '/daftar';
    document.body.classList.toggle('auth-mode', authRoute);
    app.innerHTML = authRoute ? authShell(content) : shell(content, path);
    updateCartCounts();
    bindHeroCarousel();
    bindEvents();
    bindCustomerEvents();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function goToSearch(query) {
    const trimmed = query.trim();
    window.location.hash = getQueryUrl('semua', trimmed, 'relevance');
  }

  function updateSuggestions(input) {
    const wrap = input.closest('.search-wrap');
    const list = wrap?.querySelector('.search-suggestions');
    if (!list) return;
    const value = input.value.trim().toLocaleLowerCase('id-ID');
    if (!value) {
      list.classList.remove('open');
      input.setAttribute('aria-expanded', 'false');
      list.innerHTML = '';
      return;
    }
    const matches = PRODUCTS.filter((product) => {
      const category = CATEGORIES.find((item) => item.slug === product.category)?.name || '';
      return `${product.name} ${category}`.toLocaleLowerCase('id-ID').includes(value);
    }).slice(0, 5);
    const categoryMatches = CATEGORIES.filter((category) => category.name.toLocaleLowerCase('id-ID').includes(value)).slice(0, 2);
    const resultMarkup = [
      ...matches.map((product) => `<button class="suggestion-option" type="button" data-suggestion-url="#/produk/${product.slug}"><span class="suggestion-text"><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(CATEGORIES.find((item) => item.slug === product.category)?.name || '')}</span></span></button>`),
      ...categoryMatches.map((category) => `<button class="suggestion-option" type="button" data-suggestion-url="${getQueryUrl(category.slug, input.value, 'relevance')}"><span class="suggestion-text"><strong>${escapeHtml(category.name)}</strong><span>Kategori</span></span></button>`),
    ];
    list.innerHTML = `${resultMarkup.join('')}${!resultMarkup.length ? `<button class="suggestion-option" type="button" data-search-query="${escapeHtml(input.value)}"><span class="suggestion-text"><strong>Hasil untuk “${escapeHtml(input.value)}”</strong><span>Cari di katalog</span></span></button>` : ''}`;
    list.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  }

  function bindEvents() {
    app.querySelectorAll('[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input[name="q"]');
        if (input) goToSearch(input.value);
      });
    });
    app.querySelectorAll('.search-form input[name="q"]').forEach((input) => {
      input.addEventListener('input', () => updateSuggestions(input));
      input.addEventListener('focus', () => updateSuggestions(input));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          const list = input.closest('.search-wrap')?.querySelector('.search-suggestions');
          list?.classList.remove('open');
          input.setAttribute('aria-expanded', 'false');
        }
        if (event.key === 'Enter' && input.value.trim()) {
          event.preventDefault();
          goToSearch(input.value);
        }
      });
    });
    app.querySelectorAll('[data-add-to-cart]').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.addToCart)));
    app.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => updateQuantity(button.dataset.quantity, Number(button.dataset.delta))));
    app.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeFromCart(button.dataset.remove)));
    const filterDialog = app.querySelector('[data-filter-dialog]');
    app.querySelector('[data-open-filter]')?.addEventListener('click', () => filterDialog?.showModal());
    app.querySelector('[data-close-filter]')?.addEventListener('click', () => filterDialog?.close());
    filterDialog?.addEventListener('click', (event) => { if (event.target === filterDialog) filterDialog.close(); });
    filterDialog?.querySelectorAll('[data-range-for]').forEach((range) => range.addEventListener('input', () => {
      const target = filterDialog.querySelector(`#${range.dataset.rangeFor}`);
      if (target) target.value = range.value;
    }));
    filterDialog?.querySelectorAll('.price-inputs input').forEach((input) => input.addEventListener('input', () => {
      const target = filterDialog.querySelector(`[data-range-for="${input.id}"]`);
      if (target && input.value !== '') target.value = input.value;
    }));
    filterDialog?.querySelector('[data-filter-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      const minimum = Number(fields.get('min') || 0);
      const maximum = fields.get('max') === '' ? Number.POSITIVE_INFINITY : Number(fields.get('max'));
      const maximumField = filterDialog.querySelector('#max-price');
      maximumField.setCustomValidity(minimum > maximum ? 'Harga maksimal harus sama atau lebih besar dari harga minimal.' : '');
      if (minimum > maximum) { maximumField.reportValidity(); return; }
      const { path, params } = getRoute();
      const category = fields.get('category') || path.split('/')[2] || 'semua';
      window.location.hash = getQueryUrl(category, params.get('q') || '', fields.get('sort'), fields.get('min'), fields.get('max'));
      filterDialog.close();
    });
    filterDialog?.querySelector('[data-reset-filter]')?.addEventListener('click', () => {
      const { path, params } = getRoute();
      window.location.hash = getQueryUrl(path.split('/')[2] || 'semua', params.get('q') || '', 'relevance');
      filterDialog.close();
    });
    app.querySelector('[data-clear-filter]')?.addEventListener('click', () => {
      const { path, params } = getRoute();
      window.location.hash = getQueryUrl(path.split('/')[2] || 'semua', params.get('q') || '', 'relevance');
    });
    document.addEventListener('click', closeSuggestionsOnOutsideClick, { once: true });
  }

  app.addEventListener('click', (event) => {
    const previewChoice = event.target.closest('[data-enter-preview]');
    if (previewChoice) {
      previewContext = previewChoice.dataset.enterPreview;
      window.location.hash = `#/preview/${previewContext}`;
      return;
    }
    const suggestion = event.target.closest('[data-suggestion-url]');
    if (suggestion) {
      window.location.hash = suggestion.dataset.suggestionUrl;
      return;
    }
    const searchSuggestion = event.target.closest('[data-search-query]');
    if (searchSuggestion) goToSearch(searchSuggestion.dataset.searchQuery);
  });

  function closeSuggestionsOnOutsideClick(event) {
    if (event.target.closest('.search-wrap')) {
      document.addEventListener('click', closeSuggestionsOnOutsideClick, { once: true });
      return;
    }
    document.querySelectorAll('.search-suggestions.open').forEach((element) => element.classList.remove('open'));
    document.querySelectorAll('.search-form input[name="q"]').forEach((input) => input.setAttribute('aria-expanded', 'false'));
    document.addEventListener('click', closeSuggestionsOnOutsideClick, { once: true });
  }

  async function loadCatalog() {
    try {
      const [result, storefront, session] = await Promise.all([
        requestApi('/api/products'), requestApi('/api/storefront'), requestApi('/api/auth/session'),
      ]);
      if (!Array.isArray(result.products)) throw new Error('Katalog belum dapat dimuat.');
      PRODUCTS = result.products;
      STOREFRONT = storefront;
      if (Array.isArray(storefront.categories) && storefront.categories.length) CATEGORIES = storefront.categories;
      currentUser = session.user || null;
      cart = readCart();
      try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Guest cart is optional when storage is unavailable. */ }
      await render();
    } catch {
      app.innerHTML = '<main class="admin-service-error"><h1>Server Bacshop belum berjalan</h1><p>Jalankan server lokal Bacshop untuk memuat katalog.</p></main>';
    }
  }

  window.addEventListener('hashchange', () => { void render(); });
  void loadCatalog();
})();
