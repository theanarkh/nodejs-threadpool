const { Worker, threadId } = require('worker_threads');
const path = require('path');
const vm = require('vm');
const { EventEmitter } = require('events');
const os = require('os');
const { Work } = require('./work');
const { DISCARD_POLICY, THREAD_STATE, WORK_STATE } = require('./constants');
const config = require('./config');
const cores = os.cpus().length;
const  { isFunction, isJSFile, isMJSFile } = require('./utils');
const workerPath = path.resolve(__dirname, 'worker.js');

// 提供给用户侧的接口
class UserWork extends EventEmitter {
    constructor({ workId }) {
        super();
        // 任务id
        this.workId = workId;
        // 支持超时取消任务
        this.timer = null;
        // 任务状态
        this.state = WORK_STATE.PENDDING;
    }
    // 超时后取消任务
    setTimeout(timeout) {
        this.timer = setTimeout(() => {
            this.timer && this.cancel() && this.emit('timeout');
        }, ~~timeout);
    }
    // 取消之前设置的定时器
    clearTimeout() {
        clearTimeout(this.timer);
        this.timer = null;
    }
    // 直接取消任务，如果执行完了就不能取消了，this.terminate是动态设置的
    cancel() {
        if (this.state === WORK_STATE.END || this.state === WORK_STATE.CANCELED) {
           return false;
        } else {
            this.terminate();
            return true;
        }
    }
    // 修改任务状态
    setState(state) {
        this.state = state;
    }
}

// 管理子线程的数据结构
class Thread {
    constructor({ worker }) {
        // nodejs的Worker对象，nodejs的worker_threads模块的Worker
        this.worker = worker;
        this.threadId = worker.threadId;
        // 线程状态
        this.state = THREAD_STATE.IDLE;
        // 上次工作的时间
        this.lastWorkTime = Date.now();
    }
    // 修改线程状态
    setState(state) {
        this.state = state;
    }
    // 修改线程最后工作时间
    setLastWorkTime(time) {
        this.lastWorkTime = time;
    }
}

