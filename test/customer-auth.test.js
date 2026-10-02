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
let tempDirectory;
let adminCookie;
let midtransRequests = [];
let midtransStatus = 'pending';
let midtransTransactions = new Map();
let midtransChargeResponse = null;
let serverOutput = '';

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
      ...(method !== 'GET' ? { origin: baseUrl } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

before(async () => {
  midtransTransactions = new Map();
  midtransChargeResponse = null;
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
    } else if (req.method === 'GET' && /^\/v4\/qris\/.+\/qr-code$/.test(req.url)) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status_code: '503', status_message: 'Image unavailable' }));
    } else if (req.method === 'GET' && req.url.endsWith('/qr-code')) {
      res.writeHead(200, { 'content-type': 'image/png' });
      res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=', 'base64'));
    } else if (req.method === 'GET' && /^\/v2\/.+\/status$/.test(req.url)) {
      const orderId = decodeURIComponent(req.url.slice('/v2/'.length, -'/status'.length));
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
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'test', PORT: String(port), BACSHOP_DATA_DIR: tempDirectory, BACSHOP_PRODUCTS_FILE: productFile, BACSHOP_UPLOADS_DIR: uploadDirectory,
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

test('checkout creates a Midtrans QRIS but exposes only a generic QR code experience', async () => {
  midtransRequests = [];
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'midtrans@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(order.response.status, 201);
  assert.equal(order.data.order.total, 149000);
  assert.equal(order.data.order.paymentStatus, 'pending');
  assert.match(order.data.order.qrisImage, /^data:image\/png;base64,/);
  assert.equal(order.data.order.paymentProvider, 'qris_dynamic');
  const charge = midtransRequests.find((entry) => entry.method === 'POST' && entry.path === '/v2/charge');
  assert.ok(charge, 'checkout calls the server-side Core API charge endpoint');
  assert.equal(charge.body.payment_type, 'qris');
  assert.equal(charge.body.transaction_details.order_id, order.data.order.id);
  assert.equal(charge.body.transaction_details.gross_amount, 149000);
  assert.equal(charge.headers.authorization, `Basic ${Buffer.from('test-server-key:').toString('base64')}`);
  assert.equal(midtransRequests.some((entry) => entry.method === 'POST' && entry.path.includes('dana')), false);
  const imageRequests = midtransRequests.filter((entry) => entry.method === 'GET' && entry.path.endsWith('/qr-code'));
  assert.deepEqual(imageRequests.map((entry) => entry.path), [
    `/v4/qris/gopay/MTX-${order.data.order.id}/qr-code`,
    `/v2/qris/MTX-${order.data.order.id}/qr-code`,
  ]);
  assert.ok(imageRequests.every((entry) => entry.headers.authorization === charge.headers.authorization), 'each image request uses server-side authorization');
  assert.equal(order.data.order.paymentInstructions.includes('Midtrans'), false);
  const storefrontScript = await fetch(`${baseUrl}/app.js`).then((response) => response.text());
  assert.doesNotMatch(storefrontScript, /Midtrans|DANA/, 'the shop interface contains no processor branding');
});

test('mismatched provider response gives a useful sanitized diagnostic', async () => {
  serverOutput = '';
  midtransChargeResponse = {
    status_code: '202',
    status_message: 'Merchant onboarding incomplete',
    shouldNotLog: 'never-print-this-secret',
  };
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'provider-mismatch@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  midtransChargeResponse = null;

  assert.equal(order.response.status, 502);
  assert.match(serverOutput, /"httpStatus":200,"statusCode":"202","statusMessage":"Merchant onboarding incomplete","responseFields":\["status_code","status_message","shouldNotLog"\]/);
  assert.doesNotMatch(serverOutput, /never-print-this-secret/);
  assert.doesNotMatch(serverOutput, /test-server-key/);
});

test('an ambiguous successful QRIS response stays in the buyer order list', async () => {
  midtransChargeResponse = { status_code: '202', status_message: 'Charge pending review' };
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'ambiguous-provider@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const create = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  midtransChargeResponse = null;
  const list = await request('/api/orders', { cookie: buyerCookie });

  assert.equal(create.response.status, 502);
  assert.match(create.data.error, /Periksa menu Pesanan sebelum mencoba lagi/);
  assert.equal(list.response.status, 200);
  assert.equal(list.data.orders.length, 1, 'the buyer can find an uncertain payment before trying again');
  assert.equal(list.data.orders[0].paymentStatus, 'pending');
  assert.equal(list.data.orders[0].status, 'awaiting_payment');
  assert.equal(list.data.orders[0].qrisImage, undefined);
});

test('an inactive Midtrans QRIS channel gives an actionable error and removes the rejected draft', async () => {
  midtransChargeResponse = {
    status_code: '402',
    status_message: 'Payment channel is not activated.',
    id: 'provider-error-reference',
  };
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'inactive-channel@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const create = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  midtransChargeResponse = null;
  const list = await request('/api/orders', { cookie: buyerCookie });

  assert.equal(create.response.status, 502);
  assert.match(create.data.error, /akun Production yang sama dengan MIDTRANS_SERVER_KEY/);
  assert.equal(list.response.status, 200);
  assert.equal(list.data.orders.length, 0, 'a provider-rejected draft should not look like a payment the buyer can complete');
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
  assert.equal(storefront.data.payment.provider, 'QRIS');
  assert.equal(storefront.data.payment.available, true);
  assert.equal('qrisImage' in storefront.data.payment, false);
  const registration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'QR Buyer', email: 'qris@example.test', password: 'BuyerPass123!' },
  });
  const buyerCookie = cookieFrom(registration.response);
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(order.response.status, 201);
  assert.match(order.data.order.qrisImage, /^data:image\/png;base64,/);
  assert.equal(order.data.order.paymentStatus, 'pending');
  const generate = midtransRequests.find((entry) => entry.method === 'POST' && entry.path === '/v2/charge');
  assert.ok(generate);
  assert.equal(generate.body.transaction_details.gross_amount, 149000);
  assert.equal(generate.body.transaction_details.order_id, order.data.order.id);
  assert.equal(generate.body.payment_type, 'qris');
  const staticConfirm = await request(`/api/admin/orders/${order.data.order.id}/confirm-payment`, { method: 'POST', cookie: adminCookie, body: { transactionReference: 'MANUAL-123' } });
  assert.equal(staticConfirm.response.status, 410);
  const pending = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  assert.equal(pending.data.order.paymentStatus, 'pending');
  assert.ok(midtransRequests.some((entry) => entry.method === 'GET' && entry.path === `/v2/${order.data.order.id}/status`));

  const callback = { order_id: order.data.order.id, status_code: '200', gross_amount: '149000.00', currency: 'IDR', transaction_status: 'settlement', transaction_id: 'MTX-SETTLED-002', merchant_id: 'merchant-test', fraud_status: 'accept' };
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

  const refunded = await request(`/api/admin/orders/${pendingOrder.data.order.id}/refund`, {
    method: 'POST', cookie: adminCookie, body: { reason: 'Pembayaran dikembalikan.' },
  });
  assert.equal(refunded.response.status, 200);
  const afterRefund = await request('/api/products', { cookie: buyerCookie });
  assert.equal(afterRefund.data.products.find((entry) => entry.id === 'bulk-item').price, 10000);
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
  const order = await request('/api/orders', { method: 'POST', cookie: buyerCookie, body: { kind: 'reseller-plan' } });
  assert.equal(order.response.status, 201);
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
