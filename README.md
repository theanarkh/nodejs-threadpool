# nodejs-threadpool
基于nodejs worker_threads的线程池。耗时操作或nodejs没有提供异步模式的api（例如解密、同步的文件api）都可以在线程池中执行，业务代码只需要返回一个Promise或async函数给线程池库，至于业务逻辑做什么操作，其实都可以，比如setTimeout，异步操作，async await等。

支持文件和字符串模式，需要导出一个函数。

1 提供的线程池类型
```cpp
// 同步处理任务
class ThreadPool extends ThreadPool {
    constructor(options) {
        super({...options, sync: true});
    }
}
// cpu型的线程池，线程数和cpu核数一样，不支持动态扩容
class CPUThreadPool extends ThreadPool {
    constructor(options) {
        super({...options, coreThreads: cores, expansion: false});
    }
}
// 只有一个线程的线程池，不支持动态扩容
class SingleThreadPool extends ThreadPool {
    constructor(options) {
        super({...options, coreThreads: 1, expansion: false });
    }
}
// 固定线程数的线程池，不支持动态扩容线程数
class FixedThreadPool extends ThreadPool {
    constructor(options) {
        super({ ...options, expansion: false });
    }
}

const defaultThreadPool = new ThreadPool();
const defaultCpuThreadPool = new CPUThreadPool();
const defaultFixedThreadPool = new FixedThreadPool();
const defaultSingleThreadPool = new SingleThreadPool();
module.exports = {
    ThreadPool,
    CPUThreadPool,
    FixedThreadPool,
    SingleThreadPool,
    defaultThreadPool, 
    defaultCpuThreadPool,
    defaultFixedThreadPool,
    defaultSingleThreadPool,
}
```
2 用户可以自定义线程池类型和参数
```cpp
1 coreThreads：核心线程数，默认10个
2 maxThreads：最大线程数，默认50，只在支持动态扩容的情况下，该参数有效，否则该参数等于核心线程数
3 timeout：任务执行的超时时间，全局配置，可针对单个任务设置
4 discardPolicy：任务超过阈值时的处理策略，策略如下
 	// 报错
    ABORT: 1,
    // 在主线程里执行
    CALLER_RUN: 2,
    // 丢弃最老的的任务
    DISCARD_OLDEST: 3,
    // 丢弃
    DISCARD: 4,
    // 不丢弃
    NOT_DISCARD: 5,
5 preCreate：是否预创建线程池
6 maxIdleTime：线程空闲多久后自动退出
7 maxWork：线程池最大任务数 
8 expansion：是否支持动态扩容线程，阈值是最大线程数
```
3 线程池给用户侧返回的是UserWork类的对象
支持的api
```cpp
设置任务的超时时间
setTimeout
// 取消之前的超时时间设置
clearTimeout
// 取消任务的执行
cancel
```
UserWork类继承EventEmitter
支持的事件有
```cpp
// 任务超时
timeout
// 任务执行完成，执行结果由用户的业务代码决定，在回调里可以拿到
done
// 任务执行出错，具体原因在回调里可以拿到
error
// 任务过载，当前任务被取消
```
4 使用
例子1
index.js
```cpp
const { defaultThreadPool } = require('nodejs-thread-pool').threadPool;
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
```
event.js

```cpp
module.exports = async function() {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({type: 'async event'});
            console.log(1)
        },3000)
    })
} 
```
例子2
```
const { defaultThreadPool } = require('nodejs-thread-pool').threadPool;
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
```