// 线程池基类
class ThreadPool {
    constructor(options = {}) {
        this.options = options;
        // 子线程队列
        this.workerQueue = [];
        // 核心线程数
        this.coreThreads = ~~options.coreThreads || config.CORE_THREADS;
        // 线程池最大线程数，如果不支持动态扩容则最大线程数等于核心线程数
        this.maxThreads = options.expansion !== false ? Math.max(this.coreThreads, config.MAX_THREADS) : this.coreThreads;
        // 超过任务队列长度时的处理策略
        this.discardPolicy = options.discardPolicy ? options.discardPolicy : DISCARD_POLICY.NOT_DISCARD;
        // 是否预创建子线程
        this.preCreate = options.preCreate === true;
        // 线程最大空闲时间，达到后自动退出
        this.maxIdleTime = ~~options.maxIdleTime || config.MAX_IDLE_TIME;
        // 是否预创建线程池
        this.preCreate && this.preCreateThreads();
        // 保存线程池中任务对应的UserWork
        this.workPool = {};
        // 线程池中当前可用的任务id，每次有新任务时自增1
        this.workId = 0;
        // 线程池中的任务队列
        this.queue = [];
        // 线程池总任务数
        this.totalWork = 0;
        // 支持的最大任务数
        this.maxWork = ~~options.maxWork || config.MAX_WORK;
        // 处理任务的超时时间，全局配置
        this.timeout = ~~options.timeout;
        this.pollIdle();
    }
    // 支持空闲退出
    pollIdle() {
        const timer = setTimeout(() => {
            for (let i = 0; i < this.workerQueue.length; i++) {
                const node = this.workerQueue[i];
                if (node.state === THREAD_STATE.IDLE && Date.now() - node.lastWorkTime > this.maxIdleTime) {
                    node.worker.terminate();
                }
            }
            this.pollIdle();
        }, 1000);
        timer.unref();
    }
    // 预创建线程池，数量等于核心线程数
    preCreateThreads() {
        let { coreThreads } = this;
        while(coreThreads--) {
            this.newThread();
        }
    }
    // 创建线程
    newThread() {
        const worker = new Worker(workerPath);
        const thread = new Thread({worker});
        this.workerQueue.push(thread);
        const threadId = worker.threadId;
        worker.on('exit', () => {
            // 找到该线程对应的数据结构，然后删除该线程的数据结构
            const position = this.workerQueue.findIndex((thread) => {
                return thread.threadId === threadId;
            });
            const exitedThreadArray = this.workerQueue.splice(position, 1);
            const exitedThread = exitedThreadArray[0]
            // 退出时状态是BUSY说明还在处理任务（非正常退出）
            this.totalWork -= exitedThread.state === THREAD_STATE.BUSY ? 1 : 0;
        });
        // 和子线程通信
        worker.on('message', (result) => {
            const {
                work,
                event,
            } = result;
            const { data, error, workId } = work;
            // 通过workId拿到对应的userWork
            const userWork = this.workPool[workId];
            // 不存在说明任务被取消了
            if (!userWork) {
                return;
            }
            // 修改线程池数据结构
            this.endWork(userWork);

            // 修改线程数据结构
            thread.setLastWorkTime(Date.now());
            
            // 还有任务则通知子线程处理，否则修改子线程状态为空闲
            if (this.queue.length) {
                // 从任务队列拿到一个任务交给子线程
                this.submitWorkToThread(thread, this.queue.shift());
            } else {
                thread.setState(THREAD_STATE.IDLE);
            }
           
            switch(event) {
                case 'done':
                    // 通知用户，任务完成
                    userWork.emit('done', data);
                    break;
                case 'error':
                    // 通知用户，任务出错
                    if (EventEmitter.listenerCount(userWork, 'error')) {
                        userWork.emit('error', error);
                    }
                    break;
                default: break;
            }
        });
        worker.on('error', (...rest) => {
            console.error(...rest);
        });
        return thread;
    }
    // 选择处理任务的线程
    selectThead() {
        // 找出空闲的线程，把任务交给他
        for (let i = 0; i < this.workerQueue.length; i++) {
            if (this.workerQueue[i].state === THREAD_STATE.IDLE) {
                return this.workerQueue[i];
            }
        }
        // 没有空闲的则随机选择一个
        return this.workerQueue[~~(Math.random() * this.workerQueue.length)];
    }
    // 生成任务id
    generateWorkId() {
        return ++this.workId % Number.MAX_SAFE_INTEGER;
    }
    // 给线程池提交一个任务
    submit(filename, options = {}) {
        return new Promise(async (resolve, reject) => {
            let thread;
            // 没有线程则创建一个
            if (this.workerQueue.length) {
                thread = this.selectThead();
                // 该线程还有任务需要处理
                if (thread.state === THREAD_STATE.BUSY) {
                    // 子线程个数还没有达到核心线程数，则新建线程处理
                    if (this.workerQueue.length < this.coreThreads) {
                        thread = this.newThread();
                    } else if (this.totalWork + 1 > this.maxWork){
                        // 总任务数已达到阈值，还没有达到线程数阈值，则创建
                        if(this.workerQueue.length < this.maxThreads) {
                            thread = this.newThread();
                        } else {
                            // 处理溢出的任务
                            switch(this.discardPolicy) {
                                case DISCARD_POLICY.ABORT: 
                                    return reject(new Error('queue overflow'));
                                case DISCARD_POLICY.CALLER_RUN:
                                    const workId = this.generateWorkId();
                                    const userWork =  new UserWork({workId}); 
                                    userWork.setState(WORK_STATE.RUNNING);
                                    userWork.terminate = () => {
                                        userWork.setState(WORK_STATE.CANCELED);
                                    };
                                    this.timeout && userWork.setTimeout(this.timeout);
                                    resolve(userWork);
                                    try {
                                        let aFunction;
                                        if (isJSFile(filename)) {
                                            aFunction = require(filename);
                                            if (typeof aFunction.default === 'function') {
                                                aFunction = aFunction.default;
                                            }
                                        } else if (isMJSFile(filename)) {
                                            const { default: entry } = await import(filename);
                                            aFunction = entry;
                                        } else {
                                            aFunction = vm.runInThisContext(`(${filename})`);
                                        }
                                        if (!isFunction(aFunction)) {
                                            throw new Error('work type error: js file or string');
                                        }
                                        const result = await aFunction(options);
                                        // 延迟通知，让用户有机会取消或者注册事件
                                        setImmediate(() => {
                                            if (userWork.state !== WORK_STATE.CANCELED) {
                                                userWork.setState(WORK_STATE.END);
                                                userWork.emit('done', result);
                                            }
                                        });
                                    } catch (error) {
                                        setImmediate(() => {
                                            if (userWork.state !== WORK_STATE.CANCELED) {
                                                userWork.setState(WORK_STATE.END);
                                                userWork.emit('error', error.toString());
                                            }
                                        });
                                    }
                                    return;
                                case DISCARD_POLICY.OLDEST_DISCARD: 
                                    const work = this.queue.shift();
                                    // maxWork为1时，work会为空
                                    if (work && this.workPool[work.workId]) {
                                        this.cancelWork(this.workPool[work.workId]);
                                    } else {
                                        return reject(new Error('no work can be discarded'));
                                    }
                                    break;
                                case DISCARD_POLICY.DISCARD:
                                    return reject(new Error('discard'));
                                case DISCARD_POLICY.NOT_DISCARD:
                                    break;
                                default: 
                                    break;
                            }
                        }
                    }
                }
            } else {
                thread = this.newThread();
            }
            // 生成一个任务id
            const workId = this.generateWorkId();

            // 新建一个UserWork
            const userWork =  new UserWork({workId}); 
            this.timeout && userWork.setTimeout(this.timeout);

            // 新建一个work
            const work = new Work({ workId, filename, options });
            
            // 修改线程池数据结构，把UserWork和Work关联起来
            this.addWork(userWork);
            
            // 选中的线程正在处理任务，则先缓存到任务队列
            if (thread.state === THREAD_STATE.BUSY) {
                this.queue.push(work);
                userWork.terminate = () => {
                    this.cancelWork(userWork);
                    this.queue = this.queue.filter((node) => {
                        return node.workId !== work.workId;
                    });
                }
            } else {
                this.submitWorkToThread(thread, work);
            }
            
            resolve(userWork);
        })
    }

