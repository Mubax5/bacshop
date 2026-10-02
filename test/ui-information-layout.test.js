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

test('FAQ stays searchable and reseller access paths have a clear primary order flow', () => {
  const faq = between('function renderFaq()', 'function renderAuthPage(');
  const reseller = between("if (path === '/program-reseller')", "if (path === '/promo')");
  assert.match(faq, /class="info-layout info-layout-faq"/);
  assert.match(faq, /class="info-side-rail faq-side-rail"/);
  assert.match(faq, /data-faq-search/);
  assert.match(faq, /data-faq-topic/);
  assert.match(reseller, /class="page-panel reseller-program-page"/);
  assert.match(reseller, /class="reseller-access-layout"/);
  assert.match(reseller, /class="reseller-bulk-panel"/);
  assert.match(reseller, /class="reseller-catalog-offer"/);
  assert.match(reseller, /data-bulk-product-link/);
  assert.match(reseller, /class="reseller-program-footnote"/);
  assert.doesNotMatch(reseller, /reseller-choice-tabs|reseller-choice-panel|reseller-steps|reseller-path-grid/);
  assert.match(reseller, /firstBulkUnavailable/);
  assert.match(reseller, /stockAvailable/);
  assert.match(app, /bulkQuantity\.disabled = !stockCanMeetMinimum/);
  assert.match(app, /quantity <= maxQuantity/);
  const shell = between('function shell(content, path)', 'function setCartQuantity(');
  assert.match(shell, /data-minimum-quantity="\$\{detailBulkMinimum\}"/);
  assert.match(shell, /data-default-quantity="\$\{detailBulkMinimum\}"/);
  const purchaseDialog = between('function purchaseDialogMarkup(', 'function categoryLinks(');
  assert.match(purchaseDialog, /min="\$\{minimum\}"/);
  assert.match(app, /quantity < minimumQuantity/);
  assert.match(styles, /\.reseller-access-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,1\.35fr\)/s);
  assert.match(styles, /\.reseller-program-footnote\s*\{[^}]*border-top/s);
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
