// 丢弃策略
const DISCARD_POLICY = {
    // 报错
    ABORT: 1,
    // 在主线程里执行
    CALLER_RUN: 2,
    // 丢弃最老的的任务
    OLDEST_DISCARD: 3,
    // 丢弃
    DISCARD: 4,
    // 不丢弃
    NOT_DISCARD: 5,
};
// 线程状态
const THREAD_STATE = {
    IDLE: 0,
    BUSY: 1,
    DEAD: 2,
};

// 任务状态
const WORK_STATE = {
    PENDDING: 0,
    RUNNING: 1,
    END: 2,
    CANCELED: 3,
};

module.exports = {
    DISCARD_POLICY,
    THREAD_STATE,
    WORK_STATE,
};