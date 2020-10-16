const threadPool = require('../../src').threadPool;
const path = require('path');

async function test() {
    const MyThreadPool = new threadPool.SingleThreadPool({maxWork: 21, discardPolicy: 3});
    MyThreadPool.submit(path.resolve(__dirname, 'cancel.js'));
    const worker = await MyThreadPool.submit(path.resolve(__dirname, 'cancel.js'));
    // worker.setTimeout(5000);
    worker.on('done', function() {
        console.log(...arguments);
    });
    worker.on('cancel', function() {
        console.log('cancel');
    });
    MyThreadPool.submit(path.resolve(__dirname, 'cancel.js'));
}

test();