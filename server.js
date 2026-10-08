'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const QRCode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');

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
const USER_SESSIONS_FILE = path.join(PRIVATE_DIR, 'user-sessions.json');
const ORDERS_FILE = path.join(PRIVATE_DIR, 'orders.json');
const CMS_FILE = path.join(PRIVATE_DIR, 'storefront.json');
const AUDIT_FILE = path.join(PRIVATE_DIR, 'audit.json');
const CHAT_DIR = path.join(PRIVATE_DIR, 'chat');
const CHAT_IMAGE_DIR = path.join(CHAT_DIR, 'images');
const chatSendLimits = new Map();
const chatEventClients = new Set();
const UPLOAD_DIR = process.env.BACSHOP_UPLOADS_DIR || path.join(ROOT, 'assets', 'uploads');
const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE = 'BacshopAdmin';
const USER_COOKIE = 'BacshopUser';
const CATEGORIES = new Set(['ai', 'streaming', 'desain', 'musik', 'office', 'editing', 'voucher']);
const MIDTRANS_NOTIFY_PATH = '/api/payments/notify';
const DOKU_NOTIFY_PATH = '/api/payments/doku/notify';
const PAYMENT_TEST_EMAIL = (process.env.BACSHOP_PAYMENT_TEST_EMAIL || '').trim().toLowerCase();
const MIME = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

