'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const QRCode = require('qrcode');

function loadEnvFile(file = path.join(__dirname, '.env')) {
  let contents;
  try { contents = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of contents.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;
    const match = entry.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined && process.env[match[1]] !== '') continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile();

const ROOT = __dirname;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT harus berupa angka antara 1 dan 65535.');
const PUBLIC_ORIGIN = (() => {
  const value = (process.env.BACSHOP_PUBLIC_ORIGIN || `http://${HOST}:${PORT}`).trim();
  let origin;
  try { origin = new URL(value); } catch { throw new Error('BACSHOP_PUBLIC_ORIGIN harus berupa origin URL yang valid.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('BACSHOP_PUBLIC_ORIGIN harus berupa origin HTTP(S) tanpa path, query, atau kredensial.');
  }
  if (NODE_ENV === 'production' && origin.protocol !== 'https:') throw new Error('Bacshop production wajib memakai BACSHOP_PUBLIC_ORIGIN HTTPS.');
  return origin.origin;
})();
const COOKIE_SECURE = NODE_ENV === 'production' || process.env.BACSHOP_COOKIE_SECURE === 'true';
const TRUSTED_PROXY_IPS = new Set((process.env.BACSHOP_TRUSTED_PROXY_IPS || '').split(',').map((value) => value.trim()).filter((value) => net.isIP(value)));
const PRIVATE_DIR = process.env.BACSHOP_DATA_DIR || path.join(ROOT, '.bacshop-private');
const PRODUCTS_FILE = process.env.BACSHOP_PRODUCTS_FILE || path.join(ROOT, 'data', 'products.json');
const ADMIN_FILE = path.join(PRIVATE_DIR, 'admin.json');
const USERS_FILE = path.join(PRIVATE_DIR, 'users.json');
const ORDERS_FILE = path.join(PRIVATE_DIR, 'orders.json');
const CMS_FILE = path.join(PRIVATE_DIR, 'storefront.json');
const AUDIT_FILE = path.join(PRIVATE_DIR, 'audit.json');
const UPLOAD_DIR = process.env.BACSHOP_UPLOADS_DIR || path.join(ROOT, 'assets', 'uploads');
const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE = 'BacshopAdmin';
const USER_COOKIE = 'BacshopUser';
const CATEGORIES = new Set(['ai', 'streaming', 'desain', 'musik', 'office', 'editing', 'voucher']);
const MIDTRANS_NOTIFY_PATH = '/api/payments/notify';
const MIME = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

function validateProductionConfiguration() {
  if (NODE_ENV !== 'production') {
    if (NODE_ENV !== 'test' && process.env.MIDTRANS_IS_PRODUCTION === 'true') {
      throw new Error('Kunci pembayaran Production hanya boleh digunakan saat NODE_ENV=production.');
    }
    return;
  }
  if (!process.env.BACSHOP_PUBLIC_ORIGIN) throw new Error('Atur BACSHOP_PUBLIC_ORIGIN ke domain HTTPS Bacshop.');
  for (const name of ['BACSHOP_DATA_DIR', 'BACSHOP_PRODUCTS_FILE', 'BACSHOP_UPLOADS_DIR']) {
    if (!process.env[name] || !path.isAbsolute(process.env[name])) throw new Error(`${name} wajib menunjuk lokasi persistent yang absolut di production.`);
  }
  if (process.env.MIDTRANS_IS_PRODUCTION !== 'true' || !midtransConfig()) throw new Error('Production wajib memakai MIDTRANS_SERVER_KEY Production dan MIDTRANS_IS_PRODUCTION=true.');
}

validateProductionConfiguration();

fs.mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (NODE_ENV === 'production' && process.platform !== 'win32') {
  try { fs.chmodSync(PRIVATE_DIR, 0o700); } catch { throw new Error('Akses folder data pribadi production tidak dapat dibatasi.'); }
}
function verifyWritableDirectory(directory, label) {
  const probe = path.join(directory, `.bacshop-write-check-${crypto.randomBytes(8).toString('hex')}.tmp`);
  const renamed = `${probe}.renamed`;
  try {
    fs.writeFileSync(probe, 'ok', { flag: 'wx', mode: 0o600 });
    fs.renameSync(probe, renamed);
    fs.unlinkSync(renamed);
  } catch {
    for (const candidate of [probe, renamed]) {
      try { fs.unlinkSync(candidate); } catch { /* Cleanup is best effort after a failed storage probe. */ }
    }
    throw new Error(`Lokasi penyimpanan ${label} tidak dapat ditulis dengan aman.`);
  }
}
if (NODE_ENV === 'production') {
  verifyWritableDirectory(PRIVATE_DIR, 'data pribadi');
  verifyWritableDirectory(path.dirname(PRODUCTS_FILE), 'katalog');
  verifyWritableDirectory(UPLOAD_DIR, 'unggahan');
}
if (!fs.existsSync(PRODUCTS_FILE)) throw new Error('Missing data/products.json');
if (!Array.isArray(readJson(PRODUCTS_FILE, null))) throw new Error('Data produk harus berupa daftar JSON yang valid.');

let adminRecord = readJson(ADMIN_FILE, null);
let setupCode = adminRecord ? null : process.env.BACSHOP_ADMIN_SETUP_CODE || crypto.randomBytes(24).toString('base64url');
if (NODE_ENV === 'production' && !adminRecord && !process.env.BACSHOP_ADMIN_SETUP_CODE) throw new Error('Atur BACSHOP_ADMIN_SETUP_CODE sebelum setup admin production.');
if (NODE_ENV === 'production' && !adminRecord && setupCode.length < 32) throw new Error('BACSHOP_ADMIN_SETUP_CODE minimal 32 karakter saat setup admin production.');
const sessions = new Map();
const userSessions = new Map();
const loginAttempts = new Map();
const userLoginAttempts = new Map();
const paymentCreationLocks = new Set();
const paymentRefundLocks = new Set();
if (setupCode && NODE_ENV !== 'production') {
  console.log('\nBacshop admin first setup');
  console.log(`Open http://${HOST}:${PORT}/#/admin and enter this one-time code:`);
  console.log(setupCode);
  console.log('This code is only printed locally and expires when the server stops.\n');
}

function readJson(file, fallback) {
  let contents;
  try { contents = fs.readFileSync(file, 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    if (NODE_ENV === 'production') throw new Error(`Data ${path.basename(file)} tidak dapat dibaca.`);
    return fallback;
  }
  try { return JSON.parse(contents); } catch {
    if (NODE_ENV === 'production') throw new Error(`Data ${path.basename(file)} tidak valid.`);
    return fallback;
  }
}

function readProducts() {
  return readJson(PRODUCTS_FILE, []);
}

function saveProducts(products) {
  writeJsonAtomic(PRODUCTS_FILE, products);
}

function readUsers() {
  return readJson(USERS_FILE, []);
}

function readOrders() {
  return readJson(ORDERS_FILE, []);
}

function saveOrders(orders) {
  writeJsonAtomic(ORDERS_FILE, orders);
}

function saveUsers(users) {
  writeJsonAtomic(USERS_FILE, users);
}

function defaultStorefront() {
  return {
    categories: [...CATEGORIES].map((slug) => ({ slug, name: slug === 'ai' ? 'AI & Produktivitas' : slug.charAt(0).toUpperCase() + slug.slice(1), image: '' })),
    banners: [
      { id: 'main', title: '', description: '', image: '', href: '#/', active: true },
      { id: 'campaign-2', title: '', description: '', image: '', href: '#/', active: true },
      { id: 'campaign-3', title: '', description: '', image: '', href: '#/', active: true },
    ],
    promotions: [],
    resellerPlan: { price: 149000, terms: 'Akses harga reseller berlaku permanen untuk seluruh produk setelah pembayaran diverifikasi.' },
    payment: { provider: 'QRIS' },
  };
}

function readStorefront() {
  const stored = readJson(CMS_FILE, null);
  const defaults = defaultStorefront();
  return stored && typeof stored === 'object'
    ? { ...defaults, ...stored, payment: { ...defaults.payment, available: Boolean(midtransConfig()) } }
    : { ...defaults, payment: { ...defaults.payment, available: Boolean(midtransConfig()) } };
}

function saveAudit(entry) {
  const records = readJson(AUDIT_FILE, []);
  records.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry });
  writeJsonAtomic(AUDIT_FILE, records.slice(0, 1000));
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...standardSecurityHeaders(),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function midtransConfig() {
  const production = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const testBaseUrl = process.env.NODE_ENV === 'test' ? process.env.MIDTRANS_API_BASE_URL : '';
  const config = {
    baseUrl: (testBaseUrl || (production ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com')).replace(/\/$/, ''),
    serverKey: (process.env.MIDTRANS_SERVER_KEY || '').trim(),
    merchantId: (process.env.MIDTRANS_MERCHANT_ID || '').trim(),
  };
  if (!config.serverKey) return null;
  if (!testBaseUrl) {
    const sandboxKey = config.serverKey.startsWith('SB-Mid-server-');
    const productionKey = config.serverKey.startsWith('Mid-server-') && !sandboxKey;
    if (production ? !productionKey : !sandboxKey) return null;
  }
  try {
    const endpoint = new URL(config.baseUrl);
    if (endpoint.protocol !== 'https:' && !(process.env.NODE_ENV === 'test' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) return null;
  } catch { return null; }
  return config;
}

function midtransAuthorization(config) {
  return `Basic ${Buffer.from(`${config.serverKey}:`).toString('base64')}`;
}

const MIDTRANS_HTTP_STATUS = Symbol('midtransHttpStatus');

async function midtransRequest(method, pathname, body, config = midtransConfig()) {
  if (!config) throw Object.assign(new Error('Pembayaran QRIS dinamis belum dikonfigurasi. Admin perlu mengatur Server Key di environment server.'), { status: 503 });
  let response;
  try {
    response = await fetch(`${config.baseUrl}${pathname}`, {
      method,
      headers: { Accept: 'application/json', Authorization: midtransAuthorization(config), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    const detail = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Koneksi pembayaran melewati batas waktu. Coba buat QRIS lagi.'
      : 'Server tidak dapat terhubung ke Midtrans. Periksa koneksi lalu coba lagi.';
    throw Object.assign(new Error(detail), { status: 502, transportFailure: true });
  }
  let result;
  try { result = await response.json(); } catch { throw Object.assign(new Error('Respons pembayaran tidak dapat dibaca.'), { status: 502, providerHttpStatus: response.status }); }
  if (result && typeof result === 'object') Object.defineProperty(result, MIDTRANS_HTTP_STATUS, { value: response.status });
  if (!response.ok) {
    console.error('Payment API rejected request:', JSON.stringify({ httpStatus: response.status, code: result.status_code || 'unknown' }));
    const inactiveChannel = /payment channel is not activated/i.test(String(result.status_message || ''));
    const detail = response.status === 401
      ? 'Koneksi QRIS ditolak. Periksa kecocokan Server Key dan mode akun Midtrans di server.'
      : inactiveChannel
        ? 'Kanal QRIS dinamis belum diaktifkan untuk Core API akun Midtrans ini. Minta aktivasi QRIS dinamis untuk mode akun yang sedang dipakai.'
      : response.status === 400
        ? 'Midtrans menolak pesanan. Pastikan kanal QRIS aktif dan nominal pesanan memenuhi ketentuan akun.'
        : 'QRIS belum dapat diproses. Coba lagi beberapa saat.';
    throw Object.assign(new Error(detail), {
      status: 502,
      providerRejected: true,
      providerHttpStatus: response.status,
      providerCode: String(result.status_code || ''),
      providerMessage: String(result.status_message || ''),
      paymentChannelInactive: inactiveChannel,
    });
  }
  return result;
}

async function midtransQrImage(result, config) {
  if (typeof result.qr_string === 'string' && result.qr_string.length > 0 && result.qr_string.length <= 4096) {
    return QRCode.toDataURL(result.qr_string, { errorCorrectionLevel: 'M', margin: 2, width: 440 });
  }
  const qrActions = ['generate-qr-code-v2', 'generate-qr-code']
    .map((name) => result.actions?.find((action) => action.name === name))
    .filter((action) => action?.url);
  const apiUrl = new URL(config.baseUrl);
  for (const qrAction of qrActions) {
    let qrUrl;
    try { qrUrl = new URL(qrAction.url); } catch { qrUrl = null; }
    const isQrisImagePath = qrUrl && /^\/{1,2}v[24]\/qris(?:\/[A-Za-z0-9_-]+){1,2}\/qr-code\/?$/.test(qrUrl.pathname);
    const secureProviderUrl = qrUrl?.protocol === 'https:';
    const isolatedTestUrl = process.env.NODE_ENV === 'test'
      && ['localhost', '127.0.0.1'].includes(apiUrl.hostname)
      && qrUrl?.origin === apiUrl.origin
      && qrUrl.protocol === 'http:';
    if (qrUrl && qrUrl.origin === apiUrl.origin && (secureProviderUrl || isolatedTestUrl) && isQrisImagePath) {
      try {
        const response = await fetch(qrUrl, { redirect: 'error', headers: { Accept: 'image/png,image/jpeg,image/webp', Authorization: midtransAuthorization(config) }, signal: AbortSignal.timeout(8000) });
        const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase();
        if (response.ok && ['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
          const bytes = Buffer.from(await response.arrayBuffer());
          if (bytes.length <= 2 * 1024 * 1024 && uploadedImage(bytes, contentType)) return `data:${contentType};base64,${bytes.toString('base64')}`;
        }
      } catch (error) {
        console.warn('Midtrans QR image endpoint unavailable; trying the next QR source.', { action: qrAction.name, error: error.name || 'FetchError' });
      }
    }
  }
  throw Object.assign(new Error('Respons pembayaran tidak berisi QRIS yang dapat ditampilkan.'), { status: 502 });
}

function verifyMidtransSignature(body, config = midtransConfig()) {
  if (!config || typeof body?.signature_key !== 'string') return false;
  const raw = `${body.order_id || ''}${body.status_code || ''}${body.gross_amount || ''}${config.serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  const actual = Buffer.from(body.signature_key, 'hex');
  const expectedBytes = Buffer.from(expected, 'hex');
  return actual.length === expectedBytes.length && crypto.timingSafeEqual(actual, expectedBytes);
}

async function readRawBody(req, limit = 65536) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString('utf8');
    if (raw.length > limit) throw Object.assign(new Error('Request terlalu besar.'), { status: 413 });
  }
  try { return { raw, body: JSON.parse(raw || '{}') }; } catch { throw Object.assign(new Error('Isi permintaan tidak valid.'), { status: 400 }); }
}

async function handleMidtransNotify(req, res) {
  const config = midtransConfig();
  if (!config) return json(res, 503, { error: 'Payment notification is not configured.' });
  const { body } = await readRawBody(req, 65536);
  if (!verifyMidtransSignature(body, config)) return json(res, 401, { error: 'Invalid payment notification signature.' });
  const order = readOrders().find((entry) => entry.id === body.order_id && entry.paymentProvider === 'qris_dynamic');
  const amount = Number(body.gross_amount);
  const expectedMerchantId = order?.midtransMerchantId || config.merchantId;
  if (!order || body.currency !== 'IDR' || body.payment_type !== 'qris' || typeof body.merchant_id !== 'string' || !body.merchant_id || !Number.isFinite(amount) || amount !== Number(order.total) || expectedMerchantId && body.merchant_id !== expectedMerchantId) {
    return json(res, 404, { error: 'Payment transaction does not match an order.' });
  }
  if (body.status_code === '200' && body.transaction_status === 'settlement' && body.fraud_status === 'accept') {
    const result = savePaidOrder(order, 'QRIS otomatis', body.transaction_id || body.order_id);
    if (result.error) return json(res, 409, { error: 'Order status cannot be updated.' });
  } else if (['expire', 'cancel', 'deny'].includes(body.transaction_status) && order.paymentStatus === 'pending') {
    const orders = readOrders();
    const index = orders.findIndex((entry) => entry.id === order.id);
    orders[index] = { ...orders[index], paymentStatus: 'cancelled', status: 'cancelled', cancelledAt: new Date().toISOString() };
    saveOrders(orders);
  } else if (body.transaction_status === 'refund' && order.paymentStatus === 'paid') {
    if (refundIsConfirmed(body, order)) saveConfirmedRefund(order, body);
    else saveRefundRequest(order, order.refundKey || `BCREFUND-${order.id}`, order.refundReason || 'Refund diproses melalui Midtrans.', 'requested', 'Midtrans');
  }
  return json(res, 200, { status: 'ok' });
}

function cookieValue(req) {
  const entry = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE.length + 1)) : '';
}

function userCookieValue(req) {
  const entry = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${USER_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(USER_COOKIE.length + 1)) : '';
}

function activeSession(req) {
  const token = cookieValue(req);
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function activeUser(req) {
  const token = userCookieValue(req);
  const session = userSessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) {
    userSessions.delete(token);
    return null;
  }
  return readUsers().find((user) => user.id === session.userId) || null;
}

function setSession(res, email) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { email, expires: Date.now() + SESSION_MS });
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${COOKIE_SECURE ? '; Secure' : ''}`);
}

function setUserSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  userSessions.set(token, { userId, expires: Date.now() + SESSION_MS });
  res.setHeader('Set-Cookie', `${USER_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${COOKIE_SECURE ? '; Secure' : ''}`);
}

function clearSession(req, res) {
  const token = cookieValue(req);
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

function clearUserSession(req, res) {
  const token = userCookieValue(req);
  if (token) userSessions.delete(token);
  res.setHeader('Set-Cookie', `${USER_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

function normalizeAddress(address) {
  if (typeof address !== 'string') return '';
  return address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
}

function clientAddress(req) {
  const remoteAddress = normalizeAddress(req.socket.remoteAddress || '');
  if (TRUSTED_PROXY_IPS.has(remoteAddress)) {
    const forwarded = req.headers['x-forwarded-for'];
    const candidate = typeof forwarded === 'string' ? normalizeAddress(forwarded.split(',')[0].trim()) : '';
    if (net.isIP(candidate)) return candidate;
  }
  return remoteAddress || 'unknown';
}

function sameOrigin(req) {
  return typeof req.headers.origin === 'string' && req.headers.origin === PUBLIC_ORIGIN;
}

function standardSecurityHeaders() {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  if (PUBLIC_ORIGIN.startsWith('https://')) headers['Strict-Transport-Security'] = 'max-age=15552000';
  return headers;
}

function readBody(req, limit = 65536) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(Object.assign(new Error('Request terlalu besar.'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(Object.assign(new Error('Isi permintaan tidak valid.'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function writeJsonAtomic(file, data) {
  const temporary = `${file}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function passwordMatchesRecord(password, record) {
  if (!record || typeof password !== 'string') return false;
  const candidate = hashPassword(password, record.salt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(record.hash, 'hex'));
}

function passwordMatches(password) {
  if (!adminRecord || typeof password !== 'string') return false;
  const candidate = hashPassword(password, adminRecord.salt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(adminRecord.hash, 'hex'));
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function publicOrder(order) {
  const { paymentQrString, paymentQrActions, refundKey, refundReason, refundProviderReference, ...visible } = order;
  return visible;
}

function publicUser(user) {
  const cms = readStorefront();
  const productIds = Array.isArray(user.productEntitlements) ? user.productEntitlements : [];
  const allProducts = Boolean(user.resellerPlan?.active);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    role: 'buyer',
    isReseller: allProducts || productIds.length > 0,
    resellerProducts: productIds,
    resellerPlan: allProducts,
    createdAt: user.createdAt,
    resellerPlanPrice: cms.resellerPlan.price,
  };
}

function userCanResell(user, productId) {
  return Boolean(user && (user.resellerPlan?.active || (user.productEntitlements || []).includes(productId)));
}

function publicProduct(product, user) {
  const { resellerPrice, bulkMinimum, rating, sold: seededSales, ...retailProduct } = product;
  const actualSales = readOrders().reduce((sum, order) => {
    if (order.paymentStatus !== 'paid' || order.status === 'refunded' || order.kind !== 'products') return sum;
    return sum + order.items.reduce((count, item) => count + (item.productId === product.id ? item.quantity : 0), 0);
  }, 0);
  retailProduct.sold = actualSales;
  retailProduct.stock = Number.isSafeInteger(Number(product.stock)) && product.stock !== null ? Number(product.stock) : null;
  retailProduct.stockAvailable = availableProductStock(product);
  if (userCanResell(user, product.id) && resellerPrice !== null && resellerPrice !== undefined && Number.isSafeInteger(Number(resellerPrice))) {
    return { ...retailProduct, price: Number(resellerPrice), priceContext: 'reseller' };
  }
  if (resellerPrice !== null && resellerPrice !== undefined && Number.isSafeInteger(Number(bulkMinimum)) && Number(bulkMinimum) >= 2) retailProduct.bulkUnlockQuantity = Number(bulkMinimum);
  return { ...retailProduct, priceContext: 'retail' };
}

function resolveSpecifications(product, selection) {
  const requested = selection && typeof selection === 'object' && !Array.isArray(selection) ? selection : {};
  const specifications = Array.isArray(product.specifications) ? product.specifications : [];
  const allowedIds = new Set(specifications.map((specification) => specification.id));
  if (Object.keys(requested).some((id) => !allowedIds.has(id))) return { error: 'Pilihan produk sudah berubah. Pilih spesifikasi lagi.' };
  let adjustment = 0;
  const snapshot = [];
  for (const specification of specifications) {
    const value = requested[specification.id];
    if (!value && specification.required !== false) return { error: `Pilih ${specification.name} terlebih dahulu.` };
    if (!value) continue;
    if (!Array.isArray(specification.options)) return { error: 'Pilihan produk belum dikonfigurasi dengan benar.' };
    const option = specification.options.find((entry) => entry.value === value);
    if (!option) return { error: `Pilihan ${specification.name} sudah tidak tersedia. Muat ulang produk.` };
    adjustment += Number(option.priceAdjustment) || 0;
    snapshot.push({ id: specification.id, name: specification.name, value: option.value, label: option.label });
  }
  const unitPrice = Number(product.price) + adjustment;
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 1 || unitPrice > 100000000) return { error: 'Harga pilihan produk tidak valid.' };
  return { specifications: snapshot, unitPrice };
}

function requireAdmin(req) {
  return activeSession(req);
}

function adminAuthStatus(req) {
  return activeUser(req) ? 403 : 401;
}

function validateProduct(input, id, products) {
  if (!input || typeof input !== 'object') return 'Data produk tidak valid.';
  const stringFields = ['name', 'slug', 'duration', 'fulfillment', 'description'];
  for (const field of stringFields) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > (field === 'description' ? 2400 : 180)) return `Periksa kolom ${field}.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) return 'URL produk hanya boleh berisi huruf kecil, angka, dan tanda hubung.';
  if (!readStorefront().categories.some((item) => item.slug === input.category)) return 'Kategori tidak dikenal.';
  if (!Number.isSafeInteger(Number(input.price)) || Number(input.price) < 0) return 'Harga harus berupa angka nol atau lebih.';
  if (input.stock !== null && input.stock !== '' && input.stock !== undefined && (!Number.isSafeInteger(Number(input.stock)) || Number(input.stock) < 0 || Number(input.stock) > 1000000)) return 'Stok harus berupa bilangan bulat antara 0 dan 1.000.000.';
  const reserved = reservedProductQuantity(id);
  if (input.stock !== null && input.stock !== '' && input.stock !== undefined && Number(input.stock) < reserved) return `Stok tidak bisa di bawah ${reserved} unit yang sedang menunggu pembayaran.`;
  if (input.resellerPrice !== null && input.resellerPrice !== '' && input.resellerPrice !== undefined) {
    if (!Number.isSafeInteger(Number(input.resellerPrice)) || Number(input.resellerPrice) < 1 || Number(input.resellerPrice) >= Number(input.price)) return 'Harga reseller harus lebih rendah dari harga retail.';
    if (!Number.isSafeInteger(Number(input.bulkMinimum)) || Number(input.bulkMinimum) < 2 || Number(input.bulkMinimum) > 99) return 'Minimum pembelian reseller harus 2–99 unit.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.createdAt) || Number.isNaN(Date.parse(input.createdAt))) return 'Tanggal produk harus memakai format YYYY-MM-DD.';
  if (!['ready', 'preorder'].includes(input.orderMode)) return 'Pilih status pesanan yang tersedia.';
  if (typeof input.preOrderConfirmed !== 'boolean') return 'Konfirmasi stok tidak valid.';
  if (!input.terms || typeof input.terms !== 'object' || Array.isArray(input.terms) || Object.keys(input.terms).length > 20) return 'Ketentuan produk tidak valid.';
  for (const [label, value] of Object.entries(input.terms)) {
    if (!label.trim() || label.length > 80 || typeof value !== 'string' || value.length > 500) return 'Periksa daftar ketentuan produk.';
  }
  if (!Array.isArray(input.specifications) || input.specifications.length > 8) return 'Spesifikasi produk harus berupa daftar, maksimal 8 pilihan.';
  const specificationIds = new Set();
  for (const specification of input.specifications) {
    if (!specification || !/^[a-z0-9-]{1,48}$/.test(specification.id || '') || typeof specification.name !== 'string' || !specification.name.trim() || specification.name.length > 80 || specification.required !== undefined && typeof specification.required !== 'boolean' || !Array.isArray(specification.options) || !specification.options.length || specification.options.length > 30) return 'Periksa nama spesifikasi dan daftar pilihannya.';
    if (specificationIds.has(specification.id)) return 'ID spesifikasi tidak boleh sama.';
    specificationIds.add(specification.id);
    const optionValues = new Set();
    for (const option of specification.options) {
      if (!option || !/^[a-z0-9-]{1,64}$/.test(option.value || '') || typeof option.label !== 'string' || !option.label.trim() || option.label.length > 100 || !Number.isSafeInteger(Number(option.priceAdjustment || 0)) || Number(option.priceAdjustment || 0) < -Number(input.price) + 1 || Number(option.priceAdjustment || 0) > 100000000) return 'Periksa label pilihan dan penyesuaian harganya.';
      if (optionValues.has(option.value)) return 'Pilihan pada satu spesifikasi tidak boleh sama.';
      optionValues.add(option.value);
    }
  }
  if (products.some((product) => product.id !== id && product.slug === input.slug)) return 'URL produk sudah dipakai produk lain.';
  if (input.image && !safeAssetPath(input.image)) return 'Pilih gambar yang sudah diunggah.';
  return null;
}

function loginLimited(req) {
  const key = clientAddress(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (record.resetAt <= now) {
    loginAttempts.set(key, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  return record.count >= 8;
}

function recordLoginFailure(req) {
  const key = clientAddress(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (record.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.count++;
    loginAttempts.set(key, record);
  }
}

function failedLogin(req, attempts) {
  const key = clientAddress(req);
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (record.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else { record.count++; attempts.set(key, record); }
}

function limitedLogin(req, attempts) {
  const key = clientAddress(req);
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt <= now) return false;
  return record.count >= 8;
}

function productSlugAvailable(slug, products, id = '') {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !products.some((product) => product.id !== id && product.slug === slug);
}

function normalizeProduct(input, id, products) {
  if (!input || typeof input !== 'object') return { error: 'Data produk tidak valid.' };
  const product = {
    ...input,
    id,
    price: Number(input.price),
    stock: input.stock === '' || input.stock === null || input.stock === undefined ? null : Number(input.stock),
    archived: Boolean(input.archived),
    resellerPrice: input.resellerPrice === '' || input.resellerPrice === null || input.resellerPrice === undefined ? null : Number(input.resellerPrice),
    bulkMinimum: input.resellerPrice === '' || input.resellerPrice === null || input.resellerPrice === undefined ? null : Number(input.bulkMinimum),
    specifications: Array.isArray(input.specifications) ? input.specifications : [],
  };
  const error = validateProduct(product, id, products);
  return error ? { error } : { product };
}

function reservedProductQuantity(productId, excludeOrderId = '') {
  const now = Date.now();
  return readOrders().reduce((sum, order) => {
    if (order.id === excludeOrderId || order.kind !== 'products' || order.paymentStatus !== 'pending') return sum;
    const expires = Date.parse(order.paymentExpiresAt || order.reservationExpiresAt || '');
    if (Number.isFinite(expires) && expires <= now) return sum;
    return sum + (order.items || []).reduce((quantity, item) => quantity + (item.productId === productId ? Number(item.quantity) || 0 : 0), 0);
  }, 0);
}

function availableProductStock(product, excludeOrderId = '') {
  if (product.stock === null || product.stock === undefined || product.stock === '') return null;
  return Math.max(0, Number(product.stock) - reservedProductQuantity(product.id, excludeOrderId));
}

function safeAssetPath(value) {
  return typeof value === 'string' && /^\/assets\/uploads\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(value);
}

function validateStorefrontUpdate(input) {
  if (!input || typeof input !== 'object') return 'Data toko tidak valid.';
  if (Array.isArray(input.categories)) {
    if (input.categories.length > 20) return 'Jumlah kategori maksimal 20.';
    const slugs = new Set();
    for (const category of input.categories) {
      if (!category || !productSlugAvailable(category.slug, [] ) || typeof category.name !== 'string' || !category.name.trim() || category.name.length > 80) return 'Periksa nama dan alamat kategori.';
      if (slugs.has(category.slug)) return 'Alamat kategori tidak boleh sama.';
      slugs.add(category.slug);
      if (category.image && !safeAssetPath(category.image)) return 'Gambar kategori harus berasal dari unggahan toko.';
    }
    const used = new Set(readProducts().map((product) => product.category));
    if ([...used].some((slug) => !slugs.has(slug))) return 'Pindahkan produk sebelum menghapus kategorinya.';
  }
  if (Array.isArray(input.banners)) {
    if (input.banners.length > 10) return 'Jumlah banner maksimal 10.';
    for (const banner of input.banners) {
      if (!banner || typeof banner.title !== 'string' || banner.title.length > 120 || typeof banner.description !== 'string' || banner.description.length > 300 || !/^#\//.test(banner.href || '')) return 'Periksa judul, keterangan, dan tujuan banner.';
      if (banner.image && !safeAssetPath(banner.image)) return 'Gambar banner harus berasal dari unggahan toko.';
    }
  }
  if (Array.isArray(input.promotions)) {
    if (input.promotions.length > 30) return 'Jumlah promo maksimal 30.';
    for (const promo of input.promotions) {
      if (!promo || typeof promo.title !== 'string' || !promo.title.trim() || promo.title.length > 120 || typeof promo.description !== 'string' || promo.description.length > 300 || !/^#\//.test(promo.href || '')) return 'Periksa judul, keterangan, dan tujuan promo.';
      if (promo.image && !safeAssetPath(promo.image)) return 'Gambar promo harus berasal dari unggahan toko.';
    }
  }
  if (input.resellerPlan) {
    const plan = input.resellerPlan;
    if (!Number.isSafeInteger(Number(plan.price)) || Number(plan.price) < 149000 || typeof plan.terms !== 'string' || !plan.terms.trim() || plan.terms.length > 5000) return 'Harga paket reseller minimal Rp149.000 dan syaratnya wajib diisi.';
  }
  return null;
}

function uploadedImage(buffer, mime) {
  if (mime === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function resellerEntitlementsFor(user, orders, products) {
  const qualifyingOrders = orders.filter((order) => order.userId === user.id && order.paymentStatus === 'paid' && order.status !== 'refunded' && order.kind === 'products');
  const entitled = new Set();
  for (const order of qualifyingOrders) {
    const totals = new Map();
    for (const item of order.items || []) {
      const product = products.find((entry) => entry.id === item.productId);
      const minimum = item.bulkMinimumSnapshot ?? product?.bulkMinimum;
      const total = totals.get(item.productId) || { quantity: 0, minimum };
      total.quantity += Number(item.quantity) || 0;
      total.minimum = total.minimum ?? minimum;
      totals.set(item.productId, total);
    }
    for (const [productId, total] of totals) {
      const product = products.find((entry) => entry.id === productId);
      if (product && product.resellerPrice !== null && product.resellerPrice !== undefined && Number.isSafeInteger(Number(total.minimum)) && Number(total.minimum) >= 2 && total.quantity >= Number(total.minimum)) entitled.add(product.id);
    }
  }
  return [...entitled];
}

function markOrderPaid(order, provider, reference) {
  if (order.paymentStatus === 'paid') return { order, changed: false };
  const verifiedLateSettlement = order.paymentStatus === 'cancelled' && provider === 'QRIS otomatis';
  if (order.paymentStatus !== 'pending' && !verifiedLateSettlement) return { error: 'Status pembayaran pesanan ini tidak dapat diubah.' };
  const now = new Date().toISOString();
  const updated = { ...order, paymentStatus: 'paid', paidAt: now, status: 'paid', paymentVerification: { provider, transactionReference: reference, verifiedAt: now } };
  return { order: updated, changed: true };
}

function syncResellerAccess(order, orders) {
  const users = readUsers();
  const userIndex = users.findIndex((entry) => entry.id === order.userId);
  if (userIndex < 0) return;
  const user = users[userIndex];
  if (order.kind === 'reseller-plan') users[userIndex] = { ...user, resellerPlan: { active: true, orderId: order.id, purchasedAt: order.paidAt } };
  else users[userIndex] = { ...user, productEntitlements: resellerEntitlementsFor(user, orders, readProducts()) };
  saveUsers(users);
}

function matchingMidtransPayment(order, payment, config = midtransConfig()) {
  const amount = Number(payment?.gross_amount);
  const merchantId = order.midtransMerchantId || config?.merchantId;
  return payment?.order_id === order.id
    && typeof payment?.merchant_id === 'string' && payment.merchant_id.length > 0
    && (!merchantId || payment.merchant_id === merchantId)
    && payment?.currency === 'IDR'
    && payment?.payment_type === 'qris'
    && Number.isFinite(amount) && amount === Number(order.total);
}

async function existingMidtransPayment(order, config) {
  try {
    const payment = await midtransRequest('GET', `/v2/${encodeURIComponent(order.id)}/status`, undefined, config);
    return matchingMidtransPayment(order, payment, config) ? payment : null;
  } catch {
    return null;
  }
}

function cancelPendingOrder(orderId) {
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === orderId);
  if (index < 0 || orders[index].paymentStatus !== 'pending') return null;
  orders[index] = { ...orders[index], paymentStatus: 'cancelled', status: 'cancelled', cancelledAt: new Date().toISOString() };
  saveOrders(orders);
  return orders[index];
}

function midtransOrderTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw Object.assign(new Error('Waktu pesanan tidak valid untuk pembayaran.'), { status: 400 });
  return `${new Date(timestamp + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)} +0700`;
}

function midtransChargeBody(order) {
  const items = order.kind === 'reseller-plan'
    ? [{ id: 'reseller-plan', price: Number(order.total), quantity: 1, name: 'Paket reseller Bacshop' }]
    : order.items.map((item) => ({
      id: String(item.productId).slice(0, 50),
      price: Number(item.unitPrice),
      quantity: Number(item.quantity),
      name: String(item.name).slice(0, 50),
    }));
  const user = readUsers().find((entry) => entry.id === order.userId);
  const nameParts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
  const customerDetails = user ? {
    first_name: (nameParts.shift() || 'Pelanggan').slice(0, 50),
    ...(nameParts.length ? { last_name: nameParts.join(' ').slice(0, 50) } : {}),
    email: String(user.email).slice(0, 254),
  } : undefined;
  return {
    payment_type: 'qris',
    transaction_details: { order_id: order.id, gross_amount: Number(order.total) },
    item_details: items,
    ...(customerDetails ? { customer_details: customerDetails } : {}),
    qris: { acquirer: 'gopay' },
    custom_expiry: { order_time: midtransOrderTime(order.createdAt), expiry_duration: 30, unit: 'minute' },
  };
}

async function createOrderQris(order) {
  const config = midtransConfig();
  if (!config) throw Object.assign(new Error('QRIS dinamis belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan mode akun di environment server.'), { status: 503 });
  let payment;
  if (order.midtransTransactionId) {
    payment = await midtransRequest('GET', `/v2/${encodeURIComponent(order.id)}/status`, undefined, config);
    if (!matchingMidtransPayment(order, payment, config)) throw Object.assign(new Error('Status QRIS yang ditemukan tidak cocok dengan pesanan.'), { status: 502 });
  } else {
    try {
      payment = await midtransRequest('POST', '/v2/charge', midtransChargeBody(order), config);
    } catch (error) {
      const possiblyCreated = error.transportFailure || [406, 409].includes(error.providerHttpStatus) || /duplicate|already exists/i.test(error.providerMessage || '');
      if (!possiblyCreated || error.paymentChannelInactive) throw error;
      payment = await existingMidtransPayment(order, config);
      if (!payment) throw error;
    }
  }

  if (String(payment.status_code) === '402' && /payment channel is not activated/i.test(String(payment.status_message || ''))) {
    throw Object.assign(new Error('Kanal QRIS dinamis belum diaktifkan untuk Core API akun Midtrans ini. Minta aktivasi QRIS dinamis untuk mode akun yang sedang dipakai.'), { status: 502 });
  }
  if (['settlement', 'capture'].includes(payment.transaction_status)) {
    if (!['200', '201'].includes(String(payment.status_code)) || payment.fraud_status !== 'accept') throw Object.assign(new Error('Pembayaran belum dapat diverifikasi.'), { status: 502 });
    const result = savePaidOrder(order, 'QRIS otomatis', payment.transaction_id || order.id);
    if (result.error) throw Object.assign(new Error(result.error), { status: 409 });
    return result.order;
  }
  if (['expire', 'cancel', 'deny'].includes(payment.transaction_status)) {
    cancelPendingOrder(order.id);
    throw Object.assign(new Error('QRIS untuk pesanan ini sudah tidak aktif. Buat pesanan baru untuk membayar.'), { status: 409 });
  }
  const responseMatches = {
    orderId: payment.order_id === order.id,
    amount: Number(payment.gross_amount) === Number(order.total),
    method: payment.payment_type === 'qris',
    status: payment.transaction_status === 'pending',
    merchant: typeof payment.merchant_id === 'string' && payment.merchant_id.length > 0 && (!config.merchantId || payment.merchant_id === config.merchantId),
    currency: payment.currency === 'IDR',
    accepted: ['200', '201'].includes(String(payment.status_code)),
  };
  const mismatches = Object.entries(responseMatches).filter(([, matches]) => !matches).map(([field]) => field);
  if (mismatches.length) {
    const labels = { orderId: 'ID pesanan', amount: 'nominal', method: 'metode QRIS', status: 'status transaksi', merchant: 'identitas merchant', currency: 'mata uang', accepted: 'kode respons' };
    throw Object.assign(new Error(`Respons Midtrans tidak cocok pada ${mismatches.map((field) => labels[field]).join(', ')}.`), { status: 502 });
  }

  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
  if (index < 0 || orders[index].paymentStatus !== 'pending') throw Object.assign(new Error('Status pesanan sudah berubah. Muat ulang halaman pesanan.'), { status: 409 });
  const imageSource = {
    ...payment,
    qr_string: payment.qr_string || order.paymentQrString || '',
    actions: Array.isArray(payment.actions) && payment.actions.length ? payment.actions : order.paymentQrActions?.length ? order.paymentQrActions : payment.transaction_id
      ? [{ name: 'generate-qr-code', method: 'GET', url: `${config.baseUrl}/v2/qris/${encodeURIComponent(payment.transaction_id)}/qr-code` }]
      : [],
  };
  const initialized = {
    ...orders[index],
    paymentInitialized: true,
    midtransTransactionId: payment.transaction_id || orders[index].midtransTransactionId || '',
    midtransMerchantId: typeof payment.merchant_id === 'string' ? payment.merchant_id : orders[index].midtransMerchantId || '',
    paymentExpiresAt: payment.expiry_time || orders[index].paymentExpiresAt || '',
    paymentQrString: typeof imageSource.qr_string === 'string' && imageSource.qr_string.length <= 4096 ? imageSource.qr_string : '',
    paymentQrActions: Array.isArray(imageSource.actions) ? imageSource.actions.filter((action) => ['generate-qr-code-v2', 'generate-qr-code'].includes(action?.name) && typeof action?.url === 'string').slice(0, 2) : [],
  };
  orders[index] = initialized;
  saveOrders(orders);

  const qrisImage = await midtransQrImage(imageSource, config);
  const latestOrders = readOrders();
  const latestIndex = latestOrders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
  if (latestIndex < 0 || latestOrders[latestIndex].paymentStatus !== 'pending') throw Object.assign(new Error('Status pesanan sudah berubah. Muat ulang halaman pesanan.'), { status: 409 });
  latestOrders[latestIndex] = {
    ...latestOrders[latestIndex],
    qrisImage,
    status: 'awaiting_payment',
    paymentInstructions: 'Pindai QRIS ini menggunakan aplikasi pembayaran yang mendukung QRIS. Pastikan nominal sesuai sebelum membayar.',
  };
  delete latestOrders[latestIndex].paymentQrString;
  delete latestOrders[latestIndex].paymentQrActions;
  saveOrders(latestOrders);
  saveAudit({ actor: 'Midtrans', action: 'qris_created', orderId: order.id, amount: order.total });
  return latestOrders[latestIndex];
}

function savePaidOrder(order, provider, reference) {
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id);
  if (index < 0) return { error: 'Pesanan tidak ditemukan.' };
  const result = markOrderPaid(orders[index], provider, reference);
  if (result.error) return result;
  if (result.changed) {
    let paidOrder = result.order;
    if (paidOrder.kind === 'products') {
      const products = readProducts();
      for (const item of paidOrder.items || []) {
        const product = products.find((entry) => entry.id === item.productId);
        if (product && product.stock !== null && product.stock !== undefined && product.stock !== '') {
          product.stock = Math.max(0, Number(product.stock) - Number(item.quantity || 0));
        }
      }
      saveProducts(products);
      paidOrder = { ...paidOrder, stockDeducted: true };
    }
    orders[index] = paidOrder;
    result.order = paidOrder;
    saveOrders(orders);
    syncResellerAccess(result.order, orders);
    saveAudit({ actor: provider, action: 'payment_verified', orderId: result.order.id, amount: result.order.total, transactionReference: reference });
  }
  return result;
}

function refundIsConfirmed(payment, order) {
  if (payment?.transaction_status !== 'refund' || Number(payment.refund_amount) !== Number(order.total)) return false;
  if (payment.bank_confirmed_at) return true;
  return Array.isArray(payment.refunds) && payment.refunds.some((refund) => refund?.bank_confirmed_at && Number(refund.refund_amount) === Number(order.total));
}

function saveRefundRequest(order, refundKey, reason, providerStatus = 'requested', actor = 'Admin') {
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id);
  if (index < 0 || orders[index].paymentStatus !== 'paid') return { error: 'Pesanan tidak lagi berstatus lunas.' };
  const current = orders[index];
  const updated = {
    ...current,
    refundStatus: 'requested',
    refundKey: current.refundKey || refundKey,
    refundReason: current.refundReason || reason,
    refundRequestedAt: current.refundRequestedAt || new Date().toISOString(),
    refundProviderStatus: providerStatus,
  };
  orders[index] = updated;
  saveOrders(orders);
  if (!current.refundRequestedAt) saveAudit({ actor, action: 'payment_refund_requested', orderId: order.id, amount: order.total });
  return { order: updated };
}

function saveConfirmedRefund(order, payment, provider = 'QRIS otomatis') {
  if (!refundIsConfirmed(payment, order)) return { error: 'Midtrans belum mengonfirmasi pengembalian dana sepenuhnya.' };
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id);
  if (index < 0) return { error: 'Pesanan tidak ditemukan.' };
  if (orders[index].paymentStatus === 'refunded') return { order: orders[index], changed: false };
  if (orders[index].paymentStatus !== 'paid') return { error: 'Hanya pesanan lunas yang dapat dikembalikan.' };
  const updated = {
    ...orders[index],
    paymentStatus: 'refunded',
    status: 'refunded',
    refundStatus: 'confirmed',
    refundedAt: new Date().toISOString(),
    refundProviderReference: payment.transaction_id || order.midtransTransactionId || '',
  };
  orders[index] = updated;
  saveOrders(orders);
  syncResellerAccess(updated, orders);
  saveAudit({ actor: provider, action: 'payment_refunded', orderId: updated.id, amount: updated.total });
  return { order: updated, changed: true };
}

async function handleApi(req, res, url) {
  if (req.method === 'POST' && url.pathname === MIDTRANS_NOTIFY_PATH) return handleMidtransNotify(req, res);
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && !sameOrigin(req)) return json(res, 403, { error: 'Permintaan hanya dapat dimulai dari situs Bacshop.' });
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { status: 'ok', paymentConfigured: Boolean(midtransConfig()) });
  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    const user = activeUser(req);
    return json(res, 200, { user: user ? publicUser(user) : null });
  }
  if (req.method === 'GET' && url.pathname === '/api/storefront') return json(res, 200, readStorefront());
  if (req.method === 'GET' && url.pathname === '/api/products') {
    const user = activeUser(req);
    return json(res, 200, { products: readProducts().filter((product) => !product.archived).map((product) => publicProduct(product, user)) });
  }
  if (req.method === 'GET' && url.pathname === '/api/orders') {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk melihat pesanan.' });
    const orders = readOrders().filter((order) => order.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json(res, 200, { orders: orders.map(publicOrder) });
  }
  const ownOrderMatch = url.pathname.match(/^\/api\/orders\/([A-Za-z0-9-]+)$/);
  if (req.method === 'GET' && ownOrderMatch) {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk melihat pesanan.' });
    const order = readOrders().find((entry) => entry.id === ownOrderMatch[1] && entry.userId === user.id);
    return order ? json(res, 200, { order: publicOrder(order) }) : json(res, 404, { error: 'Pesanan tidak ditemukan.' });
  }
  const createQrisMatch = url.pathname.match(/^\/api\/orders\/([A-Za-z0-9-]+)\/create-qris$/);
  if (req.method === 'POST' && createQrisMatch) {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk membuat QRIS.' });
    const order = readOrders().find((entry) => entry.id === createQrisMatch[1] && entry.userId === user.id);
    if (!order) return json(res, 404, { error: 'Pesanan tidak ditemukan.' });
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded' || order.qrisImage) return json(res, 200, { order: publicOrder(order) });
    if (order.paymentStatus !== 'pending') return json(res, 409, { error: 'Pesanan ini sudah tidak dapat dibayar.' });
    const reservationExpiry = Date.parse(order.reservationExpiresAt || '');
    if (Number.isFinite(reservationExpiry) && reservationExpiry <= Date.now()) {
      const orders = readOrders();
      const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === user.id);
      if (index >= 0 && orders[index].paymentStatus === 'pending') {
        orders[index] = { ...orders[index], paymentStatus: 'cancelled', status: 'cancelled', cancelledAt: new Date().toISOString() };
        saveOrders(orders);
      }
      return json(res, 409, { error: 'Waktu konfirmasi pesanan habis. Silakan buat pesanan baru.' });
    }
    if (paymentCreationLocks.has(order.id)) return json(res, 409, { error: 'QRIS sedang dibuat. Tunggu sebentar lalu muat ulang pesanan.' });
    paymentCreationLocks.add(order.id);
    try {
      const updated = await createOrderQris(order);
      return json(res, 200, { order: publicOrder(updated) });
    } catch (error) {
      return json(res, error.status || 502, { error: error.message || 'QRIS belum dapat dibuat. Coba lagi beberapa saat.' });
    } finally {
      paymentCreationLocks.delete(order.id);
    }
  }
  const checkPaymentMatch = url.pathname.match(/^\/api\/orders\/([A-Za-z0-9-]+)\/check-payment$/);
  if (req.method === 'POST' && checkPaymentMatch) {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk memeriksa pembayaran.' });
    const order = readOrders().find((entry) => entry.id === checkPaymentMatch[1] && entry.userId === user.id);
    if (!order) return json(res, 404, { error: 'Pesanan tidak ditemukan.' });
    if (order.paymentStatus === 'refunded' || order.paymentStatus === 'paid' && order.refundStatus !== 'requested') return json(res, 200, { order: publicOrder(order) });
    const config = midtransConfig();
    const payment = await midtransRequest('GET', `/v2/${encodeURIComponent(order.id)}/status`, undefined, config);
    if (!matchingMidtransPayment(order, payment, config)) return json(res, 502, { error: 'Status pembayaran tidak cocok dengan pesanan.' });
    if (payment.transaction_status === 'settlement') {
      if (payment.status_code !== '200' || payment.fraud_status !== 'accept') return json(res, 502, { error: 'Data pembayaran tidak cocok dengan nominal pesanan.' });
      const result = savePaidOrder(order, 'QRIS otomatis', payment.transaction_id || order.id);
      const updated = result.order || readOrders().find((entry) => entry.id === order.id);
      return json(res, 200, { order: publicOrder(updated) });
    }
    if (payment.transaction_status === 'refund' && order.paymentStatus === 'paid') {
      const result = refundIsConfirmed(payment, order)
        ? saveConfirmedRefund(order, payment)
      : saveRefundRequest(order, order.refundKey || `BCREFUND-${order.id}`, order.refundReason || 'Refund diproses melalui Midtrans.', 'requested', 'Midtrans');
      if (result.error) return json(res, 409, { error: result.error });
      return json(res, 200, { order: publicOrder(result.order) });
    }
    if (['expire', 'cancel', 'deny'].includes(payment.transaction_status) && order.paymentStatus === 'pending') {
      const cancelled = cancelPendingOrder(order.id);
      return json(res, 200, { order: publicOrder(cancelled || order) });
    }
    return json(res, 200, { order: publicOrder(order), providerStatus: payment.transaction_status || 'pending' });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/session') {
    const session = activeSession(req);
    return json(res, 200, { authenticated: Boolean(session), email: session?.email || '', setupRequired: !adminRecord });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/products') {
    const session = activeSession(req);
    if (!session) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    return json(res, 200, { products: readProducts().map((product) => ({ ...product, stockAvailable: availableProductStock(product) })) });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/storefront') {
    if (!activeSession(req)) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    return json(res, 200, readStorefront());
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/orders') {
    if (!activeSession(req)) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const users = new Map(readUsers().map((user) => [user.id, user]));
    const orders = readOrders().map((order) => ({ ...publicOrder(order), customer: users.has(order.userId) ? { name: users.get(order.userId).name, email: users.get(order.userId).email } : null }));
    return json(res, 200, { orders });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/audit') {
    if (!activeSession(req)) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    return json(res, 200, { entries: readJson(AUDIT_FILE, []) });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    if (limitedLogin(req, userLoginAttempts)) return json(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.' });
    const body = await readBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (name.length < 2 || name.length > 80) return json(res, 400, { error: 'Nama harus terdiri dari 2–80 karakter.' });
    if (!validEmail(email)) return json(res, 400, { error: 'Masukkan email yang valid.' });
    if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 200) return json(res, 400, { error: 'Kata sandi minimal 10 karakter.' });
    const users = readUsers();
    if (users.some((user) => user.email === email)) return json(res, 409, { error: 'Email sudah digunakan. Silakan masuk.' });
    const { salt, hash } = hashPassword(body.password);
    const user = { id: crypto.randomUUID(), name, email, salt, hash, avatarUrl: '', productEntitlements: [], resellerPlan: { active: false }, createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    setUserSession(res, user.id);
    userLoginAttempts.delete(clientAddress(req));
    return json(res, 201, { user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    if (limitedLogin(req, userLoginAttempts)) return json(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.' });
    const body = await readBody(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const user = readUsers().find((entry) => entry.email === email);
    if (!user || !passwordMatchesRecord(body.password, user)) {
      failedLogin(req, userLoginAttempts);
      return json(res, 401, { error: 'Email atau kata sandi belum cocok.' });
    }
    userLoginAttempts.delete(clientAddress(req));
    setUserSession(res, user.id);
    return json(res, 200, { user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    clearUserSession(req, res);
    return json(res, 200, { user: null });
  }

  if (req.method === 'PUT' && url.pathname === '/api/auth/profile') {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk mengubah profil.' });
    const body = await readBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 80) return json(res, 400, { error: 'Nama harus terdiri dari 2–80 karakter.' });
    if (body.avatarUrl && !safeAssetPath(body.avatarUrl)) return json(res, 400, { error: 'Foto profil harus berasal dari unggahan toko.' });
    const users = readUsers();
    const index = users.findIndex((entry) => entry.id === user.id);
    users[index] = { ...user, name, avatarUrl: body.avatarUrl || user.avatarUrl || '' };
    saveUsers(users);
    return json(res, 200, { user: publicUser(users[index]) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/avatar') {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk untuk mengubah foto profil.' });
    const body = await readBody(req, 8 * 1024 * 1024);
    const mime = typeof body.mimeType === 'string' ? body.mimeType.toLowerCase() : '';
    const data = typeof body.data === 'string' ? body.data : '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return json(res, 400, { error: 'Pilih gambar PNG, JPEG, atau WebP.' });
    const bytes = Buffer.from(data, 'base64');
    if (!bytes.length || bytes.length > 5 * 1024 * 1024 || !uploadedImage(bytes, mime)) return json(res, 400, { error: 'File gambar tidak valid atau melebihi 5 MB.' });
    const extension = mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.webp';
    const fileName = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), bytes, { flag: 'wx', mode: 0o644 });
    const users = readUsers();
    const index = users.findIndex((entry) => entry.id === user.id);
    users[index] = { ...user, avatarUrl: `/assets/uploads/${fileName}` };
    saveUsers(users);
    saveAudit({ actor: user.email, action: 'avatar_updated', imageUrl: users[index].avatarUrl });
    return json(res, 201, { user: publicUser(users[index]) });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const user = activeUser(req);
    if (!user) return json(res, 401, { error: 'Masuk sebelum membuat pesanan.' });
    const body = await readBody(req);
    const storefront = readStorefront();
    const products = readProducts();
    const now = new Date().toISOString();
    let kind = 'products';
    let items = [];
    let total = 0;
    if (body.kind === 'reseller-plan') {
      if (user.resellerPlan?.active) return json(res, 409, { error: 'Paket reseller sudah aktif di akun ini.' });
      const plan = storefront.resellerPlan;
      kind = 'reseller-plan';
      total = Number(plan.price);
    } else {
      if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return json(res, 400, { error: 'Keranjang tidak berisi produk yang dapat dipesan.' });
      const combined = new Map();
      for (const requested of body.items) {
        const product = products.find((entry) => entry.id === requested?.id);
        const quantity = Number(requested?.quantity);
        if (!product || product.archived || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || product.orderMode === 'preorder' && !product.preOrderConfirmed) return json(res, 400, { error: 'Periksa produk, jumlah, atau ketersediaan stok di keranjang.' });
        const selection = resolveSpecifications(product, requested.specifications);
        if (selection.error) return json(res, 400, { error: selection.error });
        const key = product.id + ':' + JSON.stringify(selection.specifications.map((entry) => [entry.id, entry.value]));
        const previous = combined.get(key);
        const combinedQuantity = (previous?.quantity || 0) + quantity;
        if (combinedQuantity > 99) return json(res, 400, { error: 'Jumlah satu pilihan produk maksimal 99 unit.' });
        combined.set(key, { product, quantity: combinedQuantity, selection });
      }
      const stockByProduct = new Map();
      for (const entry of combined.values()) {
        const { product, quantity, selection } = entry;
        stockByProduct.set(product.id, (stockByProduct.get(product.id) || 0) + quantity);
        const eligible = userCanResell(user, product.id) && Number.isSafeInteger(Number(product.resellerPrice));
        const adjustment = selection.unitPrice - Number(product.price);
        const unitPrice = (eligible ? Number(product.resellerPrice) : Number(product.price)) + adjustment;
        if (!Number.isSafeInteger(unitPrice) || unitPrice < 1) return json(res, 400, { error: 'Harga pilihan ' + product.name + ' tidak valid.' });
        const lineTotal = unitPrice * quantity;
        items.push({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          quantity,
          specifications: selection.specifications,
          unitPrice,
          priceContext: eligible ? 'reseller' : 'retail',
          bulkMinimumSnapshot: product.bulkMinimum ?? null,
          lineTotal,
        });
        total += lineTotal;
      }
      for (const [productId, quantity] of stockByProduct) {
        const product = products.find((entry) => entry.id === productId);
        const available = availableProductStock(product);
        if (available !== null && quantity > available) return json(res, 409, { error: 'Stok ' + product.name + ' tersisa ' + available + ' unit.' });
      }
    }
    if (!Number.isSafeInteger(total) || total < 1 || total > 100000000) return json(res, 400, { error: 'Total pesanan tidak valid.' });
    const orderId = 'BC' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
    const order = {
      id: orderId,
      userId: user.id,
      kind,
      items,
      total,
      currency: 'IDR',
      createdAt: now,
      paymentProvider: 'qris_dynamic',
      midtransMerchantId: '',
      paymentStatus: 'pending',
      paidAt: null,
      status: 'awaiting_payment',
      fulfillmentStatus: 'not_started',
      paymentInitialized: false,
      reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      paymentInstructions: 'Pesanan sudah dikonfirmasi. Informasi pembayaran akan tersedia pada tahap berikutnya.',
      resellerTerms: kind === 'reseller-plan' ? storefront.resellerPlan.terms : '',
    };
    const orders = readOrders();
    orders.push(order);
    saveOrders(orders);
    saveAudit({ actor: user.email, action: 'order_confirmed', orderId, amount: total });
    return json(res, 201, { order });
  }

  const adminPaymentMatch = url.pathname.match(/^\/api\/admin\/orders\/([A-Za-z0-9-]+)\/confirm-payment$/);
  if (req.method === 'POST' && adminPaymentMatch) {
    return json(res, 410, { error: 'Konfirmasi manual dinonaktifkan. Status hanya berubah setelah pembayaran dikonfirmasi otomatis.' });
  }

  const adminRefundMatch = url.pathname.match(/^\/api\/admin\/orders\/([A-Za-z0-9-]+)\/refund$/);
  if (req.method === 'POST' && adminRefundMatch) {
    const admin = requireAdmin(req);
    if (!admin) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const body = await readBody(req);
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (reason.length < 3 || reason.length > 255) return json(res, 400, { error: 'Catat alasan refund maksimal 255 karakter.' });
    const orders = readOrders();
    const orderIndex = orders.findIndex((entry) => entry.id === adminRefundMatch[1]);
    if (orderIndex < 0) return json(res, 404, { error: 'Pesanan tidak ditemukan.' });
    const order = orders[orderIndex];
    if (order.paymentStatus !== 'paid') return json(res, 409, { error: 'Hanya pesanan lunas yang dapat direfund.' });
    if (order.paymentProvider !== 'qris_dynamic' || !order.midtransTransactionId) return json(res, 409, { error: 'ID transaksi QRIS belum tersedia untuk refund.' });
    if (order.refundStatus === 'requested' && order.refundReason !== reason) return json(res, 409, { error: 'Ulangi permintaan refund dengan alasan yang sama agar Midtrans tidak menerima ID refund baru.' });
    if (paymentRefundLocks.has(order.id)) return json(res, 409, { error: 'Refund sedang diproses. Tunggu sebentar lalu periksa kembali.' });
    const refundKey = order.refundKey || `BCREFUND-${order.id}`;
    const prepared = saveRefundRequest(order, refundKey, reason, 'requested', admin.email);
    if (prepared.error) return json(res, 409, { error: prepared.error });
    paymentRefundLocks.add(order.id);
    try {
      const payment = await midtransRequest('POST', `/v2/${encodeURIComponent(order.midtransTransactionId)}/refund`, {
        refund_key: refundKey,
        amount: Number(order.total),
        reason,
      });
      if (payment.order_id !== order.id || payment.transaction_id !== order.midtransTransactionId || payment.payment_type !== 'qris' || Number(payment.gross_amount) !== Number(order.total) || Number(payment.refund_amount) !== Number(order.total) || payment.status_code !== '200' || payment.transaction_status !== 'refund') {
        return json(res, 502, { error: 'Midtrans belum mengonfirmasi refund penuh. Status pesanan tetap lunas sampai refund terverifikasi.' });
      }
      const updated = refundIsConfirmed(payment, prepared.order)
        ? saveConfirmedRefund(prepared.order, payment, admin.email)
        : saveRefundRequest(prepared.order, refundKey, reason, payment.transaction_status, admin.email);
      if (updated.error) return json(res, 409, { error: updated.error });
      const confirmed = updated.order.paymentStatus === 'refunded';
      return json(res, confirmed ? 200 : 202, { order: publicOrder(updated.order), refundConfirmed: confirmed });
    } catch (error) {
      return json(res, error.status || 502, { error: 'Midtrans belum dapat memproses refund. Pesanan tetap lunas; ulangi dengan alasan yang sama atau periksa transaksi pada dashboard Midtrans.' });
    } finally {
      paymentRefundLocks.delete(order.id);
    }
  }

  const adminFulfillmentMatch = url.pathname.match(/^\/api\/admin\/orders\/([A-Za-z0-9-]+)\/fulfillment$/);
  if (req.method === 'POST' && adminFulfillmentMatch) {
    const admin = requireAdmin(req);
    if (!admin) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const body = await readBody(req);
    const allowedStatuses = new Set(['not_started', 'processing', 'needs_customer_input', 'fulfilled']);
    const status = typeof body.status === 'string' ? body.status : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!allowedStatuses.has(status) || note.length > 1000) return json(res, 400, { error: 'Periksa status dan catatan pemenuhan.' });
    const orders = readOrders();
    const orderIndex = orders.findIndex((entry) => entry.id === adminFulfillmentMatch[1]);
    if (orderIndex < 0) return json(res, 404, { error: 'Pesanan tidak ditemukan.' });
    if (orders[orderIndex].paymentStatus !== 'paid') return json(res, 409, { error: 'Pemenuhan baru dapat diperbarui setelah pembayaran terverifikasi.' });
    orders[orderIndex] = { ...orders[orderIndex], fulfillmentStatus: status, fulfillmentNote: note, fulfillmentUpdatedAt: new Date().toISOString() };
    saveOrders(orders);
    saveAudit({ actor: admin.email, action: 'fulfillment_updated', orderId: orders[orderIndex].id, status });
    return json(res, 200, { order: orders[orderIndex] });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/setup') {
    if (adminRecord || !setupCode) return json(res, 409, { error: 'Setup admin sudah digunakan.' });
    const body = await readBody(req);
    const supplied = Buffer.from(String(body.code || ''));
    const expected = Buffer.from(setupCode);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return json(res, 403, { error: 'Kode setup tidak cocok.' });
    if (!validEmail(body.email)) return json(res, 400, { error: 'Masukkan email admin yang valid.' });
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 200) return json(res, 400, { error: 'Kata sandi admin minimal 12 karakter.' });
    const { salt, hash } = hashPassword(body.password);
    adminRecord = { email: body.email.trim().toLowerCase(), salt, hash, createdAt: new Date().toISOString() };
    writeJsonAtomic(ADMIN_FILE, adminRecord);
    setupCode = null;
    setSession(res, adminRecord.email);
    return json(res, 201, { authenticated: true, email: adminRecord.email });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    if (loginLimited(req)) return json(res, 429, { error: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.' });
    const body = await readBody(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!adminRecord || email !== adminRecord.email || !passwordMatches(body.password)) {
      recordLoginFailure(req);
      return json(res, 401, { error: 'Email atau kata sandi belum cocok.' });
    }
    loginAttempts.delete(clientAddress(req));
    setSession(res, adminRecord.email);
    return json(res, 200, { authenticated: true, email: adminRecord.email });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
    clearSession(req, res);
    return json(res, 200, { authenticated: false });
  }

  if (url.pathname === '/api/admin/products' && req.method === 'POST') {
    const admin = requireAdmin(req);
    if (!admin) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const body = await readBody(req);
    const products = readProducts();
    const id = typeof body.product?.id === 'string' ? body.product.id : '';
    if (!/^[a-z0-9-]{2,64}$/.test(id) || products.some((product) => product.id === id)) return json(res, 400, { error: 'ID produk tidak valid atau sudah digunakan.' });
    const normalized = normalizeProduct(body.product, id, products);
    if (normalized.error) return json(res, 400, { error: normalized.error });
    products.push(normalized.product);
    saveProducts(products);
    saveAudit({ actor: admin.email, action: 'product_created', productId: id });
    return json(res, 201, { product: normalized.product });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/products/bulk') {
    const admin = requireAdmin(req);
    if (!admin) return json(res, adminAuthStatus(req), { error: 'Sesi admin berakhir. Silakan masuk lagi.' });
    const body = await readBody(req);
    const ids = Array.isArray(body.productIds) ? [...new Set(body.productIds.filter((id) => typeof id === 'string'))].slice(0, 200) : [];
    const action = body.action;
    if (!ids.length || !['archive', 'restore', 'delete'].includes(action)) return json(res, 400, { error: 'Pilih produk dan tindakan yang tersedia.' });
    const products = readProducts();
    const selected = new Set(ids);
    const found = products.filter((product) => selected.has(product.id));
    if (found.length !== ids.length) return json(res, 404, { error: 'Sebagian produk tidak ditemukan. Muat ulang daftar produk.' });
    const blocked = [];
    let changedIds = [];
    if (action === 'delete') {
      const orders = readOrders();
      const orderLinkedIds = new Set(orders.filter((order) => order.paymentStatus !== 'refunded').flatMap((order) => (order.items || []).map((item) => item.productId)));
      const removable = found.filter((product) => !orderLinkedIds.has(product.id));
      blocked.push(...found.filter((product) => orderLinkedIds.has(product.id)).map((product) => ({ id: product.id, name: product.name, reason: 'Memiliki riwayat pesanan; arsipkan saja.' })));
      changedIds = removable.map((product) => product.id);
      saveProducts(products.filter((product) => !changedIds.includes(product.id)));
    } else {
      changedIds = found.map((product) => product.id);
      const archived = action === 'archive';
      saveProducts(products.map((product) => selected.has(product.id) ? { ...product, archived } : product));
    }
    saveAudit({ actor: admin.email, action: `products_bulk_${action}`, productIds: changedIds, blockedProductIds: blocked.map((item) => item.id) });
    return json(res, 200, { changedIds, blocked, products: readProducts() });
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/storefront') {
    if (!activeSession(req)) return json(res, adminAuthStatus(req), { error: 'Masuk sebagai admin untuk melanjutkan.' });
    return json(res, 200, readStorefront());
  }

  if (req.method === 'PUT' && url.pathname === '/api/admin/storefront') {
    const admin = requireAdmin(req);
    if (!admin) return json(res, 401, { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const body = await readBody(req);
    const input = body.storefront;
    const error = validateStorefrontUpdate(input);
    if (error) return json(res, 400, { error });
    const current = readStorefront();
    const next = { ...current, ...input, resellerPlan: input.resellerPlan ? { ...current.resellerPlan, ...input.resellerPlan, price: Number(input.resellerPlan.price) } : current.resellerPlan, payment: input.payment ? { ...current.payment, ...input.payment } : current.payment };
    writeJsonAtomic(CMS_FILE, next);
    saveAudit({ actor: admin.email, action: 'storefront_updated', sections: Object.keys(input) });
    return json(res, 200, next);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/uploads') {
    const admin = requireAdmin(req);
    if (!admin) return json(res, 401, { error: 'Masuk sebagai admin untuk melanjutkan.' });
    const body = await readBody(req, 8 * 1024 * 1024);
    const mime = typeof body.mimeType === 'string' ? body.mimeType.toLowerCase() : '';
    const data = typeof body.data === 'string' ? body.data : '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime) || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return json(res, 400, { error: 'Unggah gambar PNG, JPEG, atau WebP.' });
    const bytes = Buffer.from(data, 'base64');
    if (!bytes.length || bytes.length > 5 * 1024 * 1024 || !uploadedImage(bytes, mime)) return json(res, 400, { error: 'File gambar tidak valid atau melebihi 5 MB.' });
    const extension = mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.webp';
    const fileName = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), bytes, { flag: 'wx', mode: 0o644 });
    const imageUrl = `/assets/uploads/${fileName}`;
    saveAudit({ actor: admin.email, action: 'image_uploaded', imageUrl, bytes: bytes.length });
    return json(res, 201, { imageUrl, mimeType: mime, bytes: bytes.length });
  }

  const updateMatch = url.pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
  if (['PUT', 'DELETE'].includes(req.method) && updateMatch) {
    const admin = requireAdmin(req);
    if (!admin) return json(res, adminAuthStatus(req), { error: 'Sesi admin berakhir. Silakan masuk lagi.' });
    const products = readProducts();
    const index = products.findIndex((product) => product.id === updateMatch[1]);
    if (index < 0) return json(res, 404, { error: 'Produk tidak ditemukan.' });
    if (req.method === 'DELETE') {
      const orders = readOrders();
      if (orders.some((order) => order.paymentStatus !== 'refunded' && order.items.some((item) => item.productId === updateMatch[1]))) return json(res, 409, { error: 'Produk memiliki riwayat pesanan dan tidak dapat dihapus.' });
      products.splice(index, 1);
      saveProducts(products);
      saveAudit({ actor: admin.email, action: 'product_deleted', productId: updateMatch[1] });
      return json(res, 200, { deleted: updateMatch[1] });
    }
    const body = await readBody(req);
    const normalized = normalizeProduct(body.product, updateMatch[1], products);
    if (normalized.error) return json(res, 400, { error: normalized.error });
    const updated = normalized.product;
    products[index] = updated;
    saveProducts(products);
    saveAudit({ actor: admin.email, action: 'product_updated', productId: updateMatch[1] });
    return json(res, 200, { product: updated });
  }

  return json(res, 404, { error: 'Endpoint tidak ditemukan.' });
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Metode tidak didukung.' });
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return json(res, 400, { error: 'Alamat tidak valid.' }); }
  const normalized = path.posix.normalize(decoded);
  if (normalized.startsWith('/data/') || normalized.startsWith('/.bacshop-private/') || normalized.includes('..')) {
    return json(res, 404, { error: 'File tidak ditemukan.' });
  }
  const allowed = normalized === '/' || normalized === '/index.html' || normalized === '/app.js' || normalized === '/styles.css' || normalized.startsWith('/assets/');
  if (!allowed) return json(res, 404, { error: 'File tidak ditemukan.' });
  const relative = normalized === '/' ? 'index.html' : normalized.slice(1);
  const uploadPrefix = '/assets/uploads/';
  const absolute = normalized.startsWith(uploadPrefix)
    ? path.resolve(UPLOAD_DIR, normalized.slice(uploadPrefix.length))
    : path.resolve(ROOT, relative);
  const allowedRoot = normalized.startsWith(uploadPrefix) ? path.resolve(UPLOAD_DIR) : ROOT;
  if (!absolute.startsWith(`${allowedRoot}${path.sep}`)) return json(res, 404, { error: 'File tidak ditemukan.' });
  let contents;
  try { contents = fs.readFileSync(absolute); } catch { return json(res, 404, { error: 'File tidak ditemukan.' }); }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(absolute)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...standardSecurityHeaders(),
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  });
  res.end(req.method === 'HEAD' ? undefined : contents);
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://${HOST}:${PORT}`); } catch { return json(res, 400, { error: 'Alamat tidak valid.' }); }
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else serveStatic(req, res, url.pathname);
  } catch (error) {
    if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Terjadi masalah di server lokal.' });
    else res.destroy();
    if (!error.status) console.error('Request failed:', error.message);
  }
});

server.listen(PORT, HOST, () => console.log(`Bacshop berjalan di http://${HOST}:${PORT}/`));

function stop() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
