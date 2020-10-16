const { defaultSingleThreadPool, defaultFixedThreadPool } = require('../../src').threadPool;
const path = require('path');
defaultFixedThreadPool.submit(path.resolve(__dirname, 'sync_1.js'), {name: 1});

defaultSingleThreadPool.submit(path.resolve(__dirname, 'sync_2.js'), {name: 2}); 