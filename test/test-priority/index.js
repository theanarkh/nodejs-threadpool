const { threadPool, constants } = require('../../src');
const { defaultSingleThreadPool } = threadPool;
const path = require('path');
function test() {
    defaultSingleThreadPool.submit(path.resolve(__dirname, 'priority1.js'));
    defaultSingleThreadPool.submit(path.resolve(__dirname, 'priority3.js'));
    defaultSingleThreadPool.submit(path.resolve(__dirname, 'priority2.js'), {priority: constants.PRIORITY.IMPORTANT});
}
test();