    submitWorkToThread(thread, work) {
        const userWork = this.workPool[work.workId];
        userWork.setState(WORK_STATE.RUNNING);
        // 否则交给线程处理，并修改状态和记录该线程当前处理的任务id
        thread.setState(THREAD_STATE.BUSY);
        thread.worker.postMessage(work);
        userWork.terminate = () => {
            this.cancelWork(userWork);
            thread.setState(THREAD_STATE.DEAD);
            thread.worker.terminate();
        }
    }

    addWork(userWork) {
        userWork.setState(WORK_STATE.PENDDING);
        this.workPool[userWork.workId] = userWork;
        this.totalWork++;
    }

    endWork(userWork) {
        delete this.workPool[userWork.workId];
        this.totalWork--;
        userWork.setState(WORK_STATE.END);
        userWork.clearTimeout(); 
    }

    cancelWork(userWork) {
        delete this.workPool[userWork.workId];
        this.totalWork--;
        userWork.setState(WORK_STATE.CANCELED);
        userWork.emit('cancel');
    }
}

class CPUThreadPool extends ThreadPool {
    constructor(options) {
        super({...options, coreThreads: cores, expansion: false});
    }
}

class SingleThreadPool extends ThreadPool {
    constructor(options) {
        super({...options, coreThreads: 1, expansion: false });
    }
}

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