function validateProductionConfiguration() {
  if (NODE_ENV !== 'production') {
    if (NODE_ENV !== 'test' && process.env.MIDTRANS_IS_PRODUCTION === 'true') {
      throw new Error('Kredensial Midtrans Production hanya boleh digunakan saat NODE_ENV=production.');
    }
    if (NODE_ENV !== 'test' && process.env.DOKU_IS_PRODUCTION === 'true') {
      throw new Error('Kredensial DOKU Production hanya boleh digunakan saat NODE_ENV=production.');
    }
    return;
  }
  if (!process.env.BACSHOP_PUBLIC_ORIGIN) throw new Error('Atur BACSHOP_PUBLIC_ORIGIN ke domain HTTPS Bacshop.');
  for (const name of ['BACSHOP_DATA_DIR', 'BACSHOP_PRODUCTS_FILE', 'BACSHOP_UPLOADS_DIR']) {
    if (!process.env[name] || !path.isAbsolute(process.env[name])) throw new Error(`${name} wajib menunjuk lokasi persistent yang absolut di production.`);
  }
  if (dokuConfig() && process.env.DOKU_IS_PRODUCTION !== 'true') throw new Error('Production Bacshop wajib memakai endpoint DOKU Production.');
  if (process.env.DOKU_IS_PRODUCTION === 'true' && !dokuConfig()) throw new Error('Konfigurasi DOKU Production belum lengkap atau private key tidak valid.');
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
const loginAttempts = new Map();
const userLoginAttempts = new Map();
const paymentCreationLocks = new Set();
const paymentRefundLocks = new Set();
const googleSignIns = new Map();
const googleLoginAttempts = new Map();
const GOOGLE_COOKIE = 'bacshop_google_oauth';
const GOOGLE_CALLBACK = '/api/auth/google/callback';
const GOOGLE_SIGN_IN_MS = 10 * 60 * 1000;
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

function readUserSessions() {
  const stored = readJson(USER_SESSIONS_FILE, {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function saveUserSessions(userSessions) {
  writeJsonAtomic(USER_SESSIONS_FILE, userSessions);
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
    authVisual: { image: '', alt: 'Gambar halaman masuk Bacshop' },
  };
}

function readStorefront() {
  const stored = readJson(CMS_FILE, null);
  const defaults = defaultStorefront();
  return stored && typeof stored === 'object'
    ? { ...defaults, ...stored, authVisual: { ...defaults.authVisual, ...stored.authVisual }, payment: { ...defaults.payment, provider: 'DOKU QRIS', available: Boolean(dokuConfig()) } }
    : { ...defaults, payment: { ...defaults.payment, provider: 'DOKU QRIS', available: Boolean(dokuConfig()) } };
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
  if (NODE_ENV === 'production' && !production) return null;
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

function dokuConfig() {
  const production = process.env.DOKU_IS_PRODUCTION === 'true';
  const testBaseUrl = NODE_ENV === 'test' ? process.env.DOKU_API_BASE_URL : '';
  const clientId = (process.env.DOKU_CLIENT_ID || '').trim();
  const clientSecret = (process.env.DOKU_CLIENT_SECRET || '').trim();
  const merchantId = (process.env.DOKU_MERCHANT_ID || '').trim();
  const terminalId = (process.env.DOKU_TERMINAL_ID || '').trim();
  const postalCode = (process.env.DOKU_POSTAL_CODE || '').trim();
  let privateKeyPem = process.env.DOKU_PRIVATE_KEY || '';
  if (process.env.DOKU_PRIVATE_KEY_BASE64) {
    const encoded = process.env.DOKU_PRIVATE_KEY_BASE64.trim();
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
    try { privateKeyPem = Buffer.from(encoded, 'base64').toString('utf8'); } catch { return null; }
  }
  privateKeyPem = privateKeyPem.replace(/\\n/g, '\n').trim();
  if (!clientId || !clientSecret || !merchantId || !/^[A-Za-z0-9]{3,16}$/.test(terminalId) || !/^\d{5}$/.test(postalCode) || !privateKeyPem) return null;
  let privateKey;
  try {
    privateKey = crypto.createPrivateKey(privateKeyPem);
    if (privateKey.asymmetricKeyType !== 'rsa') return null;
  } catch { return null; }
  const baseUrl = (testBaseUrl || (production ? 'https://api.doku.com' : 'https://api-sandbox.doku.com')).replace(/\/$/, '');
  try {
    const endpoint = new URL(baseUrl);
    if (endpoint.protocol !== 'https:' && !(NODE_ENV === 'test' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) return null;
  } catch { return null; }
  return { baseUrl, clientId, clientSecret, merchantId, terminalId, postalCode, privateKey, production };
}

let dokuAccessToken = null;

function dokuTimestamp() {
  return new Date().toISOString();
}

function generateDokuExternalId() {
  return `${Date.now()}${String(crypto.randomInt(0, 1000000)).padStart(6, '0')}`;
}

function dokuAmount(value) {
  return `${Math.trunc(Number(value))}.00`;
}

async function dokuAccessTokenFor(config) {
  if (dokuAccessToken?.expiresAt > Date.now() + 30000) return dokuAccessToken.value;
  const timestamp = dokuTimestamp();
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${config.clientId}|${timestamp}`);
  signer.end();
  const signature = signer.sign(config.privateKey, 'base64');
  let response;
  try {
    response = await fetch(`${config.baseUrl}/authorization/v1/access-token/b2b`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CLIENT-KEY': config.clientId, 'X-TIMESTAMP': timestamp, 'X-SIGNATURE': signature },
      body: JSON.stringify({ grantType: 'client_credentials' }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw Object.assign(new Error(error?.name === 'TimeoutError' ? 'Koneksi ke DOKU melewati batas waktu. Coba lagi.' : 'Server tidak dapat terhubung ke DOKU.'), { status: 502 });
  }
  let result;
  try { result = await response.json(); } catch { throw Object.assign(new Error('Respons autentikasi DOKU tidak dapat dibaca.'), { status: 502 }); }
  if (!response.ok || String(result.responseCode || '') !== '2007300' || typeof result.accessToken !== 'string' || result.tokenType !== 'Bearer') {
    console.error('DOKU token request rejected:', JSON.stringify({ httpStatus: response.status, code: String(result.responseCode || 'unknown') }));
    throw Object.assign(new Error('DOKU belum menerima autentikasi server. Periksa Client ID, Secret Key, dan pasangan RSA di environment.'), { status: 502 });
  }
  const seconds = Math.min(3600, Math.max(60, Number(result.expiresIn) || 900));
  dokuAccessToken = { value: result.accessToken, expiresAt: Date.now() + seconds * 1000 };
  return dokuAccessToken.value;
}

async function dokuSnapRequest(pathname, body, config = dokuConfig(), externalId = generateDokuExternalId()) {
  if (!config) throw Object.assign(new Error('Pembayaran DOKU belum dikonfigurasi pada server.'), { status: 503 });
  const accessToken = await dokuAccessTokenFor(config);
  const timestamp = dokuTimestamp();
  const requestBody = JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(requestBody).digest('hex').toLowerCase();
  const stringToSign = `POST:${pathname}:${accessToken}:${bodyHash}:${timestamp}`;
  const signature = crypto.createHmac('sha512', config.clientSecret).update(stringToSign).digest('base64');
  let response;
  try {
    response = await fetch(`${config.baseUrl}${pathname}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-PARTNER-ID': config.clientId,
        'X-TIMESTAMP': timestamp,
        'X-EXTERNAL-ID': externalId,
        'X-SIGNATURE': signature,
        'CHANNEL-ID': 'H2H',
      },
      body: requestBody,
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw Object.assign(new Error(error?.name === 'TimeoutError' ? 'Koneksi QRIS DOKU melewati batas waktu. Coba periksa status pesanan sebelum mencoba lagi.' : 'Server tidak dapat terhubung ke DOKU.'), { status: 502, transportFailure: true });
  }
  let result;
  try { result = await response.json(); } catch { throw Object.assign(new Error('Respons QRIS DOKU tidak dapat dibaca.'), { status: 502 }); }
  if (!response.ok || !String(result.responseCode || '').startsWith('200')) {
    console.error('DOKU SNAP request rejected:', JSON.stringify({ httpStatus: response.status, code: String(result.responseCode || 'unknown'), path: pathname }));
    const status = 502;
    throw Object.assign(new Error(response.status === 401
      ? 'DOKU menolak autentikasi permintaan. Periksa pasangan credential dan environment akun.'
      : 'DOKU belum dapat memproses QRIS. Periksa aktivasi layanan merchant lalu coba lagi.'), { status, providerRejected: true, providerHttpStatus: response.status, providerCode: String(result.responseCode || '') });
  }
  return { result, externalId };
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
      headers: {
        Accept: 'application/json',
        Authorization: midtransAuthorization(config),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(NODE_ENV === 'production' && method === 'POST' && pathname === '/v2/charge'
          ? { 'X-Override-Notification': `${PUBLIC_ORIGIN}/api/payments/notify` }
          : {}),
      },
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
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request terlalu besar.'), { status: 413 });
    chunks.push(Buffer.from(chunk));
  }
  const rawBuffer = Buffer.concat(chunks);
  const raw = rawBuffer.toString('utf8');
  try { return { raw, rawBuffer, body: JSON.parse(raw || '{}') }; } catch { throw Object.assign(new Error('Isi permintaan tidak valid.'), { status: 400 }); }
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

function verifyDokuNotificationSignature(req, rawBody, config) {
  const clientId = req.headers['client-id'];
  const requestId = req.headers['request-id'];
  const timestamp = req.headers['request-timestamp'];
  const signature = req.headers.signature;
  if (clientId !== config.clientId || typeof requestId !== 'string' || !requestId || requestId.length > 128
    || typeof timestamp !== 'string' || typeof signature !== 'string' || !/^HMACSHA256=[A-Za-z0-9+/]+={0,2}$/.test(signature)) return false;
  const requestTarget = String(req.url || '').split('?')[0];
  if (requestTarget !== DOKU_NOTIFY_PATH) return false;
  const digest = crypto.createHash('sha256').update(rawBody).digest('base64');
  const components = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
  const expected = `HMACSHA256=${crypto.createHmac('sha256', config.clientSecret).update(components).digest('base64')}`;
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

async function handleDokuNotify(req, res) {
  const config = dokuConfig();
  if (!config) return json(res, 503, { error: 'DOKU payment notification is not configured.' });
  const { rawBuffer, body } = await readRawBody(req, 65536);
  if (!verifyDokuNotificationSignature(req, rawBuffer, config)) return json(res, 401, { error: 'Invalid DOKU payment notification signature.' });

  const service = String(body.service?.id || body.additional_info?.origin?.product || body.additionalInfo?.origin?.product || '').toUpperCase();
  const channel = String(body.channel?.id || body.additional_info?.channelId || body.additionalInfo?.channelId || '').toUpperCase();
  if ((!service && !channel) || service && service !== 'QRIS' || channel && !channel.startsWith('QRIS')) return json(res, 404, { error: 'Payment transaction is not a Bacshop QRIS order.' });
  const orderId = String(body.order?.invoice_number || body.originalPartnerReferenceNo || '');
  const amountValue = body.order?.amount ?? body.amount?.value;
  const amount = Number(amountValue);
  const order = readOrders().find((entry) => entry.id === orderId && entry.paymentProvider === 'doku_qris_snap');
  if (!order || !Number.isFinite(amount) || amount !== Number(order.total) || body.amount?.currency && body.amount.currency !== 'IDR') {
    return json(res, 404, { error: 'Payment transaction does not match a DOKU QRIS order.' });
  }
  const callbackReference = String(body.originalReferenceNo || body.referenceNo || '');
  if (callbackReference && order.dokuReferenceNo && callbackReference !== order.dokuReferenceNo) return json(res, 404, { error: 'Payment reference does not match the DOKU QRIS order.' });
  const reference = order.dokuReferenceNo || callbackReference;
  if (!reference) return json(res, 409, { error: 'DOKU payment reference is not available yet.' });
  const callbackStatus = String(body.transaction?.status || body.latestTransactionStatus || '').toUpperCase();
  const queryOrder = { ...order, dokuReferenceNo: reference };
  const payment = await queryDokuQrisPayment(queryOrder, config);
  if (!order.dokuReferenceNo) {
    const orders = readOrders();
    const index = orders.findIndex((entry) => entry.id === order.id && entry.paymentProvider === 'doku_qris_snap');
    if (index >= 0) {
      orders[index] = { ...orders[index], dokuReferenceNo: reference, dokuExternalId: body.originalExternalId || orders[index].dokuExternalId || '', dokuMerchantId: config.merchantId };
      saveOrders(orders);
    }
  }

  if (['SUCCESS', '00'].includes(callbackStatus) && payment.latestTransactionStatus === '00') {
    const result = savePaidOrder(order, 'DOKU QRIS', reference);
    if (result.error) return json(res, 409, { error: 'Order status cannot be updated.' });
  } else if (['REFUNDED', '04'].includes(callbackStatus) && order.paymentStatus === 'paid' && order.refundStatus === 'requested' && payment.latestTransactionStatus === '04') {
    const result = saveDokuConfirmedRefund(queryOrder, payment, 'DOKU');
    if (result.error) return json(res, 409, { error: 'Refund status cannot be updated.' });
  } else if (['05', '06', '07'].includes(payment.latestTransactionStatus) && order.paymentStatus === 'pending') {
    cancelPendingOrder(order.id);
  }
  return json(res, 200, { responseCode: '2005600', responseMessage: 'Successful' });
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
  if (!token) return null;
  const userSessions = readUserSessions();
  const session = userSessions[token];
  if (!session) return null;
  if (session.expires < Date.now()) {
    delete userSessions[token];
    saveUserSessions(userSessions);
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
  const userSessions = readUserSessions();
  const now = Date.now();
  for (const [existingToken, session] of Object.entries(userSessions)) {
    if (!session || session.expires <= now) delete userSessions[existingToken];
  }
  userSessions[token] = { userId, expires: now + SESSION_MS };
  saveUserSessions(userSessions);
  res.setHeader('Set-Cookie', `${USER_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${COOKIE_SECURE ? '; Secure' : ''}`);
}

function clearSession(req, res) {
  const token = cookieValue(req);
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${COOKIE_SECURE ? '; Secure' : ''}`);
}

function clearUserSession(req, res) {
  const token = userCookieValue(req);
  if (token) {
    const userSessions = readUserSessions();
    if (userSessions[token]) {
      delete userSessions[token];
      saveUserSessions(userSessions);
    }
  }
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
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
  };
  if (PUBLIC_ORIGIN.startsWith('https://')) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
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
  if (!record || typeof password !== 'string' || typeof record.salt !== 'string' || !/^[a-f0-9]{128}$/i.test(record.hash || '')) return false;
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
  const {
    paymentQrString, paymentQrActions, refundKey, refundReason, refundProviderReference,
    midtransTransactionId, midtransMerchantId, dokuReferenceNo, dokuExternalId, dokuRequestDate,
    dokuMerchantId, dokuApprovalCode, dokuGenerationUncertain, ...visible
  } = order;
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

function canAccessInternalTestProduct(user, product) {
  return product?.internalTestOnly !== true || Boolean(PAYMENT_TEST_EMAIL && user?.email === PAYMENT_TEST_EMAIL);
}

function publicProduct(product, user) {
  const { resellerPrice, bulkMinimum, rating, sold: seededSales, stockDeductionOrderIds, internalTestOnly, ...retailProduct } = product;
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

function adminProduct(product) {
  const { stockDeductionOrderIds, ...visible } = product;
  return { ...visible, stockAvailable: availableProductStock(product) };
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
  if (input.internalTestOnly !== undefined && typeof input.internalTestOnly !== 'boolean') return 'Status produk uji internal tidak valid.';
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
    internalTestOnly: input.internalTestOnly === true,
    specifications: Array.isArray(input.specifications) ? input.specifications : [],
  };
  delete product.stockDeductionOrderIds;
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
  if (input.authVisual !== undefined) {
    const visual = input.authVisual;
    if (!visual || typeof visual !== 'object' || Array.isArray(visual) || typeof visual.image !== 'string' || (visual.image && !safeAssetPath(visual.image)) || typeof visual.alt !== 'string' || !visual.alt.trim() || visual.alt.length > 160) return 'Pilih gambar auth dari unggahan toko dan isi keterangannya (maks. 160 karakter).';
  }
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
  const verifiedLateSettlement = order.paymentStatus === 'cancelled' && ['QRIS otomatis', 'DOKU QRIS'].includes(provider);
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
  const activePlan = orders
    .filter((entry) => entry.userId === user.id && entry.kind === 'reseller-plan' && entry.paymentStatus === 'paid' && entry.status !== 'refunded')
    .sort((first, second) => Date.parse(second.paidAt || second.createdAt) - Date.parse(first.paidAt || first.createdAt))[0];
  const resellerPlan = activePlan
    ? { active: true, orderId: activePlan.id, purchasedAt: activePlan.paidAt || activePlan.createdAt }
    : { active: false };
  const productEntitlements = resellerEntitlementsFor(user, orders, readProducts());
  const samePlan = Boolean(user.resellerPlan?.active) === resellerPlan.active
    && (user.resellerPlan?.orderId || '') === (resellerPlan.orderId || '')
    && (user.resellerPlan?.purchasedAt || '') === (resellerPlan.purchasedAt || '');
  if (samePlan && JSON.stringify(user.productEntitlements || []) === JSON.stringify(productEntitlements)) return;
  users[userIndex] = { ...user, resellerPlan, productEntitlements };
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

async function createMidtransOrderQris(order) {
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

function matchingDokuQrisPayment(order, payment) {
  const amount = Number(payment?.amount?.value);
  return String(payment?.responseCode || '').startsWith('200')
    && String(payment?.serviceCode) === '47'
    && payment?.originalReferenceNo === order.dokuReferenceNo
    && payment?.originalPartnerReferenceNo === order.id
    && payment?.amount?.currency === 'IDR'
    && Number.isFinite(amount) && amount === Number(order.total);
}

async function queryDokuQrisPayment(order, config = dokuConfig()) {
  if (!config || !order.dokuReferenceNo) throw Object.assign(new Error('Referensi pembayaran DOKU belum tersedia.'), { status: 503 });
  const { result } = await dokuSnapRequest('/snap-adapter/b2b/v1.0/qr/qr-mpm-query', {
    originalReferenceNo: order.dokuReferenceNo,
    originalPartnerReferenceNo: order.id,
    serviceCode: '47',
    merchantId: order.dokuMerchantId || config.merchantId,
  }, config);
  if (!matchingDokuQrisPayment(order, result)) throw Object.assign(new Error('Status pembayaran DOKU tidak cocok dengan referensi, nominal, atau merchant pesanan.'), { status: 502 });
  return result;
}

function saveDokuConfirmedRefund(order, payment, actor = 'DOKU') {
  if (payment?.latestTransactionStatus !== '04' || !matchingDokuQrisPayment(order, payment)) return { error: 'DOKU belum mengonfirmasi refund penuh.' };
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id);
  if (index < 0) return { error: 'Pesanan tidak ditemukan.' };
  if (orders[index].paymentStatus === 'refunded') {
    syncResellerAccess(orders[index], orders);
    return { order: orders[index], changed: false };
  }
  if (orders[index].paymentStatus !== 'paid') return { error: 'Hanya pesanan lunas yang dapat dikembalikan.' };
  const updated = {
    ...orders[index],
    paymentStatus: 'refunded',
    status: 'refunded',
    refundStatus: 'confirmed',
    refundedAt: new Date().toISOString(),
    refundProviderReference: payment.refundNo || order.dokuReferenceNo,
  };
  orders[index] = updated;
  saveOrders(orders);
  syncResellerAccess(updated, orders);
  saveAudit({ actor, action: 'payment_refunded', orderId: updated.id, amount: updated.total });
  return { order: updated, changed: true };
}

async function createDokuOrderQris(order) {
  const config = dokuConfig();
  if (!config) throw Object.assign(new Error('Pembayaran DOKU belum disiapkan pada server. QRIS belum dapat dibuat.'), { status: 503 });
  let qrisContent = order.paymentQrString || '';
  let dokuReferenceNo = order.dokuReferenceNo || '';
  let dokuExternalId = order.dokuExternalId || '';
  let payment = null;

  if (dokuReferenceNo && qrisContent) {
    payment = await queryDokuQrisPayment({ ...order, dokuReferenceNo }, config);
    if (payment.latestTransactionStatus === '00') {
      const result = savePaidOrder(order, 'DOKU QRIS', dokuReferenceNo);
      if (result.error) throw Object.assign(new Error(result.error), { status: 409 });
      return result.order;
    }
    if (['04', '05', '06', '07'].includes(payment.latestTransactionStatus)) {
      cancelPendingOrder(order.id);
      throw Object.assign(new Error('QRIS untuk pesanan ini sudah tidak aktif. Buat pesanan baru untuk membayar.'), { status: 409 });
    }
  } else {
    await dokuAccessTokenFor(config);
    const orders = readOrders();
    const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
    if (index < 0 || orders[index].paymentStatus !== 'pending') throw Object.assign(new Error('Status pesanan sudah berubah. Muat ulang halaman pesanan.'), { status: 409 });
    if (orders[index].dokuGenerationUncertain) throw Object.assign(new Error('Hasil pembuatan QRIS belum dapat dipastikan. Hubungi admin untuk memeriksa transaksi; QR baru belum dibuat agar pembayaran tidak ganda.'), { status: 409 });
    const today = new Date().toISOString().slice(0, 10);
    if (!dokuExternalId || orders[index].dokuRequestDate !== today) {
      dokuExternalId = generateDokuExternalId();
    }
    // Persist before sending: after a timeout or process restart we must not create another charge blindly.
    orders[index] = { ...orders[index], paymentProvider: 'doku_qris_snap', dokuExternalId, dokuRequestDate: today, dokuGenerationUncertain: true };
    saveOrders(orders);

    const validityPeriod = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const request = {
      partnerReferenceNo: order.id,
      amount: { value: dokuAmount(order.total), currency: 'IDR' },
      merchantId: config.merchantId,
      terminalId: config.terminalId,
      validityPeriod,
      additionalInfo: { postalCode: config.postalCode, feeType: '1' },
    };
    let result;
    try {
      ({ result } = await dokuSnapRequest('/snap-adapter/b2b/v1.0/qr/qr-mpm-generate', request, config, dokuExternalId));
    } catch (error) {
      // Only an explicit rejection guarantees there is no new QR to reconcile.
      if (error.providerRejected && error.providerHttpStatus < 500 && ![406, 409].includes(error.providerHttpStatus)) {
        const current = readOrders();
        const currentIndex = current.findIndex((entry) => entry.id === order.id);
        if (currentIndex >= 0) {
          current[currentIndex] = { ...current[currentIndex], dokuGenerationUncertain: false };
          saveOrders(current);
        }
      }
      throw error;
    }
    if (String(result.responseCode || '').slice(0, 3) !== '200'
      || result.partnerReferenceNo !== order.id
      || typeof result.referenceNo !== 'string' || !result.referenceNo
      || typeof result.qrContent !== 'string' || result.qrContent.length < 20 || result.qrContent.length > 512) {
      throw Object.assign(new Error('Respons pembuatan QRIS DOKU tidak cocok dengan pesanan.'), { status: 502 });
    }
    dokuReferenceNo = result.referenceNo;
    qrisContent = result.qrContent;
    const responseExpiry = Date.parse(result.additionalInfo?.validityPeriod || '');
    const expiresAt = Number.isFinite(responseExpiry) ? new Date(responseExpiry).toISOString() : validityPeriod;

    const latestOrders = readOrders();
    const latestIndex = latestOrders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
    if (latestIndex < 0) throw Object.assign(new Error('Pesanan tidak ditemukan.'), { status: 409 });
    latestOrders[latestIndex] = {
      ...latestOrders[latestIndex],
      paymentProvider: 'doku_qris_snap',
      dokuReferenceNo,
      dokuExternalId,
      dokuRequestDate: today,
      dokuMerchantId: config.merchantId,
      dokuGenerationUncertain: false,
      paymentInitialized: true,
      paymentExpiresAt: expiresAt,
      paymentQrString: qrisContent,
    };
    saveOrders(latestOrders);
  }

  const qrisImage = await QRCode.toDataURL(qrisContent, { errorCorrectionLevel: 'M', margin: 2, width: 440 });
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
  if (index < 0 || orders[index].paymentStatus !== 'pending') throw Object.assign(new Error('Status pesanan sudah berubah. Muat ulang halaman pesanan.'), { status: 409 });
  const updated = {
    ...orders[index],
    paymentProvider: 'doku_qris_snap',
    qrisImage,
    status: 'awaiting_payment',
    paymentInstructions: 'Pindai QRIS ini menggunakan aplikasi pembayaran yang mendukung QRIS. Pastikan nominal sesuai sebelum membayar.',
  };
  orders[index] = updated;
  saveOrders(orders);
  saveAudit({ actor: 'DOKU', action: 'qris_created', orderId: order.id, amount: order.total });
  return updated;
}

async function createOrderQris(order) {
  if (order.paymentProvider === 'doku_qris_snap') return createDokuOrderQris(order);
  if (order.paymentProvider === 'qris_dynamic' && order.midtransTransactionId) return createMidtransOrderQris(order);
  if (!dokuConfig()) throw Object.assign(new Error('Pembayaran DOKU belum disiapkan pada server. QRIS belum dapat dibuat.'), { status: 503 });
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === order.userId);
  if (index >= 0 && orders[index].paymentStatus === 'pending') {
    orders[index] = { ...orders[index], paymentProvider: 'doku_qris_snap' };
    saveOrders(orders);
  }
  return createDokuOrderQris({ ...order, paymentProvider: 'doku_qris_snap' });
}

function savePaidOrder(order, provider, reference) {
  const orders = readOrders();
  const index = orders.findIndex((entry) => entry.id === order.id);
  if (index < 0) return { error: 'Pesanan tidak ditemukan.' };
  const result = markOrderPaid(orders[index], provider, reference);
  if (result.error) return result;
  if (result.changed) {
    orders[index] = result.order;
    saveOrders(orders);
    saveAudit({ actor: provider, action: 'payment_verified', orderId: result.order.id, amount: result.order.total, transactionReference: reference });
  }
  if (orders[index].kind === 'products' && orders[index].stockDeducted !== true) {
    const quantities = new Map();
    for (const item of orders[index].items || []) quantities.set(item.productId, (quantities.get(item.productId) || 0) + Number(item.quantity || 0));
    const products = readProducts();
    let productsChanged = false;
    for (const [productId, quantity] of quantities) {
      const product = products.find((entry) => entry.id === productId);
      if (!product || product.stock === null || product.stock === undefined || product.stock === '') continue;
      const appliedOrders = Array.isArray(product.stockDeductionOrderIds) ? product.stockDeductionOrderIds : [];
      if (appliedOrders.includes(orders[index].id)) continue;
      product.stock = Math.max(0, Number(product.stock) - quantity);
      product.stockDeductionOrderIds = [...appliedOrders, orders[index].id];
      productsChanged = true;
    }
    if (productsChanged) saveProducts(products);
    orders[index] = { ...orders[index], stockDeducted: true };
    saveOrders(orders);
    result.order = orders[index];
  }
  syncResellerAccess(result.order, orders);
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
  if (orders[index].paymentStatus === 'refunded') {
    syncResellerAccess(orders[index], orders);
    return { order: orders[index], changed: false };
  }
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

function googleAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  if (!clientId.endsWith('.apps.googleusercontent.com') || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri: `${PUBLIC_ORIGIN}${GOOGLE_CALLBACK}` };
}

function safeAuthNext(value) {
  return typeof value === 'string' && value.length <= 1000 && /^\/(?!\/|admin(?:\/|$))[a-z0-9/?=&%._+-]*$/i.test(value) ? value : '/akun';
}

function googleCookie(req) {
  return (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${GOOGLE_COOKIE}=`))?.slice(GOOGLE_COOKIE.length + 1) || '';
}

function appendGoogleCookie(res, value, maxAge) {
  const current = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(current) ? current : current ? [current] : []), `${GOOGLE_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`]);
}

