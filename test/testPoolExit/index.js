const { defaultThreadPool } = require('../../src').threadPool;

async function test() {
    await defaultThreadPool.submit('function() { while(1) {} }');
    defaultThreadPool.unref();
    //defaultThreadPool.stop();
    // work1.on('done',  function() {
    //     console.log(...arguments);
    //     defaultThreadPool.unref();
    // });
}

test()