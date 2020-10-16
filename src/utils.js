const jsFileRegexp = /\.js$/;

function isFunction(func) {
    return typeof func === 'function';
}

function isJSFile(file) {
    return jsFileRegexp.test(file);
}
module.exports = {
    isFunction,
    isJSFile,
};