const { defaultThreadPool } = require('../../src').threadPool;
const path = require('path');
async function test() {
    const worker = await defaultThreadPool.submit(path.resolve(__dirname, 'timeout.js'));
    worker.setTimeout(1000);
    worker.clearTimeout(); 
    worker.on('done', function() {
        console.log(...arguments);
    })
    
}

test()