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

test('FAQ and reseller information pages reserve a compact right rail', () => {
  const faq = between('function renderFaq()', 'function renderAuthPage(');
  const reseller = between("if (path === '/program-reseller')", "if (path === '/promo')");
  assert.match(faq, /class="info-layout info-layout-faq"/);
  assert.match(faq, /class="info-side-rail faq-side-rail"/);
  assert.match(reseller, /class="info-layout info-layout-reseller"/);
  assert.match(reseller, /class="info-side-rail reseller-side-rail"/);
  assert.match(styles, /\.info-side-rail\s*\{[^}]*max-width:\s*280px/s);
  assert.match(styles, /\.info-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)\s+minmax\(230px,280px\)/s);
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
