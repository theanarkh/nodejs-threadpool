const { defaultThreadPool } = require('../../src').threadPool;
const path = require('path');
async function test() {
    const work1 = await defaultThreadPool.submit('async function({a, b}) { return a + b; }', {a: 1, b: 1});
    work1.on('done',  function() {
        console.log(...arguments);
    })
    const work = await defaultThreadPool.submit(`async function(params) { return await new Promise((resolve) => {console.log(params); setTimeout(() => {resolve(1)}, 3000)})  }`, {name: 22}); 
    work.on('done', function() {
        console.log(...arguments);
    });
}

test()