function authRedirect(res, location) {
  res.writeHead(303, { ...standardSecurityHeaders(), 'Cache-Control': 'no-store', Location: location });
  res.end();
}

function startGoogleSignIn(req, res, url) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: 'Mulai login Google dari halaman masuk Bacshop.' });
  const config = googleAuthConfig();
  if (!config) return authRedirect(res, `${PUBLIC_ORIGIN}/#/masuk?google_error=unavailable`);
  if (limitedLogin(req, googleLoginAttempts)) return authRedirect(res, `${PUBLIC_ORIGIN}/#/masuk?google_error=limited`);
  failedLogin(req, googleLoginAttempts);
  for (const [key, value] of googleSignIns) if (value.expires < Date.now()) googleSignIns.delete(key);
  if (googleSignIns.size >= 1000) return authRedirect(res, `${PUBLIC_ORIGIN}/#/masuk?google_error=busy`);
  const state = crypto.randomBytes(32).toString('base64url');
  const cookie = crypto.randomBytes(32).toString('base64url');
  const nonce = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(32).toString('base64url');
  googleSignIns.set(state, { cookie, nonce, verifier, next: safeAuthNext(url.searchParams.get('next')), expires: Date.now() + GOOGLE_SIGN_IN_MS });
  appendGoogleCookie(res, cookie, GOOGLE_SIGN_IN_MS / 1000);
  const destination = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  destination.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'code', scope: 'openid email profile', state, nonce, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', prompt: 'select_account' }).toString();
  return authRedirect(res, destination.href);
}

