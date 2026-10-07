(() => {
  'use strict';

  const CART_KEY = 'bacshop-public-cart-v1';
  const CHECKOUT_OVERRIDE_KEY = 'bacshop-checkout-override-v1';
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
  let STOREFRONT = { categories: CATEGORIES, banners: [], promotions: [], resellerPlan: { price: 149000, terms: '' }, payment: { provider: 'QRIS' } };
  let currentUser = null;
  let AUTH_OPTIONS = { googleAvailable: false };
  let adminPreviewMode = (() => {
    try { return sessionStorage.getItem('bacshop.admin.preview') === 'true'; }
    catch { return false; }
  })();
  let toastTimer;
  let carouselTimer;
  let paymentPollTimer;
  let paymentPollInFlight = false;
  let cart = readCart();
  let checkoutItemsOverride = readCheckoutOverride();
  let previewContext = null;
  let adminRouteFocusAfterNavigation = false;

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
        const selection = product ? resolveClientSpecifications(product, item?.specifications) : null;
        return product && selection && !(product.orderMode === 'preorder' && !product.preOrderConfirmed) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
          ? { id: product.id, quantity, specifications: selection.values }
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

  function readCheckoutOverride() {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_OVERRIDE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(parsed)) return null;
      const valid = parsed.map((item) => {
        const product = PRODUCTS.find((entry) => entry.id === item?.id);
        const quantity = Number(item?.quantity);
        const selection = product ? resolveClientSpecifications(product, item?.specifications) : null;
        return product && selection && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
          ? { id: product.id, quantity, specifications: selection.values }
          : null;
      }).filter(Boolean);
      return valid.length ? valid : null;
    } catch { return null; }
  }

  function writeCheckoutOverride(items) {
    checkoutItemsOverride = items;
    try {
      if (items) sessionStorage.setItem(CHECKOUT_OVERRIDE_KEY, JSON.stringify(items));
      else sessionStorage.removeItem(CHECKOUT_OVERRIDE_KEY);
    } catch { /* A direct purchase can still continue for this page view. */ }
  }

  function cartQuantity() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function resolveClientSpecifications(product, requested = {}) {
    if (!product || !requested || typeof requested !== 'object' || Array.isArray(requested)) return null;
    const definitions = Array.isArray(product.specifications) ? product.specifications : [];
    const definitionIds = new Set(definitions.map((definition) => definition.id));
    if (Object.keys(requested).some((id) => !definitionIds.has(id))) return null;
    const values = {};
    const chosen = [];
    let adjustment = 0;
    for (const definition of definitions) {
      const value = requested[definition.id];
      if (!value) {
        if (definition.required !== false) return null;
        continue;
      }
      const option = (definition.options || []).find((entry) => entry.value === value);
      if (!option) return null;
      values[definition.id] = option.value;
      adjustment += Number(option.priceAdjustment) || 0;
      chosen.push({ name: definition.name, label: option.label });
    }
    return { values, chosen, unitPrice: Number(product.price) + adjustment };
  }

  function cartLineKey(item) {
    const values = Object.entries(item.specifications || {}).sort(([first], [second]) => first.localeCompare(second));
    return item.id + ':' + JSON.stringify(values);
  }

  function specificationSummary(product, selection = {}) {
    return (resolveClientSpecifications(product, selection)?.chosen || [])
      .map((item) => item.name + ': ' + item.label)
      .join(' · ');
  }

  function updateCartCounts() {
    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = String(cartQuantity());
      element.hidden = cartQuantity() === 0;
    });
  }

  function addToCart(id, quantity = 1, specifications = {}) {
    const product = PRODUCTS.find((entry) => entry.id === id);
    if (!product) return;
    if (product.orderMode === 'preorder' && !product.preOrderConfirmed) {
      showToast('Hubungi admin dan tunggu konfirmasi stok sebelum memesan.');
      return;
    }
    const selection = resolveClientSpecifications(product, specifications);
    if (!selection) {
      showToast('Pilih spesifikasi produk sebelum menambahkan ke keranjang.');
      return;
    }
    const item = { id, quantity: Math.max(1, Math.min(99, quantity)), specifications: selection.values };
    const lineKey = cartLineKey(item);
    const existing = cart.find((entry) => cartLineKey(entry) === lineKey);
    const next = existing
      ? cart.map((entry) => cartLineKey(entry) === lineKey ? { ...entry, quantity: Math.min(99, entry.quantity + item.quantity) } : entry)
      : [...cart, item];
    writeCart(next);
    showToast(`${product.name} ditambahkan ke keranjang`);
  }

  function updateQuantity(id, amount) {
    const next = cart.map((item) => cartLineKey(item) === id
      ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + amount)) }
      : item);
    writeCart(next);
    render();
  }

  function removeFromCart(id) {
    const item = cart.find((entry) => cartLineKey(entry) === id);
    const product = PRODUCTS.find((entry) => entry.id === item?.id);
    writeCart(cart.filter((entry) => cartLineKey(entry) !== id));
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
    const detailBulkMinimum = params.get('bulk') === '1' ? Math.max(1, Number(detailProduct?.bulkUnlockQuantity) || 1) : 1;
    const detailBulkStockBlocked = detailBulkMinimum > 1 && detailProduct?.stockAvailable !== null && detailProduct?.stockAvailable !== undefined && Number(detailProduct.stockAvailable) < detailBulkMinimum;
    const accountHref = currentUser ? '#/akun' : '#/masuk';
    const accountControl = adminPreviewMode
      ? '<span class="admin-preview-user-label">Admin · pratinjau</span>'
      : currentUser
      ? `<a class="account-link" href="#/akun">${avatarMark(currentUser)}<span class="account-link-copy"><strong>${escapeHtml(currentUser.name)}</strong><small>${currentUser.isReseller ? 'Reseller' : 'Akun'}</small></span></a>`
      : `<div class="auth-actions"><a class="button button-small" href="#/masuk">Masuk</a><a class="button button-primary button-small" href="#/daftar">Daftar</a></div>`;
    return `${adminPreviewMode ? '<div class="admin-preview-banner"><span><strong>Pratinjau toko</strong> · aksi pembelian dan akun dinonaktifkan.</span><a href="#/admin">Kembali ke admin</a></div>' : ''}<header class="site-header">
      <div class="header-main">
        <a class="brand" href="#/" aria-label="Bacshop beranda">Bacshop</a>
        ${headerSearch('desktop', query)}
        <div class="header-actions">
          ${adminPreviewMode ? '' : `<a class="header-link" href="#/program-reseller">Program reseller</a><a class="icon-button" href="#/keranjang" aria-label="Keranjang belanja">${feather('shopping-cart')}<span class="cart-count" data-cart-count ${count ? '' : 'hidden'}>${count}</span></a>`}
          ${accountControl}
        </div>
      </div>
      <div class="mobile-top">
        <a class="brand" href="#/" aria-label="Bacshop beranda">Bacshop</a>
        ${adminPreviewMode ? '' : `<div class="mobile-tools"><a class="icon-button" href="#/keranjang" aria-label="Keranjang belanja">${feather('shopping-cart')}<span class="cart-count" data-cart-count ${count ? '' : 'hidden'}>${count}</span></a><a class="mobile-account-link" href="${accountHref}" aria-label="${currentUser ? `Akun ${escapeHtml(currentUser.name)}` : 'Masuk atau daftar'}">${currentUser ? avatarMark(currentUser) : feather('user')}</a></div>`}
      </div>
      <div class="mobile-search-row">${headerSearch('mobile', query)}</div>
    </header>
    <main class="page-container" id="main" tabindex="-1">${content}</main>
    ${detailProduct ? `<div class="mobile-purchase"><div><small>${detailProduct.priceContext === 'reseller' ? 'Harga reseller' : 'Harga retail'}</small><strong>${rupiah(detailProduct.price)}</strong></div>${adminPreviewMode ? '<span class="button button-disabled" aria-disabled="true">Mode pratinjau</span>' : detailBulkStockBlocked ? `<span class="button button-disabled" aria-disabled="true">Stok belum cukup untuk minimum ${detailBulkMinimum}</span>` : detailProduct.stockAvailable === 0 ? '<span class="button button-disabled" aria-disabled="true">Stok habis</span>' : detailProduct.orderMode === 'preorder' && !detailProduct.preOrderConfirmed ? `<span class="button button-disabled" aria-disabled="true">Stok dikonfirmasi sebelum pesan</span>` : '<button class="button button-primary" type="submit" form="product-purchase-form" data-detail-sticky-buy data-purchase-action="buy" disabled>Beli sekarang</button>'}</div>` : ''}
    <footer class="site-footer"><div class="footer-inner">
      <div class="footer-brand-col"><a class="brand footer-brand" href="#/">Bacshop</a><p class="footer-summary">Periksa detail produk dan ketentuan sebelum membeli.</p></div>
      <div class="footer-col"><h3>Belanja</h3><a href="#/kategori/semua">Semua produk</a><a href="#/kategori/ai">AI & produktivitas</a><a href="#/kategori/streaming">Streaming</a><a href="#/promo">Promo</a></div>
      <div class="footer-col"><h3>Bacshop</h3><a href="#/program-reseller">Program reseller</a><a href="#/faq">FAQ</a><a href="#/privasi">Kebijakan privasi</a><a href="#/ketentuan-layanan">Ketentuan layanan</a><a href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Bantuan · Telegram @Mubacs</a></div>
      ${adminPreviewMode ? '<div class="footer-col"><h3>Pratinjau</h3><a href="#/admin">Kembali ke admin</a><p class="footer-preview-note">Halaman akun dan pesanan tidak tersedia dalam pratinjau.</p></div>' : '<div class="footer-col"><h3>Akun</h3><a href="#/akun">Profil</a><a href="#/pesanan">Pesanan</a><a href="#/keranjang">Keranjang</a><a href="#/masuk">Masuk</a></div>'}
    </div><div class="footer-bottom"><span>© Bacshop</span><span>Periksa detail produk dan ketentuan sebelum membayar.</span></div></footer>
    ${adminPreviewMode ? `<nav class="mobile-bottom admin-preview-bottom" aria-label="Navigasi pratinjau"><a class="mobile-nav-link" href="#/kategori/semua">${feather('grid')}<span>Belanja</span></a><a class="mobile-nav-link" href="#/admin">${feather('arrow-right')}<span>Kembali ke admin</span></a></nav>` : `<nav class="mobile-bottom" aria-label="Navigasi mobile">
      <a class="mobile-nav-link" href="#/"${activeNav(path, 'Beranda')}>${feather('home')}<span>Beranda</span></a>
      <a class="mobile-nav-link" href="#/kategori/semua"${activeNav(path, 'Belanja')}>${feather('grid')}<span>Belanja</span></a>
      <a class="mobile-nav-link" href="#/promo"${activeNav(path, 'Promo')}>${feather('tag')}<span>Promo</span></a>
      <a class="mobile-nav-link" href="${currentUser ? '#/akun' : '#/masuk'}"${activeNav(path, 'Akun')}>
        ${currentUser ? avatarMark(currentUser) : feather('user')}<span>${currentUser ? 'Akun' : 'Masuk'}</span></a>
    </nav>`}`;
  }

  function setCartQuantity(id, value) {
    const numeric = Number(value);
    const quantity = Number.isFinite(numeric) ? Math.max(1, Math.min(99, Math.floor(numeric))) : 1;
    writeCart(cart.map((item) => cartLineKey(item) === id ? { ...item, quantity } : item));
    render();
  }

  function authShell(content, path) {
    const register = path === '/daftar';
    return `<div class="auth-shell"><header class="auth-header"><a class="auth-logo" href="#/" aria-label="Bacshop beranda">Bacshop</a><a class="auth-header-action" href="#/${register ? 'masuk' : 'daftar'}">${register ? 'Masuk' : 'Daftar'}</a></header><main class="auth-main" id="main" tabindex="-1">${content}</main></div>`;
  }

  function productArt(product, detail = false) {
    return product.image
      ? `<div class="${detail ? 'detail-art' : 'product-art'} product-media" role="img" aria-label="${escapeHtml(product.name)}" style="background-image:url('${escapeHtml(product.image)}')"></div>`
      : `<div class="${detail ? 'detail-art' : 'product-art'} image-placeholder" role="img" aria-label="Gambar ${escapeHtml(product.name)} belum tersedia"></div>`;
  }

  function productCard(product, options = {}) {
    const category = CATEGORIES.find((entry) => entry.slug === product.category);
    const needsStockConfirmation = product.orderMode === 'preorder' && !product.preOrderConfirmed;
    const outOfStock = product.stockAvailable !== null && product.stockAvailable !== undefined && Number(product.stockAvailable) === 0;
    if (options.variant === 'admin') {
      const archived = Boolean(product.archived);
      const availableStock = product.stockAvailable ?? product.stock;
      const stock = product.stock === null || product.stock === undefined
        ? 'Stok tidak dibatasi'
        : `${Number(availableStock).toLocaleString('id-ID')} tersisa`;
      const outOfStock = product.stock !== null && product.stock !== undefined && Number(availableStock) === 0;
      const status = archived ? 'Diarsipkan' : product.orderMode === 'preorder'
        ? (product.preOrderConfirmed ? 'Pre-order · stok siap' : 'Pre-order · cek stok')
        : outOfStock ? 'Stok habis' : 'Aktif';
      const stateClass = archived || outOfStock ? 'is-muted' : product.orderMode === 'preorder' ? 'is-warning' : '';
      return `<article class="product-card admin-product-card${archived ? ' is-archived' : ''}" data-product-card data-product-search="${escapeHtml(`${product.name} ${category?.name || ''} ${product.id}`.toLocaleLowerCase('id-ID'))}">
        <div class="admin-product-media">${productArt(product)}<label class="admin-product-check"><input type="checkbox" data-product-select value="${escapeHtml(product.id)}" aria-label="Pilih ${escapeHtml(product.name)}" /><span>Pilih</span></label>${archived ? '<span class="admin-product-archived">Arsip</span>' : ''}</div>
        <div class="product-info admin-product-info"><div class="admin-product-card-overline"><span class="product-category">${escapeHtml(category?.name || 'Produk digital')}</span><span class="admin-product-state ${stateClass}"><i></i>${escapeHtml(status)}</span></div>
          <h3 class="product-title">${escapeHtml(product.name)}</h3><strong class="product-price">${rupiah(product.price)}</strong><span class="product-price-note">Harga retail</span>${product.resellerPrice ? `<span class="admin-product-reseller">Reseller ${rupiah(product.resellerPrice)}</span>` : ''}
          <div class="admin-product-stock">${feather('grid')}<span>${escapeHtml(stock)}</span></div></div>
        <div class="product-card-actions admin-product-card-actions"><a class="button button-primary product-detail-button" href="#/admin/produk/${encodeURIComponent(product.id)}" aria-label="Kelola ${escapeHtml(product.name)}">Kelola</a><span class="admin-product-card-id">${escapeHtml(product.id)}</span></div>
      </article>`;
    }
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
      <div class="product-card-actions"><a class="button button-primary product-detail-button" href="#/produk/${encodeURIComponent(product.slug)}">Detail</a>${adminPreviewMode || needsStockConfirmation || outOfStock ? `<button class="button cart-icon-button" type="button" disabled aria-label="${adminPreviewMode ? 'Mode pratinjau' : outOfStock ? 'Stok habis' : 'Stok belum dikonfirmasi'}">${feather('shopping-cart')}</button>` : `<a class="button cart-icon-button" href="#/produk/${encodeURIComponent(product.slug)}?intent=cart" aria-label="Pilih spesifikasi ${escapeHtml(product.name)}">${feather('shopping-cart')}</a>`}</div>
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
    const slides = activeBanners.map((_, index) => `<div class="hero-slide ${index === 0 ? 'is-active' : ''}" data-hero-slide role="group" aria-roledescription="slide" aria-label="Banner ${index + 1} dari ${activeBanners.length}" ${index ? 'aria-hidden="true" inert' : ''}><div class="hero-blank-placeholder" aria-hidden="true"></div></div>`).join('');
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

  function getQueryUrl(category, query, sort, min = '', max = '', readyOnly = false) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (min !== '' && Number(min) > 0) params.set('min', String(min));
    if (max !== '' && Number(max) > 0) params.set('max', String(max));
    if (readyOnly) params.set('ready', '1');
    const suffix = params.toString();
    return `#/kategori/${encodeURIComponent(category)}${suffix ? `?${suffix}` : ''}`;
  }

  function searchProducts(query, category = 'semua', sort = 'relevance', min = 0, max = Number.MAX_SAFE_INTEGER, readyOnly = false) {
    const term = query.trim().toLocaleLowerCase('id-ID');
    let products = PRODUCTS.filter((product) => {
      const categoryName = CATEGORIES.find((item) => item.slug === product.category)?.name || '';
      const matchesCategory = category === 'semua' || product.category === category;
      const matchesQuery = !term || `${product.name} ${categoryName} ${product.description} ${product.fulfillment}`.toLocaleLowerCase('id-ID').includes(term);
      const matchesAvailability = !readyOnly || product.orderMode !== 'preorder' || product.preOrderConfirmed;
      return matchesCategory && matchesQuery && matchesAvailability && Number(product.price) >= min && Number(product.price) <= max;
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
      + (params.get('sort') && params.get('sort') !== 'relevance' ? 1 : 0)
      + (params.get('ready') === '1' ? 1 : 0);
    return `<button class="button filter-trigger" type="button" data-open-filter>${feather('filter')}<span>Filter</span>${active ? `<span class="filter-count">${active}</span>` : ''}</button>`;
  }

  function catalogSortOptions(sort, idPrefix) {
    const options = [
      { value: 'relevance', label: 'Paling sesuai' },
      { value: 'price-low', label: 'Harga terendah' },
      { value: 'price-high', label: 'Harga tertinggi' },
      { value: 'newest', label: 'Terbaru' },
    ];
    return `<fieldset class="catalog-sort-options"><legend>Urutan</legend>${options.map((option) => `<label class="catalog-choice"><input id="${idPrefix}-${option.value}" type="radio" name="sort" value="${option.value}" ${sort === option.value ? 'checked' : ''} /><span>${escapeHtml(option.label)}</span></label>`).join('')}</fieldset>`;
  }

  function catalogFilterFields(params, idPrefix, ceiling) {
    const min = Math.max(0, Number(params.get('min')) || 0);
    const max = params.get('max') || '';
    return `<fieldset class="catalog-filter-price"><legend>Harga</legend><div class="catalog-price-inputs"><label for="${idPrefix}-min">Minimum</label><div class="catalog-currency-input"><span>Rp</span><input id="${idPrefix}-min" name="min" type="number" min="0" max="${ceiling}" step="1000" value="${min || ''}" placeholder="0" inputmode="numeric" /></div><label for="${idPrefix}-max">Maksimum</label><div class="catalog-currency-input"><span>Rp</span><input id="${idPrefix}-max" name="max" type="number" min="0" max="${ceiling}" step="1000" value="${escapeHtml(max)}" placeholder="Tanpa batas" inputmode="numeric" /></div></div></fieldset>
      <fieldset class="catalog-availability"><legend>Ketersediaan</legend><label class="catalog-choice"><input type="checkbox" name="ready" value="1" ${params.get('ready') === '1' ? 'checked' : ''} /><span>Siap dipesan</span></label></fieldset>`;
  }

  function catalogFilterSidebar(category, params) {
    const ceiling = Math.max(50000, Math.ceil(Math.max(...PRODUCTS.map((product) => Number(product.price) || 0)) / 50000) * 50000);
    const sort = params.get('sort') || 'relevance';
    return `<aside class="filter-panel catalog-filter-panel"><h2>Filter produk</h2><form class="catalog-filter-form" data-filter-form aria-label="Filter katalog">
      <input type="hidden" name="category" value="${escapeHtml(category)}" />
      ${catalogSortOptions(sort, 'desktop-sort')}
      ${catalogFilterFields(params, 'desktop-price', ceiling)}
      <button class="button button-primary button-small" type="submit">Terapkan filter</button>
      <button class="catalog-filter-reset" type="button" data-reset-filter>Reset</button>
    </form></aside>`;
  }

  function advancedFilterDialog(category, params) {
    const ceiling = Math.max(50000, Math.ceil(Math.max(...PRODUCTS.map((product) => Number(product.price) || 0)) / 50000) * 50000);
    const sort = params.get('sort') || 'relevance';
    return `<dialog class="filter-dialog" data-filter-dialog aria-labelledby="filter-heading"><form class="filter-dialog-form" data-filter-form>
      <input type="hidden" name="category" value="${escapeHtml(category)}" />
      <header class="filter-dialog-head"><h2 id="filter-heading">Filter & urutkan</h2><button class="icon-button" type="button" data-close-filter aria-label="Tutup filter">${feather('x')}</button></header>
      <div class="filter-dialog-body">
        ${catalogSortOptions(sort, 'mobile-sort')}
        ${catalogFilterFields(params, 'mobile-price', ceiling)}
      </div>
      <footer class="filter-dialog-actions"><button class="button" type="button" data-reset-filter>Reset</button><button class="button button-primary" type="submit">Terapkan filter</button></footer>
    </form></dialog>`;
  }

  function renderCatalog(category, params) {
    const query = params.get('q') || '';
    const sort = params.get('sort') || 'relevance';
    const min = Math.max(0, Number(params.get('min')) || 0);
    const max = Math.max(0, Number(params.get('max')) || Number.MAX_SAFE_INTEGER);
    const readyOnly = params.get('ready') === '1';
    const validCategory = CATEGORIES.some((item) => item.slug === category) ? category : 'semua';
    const heading = validCategory === 'semua' ? 'Produk' : CATEGORIES.find((item) => item.slug === validCategory)?.name || 'Produk';
    const products = searchProducts(query, validCategory, sort, min, max, readyOnly);
    const filterSidebar = catalogFilterSidebar(validCategory, params);
    const categoryPills = `<nav class="catalog-category-chips" aria-label="Pilih kategori">${[['semua','Produk'], ...CATEGORIES.map((item) => [item.slug,item.name])].map(([slug,name]) => `<a class="category-chip ${validCategory === slug ? 'active' : ''}" href="${getQueryUrl(slug, query, sort, min, params.get('max') || '', readyOnly)}" ${validCategory === slug ? 'aria-current="page"' : ''}>${escapeHtml(name)}</a>`).join('')}</nav>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>${escapeHtml(heading)}</span></nav>
      <section class="page-panel catalog-page"><div class="page-heading"><h1>${escapeHtml(heading)}</h1><p>${query ? `Hasil pencarian untuk “${escapeHtml(query)}”.` : 'Pilih produk dan periksa ketentuan sebelum melanjutkan.'}</p></div>
        <div class="catalog-layout">${filterSidebar}<div class="catalog-main">${categoryPills}<div class="product-toolbar"><div class="mobile-filter-toolbar">${advancedFilterButton(params)}<span class="filter-summary">${sort === 'relevance' ? 'Urutan relevan' : escapeHtml(({ 'price-low':'Harga termurah', 'price-high':'Harga termahal', newest:'Terbaru' })[sort] || 'Urutan relevan')}</span></div></div>
          <div class="catalog-topline"><p>${products.length} produk</p>${query || params.has('min') || params.has('max') || params.has('sort') || readyOnly ? `<a class="text-link" href="${getQueryUrl(validCategory, query, 'relevance')}">Hapus filter</a>` : ''}</div>
          ${products.length ? `<div class="product-grid">${products.map(productCard).join('')}</div>` : `<div class="empty-state"><h3>Belum ada produk yang cocok</h3><p>Ubah rentang harga atau urutan untuk melihat pilihan lainnya.</p><button class="button button-primary button-small" type="button" data-clear-filter>Hapus filter</button></div>`}
      </div></div></section>${advancedFilterDialog(validCategory, params)}`;
  }

  function renderDetail(slug, params = new URLSearchParams()) {
    const product = PRODUCTS.find((item) => item.slug === safeDecode(slug || ''));
    if (!product) return null;
    const needsStockConfirmation = product.orderMode === 'preorder' && !product.preOrderConfirmed;
    const outOfStock = product.stockAvailable !== null && product.stockAvailable !== undefined && Number(product.stockAvailable) === 0;
    const bulkQuantity = Number(product.bulkUnlockQuantity) || 1;
    const isBulkPurchase = params.get('bulk') === '1';
    const requestedQuantity = Math.max(isBulkPurchase ? bulkQuantity : 1, Math.min(99, Number(params.get('qty')) || (isBulkPurchase ? bulkQuantity : 1)));
    const bulkStockBlocked = isBulkPurchase && product.stockAvailable !== null && product.stockAvailable !== undefined && Number(product.stockAvailable) < bulkQuantity;
    const minimumQuantity = isBulkPurchase ? bulkQuantity : 1;
    const stockLimit = product.stockAvailable === null || product.stockAvailable === undefined ? 99 : Math.max(0, Math.min(99, Number(product.stockAvailable)));
    const initialQuantity = Math.min(requestedQuantity, Math.max(1, stockLimit));
    const unavailableReason = bulkStockBlocked
      ? `Stok tersisa ${Number(product.stockAvailable)} unit, sedangkan minimum pesanan ini ${bulkQuantity} unit.`
      : outOfStock
        ? 'Stok produk sedang habis.'
        : needsStockConfirmation
          ? 'Stok pre-order belum dikonfirmasi.'
          : '';
    const purchaseBlocked = Boolean(unavailableReason || adminPreviewMode);
    const specifications = (product.specifications || []).map((specification) => `<label class="detail-specification-field"><span>${escapeHtml(specification.name)}${specification.required === false ? ' · opsional' : ''}</span><select name="${escapeHtml(specification.id)}" data-detail-specification="${escapeHtml(specification.id)}" ${specification.required === false ? '' : 'required'} ${purchaseBlocked ? 'disabled' : ''}>${specification.required === false ? '<option value="">Tanpa pilihan</option>' : '<option value="">Pilih terlebih dahulu</option>'}${(specification.options || []).map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}${Number(option.priceAdjustment) ? ` · ${Number(option.priceAdjustment) > 0 ? '+' : ''}${rupiah(Number(option.priceAdjustment))}` : ''}</option>`).join('')}</select></label>`).join('');
    const category = CATEGORIES.find((item) => item.slug === product.category) || { name: 'Produk digital' };
    const terms = Object.entries(product.terms || {}).map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');
    const bulkNote = product.bulkUnlockQuantity ? `<p class="bulk-unlock-note">Beli ${product.bulkUnlockQuantity} unit dalam satu pesanan yang lunas untuk membuka harga reseller produk ini secara permanen.</p>` : '';
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/kategori/${product.category}">${escapeHtml(category.name)}</a><span aria-hidden="true">›</span><span>${escapeHtml(product.name)}</span></nav>
      <section class="page-panel product-detail-page"><div class="detail-layout"><div class="detail-gallery">${productArt(product, true)}</div><div class="detail-summary"><span class="product-category">${escapeHtml(category.name)}</span><h1>${escapeHtml(product.name)}</h1><div class="detail-meta"><span class="meta-pill">${escapeHtml(product.duration)}</span><span class="meta-pill">${escapeHtml(product.fulfillment)}</span>${product.orderMode === 'preorder' ? `<span class="meta-pill">${needsStockConfirmation ? 'Pre-order · menunggu konfirmasi stok' : 'Stok dikonfirmasi admin'}</span>` : ''}</div>
        <p class="detail-description">${escapeHtml(product.description)}</p><ul class="term-list" aria-label="Informasi produk">${terms}</ul>${bulkNote}</div>
        <aside class="detail-purchase-card" aria-label="Pesan ${escapeHtml(product.name)}"><form class="detail-purchase-form" id="product-purchase-form" data-detail-purchase data-product-id="${escapeHtml(product.id)}" data-minimum-quantity="${minimumQuantity}" data-stock-limit="${stockLimit}"><div class="detail-price-box"><small>Harga ${product.priceContext === 'reseller' ? 'reseller' : 'retail'}</small><strong class="detail-price" data-detail-unit-price>${rupiah(product.price)}</strong></div>
          <div class="detail-specification-list">${specifications || '<p class="detail-no-specification">Tidak ada pilihan tambahan untuk produk ini.</p>'}</div>
          <div class="detail-quantity-row"><label class="detail-quantity-field"><span>Jumlah${minimumQuantity > 1 ? ` · minimum ${minimumQuantity} unit` : ''}</span><input type="number" name="quantity" min="${minimumQuantity}" max="${Math.max(1, stockLimit)}" value="${initialQuantity}" inputmode="numeric" data-detail-quantity required ${purchaseBlocked ? 'disabled' : ''} /></label><span class="detail-stock-note">${product.stockAvailable === null || product.stockAvailable === undefined ? 'Stok tersedia' : `Stok ${Number(product.stockAvailable)} unit`}</span></div>
          <div class="detail-purchase-total"><span>Total</span><strong data-detail-total>${rupiah(product.price * initialQuantity)}</strong></div>
          <div class="detail-actions">${adminPreviewMode ? '<span class="button button-disabled" aria-disabled="true">Mode pratinjau</span>' : purchaseBlocked ? `<button class="button button-disabled" type="button" disabled>${escapeHtml(unavailableReason)}</button>` : `<button class="button button-primary" type="submit" data-purchase-action="buy" disabled>Beli sekarang</button><button class="button detail-cart-action" type="submit" data-purchase-action="cart" disabled>Tambah ke keranjang</button>`}</div>
          <p class="detail-purchase-error" data-detail-purchase-error role="status" aria-live="polite" hidden></p>
        </form></aside></div></section>
      <section class="section">${sectionHead('Pilihan lainnya','Jelajahi produk lain dari toko.') }<div class="product-grid">${PRODUCTS.filter((item) => item.id !== product.id).slice(0, 5).map(productCard).join('')}</div></section>`;
  }

  function notFound() {
    return `<main class="not-found-page"><h1>Halaman tidak ditemukan</h1><p>Alamat yang kamu buka tidak tersedia.</p><a class="button button-primary" href="#/">Ke beranda</a></main>`;
  }

  function checkoutStepsMarkup(activeStep, finished = false) {
    const labels = ['Keranjang', 'Konfirmasi', 'Pembayaran'];
    return `<ol class="checkout-steps" aria-label="Tahap pesanan">${labels.map((label, index) => {
      const step = index + 1;
      const complete = finished || step < activeStep;
      const current = !finished && step === activeStep;
      const classes = [complete ? 'is-complete' : '', current ? 'is-current' : ''].filter(Boolean).join(' ');
      return `<li class="${classes}"${current ? ' aria-current="step"' : ''}><span class="checkout-step-number">${complete ? '✓' : step}</span>${label}</li>`;
    }).join('')}</ol>`;
  }

  function stopPaymentPolling() {
    window.clearTimeout(paymentPollTimer);
    paymentPollTimer = null;
  }

  function schedulePaymentPolling(orderId) {
    stopPaymentPolling();
    paymentPollTimer = window.setTimeout(async () => {
      const orderRoute = `#/pesanan/${encodeURIComponent(orderId)}`;
      if (window.location.hash !== orderRoute) return;
      if (document.hidden || paymentPollInFlight) {
        schedulePaymentPolling(orderId);
        return;
      }
      paymentPollInFlight = true;
      try {
        const result = await requestApi(`/api/orders/${encodeURIComponent(orderId)}/check-payment`, { method: 'POST', body: {} });
        if (window.location.hash !== orderRoute) return;
        if (result.order?.paymentStatus !== 'pending' && result.order?.refundStatus !== 'requested') {
          await render();
          return;
        }
      } catch {
        // Keep the QR visible and retry after a temporary connection error.
      } finally {
        paymentPollInFlight = false;
      }
      if (window.location.hash === orderRoute) schedulePaymentPolling(orderId);
    }, 10000);
  }

  function renderCartPage() {
    const availableCart = cart.filter((item) => {
      const product = PRODUCTS.find((entry) => entry.id === item.id);
      return product && resolveClientSpecifications(product, item.specifications) && !(product.orderMode === 'preorder' && !product.preOrderConfirmed);
    });
    if (availableCart.length !== cart.length) writeCart(availableCart);
    const rows = availableCart.map((item) => {
      const product = PRODUCTS.find((entry) => entry.id === item.id);
      const selection = resolveClientSpecifications(product, item.specifications);
      return product ? { ...item, product, lineKey: cartLineKey(item), unitPrice: selection.unitPrice, specificationText: selection.chosen.map((entry) => entry.name + ': ' + entry.label).join(' · ') } : null;
    }).filter(Boolean);
    const total = rows.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    if (!rows.length) return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Keranjang</span></nav><section class="page-panel"><div class="page-heading"><h1>Keranjangmu</h1><p>Produk yang kamu pilih akan tersimpan di browser ini.</p></div><div class="empty-state"><h3>Keranjang masih kosong</h3><p>Jelajahi katalog dan tambahkan produk yang kamu butuhkan.</p><a class="button button-primary button-small" href="#/kategori/semua">Jelajahi produk</a></div></section>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Keranjang</span></nav><section class="page-panel"><div class="page-heading"><h1>Keranjangmu</h1><p>Periksa spesifikasi, jumlah, dan harga sebelum mengonfirmasi pesanan.</p></div>${checkoutStepsMarkup(1)}<div class="cart-layout"><div class="cart-list">${rows.map(({ product, quantity, unitPrice, specificationText, lineKey }) => `<article class="cart-row"><div class="cart-thumb ${product.image ? 'product-media' : 'image-placeholder'}" ${product.image ? `style="background-image:url('${escapeHtml(product.image)}')"` : ''} role="img" aria-label="Gambar ${escapeHtml(product.name)}"></div><div><h2><a href="#/produk/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h2><span class="cart-meta">${escapeHtml(product.duration)} · ${escapeHtml(product.fulfillment)}</span>${specificationText ? `<span class="cart-specifications">${escapeHtml(specificationText)}</span>` : ''}<strong class="cart-price">${rupiah(unitPrice)}</strong><div class="cart-controls"><button class="qty-button" type="button" data-quantity="${escapeHtml(lineKey)}" data-delta="-1" aria-label="Kurangi jumlah ${escapeHtml(product.name)}">${feather('minus')}</button><input class="qty-value" type="number" min="1" max="99" inputmode="numeric" value="${quantity}" data-cart-quantity="${escapeHtml(lineKey)}" aria-label="Jumlah ${escapeHtml(product.name)}" /><button class="qty-button" type="button" data-quantity="${escapeHtml(lineKey)}" data-delta="1" aria-label="Tambah jumlah ${escapeHtml(product.name)}">${feather('plus')}</button><button class="remove-button" type="button" data-remove="${escapeHtml(lineKey)}">Hapus</button></div></div><div class="cart-side"><strong class="cart-price">${rupiah(unitPrice * quantity)}</strong></div></article>`).join('')}</div><aside class="summary-card"><h2>Ringkasan belanja</h2><div class="summary-line"><span>Subtotal (${cartQuantity()} item)</span><span>${rupiah(total)}</span></div><div class="summary-total"><span>Total</span><span>${rupiah(total)}</span></div><a class="button button-primary" href="#/checkout">Lanjut konfirmasi</a><p class="summary-note">Rincian pesanan akan kamu konfirmasi sebelum pembayaran.</p></aside></div></section>`;
  }

  function renderInfoPage(path) {
    if (path === '/program-reseller') {
      const price = Number(STOREFRONT.resellerPlan?.price) || 149000;
      const visibleResellerProduct = PRODUCTS.find((product) => product.priceContext === 'reseller');
      const resellerAccess = Boolean(currentUser?.resellerPlan || currentUser?.isReseller || visibleResellerProduct);
      const planAction = currentUser?.resellerPlan
        ? '<span class="reseller-active-label">Akses seluruh katalog aktif</span><a class="button button-primary" href="#/kategori/semua">Lihat katalog</a>'
        : adminPreviewMode
          ? '<span class="reseller-active-label">Pembelian nonaktif dalam pratinjau.</span>'
          : currentUser
            ? '<button class="button button-primary" type="button" data-buy-reseller-plan>Aktifkan akses katalog</button>'
            : '<a class="button button-primary" href="#/masuk?next=%2Fprogram-reseller">Masuk untuk mengaktifkan</a>';
      const resellerPreview = visibleResellerProduct
        ? `<article class="reseller-price-preview"><div class="reseller-preview-product-thumb ${visibleResellerProduct.image ? 'product-media' : 'image-placeholder'}" ${visibleResellerProduct.image ? `style="background-image:url('${escapeHtml(visibleResellerProduct.image)}')"` : ''} role="img" aria-label="Gambar ${escapeHtml(visibleResellerProduct.name)}"></div><div class="reseller-preview-product-copy"><span class="rail-eyebrow">Harga reseller aktif</span><strong>${escapeHtml(visibleResellerProduct.name)}</strong><span>${rupiah(visibleResellerProduct.price)}</span></div><a class="rail-link" href="#/produk/${encodeURIComponent(visibleResellerProduct.slug)}">Lihat produk ${feather('arrow-right')}</a></article>`
        : `<div class="reseller-price-preview reseller-price-preview-locked"><span class="rail-eyebrow">Tampilan toko setelah aktif</span><strong>Harga khusus tampil di katalog</strong><p>Produk dan halaman belanja tetap sama. Harga reseller muncul langsung pada produk yang aksesnya sudah terbuka.</p><a class="rail-link" href="#/kategori/semua">Lihat katalog ${feather('arrow-right')}</a></div>`;
      return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Program reseller</span></nav>
        <section class="info-layout info-layout-faq info-layout-reseller"><div class="info-main"><div class="page-heading"><h1>Program reseller</h1><p>Harga khusus tampil langsung di katalog setelah akses dibuka.</p></div>
          <div class="faq-list reseller-info-list"><details open><summary>Bagaimana akses harga reseller dibuka?</summary><p>Penuhi minimum pembelian pada satu produk dalam satu pesanan. Setelah pembayaran diverifikasi, harga reseller produk tersebut terbuka permanen.</p></details><details><summary>Ada akses untuk seluruh katalog?</summary><p>Paket reseller berlaku permanen untuk semua produk dengan harga yang ditetapkan admin. Harganya ${rupiah(price)} dan dibayar satu kali.</p></details><details><summary>Di mana harga reseller terlihat?</summary><p>Di katalog dan halaman detail produk yang sama. Produk yang sudah terbuka menampilkan harga reseller di tempat harga retail.</p></details><details><summary>Kapan akses mulai aktif?</summary><p>Setelah pembayaran QRIS terverifikasi. Pesanan dan status pembayarannya dapat dilihat dari menu Pesanan.</p></details></div>
          <div class="faq-support"><div><strong>${resellerAccess ? 'Harga reseller sudah tersedia di katalogmu.' : 'Lihat produk dengan tampilan toko yang sama.'}</strong><span>${resellerAccess ? 'Harga khusus tampil langsung pada produk yang aksesnya sudah aktif.' : 'Pilih akses lebih dulu, lalu belanja seperti biasa dari katalog Bacshop.'}</span></div><a class="button button-primary" href="#/kategori/semua">Buka katalog</a></div>
        </div><aside class="info-side-rail faq-side-rail"><section class="rail-card"><span class="rail-eyebrow">Akses seluruh katalog</span><h2>${currentUser?.resellerPlan ? 'Akses reseller aktif' : 'Satu kali bayar'}</h2><p>${currentUser?.resellerPlan ? 'Harga reseller seluruh katalog sudah tersedia di halaman produk.' : escapeHtml(STOREFRONT.resellerPlan?.terms || 'Paket membuka harga reseller permanen untuk seluruh katalog setelah pembayaran QRIS terverifikasi.')}</p><strong class="reseller-rail-price">${rupiah(price)} <small>sekali</small></strong>${planAction}</section><section class="rail-card rail-card-soft">${resellerPreview}</section></aside></section>`;
    }
    if (path === '/promo') {
      const promos = (STOREFRONT.promotions || []).filter((promo) => promo.active);
      return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Promo</span></nav><section class="page-panel"><div class="page-heading"><h1>Promo</h1><p>Penawaran dan informasi terbaru dari Bacshop.</p></div>${promos.length ? `<div class="promo-page-grid">${promos.map((promo) => `<a class="promo-page-card" href="${escapeHtml(promo.href)}">${promo.image ? `<img src="${escapeHtml(promo.image)}" alt="" loading="lazy" />` : ''}<div><h2>${escapeHtml(promo.title)}</h2><p>${escapeHtml(promo.description)}</p></div></a>`).join('')}</div>` : `<div class="empty-state"><h3>Belum ada promo aktif</h3><p>Kunjungi lagi nanti untuk melihat penawaran terbaru.</p></div>`}</section>`;
    }
    const pages = {
      '/bantuan': { title: 'Pusat bantuan', intro: 'Periksa detail produk atau buka pertanyaan umum.', rows: [['Aktivasi','Cara dan estimasi proses dicantumkan pada setiap produk.'],['Pesanan','Status pembayaran dan pemenuhan ditampilkan terpisah pada detail pesanan.'],['FAQ','Buka FAQ untuk jawaban ringkas.']] },
      '/privasi': { title: 'Kebijakan privasi', intro: 'Informasi yang Bacshop simpan dan cara menggunakannya untuk menjalankan toko.', sections: [
        { title: 'Data yang kami simpan', body: 'Saat kamu memakai Bacshop, sistem menyimpan nama dan email akun, perubahan profil yang kamu kirim, serta rincian pesanan dan status pembayarannya. Keranjang disimpan di browser yang kamu pakai.' },
        { title: 'Untuk apa data digunakan', body: 'Data akun dipakai untuk masuk, menampilkan profil, memproses pesanan, mengirim produk, mengelola akses harga reseller, dan menjawab permintaan bantuan.' },
        { title: 'Data teknis', body: 'Alamat IP koneksi dipakai sementara untuk membatasi percobaan login. Nilai ini tidak disimpan sebagai bagian dari profil akun atau pesanan.' },
        { title: 'Pembayaran melalui QRIS', body: 'Setelah pesanan dikonfirmasi, Bacshop membuat QRIS khusus pada halaman pembayaran dan memeriksa status transaksi secara otomatis. Bacshop tidak meminta PIN atau kata sandi aplikasi pembayaranmu.' },
        { title: 'Penyimpanan dan permintaan', body: 'Data akun dan pesanan disimpan pada server Bacshop untuk menjalankan layanan dan menyimpan riwayat transaksi. Untuk melihat atau memperbarui data, atau meminta penghapusan akun, hubungi admin. Sebagian catatan transaksi dapat tetap diperlukan untuk menyelesaikan pesanan atau kewajiban pencatatan.' },
      ] },
      '/data-pribadi': { title: 'Penggunaan data pribadi', intro: 'Ringkasan jenis data, tujuan pemrosesan, dan cara mengajukan permintaan.', sections: [
        { title: 'Data akun dan profil', body: 'Nama, email, foto profil jika diunggah, dan data autentikasi yang tersimpan dalam bentuk hash kata sandi. Kata sandi asli tidak ditampilkan di halaman profil.' },
        { title: 'Data transaksi', body: 'Pesanan berisi produk, jumlah, nominal, waktu, status pembayaran, dan referensi transaksi yang diperlukan untuk memeriksa pembayaran serta menyelesaikan layanan.' },
        { title: 'Pihak pemroses pembayaran', body: 'Penyedia pembayaran menerima data transaksi yang diperlukan untuk membuat QRIS dan memberi tahu Bacshop saat pembayaran berhasil. Aplikasi pembayaran yang kamu gunakan juga memiliki ketentuan privasinya sendiri.' },
        { title: 'Akses dan koreksi', body: 'Kamu dapat meminta salinan atau koreksi informasi akun melalui admin Bacshop. Sertakan email akun dan jelaskan permintaannya; jangan kirim kata sandi, PIN, OTP, atau data login aplikasi pembayaran.' },
      ] },
      '/ketentuan-layanan': { title: 'Ketentuan layanan', intro: 'Aturan singkat untuk pembelian produk digital dan akses harga reseller.', sections: [
        { title: 'Informasi produk', body: 'Periksa masa akses, cara aktivasi, wilayah, akun tujuan, dan syarat lain pada detail produk sebelum memesan. Ketersediaan dan ketentuan dapat berbeda pada tiap produk.' },
        { title: 'Pesanan dan pembayaran', body: 'Pembayaran dilakukan dengan QRIS yang dibuat khusus untuk pesanan. Selesaikan pembayaran sebelum QR kedaluwarsa. Pesanan diproses setelah status pembayaran terkonfirmasi; tangkapan layar bukti transfer tidak menggantikan konfirmasi tersebut.' },
        { title: 'Pengiriman digital', body: 'Proses aktivasi dimulai setelah pembayaran terverifikasi. Ikuti instruksi pada detail produk dan berikan informasi akun tujuan hanya jika memang diminta untuk aktivasi.' },
        { title: 'Harga reseller', body: 'Minimum bulk ditetapkan per produk dan harus dipenuhi dalam satu pesanan yang lunas serta tidak dibatalkan atau direfund. Akses harga untuk produk itu terbuka setelah pembayaran terverifikasi. Paket reseller mulai Rp149.000 membuka harga reseller di seluruh katalog setelah pembayaran terkonfirmasi.' },
        { title: 'Pertanyaan pesanan', body: 'Untuk kendala pesanan atau permintaan terkait akun, hubungi admin melalui kanal bantuan Bacshop dengan menyebutkan nomor pesanan. Jangan mengirim kata sandi atau kode OTP.' },
      ] },
    };
    const page = pages[path];
    if (!page) return null;
    const legalPage = Array.isArray(page.sections);
    const pageContent = legalPage
      ? `<div class="content-prose">${page.sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></section>`).join('')}</div>`
      : `<dl class="info-rows">${page.rows.map(([title,description]) => `<div><dt>${escapeHtml(title)}</dt><dd>${escapeHtml(description)}</dd></div>`).join('')}</dl><a class="text-link" href="#/faq">Buka FAQ ${feather('arrow-right')}</a>`;
    const legalRail = `<aside class="info-side-rail legal-side-rail"><section class="rail-card"><span class="rail-eyebrow">Informasi Bacshop</span><h2>Dokumen toko</h2><nav class="legal-nav" aria-label="Dokumen kebijakan"><a href="#/privasi">Kebijakan privasi</a><a href="#/data-pribadi">Penggunaan data pribadi</a><a href="#/ketentuan-layanan">Ketentuan layanan</a></nav></section><section class="rail-card rail-card-soft"><span class="rail-eyebrow">Ada yang perlu dikoreksi?</span><p>Hubungi admin dan sebutkan email akun. Jangan kirim kata sandi atau OTP.</p><a class="text-link" href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Hubungi admin</a></section></aside>`;
    if (legalPage) return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>${escapeHtml(page.title)}</span></nav><section class="info-layout info-layout-legal"><div class="info-main"><div class="page-heading"><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></div>${pageContent}</div>${legalRail}</section>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>${escapeHtml(page.title)}</span></nav><section class="page-panel"><div class="page-heading"><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></div>${pageContent}</section>`;
  }

  function renderFaq() {
    const items = [
      ['Apa yang saya dapat setelah membeli produk digital?', 'Produk dapat berupa akses, kode, atau lisensi. Jenis yang berlaku untuk suatu produk dijelaskan pada bagian aktivasi dan ketentuannya.'],
      ['Berapa lama proses aktivasi?', 'Estimasi proses dapat berbeda pada setiap produk. Periksa informasi proses pada halaman detail produk sebelum melanjutkan.'],
      ['Apakah saya perlu akun layanan tertentu?', 'Beberapa produk memerlukan akun pribadi atau akun tujuan. Persyaratan dicantumkan pada detail masing-masing produk.'],
      ['Bagaimana saya mendapat harga reseller?', 'Pembelian bulk membuka harga reseller secara permanen pada produk yang dibeli. Paket satu kali mulai Rp149.000 membuka harga reseller di seluruh katalog setelah pembayaran diverifikasi.'],
      ['Kapan pesanan dianggap lunas?', 'Status berubah setelah notifikasi atau pemeriksaan transaksi mengonfirmasi pembayaran berhasil.'],
    ];
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>FAQ</span></nav>
      <section class="info-layout info-layout-faq">
        <div class="info-main"><div class="page-heading"><h1>Pertanyaan yang sering diajukan</h1><p>Jawaban soal produk, pembayaran, dan harga reseller.</p></div>
          <label class="faq-search">Cari pertanyaan<input type="search" placeholder="Contoh: pembayaran atau reseller" data-faq-search /></label>
          <div class="faq-topics" role="group" aria-label="Filter pertanyaan"><button class="is-active" type="button" data-faq-topic="semua" aria-pressed="true">Semua</button><button type="button" data-faq-topic="produk" aria-pressed="false">Produk</button><button type="button" data-faq-topic="pembayaran" aria-pressed="false">Pembayaran</button><button type="button" data-faq-topic="reseller" aria-pressed="false">Reseller</button></div>
          <div class="faq-list">${items.map(([question,answer], index) => { const topic = index < 3 ? 'produk' : index === 3 ? 'reseller' : 'pembayaran'; return `<details data-faq-item data-topic="${topic}" data-search="${escapeHtml(`${question} ${answer}`.toLocaleLowerCase('id-ID'))}"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`; }).join('')}<p class="faq-empty" data-faq-empty hidden>Tidak ada pertanyaan yang cocok. Coba kata kunci lain.</p></div>
          <div class="faq-support"><div><strong>Belum menemukan jawabannya?</strong><span>Hubungi admin dengan nomor pesanan jika pertanyaannya terkait transaksi.</span></div><a class="button button-primary" href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Hubungi admin</a></div>
        </div>
        <aside class="info-side-rail faq-side-rail"><section class="rail-card"><span class="rail-eyebrow">Bantuan</span><h2>Masih ada pertanyaan?</h2><p>Hubungi admin jika butuh bantuan terkait pesanan atau akun.</p><a class="rail-link" href="https://t.me/Mubacs" target="_blank" rel="noopener noreferrer">Hubungi admin ${feather('arrow-right')}</a></section><section class="rail-card rail-card-soft"><span class="rail-eyebrow">Harga reseller</span><p>Pembelian bulk membuka harga khusus pada produk yang sama.</p><a class="rail-link" href="#/program-reseller">Lihat program reseller ${feather('arrow-right')}</a></section></aside>
      </section>`;
  }

  function renderAuthPage(path, params) {
    const register = path === '/daftar';
    const next = params.get('next') || '';
    const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/admin') ? next : '';
    const title = register ? 'Buat akun Bacshop' : 'Masuk ke Bacshop';
    const errors = { unavailable: 'Login Google sedang disiapkan. Gunakan email untuk masuk.', limited: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.', busy: 'Login Google sedang sibuk. Coba lagi sebentar.', expired: 'Sesi login Google berakhir. Silakan coba lagi.', cancelled: 'Login Google dibatalkan. Kamu bisa mencoba lagi.', failed: 'Login Google belum berhasil. Silakan coba lagi.', link_required: 'Email ini sudah memiliki akun Bacshop. Masuk menggunakan kata sandi akun tersebut.' };
    const googleError = errors[params.get('google_error')] || '';
    const googleContent = '<img src="/assets/google-logo.png" width="20" height="20" alt="" /><span>Lanjutkan dengan Google</span>';
    const visual = STOREFRONT.authVisual || {};
    return `<section class="auth-layout"><div class="auth-page"><div class="auth-card"><div class="auth-heading"><h1>${title}</h1><p>${register ? 'Buat akun untuk mulai belanja.' : 'Masuk untuk lanjut belanja.'}</p></div>${googleError ? `<p class="form-message is-error" role="alert">${escapeHtml(googleError)}</p>` : ''}${AUTH_OPTIONS.googleAvailable ? `<a class="auth-google-button" href="/api/auth/google/start?next=${encodeURIComponent(safeNext || '/akun')}">${googleContent}</a>` : `<button class="auth-google-button" type="button" disabled>${googleContent}</button><p class="auth-google-note">Login Google sedang disiapkan.</p>`}<div class="auth-divider"><span>atau gunakan email</span></div><form class="customer-auth-form" data-customer-auth="${register ? 'register' : 'login'}"><input type="hidden" name="next" value="${escapeHtml(safeNext)}" />${register ? `<label>Nama lengkap<input name="name" type="text" autocomplete="name" minlength="2" maxlength="80" required /></label>` : ''}<label>Email<input name="email" type="email" autocomplete="email" required /></label><label>Kata sandi<span class="auth-password-field"><input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="10" required /><button class="auth-password-toggle" type="button" data-password-toggle aria-label="Tampilkan kata sandi" aria-pressed="false">${feather('eye')}</button></span></label><p class="form-message" data-auth-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">${register ? 'Buat akun' : 'Masuk'}</button></form><p class="auth-switch">${register ? 'Sudah punya akun?' : 'Belum punya akun?'} <a href="#/${register ? 'masuk' : 'daftar'}${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ''}">${register ? 'Masuk' : 'Daftar'}</a></p><p class="auth-legal-links">Dengan melanjutkan, kamu menyetujui <a href="#/ketentuan-layanan">Ketentuan layanan</a> dan <a href="#/privasi">Kebijakan privasi</a>.</p></div></div><aside class="auth-story auth-visual" aria-label="Gambar auth">${visual.image ? `<img class="auth-visual-image" src="${escapeHtml(visual.image)}" alt="${escapeHtml(visual.alt || 'Gambar halaman masuk Bacshop')}" />` : '<div class="auth-visual-placeholder"><span>Gambar auth</span><small>1440 × 1800 px · 4:5</small></div>'}</aside></section>`;
  }

  function renderAccountPage() {
    if (!currentUser) return `<section class="page-panel"><div class="empty-state"><h1>Masuk untuk membuka akun</h1><p>Profil, pesanan, dan harga reseller tersedia setelah kamu masuk.</p><a class="button button-primary" href="#/masuk?next=%2Fakun">Masuk</a></div></section>`;
    const avatar = currentUser.avatarUrl ? `<img src="${escapeHtml(currentUser.avatarUrl)}" alt="Foto profil ${escapeHtml(currentUser.name)}" />` : `<span>${escapeHtml(currentUser.name.slice(0, 1).toLocaleUpperCase('id-ID'))}</span>`;
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Akun</span></nav><section class="page-panel account-page"><div class="page-heading"><h1>Akun</h1><p>Kelola informasi akun dan lihat aktivitas belanjamu.</p></div><div class="account-grid"><section class="account-profile-card"><div class="account-profile-head"><div class="avatar-large">${avatar}</div><div><h2>${escapeHtml(currentUser.name)}</h2><p>${escapeHtml(currentUser.email)}</p>${currentUser.isReseller ? '<span class="status-pill status-success">Reseller</span>' : '<span class="status-pill">Buyer</span>'}</div></div><form class="profile-form" data-profile-form><label>Nama lengkap<input name="name" value="${escapeHtml(currentUser.name)}" minlength="2" maxlength="80" required /></label><label>Foto profil<div class="custom-file-control"><input class="custom-file-input" type="file" accept="image/png,image/jpeg,image/webp" data-avatar-upload aria-label="Pilih foto profil" /><button class="button" type="button" data-trigger-avatar-file>${feather('upload')}<span>Pilih foto</span></button><span data-avatar-file-name>PNG, JPEG, atau WebP · maks. 5 MB</span></div></label><p class="form-message" data-profile-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan profil</button></form></section><nav class="account-menu-card" aria-label="Menu akun"><a href="#/pesanan"><span>Pesanan</span>${feather('arrow-right')}</a><a href="#/program-reseller"><span>${currentUser.isReseller ? 'Harga reseller' : 'Program reseller'}</span>${feather('arrow-right')}</a><button type="button" data-user-logout>Keluar dari akun</button></nav></div></section>`;
  }

  function orderStatusText(order) {
    if (order.paymentStatus === 'cancelled') return 'Belum terkonfirmasi';
    if (order.paymentStatus === 'refunded') return 'Dana dikembalikan';
    if (order.paymentStatus === 'paid' && order.refundStatus === 'requested') return 'Refund diproses';
    if (order.paymentStatus === 'paid' && order.fulfillmentStatus === 'fulfilled') return 'Selesai';
    if (order.paymentStatus === 'paid') return 'Pembayaran terverifikasi';
    if (order.paymentInitialized === false) return 'Pesanan dikonfirmasi';
    return 'Menunggu pembayaran';
  }

  function orderStatusClass(order) {
    if (order.paymentStatus === 'refunded') return 'status-danger';
    if (order.refundStatus === 'requested') return 'status-warning';
    return order.paymentStatus === 'paid' ? 'status-success' : 'status-warning';
  }

  function renderOrdersPage(orders) {
    const entries = orders.map((order) => {
      const items = order.kind === 'reseller-plan'
        ? 'Paket reseller'
        : order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}${(item.specifications || []).length ? ' · ' + item.specifications.map((specification) => escapeHtml(specification.name) + ': ' + escapeHtml(specification.label)).join(', ') : ''}`).join(', ');
      return `<a class="order-card" href="#/pesanan/${encodeURIComponent(order.id)}"><span class="order-card-top"><strong>${escapeHtml(order.id)}</strong><span class="status-pill ${orderStatusClass(order)}">${orderStatusText(order)}</span></span><span class="order-card-items">${items}</span><span class="order-card-bottom"><span>${new Date(order.createdAt).toLocaleString('id-ID')}</span><strong>${rupiah(order.total)}</strong></span></a>`;
    }).join('');
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><span>Pesanan</span></nav><section class="page-panel orders-page"><div class="page-heading"><h1>Pesanan</h1><p>Pantau pembayaran dan pemenuhan secara terpisah.</p></div>${entries ? `<div class="orders-list">${entries}</div>` : `<div class="empty-state"><h2>Belum ada pesanan</h2><p>Pesanan yang kamu buat akan tercatat di sini.</p><a class="button button-primary" href="#/kategori/semua">Mulai belanja</a></div>`}</section>`;
  }

  function renderOrderDetailPage(order) {
    const isPlan = order.kind === 'reseller-plan';
    const isPaid = order.paymentStatus === 'paid';
    const isRefunded = order.paymentStatus === 'refunded';
    const isRefundPending = isPaid && order.refundStatus === 'requested';
    const hasQr = Boolean(order.qrisImage);
    const canCheckPayment = !isPaid && !isRefunded && hasQr;
    const canCheckRefund = isRefundPending;
    const details = isPlan ? '<li><span>Akses</span><strong>Harga reseller seluruh katalog · permanen</strong></li>' : order.items.map((item) => {
      const selections = (item.specifications || []).map((specification) => escapeHtml(specification.name) + ': ' + escapeHtml(specification.label)).join(' · ');
      return `<li><span>${escapeHtml(item.name)} × ${item.quantity}${selections ? `<small class="order-specification-copy">${selections}</small>` : ''}</span><strong>${rupiah(item.lineTotal)}</strong></li>`;
    }).join('');
    const qr = canCheckPayment ? `<div class="qris-frame"><img src="${escapeHtml(order.qrisImage)}" alt="QRIS untuk pesanan ${escapeHtml(order.id)}" /></div>` : '';
    const paymentMessage = isRefundPending
      ? '<p class="payment-pending-copy" role="status">Permintaan pengembalian dana sedang diproses. Status pesanan akan diperbarui otomatis.</p>'
      : isPaid
      ? '<p class="payment-success-copy" role="status">Pembayaran berhasil dikonfirmasi.</p>'
      : isRefunded
        ? '<p class="payment-pending-copy" role="status">Dana pesanan ini sudah dikembalikan.</p>'
        : hasQr
          ? '<p class="payment-pending-copy" role="status">Pembayaran belum terkonfirmasi. Status akan diperiksa otomatis.</p>'
        : '<p class="payment-success-copy" role="status">Pesanan sudah tersimpan. QRIS khusus pesanan ini siap dibuat saat kamu melanjutkan pembayaran.</p>';
    const expires = order.paymentExpiresAt ? `<p class="qris-expiration">Berlaku sampai ${escapeHtml(new Date(order.paymentExpiresAt).toLocaleString('id-ID'))}</p>` : '';
    const detailStatus = isRefunded ? 'Dana dikembalikan' : isRefundPending ? 'Refund diproses' : isPaid ? 'Pembayaran terverifikasi' : order.paymentInitialized === false ? 'Pesanan dikonfirmasi' : 'Menunggu pembayaran';
    const detailStatusClass = isRefunded ? 'status-danger' : isRefundPending ? 'status-warning' : isPaid ? 'status-success' : 'status-warning';
    const paymentAction = !isPaid && !isRefunded && !hasQr && order.paymentStatus === 'pending'
      ? '<button class="button button-primary" type="button" data-create-qris>Buat QRIS &amp; lanjut bayar</button><p class="checkout-error" data-qris-error role="status" aria-live="polite" hidden></p>'
      : '';
    const editHref = checkoutItemsOverride?.length === 1
      ? `#/produk/${encodeURIComponent(PRODUCTS.find((product) => product.id === checkoutItemsOverride[0].id)?.slug || '')}`
      : '#/keranjang';
    const shouldPollStatus = order.paymentStatus === 'pending' && hasQr || isRefundPending;
    const checkStatusButton = canCheckRefund
      ? '<button class="button button-primary" type="button" data-refresh-order>Periksa refund</button>'
      : canCheckPayment ? '<button class="button button-primary" type="button" data-refresh-order>Periksa pembayaran</button>' : '';
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/pesanan">Pesanan</a><span aria-hidden="true">›</span><span>${escapeHtml(order.id)}</span></nav><section class="page-panel order-detail-page"><div class="order-detail-heading"><div><span class="product-category">${escapeHtml(order.id)}</span><h1>${order.kind === 'reseller-plan' ? 'Detail paket reseller' : 'Pesanan dikonfirmasi'}</h1><p>${new Date(order.createdAt).toLocaleString('id-ID')}</p></div><span class="status-pill ${detailStatusClass}">${detailStatus}</span></div>${checkoutStepsMarkup(3, isPaid)}<div class="order-detail-grid"><div><section class="order-detail-card"><h2>Rincian</h2><ul class="term-list">${details}</ul><div class="summary-total"><span>Total pesanan</span><strong>${rupiah(order.total)}</strong></div></section><section class="order-detail-card"><h2>Langkah berikutnya</h2><p>${isRefundPending ? 'Pengembalian dana penuh sedang diproses.' : isPaid ? 'Pembayaran sudah terverifikasi. Pesanan akan diproses sesuai keterangan produk.' : hasQr ? 'Selesaikan pembayaran dengan QRIS di samping.' : 'Buat QRIS dinamis untuk pesanan ini, lalu bayar sesuai nominal yang tertera.'}</p></section></div><aside class="order-payment-card ${isPaid && !isRefundPending ? 'is-paid' : ''}" data-payment-order="${escapeHtml(order.id)}" data-payment-poll="${shouldPollStatus ? 'true' : 'false'}"><h2>${isRefundPending ? 'Refund berjalan' : isPaid ? 'Pembayaran berhasil' : isRefunded ? 'Status pesanan' : hasQr ? 'Bayar dengan QRIS' : 'Pembayaran'}</h2>${qr}${expires}${paymentMessage}<strong class="payment-amount">${rupiah(order.total)}</strong>${paymentAction}${checkStatusButton}${isPlan ? `<details class="order-terms"><summary>Syarat paket reseller</summary><p>${escapeHtml(order.resellerTerms || '')}</p></details>` : ''}</aside></div><a class="text-link" href="#/pesanan">Kembali ke pesanan</a></section>`;
  }

  function renderCheckoutPage() {
    const checkoutCart = checkoutItemsOverride || cart;
    const items = checkoutCart.map((item) => {
      const product = PRODUCTS.find((entry) => entry.id === item.id);
      const selection = resolveClientSpecifications(product, item.specifications);
      return product && selection ? { ...item, product, unitPrice: selection.unitPrice, specificationText: selection.chosen.map((entry) => entry.name + ': ' + entry.label).join(' · ') } : null;
    }).filter(Boolean);
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    if (!items.length) return `<section class="page-panel"><div class="empty-state"><h1>Keranjang masih kosong</h1><p>Pilih produk dari katalog sebelum melanjutkan.</p><a class="button button-primary" href="#/kategori/semua">Lihat katalog</a></div></section>`;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a><span aria-hidden="true">›</span><a href="#/keranjang">Keranjang</a><span aria-hidden="true">›</span><span>Konfirmasi</span></nav>
      <section class="page-panel checkout-page">
        <div class="page-heading"><h1>Konfirmasi pesanan</h1><p>Pastikan produk, spesifikasi, dan jumlahnya sudah sesuai.</p></div>
        ${checkoutStepsMarkup(2)}
        <div class="checkout-layout">
          <div class="checkout-payment-column">
            <section class="checkout-payment-panel checkout-confirmation-panel"><p class="checkout-section-kicker">Informasi pesanan</p><h2>Akun penerima</h2>
              <div class="checkout-account-note"><span>Pesanan digital untuk</span><strong>${escapeHtml(currentUser?.name || 'Akun Bacshop')}</strong><small>${escapeHtml(currentUser?.email || '')}</small></div>
              <p class="checkout-payment-explainer">QRIS untuk pembayaran dibuat setelah kamu mengonfirmasi pesanan.</p>
            </section>
            <section class="checkout-order-panel checkout-order-review"><header><strong>Produk yang dipesan</strong><span>${itemCount} item</span></header><div class="checkout-order-list">${items.map((item) => `<div class="checkout-item"><div class="checkout-item-thumb ${item.product.image ? 'product-media' : 'image-placeholder'}" ${item.product.image ? `style="background-image:url('${escapeHtml(item.product.image)}')"` : ''} role="img" aria-label="Gambar ${escapeHtml(item.product.name)}"></div><span><strong>${escapeHtml(item.product.name)}</strong>${item.specificationText ? `<small>${escapeHtml(item.specificationText)}</small>` : ''}<small>${item.quantity} × ${rupiah(item.unitPrice)}</small></span><strong>${rupiah(item.unitPrice * item.quantity)}</strong></div>`).join('')}</div></section>
          </div>
          <aside class="checkout-total-card"><h2>Total pesanan</h2><div class="summary-line"><span>Subtotal · ${itemCount} item</span><span>${rupiah(total)}</span></div><div class="summary-line"><span>Biaya layanan</span><span>Gratis</span></div><div class="summary-total"><span>Total</span><strong>${rupiah(total)}</strong></div><button class="button button-primary" type="button" data-confirm-order>Konfirmasi pesanan</button><p class="summary-note">QRIS dibuat setelah pesanan dikonfirmasi, pada halaman pembayaran.</p><p class="checkout-error" data-order-error role="status" aria-live="polite" hidden></p><a class="checkout-edit-cart" href="${checkoutItemsOverride?.length === 1 ? `#/produk/${encodeURIComponent(items[0].product.slug)}` : '#/keranjang'}">${checkoutItemsOverride?.length === 1 ? 'Kembali ke produk untuk mengubah pilihan' : 'Kembali ke keranjang untuk ubah jumlah'}</a></aside>
        </div>
      </section>`;
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
    app.querySelector('[data-trigger-avatar-file]')?.addEventListener('click', () => app.querySelector('[data-avatar-upload]')?.click());
    app.querySelectorAll('[data-password-toggle]').forEach((button) => button.addEventListener('click', () => {
      const input = button.closest('.auth-password-field')?.querySelector('input');
      if (!input) return;
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      button.innerHTML = feather(visible ? 'eye-off' : 'eye');
    }));
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
        const filename = app.querySelector('[data-avatar-file-name]');
        if (filename) filename.textContent = input.files?.[0]?.name || '';
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

    app.querySelector('[data-confirm-order]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const directItems = checkoutItemsOverride;
        const result = await requestApi('/api/orders', { method: 'POST', body: { items: directItems || cart } });
        if (!directItems) writeCart([]);
        writeCheckoutOverride(null);
        window.location.hash = `#/pesanan/${encodeURIComponent(result.order.id)}`;
      } catch (error) {
        button.disabled = false;
        const message = app.querySelector('[data-order-error]');
        if (message) { message.hidden = false; message.textContent = error.message; }
        else showToast(error.message);
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

    app.querySelector('[data-refresh-order]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const orderId = window.location.hash.match(/^#\/pesanan\/([^?]+)/)?.[1];
      if (!orderId) return;
      button.disabled = true;
      try {
        await requestApi(`/api/orders/${encodeURIComponent(decodeURIComponent(orderId))}/check-payment`, { method: 'POST', body: {} });
        await render();
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });

    app.querySelector('[data-create-qris]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const orderId = app.querySelector('[data-payment-order]')?.dataset.paymentOrder;
      if (!orderId) return;
      button.disabled = true;
      button.textContent = 'Membuat QRIS…';
      const message = app.querySelector('[data-qris-error]');
      if (message) { message.hidden = true; message.textContent = ''; }
      try {
        await requestApi(`/api/orders/${encodeURIComponent(orderId)}/create-qris`, { method: 'POST', body: {} });
        await render();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Coba buat QRIS lagi';
        if (message) { message.hidden = false; message.textContent = error.message; }
        else showToast(error.message);
      }
    });
  }

  function adminAuthPage(setupRequired) {
    const title = setupRequired ? 'Siapkan akun admin' : 'Masuk admin';
    const formFields = setupRequired
      ? `<label>Kode setup<input name="code" type="password" autocomplete="off" required /></label><label>Email admin<input name="email" type="email" autocomplete="email" required /></label><label>Kata sandi baru<input name="password" type="password" autocomplete="new-password" minlength="12" required /><small>Minimal 12 karakter. Gunakan kata sandi yang unik.</small></label>`
      : `<label>Email admin<input name="email" type="email" autocomplete="username" required /></label><label>Kata sandi<input name="password" type="password" autocomplete="current-password" required /></label>`;
    return `<div class="admin-page"><header class="admin-auth-head"><a class="brand" href="#/">Bacshop</a><span>Admin</span></header><main class="admin-auth-card"><h1>${title}</h1><p>${setupRequired ? 'Masukkan kode setup dari pengelola Bacshop, lalu buat akun admin.' : 'Katalog dan status stok hanya dapat diubah setelah masuk.'}</p><form class="admin-auth-form" data-admin-auth="${setupRequired ? 'setup' : 'login'}">${formFields}<p class="admin-form-message" data-admin-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">${setupRequired ? 'Buat akun admin' : 'Masuk'}</button></form><a class="admin-back-link" href="#/">Kembali ke toko</a></main></div>`;
  }

  function customDropdown(name, label, options, selectedValue, className = '', extraInputAttributes = '') {
    const selected = options.find((option) => String(option.value) === String(selectedValue)) || options[0] || { value: '', label: 'Pilih' };
    const menu = options.map((option) => `<button class="custom-dropdown-option" type="button" role="option" data-dropdown-option="${escapeHtml(option.value)}" data-option-label="${escapeHtml(option.label)}" ${option.minimum !== undefined ? `data-option-minimum="${Number(option.minimum)}"` : ''} ${option.slug ? `data-option-slug="${escapeHtml(option.slug)}"` : ''} aria-selected="${String(option.value) === String(selected.value)}">${escapeHtml(option.label)}${String(option.value) === String(selected.value) ? feather('check') : ''}</button>`).join('');
    return `<div class="custom-dropdown ${className}" data-admin-select><input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(selected.value)}" data-dropdown-value data-label="${escapeHtml(selected.label)}" ${selected.minimum !== undefined ? `data-minimum="${Number(selected.minimum)}"` : ''} ${selected.slug ? `data-slug="${escapeHtml(selected.slug)}"` : ''} ${extraInputAttributes} /><button class="custom-dropdown-trigger" type="button" aria-label="${escapeHtml(label)}: ${escapeHtml(selected.label)}" aria-haspopup="listbox" aria-expanded="false" data-dropdown-trigger><span data-dropdown-label>${escapeHtml(selected.label)}</span>${feather('chevron-right','custom-dropdown-chevron')}</button><div class="custom-dropdown-menu" role="listbox" aria-label="${escapeHtml(label)}" hidden>${menu}</div></div>`;
  }

  function imageUploadField(label, value = '') {
    const filename = value ? value.split('/').pop() : 'Belum ada gambar';
    return `<div class="admin-image-field admin-wide"><span class="admin-field-label">${escapeHtml(label)}</span><div class="admin-image-upload"><input data-image-target type="hidden" value="${escapeHtml(value)}" /><div class="admin-upload-preview" data-image-preview>${value ? `<img src="${escapeHtml(value)}" alt="Pratinjau ${escapeHtml(label.toLocaleLowerCase('id-ID'))}" />` : `<span>${feather('image')}<small>Pratinjau gambar</small></span>`}</div><div class="admin-upload-controls"><button class="button admin-upload-button" type="button" data-trigger-file>${feather('upload')}<span>Pilih gambar</span></button><input class="custom-file-input" type="file" accept="image/png,image/jpeg,image/webp" data-image-upload aria-label="Pilih ${escapeHtml(label.toLocaleLowerCase('id-ID'))}" /><span class="admin-upload-name" data-image-name>${escapeHtml(filename)}</span><small>PNG, JPEG, atau WebP · maks. 5 MB</small></div></div></div>`;
  }

  function specificationOptionField(option = {}, index = 0, onlyOption = false) {
    return `<div class="admin-specification-option" data-specification-option><input type="hidden" data-option-value value="${escapeHtml(option.value || '')}" /><label>Nama opsi<input data-option-label value="${escapeHtml(option.label || '')}" required maxlength="100" placeholder="Contoh: 1 bulan" /></label><label>Penyesuaian harga (Rp)<input data-option-adjustment type="number" step="1" value="${Number(option.priceAdjustment) || 0}" /><small>Isi 0 untuk harga normal, angka minus untuk potongan.</small></label><button class="button button-small admin-spec-remove-option" type="button" data-remove-specification-option aria-label="Hapus opsi ${index + 1}" ${onlyOption ? 'disabled' : ''}>Hapus</button></div>`;
  }

  function specificationField(specification = {}, index = 0) {
    const options = Array.isArray(specification.options) && specification.options.length ? specification.options : [{ value: '', label: '', priceAdjustment: 0 }];
    return `<fieldset class="admin-specification-row" data-specification-row><legend data-specification-legend>Spesifikasi ${index + 1}</legend><input type="hidden" data-specification-id value="${escapeHtml(specification.id || '')}" /><div class="admin-specification-head"><label>Nama pilihan<input data-specification-name value="${escapeHtml(specification.name || '')}" required maxlength="80" placeholder="Contoh: Durasi" /></label><label class="admin-specification-required"><input type="checkbox" data-specification-required ${specification.required === false ? '' : 'checked'} /><span>Wajib dipilih</span></label><button class="button button-small admin-spec-remove" type="button" data-remove-specification>Hapus pilihan</button></div><div class="admin-specification-options" data-specification-options>${options.map((option, optionIndex) => specificationOptionField(option, optionIndex, options.length === 1)).join('')}</div><button class="button button-small admin-spec-add-option" type="button" data-add-specification-option>Tambah opsi</button></fieldset>`;
  }

  function specificationEditor(product) {
    const specifications = Array.isArray(product.specifications) ? product.specifications : [];
    return `<section class="admin-specification-editor admin-wide" data-specification-editor><div class="admin-specification-editor-heading"><div><span class="admin-field-label">Spesifikasi dan varian</span><p>Tentukan pilihan yang akan dilihat pembeli. Harga tiap opsi mengikuti harga produk dan penyesuaiannya.</p></div><button class="button button-small" type="button" data-add-specification>Tambah pilihan</button></div><p class="admin-specification-empty" data-no-specifications ${specifications.length ? 'hidden' : ''}>Belum ada pilihan tambahan untuk produk ini.</p><div class="admin-specification-list" data-specification-list>${specifications.map((specification, index) => specificationField(specification, index)).join('')}</div></section>`;
  }

  function uniqueSpecificationKey(label, used, limit) {
    const base = String(label || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, limit).replace(/-+$/g, '') || 'pilihan';
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      const ending = `-${suffix++}`;
      candidate = `${base.slice(0, Math.max(1, limit - ending.length)).replace(/-+$/g, '')}${ending}`;
    }
    used.add(candidate);
    return candidate;
  }

  function specificationsFromEditor(form) {
    const rows = [...form.querySelectorAll('[data-specification-row]')];
    if (rows.length > 8) throw new Error('Satu produk dapat memiliki maksimal 8 spesifikasi.');
    const usedIds = new Set();
    return rows.map((row) => {
      const name = row.querySelector('[data-specification-name]')?.value.trim() || '';
      if (!name) throw new Error('Isi nama setiap spesifikasi produk.');
      const storedId = row.querySelector('[data-specification-id]')?.value || '';
      const id = /^[a-z0-9-]{1,48}$/.test(storedId) && !usedIds.has(storedId)
        ? (usedIds.add(storedId), storedId)
        : uniqueSpecificationKey(name, usedIds, 48);
      const optionRows = [...row.querySelectorAll('[data-specification-option]')];
      if (!optionRows.length || optionRows.length > 30) throw new Error(`Tambahkan 1–30 opsi untuk ${name}.`);
      const usedValues = new Set();
      const labels = new Set();
      const options = optionRows.map((optionRow) => {
        const label = optionRow.querySelector('[data-option-label]')?.value.trim() || '';
        if (!label) throw new Error(`Isi nama semua opsi pada ${name}.`);
        const normalizedLabel = label.toLocaleLowerCase('id-ID');
        if (labels.has(normalizedLabel)) throw new Error(`Opsi pada ${name} tidak boleh memiliki nama yang sama.`);
        labels.add(normalizedLabel);
        const storedValue = optionRow.querySelector('[data-option-value]')?.value || '';
        const value = /^[a-z0-9-]{1,64}$/.test(storedValue) && !usedValues.has(storedValue)
          ? (usedValues.add(storedValue), storedValue)
          : uniqueSpecificationKey(label, usedValues, 64);
        const rawAdjustment = optionRow.querySelector('[data-option-adjustment]')?.value ?? '0';
        const priceAdjustment = rawAdjustment === '' ? 0 : Number(rawAdjustment);
        if (!Number.isSafeInteger(priceAdjustment)) throw new Error(`Penyesuaian harga untuk ${label} harus berupa bilangan bulat.`);
        return { value, label, priceAdjustment };
      });
      return { id, name, required: Boolean(row.querySelector('[data-specification-required]')?.checked), options };
    });
  }

  function productFields(product, isNew = false) {
    const termsText = Object.entries(product.terms || {}).map(([label,value]) => `${label}: ${value}`).join('\n');
    const categories = CATEGORIES.map((category) => ({ value: category.slug, label: category.name }));
    return `<form class="admin-product-form" data-product-form="${isNew ? '' : escapeHtml(product.id)}" ${isNew ? 'data-product-create' : ''}>
      <div class="admin-fields">${isNew ? '<label>ID produk<input name="id" pattern="[a-z0-9-]+" required maxlength="64" placeholder="contoh: ai-studio-plus" /></label>' : ''}
        <label>Nama produk<input name="name" value="${escapeHtml(product.name || '')}" required maxlength="180" /></label>
        <label>Slug URL<input name="slug" value="${escapeHtml(product.slug || '')}" required maxlength="180" /></label>
        <div class="admin-field"><span class="admin-field-label">Kategori</span>${customDropdown('category', 'Kategori produk', categories, product.category || categories[0]?.value, 'admin-dropdown')}</div>
        <label>Harga retail (Rp)<input name="price" type="number" min="1" step="1000" value="${Number(product.price) || ''}" required /></label>
        <label>Harga reseller (Rp)<input name="resellerPrice" type="number" min="1" step="1000" value="${product.resellerPrice ?? ''}" /><small>Kosongkan bila produk belum memiliki harga reseller.</small></label>
        <label>Minimum bulk<input name="bulkMinimum" type="number" min="2" max="99" step="1" value="${product.bulkMinimum ?? ''}" /><small>Harga khusus terbuka setelah jumlah ini dibayar dan diverifikasi.</small></label>
        <label>Stok tersedia<input name="stock" type="number" min="0" max="1000000" step="1" value="${product.stock ?? ''}" placeholder="Tidak dibatasi" /><small>Kosongkan untuk produk digital tanpa batas stok. Pesanan tertunda ikut menahan stok.</small></label>
        <label>Durasi<input name="duration" value="${escapeHtml(product.duration || '')}" required maxlength="180" /></label>
        <label>Cara pemenuhan<input name="fulfillment" value="${escapeHtml(product.fulfillment || '')}" required maxlength="180" /></label>
        <label>Tanggal produk<input name="createdAt" type="text" inputmode="numeric" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" placeholder="YYYY-MM-DD" value="${escapeHtml(product.createdAt || new Date().toISOString().slice(0, 10))}" required /><small>Gunakan format tahun-bulan-tanggal.</small></label>
        <div class="admin-field"><span class="admin-field-label">Status pesanan</span>${customDropdown('orderMode', 'Status pesanan', [{ value: 'ready', label: 'Bisa dipesan' }, { value: 'preorder', label: 'Pre-order' }], product.orderMode || 'ready', 'admin-dropdown')}</div>
        <label class="admin-wide">Deskripsi<textarea name="description" rows="3" maxlength="2400" required>${escapeHtml(product.description || '')}</textarea></label>
        <label class="admin-wide">Ketentuan produk<textarea name="terms" rows="5" spellcheck="false">${escapeHtml(termsText)}</textarea><small>Satu ketentuan per baris, format: Nama: keterangan.</small></label>
        ${specificationEditor(product)}
        ${imageUploadField('Gambar produk', product.image || '')}
        <label class="admin-confirm-stock"><input name="preOrderConfirmed" type="checkbox" ${product.preOrderConfirmed ? 'checked' : ''} /><span><strong>Stok pre-order sudah dikonfirmasi</strong><small>Pemesanan dibuka setelah stok dipastikan.</small></span></label>
      </div><p class="admin-form-message" data-admin-message role="status" aria-live="polite"></p><div class="admin-form-actions"><button class="button button-primary" type="submit">${isNew ? 'Tambah produk' : 'Simpan perubahan'}</button>${isNew ? '' : `<button class="button button-danger" type="button" data-delete-product="${escapeHtml(product.id)}">Hapus produk</button>`}</div>
    </form>`;
  }

  function cmsRow(kind, item, index) {
    const category = kind === 'category';
    const label = category ? 'Kategori' : kind === 'banner' ? 'Banner' : 'Promo';
    return `<fieldset class="admin-cms-row" data-cms-row="${kind}"><legend>${label} ${index + 1}</legend><input type="hidden" data-field="id" value="${escapeHtml(item.id || item.slug || `${kind}-${index + 1}`)}" />
      ${category ? `<label>Nama kategori<input data-field="name" value="${escapeHtml(item.name || '')}" required maxlength="80" /></label><label>Slug<input data-field="slug" value="${escapeHtml(item.slug || '')}" pattern="[a-z0-9-]+" required /></label>${imageUploadField('Gambar kategori', item.image || '')}` : `<label>Judul<input data-field="title" value="${escapeHtml(item.title || '')}" maxlength="120" /></label><label>Tujuan (contoh: #/kategori/semua)<input data-field="href" value="${escapeHtml(item.href || '#/kategori/semua')}" required /></label><label class="admin-wide">Keterangan<textarea data-field="description" rows="2" maxlength="300">${escapeHtml(item.description || '')}</textarea></label>${imageUploadField(`Gambar ${label.toLocaleLowerCase('id-ID')}`, item.image || '')}<label class="cms-active-field"><input type="checkbox" data-field="active" ${item.active ? 'checked' : ''} /><span>Tampilkan di toko</span></label>`}
      <button class="button button-small button-danger" type="button" data-remove-cms-row>Hapus ${label.toLocaleLowerCase('id-ID')}</button></fieldset>`;
  }

  function renderAdminCms(storefront, path) {
    if (path === '/admin/toko/auth') {
      const visual = storefront.authVisual || {};
      return `<form class="admin-cms-form" data-storefront-form data-storefront-kind="authVisual"><section class="admin-section"><div class="admin-section-heading"><div><h2>Gambar halaman masuk & daftar</h2><p>Rekomendasi 1440 × 1800 px (4:5). Gambar mengisi panel kanan; letakkan isi penting di tengah. Panel disembunyikan pada layar kecil.</p></div></div><div class="admin-fields">${imageUploadField('Gambar auth', visual.image || '')}<label class="admin-wide">Keterangan gambar<input name="authVisualAlt" value="${escapeHtml(visual.alt || 'Gambar halaman masuk Bacshop')}" required maxlength="160" /></label><button class="button button-small" type="button" data-reset-auth-image>Kembalikan placeholder</button></div></section><p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan gambar auth</button></form>`;
    }
    if (path === '/admin/katalog/kategori') {
      return `<form class="admin-cms-form" data-storefront-form data-storefront-kind="categories"><section class="admin-section"><div class="admin-section-heading"><div><h2>Kategori katalog</h2><p>Kategori yang dipakai produk dan navigasi Belanja.</p></div><button class="button button-primary button-small" type="button" data-add-cms-row="category">Tambah kategori</button></div><div class="admin-cms-grid" data-cms-list="category">${storefront.categories.map((item, index) => cmsRow('category', item, index)).join('')}</div></section><p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan kategori</button></form>`;
    }
    if (path === '/admin/toko/banner') {
      return `<form class="admin-cms-form" data-storefront-form data-storefront-kind="banners"><section class="admin-section"><div class="admin-section-heading"><div><h2>Banner Beranda</h2><p>Atur gambar dan materi slide yang tampil di toko.</p></div><button class="button button-primary button-small" type="button" data-add-cms-row="banner">Tambah banner</button></div><div class="admin-cms-grid" data-cms-list="banner">${storefront.banners.map((item, index) => cmsRow('banner', item, index)).join('')}</div></section><p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan banner</button></form>`;
    }
    if (path === '/admin/toko/promo') {
      return `<form class="admin-cms-form" data-storefront-form data-storefront-kind="promotions"><section class="admin-section"><div class="admin-section-heading"><div><h2>Promo toko</h2><p>Kelola penawaran yang tampil di halaman Promo.</p></div><button class="button button-primary button-small" type="button" data-add-cms-row="promotion">Tambah promo</button></div><div class="admin-cms-grid" data-cms-list="promotion">${storefront.promotions.map((item, index) => cmsRow('promotion', item, index)).join('')}</div></section><p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan promo</button></form>`;
    }
    return `<form class="admin-cms-form" data-storefront-form data-storefront-kind="resellerPlan"><section class="admin-section"><div class="admin-section-heading"><div><h2>Program reseller</h2><p>Tetapkan harga paket dan ketentuan yang dilihat sebelum pembelian.</p></div></div><div class="admin-fields"><label>Harga paket (Rp)<input name="resellerPlanPrice" type="number" min="149000" step="1000" value="${Number(storefront.resellerPlan.price)}" required /></label><label class="admin-wide">Syarat dan ketentuan<textarea name="resellerPlanTerms" rows="6" maxlength="5000" required>${escapeHtml(storefront.resellerPlan.terms)}</textarea></label></div></section><p class="admin-form-message" data-cms-message role="status" aria-live="polite"></p><button class="button button-primary" type="submit">Simpan program reseller</button></form>`;
  }

  function readAdminSidebarCollapsed() {
    try { return localStorage.getItem('bacshop.admin.sidebarCollapsed') === 'true'; }
    catch { return false; }
  }

  function adminPageTitle(path) {
    const titles = {
      '/admin/produk': 'Produk',
      '/admin/katalog/kategori': 'Kategori',
      '/admin/toko/banner': 'Banner Beranda',
      '/admin/toko/auth': 'Gambar auth',
      '/admin/toko/promo': 'Promo toko',
      '/admin/toko/reseller': 'Program reseller',
      '/admin/pesanan': 'Pesanan',
      '/admin/analisa': 'Analisa',
    };
    if (path.startsWith('/admin/produk')) return 'Produk';
    if (titles[path]) return titles[path];
    if (path === '/admin/pesanan') return 'Pesanan';
    return 'Ringkasan';
  }

  function adminNavigation(path, collapsed) {
    const link = (href, label, icon, active, child = false) => `<a class="admin-nav-link${child ? ' admin-nav-child' : ''}" data-admin-nav href="${href}" aria-label="${label}" ${active ? 'aria-current="page"' : ''} title="${collapsed ? label : ''}"><span class="admin-nav-icon">${feather(icon)}</span><span class="admin-nav-label">${label}</span></a>`;
    const catalogActive = path.startsWith('/admin/produk') || path.startsWith('/admin/katalog/');
    const storeActive = path.startsWith('/admin/toko/');
    const salesActive = path === '/admin/pesanan' || path === '/admin/analisa';
    const catalogHidden = collapsed || !catalogActive;
    const storeHidden = collapsed || !storeActive;
    const salesHidden = collapsed || !salesActive;
    return `${link('#/admin', 'Ringkasan', 'home', path === '/admin')}
      <section class="admin-nav-group ${catalogActive ? 'is-active' : ''}" data-admin-nav-group>
        <button class="admin-nav-parent" type="button" data-admin-group-toggle aria-expanded="${!catalogHidden}" title="${collapsed ? 'Katalog' : ''}"><span class="admin-nav-icon">${feather('grid')}</span><span class="admin-nav-label">Katalog</span>${feather('chevron-right','admin-nav-chevron')}</button>
        <div class="admin-nav-children" data-admin-group-children ${catalogHidden ? 'hidden' : ''}>
          ${link('#/admin/produk', 'Produk', 'grid', path.startsWith('/admin/produk'), true)}
          ${link('#/admin/katalog/kategori', 'Kategori', 'tag', path === '/admin/katalog/kategori', true)}
        </div>
      </section>
      <section class="admin-nav-group ${storeActive ? 'is-active' : ''}" data-admin-nav-group>
        <button class="admin-nav-parent" type="button" data-admin-group-toggle aria-expanded="${!storeHidden}" title="${collapsed ? 'Konten toko' : ''}"><span class="admin-nav-icon">${feather('tag')}</span><span class="admin-nav-label">Konten toko</span>${feather('chevron-right','admin-nav-chevron')}</button>
        <div class="admin-nav-children" data-admin-group-children ${storeHidden ? 'hidden' : ''}>
          ${link('#/admin/toko/banner', 'Banner Beranda', 'grid', path === '/admin/toko/banner', true)}
          ${link('#/admin/toko/auth', 'Gambar auth', 'image', path === '/admin/toko/auth', true)}
          ${link('#/admin/toko/promo', 'Promo', 'tag', path === '/admin/toko/promo', true)}
          ${link('#/admin/toko/reseller', 'Program reseller', 'user', path === '/admin/toko/reseller', true)}
        </div>
      </section>
      <section class="admin-nav-group ${salesActive ? 'is-active' : ''}" data-admin-nav-group>
        <button class="admin-nav-parent" type="button" data-admin-group-toggle aria-expanded="${!salesHidden}" title="${collapsed ? 'Penjualan' : ''}"><span class="admin-nav-icon">${feather('shopping-cart')}</span><span class="admin-nav-label">Penjualan</span>${feather('chevron-right','admin-nav-chevron')}</button>
        <div class="admin-nav-children" data-admin-group-children ${salesHidden ? 'hidden' : ''}>
          ${link('#/admin/pesanan', 'Pesanan', 'shopping-cart', path === '/admin/pesanan', true)}
          ${link('#/admin/analisa', 'Analisa', 'grid', path === '/admin/analisa', true)}
        </div>
      </section>`;
  }

  function adminOrderCard(order) {
    const fulfillmentOptions = [{ value: 'not_started', label: 'Belum dimulai' }, { value: 'processing', label: 'Diproses' }, { value: 'needs_customer_input', label: 'Menunggu data pelanggan' }, { value: 'fulfilled', label: 'Selesai' }];
    return `<article class="admin-order-card"><div class="admin-order-head"><div><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.customer?.name || 'Akun tidak tersedia')} · ${escapeHtml(order.customer?.email || '')}</span></div><strong>${rupiah(order.total)}</strong></div><p>${order.kind === 'reseller-plan' ? 'Paket reseller' : order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}${(item.specifications || []).length ? ' · ' + item.specifications.map((specification) => escapeHtml(specification.name) + ': ' + escapeHtml(specification.label)).join(', ') : ''}`).join(', ')}</p><div class="admin-order-status"><span class="status-pill">Pembayaran: ${escapeHtml(order.paymentStatus)}</span><span class="status-pill">Pemenuhan: ${escapeHtml(order.fulfillmentStatus)}</span></div>${order.paymentVerification ? `<p class="admin-verified-note">Dikonfirmasi otomatis · ${new Date(order.paymentVerification.verifiedAt).toLocaleString('id-ID')}</p>` : order.paymentStatus === 'pending' && order.paymentInitialized === false ? '<p class="admin-order-help">Pesanan tersimpan. QRIS belum dibuat pada tahap ini.</p>' : order.paymentStatus === 'pending' ? '<p class="admin-order-help">Status berubah setelah pembayaran terkonfirmasi.</p>' : ''}${order.paymentStatus === 'paid' ? `<form class="admin-fulfillment-form" data-update-fulfillment="${escapeHtml(order.id)}"><div class="admin-field"><span class="admin-field-label">Status pemenuhan</span>${customDropdown('status', 'Status pemenuhan', fulfillmentOptions, order.fulfillmentStatus, 'admin-dropdown')}</div><label>Catatan pemenuhan<input name="note" maxlength="1000" value="${escapeHtml(order.fulfillmentNote || '')}" /></label><button class="button button-small button-primary" type="submit">Simpan status</button></form>` : ''}</article>`;
  }

  async function renderAdminPage(path) {
    const session = await requestApi('/api/admin/session');
    if (!session.authenticated) return adminAuthPage(session.setupRequired);
    const [productResult, storefront, orderResult] = await Promise.all([
      requestApi('/api/admin/products'), requestApi('/api/admin/storefront'), requestApi('/api/admin/orders'),
    ]);
    STOREFRONT = storefront;
    CATEGORIES = storefront.categories;
    let content;
    const productDetailMatch = path.match(/^\/admin\/produk\/([^/]+)$/);
    if (productDetailMatch) {
      const productId = safeDecode(productDetailMatch[1]);
      const selectedProduct = productResult.products.find((product) => product.id === productId);
      content = selectedProduct
        ? `<section class="admin-section admin-product-detail-page"><a class="admin-back-products" href="#/admin/produk">${feather('arrow-left')}<span>Kembali ke produk</span></a><div class="admin-product-detail-heading"><div><span class="admin-eyebrow">EDITOR PRODUK</span><h1>${escapeHtml(selectedProduct.name)}</h1><p>Perbarui informasi, harga, stok, dan gambar yang tampil di katalog.</p></div><span class="admin-product-detail-id">${escapeHtml(selectedProduct.id)}</span></div><section class="admin-product-edit-card"><div class="admin-product-edit-preview">${selectedProduct.image ? `<img src="${escapeHtml(selectedProduct.image)}" alt="Pratinjau ${escapeHtml(selectedProduct.name)}" />` : `<div class="admin-product-placeholder"><span>Pratinjau produk</span><strong>${escapeHtml(selectedProduct.name.slice(0,1).toLocaleUpperCase('id-ID'))}</strong></div>`}<div><strong>${escapeHtml(selectedProduct.name)}</strong><span>${rupiah(selectedProduct.price)} · ${selectedProduct.stock === null || selectedProduct.stock === undefined ? 'Stok tidak dibatasi' : `${Number(selectedProduct.stockAvailable ?? selectedProduct.stock).toLocaleString('id-ID')} tersedia`}</span></div></div>${productFields(selectedProduct)}</section></section>`
        : `<section class="admin-section"><a class="admin-back-products" href="#/admin/produk">${feather('arrow-left')}<span>Kembali ke produk</span></a><div class="admin-empty-state"><span class="admin-empty-icon">${feather('package')}</span><h1>Produk tidak ditemukan</h1><p>Produk mungkin sudah dihapus. Muat kembali katalog untuk memilih produk lain.</p><a class="button button-primary" href="#/admin/produk">Buka katalog produk</a></div></section>`;
    } else if (path === '/admin/produk') content = `<section class="admin-section admin-catalog-page"><div class="admin-products-heading"><div><span class="admin-eyebrow">KATALOG TOKO</span><h1>Produk</h1><p>Atur katalog, stok, dan harga produk dalam satu tempat.</p></div><span class="admin-product-count"><strong>${productResult.products.length}</strong><small>produk</small></span></div><details class="admin-product-editor admin-create-product"><summary><span class="admin-add-product-icon">${feather('plus')}</span><span class="admin-add-product-copy"><strong>Tambah produk</strong><small>Buat produk baru di katalog.</small></span><span class="admin-create-chevron">${feather('chevron-down')}</span></summary>${productFields({ category: CATEGORIES[0]?.slug, orderMode: 'ready', preOrderConfirmed: true, terms: {}, stock: null }, true)}</details><div class="admin-product-toolbar"><label class="admin-product-search">${feather('search')}<input type="search" placeholder="Cari nama atau ID produk" aria-label="Cari produk" data-admin-product-search /></label><label class="admin-select-all"><input type="checkbox" data-select-all-products /><span>Pilih semua</span></label><div class="admin-product-bulk-actions"><span data-selected-count>0 dipilih</span><button class="button button-small" type="button" data-product-bulk="archive" disabled>Arsipkan</button><button class="button button-small" type="button" data-product-bulk="restore" disabled>Pulihkan</button><button class="button button-small button-danger" type="button" data-product-bulk="delete" disabled>Hapus</button></div></div><div class="admin-product-list" data-admin-product-list>${productResult.products.map((product) => productCard(product, { variant: 'admin' })).join('') || `<div class="admin-empty-state"><span class="admin-empty-icon">${feather('package')}</span><h2>Katalog masih kosong</h2><p>Tambahkan produk pertama agar bisa tampil di toko.</p></div>`}</div></section>`;
    else if (path === '/admin/katalog/kategori') content = `<section class="admin-section"><div class="admin-products-heading"><div><span class="admin-eyebrow">KATALOG TOKO</span><h1>Kategori</h1><p>Atur kelompok produk yang tersedia di Belanja.</p></div></div>${renderAdminCms(storefront, path)}</section>`;
    else if (['/admin/toko/banner', '/admin/toko/auth', '/admin/toko/promo', '/admin/toko/reseller'].includes(path)) {
      const headings = {
        '/admin/toko/banner': ['Banner Beranda', 'Kelola slide dan gambar yang ditampilkan di halaman utama.'],
        '/admin/toko/auth': ['Gambar auth', 'Atur gambar panel kanan pada halaman masuk dan daftar.'],
        '/admin/toko/promo': ['Promo toko', 'Atur penawaran yang tampil di halaman Promo.'],
        '/admin/toko/reseller': ['Program reseller', 'Atur harga paket dan ketentuan yang tampil sebelum pembelian.'],
      };
      content = `<section class="admin-section"><div class="admin-products-heading"><div><span class="admin-eyebrow">KONTEN TOKO</span><h1>${headings[path][0]}</h1><p>${headings[path][1]}</p></div></div>${renderAdminCms(storefront, path)}</section>`;
    }
    else if (path === '/admin/pesanan') content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Pesanan</h1><p>Lihat status pembayaran dan perbarui pemenuhan pesanan.</p></div><span class="admin-product-count"><strong>${orderResult.orders.length}</strong><small>pesanan</small></span></div><div class="admin-order-list">${orderResult.orders.map(adminOrderCard).join('') || `<div class="admin-empty-state"><span class="admin-empty-icon">${feather('shopping-cart')}</span><h2>Belum ada pesanan</h2><p>Pesanan pelanggan akan muncul di sini.</p></div>`}</div></section>`;
    else if (path === '/admin/analisa') {
      const verifiedOrders = orderResult.orders.filter((order) => order.paymentStatus === 'paid' && order.status !== 'refunded');
      const grossRevenue = verifiedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const verifiedUnits = verifiedOrders.reduce((sum, order) => sum + (order.kind === 'products' ? order.items.reduce((count, item) => count + Number(item.quantity || 0), 0) : 0), 0);
      const productTotals = new Map();
      for (const order of verifiedOrders) {
        if (order.kind !== 'products') continue;
        for (const item of order.items || []) {
          const prior = productTotals.get(item.productId) || { name: item.name, quantity: 0, total: 0 };
          prior.quantity += Number(item.quantity || 0);
          prior.total += Number(item.lineTotal || 0);
          productTotals.set(item.productId, prior);
        }
      }
      const topProducts = [...productTotals.values()].sort((first, second) => second.quantity - first.quantity).slice(0, 5);
      content = `<section class="admin-section"><div class="admin-products-heading"><div><span class="admin-eyebrow">DATA TERVERIFIKASI</span><h1>Analisa penjualan</h1><p>Angka dihitung dari pesanan yang status pembayarannya sudah terverifikasi.</p></div></div><div class="admin-metrics"><a href="#/admin/pesanan"><span>Omzet terverifikasi</span><strong>${rupiah(grossRevenue)}</strong></a><a href="#/admin/pesanan"><span>Pesanan lunas</span><strong>${verifiedOrders.length}</strong></a><a href="#/admin/pesanan"><span>Unit produk terjual</span><strong>${verifiedUnits}</strong></a></div><section class="admin-section admin-analysis-table"><div class="admin-section-heading"><div><h2>Produk teratas</h2><p>Berdasarkan unit pada pesanan yang lunas.</p></div></div>${topProducts.length ? `<div class="admin-order-list">${topProducts.map((item) => `<article class="admin-order-card"><div class="admin-order-head"><strong>${escapeHtml(item.name)}</strong><strong>${item.quantity} unit</strong></div><p>Nilai pesanan tercatat ${rupiah(item.total)}</p></article>`).join('')}</div>` : `<div class="admin-empty-state"><h2>Belum ada data penjualan</h2><p>Produk teratas akan muncul setelah pembayaran pesanan terverifikasi.</p></div>`}</section></section>`;
    }
    else {
      const pending = orderResult.orders.filter((order) => order.paymentStatus === 'pending').length;
      const paid = orderResult.orders.filter((order) => order.paymentStatus === 'paid').length;
      content = `<section class="admin-section"><div class="admin-products-heading"><div><h1>Ringkasan toko</h1><p>Kelola katalog, konten, dan pesanan Bacshop.</p></div></div><div class="admin-metrics"><a href="#/admin/produk"><span>Produk</span><strong>${productResult.products.length}</strong></a><a href="#/admin/pesanan"><span>Menunggu pembayaran</span><strong>${pending}</strong></a><a href="#/admin/pesanan"><span>Pembayaran terverifikasi</span><strong>${paid}</strong></a></div><div class="admin-shortcuts"><a class="button button-primary" href="#/admin/produk">Kelola produk</a><a class="button" href="#/admin/toko/banner">Atur konten toko</a><a class="button" href="#/admin/pesanan">Periksa pesanan</a><a class="button" href="#/admin/analisa">Lihat analisa</a></div>${pending ? `<h2>Pesanan menunggu pembayaran</h2><div class="admin-order-list">${orderResult.orders.filter((order) => order.paymentStatus === 'pending').slice(0, 5).map(adminOrderCard).join('')}</div>` : ''}</section>`;
    }
    const collapsed = readAdminSidebarCollapsed();
    const title = adminPageTitle(path);
    return `<div class="admin-page admin-workspace-page${collapsed ? ' is-sidebar-collapsed' : ''}" data-admin-shell>
      <button class="admin-drawer-backdrop" type="button" data-admin-backdrop aria-label="Tutup navigasi admin"></button>
      <aside class="admin-sidebar" id="admin-navigation" aria-label="Navigasi admin">
        <div class="admin-sidebar-brand-row"><a class="admin-sidebar-brand" href="#/admin" aria-label="Bacshop admin"><span class="admin-brand-name">Bacshop</span><span>ADMIN</span></a><button class="admin-sidebar-collapse" type="button" data-admin-collapse aria-controls="admin-navigation" aria-expanded="${!collapsed}" aria-label="${collapsed ? 'Perluas' : 'Ringkas'} navigasi" title="${collapsed ? 'Perluas navigasi' : 'Ringkas navigasi'}">${feather(collapsed ? 'chevron-right' : 'chevron-left')}</button></div>
        <p class="admin-nav-heading">WORKSPACE</p><nav class="admin-nav" aria-label="Menu admin">${adminNavigation(path, collapsed)}</nav>
        <div class="admin-sidebar-bottom"><a class="admin-store-link" href="#/admin-preview" aria-label="Lihat toko" title="${collapsed ? 'Lihat toko' : ''}">${feather('arrow-right')}<span>Lihat toko</span></a><div class="admin-sidebar-account" aria-label="Admin ${escapeHtml(session.email)}"><span class="admin-account-mark" aria-hidden="true">${escapeHtml((session.email || 'A').slice(0, 1).toLocaleUpperCase('id-ID'))}</span><span class="admin-account-copy"><strong>Admin</strong><small>${escapeHtml(session.email)}</small></span></div></div>
      </aside>
      <div class="admin-workspace"><header class="admin-topbar"><button class="admin-menu-toggle" type="button" data-admin-menu-toggle aria-controls="admin-navigation" aria-expanded="false" aria-label="Buka navigasi"><span aria-hidden="true"></span></button><div class="admin-page-context"><span>ADMIN BACSHOP <i aria-hidden="true">/</i></span><strong>${escapeHtml(title)}</strong></div><div class="admin-topbar-actions"><span class="admin-topbar-email">${escapeHtml(session.email)}</span><a class="admin-view-store" href="#/admin-preview">Lihat toko ${feather('arrow-right')}</a><button class="button button-small admin-top-logout" type="button" data-admin-logout>Keluar</button></div></header>
        <main class="admin-products" id="main" tabindex="-1">${content}</main>
      </div>
    </div>`;
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

  function bindCustomDropdowns() {
    app.onclick = (event) => {
      if (event.target.closest('[data-admin-select]')) return;
      app.querySelectorAll('.custom-dropdown-menu:not([hidden])').forEach((menu) => {
        menu.hidden = true;
        menu.closest('[data-admin-select]')?.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false');
      });
    };
    app.querySelectorAll('[data-admin-select]').forEach((dropdown) => {
      const trigger = dropdown.querySelector('[data-dropdown-trigger]');
      const menu = dropdown.querySelector('.custom-dropdown-menu');
      const value = dropdown.querySelector('[data-dropdown-value]');
      const label = dropdown.querySelector('[data-dropdown-label]');
      if (!trigger || !menu || !value || !label) return;
      trigger.addEventListener('click', () => {
        const opening = menu.hidden;
        app.querySelectorAll('.custom-dropdown-menu:not([hidden])').forEach((other) => {
          if (other !== menu) { other.hidden = true; other.closest('[data-admin-select]')?.querySelector('[data-dropdown-trigger]')?.setAttribute('aria-expanded', 'false'); }
        });
        menu.hidden = !opening;
        trigger.setAttribute('aria-expanded', String(opening));
        if (opening) menu.querySelector('[aria-selected="true"]')?.focus();
      });
      dropdown.querySelectorAll('[data-dropdown-option]').forEach((option) => option.addEventListener('click', () => {
        const previous = menu.querySelector('[aria-selected="true"]');
        previous?.removeAttribute('aria-selected');
        option.setAttribute('aria-selected', 'true');
        value.value = option.dataset.dropdownOption || '';
        value.dataset.label = option.dataset.optionLabel || option.textContent.trim();
        if (option.dataset.optionMinimum !== undefined) value.dataset.minimum = option.dataset.optionMinimum;
        else delete value.dataset.minimum;
        if (option.dataset.optionSlug) value.dataset.slug = option.dataset.optionSlug;
        else delete value.dataset.slug;
        label.textContent = value.dataset.label;
        trigger.setAttribute('aria-label', `${dropdown.querySelector('.custom-dropdown-menu')?.getAttribute('aria-label') || 'Pilihan'}: ${value.dataset.label}`);
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        value.dispatchEvent(new Event('input', { bubbles: true }));
        value.dispatchEvent(new Event('change', { bubbles: true }));
        trigger.focus();
      }));
      dropdown.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !menu.hidden) { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
        if (event.key === 'ArrowDown' && document.activeElement === trigger) { event.preventDefault(); menu.hidden = false; trigger.setAttribute('aria-expanded', 'true'); menu.querySelector('[aria-selected="true"]')?.focus(); }
      });
    });
  }

  function updateAdminProductSelection() {
    const selected = [...app.querySelectorAll('[data-product-select]:checked')];
    const count = app.querySelector('[data-selected-count]');
    if (count) count.textContent = `${selected.length} dipilih`;
    app.querySelectorAll('[data-product-bulk]').forEach((button) => { button.disabled = selected.length === 0; });
    const all = app.querySelector('[data-select-all-products]');
    const boxes = [...app.querySelectorAll('[data-product-select]:not(:disabled)')]
      .filter((box) => !box.closest('[data-product-card]')?.hidden);
    if (all) {
      all.disabled = boxes.length === 0;
      all.checked = boxes.length > 0 && boxes.every((box) => box.checked);
      all.indeterminate = boxes.some((box) => box.checked) && !all.checked;
    }
  }

  async function runProductBulkAction(action, button) {
    const productIds = [...app.querySelectorAll('[data-product-select]:checked')].map((input) => input.value);
    if (!productIds.length) return;
    if (action === 'delete' && !window.confirm(`Hapus ${productIds.length} produk terpilih? Produk yang memiliki pesanan lama akan dipertahankan.`)) return;
    button.disabled = true;
    try {
      const result = await requestApi('/api/admin/products/bulk', { method: 'POST', body: { productIds, action } });
      const verb = action === 'delete' ? 'dihapus' : action === 'archive' ? 'diarsipkan' : 'dipulihkan';
      showToast(`${result.changedIds.length} produk ${verb}.${result.blocked.length ? ` ${result.blocked.length} produk memiliki riwayat pesanan dan tidak dapat dihapus.` : ''}`);
      PRODUCTS = result.products;
      await render();
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  }

  function bindProductSpecificationEditor() {
    const editor = app.querySelector('[data-specification-editor]');
    const list = editor?.querySelector('[data-specification-list]');
    const empty = editor?.querySelector('[data-no-specifications]');
    const addSpecification = editor?.querySelector('[data-add-specification]');
    if (!editor || !list || !addSpecification) return;

    const refresh = () => {
      const rows = [...list.querySelectorAll('[data-specification-row]')];
      rows.forEach((row, rowIndex) => {
        const legend = row.querySelector('[data-specification-legend]');
        if (legend) legend.textContent = `Spesifikasi ${rowIndex + 1}`;
        const options = [...row.querySelectorAll('[data-specification-option]')];
        options.forEach((option, optionIndex) => {
          const remove = option.querySelector('[data-remove-specification-option]');
          if (remove) {
            remove.disabled = options.length === 1;
            remove.setAttribute('aria-label', `Hapus opsi ${optionIndex + 1}`);
          }
        });
        const addOption = row.querySelector('[data-add-specification-option]');
        if (addOption) addOption.disabled = options.length >= 30;
      });
      addSpecification.disabled = rows.length >= 8;
      addSpecification.title = rows.length >= 8 ? 'Maksimal 8 spesifikasi per produk' : '';
      if (empty) empty.hidden = rows.length > 0;
    };

    addSpecification.addEventListener('click', () => {
      const rows = list.querySelectorAll('[data-specification-row]');
      if (rows.length >= 8) return;
      list.insertAdjacentHTML('beforeend', specificationField({}, rows.length));
      refresh();
      list.querySelector('[data-specification-row]:last-of-type [data-specification-name]')?.focus();
    });

    list.addEventListener('click', (event) => {
      const removeSpecification = event.target.closest('[data-remove-specification]');
      if (removeSpecification) {
        removeSpecification.closest('[data-specification-row]')?.remove();
        refresh();
        return;
      }
      const addOption = event.target.closest('[data-add-specification-option]');
      if (addOption) {
        const options = addOption.closest('[data-specification-row]')?.querySelector('[data-specification-options]');
        if (!options || options.children.length >= 30) return;
        options.insertAdjacentHTML('beforeend', specificationOptionField({}, options.children.length));
        refresh();
        options.querySelector('[data-specification-option]:last-of-type [data-option-label]')?.focus();
        return;
      }
      const removeOption = event.target.closest('[data-remove-specification-option]');
      if (removeOption) {
        const options = removeOption.closest('[data-specification-options]');
        if (options?.children.length > 1) removeOption.closest('[data-specification-option]')?.remove();
        refresh();
      }
    });
    refresh();
  }

  function bindAdminEvents() {
    bindCustomDropdowns();
    bindProductSpecificationEditor();
    const shell = app.querySelector('[data-admin-shell]');
    const collapseButton = app.querySelector('[data-admin-collapse]');
    const menuToggle = app.querySelector('[data-admin-menu-toggle]');
    const closeDrawer = (restoreFocus = false) => {
      shell?.classList.remove('is-drawer-open');
      document.body.classList.remove('admin-drawer-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.setAttribute('aria-label', 'Buka navigasi');
      if (restoreFocus) menuToggle?.focus();
    };
    app.querySelectorAll('[data-admin-group-toggle]').forEach((button) => button.addEventListener('click', () => {
      const children = button.closest('[data-admin-nav-group]')?.querySelector('[data-admin-group-children]');
      if (!children || shell?.classList.contains('is-sidebar-collapsed')) return;
      children.hidden = !children.hidden;
      button.setAttribute('aria-expanded', String(!children.hidden));
    }));
    collapseButton?.addEventListener('click', () => {
      const collapsed = !shell?.classList.contains('is-sidebar-collapsed');
      shell?.classList.toggle('is-sidebar-collapsed', collapsed);
      collapseButton.setAttribute('aria-expanded', String(!collapsed));
      collapseButton.setAttribute('aria-label', `${collapsed ? 'Perluas' : 'Ringkas'} navigasi`);
      collapseButton.title = `${collapsed ? 'Perluas' : 'Ringkas'} navigasi`;
      collapseButton.innerHTML = feather(collapsed ? 'chevron-right' : 'chevron-left');
      app.querySelectorAll('.admin-nav-link').forEach((link) => { link.title = collapsed ? link.querySelector('.admin-nav-label')?.textContent || '' : ''; });
      const storeLink = app.querySelector('.admin-store-link');
      if (storeLink) storeLink.title = collapsed ? 'Lihat toko' : '';
      try { localStorage.setItem('bacshop.admin.sidebarCollapsed', String(collapsed)); } catch { /* Sidebar preference is optional. */ }
    });
    menuToggle?.addEventListener('click', () => {
      const opening = !shell?.classList.contains('is-drawer-open');
      shell?.classList.toggle('is-drawer-open', opening);
      document.body.classList.toggle('admin-drawer-open', opening);
      menuToggle.setAttribute('aria-expanded', String(opening));
      menuToggle.setAttribute('aria-label', opening ? 'Tutup navigasi' : 'Buka navigasi');
      if (opening) shell?.querySelector('.admin-nav-link[aria-current="page"]')?.focus();
    });
    app.querySelector('[data-admin-backdrop]')?.addEventListener('click', () => closeDrawer(true));
    shell?.addEventListener('keydown', (event) => {
      if (!shell.classList.contains('is-drawer-open') || !window.matchMedia('(max-width: 760px)').matches) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const drawer = shell.querySelector('.admin-sidebar');
      const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!drawer.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    app.querySelectorAll('a[href^="#/admin"]').forEach((link) => link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const fromSidebar = Boolean(link.closest('.admin-sidebar'));
      if (link.getAttribute('href') === window.location.hash) {
        event.preventDefault();
        const restoreFocus = fromSidebar && window.matchMedia('(max-width: 760px)').matches;
        closeDrawer(restoreFocus);
        if (!restoreFocus) link.focus();
        return;
      }
      adminRouteFocusAfterNavigation = true;
      closeDrawer(false);
    }));
    app.querySelectorAll('.admin-store-link, .admin-view-store').forEach((link) => link.addEventListener('click', () => closeDrawer(false)));
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
    app.querySelectorAll('[data-admin-logout]').forEach((button) => button.addEventListener('click', async () => {
      try { await requestApi('/api/admin/logout', { method: 'POST', body: {} }); await render(); }
      catch (error) { showToast(error.message); }
    }));
    app.querySelectorAll('[data-trigger-file]').forEach((button) => button.addEventListener('click', () => button.closest('.admin-image-upload')?.querySelector('[data-image-upload]')?.click()));
    app.querySelectorAll('[data-image-upload]').forEach((input) => input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const message = input.closest('form')?.querySelector('[data-admin-message], [data-cms-message]');
      const authControls = [...(input.closest('[data-storefront-kind="authVisual"]')?.querySelectorAll('button, input[type="file"]') || [])];
      authControls.forEach(control => { control.disabled = true; });
      try {
        const result = await requestApi('/api/admin/uploads', { method: 'POST', body: await filePayload(file) });
        const upload = input.closest('.admin-image-upload');
        const target = upload?.querySelector('[data-image-target]');
        if (target) target.value = result.imageUrl;
        const preview = upload?.querySelector('[data-image-preview]');
        if (preview) preview.innerHTML = `<img src="${escapeHtml(result.imageUrl)}" alt="Pratinjau ${escapeHtml(file.name)}" />`;
        const filename = upload?.querySelector('[data-image-name]');
        if (filename) filename.textContent = file.name;
        if (message) { message.textContent = 'Gambar sudah diunggah. Simpan formulir untuk menerapkan perubahan.'; message.classList.remove('is-error'); }
      } catch (error) {
        if (message) { message.textContent = error.message; message.classList.add('is-error'); }
      } finally { authControls.forEach(control => { control.disabled = false; }); }
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
      product.stock = product.stock === '' ? null : Number(product.stock);
      product.image = form.querySelector('[data-image-target]')?.value || '';
      product.preOrderConfirmed = fields.has('preOrderConfirmed');
      if (product.orderMode === 'ready') product.preOrderConfirmed = true;
      product.terms = termsFromTextarea(product.terms || '');
      try {
        product.specifications = specificationsFromEditor(form);
        const result = await requestApi(isCreate ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.id)}`, { method: isCreate ? 'POST' : 'PUT', body: { product } });
        PRODUCTS = isCreate ? [...PRODUCTS, result.product] : PRODUCTS.map((item) => item.id === result.product.id ? result.product : item);
        if (result.product.orderMode === 'preorder' && !result.product.preOrderConfirmed) writeCart(cart.filter((item) => item.id !== result.product.id));
        showToast(isCreate ? 'Produk berhasil ditambahkan.' : 'Perubahan produk tersimpan.');
        await render();
      } catch (error) {
        message.textContent = error.message;
        message.classList.add('is-error');
      }
    }));

    app.querySelectorAll('[data-delete-product]').forEach((button) => button.addEventListener('click', async () => {
      const id = button.dataset.deleteProduct;
      if (!window.confirm('Hapus produk ini dari katalog?')) return;
      try { await requestApi(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE', body: {} }); window.location.hash = '#/admin/produk'; await render(); }
      catch (error) { const message = button.closest('form')?.querySelector('[data-admin-message]'); if (message) { message.textContent = error.message; message.classList.add('is-error'); } }
    }));

    app.querySelectorAll('[data-product-select]').forEach((input) => input.addEventListener('change', updateAdminProductSelection));
    app.querySelector('[data-select-all-products]')?.addEventListener('change', (event) => {
      app.querySelectorAll('[data-product-select]').forEach((input) => { if (!input.closest('[data-product-card]')?.hidden) input.checked = event.currentTarget.checked; });
      updateAdminProductSelection();
    });
    app.querySelectorAll('[data-product-bulk]').forEach((button) => button.addEventListener('click', () => runProductBulkAction(button.dataset.productBulk, button)));
    const catalogList = app.querySelector('[data-admin-product-list]');
    if (catalogList?.querySelector('[data-product-card]')) {
      catalogList.insertAdjacentHTML('beforeend', `<div class="admin-empty-state admin-search-empty" data-admin-search-empty hidden><span class="admin-empty-icon">${feather('search')}</span><h2>Produk tidak ditemukan</h2><p>Coba nama atau ID produk lain.</p></div>`);
    }
    app.querySelector('[data-admin-product-search]')?.addEventListener('input', (event) => {
      const term = event.currentTarget.value.trim().toLocaleLowerCase('id-ID');
      const cards = [...app.querySelectorAll('[data-product-card]')];
      cards.forEach((card) => { card.hidden = !card.dataset.productSearch.includes(term); });
      const empty = app.querySelector('[data-admin-search-empty]');
      if (empty) empty.hidden = cards.some((card) => !card.hidden);
      updateAdminProductSelection();
    });

    app.querySelectorAll('[data-add-cms-row]').forEach((button) => button.addEventListener('click', () => {
      const kind = button.dataset.addCmsRow;
      const list = app.querySelector(`[data-cms-list="${kind}"]`);
      const item = kind === 'category' ? { id: '', slug: '', name: '', image: '' } : { id: '', title: '', description: '', href: '#/kategori/semua', image: '', active: true };
      if (list) list.insertAdjacentHTML('beforeend', cmsRow(kind, item, list.children.length));
      const row = list?.lastElementChild;
      row?.querySelector('[data-remove-cms-row]')?.addEventListener('click', () => row.remove());
      row?.querySelector('[data-trigger-file]')?.addEventListener('click', (event) => event.currentTarget.closest('.admin-image-upload')?.querySelector('[data-image-upload]')?.click());
      row?.querySelector('[data-image-upload]')?.addEventListener('change', async (event) => {
        const input = event.currentTarget;
        if (!input.files?.[0]) return;
        try {
          const result = await requestApi('/api/admin/uploads', { method: 'POST', body: await filePayload(input.files[0]) });
          const upload = input.closest('.admin-image-upload');
          const target = upload?.querySelector('[data-image-target]');
          if (target) target.value = result.imageUrl;
          const preview = upload?.querySelector('[data-image-preview]');
          if (preview) preview.innerHTML = `<img src="${escapeHtml(result.imageUrl)}" alt="Pratinjau ${escapeHtml(input.files[0].name)}" />`;
          const filename = upload?.querySelector('[data-image-name]');
          if (filename) filename.textContent = input.files[0].name;
        } catch (error) { showToast(error.message); }
      });
    }));
    app.querySelectorAll('[data-remove-cms-row]').forEach((button) => button.addEventListener('click', () => button.closest('[data-cms-row]')?.remove()));

    app.querySelector('[data-reset-auth-image]')?.addEventListener('click', (event) => {
      const form = event.currentTarget.closest('form');
      form.querySelector('[data-image-target]').value = '';
      form.querySelector('[data-image-preview]').innerHTML = '<span>Placeholder</span>';
      form.querySelector('[data-image-name]').textContent = 'Belum ada gambar';
    });
    app.querySelector('[data-storefront-form]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = form.querySelector('[data-cms-message]');
      const fields = new FormData(form);
      const kind = form.dataset.storefrontKind;
      const storefront = kind === 'categories' ? { categories: readCmsRows(form, 'category') }
        : kind === 'banners' ? { banners: readCmsRows(form, 'banner') }
          : kind === 'promotions' ? { promotions: readCmsRows(form, 'promotion') }
            : kind === 'authVisual' ? { authVisual: { image: form.querySelector('[data-image-target]').value, alt: fields.get('authVisualAlt') } }
              : { resellerPlan: { price: Number(fields.get('resellerPlanPrice')), terms: fields.get('resellerPlanTerms') } };
      try {
        STOREFRONT = await requestApi('/api/admin/storefront', { method: 'PUT', body: { storefront } });
        CATEGORIES = STOREFRONT.categories;
        message.textContent = 'Perubahan tersimpan.';
        message.classList.remove('is-error');
      } catch (error) { message.textContent = error.message; message.classList.add('is-error'); }
    });

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
    if (path.startsWith('/produk/')) return renderDetail(path.split('/')[2], params);
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
    stopPaymentPolling();
    const { path } = getRoute();
    if (!['/checkout', '/masuk', '/daftar'].includes(path) && checkoutItemsOverride) writeCheckoutOverride(null);
    document.body.classList.remove('admin-drawer-open');
    if (path === '/admin-preview') {
      try {
        const session = await requestApi('/api/admin/session');
        if (!session.authenticated) throw new Error('Sesi admin tidak aktif.');
        adminPreviewMode = true;
        try { sessionStorage.setItem('bacshop.admin.preview', 'true'); } catch { /* Preview remains active for this page view. */ }
        window.location.hash = '#/';
      } catch {
        adminPreviewMode = false;
        try { sessionStorage.removeItem('bacshop.admin.preview'); } catch { /* Storage is optional. */ }
        showToast('Masuk sebagai admin untuk membuka pratinjau toko.');
        window.location.hash = '#/admin';
      }
      return;
    }
    if (path === '/admin' || path.startsWith('/admin/')) {
      adminPreviewMode = false;
      try { sessionStorage.removeItem('bacshop.admin.preview'); } catch { /* Storage is optional. */ }
    }
    const previewBlockedRoute = path === '/masuk' || path === '/daftar' || path === '/checkout' || path === '/keranjang' || path === '/akun' || path.startsWith('/pesanan');
    if (adminPreviewMode && previewBlockedRoute) {
      showToast('Pratinjau toko hanya untuk melihat halaman. Akun dan pesanan tidak dibuka.');
      window.location.hash = '#/';
      return;
    }
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
        if (getRoute().path === path) {
          app.innerHTML = page;
          if (adminRouteFocusAfterNavigation) {
            adminRouteFocusAfterNavigation = false;
            window.scrollTo({ top: 0, behavior: 'auto' });
            const main = app.querySelector('#main');
            main?.classList.add('admin-content-enter');
            main?.focus({ preventScroll: true });
          }
        }
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
    app.innerHTML = authRoute ? authShell(content, path) : shell(content, path);
    updateCartCounts();
    bindHeroCarousel();
    bindEvents();
    bindCustomerEvents();
    const pendingPayment = app.querySelector('[data-payment-poll="true"]');
    if (pendingPayment?.dataset.paymentOrder) schedulePaymentPolling(pendingPayment.dataset.paymentOrder);
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
    bindCustomDropdowns();
    const faqSearch = app.querySelector('[data-faq-search]');
    const faqTopicButtons = [...app.querySelectorAll('[data-faq-topic]')];
    const filterFaq = () => {
      const query = (faqSearch?.value || '').trim().toLocaleLowerCase('id-ID');
      const topic = app.querySelector('[data-faq-topic].is-active')?.dataset.faqTopic || 'semua';
      let visible = 0;
      app.querySelectorAll('[data-faq-item]').forEach((item) => {
        const show = (topic === 'semua' || item.dataset.topic === topic) && (!query || item.dataset.search.includes(query));
        item.hidden = !show;
        if (show) visible++;
      });
      const empty = app.querySelector('[data-faq-empty]');
      if (empty) empty.hidden = visible > 0;
    };
    faqSearch?.addEventListener('input', filterFaq);
    faqTopicButtons.forEach((button) => button.addEventListener('click', () => {
      faqTopicButtons.forEach((entry) => { const active = entry === button; entry.classList.toggle('is-active', active); entry.setAttribute('aria-pressed', String(active)); });
      filterFaq();
    }));

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
    const detailPurchaseForm = app.querySelector('[data-detail-purchase]');
    if (detailPurchaseForm) {
      const product = PRODUCTS.find((entry) => entry.id === detailPurchaseForm.dataset.productId);
      const quantityField = detailPurchaseForm.querySelector('[data-detail-quantity]');
      const errorMessage = detailPurchaseForm.querySelector('[data-detail-purchase-error]');
      const selectedSpecifications = () => Object.fromEntries([...detailPurchaseForm.querySelectorAll('[data-detail-specification]')].map((field) => [field.dataset.detailSpecification, field.value]).filter(([, value]) => value));
      const updateDetailPurchasePreview = () => {
        if (!product || !quantityField) return;
        const selection = resolveClientSpecifications(product, selectedSpecifications());
        const quantity = Number(quantityField.value);
        const minimum = Math.max(1, Number(detailPurchaseForm.dataset.minimumQuantity) || 1);
        const stockLimit = Math.max(0, Number(detailPurchaseForm.dataset.stockLimit) || 0);
        const quantityValid = Number.isInteger(quantity) && quantity >= minimum && quantity <= 99 && quantity <= stockLimit;
        const ready = Boolean(selection && quantityValid && !adminPreviewMode);
        const unitPrice = app.querySelector('[data-detail-unit-price]');
        const totalPrice = app.querySelector('[data-detail-total]');
        if (unitPrice) unitPrice.textContent = selection ? rupiah(selection.unitPrice) : 'Pilih spesifikasi';
        if (totalPrice) totalPrice.textContent = selection && Number.isInteger(quantity) ? rupiah(selection.unitPrice * quantity) : '—';
        app.querySelectorAll('[data-purchase-action]').forEach((button) => { button.disabled = !ready; });
      };
      detailPurchaseForm.querySelectorAll('[data-detail-specification]').forEach((field) => field.addEventListener('change', () => {
        if (errorMessage) { errorMessage.hidden = true; errorMessage.textContent = ''; }
        updateDetailPurchasePreview();
      }));
      quantityField?.addEventListener('input', () => {
        if (errorMessage) { errorMessage.hidden = true; errorMessage.textContent = ''; }
        updateDetailPurchasePreview();
      });
      detailPurchaseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!product) return;
        const selection = resolveClientSpecifications(product, selectedSpecifications());
        const quantity = Number(quantityField?.value);
        const minimum = Math.max(1, Number(detailPurchaseForm.dataset.minimumQuantity) || 1);
        const stockLimit = Math.max(0, Number(detailPurchaseForm.dataset.stockLimit) || 0);
        if (!selection) { detailPurchaseForm.reportValidity(); return; }
        if (!Number.isInteger(quantity) || quantity < minimum || quantity > 99 || quantity > stockLimit) {
          if (errorMessage) {
            errorMessage.hidden = false;
            errorMessage.textContent = quantity < minimum ? `Minimum pembelian ${minimum} unit.` : `Stok tersisa ${stockLimit} unit.`;
          }
          return;
        }
        const item = { id: product.id, quantity, specifications: selection.values };
        if (event.submitter?.dataset.purchaseAction === 'buy') {
          writeCheckoutOverride([item]);
          window.location.hash = '#/checkout';
          return;
        }
        addToCart(item.id, item.quantity, item.specifications);
      });
      updateDetailPurchasePreview();
    }
    app.querySelectorAll('[data-add-to-cart]').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.addToCart)));
    app.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => updateQuantity(button.dataset.quantity, Number(button.dataset.delta))));
    app.querySelectorAll('[data-cart-quantity]').forEach((input) => input.addEventListener('change', () => setCartQuantity(input.dataset.cartQuantity, input.value)));
    app.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeFromCart(button.dataset.remove)));
    const filterDialog = app.querySelector('[data-filter-dialog]');
    app.querySelector('[data-open-filter]')?.addEventListener('click', () => filterDialog?.showModal());
    app.querySelector('[data-close-filter]')?.addEventListener('click', () => filterDialog?.close());
    filterDialog?.addEventListener('click', (event) => { if (event.target === filterDialog) filterDialog.close(); });
    app.querySelectorAll('[data-filter-form]').forEach((form) => {
      form.querySelectorAll('input[type="radio"][name="sort"], input[type="checkbox"][name="ready"]').forEach((input) => input.addEventListener('change', () => form.requestSubmit()));
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fields = new FormData(form);
        const minimum = Number(fields.get('min') || 0);
        const maximum = fields.get('max') === '' ? Number.POSITIVE_INFINITY : Number(fields.get('max'));
        const maximumField = form.querySelector('[name="max"]');
        maximumField?.setCustomValidity(minimum > maximum ? 'Harga maksimal harus sama atau lebih besar dari harga minimal.' : '');
        if (minimum > maximum) { maximumField?.reportValidity(); return; }
        const { path, params } = getRoute();
        const category = fields.get('category') || path.split('/')[2] || 'semua';
        window.location.hash = getQueryUrl(category, params.get('q') || '', fields.get('sort'), fields.get('min'), fields.get('max'), fields.has('ready'));
        if (filterDialog?.open) filterDialog.close();
      });
      form.querySelector('[data-reset-filter]')?.addEventListener('click', () => {
        const { path, params } = getRoute();
        window.location.hash = getQueryUrl(form.elements.category?.value || path.split('/')[2] || 'semua', params.get('q') || '', 'relevance');
        if (filterDialog?.open) filterDialog.close();
      });
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
      const [result, storefront, session, authOptions] = await Promise.all([
        requestApi('/api/products'), requestApi('/api/storefront'), requestApi('/api/auth/session'), requestApi('/api/auth/options'),
      ]);
      if (!Array.isArray(result.products)) throw new Error('Katalog belum dapat dimuat.');
      PRODUCTS = result.products;
      STOREFRONT = storefront;
      if (Array.isArray(storefront.categories) && storefront.categories.length) CATEGORIES = storefront.categories;
      currentUser = session.user || null;
      AUTH_OPTIONS = authOptions;
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
