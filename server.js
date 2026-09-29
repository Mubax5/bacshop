'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = '127.0.0.1';
const PRIVATE_DIR = process.env.BACSHOP_DATA_DIR || path.join(ROOT, '.bacshop-private');
const PRODUCTS_FILE = path.join(ROOT, 'data', 'products.json');
const ADMIN_FILE = path.join(PRIVATE_DIR, 'admin.json');
const SESSION_MS = 8 * 60 * 60 * 1000;
const COOKIE = 'BacshopAdmin';
const CATEGORIES = new Set(['ai', 'streaming', 'desain', 'musik', 'office', 'editing', 'voucher']);
const MIME = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

fs.mkdirSync(PRIVATE_DIR, { recursive: true });
if (!fs.existsSync(PRODUCTS_FILE)) throw new Error('Missing data/products.json');

let adminRecord = readJson(ADMIN_FILE, null);
let setupCode = adminRecord ? null : crypto.randomBytes(24).toString('base64url');
const sessions = new Map();
const loginAttempts = new Map();
if (setupCode) {
  console.log('\nBacshop admin first setup');
  console.log(`Open http://${HOST}:${PORT}/#/admin and enter this one-time code:`);
  console.log(setupCode);
  console.log('This code is only printed locally and expires when the server stops.\n');
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function readProducts() {
  return readJson(PRODUCTS_FILE, []);
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function cookieValue(req) {
  const entry = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE.length + 1)) : '';
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

function setSession(res, email) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { email, expires: Date.now() + SESSION_MS });
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}`);
}

function clearSession(req, res) {
  const token = cookieValue(req);
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

function localRequest(req) {
  const address = req.socket.remoteAddress || '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  return origin === `http://${HOST}:${PORT}`;
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

function passwordMatches(password) {
  if (!adminRecord || typeof password !== 'string') return false;
  const candidate = hashPassword(password, adminRecord.salt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(adminRecord.hash, 'hex'));
}

function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateProduct(input, id, products) {
  if (!input || typeof input !== 'object') return 'Data produk tidak valid.';
  const stringFields = ['name', 'slug', 'duration', 'fulfillment', 'description'];
  for (const field of stringFields) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > (field === 'description' ? 2400 : 180)) return `Periksa kolom ${field}.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) return 'URL produk hanya boleh berisi huruf kecil, angka, dan tanda hubung.';
  if (!CATEGORIES.has(input.category)) return 'Kategori tidak dikenal.';
  if (!Number.isSafeInteger(Number(input.price)) || Number(input.price) < 0) return 'Harga harus berupa angka nol atau lebih.';
  if (!Number.isSafeInteger(Number(input.sold)) || Number(input.sold) < 0) return 'Jumlah terjual harus berupa angka nol atau lebih.';
  if (!Number.isFinite(Number(input.rating)) || Number(input.rating) < 0 || Number(input.rating) > 5) return 'Rating harus di antara 0 dan 5.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.createdAt) || Number.isNaN(Date.parse(input.createdAt))) return 'Tanggal produk harus memakai format YYYY-MM-DD.';
  if (!['ready', 'preorder'].includes(input.orderMode)) return 'Pilih status pesanan yang tersedia.';
  if (typeof input.preOrderConfirmed !== 'boolean') return 'Konfirmasi stok tidak valid.';
  if (!input.terms || typeof input.terms !== 'object' || Array.isArray(input.terms) || Object.keys(input.terms).length > 20) return 'Ketentuan produk tidak valid.';
  for (const [label, value] of Object.entries(input.terms)) {
    if (!label.trim() || label.length > 80 || typeof value !== 'string' || value.length > 500) return 'Periksa daftar ketentuan produk.';
  }
  if (products.some((product) => product.id !== id && product.slug === input.slug)) return 'URL produk sudah dipakai produk lain.';
  return null;
}

function loginLimited(req) {
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (record.resetAt <= now) {
    loginAttempts.set(key, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  return record.count >= 8;
}

function recordLoginFailure(req) {
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, resetAt: now + 15 * 60 * 1000 };
  if (record.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.count++;
    loginAttempts.set(key, record);
  }
}

async function handleApi(req, res, url) {
  if (!localRequest(req)) return json(res, 403, { error: 'Admin hanya dapat diakses dari komputer ini.' });
  if (req.method === 'GET' && url.pathname === '/api/products') return json(res, 200, { products: readProducts() });
  if (req.method === 'GET' && url.pathname === '/api/admin/session') {
    const session = activeSession(req);
    return json(res, 200, { authenticated: Boolean(session), email: session?.email || '', setupRequired: !adminRecord });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/products') {
    const session = activeSession(req);
    if (!session) return json(res, 401, { error: 'Masuk sebagai admin untuk melanjutkan.' });
    return json(res, 200, { products: readProducts() });
  }
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && !sameOrigin(req)) return json(res, 403, { error: 'Permintaan hanya dapat dimulai dari halaman Bacshop lokal.' });

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
    loginAttempts.delete(req.socket.remoteAddress || 'local');
    setSession(res, adminRecord.email);
    return json(res, 200, { authenticated: true, email: adminRecord.email });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
    clearSession(req, res);
    return json(res, 200, { authenticated: false });
  }

  const updateMatch = url.pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
  if (req.method === 'PUT' && updateMatch) {
    if (!activeSession(req)) return json(res, 401, { error: 'Sesi admin berakhir. Silakan masuk lagi.' });
    const products = readProducts();
    const index = products.findIndex((product) => product.id === updateMatch[1]);
    if (index < 0) return json(res, 404, { error: 'Produk tidak ditemukan.' });
    const body = await readBody(req);
    const validationError = validateProduct(body.product, updateMatch[1], products);
    if (validationError) return json(res, 400, { error: validationError });
    const updated = { ...body.product, id: updateMatch[1], price: Number(body.product.price), sold: Number(body.product.sold), rating: Number(body.product.rating) };
    products[index] = updated;
    writeJsonAtomic(PRODUCTS_FILE, products);
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
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) return json(res, 404, { error: 'File tidak ditemukan.' });
  let contents;
  try { contents = fs.readFileSync(absolute); } catch { return json(res, 404, { error: 'File tidak ditemukan.' }); }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(absolute)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
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
