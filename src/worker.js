const { parentPort } = require('worker_threads');
const vm = require('vm');
const { isFunction, isJSFile, isMJSFile } = require('./utils');

// 监听主线程提交过来的任务
parentPort.on('message', async (work) => {
    try {
        const { filename, options } = work;
        let aFunction;
        if (isJSFile(filename)) {
            aFunction = require(filename);
        } else if (isMJSFile(filename)) {
            const { default: entry } = await import(filename);
            aFunction = entry;
        } else {
            aFunction = vm.runInThisContext(`(${filename})`);
        }
        if (!isFunction(aFunction)) {
            throw new Error('work type error: js file or string');
        }
        work.data = await aFunction(options);
        parentPort.postMessage({event: 'done', work});
    } catch (error) {
        work.error = error.toString();
        parentPort.postMessage({event: 'error', work});
    }
});

process.on('uncaughtException', (...rest) => {
    console.error(...rest);
});

process.on('unhandledRejection', (...rest) => {
    console.error(...rest);
});