const threadPool = require('../../src').threadPool;
const path = require('path');
async function test() {
    const fixedThreadPool = new threadPool.FixedThreadPool({
        coreThreads: 1, 
        maxIdleTime: 10 * 1000,
        maxWork: 1,
        discardPolicy: 5
    });
    // const fixedThreadPool = new threadPool.CPUThreadPool({
    //     maxIdleTime: 10 * 1000,
    //     maxWork: 1,
    //     discardPolicy: 5
    // });
    const worker = await fixedThreadPool.submit(path.resolve(__dirname, 'event.js'));
    const worker2 = await fixedThreadPool.submit(path.resolve(__dirname, 'event.js'));
    worker.on('done', function() {
        console.log(...arguments)
    })

    worker.on('error', function() {
        console.log(...arguments)
    });

    worker2.on('done', function() {
        console.log(...arguments)
    })

    worker2.on('error', function() {
        console.log(...arguments)
    });
}

test()