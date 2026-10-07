const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const http = require('node:http');
const fs = require('node:fs/promises');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');

const root = path.resolve(__dirname, '..');
let serverProcess;
let midtransServer;
let baseUrl;
let midtransBaseUrl;
let publicOrigin;
let tempDirectory;
let adminCookie;
let midtransRequests = [];
let midtransStatus = 'pending';
let midtransTransactions = new Map();
let midtransChargeResponse = null;
let midtransRefundResponse = null;
let dropChargeResponseOnce = false;
let serverOutput = '';
const testRsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const testDokuSettings = {
  DOKU_IS_PRODUCTION: 'false', DOKU_CLIENT_ID: 'MCH-test', DOKU_CLIENT_SECRET: 'doku-test-secret',
  DOKU_MERCHANT_ID: 'mall-test', DOKU_TERMINAL_ID: 'BACS001', DOKU_POSTAL_CODE: '12345',
  DOKU_PRIVATE_KEY_BASE64: Buffer.from(testRsa.privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64'),
};

async function freePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function request(route, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(method !== 'GET' ? { origin: publicOrigin || baseUrl } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

async function createQris(orderId, cookie) {
  // Existing Midtrans orders remain payable after the provider migration.
  const ordersFile = path.join(tempDirectory, 'orders.json');
  const orders = JSON.parse(await fs.readFile(ordersFile, 'utf8'));
  const order = orders.find(entry => entry.id === orderId);
  order.paymentProvider = 'qris_dynamic';
  order.midtransTransactionId = 'MTX-' + orderId;
  order.midtransMerchantId = 'merchant-test';
  order.paymentInitialized = true;
  order.paymentExpiresAt = new Date(Date.now() + 30 * 60000).toISOString();
  midtransTransactions.set(orderId, order.total);
  await fs.writeFile(ordersFile, JSON.stringify(orders));
  return request(`/api/orders/${encodeURIComponent(orderId)}/create-qris`, { method: 'POST', cookie, body: {} });
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

before(async () => {
  midtransTransactions = new Map();
  midtransChargeResponse = null;
  midtransRefundResponse = null;
  dropChargeResponseOnce = false;
  serverOutput = '';
  midtransServer = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    midtransRequests.push({ method: req.method, path: req.url, headers: req.headers, body });
    res.setHeader('content-type', 'application/json');
    if (req.method === 'POST' && req.url === '/v2/charge') {
      if (midtransChargeResponse) {
        res.end(JSON.stringify(midtransChargeResponse));
        return;
      }
      const orderId = body.transaction_details.order_id;
      midtransTransactions.set(orderId, Number(body.transaction_details.gross_amount));
      if (dropChargeResponseOnce) {
        dropChargeResponseOnce = false;
        req.socket.destroy();
        return;
      }
      res.end(JSON.stringify({
        status_code: '201', status_message: 'QRIS transaction is created', transaction_id: `MTX-${orderId}`,
        order_id: orderId, merchant_id: 'merchant-test', gross_amount: `${body.transaction_details.gross_amount}.00`,
        currency: 'IDR', payment_type: 'qris', transaction_status: 'pending', fraud_status: 'accept',
        acquirer: 'gopay', expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        actions: [
          { name: 'generate-qr-code-v2', method: 'GET', url: `${midtransBaseUrl}/v4/qris/gopay/MTX-${orderId}/qr-code` },
          { name: 'generate-qr-code', method: 'GET', url: `${midtransBaseUrl}/v2/qris/MTX-${orderId}/qr-code` },
        ],
      }));
    } else if (req.method === 'POST' && /^\/v2\/.+\/refund$/.test(req.url)) {
      const transactionId = decodeURIComponent(req.url.slice('/v2/'.length, -'/refund'.length));
      const orderId = transactionId.startsWith('MTX-') ? transactionId.slice(4) : transactionId;
      const amount = midtransTransactions.get(orderId);
      res.end(JSON.stringify(midtransRefundResponse || {
        status_code: '200', status_message: 'Success, refund request is approved', transaction_id: transactionId,
        order_id: orderId, payment_type: 'qris', transaction_status: 'refund', gross_amount: `${amount}.00`, refund_amount: `${amount}.00`,
        refunds: [{ refund_amount: `${amount}.00`, bank_confirmed_at: new Date().toISOString() }],
      }));
    } else if (req.method === 'GET' && /^\/v4\/qris\/.+\/qr-code$/.test(req.url)) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status_code: '503', status_message: 'Image unavailable' }));
    } else if (req.method === 'GET' && req.url.endsWith('/qr-code')) {
      res.writeHead(200, { 'content-type': 'image/png' });
      res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=', 'base64'));
    } else if (req.method === 'GET' && /^\/v2\/.+\/status$/.test(req.url)) {
      const orderId = decodeURIComponent(req.url.slice('/v2/'.length, -'/status'.length));
      if (!midtransTransactions.has(orderId)) {
        res.writeHead(404);
        res.end(JSON.stringify({ status_code: '404', status_message: 'Transaction not found' }));
        return;
      }
      res.end(JSON.stringify({
        status_code: '200', transaction_id: `MTX-${orderId}`, order_id: orderId, merchant_id: 'merchant-test',
        gross_amount: `${midtransTransactions.get(orderId)}.00`, currency: 'IDR', payment_type: 'qris', transaction_status: midtransStatus,
        fraud_status: 'accept',
      }));
    } else res.end(JSON.stringify({ status_code: '404', status_message: 'Not found' }));
  });
  midtransServer.listen(0, '127.0.0.1');
  await once(midtransServer, 'listening');
  midtransBaseUrl = `http://127.0.0.1:${midtransServer.address().port}`;
  tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'bacshop-auth-'));
  const productFile = path.join(tempDirectory, 'products.json');
  const uploadDirectory = path.join(tempDirectory, 'uploads');
  await fs.copyFile(path.join(root, 'data', 'products.json'), productFile);
  await fs.mkdir(uploadDirectory, { recursive: true });
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  publicOrigin = 'https://bacshop.example';
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, ...testDokuSettings, NODE_ENV: 'test', PORT: String(port), BACSHOP_DATA_DIR: tempDirectory, BACSHOP_PRODUCTS_FILE: productFile, BACSHOP_UPLOADS_DIR: uploadDirectory,
      BACSHOP_PUBLIC_ORIGIN: publicOrigin, BACSHOP_COOKIE_SECURE: 'true', BACSHOP_TRUSTED_PROXY_IPS: '127.0.0.1',
      MIDTRANS_API_BASE_URL: midtransBaseUrl, MIDTRANS_MERCHANT_ID: 'merchant-test', MIDTRANS_SERVER_KEY: 'test-server-key' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  serverProcess.stderr.on('data', (chunk) => { output += chunk.toString(); serverOutput += chunk.toString(); });
  const started = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 8000);
    serverProcess.stdout.on('data', (chunk) => {
      output += chunk.toString();
      serverOutput += chunk.toString();
      if (output.includes('Bacshop berjalan')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProcess.once('error', (error) => { clearTimeout(timer); reject(error); });
    serverProcess.once('exit', (code) => {
      if (code !== null && !output.includes('Bacshop berjalan')) {
        clearTimeout(timer);
        reject(new Error(`Server exited (${code}): ${output}`));
      }
    });
  });
  await started;

  const setupCode = output.match(/enter this one-time code:\s*\n([^\r\n]+)/)?.[1];
  assert.ok(setupCode, 'server should print the one-time local admin setup code');
  const setup = await request('/api/admin/setup', {
    method: 'POST',
    body: { code: setupCode, email: 'admin@example.test', password: 'StrongAdminPass123!' },
  });
  assert.equal(setup.response.status, 201);
  adminCookie = cookieFrom(setup.response);
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill('SIGINT');
    await once(serverProcess, 'exit');
  }
  if (tempDirectory) await fs.rm(tempDirectory, { recursive: true, force: true });
  if (midtransServer) await new Promise((resolve) => midtransServer.close(resolve));
});

