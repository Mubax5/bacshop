'use strict';

const fs = require('node:fs');
const path = require('node:path');

function initializePersistentData({ sourceFile, dataDirectory }) {
  const productsFile = path.join(dataDirectory, 'products.json');
  const initializedFile = path.join(dataDirectory, '.bacshop-initialized');

  fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(initializedFile)) {
    if (!fs.existsSync(productsFile)) {
      fs.copyFileSync(sourceFile, productsFile, fs.constants.COPYFILE_EXCL);
    }
    try {
      fs.writeFileSync(initializedFile, 'Bacshop persistent storage initialized.\n', { flag: 'wx', mode: 0o600 });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  return productsFile;
}

function start() {
  const dataDirectory = process.env.BACSHOP_AZURE_DATA_ROOT || '/home/bacshop-data';
  process.env.HOST ||= '0.0.0.0';
  process.env.BACSHOP_DATA_DIR ||= path.join(dataDirectory, 'private');
  process.env.BACSHOP_PRODUCTS_FILE ||= path.join(dataDirectory, 'products.json');
  process.env.BACSHOP_UPLOADS_DIR ||= path.join(dataDirectory, 'uploads');

  initializePersistentData({
    sourceFile: path.resolve(__dirname, '..', 'data', 'products.json'),
    dataDirectory,
  });
  require('../server');
}

if (require.main === module) start();

module.exports = { initializePersistentData };
