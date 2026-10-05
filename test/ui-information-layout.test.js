const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

function between(start, end) {
  const from = app.indexOf(start);
  const to = app.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return app.slice(from, to);
}

test('reseller program uses the FAQ layout and sends shopping into the catalog', () => {
  const faq = between('function renderFaq()', 'function renderAuthPage(');
  const reseller = between("if (path === '/program-reseller')", "if (path === '/promo')");
  assert.match(faq, /class="info-layout info-layout-faq"/);
  assert.match(faq, /class="info-side-rail faq-side-rail"/);
  assert.match(faq, /data-faq-search/);
  assert.match(faq, /data-faq-topic/);
  assert.match(reseller, /class="info-layout info-layout-faq info-layout-reseller"/);
  assert.match(reseller, /class="info-side-rail faq-side-rail"/);
  assert.match(reseller, /class="faq-list reseller-info-list"/);
  assert.match(reseller, /Harga khusus tampil langsung di katalog/);
  assert.match(reseller, /href="#\/kategori\/semua">Buka katalog/);
  assert.match(reseller, /visibleResellerProduct/);
  assert.match(reseller, /Aktifkan akses katalog/);
  assert.doesNotMatch(reseller, /data-bulk-product|data-bulk-quantity|Pilih jumlah untuk satu produk/);
  assert.match(styles, /\.info-layout-reseller \.faq-side-rail/);
});

test('product specifications and quantity are selected inline before buy or cart actions', () => {
  const detail = between('function renderDetail(', 'function notFound(');
  assert.match(detail, /data-detail-purchase/);
  assert.match(detail, /data-detail-specification/);
  assert.match(detail, /data-detail-quantity/);
  assert.match(detail, /data-purchase-action="buy"/);
  assert.match(detail, /data-purchase-action="cart"/);
  assert.match(detail, /data-detail-total/);
  assert.match(app, /const detailPurchaseForm = app\.querySelector\('\[data-detail-purchase\]'\)/);
  assert.match(app, /writeCheckoutOverride\(\[item\]\)/);
  assert.match(app, /addToCart\(item\.id, item\.quantity, item\.specifications\)/);
  assert.doesNotMatch(detail, /<dialog|data-purchase-open/);
  assert.doesNotMatch(app, /function purchaseDialogMarkup\(/);
  assert.match(styles, /\.product-detail-page \.detail-layout\s*\{[^}]*grid-template-columns:/s);
});

test('checkout reviews products and creates QRIS after confirmation without payment-method choices', () => {
  const checkout = between('function renderCheckoutPage()', 'function safeReturnPath(');
  assert.match(checkout, /Akun penerima/);
  assert.match(checkout, /checkout-item-thumb/);
  assert.match(checkout, /data-confirm-order/);
  assert.match(checkout, /QRIS untuk pembayaran dibuat setelah/);
  assert.doesNotMatch(checkout, /Pilih pembayaran|payment-method|radio/);
  assert.match(app, /data-create-qris/);
});

test('customers can see and refresh a pending Midtrans refund', () => {
  const orderUi = between('function orderStatusText(', 'function renderCheckoutPage(');
  assert.match(orderUi, /refundStatus === 'requested'\) return 'Refund diproses'/);
  assert.match(orderUi, /data-refresh-order>Periksa refund/);
  assert.match(orderUi, /data-payment-poll="\$\{shouldPollStatus \? 'true' : 'false'\}"/);
  assert.match(app, /result\.order\?\.refundStatus !== 'requested'/);
  assert.match(orderUi, /function orderStatusClass\(order\)/);
});

test('admin pages are grouped by catalog, store content, and sales', () => {
  const navigation = between('function adminNavigation(', 'function adminOrderCard(');
  assert.match(navigation, /'Produk', 'grid'/);
  assert.match(navigation, /'Kategori', 'tag'/);
  assert.match(navigation, /'Banner Beranda'/);
  assert.match(navigation, /'Promo'/);
  assert.match(navigation, /'Program reseller'/);
  assert.match(navigation, /<span class="admin-nav-label">Penjualan/);
  assert.match(navigation, /'Pesanan'/);
  assert.match(navigation, /'Analisa'/);
  assert.match(navigation, /admin-nav-children/);
});

test('admin product variants use editable fields and are serialized into product saves', () => {
  const editor = between('function specificationOptionField(', 'function productFields(');
  assert.match(editor, /data-specification-row/);
  assert.match(editor, /data-option-adjustment/);
  assert.match(editor, /function specificationsFromEditor\(form\)/);
  assert.match(editor, /data-specification-required/);
  assert.doesNotMatch(app, /name="specificationsJson"/);
  assert.match(app, /product\.specifications = specificationsFromEditor\(form\)/);
  assert.match(app, /function bindProductSpecificationEditor\(\)/);
});

test('admin store preview blocks account actions and never exposes buyer sign-in links', () => {
  const shell = between('function shell(content, path)', 'function setCartQuantity(');
  assert.match(shell, /Pratinjau toko/);
  assert.match(shell, /aksi pembelian dan akun dinonaktifkan/);
  assert.match(shell, /Halaman akun dan pesanan tidak tersedia dalam pratinjau/);
  assert.match(shell, /adminPreviewMode \? '<span class="button button-disabled" aria-disabled="true">Mode pratinjau/);
  assert.match(app, /const previewBlockedRoute = path === '\/masuk'.*path\.startsWith\('\/pesanan'\)/);
});

test('privacy, personal-data, and service terms pages share the FAQ information layout', () => {
  const infoPages = between('function renderInfoPage(path)', 'function renderFaq()');
  assert.match(infoPages, /'\/privasi'/);
  assert.match(infoPages, /'\/data-pribadi'/);
  assert.match(infoPages, /'\/ketentuan-layanan'/);
  assert.match(infoPages, /info-layout-legal/);
  assert.match(infoPages, /info-side-rail legal-side-rail/);
  assert.match(app, /href="#\/privasi"/);
  assert.match(app, /href="#\/data-pribadi"/);
  assert.match(app, /href="#\/ketentuan-layanan"/);
});

test('customer auth uses a left-aligned logo and a real, useful side panel', () => {
  const auth = between('function renderAuthPage(', 'function renderAccountPage(');
  assert.match(auth, /class="auth-story"/);
  assert.match(auth, /class="auth-legal-links"/);
  assert.match(styles, /\.auth-header\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.match(styles, /\.auth-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)\s+minmax\(250px,320px\)/s);
});
