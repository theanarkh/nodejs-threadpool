const { defaultThreadPool } = require('../../src').threadPool;
const path = require('path');
function test() {
    defaultThreadPool.submit(path.resolve(__dirname, 'work.mjs'));
}
test()