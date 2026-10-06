'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, test } = require('node:test');
const { initializePersistentData } = require('../deploy/azure-startup');

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bacshop-azure-startup-'));
  temporaryDirectories.push(directory);
  const sourceFile = path.join(directory, 'source-products.json');
  const dataDirectory = path.join(directory, 'persistent');
  fs.writeFileSync(sourceFile, '[{"id":"starter"}]');
  return { sourceFile, dataDirectory };
}

test('Azure startup seeds the catalog once and keeps edits across restarts', () => {
  const { sourceFile, dataDirectory } = fixture();
  const productsFile = initializePersistentData({ sourceFile, dataDirectory });
  assert.equal(fs.readFileSync(productsFile, 'utf8'), '[{"id":"starter"}]');

  fs.writeFileSync(productsFile, '[{"id":"admin-edited"}]');
  initializePersistentData({ sourceFile, dataDirectory });
  assert.equal(fs.readFileSync(productsFile, 'utf8'), '[{"id":"admin-edited"}]');
});

test('Azure startup does not silently restore a catalog deleted after first initialization', () => {
  const { sourceFile, dataDirectory } = fixture();
  const productsFile = initializePersistentData({ sourceFile, dataDirectory });
  fs.unlinkSync(productsFile);

  initializePersistentData({ sourceFile, dataDirectory });
  assert.equal(fs.existsSync(productsFile), false);
});