test('health endpoint is suitable for deployment probes and discloses no payment credentials', async () => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.data, { status: 'ok', paymentProvider: 'DOKU', paymentConfigured: true });
  assert.equal(JSON.stringify(health.data).includes('test-server-key'), false);
});

test('production payment credentials are rejected before a development server touches storage', async () => {
  const dataDirectory = path.join(tempDirectory, 'production-mode-rejected');
  const port = await freePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      MIDTRANS_IS_PRODUCTION: 'true',
      MIDTRANS_SERVER_KEY: 'Mid-server-test-placeholder',
      BACSHOP_DATA_DIR: dataDirectory,
      BACSHOP_PRODUCTS_FILE: path.join(root, 'data', 'products.json'),
      BACSHOP_UPLOADS_DIR: path.join(tempDirectory, 'production-mode-rejected-uploads'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const exitPromise = once(child, 'exit');
  const exited = await Promise.race([
    exitPromise.then((result) => result),
    new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
  if (!exited) {
    child.kill('SIGTERM');
    await exitPromise;
  }
  assert.ok(exited, 'the development server must stop before opening a listener');
  assert.notEqual(exited[0], 0);
  assert.match(output, /Kredensial Midtrans Production hanya boleh digunakan saat NODE_ENV=production/);
  assert.doesNotMatch(output, /Mid-server-test-placeholder/);
  await assert.rejects(fs.access(dataDirectory), { code: 'ENOENT' });
});

test('production configuration starts with HTTPS origin, secure admin setup, and no setup-code logging', async () => {
  const productionRoot = path.join(tempDirectory, 'production-smoke');
  const dataDirectory = path.join(productionRoot, 'private');
  const productFile = path.join(productionRoot, 'catalog', 'products.json');
  const uploadDirectory = path.join(productionRoot, 'uploads');
  await fs.mkdir(path.dirname(productFile), { recursive: true });
  await fs.copyFile(path.join(root, 'data', 'products.json'), productFile);
  const port = await freePort();
  const productionOrigin = 'https://bacshop.example';
  const setupCode = 'production-smoke-test-only-setup-code-123456';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      BACSHOP_PUBLIC_ORIGIN: productionOrigin,
      BACSHOP_DATA_DIR: dataDirectory,
      BACSHOP_PRODUCTS_FILE: productFile,
      BACSHOP_UPLOADS_DIR: uploadDirectory,
      BACSHOP_ADMIN_SETUP_CODE: setupCode,
      MIDTRANS_IS_PRODUCTION: 'true',
      MIDTRANS_SERVER_KEY: 'Mid-server-test-placeholder',
      MIDTRANS_MERCHANT_ID: 'merchant-test',
      MIDTRANS_API_BASE_URL: '',
      BACSHOP_TRUSTED_PROXY_IPS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let started = false;
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const startPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Production smoke server startup timed out: ${output}`)), 5000);
    child.stdout.on('data', (chunk) => {
      if (!output.includes('Bacshop berjalan')) return;
      started = true;
      clearTimeout(timer);
      resolve();
    });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => {
      if (!started) {
        clearTimeout(timer);
        reject(new Error(`Production smoke server exited (${code}): ${output}`));
      }
    });
  });

  try {
    await startPromise;
    const base = `http://127.0.0.1:${port}`;
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', paymentProvider: 'DOKU', paymentConfigured: false });
    assert.equal(health.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');

    const setup = await fetch(`${base}/api/admin/setup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: productionOrigin },
      body: JSON.stringify({ code: setupCode, email: 'production-admin@example.test', password: 'StrongProductionPass123!' }),
    });
    assert.equal(setup.status, 201);
    const cookie = setup.headers.get('set-cookie');
    assert.match(cookie, /; Secure(?:;|$)/);
    assert.match(cookie, /HttpOnly/);
    const session = await fetch(`${base}/api/admin/session`, { headers: { cookie: cookie.split(';')[0] } });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).authenticated, true);
    assert.doesNotMatch(output, new RegExp(setupCode));
    for (const directory of [dataDirectory, path.dirname(productFile), uploadDirectory]) {
      const files = await fs.readdir(directory);
      assert.equal(files.some((name) => name.startsWith('.bacshop-write-check-')), false);
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGINT');
      await once(child, 'exit');
    }
  }
});

test('existing Midtrans orders retrieve their QR with server-side credentials after migration', async () => {
  midtransRequests = [];
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Legacy Buyer', email: 'midtrans@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const confirmed = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(confirmed.response.status, 201);
  assert.equal(confirmed.data.order.paymentProvider, 'doku_qris_snap');
  const order = await createQris(confirmed.data.order.id, buyerCookie);
  assert.equal(order.response.status, 200);
  assert.match(order.data.order.qrisImage, /^data:image\/png;base64,/);
  assert.equal(order.data.order.paymentProvider, 'qris_dynamic');
  assert.equal(midtransRequests.some(entry => entry.path === '/v2/charge'), false);
  assert.ok(midtransRequests.some(entry => entry.path.endsWith('/status')));
  assert.ok(midtransRequests.some(entry => entry.path.endsWith('/qr-code')));
  assert.ok(midtransRequests.every(entry => entry.headers.authorization === 'Basic ' + Buffer.from('test-server-key:').toString('base64')));
});


test('public HTTPS origin can use APIs with Secure cookies and foreign origins are rejected', async () => {
  const health = await request('/api/health');
  assert.equal(health.response.status, 200);
  assert.equal(health.data.status, 'ok');
  assert.equal(health.data.paymentConfigured, true);

  const accepted = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Remote Buyer', email: 'remote-origin@example.test', password: 'BuyerPass123!' },
  });
  assert.equal(accepted.response.status, 201, 'the configured public HTTPS origin can register a buyer');
  assert.match(accepted.response.headers.get('set-cookie'), /; Secure(?:;|$)/);
  assert.match(accepted.response.headers.get('set-cookie'), /HttpOnly/);

  const rejected = await request('/api/auth/register', {
    method: 'POST', headers: { origin: 'https://attacker.example' },
    body: { name: 'Blocked Buyer', email: 'blocked-origin@example.test', password: 'BuyerPass123!' },
  });
  assert.equal(rejected.response.status, 403);
  assert.equal((await request('/api/health')).response.headers.get('x-frame-options'), 'DENY');
});




test('buyer can register, log in, and read their own profile', async () => {
  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Nadia Putri', email: 'nadia@example.test', password: 'BuyerPass123!' },
  });
  assert.equal(registered.response.status, 201);
  const buyerCookie = cookieFrom(registered.response);
  assert.ok(buyerCookie);
  assert.equal(registered.data.user.name, 'Nadia Putri');
  assert.equal(registered.data.user.role, 'buyer');

  const profile = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.data.user.email, 'nadia@example.test');
  assert.equal(profile.data.user.role, 'buyer');

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'nadia@example.test', password: 'BuyerPass123!' },
  });
  assert.equal(login.response.status, 200);
  assert.ok(cookieFrom(login.response));
});

test('public product response never includes reseller pricing', async () => {
  const { response, data } = await request('/api/products');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(data.products));
  assert.ok(data.products.length > 0);
  assert.equal('resellerPrice' in data.products[0], false);
  assert.equal('bulkMinimum' in data.products[0], false);
});

test('storefront starts with three active homepage carousel slides', async () => {
  const { response, data } = await request('/api/storefront');
  assert.equal(response.status, 200);
  const activeBanners = data.banners.filter((banner) => banner.active);
  assert.equal(activeBanners.length, 3);
  assert.ok(activeBanners.every((banner) => banner.title === '' && banner.description === '' && banner.image === ''));
});

test('public catalog omits unverified ratings, sales counts, and sample copy', async () => {
  const { data } = await request('/api/products');
  for (const product of data.products) {
    assert.equal('rating' in product, false);
    assert.equal(product.sold, 0);
    assert.doesNotMatch(`${product.description} ${Object.values(product.terms || {}).join(' ')}`, /contoh/i);
  }
});

test('admin-only catalog creation rejects a buyer session', async () => {
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Nadia Putri', email: 'buyer2@example.test', password: 'BuyerPass123!' },
  });
  const result = await request('/api/admin/products', {
    method: 'POST',
    cookie: cookieFrom(registration.response),
    body: { product: { id: 'new-item' } },
  });
  assert.equal(result.response.status, 403);
});

test('admin can create, update, and delete a catalog product', async () => {
  const product = {
    id: 'bulk-item', slug: 'bulk-item', name: 'Bulk Item', category: 'ai', price: 10000,
    resellerPrice: 7000, bulkMinimum: 3, duration: '1 bulan', fulfillment: 'Kode digital',
    description: 'Produk untuk pengujian akses harga reseller.', terms: { Durasi: '1 bulan' },
    sold: 0, rating: 0, createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);
  assert.equal(created.data.product.resellerPrice, 7000);

  const updated = await request('/api/admin/products/bulk-item', {
    method: 'PUT', cookie: adminCookie, body: { product: { ...created.data.product, price: 12000 } },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.product.price, 12000);

  const deleted = await request('/api/admin/products/bulk-item', { method: 'DELETE', cookie: adminCookie });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.data.deleted, 'bulk-item');
});

test('admin-configured product variants control storefront choices and server-side order prices', async () => {
  const product = {
    id: 'variant-item', slug: 'variant-item', name: 'Variant Item', category: 'ai', price: 10000,
    resellerPrice: null, bulkMinimum: null, duration: 'Akses digital', fulfillment: 'Aktivasi digital',
    description: 'Produk untuk menguji spesifikasi terkelola.', terms: {}, sold: 0, rating: 0,
    createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
    specifications: [{
      id: 'durasi', name: 'Durasi', required: true,
      options: [
        { value: '1-bulan', label: '1 bulan', priceAdjustment: 0 },
        { value: '3-bulan', label: '3 bulan', priceAdjustment: 5000 },
      ],
    }],
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);

  const catalog = await request('/api/products');
  const storefrontProduct = catalog.data.products.find((entry) => entry.id === product.id);
  assert.deepEqual(storefrontProduct.specifications, product.specifications);
  assert.equal('resellerPrice' in storefrontProduct, false);

  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Variant Buyer', email: 'variant-buyer@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const missingChoice = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { items: [{ id: product.id, quantity: 2 }] },
  });
  assert.equal(missingChoice.response.status, 400);
  const invalidChoice = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { items: [{ id: product.id, quantity: 2, specifications: { durasi: '12-bulan' } }] },
  });
  assert.equal(invalidChoice.response.status, 400);

  const order = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie,
    body: { items: [{ id: product.id, quantity: 2, specifications: { durasi: '3-bulan' } }] },
  });
  assert.equal(order.response.status, 201);
  assert.equal(order.data.order.total, 30000);
  assert.deepEqual(order.data.order.items[0].specifications, [
    { id: 'durasi', name: 'Durasi', value: '3-bulan', label: '3 bulan' },
  ]);
});

test('admin bulk actions archive, restore, and delete selected products', async () => {
  const products = ['bulk-alpha', 'bulk-beta'].map((id) => ({
    id, slug: id, name: `Produk ${id}`, category: 'ai', price: 12000,
    resellerPrice: null, bulkMinimum: null, duration: '1 bulan', fulfillment: 'Aktivasi digital',
    description: 'Produk untuk menguji aksi katalog sekaligus.', terms: {}, stock: 10,
    createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  }));
  for (const product of products) {
    const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
    assert.equal(created.response.status, 201);
  }
  const productIds = products.map((product) => product.id);
  const archived = await request('/api/admin/products/bulk', { method: 'POST', cookie: adminCookie, body: { productIds, action: 'archive' } });
  assert.deepEqual(archived.data.changedIds, productIds);
  const publicWhileArchived = await request('/api/products');
  assert.equal(publicWhileArchived.data.products.some((product) => productIds.includes(product.id)), false);

  const restored = await request('/api/admin/products/bulk', { method: 'POST', cookie: adminCookie, body: { productIds, action: 'restore' } });
  assert.deepEqual(restored.data.changedIds, productIds);
  const publicAfterRestore = await request('/api/products');
  assert.equal(productIds.every((id) => publicAfterRestore.data.products.some((product) => product.id === id)), true);

  const deleted = await request('/api/admin/products/bulk', { method: 'POST', cookie: adminCookie, body: { productIds, action: 'delete' } });
  assert.deepEqual(deleted.data.changedIds, productIds);
  assert.deepEqual(deleted.data.blocked, []);
  assert.equal(deleted.data.products.some((product) => productIds.includes(product.id)), false);
});

test('Midtrans QRIS payment status is verified before reseller access is unlocked', async () => {
  midtransRequests = [];
  await fs.writeFile(path.join(tempDirectory, 'storefront.json'), JSON.stringify({ payment: { qrisImage: '/assets/uploads/legacy-static.png', instructions: 'Pindai QR statis' } }));
  const storefront = await request('/api/storefront');
  assert.equal(storefront.data.payment.provider, 'DOKU QRIS');
  assert.equal(storefront.data.payment.available, true);
  assert.equal('qrisImage' in storefront.data.payment, false);
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'qris@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const confirmed = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(confirmed.response.status, 201);
  const order = await createQris(confirmed.data.order.id, buyerCookie);
  assert.equal(order.response.status, 200);
  assert.match(order.data.order.qrisImage, /^data:image\/png;base64,/);
  assert.equal(order.data.order.paymentStatus, 'pending');
  assert.equal(midtransRequests.some(entry => entry.path === '/v2/charge'), false);
  const staticConfirm = await request(`/api/admin/orders/${order.data.order.id}/confirm-payment`, { method: 'POST', cookie: adminCookie, body: { transactionReference: 'MANUAL-123' } });
  assert.equal(staticConfirm.response.status, 410);
  const pending = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  assert.equal(pending.data.order.paymentStatus, 'pending');
  assert.ok(midtransRequests.some((entry) => entry.method === 'GET' && entry.path === `/v2/${order.data.order.id}/status`));

  const callback = { order_id: order.data.order.id, status_code: '200', gross_amount: '149000.00', currency: 'IDR', payment_type: 'qris', transaction_status: 'settlement', transaction_id: 'MTX-SETTLED-002', merchant_id: 'merchant-test', fraud_status: 'accept' };
  callback.signature_key = crypto.createHash('sha512').update(`${callback.order_id}${callback.status_code}${callback.gross_amount}test-server-key`).digest('hex');
  const invalid = await request('/api/payments/notify', { method: 'POST', body: { ...callback, signature_key: 'invalid' } });
  assert.equal(invalid.response.status, 401);
  const stillPending = await request(`/api/orders/${order.data.order.id}`, { cookie: buyerCookie });
  assert.equal(stillPending.data.order.paymentStatus, 'pending');
  const notified = await request('/api/payments/notify', { method: 'POST', body: callback });
  assert.equal(notified.response.status, 200);
  const paidOrder = await request(`/api/orders/${order.data.order.id}`, { cookie: buyerCookie });
  assert.equal(paidOrder.data.order.paymentStatus, 'paid');
  const resellerSession = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(resellerSession.data.user.resellerPlan, true);
});

test('admin-managed stock reserves pending orders and decreases after Midtrans confirms payment', async () => {
  const product = {
    id: 'stock-managed', slug: 'stock-managed', name: 'Produk stok terbatas', category: 'ai', price: 25000,
    resellerPrice: null, bulkMinimum: null, duration: '1 bulan', fulfillment: 'Aktivasi digital',
    description: 'Produk untuk memastikan stok dicatat saat pembayaran terkonfirmasi.', terms: {}, stock: 5,
    createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Stok Buyer', email: 'stock@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { items: [{ id: product.id, quantity: 3 }] },
  });
  assert.equal(order.response.status, 201);
  const qris = await createQris(order.data.order.id, buyerCookie);
  assert.equal(qris.response.status, 200);
  const reserved = await request('/api/products');
  assert.equal(reserved.data.products.find((entry) => entry.id === product.id).stockAvailable, 2);
  const adminReserved = await request('/api/admin/products', { cookie: adminCookie });
  const adminProduct = adminReserved.data.products.find((entry) => entry.id === product.id);
  assert.equal(adminProduct.stock, 5);
  assert.equal(adminProduct.stockAvailable, 2);

  midtransStatus = 'settlement';
  const paid = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  midtransStatus = 'pending';
  assert.equal(paid.response.status, 200);
  assert.equal(paid.data.order.paymentStatus, 'paid');
  const afterPayment = await request('/api/products');
  const updated = afterPayment.data.products.find((entry) => entry.id === product.id);
  assert.equal(updated.stock, 2);
  assert.equal(updated.stockAvailable, 2);
});

test('verified paid bulk order permanently unlocks only its product reseller price', async () => {
  midtransStatus = 'pending';
  const product = {
    id: 'bulk-item', slug: 'bulk-item', name: 'Bulk Item', category: 'ai', price: 10000,
    resellerPrice: 7000, bulkMinimum: 3, duration: '1 bulan', fulfillment: 'Kode digital',
    description: 'Produk untuk pengujian akses harga reseller.', terms: { Durasi: '1 bulan' },
    sold: 0, rating: 0, createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);

  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Budi Santoso', email: 'bulk@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const pendingOrder = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { items: [{ id: 'bulk-item', quantity: 3 }] },
  });
  assert.equal(pendingOrder.response.status, 201);
  const qris = await createQris(pendingOrder.data.order.id, buyerCookie);
  assert.equal(qris.response.status, 200);
  assert.equal(pendingOrder.data.order.total, 30000);
  assert.equal(pendingOrder.data.order.paymentStatus, 'pending');

  const whilePending = await request('/api/products', { cookie: buyerCookie });
  const beforePaid = whilePending.data.products.find((entry) => entry.id === 'bulk-item');
  assert.equal(beforePaid.price, 10000);
  assert.equal(beforePaid.priceContext, 'retail');

  const unverified = await request(`/api/orders/${pendingOrder.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  assert.equal(unverified.response.status, 200);
  assert.equal(unverified.data.order.paymentStatus, 'pending');
  const query = midtransRequests.find((entry) => entry.method === 'GET' && entry.path === `/v2/${pendingOrder.data.order.id}/status`);
  assert.ok(query, 'status checks are made directly to the payment API');
  assert.equal(query.headers.authorization, `Basic ${Buffer.from('test-server-key:').toString('base64')}`);

  midtransStatus = 'settlement';
  const confirmed = await request(`/api/orders/${pendingOrder.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  midtransStatus = 'pending';
  assert.equal(confirmed.response.status, 200);
  assert.equal(confirmed.data.order.paymentStatus, 'paid');

  const secondOrder = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' },
  });
  assert.equal(secondOrder.response.status, 201);
  const manualConfirmation = await request(`/api/admin/orders/${secondOrder.data.order.id}/confirm-payment`, { method: 'POST', cookie: adminCookie, body: { transactionReference: 'dana-txn-001' } });
  assert.equal(manualConfirmation.response.status, 410);

  const buyerProducts = await request('/api/products', { cookie: buyerCookie });
  const unlocked = buyerProducts.data.products.find((entry) => entry.id === 'bulk-item');
  assert.equal(unlocked.price, 7000);
  assert.equal(unlocked.priceContext, 'reseller');
  assert.equal('resellerPrice' in unlocked, false);

  const fulfillment = await request(`/api/admin/orders/${pendingOrder.data.order.id}/fulfillment`, {
    method: 'POST', cookie: adminCookie, body: { status: 'fulfilled', note: 'Kode dikirim ke email akun.' },
  });
  assert.equal(fulfillment.response.status, 200);
  assert.equal(fulfillment.data.order.paymentStatus, 'paid');
  assert.equal(fulfillment.data.order.fulfillmentStatus, 'fulfilled');
  const ownOrder = await request(`/api/orders/${pendingOrder.data.order.id}`, { cookie: buyerCookie });
  assert.equal(ownOrder.data.order.fulfillmentNote, 'Kode dikirim ke email akun.');

  const publicProducts = await request('/api/products');
  const retail = publicProducts.data.products.find((entry) => entry.id === 'bulk-item');
  assert.equal(retail.price, 10000);
  assert.equal(retail.priceContext, 'retail');

  const beforeRefundRequest = midtransRequests.length;
  const refunded = await request(`/api/admin/orders/${pendingOrder.data.order.id}/refund`, {
    method: 'POST', cookie: adminCookie, body: { reason: 'Pembayaran dikembalikan.' },
  });
  assert.equal(refunded.response.status, 200);
  assert.equal(refunded.data.refundConfirmed, true);
  assert.equal(refunded.data.order.paymentStatus, 'refunded');
  const providerRefund = midtransRequests.slice(beforeRefundRequest).find((entry) => entry.method === 'POST' && entry.path.endsWith('/refund'));
  assert.ok(providerRefund, 'refunds are submitted to Midtrans');
  assert.equal(providerRefund.path, `/v2/MTX-${pendingOrder.data.order.id}/refund`);
  assert.equal(providerRefund.body.amount, pendingOrder.data.order.total);
  assert.equal(providerRefund.body.reason, 'Pembayaran dikembalikan.');
  const afterRefund = await request('/api/products', { cookie: buyerCookie });
  assert.equal(afterRefund.data.products.find((entry) => entry.id === 'bulk-item').price, 10000);
});

test('reseller access remains active until Midtrans confirms a full refund', async () => {
  const product = {
    id: 'refund-pending-item', slug: 'refund-pending-item', name: 'Produk refund', category: 'ai', price: 10000,
    resellerPrice: 7000, bulkMinimum: 2, duration: '1 bulan', fulfillment: 'Kode digital',
    description: 'Produk untuk menguji konfirmasi refund.', terms: {}, stock: null,
    createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Refund Buyer', email: 'refund-pending@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { items: [{ id: product.id, quantity: 2 }] } });
  assert.equal(order.response.status, 201);
  const qris = await createQris(order.data.order.id, buyerCookie);
  assert.equal(qris.response.status, 200);
  midtransStatus = 'settlement';
  const paid = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  midtransStatus = 'pending';
  assert.equal(paid.data.order.paymentStatus, 'paid');

  const txId = `MTX-${order.data.order.id}`;
  midtransRefundResponse = {
    status_code: '200', transaction_id: txId, order_id: order.data.order.id, payment_type: 'qris',
    transaction_status: 'refund', gross_amount: '20000.00', refund_amount: '20000.00',
  };
  const pendingRefund = await request(`/api/admin/orders/${order.data.order.id}/refund`, {
    method: 'POST', cookie: adminCookie, body: { reason: 'Pesanan dibatalkan.' },
  });
  assert.equal(pendingRefund.response.status, 202);
  assert.equal(pendingRefund.data.refundConfirmed, false);
  assert.equal(pendingRefund.data.order.paymentStatus, 'paid');
  assert.equal(pendingRefund.data.order.refundStatus, 'requested');
  assert.equal('refundReason' in pendingRefund.data.order, false);
  const productWhileRefundPending = await request('/api/products', { cookie: buyerCookie });
  assert.equal(productWhileRefundPending.data.products.find((entry) => entry.id === product.id).price, 7000);

  midtransRefundResponse = {
    ...midtransRefundResponse,
    refunds: [{ refund_amount: '20000.00', bank_confirmed_at: new Date().toISOString() }],
  };
  const beforeRetry = midtransRequests.length;
  const confirmedRefund = await request(`/api/admin/orders/${order.data.order.id}/refund`, {
    method: 'POST', cookie: adminCookie, body: { reason: 'Pesanan dibatalkan.' },
  });
  assert.equal(confirmedRefund.response.status, 200);
  assert.equal(confirmedRefund.data.refundConfirmed, true);
  assert.equal(confirmedRefund.data.order.paymentStatus, 'refunded');
  const retry = midtransRequests.slice(beforeRetry).find((entry) => entry.method === 'POST' && entry.path.endsWith('/refund'));
  const firstRefund = midtransRequests.find((entry) => entry.method === 'POST' && entry.path.endsWith('/refund') && entry.path.includes(order.data.order.id));
  assert.equal(retry.body.refund_key, firstRefund.body.refund_key, 'retries reuse one provider refund key');
  const productAfterRefund = await request('/api/products', { cookie: buyerCookie });
  assert.equal(productAfterRefund.data.products.find((entry) => entry.id === product.id).price, 10000);
  midtransRefundResponse = null;
});

test('a confirmed reseller-plan refund removes plan access', async () => {
  midtransStatus = 'pending';
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Plan Refund Buyer', email: 'plan-refund@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(order.response.status, 201);
  const qris = await createQris(order.data.order.id, buyerCookie);
  assert.equal(qris.response.status, 200);
  midtransStatus = 'settlement';
  const paid = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  midtransStatus = 'pending';
  assert.equal(paid.data.order.paymentStatus, 'paid');
  const activeSession = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(activeSession.data.user.resellerPlan, true);

  const refund = await request(`/api/admin/orders/${order.data.order.id}/refund`, {
    method: 'POST', cookie: adminCookie, body: { reason: 'Paket dikembalikan.' },
  });
  assert.equal(refund.response.status, 200);
  assert.equal(refund.data.order.paymentStatus, 'refunded');
  const refundedSession = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(refundedSession.data.user.resellerPlan, false);
});

test('duplicate payment notifications repair entitlements and deduct managed stock once', async () => {
  midtransStatus = 'pending';
  const product = {
    id: 'retry-stock-item', slug: 'retry-stock-item', name: 'Produk stok retry', category: 'ai', price: 10000,
    resellerPrice: 7000, bulkMinimum: 2, duration: '1 bulan', fulfillment: 'Aktivasi digital',
    description: 'Produk untuk menguji pemulihan pembayaran.', terms: {}, stock: 5,
    createdAt: '2026-09-29', orderMode: 'ready', preOrderConfirmed: true, image: '',
  };
  const created = await request('/api/admin/products', { method: 'POST', cookie: adminCookie, body: { product } });
  assert.equal(created.response.status, 201);
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Retry Buyer', email: 'retry-buyer@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', {
    method: 'POST', cookie: buyerCookie, body: { items: [{ id: product.id, quantity: 2 }] },
  });
  assert.equal(order.response.status, 201);
  const qris = await createQris(order.data.order.id, buyerCookie);
  assert.equal(qris.response.status, 200);

  const callback = {
    order_id: order.data.order.id, status_code: '200', gross_amount: '20000.00', currency: 'IDR',
    payment_type: 'qris', transaction_status: 'settlement', transaction_id: 'MTX-RETRY-SETTLEMENT',
    merchant_id: 'merchant-test', fraud_status: 'accept',
  };
  callback.signature_key = crypto.createHash('sha512').update(`${callback.order_id}${callback.status_code}${callback.gross_amount}test-server-key`).digest('hex');
  const firstNotification = await request('/api/payments/notify', { method: 'POST', body: callback });
  assert.equal(firstNotification.response.status, 200);

  const ordersFile = path.join(tempDirectory, 'orders.json');
  const usersFile = path.join(tempDirectory, 'users.json');
  const productsFile = path.join(tempDirectory, 'products.json');
  const orders = JSON.parse(await fs.readFile(ordersFile, 'utf8'));
  const users = JSON.parse(await fs.readFile(usersFile, 'utf8'));
  const products = JSON.parse(await fs.readFile(productsFile, 'utf8'));
  const storedOrder = orders.find((entry) => entry.id === order.data.order.id);
  const storedUser = users.find((entry) => entry.email === 'retry-buyer@example.test');
  const storedProduct = products.find((entry) => entry.id === product.id);
  const productIndex = products.indexOf(storedProduct);
  assert.equal(storedOrder.paymentStatus, 'paid');
  assert.equal(storedProduct.stock, 3);
  assert.ok(storedProduct.stockDeductionOrderIds.includes(storedOrder.id));

  // Simulate a crash after payment was recorded but before stock and access were synchronized.
  orders[orders.indexOf(storedOrder)] = { ...storedOrder, stockDeducted: false };
  products[productIndex] = { ...storedProduct, stock: 5 };
  delete products[productIndex].stockDeductionOrderIds;
  users[users.indexOf(storedUser)] = { ...storedUser, productEntitlements: [] };
  await fs.writeFile(ordersFile, JSON.stringify(orders));
  await fs.writeFile(productsFile, JSON.stringify(products));
  await fs.writeFile(usersFile, JSON.stringify(users));

  const repairedNotification = await request('/api/payments/notify', { method: 'POST', body: callback });
  assert.equal(repairedNotification.response.status, 200);
  let repairedProducts = JSON.parse(await fs.readFile(productsFile, 'utf8'));
  let repairedProduct = repairedProducts.find((entry) => entry.id === product.id);
  assert.equal(repairedProduct.stock, 3);
  assert.ok(repairedProduct.stockDeductionOrderIds.includes(order.data.order.id));
  const resellerCatalog = await request('/api/products', { cookie: buyerCookie });
  assert.equal(resellerCatalog.data.products.find((entry) => entry.id === product.id).priceContext, 'reseller');

  const adminCatalog = await request('/api/admin/products', { cookie: adminCookie });
  const visibleAdminProduct = adminCatalog.data.products.find((entry) => entry.id === product.id);
  assert.equal('stockDeductionOrderIds' in visibleAdminProduct, false);
  const update = await request(`/api/admin/products/${product.id}`, {
    method: 'PUT', cookie: adminCookie, body: { product: { ...product, stock: 3 } },
  });
  assert.equal(update.response.status, 200);
  assert.equal('stockDeductionOrderIds' in update.data.product, false);

  const duplicateNotification = await request('/api/payments/notify', { method: 'POST', body: callback });
  assert.equal(duplicateNotification.response.status, 200);
  repairedProducts = JSON.parse(await fs.readFile(productsFile, 'utf8'));
  repairedProduct = repairedProducts.find((entry) => entry.id === product.id);
  assert.equal(repairedProduct.stock, 3);
});

test('admin CMS changes persist and image uploads validate content', async () => {
  const initial = await request('/api/admin/storefront', { cookie: adminCookie });
  assert.equal(initial.response.status, 200);
  const storefront = {
    ...initial.data,
    banners: [{ ...initial.data.banners[0], title: 'Banner tersimpan' }],
    promotions: [{ id: 'promo-1', title: 'Promo terbaru', description: 'Keterangan promo.', href: '#/promo', image: '', active: true }],
  };
  const updated = await request('/api/admin/storefront', { method: 'PUT', cookie: adminCookie, body: { storefront } });
  assert.equal(updated.response.status, 200);

  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=';
  const uploaded = await request('/api/admin/uploads', {
    method: 'POST', cookie: adminCookie, body: { mimeType: 'image/png', data: png },
  });
  assert.equal(uploaded.response.status, 201);
  assert.match(uploaded.data.imageUrl, /^\/assets\/uploads\/[a-z0-9-]+\.png$/);
  const uploadedImageResponse = await fetch(`${baseUrl}${uploaded.data.imageUrl}`);
  assert.equal(uploadedImageResponse.status, 200);
  assert.equal(uploadedImageResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await uploadedImageResponse.arrayBuffer()), Buffer.from(png, 'base64'));

  const saved = await request('/api/admin/storefront', { cookie: adminCookie });
  assert.equal(saved.data.banners[0].title, 'Banner tersimpan');
  assert.equal(saved.data.promotions[0].title, 'Promo terbaru');
  const badUpload = await request('/api/admin/uploads', {
    method: 'POST', cookie: adminCookie, body: { mimeType: 'image/svg+xml', data: 'PHN2Zy8+' },
  });
  assert.equal(badUpload.response.status, 400);
});

test('verified reseller plan unlocks every configured reseller price permanently', async () => {
  const user = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Sari Dewi', email: 'plan@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(user.response);
  const confirmed = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(confirmed.response.status, 201);
  const order = await createQris(confirmed.data.order.id, buyerCookie);
  assert.equal(order.response.status, 200);
  assert.equal(order.data.order.total, 149000);
  assert.equal(order.data.order.kind, 'reseller-plan');

  const myOrders = await request('/api/orders', { cookie: buyerCookie });
  assert.equal(myOrders.response.status, 200);
  assert.equal(myOrders.data.orders[0].id, order.data.order.id);
  assert.equal(myOrders.data.orders[0].paymentStatus, 'pending');

  midtransStatus = 'settlement';
  const paid = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  midtransStatus = 'pending';
  assert.equal(paid.response.status, 200);
  const session = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(session.data.user.resellerPlan, true);
  const products = await request('/api/products', { cookie: buyerCookie });
  assert.equal(products.data.products.find((entry) => entry.id === 'bulk-item').priceContext, 'reseller');
});