async function googleAvatar(picture) {
  try {
    const url = new URL(picture);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^lh[0-9]+\.googleusercontent\.com$/.test(url.hostname)) return '';
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000) });
    const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    if (!response.ok || !['image/png', 'image/jpeg', 'image/webp'].includes(mime) || Number(response.headers.get('content-length')) > 5 * 1024 * 1024) return '';
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 5 * 1024 * 1024) return '';
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    if (!uploadedImage(bytes, mime)) return '';
    const filename = `google-${crypto.randomUUID()}.${mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), bytes, { mode: 0o600 });
    return `/assets/uploads/${filename}`;
  } catch { return ''; }
}

async function finishGoogleSignIn(req, res, url) {
  const state = url.searchParams.get('state') || '';
  const pending = googleSignIns.get(state);
  const cookie = googleCookie(req);
  if (!pending || pending.expires < Date.now() || !/^[A-Za-z0-9_-]{43}$/.test(cookie) || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(pending.cookie))) {
    appendGoogleCookie(res, '', 0);
    return authRedirect(res, `${PUBLIC_ORIGIN}/#/masuk?google_error=expired`);
  }
  googleSignIns.delete(state);
  const fail = code => { appendGoogleCookie(res, '', 0); return authRedirect(res, `${PUBLIC_ORIGIN}/#/masuk?google_error=${code}&next=${encodeURIComponent(pending.next)}`); };
  if (url.searchParams.has('error')) return fail('cancelled');
  const code = url.searchParams.get('code');
  const config = googleAuthConfig();
  if (!config || !code || code.length > 4096) return fail('failed');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: 'authorization_code', code_verifier: pending.verifier }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fail('failed');
    const tokens = await response.json();
    if (typeof tokens.id_token !== 'string') return fail('failed');
    const client = new OAuth2Client(config.clientId);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId });
    const profile = ticket.getPayload();
    if (!profile || profile.nonce !== pending.nonce || !profile.sub || profile.email_verified !== true || !validEmail(profile.email)) return fail('failed');
    const email = profile.email.toLowerCase();
    let users = readUsers();
    let user = users.find(entry => entry.googleSub === profile.sub);
    if (!user) {
      user = users.find(entry => entry.email === email);
      if (user && (user.googleSub || (!email.endsWith('@gmail.com') && !profile.hd))) return fail('link_required');
    }
    const avatarUrl = user?.avatarUrl || await googleAvatar(profile.picture);
    // Re-read after the avatar fetch to preserve concurrent profile and reseller updates.
    users = readUsers();
    const existing = users.find(entry => entry.googleSub === profile.sub) || users.find(entry => entry.email === email);
    if (existing && existing.googleSub && existing.googleSub !== profile.sub) return fail('link_required');
    if (existing && !existing.googleSub && !email.endsWith('@gmail.com') && !profile.hd) return fail('link_required');
    user = existing ? { ...existing, googleSub: profile.sub, avatarUrl: existing.avatarUrl || avatarUrl } : {
      id: crypto.randomUUID(), name: String(profile.name || email.split('@')[0]).trim().slice(0, 80) || 'Pengguna Google', email,
      googleSub: profile.sub, avatarUrl, productEntitlements: [], resellerPlan: { active: false }, createdAt: new Date().toISOString(),
    };
    if (existing) users[users.findIndex(entry => entry.id === existing.id)] = user;
    else users.push(user);
    saveUsers(users);
    setUserSession(res, user.id);
    appendGoogleCookie(res, '', 0);
    googleLoginAttempts.delete(clientAddress(req));
    return authRedirect(res, `${PUBLIC_ORIGIN}/#${pending.next}`);
  } catch { return fail('failed'); }
}

