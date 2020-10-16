const { defaultThreadPool } = require('../../src').threadPool;
const path = require('path');
async function test() {
    const worker = await defaultThreadPool.submit(path.resolve(__dirname, 'event.js'));
    worker.on('done', function() {
        console.log(...arguments)
    })

    worker.on('error', function() {
        console.log(...arguments)
    })
}

test()