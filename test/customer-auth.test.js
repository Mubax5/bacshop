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
let danaServer;
let baseUrl;
let danaBaseUrl;
let tempDirectory;
let adminCookie;
let danaRequests = [];
let danaPublicKey;
let danaPrivateKey;
let danaStatus = '01';

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
  const danaKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  danaPrivateKey = danaKeys.privateKey;
  danaPublicKey = danaKeys.publicKey;
  danaServer = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    danaRequests.push({ method: req.method, path: req.url, headers: req.headers, body: JSON.parse(raw || '{}') });
    res.writeHead(200, { 'content-type': 'application/json' });
    if (req.url === '/v1.0/qr/qr-mpm-generate.htm') res.end(JSON.stringify({ responseCode: '2004700', responseMessage: 'Successful', partnerReferenceNo: JSON.parse(raw).partnerReferenceNo, qrContent: '000201010212TEST' }));
    else if (req.url === '/rest/v1.1/debit/status') res.end(JSON.stringify({ responseCode: '2005500', responseMessage: 'Success', latestTransactionStatus: danaStatus, originalPartnerReferenceNo: JSON.parse(raw).originalPartnerReferenceNo, originalReferenceNo: 'DANA-REF', merchantId: 'merchant-test', amount: JSON.parse(raw).amount }));
    else res.end(JSON.stringify({ responseCode: '4040000', responseMessage: 'Not found' }));
  });
  danaServer.listen(0, '127.0.0.1');
  await once(danaServer, 'listening');
  danaBaseUrl = `http://127.0.0.1:${danaServer.address().port}`;
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
      DANA_API_BASE_URL: danaBaseUrl, DANA_MERCHANT_ID: 'merchant-test', DANA_CLIENT_ID: 'client-test', DANA_CHANNEL_ID: '95221', DANA_ORIGIN: 'http://localhost.test', DANA_STORE_ID: 'store-test', DANA_PRIVATE_KEY: danaKeys.privateKey, DANA_PUBLIC_KEY: danaKeys.publicKey },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  serverProcess.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const started = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 8000);
    serverProcess.stdout.on('data', (chunk) => {
      output += chunk.toString();
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
  if (danaServer) await new Promise((resolve) => danaServer.close(resolve));
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

test('checkout generates a transaction-specific dynamic QRIS and never uses a static merchant image', async () => {
  danaRequests = [];
  await fs.writeFile(path.join(tempDirectory, 'storefront.json'), JSON.stringify({ payment: { qrisImage: '/assets/uploads/legacy-static.png', instructions: 'Pindai QR statis' } }));
  const storefront = await request('/api/storefront');
  assert.equal(storefront.data.payment.provider, 'DANA QRIS dinamis');
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
  const generate = danaRequests.find((entry) => entry.path === '/v1.0/qr/qr-mpm-generate.htm');
  assert.ok(generate);
  assert.equal(generate.body.amount.value, '149000.00');
  assert.equal(generate.body.partnerReferenceNo, order.data.order.id);
  assert.equal(generate.headers['x-partner-id'], 'client-test');
  const timestamp = generate.headers['x-timestamp'];
  const digest = crypto.createHash('sha256').update(JSON.stringify(generate.body)).digest('hex');
  const signatureBase = `POST:/v1.0/qr/qr-mpm-generate.htm:${digest}:${timestamp}`;
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(signatureBase), danaPublicKey, Buffer.from(generate.headers['x-signature'], 'base64')), true);
  const staticConfirm = await request(`/api/admin/orders/${order.data.order.id}/confirm-payment`, { method: 'POST', cookie: adminCookie, body: { transactionReference: 'MANUAL-123' } });
  assert.equal(staticConfirm.response.status, 410);

  const finishedAt = new Date();
  const callbackTimestamp = `${new Date(finishedAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 19)}+07:00`;
  const callback = {
    originalPartnerReferenceNo: order.data.order.id,
    originalReferenceNo: 'DANA-FINISHED-001',
    merchantId: 'merchant-test',
    amount: { value: '149000.00', currency: 'IDR' },
    latestTransactionStatus: '00',
    createdTime: callbackTimestamp,
    finishedTime: callbackTimestamp,
  };
  const callbackRaw = JSON.stringify(callback);
  const callbackDigest = crypto.createHash('sha256').update(callbackRaw).digest('hex');
  const callbackText = `POST:/api/payments/dana/notify:${callbackDigest}:${callbackTimestamp}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(callbackText), danaPrivateKey).toString('base64');
  const notified = await request('/api/payments/dana/notify', { method: 'POST', body: callback, headers: { 'x-timestamp': callbackTimestamp, 'x-signature': signature } });
  assert.equal(notified.response.status, 200);
  assert.equal(notified.data.responseCode, '2005600');
  const paidOrder = await request(`/api/orders/${order.data.order.id}`, { cookie: buyerCookie });
  assert.equal(paidOrder.data.order.paymentStatus, 'paid');
});

test('verified paid bulk order permanently unlocks only its product reseller price', async () => {
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
  const query = danaRequests.find((entry) => entry.path === '/rest/v1.1/debit/status');
  const queryTimestamp = query.headers['x-timestamp'];
  const queryDigest = crypto.createHash('sha256').update(JSON.stringify(query.body)).digest('hex');
  const querySignatureBase = `POST:/rest/v1.1/debit/status:${queryDigest}:${queryTimestamp}`;
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(querySignatureBase), danaPublicKey, Buffer.from(query.headers['x-signature'], 'base64')), true);

  danaStatus = '00';
  const confirmed = await request(`/api/orders/${pendingOrder.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  danaStatus = '01';
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

  danaStatus = '00';
  const paid = await request(`/api/orders/${order.data.order.id}/check-payment`, { method: 'POST', cookie: buyerCookie, body: {} });
  danaStatus = '01';
  assert.equal(paid.response.status, 200);
  const session = await request('/api/auth/session', { cookie: buyerCookie });
  assert.equal(session.data.user.resellerPlan, true);
  const products = await request('/api/products', { cookie: buyerCookie });
  assert.equal(products.data.products.find((entry) => entry.id === 'bulk-item').priceContext, 'reseller');
});
