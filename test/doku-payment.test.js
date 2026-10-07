'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { before, after, test } = require('node:test');

const root = path.resolve(__dirname, '..');
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const clientId = 'MCH-test-doku';
const secret = 'test-doku-secret-never-log';
const token = 'test-access-token';
let provider, app, baseUrl, directory, cookie, adminCookie, output = '';
const transactions = new Map();
const requests = [];
let generateMode = '', queryOverride = null;

async function request(route, { method = 'GET', body, userCookie = cookie, headers = {}, raw } = {}) {
  const response = await fetch(baseUrl + route, {
    method, headers: { ...(method === 'GET' ? {} : { origin: baseUrl, 'content-type': 'application/json' }),
      ...(userCookie ? { cookie: userCookie } : {}), ...headers },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  return { status: response.status, data: await response.json() };
}

async function newOrder(body = { kind: 'reseller-plan' }) {
  const registered = await fetch(baseUrl + '/api/auth/register', { method: 'POST',
    headers: { origin: baseUrl, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Payment Buyer', email: crypto.randomUUID() + '@example.test', password: 'BuyerPass123!' }) });
  assert.equal(registered.status, 201);
  cookie = registered.headers.get('set-cookie').split(';')[0];
  const result = await request('/api/orders', { method: 'POST', body });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  assert.equal(result.data.order.paymentProvider, 'doku_qris_snap');
  return result.data.order;
}

async function createQr(order) {
  return request(`/api/orders/${order.id}/create-qris`, { method: 'POST', body: {} });
}

async function check(order) {
  return request(`/api/orders/${order.id}/check-payment`, { method: 'POST', body: {} });
}

async function changeStored(order, changes) {
  const filename = path.join(directory, 'orders.json');
  const orders = JSON.parse(await fs.readFile(filename, 'utf8'));
  Object.assign(orders.find(entry => entry.id === order.id), changes);
  await fs.writeFile(filename, JSON.stringify(orders));
}

async function notify(order, { signature = true, amount = order.total, status = 'SUCCESS', rawFormat = false } = {}) {
  const body = { service: { id: 'QRIS' }, channel: { id: 'QRIS_DOKU' },
    order: { invoice_number: order.id, amount }, transaction: { status }, additional_info: { origin: { apiFormat: 'SNAP' } } };
  const raw = JSON.stringify(body, null, rawFormat ? 2 : undefined);
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const digest = crypto.createHash('sha256').update(raw).digest('base64');
  const components = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:/api/payments/doku/notify\nDigest:${digest}`;
  const signed = 'HMACSHA256=' + crypto.createHmac('sha256', secret).update(components).digest('base64');
  return request('/api/payments/doku/notify', { method: 'POST', raw,
    headers: { 'Client-Id': clientId, 'Request-Id': requestId, 'Request-Timestamp': timestamp, Signature: signature ? signed : 'HMACSHA256=invalid' } });
}

before(async () => {
  provider = http.createServer(async (req, res) => {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      requests.push({ path: req.url, headers: req.headers, body });
      res.setHeader('content-type', 'application/json');
      const timestamp = req.headers['x-timestamp'];
      assert.ok(Number.isFinite(Date.parse(timestamp)));
      if (req.url === '/authorization/v1/access-token/b2b') {
        assert.equal(req.headers['x-client-key'], clientId);
        assert.equal(body.grantType, 'client_credentials');
        assert.equal(crypto.verify('RSA-SHA256', Buffer.from(`${clientId}|${timestamp}`), keys.publicKey, Buffer.from(req.headers['x-signature'], 'base64')), true);
        return res.end(JSON.stringify({ responseCode: '2007300', accessToken: token, tokenType: 'Bearer', expiresIn: 900 }));
      }
      assert.equal(req.headers.authorization, 'Bearer ' + token);
      assert.equal(req.headers['x-partner-id'], clientId);
      assert.match(req.headers['x-external-id'], /^\d+$/);
      assert.equal(req.headers['channel-id'], 'H2H');
      const digest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
      const expected = crypto.createHmac('sha512', secret).update(`POST:${req.url}:${token}:${digest}:${timestamp}`).digest('base64');
      assert.equal(req.headers['x-signature'], expected);
      assert.equal(body.merchantId, 'mall-test');
      if (req.url.endsWith('/qr-mpm-generate')) {
        if (generateMode === 'reject') {
          res.statusCode = 400;
          return res.end(JSON.stringify({ responseCode: '4004700', responseMessage: 'never-print-provider-private-data' }));
        }
        assert.equal(body.terminalId, 'BACS001');
        assert.deepEqual(body.additionalInfo, { postalCode: '12345', feeType: '1' });
        assert.equal(body.amount.currency, 'IDR');
        assert.match(body.amount.value, /^\d+\.00$/);
        assert.ok(Date.parse(body.validityPeriod) > Date.now());
        assert.ok(Date.parse(body.validityPeriod) <= Date.now() + 30 * 60000);
        const transaction = { reference: 'DOKU-' + body.partnerReferenceNo, amount: body.amount, status: '03' };
        transactions.set(body.partnerReferenceNo, transaction);
        if (generateMode === 'drop') { req.socket.destroy(); return; }
        return res.end(JSON.stringify({ responseCode: '2004700', referenceNo: transaction.reference,
          partnerReferenceNo: generateMode === 'mismatch' ? 'OTHER' : body.partnerReferenceNo,
          qrContent: '000201010212' + body.partnerReferenceNo + '6304ABCD', additionalInfo: { validityPeriod: body.validityPeriod } }));
      }
      const transaction = transactions.get(body.originalPartnerReferenceNo);
      assert.ok(transaction);
      assert.equal(body.originalReferenceNo, transaction.reference);
      if (req.url.endsWith('/qr-mpm-query')) {
        assert.equal(body.serviceCode, '47');
        return res.end(JSON.stringify({ responseCode: '2005100', originalPartnerReferenceNo: body.originalPartnerReferenceNo,
          originalReferenceNo: transaction.reference, serviceCode: '47', amount: transaction.amount,
          latestTransactionStatus: transaction.status, additionalInfo: { approvalCode: 'APPROVED' }, ...queryOverride }));
      }
      if (req.url.endsWith('/qr-mpm-refund')) {
        assert.equal(body.additionalInfo.approvalCode, 'APPROVED');
        assert.deepEqual(body.refundAmount, transaction.amount);
        transaction.status = '04';
        return res.end(JSON.stringify({ responseCode: '2007800', originalReferenceNo: transaction.reference,
          originalPartnerReferenceNo: body.originalPartnerReferenceNo, partnerRefundNo: body.partnerRefundNo,
          refundNo: 'REFUND-' + body.originalPartnerReferenceNo, refundAmount: body.refundAmount }));
      }
      throw new Error('Unexpected provider request');
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ responseCode: '5000000', responseMessage: error.message }));
    }
  });
  provider.listen(0, '127.0.0.1');
  await once(provider, 'listening');
  const probe = http.createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bacshop-doku-'));
  await fs.copyFile(path.join(root, 'data/products.json'), path.join(directory, 'products.json'));
  const env = { ...process.env, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port), BACSHOP_PUBLIC_ORIGIN: baseUrl,
    BACSHOP_DATA_DIR: directory, BACSHOP_PRODUCTS_FILE: path.join(directory, 'products.json'), BACSHOP_UPLOADS_DIR: path.join(directory, 'uploads'),
    BACSHOP_COOKIE_SECURE: 'false', BACSHOP_ADMIN_SETUP_CODE: 'test-admin-setup-code-123456789012345',
    DOKU_API_BASE_URL: `http://127.0.0.1:${provider.address().port}`, DOKU_IS_PRODUCTION: 'false',
    DOKU_CLIENT_ID: clientId, DOKU_CLIENT_SECRET: secret, DOKU_MERCHANT_ID: 'mall-test', DOKU_TERMINAL_ID: 'BACS001', DOKU_POSTAL_CODE: '12345',
    DOKU_PRIVATE_KEY_BASE64: Buffer.from(keys.privateKey.export({ format: 'pem', type: 'pkcs8' })).toString('base64'),
    MIDTRANS_IS_PRODUCTION: 'false', MIDTRANS_SERVER_KEY: 'test-only', MIDTRANS_MERCHANT_ID: 'legacy-test',
  };
  app = spawn(process.execPath, ['server.js'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  app.stdout.on('data', chunk => { output += chunk; }); app.stderr.on('data', chunk => { output += chunk; });
  for (let i = 0; i < 100; i++) {
    if (output.includes('Bacshop berjalan')) break;
    if (app.exitCode !== null) throw new Error('Test server exited: ' + output);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.match(output, /Bacshop berjalan/);
  const registered = await fetch(baseUrl + '/api/auth/register', { method: 'POST',
    headers: { origin: baseUrl, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Doku Buyer', email: 'doku@example.test', password: 'BuyerPass123!' }) });
  assert.equal(registered.status, 201);
  cookie = registered.headers.get('set-cookie').split(';')[0];
  const admin = await fetch(baseUrl + '/api/admin/setup', { method: 'POST', headers: { origin: baseUrl, 'content-type': 'application/json' },
    body: JSON.stringify({ code: env.BACSHOP_ADMIN_SETUP_CODE, email: 'admin@example.test', password: 'AdminPassword123!' }) });
  assert.equal(admin.status, 201); adminCookie = admin.headers.get('set-cookie').split(';')[0];
});

after(async () => {
  if (app?.exitCode === null) { app.kill(); await once(app, 'exit'); }
  if (provider) await new Promise(resolve => provider.close(resolve));
  if (directory) await fs.rm(directory, { recursive: true, force: true });
});

test('DOKU confirms orders before QR generation and signs all requests server-side', async () => {
  const beforeCount = requests.length;
  const order = await newOrder();
  assert.equal(requests.length, beforeCount);
  assert.equal(order.paymentInitialized, false);
  const result = await createQr(order);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.match(result.data.order.qrisImage, /^data:image\/png;base64,/);
  assert.equal(result.data.order.paymentStatus, 'pending');
  for (const field of ['dokuReferenceNo', 'dokuExternalId', 'dokuMerchantId', 'paymentQrString', 'dokuGenerationUncertain']) assert.equal(field in result.data.order, false);
  const generate = requests.find(entry => entry.path.endsWith('/qr-mpm-generate'));
  assert.deepEqual(generate.body.amount, { value: '149000.00', currency: 'IDR' });
  await createQr(order);
  assert.equal(requests.filter(entry => entry.path.endsWith('/qr-mpm-generate')).length, 1);
  assert.equal(requests.filter(entry => entry.path.includes('/access-token/')).length, 1);
  const health = await request('/api/health');
  assert.deepEqual(health.data, { status: 'ok', paymentProvider: 'DOKU', paymentConfigured: true });
  assert.doesNotMatch(JSON.stringify(result.data) + output, new RegExp(secret));
});

test('forged and mismatched notifications cannot pay an order; signed callback still requires provider confirmation', async () => {
  const order = await newOrder(); await createQr(order);
  assert.equal((await notify(order, { signature: false })).status, 401);
  assert.equal((await notify(order, { amount: order.total + 1 })).status, 404);
  assert.equal((await notify(order)).status, 200);
  assert.equal((await request(`/api/orders/${order.id}`)).data.order.paymentStatus, 'pending');
  transactions.get(order.id).status = '00';
  queryOverride = { originalReferenceNo: 'OTHER' };
  assert.equal((await notify(order)).status, 502);
  queryOverride = { amount: { value: '1.00', currency: 'IDR' } };
  assert.equal((await check(order)).status, 502);
  queryOverride = null;
  assert.equal((await notify(order, { rawFormat: true })).status, 200);
  assert.equal((await request(`/api/orders/${order.id}`)).data.order.paymentStatus, 'paid');
  assert.equal((await notify(order)).status, 200);
  assert.equal((await request('/api/auth/session')).data.user.resellerPlan, true);
});

test('a signed failed callback does not cancel a transaction the provider still reports pending', async () => {
  const order = await newOrder(); await createQr(order);
  await notify(order, { status: 'FAILED' });
  assert.equal((await request(`/api/orders/${order.id}`)).data.order.paymentStatus, 'pending');
  transactions.get(order.id).status = '06';
  await notify(order, { status: 'FAILED' });
  assert.equal((await request(`/api/orders/${order.id}`)).data.order.paymentStatus, 'cancelled');
});

test('verified late DOKU settlement repairs a locally cancelled order', async () => {
  const order = await newOrder(); await createQr(order);
  await changeStored(order, { paymentStatus: 'cancelled', status: 'cancelled' });
  transactions.get(order.id).status = '00';
  assert.equal((await check(order)).data.order.paymentStatus, 'paid');
});

test('expired and cancelled QR images are not returned as payable', async () => {
  const order = await newOrder(); await createQr(order);
  await changeStored(order, { paymentExpiresAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal((await createQr(order)).status, 409);
  assert.equal((await createQr(order)).status, 409);
  transactions.get(order.id).status = '00';
  assert.equal((await notify(order)).status, 200);
});

test('lost or mismatched QR generation responses cannot create a second charge on retry', async () => {
  for (const mode of ['drop', 'mismatch']) {
    generateMode = mode;
    const order = await newOrder();
    assert.equal((await createQr(order)).status, 502);
    generateMode = '';
    assert.equal((await createQr(order)).status, 409);
    assert.equal(requests.filter(entry => entry.body.partnerReferenceNo === order.id).length, 1);
    assert.equal((await request(`/api/orders/${order.id}`)).data.order.qrisImage, undefined);
  }
});

test('explicit DOKU rejection preserves the order and allows a corrected retry without logging secrets', async () => {
  const order = await newOrder(); generateMode = 'reject';
  assert.equal((await createQr(order)).status, 502);
  generateMode = '';
  assert.equal((await createQr(order)).status, 200);
  assert.doesNotMatch(output, /never-print-provider-private-data|test-doku-secret-never-log/);
});

test('DOKU refunds stay pending until query confirms full refund; retry does not issue another refund', async () => {
  const order = await newOrder(); await createQr(order); transactions.get(order.id).status = '00'; await check(order);
  const route = `/api/admin/orders/${order.id}/refund`;
  const options = { method: 'POST', userCookie: adminCookie, body: { reason: 'Pengujian refund penuh.' } };
  const refund = await request(route, options);
  assert.equal(refund.status, 202, JSON.stringify(refund.data));
  assert.equal(refund.data.order.paymentStatus, 'paid');
  assert.equal(refund.data.refundConfirmed, false);
  const count = requests.filter(entry => entry.path.endsWith('/qr-mpm-refund')).length;
  const retry = await request(route, options);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.order.paymentStatus, 'refunded');
  assert.equal(retry.data.refundConfirmed, true);
  assert.equal(requests.filter(entry => entry.path.endsWith('/qr-mpm-refund')).length, count);
});
