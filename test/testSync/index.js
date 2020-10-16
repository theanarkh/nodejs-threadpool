const { defaultThreadPool } = require('../../src').threadPool;
const path = require('path');
function test() {
    defaultThreadPool.submit(path.resolve(__dirname, 'sync_1.js'), {name: 11});

    defaultThreadPool.submit(path.resolve(__dirname, 'sync_2.js'), {name: 22}); 
}

test()