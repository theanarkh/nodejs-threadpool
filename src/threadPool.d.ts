/// <reference types="node" />
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { Work } from './work';
interface IPropsOptions {
    workId: number;
}
declare class UserWork extends EventEmitter {
    workId: number;
    timer: any;
    state: number;
    terminate?: () => void;
    constructor({ workId }: IPropsOptions);
    setTimeout(timeout: number): void;
    clearTimeout(): void;
    cancel(): boolean;
    setState(state: number): void;
}
interface IThreadOptions {
    worker: Worker;
}
declare class Thread {
    worker: Worker;
    threadId: number;
    state: number;
    lastWorkTime: number;
    constructor({ worker }: IThreadOptions);
    setState(state: number): void;
    setLastWorkTime(time: number): void;
}
interface IThreadPoolOptions {
    coreThreads?: number;
    maxThreads?: number;
    discardPolicy?: number;
    preCreate?: boolean;
    timeout?: number;
    maxIdleTime?: number;
    maxWork?: number;
    expansion?: boolean;
}
export declare class ThreadPool {
    options: IThreadPoolOptions;
    workerQueue: Thread[];
    coreThreads: number;
    maxThreads: number;
    discardPolicy: number;
    preCreate: boolean;
    maxIdleTime: number;
    workPool: {
        [props: number]: UserWork;
    };
    workId: number;
    queue: Work[];
    totalWork: number;
    maxWork: number;
    timeout: number;
    constructor(options?: IThreadPoolOptions);
    pollIdle(): void;
    preCreateThreads(): void;
    newThread(): Thread;
    selectThead(): Thread;
    generateWorkId(): number;
    submit(filename: string, options?: {
        [props: string]: any;
    }): Promise<UserWork>;
    submitWorkToThread(thread: Thread, work: Work): void;
    addWork(userWork: UserWork): void;
    endWork(userWork: UserWork): void;
    cancelWork(userWork: UserWork): void;
}
export declare class CPUThreadPool extends ThreadPool {
    constructor(options?: IThreadPoolOptions);
}
export declare class SingleThreadPool extends ThreadPool {
    constructor(options?: IThreadPoolOptions);
}
export declare class FixedThreadPool extends ThreadPool {
    constructor(options?: IThreadPoolOptions);
}
export declare const defaultThreadPool: ThreadPool;
export declare const defaultCpuThreadPool: CPUThreadPool;
export declare const defaultFixedThreadPool: FixedThreadPool;
export declare const defaultSingleThreadPool: SingleThreadPool;
export {};