function chatFile(userId) {
  return path.join(CHAT_DIR, `${crypto.createHash('sha256').update(userId).digest('hex')}.json`);
}

function readChat(userId) {
  return readJson(chatFile(userId), { userId, messages: [], customerRead: 0, adminRead: 0 });
}

function chatUnread(thread, side) {
  return thread.messages.filter(message => message.sender !== side && message.sequence > (thread[`${side}Read`] || 0)).length;
}

function publishChatEvent(thread, type, details = {}) {
  for (const client of chatEventClients) {
    if (client.res.destroyed || client.res.writableEnded) continue;
    if (client.side === 'customer' && client.userId !== thread.userId) continue;
    const unread = chatUnread(thread, client.side);
    const event = { userId: thread.userId, unread, ...details };
    try {
      client.res.write(`id: ${thread.userId}-${thread.messages.length}-${crypto.randomUUID()}\nevent: ${type}\ndata: ${JSON.stringify(event)}\n\n`);
    } catch { /* Connection close triggers the response close listener below. */ }
  }
}

function chatPage(thread, side, before) {
  const cursor = before === null ? Infinity : Number(before);
  if (before !== null && (!Number.isSafeInteger(cursor) || cursor < 1)) throw Object.assign(new Error('Posisi pesan tidak valid.'), { status: 400 });
  const eligible = thread.messages.filter(message => message.sequence < cursor);
  const messages = eligible.slice(-50);
  return { userId: thread.userId, messages, hasMore: eligible.length > messages.length,
    oldestSequence: messages[0]?.sequence || null, unread: chatUnread(thread, side),
    otherRead: thread[`${side === 'customer' ? 'admin' : 'customer'}Read`] || 0 };
}

