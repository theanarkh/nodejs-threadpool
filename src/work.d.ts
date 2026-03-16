interface IPropsOption {
    workId: number;
    filename: string;
    options: {
        [props: string]: any;
    };
}
export declare class Work {
    workId: number;
    filename: string;
    data: any;
    error: any;
    options: any;
    constructor({ workId, filename, options }: IPropsOption);
}
export {};
