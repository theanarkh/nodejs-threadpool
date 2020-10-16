// 任务类，一个任务对应一个id
class Work {
    constructor({workId, filename, options}) {
        // 任务id
        this.workId = workId;
        // 任务逻辑，字符串或者js文件路径
        this.filename = filename;
        // 任务返回的结果
        this.data = null;
        // 任务返回的错误
        this.error = null;
        // 执行任务时传入的参数，用户定义
        this.options = options;
    }
}

exports.Work = Work;