function chatContext(input, userId) {
  if (input === undefined || input === null) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error('Lampiran produk tidak valid.'), { status: 400 });
  const user = readUsers().find(entry => entry.id === userId);
  if (input.orderId) {
    const order = readOrders().find(entry => entry.id === input.orderId && entry.userId === userId);
    if (!order) throw Object.assign(new Error('Pesanan tidak ditemukan.'), { status: 404 });
    if (input.itemIndex !== undefined && (!Number.isInteger(input.itemIndex) || input.itemIndex < 0 || !order.items?.[input.itemIndex])) throw Object.assign(new Error('Produk tidak ada di pesanan ini.'), { status: 400 });
    const item = input.itemIndex !== undefined ? order.items[input.itemIndex] : order.items?.find(entry => entry.productId === input.productId);
    if (input.productId && !item) throw Object.assign(new Error('Produk tidak ada di pesanan ini.'), { status: 400 });
    if (input.productId && item.productId !== input.productId) throw Object.assign(new Error('Produk tidak ada di pesanan ini.'), { status: 400 });
    const product = item && readProducts().find(entry => entry.id === item.productId);
    return { orderId: order.id, productId: item?.productId || null,
      name: item?.name || (order.kind === 'reseller-plan' ? 'Paket reseller' : 'Pesanan'),
      image: item?.image || product?.image || '', slug: item?.slug || product?.slug || '', quantity: item?.quantity || null,
      price: item?.unitPrice ?? order.total,
      specifications: (item?.specifications || []).map(entry => `${entry.name}: ${entry.label}`).join(' · ') };
  }
  const product = readProducts().find(entry => entry.id === input.productId && !entry.archived && canAccessInternalTestProduct(user, entry));
  if (!product) throw Object.assign(new Error('Produk tidak ditemukan.'), { status: 404 });
  const visible = publicProduct(product, user);
  return { productId: visible.id, name: visible.name, image: visible.image || '', slug: visible.slug, price: visible.price };
}

async function sendChat(req, res, userId, side) {
  const body = await readBody(req, 15 * 1024 * 1024);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Data pesan tidak valid.' });
  if (typeof body.clientMessageId !== 'string' || !/^[A-Za-z0-9-]{16,80}$/.test(body.clientMessageId)) return json(res, 400, { error: 'Identitas pesan tidak valid.' });
  const thread = readChat(userId);
  const previous = thread.messages.find(message => message.sender === side && message.clientMessageId === body.clientMessageId);
  if (previous) return json(res, 200, { message: previous });
  if (body.text !== undefined && typeof body.text !== 'string') return json(res, 400, { error: 'Pesan harus berupa teks.' });
  const text = (body.text || '').trim();
  if (text.length > 4000) return json(res, 400, { error: 'Pesan maksimal 4.000 karakter.' });
  if (body.images !== undefined && !Array.isArray(body.images) || (body.images || []).length > 3) return json(res, 400, { error: 'Maksimal 3 gambar per pesan.' });
  const context = chatContext(body.context, userId);
  let totalBytes = 0;
  const images = (body.images || []).map(image => {
    if (!image || typeof image.data !== 'string' || image.data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) throw Object.assign(new Error('Data gambar tidak valid.'), { status: 400 });
    const buffer = Buffer.from(image.data, 'base64');
    totalBytes += buffer.length;
    const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[image.mimeType];
    if (!extension || !uploadedImage(buffer, image.mimeType) || !buffer.length) throw Object.assign(new Error('Gunakan gambar PNG, JPG, atau WebP yang valid.'), { status: 400 });
    if (buffer.length > 5 * 1024 * 1024 || totalBytes > 10 * 1024 * 1024) throw Object.assign(new Error('Maksimal 5 MB per gambar dan 10 MB per pesan.'), { status: 413 });
    const id = crypto.randomUUID();
    // The owner hash is part of the authenticated URL, never a public uploads path.
    const owner = path.basename(chatFile(userId), '.json');
    return { buffer, file: `${id}.${extension}`, metadata: { id, mimeType: image.mimeType, url: `/api/chat/images/${owner}/${id}`, file: `${id}.${extension}` } };
  });
  if (!text && !context && !images.length) return json(res, 400, { error: 'Tulis pesan atau tambahkan lampiran.' });
  const now = Date.now();
  for (const [key, entry] of chatSendLimits) if (entry.until <= now) chatSendLimits.delete(key);
  const key = `${side}:${userId}`;
  const limit = chatSendLimits.get(key) || { count: 0, until: now + 60000 };
  if (limit.count >= 30) return json(res, 429, { error: 'Terlalu banyak pesan. Tunggu sebentar sebelum mengirim lagi.' });
  limit.count += 1;
  chatSendLimits.set(key, limit);
  fs.mkdirSync(CHAT_IMAGE_DIR, { recursive: true, mode: 0o700 });
  const message = { id: crypto.randomUUID(), clientMessageId: body.clientMessageId,
    sequence: (thread.messages.at(-1)?.sequence || 0) + 1, sender: side, text, context,
    images: images.map(image => image.metadata), createdAt: new Date(now).toISOString() };
  const written = [];
  try {
    for (const image of images) {
      const file = path.join(CHAT_IMAGE_DIR, image.file);
      fs.writeFileSync(file, image.buffer, { mode: 0o600, flag: 'wx' });
      written.push(file);
    }
    thread.messages.push(message);
    // Sending is not a read receipt: the other conversation may not be visible yet.
    writeJsonAtomic(chatFile(userId), thread);
  } catch (error) {
    for (const file of written) try { fs.unlinkSync(file); } catch { /* Preserve original error. */ }
    throw error;
  }
  publishChatEvent(thread, 'chat-message', { message });
  return json(res, 201, { message });
}

