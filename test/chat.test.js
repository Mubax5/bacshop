const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { before, after, test } = require('node:test');
const ChatTime = require('../assets/chat-time');

const root = path.resolve(__dirname, '..');
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ioAAAAASUVORK5CYII=';
let child, directory, base, admin, buyer, stranger, userId, product, imageUrl;

async function request(route, { method = 'GET', cookie, body, origin = base } = {}) {
  const response = await fetch(`${base}${route}`, { method, headers: {
    ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(method === 'POST' ? { origin } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), response };
}
function cookie(response) { return response.headers.get('set-cookie').split(';')[0]; }
function send(body, sender = buyer, route = '/api/chat/messages') {
  return request(route, { method: 'POST', cookie: sender, body: { clientMessageId: crypto.randomUUID(), ...body } });
}

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bacshop-chat-'));
  const probe = net.createServer().listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  await fs.copyFile(path.join(root, 'data/products.json'), path.join(directory, 'products.json'));
  child = spawn(process.execPath, ['server.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: {
    ...process.env, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
    BACSHOP_PUBLIC_ORIGIN: base, BACSHOP_COOKIE_SECURE: 'false', BACSHOP_DATA_DIR: directory,
    BACSHOP_PRODUCTS_FILE: path.join(directory, 'products.json'), BACSHOP_UPLOADS_DIR: path.join(directory, 'uploads'),
    DOKU_IS_PRODUCTION: 'false', MIDTRANS_IS_PRODUCTION: 'false',
  } });
  let output = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chat test server failed to start.')), 8000);
    child.stdout.on('data', chunk => { output += chunk; if (output.includes('Bacshop berjalan')) { clearTimeout(timer); resolve(); } });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Chat test server exited: ${code}`)); });
    child.stderr.on('data', () => {});
  });
  const setup = await request('/api/admin/setup', { method: 'POST', body: {
    code: output.match(/enter this one-time code:\s*\n([^\r\n]+)/)[1], email: 'admin@chat.test', password: 'StrongChatAdmin123!',
  } });
  assert.equal(setup.status, 201); admin = cookie(setup.response);
  for (const email of ['buyer@chat.test', 'stranger@chat.test']) {
    const result = await request('/api/auth/register', { method: 'POST', body: { name: email.split('@')[0], email, password: 'ChatBuyer123!' } });
    assert.equal(result.status, 201);
    if (!buyer) { buyer = cookie(result.response); userId = result.data.user.id; } else stranger = cookie(result.response);
  }
  product = (await request('/api/products', { cookie: buyer })).data.products[0];
  await fs.writeFile(path.join(directory, 'orders.json'), JSON.stringify([
    { id: 'CHAT-ORDER-1', userId, kind: 'products', total: 11000, items: [{ productId: product.id, name: 'Produk pesanan', quantity: 1, unitPrice: 5000, specifications: [{ name: 'Paket', label: 'Bulanan' }] }, { productId: product.id, name: 'Produk pesanan', quantity: 1, unitPrice: 6000, specifications: [{ name: 'Paket', label: 'Tahunan' }] }] },
    { id: 'CHAT-ORDER-OTHER', userId: 'another-user', kind: 'products', total: 5000, items: [] },
  ]));
});

after(async () => {
  if (child && child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
  if (directory) await fs.rm(directory, { recursive: true, force: true });
});

test('chat is private and viewing or drafting does not create a conversation', async () => {
  assert.equal((await request('/api/chat')).status, 401);
  assert.equal((await request('/api/admin/chat', { cookie: buyer })).status, 401);
  const empty = await request('/api/chat', { cookie: buyer });
  assert.deepEqual(empty.data.messages, []);
  assert.equal((await request('/api/admin/chat', { cookie: admin })).data.conversations.length, 0);
  await assert.rejects(fs.stat(path.join(directory, 'chat')), { code: 'ENOENT' });
  assert.equal((await send({ text: ' ' })).status, 400);
  assert.equal((await request('/api/chat/read', { method: 'POST', cookie: buyer, body: { sequence: 999 } })).status, 400);
});

test('messages use authoritative UTC timestamps and retries cannot duplicate messages', async () => {
  const clientMessageId = crypto.randomUUID();
  const start = Date.now();
  const sent = await send({ clientMessageId, text: '<script>alert(1)</script> Halo', sender: 'admin', createdAt: '2000-01-01T00:00:00+08:00' });
  assert.equal(sent.status, 201);
  assert.equal(sent.data.message.sender, 'customer');
  assert.match(sent.data.message.createdAt, /Z$/);
  assert.ok(Date.parse(sent.data.message.createdAt) >= start && Date.parse(sent.data.message.createdAt) <= Date.now());
  const retry = await send({ clientMessageId, text: 'Diubah saat retry' });
  assert.equal(retry.status, 200);
  assert.deepEqual(retry.data.message, sent.data.message);
  assert.equal((await request('/api/chat', { cookie: buyer })).data.messages.length, 1);
  assert.equal((await request('/api/chat', { cookie: stranger })).data.messages.length, 0);
  assert.equal((await request('/api/admin/chat', { cookie: admin })).data.unread, 1);
});

test('product and purchased-product attachments come from authorized server records', async () => {
  const attached = await send({ context: { productId: product.id, name: 'Fake name', price: 1 } });
  assert.equal(attached.status, 201);
  assert.equal(attached.data.message.context.name, product.name);
  assert.equal(attached.data.message.context.price, product.price);
  const order = await send({ context: { orderId: 'CHAT-ORDER-1', productId: product.id } });
  assert.equal(order.status, 201);
  assert.equal(order.data.message.context.name, 'Produk pesanan');
  assert.equal(order.data.message.context.price, 5000);
  assert.equal(order.data.message.context.specifications, 'Paket: Bulanan');
  const secondVariant = await send({ context: { orderId: 'CHAT-ORDER-1', productId: product.id, itemIndex: 1 } });
  assert.equal(secondVariant.status, 201);
  assert.equal(secondVariant.data.message.context.specifications, 'Paket: Tahunan');
  assert.equal(secondVariant.data.message.context.price, 6000);
  assert.equal((await send({ context: { orderId: 'CHAT-ORDER-1', productId: 'wrong', itemIndex: 1 } })).status, 400);
  assert.equal((await send({ context: { orderId: 'CHAT-ORDER-1', itemIndex: 10 } })).status, 400);
  assert.equal((await send({ context: { orderId: 'CHAT-ORDER-OTHER' } })).status, 404);
  assert.equal((await send({ context: { orderId: 'CHAT-ORDER-1', productId: 'missing' } })).status, 400);
  assert.equal((await send({ context: { productId: 'missing' } })).status, 404);
  assert.equal((await send({ context: { orderId: 'CHAT-ORDER-1' } }, stranger)).status, 404);
});

test('images are authenticated, persistent, and inaccessible to other customers or public static URLs', async () => {
  const sent = await send({ images: [{ mimeType: 'image/png', data: png }] });
  assert.equal(sent.status, 201);
  imageUrl = sent.data.message.images[0].url;
  for (const owner of [buyer, admin]) {
    const response = await fetch(`${base}${imageUrl}`, { headers: { cookie: owner } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(png, 'base64'));
  }
  assert.equal((await fetch(`${base}${imageUrl}`)).status, 401);
  assert.equal((await fetch(`${base}${imageUrl}`, { headers: { cookie: stranger } })).status, 404);
  assert.equal((await fetch(`${base}/.bacshop-private/chat/images/${sent.data.message.images[0].file}`)).status, 404);
  assert.equal((await fs.readdir(path.join(directory, 'uploads'))).length, 0);
  const files = (await fs.readdir(path.join(directory, 'chat'))).filter(file => file.endsWith('.json'));
  const stored = JSON.parse(await fs.readFile(path.join(directory, 'chat', files[0]), 'utf8'));
  assert.ok(stored.messages.some(message => message.id === sent.data.message.id));
});

test('invalid attachments, limits, forged context, and cross-origin sends are rejected before writing', async () => {
  const original = (await request('/api/chat', { cookie: buyer })).data.messages.length;
  assert.equal((await send({ images: [{ mimeType: 'image/png', data: Buffer.from('<svg onload="alert(1)">').toString('base64') }] })).status, 400);
  assert.equal((await send({ images: [{ mimeType: 'image/svg+xml', data: png }] })).status, 400);
  assert.equal((await send({ images: new Array(4).fill({ mimeType: 'image/png', data: png }) })).status, 400);
  assert.equal((await send({ text: 'x'.repeat(4001) })).status, 400);
  assert.equal((await send({ images: 'invalid' })).status, 400);
  assert.equal((await request('/api/chat/messages', { method: 'POST', cookie: buyer, body: null })).status, 400);
  assert.equal((await request('/api/chat/messages', { method: 'POST', cookie: buyer, origin: 'https://evil.example', body: { clientMessageId: crypto.randomUUID(), text: 'CSRF' } })).status, 403);
  assert.equal((await request('/api/chat', { cookie: buyer })).data.messages.length, original);
});

test('admin replies and read acknowledgements use sequence numbers and remain isolated', async () => {
  const route = `/api/admin/chat/${userId}`;
  const existing = (await request(route, { cookie: admin })).data;
  assert.equal((await request(`${route}/read`, { method: 'POST', cookie: admin, body: { sequence: existing.messages.at(-1).sequence } })).data.unread, 0);
  const sent = await send({ text: 'Bisa, paketnya tersedia.' }, admin, `${route}/messages`);
  assert.equal(sent.status, 201);
  assert.equal(sent.data.message.sender, 'admin');
  assert.equal((await request('/api/chat/unread', { cookie: buyer })).data.unread, 1);
  assert.equal((await request(route, { cookie: stranger })).status, 401);
  assert.equal((await request('/api/chat/read', { method: 'POST', cookie: buyer, body: { sequence: sent.data.message.sequence } })).data.unread, 0);
  assert.equal((await request(route, { cookie: admin })).data.otherRead, sent.data.message.sequence);
  assert.equal((await request('/api/chat/read', { method: 'POST', cookie: buyer, body: { sequence: 1 } })).data.unread, 0);
  assert.equal((await request(route, { cookie: admin })).data.otherRead, sent.data.message.sequence);
  const list = JSON.stringify((await request('/api/admin/chat', { cookie: admin })).data);
  assert.doesNotMatch(list, /password|salt|hash|ChatBuyer123/);
});

test('history is paginated without reordering equal-second messages and sending is rate limited', async () => {
  const threadPath = path.join(directory, 'chat', `${crypto.createHash('sha256').update(userId).digest('hex')}.json`);
  const thread = JSON.parse(await fs.readFile(threadPath, 'utf8'));
  const time = new Date().toISOString();
  for (let sequence = thread.messages.length + 1; sequence <= 105; sequence++) thread.messages.push({ id: crypto.randomUUID(), clientMessageId: crypto.randomUUID(), sequence, sender: 'admin', text: `Pesan ${sequence}`, images: [], context: null, createdAt: time });
  await fs.writeFile(threadPath, JSON.stringify(thread));
  const page = (await request('/api/chat', { cookie: buyer })).data;
  assert.equal(page.messages.length, 50); assert.equal(page.oldestSequence, 56); assert.equal(page.hasMore, true);
  const older = (await request('/api/chat?before=56', { cookie: buyer })).data;
  assert.equal(older.oldestSequence, 6); assert.equal(older.messages.at(-1).sequence, 55);
  const first = (await request('/api/chat?before=6', { cookie: buyer })).data;
  assert.equal(first.messages.length, 5); assert.equal(first.hasMore, false);
  assert.equal((await request('/api/chat?before=garbage', { cookie: buyer })).status, 400);
  let limited = false;
  for (let index = 0; index < 31; index++) if ((await send({ text: `Burst ${index}` })).status === 429) { limited = true; break; }
  assert.equal(limited, true);
});

test('each device formats UTC instants in its own timezone, including local midnight', () => {
  const modulePath = path.join(root, 'assets/chat-time.js');
  const code = `const t=require(${JSON.stringify(modulePath)});process.stdout.write(JSON.stringify(['2026-10-08T16:59:59Z','2026-10-08T17:00:01Z'].map(d=>({clock:t.clock(d),day:t.dayKey(d)}))));`;
  const format = TZ => JSON.parse(execFileSync(process.execPath, ['-e', code], { env: { ...process.env, TZ } }));
  assert.deepEqual(format('Asia/Jakarta'), [{ clock: '23.59', day: '2026-10-8' }, { clock: '00.00', day: '2026-10-9' }]);
  assert.deepEqual(format('Asia/Makassar'), [{ clock: '00.59', day: '2026-10-9' }, { clock: '01.00', day: '2026-10-9' }]);
  const simultaneous = format('Asia/Jakarta');
  assert.equal(simultaneous[1].clock, '00.00');
});

test('day dividers render only sent messages, once per local day, and escape text', async () => {
  const source = await fs.readFile(path.join(root, 'app.js'), 'utf8');
  const functions = source.slice(source.indexOf('  function chatContextMarkup('), source.indexOf('  function chatInboxMarkup('));
  const sandbox = { ChatTime, chatView: null, feather: () => '', rupiah: String, escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;') };
  vm.createContext(sandbox); vm.runInContext(functions, sandbox);
  const render = messages => sandbox.chatMessagesMarkup({ side: 'customer', page: { messages, otherRead: 0, hasMore: false } });
  assert.doesNotMatch(render([]), /chat-day/);
  const messages = [
    { sequence: 1, createdAt: '2026-10-08T08:00:00Z', sender: 'customer', images: [], text: '<img onerror="bad()">' },
    { sequence: 2, createdAt: '2026-10-08T08:00:00Z', sender: 'admin', images: [], text: 'Balasan' },
    { sequence: 3, createdAt: '2026-10-09T08:00:00Z', sender: 'customer', images: [], text: 'Hari baru' },
  ];
  const html = render(messages);
  assert.equal((html.match(/class="chat-day"/g) || []).length, 2);
  assert.doesNotMatch(html, /<img onerror=/);
  assert.ok(html.indexOf('chat-day') < html.indexOf('data-chat-sequence="1"'));
  assert.match(html, /datetime="2026-10-08T08:00:00Z"/);
  assert.match(source, /event\.isComposing/);
  assert.match(source, /panel\.addEventListener\('paste'/);
  assert.match(source, /panel\.addEventListener\('drop'/);
});