async function handleChatApi(req, res, url) {
  const isAdmin = url.pathname.startsWith('/api/admin/chat');
  const admin = requireAdmin(req);
  const user = activeUser(req);
  if (isAdmin && !admin || !isAdmin && !user && !admin) return json(res, 401, { error: 'Masuk untuk membuka chat.' });
  if (req.method === 'GET' && url.pathname === '/api/chat/events') {
    const client = { res, side: admin ? 'admin' : 'customer', userId: user?.id || '' };
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive', 'X-Accel-Buffering': 'no', ...standardSecurityHeaders() });
    res.write('retry: 2000\n: terhubung\n\n');
    chatEventClients.add(client);
    const heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write(': aktif\n\n'); }, 20000);
    heartbeat.unref();
    res.on('close', () => { clearInterval(heartbeat); chatEventClients.delete(client); });
    return;
  }
  const imageMatch = url.pathname.match(/^\/api\/chat\/images\/([a-f0-9]{64})\/([a-f0-9-]{36})$/);
  if (imageMatch && ['GET', 'HEAD'].includes(req.method)) {
    const thread = readJson(path.join(CHAT_DIR, `${imageMatch[1]}.json`), null);
    if (!thread || !admin && thread.userId !== user?.id) return json(res, 404, { error: 'Gambar tidak ditemukan.' });
    const image = thread.messages.flatMap(message => message.images).find(entry => entry.id === imageMatch[2]);
    if (!image || !/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(image.file)) return json(res, 404, { error: 'Gambar tidak ditemukan.' });
    let buffer;
    try { buffer = fs.readFileSync(path.join(CHAT_IMAGE_DIR, image.file)); } catch { return json(res, 404, { error: 'Gambar tidak ditemukan.' }); }
    res.writeHead(200, { 'Content-Type': image.mimeType, 'Content-Length': buffer.length,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Disposition': 'inline' });
    return res.end(req.method === 'HEAD' ? undefined : buffer);
  }
  if (isAdmin && req.method === 'GET' && url.pathname === '/api/admin/chat') {
    const users = readUsers();
    const files = fs.existsSync(CHAT_DIR) ? fs.readdirSync(CHAT_DIR).filter(file => /^[a-f0-9]{64}\.json$/.test(file)) : [];
    const conversations = files.map(file => readJson(path.join(CHAT_DIR, file), null)).filter(thread => thread?.messages.length).map(thread => {
      const customer = users.find(entry => entry.id === thread.userId);
      const last = thread.messages.at(-1);
      return { userId: thread.userId, customer: { name: customer?.name || 'Pelanggan', avatarUrl: customer?.avatarUrl || '' },
        lastMessage: { text: last.text || last.context?.name || 'Gambar', createdAt: last.createdAt }, unread: chatUnread(thread, 'admin') };
    }).sort((first, second) => second.lastMessage.createdAt.localeCompare(first.lastMessage.createdAt));
    return json(res, 200, { conversations, unread: conversations.reduce((sum, thread) => sum + thread.unread, 0) });
  }
  const match = isAdmin ? url.pathname.match(/^\/api\/admin\/chat\/([a-f0-9-]{36})(?:\/(messages|read))?$/) : url.pathname.match(/^\/api\/chat(?:\/(messages|read|unread))?$/);
  if (!match) return json(res, 404, { error: 'Chat tidak ditemukan.' });
  const userId = isAdmin ? match[1] : user?.id;
  if (!userId || isAdmin && !readUsers().some(entry => entry.id === userId)) return json(res, 404, { error: 'Pelanggan tidak ditemukan.' });
  const action = isAdmin ? match[2] : match[1];
  const side = isAdmin ? 'admin' : 'customer';
  if (req.method === 'GET' && action === 'unread') return json(res, 200, { unread: chatUnread(readChat(userId), side) });
  if (req.method === 'GET' && !action) return json(res, 200, chatPage(readChat(userId), side, url.searchParams.get('before')));
  if (req.method === 'POST' && action === 'messages') return sendChat(req, res, userId, side);
  if (req.method === 'POST' && action === 'read') {
    const body = await readBody(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Data pesan tidak valid.' });
    const thread = readChat(userId);
    const sequence = Number(body.sequence);
    if (!Number.isInteger(sequence) || sequence < 1 || !thread.messages.some(message => message.sequence === sequence)) return json(res, 400, { error: 'Pesan tidak ditemukan.' });
    thread[`${side}Read`] = Math.max(thread[`${side}Read`] || 0, sequence);
    fs.mkdirSync(CHAT_DIR, { recursive: true, mode: 0o700 });
    writeJsonAtomic(chatFile(userId), thread);
    publishChatEvent(thread, 'chat-read', { sequence, reader: side });
    return json(res, 200, { unread: chatUnread(thread, side) });
  }
  return json(res, 405, { error: 'Permintaan chat tidak didukung.' });
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/auth/google/start') return startGoogleSignIn(req, res, url);
  if (req.method === 'GET' && url.pathname === GOOGLE_CALLBACK) return finishGoogleSignIn(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/auth/options') return json(res, 200, { googleAvailable: Boolean(googleAuthConfig()) });
  if (req.method === 'POST' && url.pathname === MIDTRANS_NOTIFY_PATH) return handleMidtransNotify(req, res);
  if (req.method === 'POST' && url.pathname === DOKU_NOTIFY_PATH) return handleDokuNotify(req, res);
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && !sameOrigin(req)) return json(res, 403, { error: 'Permintaan hanya dapat dimulai dari situs Bacshop.' });
  if (url.pathname === '/api/chat' || url.pathname.startsWith('/api/chat/') || url.pathname === '/api/admin/chat' || url.pathname.startsWith('/api/admin/chat/')) return handleChatApi(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { status: 'ok', paymentProvider: 'DOKU', paymentConfigured: Boolean(dokuConfig()) });
  if (req.method === 'GET' && url.pathname === '/api/auth/session') {
    const user = activeUser(req);
    return json(res, 200, { user: user ? publicUser(user) : null });
  }
  if (req.method === 'GET' && url.pathname === '/api/storefront') return json(res, 200, readStorefront());
  if (req.method === 'GET' && url.pathname === '/api/products') {
    const user = activeUser(req);
    return json(res, 200, { products: readProducts().filter((product) => !product.archived && canAccessInternalTestProduct(user, product)).map((product) => publicProduct(product, user)) });
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
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return json(res, 200, { order: publicOrder(order) });
    if (order.paymentStatus !== 'pending') return json(res, 409, { error: 'Pesanan ini sudah tidak dapat dibayar.' });
    const reservationExpiry = Date.parse(order.paymentInitialized ? order.paymentExpiresAt || '' : order.reservationExpiresAt || '');
    if (Number.isFinite(reservationExpiry) && reservationExpiry <= Date.now()) {
      const orders = readOrders();
      const index = orders.findIndex((entry) => entry.id === order.id && entry.userId === user.id);
      if (index >= 0 && orders[index].paymentStatus === 'pending') {
        orders[index] = { ...orders[index], paymentStatus: 'cancelled', status: 'cancelled', cancelledAt: new Date().toISOString() };
        saveOrders(orders);
      }
      return json(res, 409, { error: 'Waktu konfirmasi pesanan habis. Silakan buat pesanan baru.' });
    }
    if (order.qrisImage) return json(res, 200, { order: publicOrder(order) });
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
    if (order.paymentProvider === 'doku_qris_snap') {
      if (!order.dokuReferenceNo) return json(res, 200, { order: publicOrder(order), providerStatus: 'pending' });
      const payment = await queryDokuQrisPayment(order);
      if (payment.latestTransactionStatus === '00') {
        const result = savePaidOrder(order, 'DOKU QRIS', payment.originalReferenceNo);
        const updated = result.order || readOrders().find((entry) => entry.id === order.id);
        return json(res, 200, { order: publicOrder(updated) });
      }
      if (payment.latestTransactionStatus === '04' && order.paymentStatus === 'paid' && order.refundStatus === 'requested') {
        const result = saveDokuConfirmedRefund(order, payment);
        if (result.error) return json(res, 409, { error: result.error });
        return json(res, 200, { order: publicOrder(result.order) });
      }
      if (['05', '06', '07'].includes(payment.latestTransactionStatus) && order.paymentStatus === 'pending') {
        const cancelled = cancelPendingOrder(order.id);
        return json(res, 200, { order: publicOrder(cancelled || order) });
      }
      return json(res, 200, { order: publicOrder(order), providerStatus: payment.latestTransactionStatus || 'pending' });
    }
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
    return json(res, 200, { products: readProducts().map(adminProduct) });
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
    if (!dokuConfig()) return json(res, 503, { error: 'Pembayaran DOKU belum siap. Pesanan belum dibuat; silakan coba lagi nanti.' });
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
        if (!product || product.archived || !canAccessInternalTestProduct(user, product) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || product.orderMode === 'preorder' && !product.preOrderConfirmed) return json(res, 400, { error: 'Periksa produk, jumlah, atau ketersediaan stok di keranjang.' });
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
          image: product.image || '',
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
      paymentProvider: 'doku_qris_snap',
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
    if (order.paymentProvider === 'doku_qris_snap') {
      if (!order.dokuReferenceNo) return json(res, 409, { error: 'Referensi transaksi DOKU belum tersedia untuk refund.' });
      if (order.refundStatus === 'requested' && order.refundReason !== reason) return json(res, 409, { error: 'Ulangi permintaan refund dengan alasan yang sama agar DOKU tidak menerima nomor refund baru.' });
      if (paymentRefundLocks.has(order.id)) return json(res, 409, { error: 'Refund sedang diproses. Tunggu sebentar lalu periksa kembali.' });
      const refundKey = order.refundKey || `BCREFUND-${order.id}`;
      const prepared = saveRefundRequest(order, refundKey, reason, 'requested', admin.email);
      if (prepared.error) return json(res, 409, { error: prepared.error });
      paymentRefundLocks.add(order.id);
      try {
        const config = dokuConfig();
        const currentPayment = await queryDokuQrisPayment(order, config);
        if (currentPayment.latestTransactionStatus === '04') {
          const confirmed = saveDokuConfirmedRefund(order, currentPayment, admin.email);
          if (confirmed.error) return json(res, 409, { error: confirmed.error });
          return json(res, 200, { order: publicOrder(confirmed.order), refundConfirmed: true });
        }
        const approvalCode = currentPayment.additionalInfo?.approvalCode;
        if (currentPayment.latestTransactionStatus !== '00' || typeof approvalCode !== 'string' || !approvalCode) {
          return json(res, 409, { error: 'DOKU belum mengonfirmasi pembayaran yang diperlukan untuk refund.' });
        }
        const { result } = await dokuSnapRequest('/snap-adapter/b2b/v1.0/qr/qr-mpm-refund', {
          originalPartnerReferenceNo: order.id,
          originalReferenceNo: order.dokuReferenceNo,
          partnerRefundNo: refundKey,
          merchantId: order.dokuMerchantId || config.merchantId,
          refundAmount: { value: dokuAmount(order.total), currency: 'IDR' },
          reason,
          additionalInfo: { approvalCode },
        }, config);
        const responseAmount = Number(result.refundAmount?.value);
        if (!String(result.responseCode || '').startsWith('200')
          || result.originalReferenceNo !== order.dokuReferenceNo
          || result.originalPartnerReferenceNo !== order.id
          || result.partnerRefundNo !== refundKey
          || !Number.isFinite(responseAmount) || responseAmount !== Number(order.total)
          || result.refundAmount?.currency !== 'IDR') {
          return json(res, 502, { error: 'DOKU belum mengonfirmasi permintaan refund penuh. Pesanan tetap lunas sampai status refund terverifikasi.' });
        }
        const updated = saveRefundRequest(prepared.order, refundKey, reason, String(result.responseCode), admin.email);
        if (updated.error) return json(res, 409, { error: updated.error });
        return json(res, 202, { order: publicOrder(updated.order), refundConfirmed: false });
      } catch (error) {
        return json(res, error.status || 502, { error: 'DOKU belum dapat memproses refund. Pesanan tetap lunas; periksa status transaksi sebelum mencoba lagi.' });
      } finally {
        paymentRefundLocks.delete(order.id);
      }
    }
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
    return json(res, 200, { changedIds, blocked, products: readProducts().map(adminProduct) });
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
    const updated = { ...normalized.product, stockDeductionOrderIds: products[index].stockDeductionOrderIds || [] };
    products[index] = updated;
    saveProducts(products);
    saveAudit({ actor: admin.email, action: 'product_updated', productId: updateMatch[1] });
    return json(res, 200, { product: adminProduct(updated) });
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
      'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'${PUBLIC_ORIGIN.startsWith('https://') ? '; upgrade-insecure-requests; block-all-mixed-content' : ''}`,
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
  for (const client of chatEventClients) client.res.end();
  chatEventClients.clear();
  server.close(() => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
